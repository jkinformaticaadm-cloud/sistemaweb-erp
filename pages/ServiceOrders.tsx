
import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { ServiceOrder, OSStatus, OSItem } from '../types';
import { 
  Plus, Search, Filter, FileText, User, Smartphone, 
  Clock, CheckCircle, X, ChevronRight, Phone, Printer, Trash2, Wrench, Package, DollarSign, ShieldCheck, MessageCircle
} from 'lucide-react';

export const ServiceOrders: React.FC = () => {
  const { serviceOrders, customers, products, services, settings, addServiceOrder, updateServiceOrder } = useData();
  
  // --- Estados ---
  const [activeTab, setActiveTab] = useState<'open' | 'finished'>('open');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('');
  
  // Estados de Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [printingOS, setPrintingOS] = useState<ServiceOrder | null>(null);
  const [editingOS, setEditingOS] = useState<ServiceOrder | null>(null);

  // --- Form State ---
  const [formData, setFormData] = useState<Partial<ServiceOrder>>({
     customerId: '',
     device: '',
     description: '',
     priority: 'Média',
     imei: '',
     serialNumber: '',
     warranty: '90 Dias',
     paymentMethod: '',
     discount: 0
  });
  
  // Items Management
  const [osItems, setOsItems] = useState<OSItem[]>([]);
  
  // Item Adding Inputs
  const [itemType, setItemType] = useState<'product' | 'service'>('service');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemQty, setItemQty] = useState('1');

  // --- Reset Form Helper ---
  const resetForm = () => {
     setFormData({
        customerId: '',
        device: '',
        description: '',
        priority: 'Média',
        imei: '',
        serialNumber: '',
        warranty: '90 Dias',
        paymentMethod: '',
        discount: 0
     });
     setOsItems([]);
     setEditingOS(null);
     setItemName('');
     setItemPrice('');
     setItemQty('1');
     setSelectedProductId('');
     setSelectedServiceId('');
  };

  // --- Open Modal for New/Edit ---
  const handleOpenModal = (os?: ServiceOrder) => {
     if (os) {
        setEditingOS(os);
        setFormData({
           ...os
        });
        setOsItems(os.items || []);
     } else {
        resetForm();
     }
     setIsModalOpen(true);
  };

  // --- Lógica de Filtragem ---
  const filteredOS = useMemo(() => {
    return serviceOrders.filter(os => {
      // 1. Filtro por Aba
      const isFinished = os.status === OSStatus.FINALIZADO || os.status === OSStatus.CONCLUIDO || os.status === OSStatus.CANCELADO;
      if (activeTab === 'open' && isFinished) return false;
      if (activeTab === 'finished' && !isFinished) return false;

      // 2. Filtro Extra
      if (selectedStatusFilter && os.status !== selectedStatusFilter) return false;

      // 3. Busca
      if (searchTerm) {
         const term = searchTerm.toLowerCase();
         const client = customers.find(c => c.id === os.customerId);
         const phone = client?.phone || '';
         const phoneClean = phone.replace(/\D/g, '');

         return os.id.toLowerCase().includes(term) || 
                os.customerName.toLowerCase().includes(term) ||
                phone.includes(term) || phoneClean.includes(term) ||
                os.device.toLowerCase().includes(term) ||
                (os.imei && os.imei.includes(term));
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [serviceOrders, activeTab, searchTerm, selectedStatusFilter, customers]);

  // --- Cálculos Financeiros ---
  const subtotal = useMemo(() => osItems.reduce((acc, item) => acc + item.total, 0), [osItems]);
  const totalFinal = Math.max(0, subtotal - (Number(formData.discount) || 0));

  // --- Manipulação de Itens ---
  const handleAddItem = () => {
     let name = itemName;
     let price = parseFloat(itemPrice);
     const qty = parseInt(itemQty);

     // Validação e Obtenção de Nome Baseado no Catálogo
     if (itemType === 'product') {
        const prod = products.find(p => p.id === selectedProductId);
        if (prod) {
           name = prod.name;
           // Nota: Usamos o 'price' do input (itemPrice) para permitir edição/desconto na hora
        } else {
           return alert("Selecione um produto.");
        }
     } else {
        const serv = services.find(s => s.id === selectedServiceId);
        if (serv) {
            name = serv.name;
        } else {
            return alert("Selecione um serviço.");
        }
     }

     if (isNaN(price) || price < 0 || isNaN(qty) || qty <= 0) return alert("Valores inválidos.");

     const newItem: OSItem = {
        id: itemType === 'product' ? selectedProductId : (selectedServiceId || `SVC-${Date.now()}`),
        name: name,
        quantity: qty,
        unitPrice: price,
        total: price * qty,
        type: itemType
     };

     setOsItems([...osItems, newItem]);
     
     // Reset inputs
     setItemName('');
     setItemPrice('');
     setItemQty('1');
     setSelectedProductId('');
     setSelectedServiceId('');
  };

  const handleRemoveItem = (index: number) => {
     const newItems = [...osItems];
     newItems.splice(index, 1);
     setOsItems(newItems);
  };

  // --- Salvar OS ---
  const handleSaveOS = (e: React.FormEvent) => {
     e.preventDefault();
     const client = customers.find(c => c.id === formData.customerId);
     if (!client) return alert('Selecione um cliente.');

     const osData: ServiceOrder = {
        id: editingOS ? editingOS.id : `OS-${Date.now().toString().slice(-4)}`,
        customerId: client.id,
        customerName: client.name,
        device: formData.device || 'Dispositivo',
        description: formData.description || '',
        imei: formData.imei,
        serialNumber: formData.serialNumber,
        warranty: formData.warranty,
        priority: formData.priority as any,
        status: editingOS ? editingOS.status : OSStatus.PENDENTE,
        createdAt: editingOS ? editingOS.createdAt : new Date().toISOString(),
        totalValue: totalFinal,
        discount: Number(formData.discount) || 0,
        paymentMethod: formData.paymentMethod,
        items: osItems
     };

     if (editingOS) {
        updateServiceOrder(editingOS.id, osData);
     } else {
        addServiceOrder(osData);
     }

     setIsModalOpen(false);
     resetForm();
  };

  // --- Enviar WhatsApp ---
  const handleSendWhatsApp = (os: ServiceOrder) => {
      const client = customers.find(c => c.id === os.customerId);
      if (!client) return alert('Cliente não encontrado.');
      
      const phone = client.phone.replace(/\D/g, '');
      if (!phone) return alert('Cliente sem telefone cadastrado.');

      const message = `Olá *${client.name}*, aqui é da *${settings.companyName}*.\n\n` +
                      `📄 *Atualização da Ordem de Serviço #${os.id}*\n` +
                      `📱 Aparelho: ${os.device}\n` +
                      `🛠️ Status: *${os.status}*\n` +
                      `💰 Valor Total: R$ ${os.totalValue.toFixed(2)}\n\n` +
                      `Qualquer dúvida, estamos à disposição!`;
      
      // Assume BR (55) se não tiver código do país
      const fullPhone = phone.length <= 11 ? `55${phone}` : phone;
      
      window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // --- Componente de Impressão ---
  const OSPrintModal = () => {
    if (!printingOS) return null;
    const client = customers.find(c => c.id === printingOS.customerId);

    return (
       <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 overflow-y-auto print:p-0 print:bg-white print:overflow-visible">
          <div className="bg-white w-full max-w-4xl shadow-2xl flex flex-col print:shadow-none print:w-full print:max-w-none print:h-auto">
              
              {/* Toolbar */}
              <div className="bg-gray-800 text-white p-4 flex justify-between items-center print:hidden sticky top-0 z-10">
                 <h2 className="font-bold flex items-center gap-2"><Printer size={20}/> Visualizar Impressão</h2>
                 <div className="flex gap-4">
                    <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded font-bold transition-colors">Imprimir</button>
                    <button onClick={() => setPrintingOS(null)} className="hover:text-gray-300"><X size={24}/></button>
                 </div>
              </div>

              {/* Folha A4 */}
              <div className="p-10 font-sans text-gray-800 print:p-0">
                 
                 {/* Cabeçalho */}
                 <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-6">
                    <div className="flex items-center gap-4">
                       <div className="w-16 h-16 bg-white border border-gray-200 flex items-center justify-center rounded-lg font-bold text-2xl print:border-black">
                          {settings.logo ? <img src={settings.logo} className="w-full h-full object-contain p-1" /> : "RTJK"}
                       </div>
                       <div>
                          <h1 className="text-2xl font-bold uppercase">{settings.companyName}</h1>
                          <p className="text-sm">CNPJ: {settings.cnpj}</p>
                          <p className="text-sm">{settings.address}</p>
                          <p className="text-sm">Tel: {settings.phone}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <h2 className="text-3xl font-bold text-gray-800">ORDEM DE SERVIÇO</h2>
                       <p className="text-xl font-mono text-gray-600 mt-1">#{printingOS.id}</p>
                       <p className="text-sm text-gray-500 mt-2">Emissão: {new Date(printingOS.createdAt).toLocaleDateString()} {new Date(printingOS.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                       <div className="mt-2 inline-block px-3 py-1 border border-black rounded uppercase font-bold text-xs">
                          {printingOS.status}
                       </div>
                    </div>
                 </div>

                 {/* Dados Cliente e Aparelho (Grid) */}
                 <div className="grid grid-cols-2 gap-6 mb-6">
                     <div className="border border-gray-300 rounded p-4 print:border-black">
                        <h3 className="font-bold border-b border-gray-300 pb-1 mb-2 uppercase text-sm print:border-black">Dados do Cliente</h3>
                        <p className="text-sm"><span className="font-bold">Nome:</span> {client?.name || printingOS.customerName}</p>
                        <p className="text-sm"><span className="font-bold">Tel:</span> {client?.phone}</p>
                        <p className="text-sm"><span className="font-bold">End:</span> {client?.address}, {client?.addressNumber}</p>
                     </div>
                     <div className="border border-gray-300 rounded p-4 print:border-black">
                        <h3 className="font-bold border-b border-gray-300 pb-1 mb-2 uppercase text-sm print:border-black">Dados do Aparelho</h3>
                        <p className="text-sm"><span className="font-bold">Modelo:</span> {printingOS.device}</p>
                        <div className="flex gap-4">
                           <p className="text-sm"><span className="font-bold">IMEI:</span> {printingOS.imei || 'N/A'}</p>
                           <p className="text-sm"><span className="font-bold">Serial:</span> {printingOS.serialNumber || 'N/A'}</p>
                        </div>
                        <p className="text-sm mt-1"><span className="font-bold">Defeito Relatado:</span> {printingOS.description}</p>
                     </div>
                 </div>

                 {/* Tabela de Itens */}
                 <div className="mb-6">
                    <h3 className="font-bold uppercase text-sm mb-2 pl-1">Serviços e Peças</h3>
                    <table className="w-full text-sm border-collapse border border-gray-300 print:border-black">
                       <thead className="bg-gray-100 print:bg-gray-200">
                          <tr>
                             <th className="border p-2 text-left print:border-black">Descrição</th>
                             <th className="border p-2 text-center w-20 print:border-black">Tipo</th>
                             <th className="border p-2 text-center w-16 print:border-black">Qtd</th>
                             <th className="border p-2 text-right w-24 print:border-black">Unit.</th>
                             <th className="border p-2 text-right w-24 print:border-black">Total</th>
                          </tr>
                       </thead>
                       <tbody>
                          {printingOS.items.length === 0 ? (
                             <tr><td colSpan={5} className="border p-4 text-center text-gray-500 italic print:border-black">Nenhum item lançado.</td></tr>
                          ) : printingOS.items.map((item, idx) => (
                             <tr key={idx}>
                                <td className="border p-2 print:border-black">{item.name}</td>
                                <td className="border p-2 text-center uppercase text-xs print:border-black">{item.type === 'product' ? 'Peça' : 'Serviço'}</td>
                                <td className="border p-2 text-center print:border-black">{item.quantity}</td>
                                <td className="border p-2 text-right print:border-black">R$ {item.unitPrice.toFixed(2)}</td>
                                <td className="border p-2 text-right print:border-black">R$ {item.total.toFixed(2)}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>

                 {/* Totais e Garantia */}
                 <div className="flex gap-6 mb-12">
                     <div className="flex-1 border border-gray-300 rounded p-4 print:border-black">
                        <h3 className="font-bold uppercase text-xs mb-2 flex items-center gap-1"><ShieldCheck size={14}/> Termos de Garantia</h3>
                        <p className="text-sm font-bold mb-1">Prazo: {printingOS.warranty}</p>
                        <p className="text-[10px] text-justify leading-tight text-gray-600 print:text-black">
                           A garantia cobre defeitos de fabricação das peças substituídas ou falhas no serviço executado. 
                           A garantia é anulada em caso de mau uso, quedas, contato com líquidos, violação do selo ou intervenção de terceiros.
                           O aparelho não retirado em até 90 dias será considerado abandonado.
                        </p>
                     </div>
                     <div className="w-1/3 border border-gray-300 rounded overflow-hidden print:border-black">
                        <div className="bg-gray-100 p-2 font-bold uppercase text-center text-sm border-b border-gray-300 print:border-black print:bg-gray-200">Resumo Financeiro</div>
                        <div className="p-3 space-y-1">
                           <div className="flex justify-between text-sm">
                              <span>Subtotal:</span>
                              <span>R$ {printingOS.items.reduce((a, b) => a + b.total, 0).toFixed(2)}</span>
                           </div>
                           <div className="flex justify-between text-sm text-red-600 print:text-black">
                              <span>Desconto:</span>
                              <span>- R$ {(printingOS.discount || 0).toFixed(2)}</span>
                           </div>
                           <div className="flex justify-between text-xl font-bold border-t border-gray-300 pt-2 mt-2 print:border-black">
                              <span>Total:</span>
                              <span>R$ {printingOS.totalValue.toFixed(2)}</span>
                           </div>
                           {printingOS.paymentMethod && (
                              <div className="text-xs text-right mt-1 italic">Pagamento: {printingOS.paymentMethod}</div>
                           )}
                        </div>
                     </div>
                 </div>

                 {/* Assinaturas */}
                 <div className="grid grid-cols-2 gap-16 mt-auto">
                    <div className="text-center">
                       <div className="border-t border-black w-3/4 mx-auto mb-2"></div>
                       <p className="text-sm font-bold uppercase">{client?.name || 'Assinatura do Cliente'}</p>
                    </div>
                    <div className="text-center">
                       <div className="border-t border-black w-3/4 mx-auto mb-2"></div>
                       <p className="text-sm font-bold uppercase">{settings.companyName} (Técnico)</p>
                    </div>
                 </div>
                 
                 <p className="text-center text-[10px] text-gray-400 mt-8 print:text-black">Documento gerado pelo Sistema RTJK Infocell em {new Date().toLocaleDateString()}</p>
              </div>
          </div>
          <style>{`
             @media print {
                body * { visibility: hidden; }
                .fixed, .fixed * { visibility: visible; }
                .fixed { position: absolute; left: 0; top: 0; width: 100%; height: auto; background: white; padding: 0; }
                /* Hide scrollbars and toolbars */
                ::-webkit-scrollbar { display: none; }
             }
          `}</style>
       </div>
    );
  };

  // Cores dos Status (Helper)
  const getStatusColor = (status: OSStatus) => {
     switch (status) {
        case OSStatus.PENDENTE: return 'bg-gray-100 text-gray-600';
        case OSStatus.EM_ANALISE: return 'bg-blue-100 text-blue-600';
        case OSStatus.APROVADO: return 'bg-purple-100 text-purple-600';
        case OSStatus.AGUARDANDO_PECAS: return 'bg-orange-100 text-orange-600';
        case OSStatus.EM_ANDAMENTO: return 'bg-yellow-100 text-yellow-700';
        case OSStatus.CONCLUIDO: return 'bg-green-100 text-green-700';
        case OSStatus.FINALIZADO: return 'bg-green-200 text-green-800';
        case OSStatus.NAO_APROVADO: return 'bg-red-100 text-red-600';
        case OSStatus.CANCELADO: return 'bg-red-100 text-red-600';
        default: return 'bg-gray-100 text-gray-600';
     }
  };

  return (
    <div className="space-y-6 animate-fade-in">
       
       {/* Cabeçalho */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div>
             <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <FileText className="text-blue-600"/> Ordens de Serviço
             </h1>
             <p className="text-sm text-gray-500">Entradas, diagnósticos e entregas técnicas.</p>
          </div>

          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
             <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg p-1.5 w-full md:w-96 relative">
                <Search size={20} className="text-gray-400 ml-2"/>
                <input 
                   type="text" 
                   placeholder="Nome, OS, IMEI ou Telefone..." 
                   className="bg-transparent outline-none text-sm w-full text-gray-700 placeholder-gray-400"
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                />
                
                <div className="relative">
                   <button 
                      onClick={() => setShowFilterMenu(!showFilterMenu)}
                      className={`p-2 rounded-md transition-colors ${selectedStatusFilter ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200 text-gray-500'}`}
                      title="Filtrar por Status"
                   >
                      <Filter size={18}/>
                   </button>
                   
                   {showFilterMenu && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden">
                         <div className="p-2 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">Filtrar Status</div>
                         <button onClick={() => { setSelectedStatusFilter(''); setShowFilterMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700">Todos</button>
                         {Object.values(OSStatus).map(status => (
                            <button 
                               key={status} 
                               onClick={() => { setSelectedStatusFilter(status); setShowFilterMenu(false); }}
                               className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700 flex justify-between items-center"
                            >
                               {status}
                               {selectedStatusFilter === status && <CheckCircle size={14} className="text-blue-600"/>}
                            </button>
                         ))}
                      </div>
                   )}
                </div>
             </div>

             <button 
                onClick={() => handleOpenModal()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-bold shadow-sm flex items-center justify-center gap-2 whitespace-nowrap transition-colors"
             >
                <Plus size={20}/> Nova OS
             </button>
          </div>
       </div>

       {/* Abas */}
       <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit border border-gray-200">
          <button 
             onClick={() => setActiveTab('open')}
             className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'open' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
             <Clock size={16}/> Em Andamento
          </button>
          <button 
             onClick={() => setActiveTab('finished')}
             className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'finished' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
             <CheckCircle size={16}/> Finalizadas
          </button>
       </div>

       {/* Listagem */}
       <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {filteredOS.length === 0 ? (
             <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                <FileText size={48} className="opacity-20 mb-4"/>
                <p>Nenhuma ordem de serviço encontrada.</p>
             </div>
          ) : (
             <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                   <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs border-b border-gray-100">
                      <tr>
                         <th className="px-6 py-4">OS / Data</th>
                         <th className="px-6 py-4">Cliente</th>
                         <th className="px-6 py-4">Aparelho / Detalhes</th>
                         <th className="px-6 py-4 text-center">Status</th>
                         <th className="px-6 py-4 text-right">Valor</th>
                         <th className="px-6 py-4 text-center">Ações</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                      {filteredOS.map(os => {
                         const client = customers.find(c => c.id === os.customerId);
                         return (
                            <tr key={os.id} className="hover:bg-blue-50/30 transition-colors group">
                               <td className="px-6 py-4 align-top">
                                  <span className="font-mono font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{os.id}</span>
                                  <div className="text-xs text-gray-400 mt-1">{new Date(os.createdAt).toLocaleDateString()}</div>
                               </td>
                               <td className="px-6 py-4 align-top">
                                  <div className="font-bold text-gray-800 flex items-center gap-2">
                                     <User size={14} className="text-gray-400"/> {os.customerName}
                                  </div>
                                  {client?.phone && (
                                     <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                        <Phone size={12}/> {client.phone}
                                     </div>
                                  )}
                               </td>
                               <td className="px-6 py-4 align-top max-w-xs">
                                  <div className="font-medium text-gray-800 flex items-center gap-2 mb-1">
                                     <Smartphone size={14} className="text-gray-400"/> {os.device}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                     {os.imei && <span className="mr-2">IMEI: {os.imei}</span>}
                                     {os.serialNumber && <span>SN: {os.serialNumber}</span>}
                                  </div>
                                  <p className="text-xs text-gray-500 line-clamp-1 mt-1 italic">"{os.description}"</p>
                               </td>
                               <td className="px-6 py-4 align-top text-center">
                                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${getStatusColor(os.status).replace('bg-', 'border-').replace('100', '200')} ${getStatusColor(os.status)}`}>
                                     {os.status}
                                  </span>
                               </td>
                               <td className="px-6 py-4 align-top text-right">
                                  {os.totalValue > 0 ? (
                                     <span className="font-bold text-gray-800">R$ {os.totalValue.toFixed(2)}</span>
                                  ) : (
                                     <span className="text-xs text-gray-400 italic">A orçar</span>
                                  )}
                               </td>
                               <td className="px-6 py-4 align-top text-center">
                                  <div className="flex justify-center gap-2">
                                     <button 
                                        onClick={() => handleSendWhatsApp(os)}
                                        className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                                        title="Enviar no WhatsApp"
                                     >
                                        <MessageCircle size={18}/>
                                     </button>
                                     <button 
                                        onClick={() => handleOpenModal(os)} 
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        title="Editar / Ver Detalhes"
                                     >
                                        <ChevronRight size={18}/>
                                     </button>
                                     <button 
                                        onClick={() => setPrintingOS(os)}
                                        className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                                        title="Imprimir"
                                     >
                                        <Printer size={18}/>
                                     </button>
                                  </div>
                               </td>
                            </tr>
                         );
                      })}
                   </tbody>
                </table>
             </div>
          )}
       </div>

       {/* --- MODAL NOVA OS / EDITAR OS --- */}
       {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
             <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in">
                
                {/* Header do Modal */}
                <div className="bg-gray-800 text-white p-4 flex justify-between items-center shrink-0">
                   <h2 className="font-bold text-lg flex items-center gap-2">
                      <Wrench size={20}/> {editingOS ? `Editar OS #${editingOS.id}` : 'Nova Ordem de Serviço'}
                   </h2>
                   <button onClick={() => setIsModalOpen(false)} className="hover:text-gray-300"><X size={20}/></button>
                </div>
                
                {/* Corpo com Scroll */}
                <form onSubmit={handleSaveOS} className="flex-1 overflow-y-auto p-6 bg-gray-50">
                   <div className="space-y-6">
                      
                      {/* Seção 1: Cliente e Aparelho */}
                      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                         <h3 className="font-bold text-gray-700 border-b pb-2 mb-4 text-sm uppercase flex items-center gap-2">
                            <User size={16}/> Dados Iniciais
                         </h3>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-1">
                               <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Cliente *</label>
                               <select 
                                  required
                                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                  value={formData.customerId}
                                  onChange={e => setFormData({...formData, customerId: e.target.value})}
                                  disabled={!!editingOS}
                               >
                                  <option value="">Selecione...</option>
                                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                               </select>
                            </div>
                            <div className="md:col-span-1">
                               <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Aparelho *</label>
                               <input 
                                  required
                                  placeholder="Ex: iPhone 11"
                                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                  value={formData.device}
                                  onChange={e => setFormData({...formData, device: e.target.value})}
                               />
                            </div>
                            <div className="md:col-span-1">
                               <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Prioridade</label>
                               <select 
                                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                  value={formData.priority}
                                  onChange={e => setFormData({...formData, priority: e.target.value as any})}
                               >
                                  <option>Baixa</option>
                                  <option>Média</option>
                                  <option>Alta</option>
                               </select>
                            </div>
                            
                            <div className="md:col-span-3 grid grid-cols-2 gap-4">
                               <div>
                                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">IMEI</label>
                                  <input 
                                     placeholder="Identificação do aparelho"
                                     className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                     value={formData.imei}
                                     onChange={e => setFormData({...formData, imei: e.target.value})}
                                  />
                               </div>
                               <div>
                                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nº Série</label>
                                  <input 
                                     placeholder="Serial Number"
                                     className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                     value={formData.serialNumber}
                                     onChange={e => setFormData({...formData, serialNumber: e.target.value})}
                                  />
                               </div>
                            </div>

                            <div className="md:col-span-3">
                               <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Relato do Defeito *</label>
                               <textarea 
                                  required
                                  placeholder="Descreva o problema..."
                                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[60px]"
                                  value={formData.description}
                                  onChange={e => setFormData({...formData, description: e.target.value})}
                               />
                            </div>
                         </div>
                      </div>

                      {/* Seção 2: Peças e Serviços */}
                      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                         <h3 className="font-bold text-gray-700 border-b pb-2 mb-4 text-sm uppercase flex items-center gap-2">
                            <Package size={16}/> Peças e Serviços
                         </h3>
                         
                         {/* Adder */}
                         <div className="flex flex-col md:flex-row gap-3 items-end mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <div className="w-full md:w-32">
                               <label className="block text-xs font-bold text-gray-500 mb-1">Tipo</label>
                               <select 
                                  className="w-full border border-gray-300 rounded p-2 text-sm"
                                  value={itemType} 
                                  onChange={e => setItemType(e.target.value as any)}
                               >
                                  <option value="service">Serviço</option>
                                  <option value="product">Peça/Produto</option>
                               </select>
                            </div>
                            
                            <div className="flex-1 w-full">
                               <label className="block text-xs font-bold text-gray-500 mb-1">Descrição / Item</label>
                               {itemType === 'product' ? (
                                  <select 
                                     className="w-full border border-gray-300 rounded p-2 text-sm"
                                     value={selectedProductId}
                                     onChange={e => {
                                        setSelectedProductId(e.target.value);
                                        const p = products.find(prod => prod.id === e.target.value);
                                        if (p) setItemPrice(p.price.toString());
                                     }}
                                  >
                                     <option value="">Selecione o Produto...</option>
                                     {products.map(p => <option key={p.id} value={p.id}>{p.name} (R$ {p.price})</option>)}
                                  </select>
                               ) : (
                                  <select
                                     className="w-full border border-gray-300 rounded p-2 text-sm"
                                     value={selectedServiceId}
                                     onChange={e => {
                                        setSelectedServiceId(e.target.value);
                                        const s = services.find(serv => serv.id === e.target.value);
                                        if (s) {
                                           setItemName(s.name);
                                           setItemPrice(s.price.toString());
                                        }
                                     }}
                                  >
                                     <option value="">Selecione o Serviço...</option>
                                     {services.map(s => <option key={s.id} value={s.id}>{s.name} (R$ {s.price})</option>)}
                                  </select>
                               )}
                            </div>

                            <div className="w-20">
                               <label className="block text-xs font-bold text-gray-500 mb-1">Qtd</label>
                               <input 
                                  type="number" className="w-full border border-gray-300 rounded p-2 text-sm text-center"
                                  value={itemQty} onChange={e => setItemQty(e.target.value)}
                               />
                            </div>

                            <div className="w-28">
                               <label className="block text-xs font-bold text-gray-500 mb-1">Valor (R$)</label>
                               <input 
                                  type="number" className="w-full border border-gray-300 rounded p-2 text-sm text-right"
                                  value={itemPrice} onChange={e => setItemPrice(e.target.value)}
                               />
                            </div>

                            <button 
                               type="button" 
                               onClick={handleAddItem}
                               className="bg-green-600 text-white p-2 rounded hover:bg-green-700"
                            >
                               <Plus size={20}/>
                            </button>
                         </div>

                         {/* Table */}
                         <div className="border border-gray-200 rounded overflow-hidden">
                            <table className="w-full text-sm text-left">
                               <thead className="bg-gray-100 text-xs font-bold text-gray-600 uppercase">
                                  <tr>
                                     <th className="p-2">Item</th>
                                     <th className="p-2 text-center">Qtd</th>
                                     <th className="p-2 text-right">Unit.</th>
                                     <th className="p-2 text-right">Total</th>
                                     <th className="p-2 w-10"></th>
                                  </tr>
                               </thead>
                               <tbody className="divide-y divide-gray-100">
                                  {osItems.map((item, idx) => (
                                     <tr key={idx}>
                                        <td className="p-2">{item.name} <span className="text-[10px] bg-gray-100 px-1 rounded border text-gray-500 ml-1 uppercase">{item.type === 'product' ? 'Peça' : 'Serv'}</span></td>
                                        <td className="p-2 text-center">{item.quantity}</td>
                                        <td className="p-2 text-right">R$ {item.unitPrice.toFixed(2)}</td>
                                        <td className="p-2 text-right font-bold">R$ {item.total.toFixed(2)}</td>
                                        <td className="p-2 text-center">
                                           <button type="button" onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                                        </td>
                                     </tr>
                                  ))}
                                  {osItems.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-gray-400 text-xs">Nenhum item adicionado.</td></tr>}
                               </tbody>
                            </table>
                         </div>
                      </div>

                      {/* Seção 3: Financeiro e Finalização */}
                      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                         <h3 className="font-bold text-gray-700 border-b pb-2 mb-4 text-sm uppercase flex items-center gap-2">
                            <DollarSign size={16}/> Fechamento
                         </h3>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                               <div>
                                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Garantia</label>
                                  <select 
                                     className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none"
                                     value={formData.warranty}
                                     onChange={e => setFormData({...formData, warranty: e.target.value})}
                                  >
                                     <option>Sem garantia</option>
                                     <option>30 Dias</option>
                                     <option>90 Dias</option>
                                     <option>1 Ano</option>
                                  </select>
                               </div>
                               <div>
                                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Forma de Pagamento</label>
                                  <select 
                                     className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none"
                                     value={formData.paymentMethod}
                                     onChange={e => setFormData({...formData, paymentMethod: e.target.value})}
                                  >
                                     <option value="">Pendente / A definir</option>
                                     <option>Dinheiro</option>
                                     <option>Pix</option>
                                     <option>Cartão de Crédito</option>
                                     <option>Cartão de Débito</option>
                                  </select>
                               </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
                               <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Subtotal:</span>
                                  <span className="font-bold">R$ {subtotal.toFixed(2)}</span>
                               </div>
                               <div className="flex justify-between text-sm items-center">
                                  <span className="text-gray-600">Desconto (R$):</span>
                                  <input 
                                     type="number" 
                                     className="w-24 border border-gray-300 rounded p-1 text-right text-sm"
                                     value={formData.discount}
                                     onChange={e => setFormData({...formData, discount: parseFloat(e.target.value) || 0})}
                                  />
                               </div>
                               <div className="border-t border-gray-300 pt-2 mt-2 flex justify-between text-xl font-bold text-blue-700">
                                  <span>Total:</span>
                                  <span>R$ {totalFinal.toFixed(2)}</span>
                               </div>
                            </div>
                         </div>
                      </div>

                   </div>
                </form>

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
                   {editingOS && (
                      <div className="flex items-center gap-2">
                         <span className="text-sm font-bold text-gray-600">Status:</span>
                         <select 
                            className="border border-gray-300 rounded p-1 text-sm bg-white"
                            value={editingOS.status}
                            onChange={e => {
                               if (editingOS) {
                                  const updated = { ...editingOS, status: e.target.value as any };
                                  setEditingOS(updated);
                                  updateServiceOrder(updated.id, { status: updated.status });
                               }
                            }}
                         >
                            {Object.values(OSStatus).map(s => <option key={s} value={s}>{s}</option>)}
                         </select>
                      </div>
                   )}
                   <div className="flex gap-2 ml-auto">
                      <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded font-medium">Cancelar</button>
                      <button type="button" onClick={handleSaveOS} className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 shadow-sm">Salvar OS</button>
                   </div>
                </div>

             </div>
          </div>
       )}

       {/* Modal de Impressão */}
       <OSPrintModal />

    </div>
  );
};
