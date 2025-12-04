
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { ServiceOrder, OSStatus, Customer, Supply, ServiceItem, Purchase, TransactionType } from '../types';
import { 
  Plus, Search, BrainCircuit, CheckCircle, Clock, FileText, X, 
  Calendar, BarChart3, Wrench, Package, ShoppingCart, Filter, QrCode, 
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Users, AlertTriangle
} from 'lucide-react';
import { analyzeTechnicalIssue } from '../services/geminiService';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

type OSTab = 'dashboard' | 'list' | 'supplies' | 'services' | 'purchases';

export const ServiceOrders: React.FC = () => {
  const { 
    serviceOrders, customers, supplies, services, purchases, transactions, settings,
    addServiceOrder, updateServiceOrder, addSupply, addService, addPurchase 
  } = useData();
  
  const [activeTab, setActiveTab] = useState<OSTab>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  // --- Dashboard Data & Logic ---
  const dashboardStats = useMemo(() => {
    const today = new Date().toDateString();
    
    // Financials from OS (Approximation based on 'finished' or just sum of all)
    // In a real app, we would sum only paid OS. Here we sum all 'CONCLUIDO' or manually created Income transactions
    const revenue = transactions
      .filter(t => t.type === TransactionType.INCOME && t.category !== 'Vendas') // Assuming 'Vendas' is PDV, other is OS
      .reduce((acc, t) => acc + t.amount, 0);
      
    // Expenses from Purchases
    const expenses = transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((acc, t) => acc + t.amount, 0);

    const osToday = serviceOrders.filter(os => new Date(os.createdAt).toDateString() === today).length;
    
    return {
      totalClients: customers.length,
      totalSupplies: supplies.length,
      totalServices: services.length,
      totalOS: serviceOrders.length,
      revenue,
      expenses,
      osToday
    };
  }, [serviceOrders, customers, supplies, services, transactions]);

  // Simple Calendar Generation (Current Month)
  const calendarDays = useMemo(() => {
    const date = new Date();
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(date.getFullYear(), date.getMonth(), i);
      // Find OS for this day
      const osCount = serviceOrders.filter(os => new Date(os.createdAt).toDateString() === dayDate.toDateString()).length;
      days.push({ day: i, date: dayDate, osCount });
    }
    return days;
  }, [serviceOrders]);

  const monthName = new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' });


  // --- Render Components ---

  const DashboardTab = () => (
    <div className="space-y-6 animate-fade-in">
      {/* Date Filter & Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2">
           <BarChart3 className="text-gray-700" size={24}/>
           <h2 className="text-xl font-bold text-gray-800">Dashboard de Serviços</h2>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
           <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
              <span className="text-sm text-gray-600">01/{new Date().getMonth() + 1}/{new Date().getFullYear()}</span>
              <span className="text-gray-400">-</span>
              <span className="text-sm text-gray-600">{calendarDays.length}/{new Date().getMonth() + 1}/{new Date().getFullYear()}</span>
           </div>
           <button className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Limpar</button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
         {/* Left Side: Stats Cards & Calendar */}
         <div className="flex-1 space-y-6">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-green-500 border-gray-100">
                  <p className="text-sm font-bold text-green-600 mb-1">OS - Receitas</p>
                  <p className="text-2xl font-bold text-gray-800">R$ {dashboardStats.revenue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
               </div>
               <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-orange-500 border-gray-100">
                  <p className="text-sm font-bold text-orange-600 mb-1">OS - Despesas</p>
                  <p className="text-2xl font-bold text-gray-800">R$ {dashboardStats.expenses.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
               </div>
            </div>

            {/* Agenda / Calendar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
               <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <div className="flex items-center gap-4">
                     <span className="bg-gray-500 text-white px-3 py-1 rounded text-sm font-bold">Hoje</span>
                     <div className="flex items-center gap-1 text-gray-600">
                        <button className="p-1 hover:bg-gray-200 rounded"><ChevronLeft size={16}/></button>
                        <button className="p-1 hover:bg-gray-200 rounded"><ChevronRight size={16}/></button>
                     </div>
                  </div>
                  <h3 className="font-bold text-gray-700 capitalize">{monthName}</h3>
                  <div className="flex gap-1">
                     <button className="bg-gray-800 text-white px-3 py-1 rounded text-xs font-bold">Mês</button>
                     <button className="text-gray-600 px-3 py-1 rounded text-xs hover:bg-gray-200">Semana</button>
                     <button className="text-gray-600 px-3 py-1 rounded text-xs hover:bg-gray-200">Dia</button>
                  </div>
               </div>
               
               {/* Simplified Calendar Grid */}
               <div className="p-4">
                  <div className="grid grid-cols-7 gap-2 text-center text-xs text-gray-400 font-bold mb-2 uppercase">
                     <div>Dom</div><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sab</div>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                     {calendarDays.map((d) => (
                        <div key={d.day} className={`h-24 border border-gray-100 rounded-lg p-2 relative hover:bg-blue-50 transition-colors
                           ${d.date.toDateString() === new Date().toDateString() ? 'bg-yellow-50 border-yellow-200' : ''}
                        `}>
                           <span className="block text-gray-500 text-sm font-medium mb-1">{d.day}</span>
                           {d.osCount > 0 && (
                              <div className="bg-blue-600 text-white text-[10px] rounded px-1.5 py-0.5 truncate shadow-sm">
                                 {d.osCount} OS: Ver Detalhes
                              </div>
                           )}
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>

         {/* Right Side: System Stats Sidebar */}
         <div className="w-full lg:w-80 space-y-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
               <h3 className="text-gray-500 font-medium mb-4 text-sm">Estatísticas do Sistema</h3>
               <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col items-center justify-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                     <Users className="text-blue-500 mb-2" size={24}/>
                     <span className="text-2xl font-bold text-gray-800">{dashboardStats.totalClients}</span>
                     <span className="text-xs text-gray-400">Clientes</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                     <Package className="text-purple-500 mb-2" size={24}/>
                     <span className="text-2xl font-bold text-gray-800">{dashboardStats.totalSupplies}</span>
                     <span className="text-xs text-gray-400">Insumos</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                     <FileText className="text-orange-500 mb-2" size={24}/>
                     <span className="text-2xl font-bold text-gray-800">{dashboardStats.totalOS}</span>
                     <span className="text-xs text-gray-400">OS</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                     <Wrench className="text-green-500 mb-2" size={24}/>
                     <span className="text-2xl font-bold text-gray-800">{dashboardStats.totalServices}</span>
                     <span className="text-xs text-gray-400">Serviços</span>
                  </div>
               </div>

               <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white border border-gray-100 rounded-xl text-center">
                     <TrendingUp className="mx-auto text-green-500 mb-1" size={20}/>
                     <span className="block text-sm font-bold text-gray-800">0,00</span>
                     <span className="text-[10px] text-gray-400">Receita do dia</span>
                  </div>
                  <div className="p-4 bg-white border border-gray-100 rounded-xl text-center">
                     <TrendingDown className="mx-auto text-red-500 mb-1" size={20}/>
                     <span className="block text-sm font-bold text-gray-800">0,00</span>
                     <span className="text-[10px] text-gray-400">Despesas do dia</span>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );

  const OSListTab = () => {
     const [term, setTerm] = useState('');
     const filtered = serviceOrders.filter(os => 
        os.customerName.toLowerCase().includes(term.toLowerCase()) || 
        os.device.toLowerCase().includes(term.toLowerCase()) || 
        os.id.includes(term)
     );

     return (
        <div className="space-y-6 animate-fade-in">
           <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 w-full max-w-md">
                 <Search size={20} className="text-gray-400"/>
                 <input 
                    placeholder="Buscar OS..." 
                    className="flex-1 outline-none" 
                    value={term} 
                    onChange={e => setTerm(e.target.value)}
                 />
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-accent hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm"
              >
                 <Plus size={20} /> Nova OS
              </button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map(os => (
               <div key={os.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all group">
                  <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                     <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">{os.id}</span>
                     <span className={`px-2 py-1 rounded-full text-xs font-medium 
                        ${os.status === OSStatus.CONCLUIDO ? 'bg-green-100 text-green-800' : 
                          os.status === OSStatus.PENDENTE ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                        {os.status}
                     </span>
                  </div>
                  <h3 className="font-bold text-lg text-gray-800 mb-1">{os.device}</h3>
                  <p className="text-gray-600 text-sm mb-4 flex items-center gap-1"><Users size={14}/> {os.customerName}</p>
                  
                  <div className="bg-gray-50 p-3 rounded-lg mb-4 border border-gray-100">
                     <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 font-bold">Problema Relatado</p>
                     <p className="text-sm text-gray-700 line-clamp-2">{os.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                     <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={14}/> {new Date(os.createdAt).toLocaleDateString()}
                     </div>
                     <div className="flex gap-2">
                        {os.status !== OSStatus.CONCLUIDO && (
                           <button onClick={() => updateServiceOrder(os.id, {status: OSStatus.CONCLUIDO})} className="text-green-600 bg-green-50 hover:bg-green-100 p-1.5 rounded-lg transition-colors" title="Concluir">
                              <CheckCircle size={18} />
                           </button>
                        )}
                        <button className="text-blue-600 bg-blue-50 hover:bg-blue-100 p-1.5 rounded-lg transition-colors" title="Ver Detalhes / PIX">
                           <QrCode size={18} />
                        </button>
                     </div>
                  </div>
                  </div>
               </div>
            ))}
           </div>
        </div>
     );
  };

  const PurchasesTab = () => {
    return (
      <div className="space-y-6 animate-fade-in">
         <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div>
               <h2 className="text-xl font-bold text-gray-800">Gestão de Compras</h2>
               <p className="text-sm text-gray-500">Registre compra de insumos para alimentar o estoque e financeiro</p>
            </div>
            <button 
               onClick={() => setIsPurchaseModalOpen(true)}
               className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 shadow-sm font-medium"
            >
               <ShoppingCart size={20} /> Nova Compra
            </button>
         </div>

         <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left text-sm">
               <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs">
                  <tr>
                     <th className="px-6 py-4">Data</th>
                     <th className="px-6 py-4">Insumo</th>
                     <th className="px-6 py-4">Fornecedor</th>
                     <th className="px-6 py-4 text-center">Qtd</th>
                     <th className="px-6 py-4 text-right">Custo Total</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {purchases.length === 0 ? (
                     <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhuma compra registrada</td></tr>
                  ) : (
                     purchases.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50">
                           <td className="px-6 py-4">{new Date(p.date).toLocaleDateString()}</td>
                           <td className="px-6 py-4 font-medium text-gray-800">{p.supplyName}</td>
                           <td className="px-6 py-4">{p.supplier}</td>
                           <td className="px-6 py-4 text-center">{p.quantity}</td>
                           <td className="px-6 py-4 text-right font-bold text-red-600">- R$ {p.totalCost.toFixed(2)}</td>
                        </tr>
                     ))
                  )}
               </tbody>
            </table>
         </div>
      </div>
    );
  };

  // --- Modals ---

  const NewOSModal = () => {
     // State for form
     const [formData, setFormData] = useState({
        customerId: '',
        device: '',
        description: '',
        priority: 'Média' as const,
        pixKey: settings.pixKey
     });
     const [isAnalyzing, setIsAnalyzing] = useState(false);
     const [aiResult, setAiResult] = useState('');

     const handleAI = async () => {
        if (!formData.device || !formData.description) return;
        setIsAnalyzing(true);
        const res = await analyzeTechnicalIssue(formData.device, formData.description);
        setAiResult(res);
        setIsAnalyzing(false);
     };

     const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const customer = customers.find(c => c.id === formData.customerId);
        if (!customer) return;

        addServiceOrder({
           id: `OS-${Date.now().toString().slice(-4)}`,
           customerId: customer.id,
           customerName: customer.name,
           device: formData.device,
           description: formData.description,
           status: OSStatus.PENDENTE,
           priority: formData.priority,
           createdAt: new Date().toISOString(),
           totalValue: 0,
           aiDiagnosis: aiResult,
           pixKey: formData.pixKey
        });
        setIsModalOpen(false);
     };

     return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
         <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
               <h2 className="text-xl font-bold text-gray-800">Nova Ordem de Serviço</h2>
               <button onClick={() => setIsModalOpen(false)}><X className="text-gray-400 hover:text-gray-600"/></button>
            </div>
            <form onSubmit={submit} className="p-6 space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="label">Cliente</label>
                     <select required className="input" value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value})}>
                        <option value="">Selecione...</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                     </select>
                  </div>
                  <div>
                     <label className="label">Prioridade</label>
                     <select className="input" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})}>
                        <option>Baixa</option><option>Média</option><option>Alta</option>
                     </select>
                  </div>
               </div>
               <div>
                  <label className="label">Aparelho</label>
                  <input required className="input" placeholder="Ex: iPhone 11" value={formData.device} onChange={e => setFormData({...formData, device: e.target.value})}/>
               </div>
               <div>
                  <label className="label">Descrição do Problema</label>
                  <textarea required className="input" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}/>
               </div>

               {/* AI Section */}
               <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-sm font-bold text-indigo-900 flex items-center gap-2"><BrainCircuit size={16}/> Diagnóstico IA</span>
                     <button type="button" onClick={handleAI} disabled={isAnalyzing} className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 disabled:opacity-50">
                        {isAnalyzing ? '...' : 'Gerar'}
                     </button>
                  </div>
                  {aiResult && <p className="text-xs text-indigo-800 whitespace-pre-wrap">{aiResult}</p>}
               </div>

               {/* PIX Section */}
               <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-center">
                     <span className="text-sm font-bold text-gray-700 flex items-center gap-2"><QrCode size={16}/> Chave PIX (Para Pagamento)</span>
                     <input className="text-xs border p-1 rounded w-1/2" value={formData.pixKey} onChange={e => setFormData({...formData, pixKey: e.target.value})} placeholder="Chave PIX"/>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">O QR Code será gerado automaticamente na impressão da OS.</div>
               </div>

               <div className="flex justify-end pt-4">
                  <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700">Salvar OS</button>
               </div>
            </form>
         </div>
      </div>
     );
  };

  const NewPurchaseModal = () => {
     const [supplyId, setSupplyId] = useState('');
     const [qty, setQty] = useState('');
     const [cost, setCost] = useState('');
     const [supplier, setSupplier] = useState('');

     const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const supply = supplies.find(s => s.id === supplyId);
        if (!supply) return;

        addPurchase({
           id: Date.now().toString(),
           supplyId,
           supplyName: supply.name,
           quantity: Number(qty),
           totalCost: Number(cost),
           supplier,
           date: new Date().toISOString()
        });
        setIsPurchaseModalOpen(false);
     };

     return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-xl w-full max-w-md p-6">
              <h2 className="text-lg font-bold mb-4">Registrar Compra</h2>
              <form onSubmit={submit} className="space-y-4">
                 <div>
                    <label className="label">Insumo</label>
                    <select required className="input" value={supplyId} onChange={e => setSupplyId(e.target.value)}>
                       <option value="">Selecione...</option>
                       {supplies.map(s => <option key={s.id} value={s.id}>{s.name} (Atual: {s.stock})</option>)}
                    </select>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="label">Quantidade</label>
                       <input required type="number" className="input" value={qty} onChange={e => setQty(e.target.value)}/>
                    </div>
                    <div>
                       <label className="label">Custo Total (R$)</label>
                       <input required type="number" className="input" value={cost} onChange={e => setCost(e.target.value)}/>
                    </div>
                 </div>
                 <div>
                    <label className="label">Fornecedor</label>
                    <input required className="input" value={supplier} onChange={e => setSupplier(e.target.value)}/>
                 </div>
                 <div className="flex justify-end gap-2 mt-4">
                    <button type="button" onClick={() => setIsPurchaseModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                    <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium">Registrar</button>
                 </div>
              </form>
           </div>
        </div>
     );
  };

  // --- Main Render ---
  return (
    <div className="space-y-6">
       {/* Top Navigation Tabs */}
       <div className="flex overflow-x-auto gap-2 pb-2 border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors flex items-center gap-2
            ${activeTab === 'dashboard' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
             <BarChart3 size={16}/> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('list')} 
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors flex items-center gap-2
            ${activeTab === 'list' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
             <FileText size={16}/> Gerenciar OS
          </button>
          <button 
            onClick={() => setActiveTab('supplies')} 
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors flex items-center gap-2
            ${activeTab === 'supplies' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
             <Package size={16}/> Insumos
          </button>
          <button 
            onClick={() => setActiveTab('services')} 
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors flex items-center gap-2
            ${activeTab === 'services' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
             <Wrench size={16}/> Serviços
          </button>
          <button 
            onClick={() => setActiveTab('purchases')} 
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors flex items-center gap-2
            ${activeTab === 'purchases' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
             <ShoppingCart size={16}/> Compras
          </button>
       </div>

       {/* Tab Content */}
       <div className="min-h-[500px]">
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'list' && <OSListTab />}
          {activeTab === 'purchases' && <PurchasesTab />}
          {activeTab === 'supplies' && (
             <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-fade-in">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Cadastro de Insumos</h2>
                {/* Simplified List for demo */}
                <ul className="divide-y divide-gray-100">
                   {supplies.map(s => (
                      <li key={s.id} className="py-3 flex justify-between items-center">
                         <div>
                            <p className="font-bold text-gray-800">{s.name}</p>
                            <p className="text-xs text-gray-500">{s.stock} {s.unit} disponíveis</p>
                         </div>
                         <span className="font-medium text-gray-600">R$ {s.cost.toFixed(2)}</span>
                      </li>
                   ))}
                </ul>
                <button 
                  onClick={() => {
                     const name = prompt('Nome do Insumo:');
                     if(name) addSupply({id: Date.now().toString(), name, unit: 'un', cost: 0, stock: 0, minStock: 5});
                  }}
                  className="mt-4 w-full border-2 border-dashed border-gray-300 rounded-lg p-3 text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors font-bold"
                >
                   + Adicionar Insumo
                </button>
             </div>
          )}
          {activeTab === 'services' && (
             <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-fade-in">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Cadastro de Serviços</h2>
                <ul className="divide-y divide-gray-100">
                   {services.map(s => (
                      <li key={s.id} className="py-3 flex justify-between items-center">
                         <div>
                            <p className="font-bold text-gray-800">{s.name}</p>
                            <p className="text-xs text-gray-500">{s.description}</p>
                         </div>
                         <span className="font-medium text-green-600">R$ {s.price.toFixed(2)}</span>
                      </li>
                   ))}
                </ul>
                <button 
                   onClick={() => {
                      const name = prompt('Nome do Serviço:');
                      const price = Number(prompt('Preço Padrão:'));
                      if(name) addService({id: Date.now().toString(), name, price: price || 0, description: 'Serviço padrão'});
                   }}
                   className="mt-4 w-full border-2 border-dashed border-gray-300 rounded-lg p-3 text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors font-bold"
                >
                   + Adicionar Serviço
                </button>
             </div>
          )}
       </div>

       {/* Floating Modals */}
       {isModalOpen && <NewOSModal />}
       {isPurchaseModalOpen && <NewPurchaseModal />}
       
       <style>{`
          .label { @apply block text-sm font-bold text-gray-700 mb-1; }
          .input { @apply w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white; }
       `}</style>
    </div>
  );
};
