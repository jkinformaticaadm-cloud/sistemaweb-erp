
// ... (imports remain the same)
import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { ServiceOrder, OSStatus, Customer, Supply, ServiceItem, Purchase, TransactionType, OSItem } from '../types';
import { 
  Plus, Search, BrainCircuit, CheckCircle, Clock, FileText, X, 
  Calendar, BarChart3, Wrench, Package, ShoppingCart, Filter, QrCode, 
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Users, AlertTriangle, Printer, Smartphone, User, Trash2, Lock, Grid3X3, Edit, DollarSign, Download, PenTool, ShieldCheck, Shield
} from 'lucide-react';
import { analyzeTechnicalIssue } from '../services/geminiService';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useSearchParams } from 'react-router-dom';

type OSTab = 'dashboard' | 'list' | 'supplies' | 'services' | 'purchases';

// Helper Component for Pattern Lock Display/Input
const PatternLock = ({ 
   value = '', 
   onChange, 
   readOnly = false,
   size = 120 
}: { 
   value?: string, 
   onChange?: (val: string) => void, 
   readOnly?: boolean,
   size?: number
}) => {
   // ... (same as original file)
   const [points, setPoints] = useState<number[]>([]);

   useEffect(() => {
      if (value) {
         setPoints(value.split(',').map(Number));
      } else {
         setPoints([]);
      }
   }, [value]);

   const handlePointClick = (index: number) => {
      if (readOnly || !onChange) return;
      
      const existingIndex = points.indexOf(index);
      let newPoints = [...points];

      if (existingIndex !== -1) {
         // If clicking the last point, remove it (undo)
         if (existingIndex === points.length - 1) {
            newPoints.pop();
         } else {
            // Reset if clicking middle
            newPoints = []; 
         }
      } else {
         newPoints.push(index);
      }
      
      setPoints(newPoints);
      onChange(newPoints.join(','));
   };

   // Coordinates for 3x3 grid (0-8)
   const getCoord = (index: number) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      return { x: 20 + col * 30, y: 20 + row * 30 };
   };

   // SVG Path
   const pathData = points.map((p, i) => {
      const c = getCoord(p);
      return `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`;
   }).join(' ');

   return (
      <div className="relative select-none inline-block" style={{ width: size, height: size }}>
         <svg viewBox="0 0 100 100" className={`w-full h-full bg-white rounded-lg ${!readOnly ? 'border border-gray-200' : ''}`}>
            {/* Lines */}
            <path d={pathData} stroke="#3b82f6" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            
            {/* Dots */}
            {Array.from({ length: 9 }).map((_, i) => {
               const c = getCoord(i);
               const isSelected = points.includes(i);
               const isLast = points[points.length - 1] === i;
               
               return (
                  <circle 
                     key={i} 
                     cx={c.x} 
                     cy={c.y} 
                     r={readOnly ? 4 : 6}
                     fill={isSelected ? '#3b82f6' : '#e5e7eb'}
                     stroke={isLast ? '#1d4ed8' : 'none'}
                     strokeWidth={2}
                     className={readOnly ? '' : 'cursor-pointer hover:fill-blue-400 transition-colors'}
                     onClick={() => handlePointClick(i)}
                  />
               );
            })}
         </svg>
         {!readOnly && (
            <button 
               type="button"
               onClick={() => { setPoints([]); if(onChange) onChange(''); }}
               className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-red-500 font-bold uppercase hover:underline"
            >
               Limpar
            </button>
         )}
      </div>
   );
};

export const ServiceOrders: React.FC = () => {
  const { 
    serviceOrders, customers, supplies, services, products, purchases, transactions, settings,
    addServiceOrder, updateServiceOrder, addSupply, addService, addPurchase 
  } = useData();
  
  const [activeTab, setActiveTab] = useState<OSTab>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [printingOS, setPrintingOS] = useState<ServiceOrder | null>(null);
  const [editingOS, setEditingOS] = useState<ServiceOrder | null>(null);
  
  // Finish OS Modal State
  const [finishModalOSId, setFinishModalOSId] = useState<string | null>(null);
  
  // URL Params for quick actions
  const [searchParams, setSearchParams] = useSearchParams();
  const paramCustomerId = searchParams.get('customerId');

  // ... (useEffect and Handlers remain same)
  useEffect(() => {
     if (paramCustomerId) {
        setIsModalOpen(true);
     }
  }, [paramCustomerId]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (printingOS) setPrintingOS(null);
        else if (finishModalOSId) setFinishModalOSId(null);
        else if (isPurchaseModalOpen) setIsPurchaseModalOpen(false);
        else if (isModalOpen) handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [printingOS, finishModalOSId, isPurchaseModalOpen, isModalOpen]);

  const handleCloseModal = () => {
     setIsModalOpen(false);
     setEditingOS(null);
     setSearchParams({}); 
  };

  const handlePrint = () => {
    window.print();
  };

  // --- Dashboard Data & Logic ---
  const dashboardStats = useMemo(() => {
    const today = new Date().toDateString();
    
    // Financials from OS (Approximation based on 'finished' or just sum of all)
    const revenue = transactions
      .filter(t => t.type === TransactionType.INCOME && t.category !== 'Vendas') 
      .reduce((acc, t) => acc + t.amount, 0);
      
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

  const calendarDays = useMemo(() => {
    const date = new Date();
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(date.getFullYear(), date.getMonth(), i);
      const osCount = serviceOrders.filter(os => new Date(os.createdAt).toDateString() === dayDate.toDateString()).length;
      days.push({ day: i, date: dayDate, osCount });
    }
    return days;
  }, [serviceOrders]);

  const monthName = new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  // --- Render Components ---

  const OSPrintModal = () => {
    if (!printingOS) return null;
    const client = customers.find(c => c.id === printingOS.customerId);

    return (
       <div id="os-print-modal" className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-4xl min-h-[90vh] shadow-2xl overflow-hidden flex flex-col print:shadow-none print:w-full print:h-auto print:min-h-0 print:overflow-visible">
              
              {/* Header Actions (Hidden on Print) */}
              <div className="bg-gray-800 text-white p-4 flex justify-between items-center print:hidden sticky top-0 z-10 shrink-0">
                 <h2 className="font-bold flex items-center gap-2"><Printer size={20}/> Visualização de Impressão</h2>
                 <button onClick={() => setPrintingOS(null)} className="hover:text-gray-300"><X size={24}/></button>
              </div>

              {/* Printable Content (Matches Complete Sales Style) */}
              <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-6 text-gray-800 font-sans print:p-8 print:text-xs print:overflow-visible">
                 
                 {/* Header */}
                 <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6">
                    <div className="flex items-center gap-4">
                       <div className="w-16 h-16 bg-white border border-gray-200 flex items-center justify-center rounded-lg font-bold text-2xl print:text-black print:border print:border-black print:bg-transparent overflow-hidden">
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
                       <p className="text-sm text-gray-500 mt-2">Data: {new Date(printingOS.createdAt).toLocaleDateString()}</p>
                       <p className={`text-sm font-bold uppercase mt-1 px-2 py-0.5 inline-block rounded border border-gray-400 text-gray-600`}>
                          {printingOS.status}
                       </p>
                    </div>
                 </div>

                 {/* Two Columns: Client & Device */}
                 <div className="grid grid-cols-2 gap-6">
                     {/* Client Data */}
                     <div className="border border-gray-300 rounded-lg p-4">
                        <h3 className="font-bold border-b border-gray-200 pb-2 mb-3 flex items-center gap-2 uppercase text-sm bg-gray-50 -mx-4 -mt-4 p-2 rounded-t-lg">
                           <User size={16}/> Dados do Cliente
                        </h3>
                        <div className="space-y-1 text-sm">
                           <p><span className="font-bold">Nome:</span> {client?.name || printingOS.customerName}</p>
                           <p><span className="font-bold">Telefone:</span> {client?.phone}</p>
                           <p><span className="font-bold">Endereço:</span> {client?.address}, {client?.addressNumber}</p>
                        </div>
                     </div>

                     {/* Device Data */}
                     <div className="border border-gray-300 rounded-lg p-4">
                        <h3 className="font-bold border-b border-gray-200 pb-2 mb-3 flex items-center gap-2 uppercase text-sm bg-gray-50 -mx-4 -mt-4 p-2 rounded-t-lg">
                           <Smartphone size={16}/> Dados do Aparelho
                        </h3>
                        <div className="space-y-1 text-sm">
                           <p><span className="font-bold">Modelo:</span> {printingOS.device}</p>
                           <p><span className="font-bold">IMEI:</span> {printingOS.imei || 'N/A'}</p>
                           <p><span className="font-bold">Serial:</span> {printingOS.serialNumber || 'N/A'}</p>
                           
                           {/* Password Display */}
                           <div className="mt-2 pt-2 border-t border-gray-200 flex items-start gap-4">
                              <div>
                                 <span className="font-bold block text-xs uppercase mb-1">Senha (PIN/Texto)</span>
                                 <div className="border border-gray-400 px-2 py-1 rounded bg-gray-50 min-w-[80px] text-center font-mono">
                                    {printingOS.devicePassword || 'N/A'}
                                 </div>
                              </div>
                              
                              {printingOS.patternPassword && (
                                 <div>
                                    <span className="font-bold block text-xs uppercase mb-1">Padrão</span>
                                    <div className="border border-gray-200 rounded p-1 inline-block bg-white">
                                       <PatternLock value={printingOS.patternPassword} readOnly size={60} />
                                    </div>
                                 </div>
                              )}
                           </div>
                        </div>
                     </div>
                 </div>

                 {/* Defect Description */}
                 <div className="border border-gray-300 rounded-lg p-4">
                     <h3 className="font-bold border-b border-gray-200 pb-2 mb-3 uppercase text-sm bg-gray-50 -mx-4 -mt-4 p-2 rounded-t-lg flex items-center gap-2">
                        <AlertTriangle size={16}/> Defeito Relatado / Diagnóstico
                     </h3>
                     <p className="text-sm whitespace-pre-wrap min-h-[40px]">{printingOS.description}</p>
                     {printingOS.aiDiagnosis && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                           <p className="text-xs font-bold text-gray-500">Análise Técnica:</p>
                           <p className="text-xs text-gray-600 italic">{printingOS.aiDiagnosis}</p>
                        </div>
                     )}
                 </div>

                 {/* Items Details */}
                 <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 p-2 font-bold uppercase text-sm text-center border-b border-gray-300">Serviços e Peças</div>
                    <div className="p-0">
                       <table className="w-full text-xs">
                          <thead>
                             <tr className="border-b border-gray-100 text-gray-400">
                                <th className="p-2 text-left">Item / Detalhes</th>
                                <th className="p-2 text-center">Tipo</th>
                                <th className="p-2 text-center">Qtd</th>
                                <th className="p-2 text-right">Unitário</th>
                                <th className="p-2 text-right">Total</th>
                             </tr>
                          </thead>
                          <tbody>
                             {printingOS.items.length === 0 ? (
                                <tr><td colSpan={5} className="p-4 text-center text-gray-400">Nenhum item adicionado ainda.</td></tr>
                             ) : printingOS.items.map((item, idx) => (
                                <tr key={idx} className="border-b border-gray-50 last:border-0">
                                   <td className="p-2">
                                       <span className="font-bold block">{item.name}</span>
                                       {item.details && <span className="text-[10px] text-gray-500 block mt-0.5 whitespace-pre-wrap">{item.details}</span>}
                                   </td>
                                   <td className="p-2 text-center uppercase">{item.type === 'product' ? 'Peça' : 'Serviço'}</td>
                                   <td className="p-2 text-center">{item.quantity}</td>
                                   <td className="p-2 text-right">R$ {item.unitPrice.toFixed(2)}</td>
                                   <td className="p-2 text-right">R$ {item.total.toFixed(2)}</td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </div>

                 {/* Warranty & Financials */}
                 <div className="flex flex-col md:flex-row gap-6">
                     <div className="flex-1 border border-gray-300 rounded-lg p-4">
                        <h3 className="font-bold border-b border-gray-200 pb-2 mb-3 uppercase text-sm bg-gray-50 -mx-4 -mt-4 p-2 rounded-t-lg flex items-center gap-2">
                           <ShieldCheck size={16}/> Garantia
                        </h3>
                        <p className="text-sm">Termo: <span className="font-bold">{printingOS.warranty}</span></p>
                        <p className="text-xs text-gray-500 mt-2 text-justify leading-tight">
                           A garantia cobre defeitos de fabricação das peças substituídas ou serviços realizados. Não cobre danos causados por mau uso, quedas, contato com líquidos ou oxidação.
                        </p>
                     </div>

                     <div className="w-full md:w-1/3 border border-gray-300 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 p-2 font-bold uppercase text-sm text-center border-b border-gray-300">Totalização</div>
                        <div className="p-4 space-y-2">
                           <div className="flex justify-between text-2xl font-bold pt-2 mt-2 text-gray-900 border-t border-gray-100">
                              <span>Total</span>
                              <span>R$ {printingOS.totalValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                           </div>
                        </div>
                     </div>
                 </div>

                 {/* Signature */}
                 <div className="grid grid-cols-2 gap-16 mt-12 pt-8">
                    <div className="text-center">
                       <div className="border-t border-black w-3/4 mx-auto mb-2"></div>
                       <p className="text-sm font-bold uppercase">{client?.name || 'Assinatura do Cliente'}</p>
                    </div>
                    <div className="text-center">
                       <div className="border-t border-black w-3/4 mx-auto mb-2"></div>
                       <p className="text-sm font-bold uppercase">Técnico Responsável</p>
                    </div>
                 </div>
              </div>

              {/* Footer Actions (Hidden on Print) */}
              <div className="bg-gray-100 p-4 border-t border-gray-200 flex justify-end gap-4 print:hidden shrink-0 sticky bottom-0 z-10">
                 <button onClick={() => window.print()} className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm">
                    <Download size={18}/> Baixar PDF
                 </button>
                 <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-colors">
                    <Printer size={18}/> Imprimir
                 </button>
              </div>
          </div>
       </div>
    );
  };

  // ... (Rest of component methods like NewOSModal, etc. remain unchanged)
  // Re-inserting NewOSModal for completeness of file context if needed, but for brevity assuming "..." covers existing logic
  
  const NewOSModal = () => {
     // ... (Existing implementation)
     // Form State
     const [formData, setFormData] = useState<Partial<ServiceOrder>>({
        customerId: paramCustomerId || '',
        device: '',
        imei: '',
        serialNumber: '',
        devicePassword: '',
        patternPassword: '',
        description: '',
        priority: 'Média',
        warranty: '90 Dias (Peças e Mão de Obra)',
        status: OSStatus.PENDENTE,
        items: []
     });

     // Initialize if editing
     useEffect(() => {
        if (editingOS) {
           setFormData({
              ...editingOS
           });
           setAddedItems(editingOS.items || []);
        }
     }, []);

     const [isAnalyzing, setIsAnalyzing] = useState(false);
     const [aiResult, setAiResult] = useState('');
     
     // Item Addition State
     const [addedItems, setAddedItems] = useState<OSItem[]>([]);
     
     // Product Inputs
     const [selectedProductId, setSelectedProductId] = useState('');
     const [productQty, setProductQty] = useState(1);
     const [productPrice, setProductPrice] = useState(0);

     // Service Inputs
     const [selectedServiceId, setSelectedServiceId] = useState('');
     const [serviceDescription, setServiceDescription] = useState('');
     const [servicePrice, setServicePrice] = useState(0);

     const selectedCustomer = customers.find(c => c.id === formData.customerId);
     const totalValue = addedItems.reduce((acc, item) => acc + item.total, 0);

     const handleAI = async () => {
        if (!formData.device || !formData.description) return;
        setIsAnalyzing(true);
        const res = await analyzeTechnicalIssue(formData.device, formData.description);
        setAiResult(res);
        setIsAnalyzing(false);
     };

     // Helper to add item
     const addItem = (item: OSItem) => {
        setAddedItems([...addedItems, item]);
     };

     const removeItem = (index: number) => {
        const newItems = [...addedItems];
        newItems.splice(index, 1);
        setAddedItems(newItems);
     };

     // Add Product Logic
     const handleAddProduct = () => {
        const prod = products.find(p => p.id === selectedProductId);
        if (prod) {
           addItem({
              id: prod.id,
              name: prod.name,
              quantity: productQty,
              unitPrice: productPrice,
              total: productPrice * productQty,
              type: 'product'
           });
           setSelectedProductId('');
           setProductQty(1);
           setProductPrice(0);
        }
     };

     // Add Service Logic
     const handleAddService = () => {
        const svc = services.find(s => s.id === selectedServiceId);
        const name = svc ? svc.name : serviceDescription;
        
        if (name && servicePrice > 0) {
           addItem({
              id: svc ? svc.id : `custom-${Date.now()}`,
              name: name,
              quantity: 1,
              unitPrice: servicePrice,
              total: servicePrice,
              type: 'service'
           });
           setSelectedServiceId('');
           setServiceDescription('');
           setServicePrice(0);
        }
     };

     const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const customer = customers.find(c => c.id === formData.customerId);
        if (!customer) return;

        const osData: ServiceOrder = {
           id: editingOS ? editingOS.id : `OS-${Date.now().toString().slice(-4)}`,
           customerId: customer.id,
           customerName: customer.name,
           device: formData.device || '',
           imei: formData.imei,
           serialNumber: formData.serialNumber,
           devicePassword: formData.devicePassword,
           patternPassword: formData.patternPassword,
           description: formData.description || '',
           status: formData.status || OSStatus.PENDENTE,
           priority: formData.priority as any,
           createdAt: editingOS ? editingOS.createdAt : new Date().toISOString(),
           totalValue: totalValue,
           warranty: formData.warranty,
           aiDiagnosis: aiResult || formData.aiDiagnosis,
           items: addedItems
        };

        if (editingOS) {
           updateServiceOrder(editingOS.id, osData);
        } else {
           addServiceOrder(osData);
        }
        handleCloseModal();
     };

     return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
         <div className="bg-white rounded-xl w-full max-w-5xl max-h-[95vh] overflow-y-auto flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10 shadow-sm shrink-0">
               <div>
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                     <FileText className="text-blue-600"/> {editingOS ? `Editar OS #${editingOS.id}` : 'Nova Ordem de Serviço'}
                  </h2>
                  <p className="text-sm text-gray-500">Preencha os dados abaixo para registrar a entrada do aparelho.</p>
               </div>
               <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"><X size={24}/></button>
            </div>
            
            <form onSubmit={submit} className="p-8 space-y-8 flex-1 overflow-y-auto bg-gray-50/50">
               
               {/* 1. Cliente e Status */}
               <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                     <User className="text-blue-600" size={20}/> Dados do Cliente e Status
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                     <div className="md:col-span-2">
                        <label className="label">Cliente *</label>
                        <select 
                           required 
                           className="input" 
                           value={formData.customerId} 
                           onChange={e => setFormData({...formData, customerId: e.target.value})} 
                           disabled={!!editingOS}
                        >
                           <option value="">-- Selecione o Cliente --</option>
                           {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                     </div>
                     <div className="md:col-span-1">
                        <label className="label">Prioridade</label>
                        <select 
                           className="input" 
                           value={formData.priority} 
                           onChange={e => setFormData({...formData, priority: e.target.value as any})}
                        >
                           <option>Baixa</option>
                           <option>Média</option>
                           <option>Alta</option>
                        </select>
                     </div>
                     <div className="md:col-span-1">
                        <label className="label">Status Inicial</label>
                        <select 
                           className="input" 
                           value={formData.status} 
                           onChange={e => setFormData({...formData, status: e.target.value as any})}
                        >
                           <option>{OSStatus.PENDENTE}</option>
                           <option>{OSStatus.EM_ANALISE}</option>
                           <option>{OSStatus.APROVADO}</option>
                        </select>
                     </div>
                  </div>
               </div>

               {/* 2. Dados do Aparelho */}
               <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                     <Smartphone className="text-purple-600" size={20}/> Identificação do Aparelho
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="md:col-span-1">
                        <label className="label">Aparelho / Modelo *</label>
                        <input 
                           required 
                           className="input" 
                           placeholder="Ex: iPhone 13" 
                           value={formData.device} 
                           onChange={e => setFormData({...formData, device: e.target.value})}
                        />
                     </div>
                     <div className="md:col-span-1">
                        <label className="label">IMEI (Opcional)</label>
                        <input 
                           className="input" 
                           placeholder="00000000000000" 
                           value={formData.imei} 
                           onChange={e => setFormData({...formData, imei: e.target.value})}
                        />
                     </div>
                     <div className="md:col-span-1">
                        <label className="label">Nº de Série (Opcional)</label>
                        <input 
                           className="input" 
                           placeholder="Serial Number" 
                           value={formData.serialNumber} 
                           onChange={e => setFormData({...formData, serialNumber: e.target.value})}
                        />
                     </div>
                  </div>
               </div>

               {/* 3. Segurança e Senhas */}
               <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                     <Shield className="text-red-600" size={20}/> Segurança e Acesso
                  </h3>
                  <div className="flex flex-col md:flex-row gap-8 items-start">
                     <div className="flex-1 w-full">
                        <label className="label">Senha Numérica / PIN / Texto</label>
                        <input 
                           className="input text-lg font-mono tracking-widest text-center h-14" 
                           placeholder="123456" 
                           value={formData.devicePassword} 
                           onChange={e => setFormData({...formData, devicePassword: e.target.value})}
                        />
                        <p className="text-xs text-gray-500 mt-2">Informe a senha de desbloqueio de tela se houver.</p>
                     </div>
                     
                     <div className="w-full md:w-auto flex flex-col items-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <label className="label mb-2 text-center w-full block">Senha Padrão (Desenho)</label>
                        <PatternLock size={140} value={formData.patternPassword} onChange={(val) => setFormData({...formData, patternPassword: val})} />
                     </div>
                  </div>
               </div>

               {/* 4. Diagnóstico */}
               <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                     <AlertTriangle className="text-orange-600" size={20}/> Relato do Cliente / Diagnóstico
                  </h3>
                  <div className="space-y-4">
                     <div>
                        <label className="label">Descrição do Defeito *</label>
                        <textarea 
                           required 
                           className="input min-h-[100px]" 
                           placeholder="Descreva detalhadamente o problema relatado pelo cliente..." 
                           value={formData.description} 
                           onChange={e => setFormData({...formData, description: e.target.value})}
                        />
                     </div>
                     
                     <div className="flex justify-end">
                        <button type="button" onClick={handleAI} disabled={isAnalyzing || !formData.device || !formData.description} className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors border border-blue-200 shadow-sm">
                           <BrainCircuit size={16}/> {isAnalyzing ? 'Analisando com IA...' : 'Gerar Pré-Diagnóstico com IA'}
                        </button>
                     </div>
                     
                     {(aiResult || formData.aiDiagnosis) && (
                        <div className="p-4 bg-blue-50 rounded-lg text-sm text-gray-700 border border-blue-100 animate-fade-in">
                           <strong className="text-blue-800 flex items-center gap-2 mb-2"><BrainCircuit size={14}/> Sugestão da IA:</strong>
                           <p className="leading-relaxed whitespace-pre-wrap">{aiResult || formData.aiDiagnosis}</p>
                        </div>
                     )}
                  </div>
               </div>
               
               {/* 5. Orçamento e Itens */}
               <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                     <Wrench className="text-green-600" size={20}/> Orçamento (Peças e Serviços)
                  </h3>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                     <div className="flex flex-col md:flex-row gap-4 mb-4">
                        {/* Product Add */}
                        <div className="flex-1 flex gap-2 items-end">
                           <div className="flex-1">
                              <label className="label">Adicionar Produto</label>
                              <select className="input text-sm" value={selectedProductId} onChange={e => {
                                    setSelectedProductId(e.target.value);
                                    const p = products.find(prod => prod.id === e.target.value);
                                    if (p) setProductPrice(p.price);
                                 }}>
                                 <option value="">Selecione...</option>
                                 {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                           </div>
                           <div className="w-20">
                              <label className="label">Qtd</label>
                              <input type="number" className="input text-sm" value={productQty} onChange={e => setProductQty(Number(e.target.value))}/>
                           </div>
                           <div className="w-24">
                              <label className="label">Valor</label>
                              <input type="number" className="input text-sm" value={productPrice} onChange={e => setProductPrice(Number(e.target.value))}/>
                           </div>
                           <button type="button" onClick={handleAddProduct} className="bg-gray-800 text-white hover:bg-gray-700 p-2.5 rounded-lg mb-[1px]"><Plus size={18}/></button>
                        </div>
                        
                        {/* Service Add */}
                        <div className="flex-1 flex gap-2 items-end border-l border-gray-200 pl-4">
                           <div className="flex-1">
                              <label className="label">Adicionar Serviço</label>
                              <select className="input text-sm" value={selectedServiceId} onChange={e => {
                                    setSelectedServiceId(e.target.value);
                                    const s = services.find(svc => svc.id === e.target.value);
                                    if (s) { setServicePrice(s.price); setServiceDescription(s.name); } 
                                    else { setServiceDescription(''); }
                                 }}>
                                 <option value="">Selecione...</option>
                                 {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                 <option value="custom">Outro (Manual)</option>
                              </select>
                           </div>
                           {selectedServiceId === 'custom' && (
                              <div className="flex-1">
                                 <label className="label">Descrição</label>
                                 <input className="input text-sm" value={serviceDescription} onChange={e => setServiceDescription(e.target.value)}/>
                              </div>
                           )}
                           <div className="w-24">
                              <label className="label">Valor</label>
                              <input type="number" className="input text-sm" value={servicePrice} onChange={e => setServicePrice(Number(e.target.value))}/>
                           </div>
                           <button type="button" onClick={handleAddService} className="bg-gray-800 text-white hover:bg-gray-700 p-2.5 rounded-lg mb-[1px]"><Plus size={18}/></button>
                        </div>
                     </div>
                  </div>

                  {/* Items List */}
                  {addedItems.length > 0 ? (
                     <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm text-left">
                           <thead className="bg-gray-100 text-xs font-bold text-gray-600 uppercase">
                              <tr><th className="p-3">Item</th><th className="p-3 text-center">Tipo</th><th className="p-3 text-right">Valor Total</th><th className="p-3 text-center">Ações</th></tr>
                           </thead>
                           <tbody>
                              {addedItems.map((item, idx) => (
                                 <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50">
                                    <td className="p-3 font-medium text-gray-800">{item.name} <span className="text-xs text-gray-500 font-normal ml-1">x{item.quantity}</span></td>
                                    <td className="p-3 text-center text-xs text-gray-500 uppercase bg-gray-50 mx-2 rounded">{item.type === 'product' ? 'Peça' : 'Mão de Obra'}</td>
                                    <td className="p-3 text-right font-bold text-gray-700">R$ {item.total.toFixed(2)}</td>
                                    <td className="p-3 text-center"><button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-colors"><Trash2 size={16}/></button></td>
                                 </tr>
                              ))}
                           </tbody>
                           <tfoot className="bg-gray-800 text-white">
                              <tr>
                                 <td colSpan={2} className="p-3 text-right font-bold uppercase text-xs">Valor Total Estimado:</td>
                                 <td className="p-3 text-right font-bold text-lg text-green-400">R$ {totalValue.toFixed(2)}</td>
                                 <td></td>
                              </tr>
                           </tfoot>
                        </table>
                     </div>
                  ) : (
                     <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 text-sm">
                        Nenhum item ou serviço adicionado ao orçamento.
                     </div>
                  )}

                  <div className="mt-6">
                     <label className="label">Termo de Garantia</label>
                     <select className="input" value={formData.warranty} onChange={e => setFormData({...formData, warranty: e.target.value})}>
                        <option>Sem garantia</option>
                        <option>30 Dias (Serviço)</option>
                        <option>90 Dias (Peças e Mão de Obra)</option>
                        <option>1 Ano (Fabricante)</option>
                     </select>
                  </div>
               </div>

               <div className="flex justify-end pt-4 gap-4 pb-4">
                  <button type="button" onClick={handleCloseModal} className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-200 bg-gray-100 transition-colors">Cancelar</button>
                  <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg hover:shadow-blue-900/30 flex items-center gap-2 transition-all transform active:scale-95">
                     <CheckCircle size={20}/> {editingOS ? 'Salvar Alterações' : 'Criar Ordem de Serviço'}
                  </button>
               </div>
            </form>
         </div>
         
         <style>{`
            .label { @apply block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5; }
            .input { @apply w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all text-gray-800 text-sm focus:border-blue-500; }
            
            @media print {
               body * {
                  visibility: hidden;
               }
               #os-print-modal, #os-print-modal * {
                  visibility: visible;
               }
               #os-print-modal {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  height: 100%;
                  margin: 0;
                  padding: 0;
                  background: white;
                  z-index: 9999;
                  overflow: visible !important;
               }
               #os-print-modal > div {
                  height: auto !important;
                  overflow: visible !important;
               }
            }
         `}</style>
      </div>
     );
  };

  // ... Rest of the file
  
  const NewPurchaseModal = () => {
     // ... (Existing)
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

  const FinishOSModal = () => {
     // ... (Existing)
     const [paymentMethod, setPaymentMethod] = useState('Dinheiro');
     const os = serviceOrders.find(o => o.id === finishModalOSId);

     const handleConfirm = () => {
        if (finishModalOSId) {
           updateServiceOrder(finishModalOSId, { status: OSStatus.FINALIZADO, paymentMethod });
           setFinishModalOSId(null);
        }
     };

     if (!os) return null;

     return (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-2xl">
              <h2 className="text-lg font-bold text-gray-800 mb-2">Finalizar Ordem de Serviço</h2>
              <p className="text-sm text-gray-500 mb-4">Selecione a forma de pagamento para dar baixa na OS <strong>{os.id}</strong>. O valor de <strong>R$ {os.totalValue.toFixed(2)}</strong> será lançado no caixa.</p>
              
              <div className="space-y-3 mb-6">
                 {['Dinheiro', 'Pix', 'Cartão de Crédito', 'Cartão de Débito'].map(method => (
                    <label key={method} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${paymentMethod === method ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                       <input 
                          type="radio" 
                          name="paymentMethod" 
                          value={method} 
                          checked={paymentMethod === method}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="text-green-600 focus:ring-green-500"
                       />
                       <span className={`font-medium ${paymentMethod === method ? 'text-green-800' : 'text-gray-700'}`}>{method}</span>
                    </label>
                 ))}
              </div>

              <div className="flex justify-end gap-2">
                 <button onClick={() => setFinishModalOSId(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                 <button onClick={handleConfirm} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 flex items-center gap-2">
                    <DollarSign size={16}/> Confirmar e Finalizar
                 </button>
              </div>
           </div>
        </div>
     );
  };

  const DashboardTab = () => (
    // ... (Existing)
    <div className="space-y-6 animate-fade-in">
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
            </div>
         </div>
      </div>
    </div>
  );

  const OSListTab = () => {
     // ... (Existing)
     const [term, setTerm] = useState('');
     const filtered = serviceOrders.filter(os => 
        os.customerName.toLowerCase().includes(term.toLowerCase()) || 
        os.device.toLowerCase().includes(term.toLowerCase()) || 
        os.id.includes(term)
     );

     const handleStatusChange = (id: string, newStatus: OSStatus) => {
        if (newStatus === OSStatus.FINALIZADO) {
           setFinishModalOSId(id);
           return;
        }
        updateServiceOrder(id, { status: newStatus });
     };

     return (
        <div className="space-y-6 animate-fade-in">
           {/* Search Bar & Button */}
           <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 w-full max-w-md shadow-sm">
                 <Search size={20} className="text-gray-400"/>
                 <input 
                    placeholder="Buscar por cliente, aparelho, OS..." 
                    className="flex-1 outline-none text-gray-700 bg-transparent" 
                    value={term} 
                    onChange={e => setTerm(e.target.value)}
                 />
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-accent hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm whitespace-nowrap"
              >
                 <Plus size={20} /> Nova OS
              </button>
           </div>
           
           {/* Table View */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">OS / Data</th>
                    <th className="px-6 py-4">Aparelho / Cliente</th>
                    <th className="px-6 py-4">Defeito Relatado</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Total</th>
                    <th className="px-6 py-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.length === 0 ? (
                     <tr><td colSpan={6} className="p-8 text-center text-gray-400">Nenhuma ordem de serviço encontrada.</td></tr>
                  ) : filtered.map(os => (
                    <tr key={os.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-4 align-top">
                         <span className="font-mono text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded block w-fit mb-1">{os.id}</span>
                         <div className="flex items-center gap-1 text-xs text-gray-400">
                           <Clock size={12}/> {new Date(os.createdAt).toLocaleDateString()}
                         </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                         <p className="font-bold text-gray-800 text-base">{os.device}</p>
                         <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <User size={12}/> {os.customerName}
                         </div>
                         <div className="text-xs text-gray-400 mt-0.5">
                            {os.imei ? `IMEI: ${os.imei}` : ''}
                         </div>
                      </td>
                      <td className="px-6 py-4 align-top max-w-xs">
                         <p className="text-gray-600 line-clamp-2" title={os.description}>{os.description}</p>
                      </td>
                      <td className="px-6 py-4 align-top text-center">
                         <select 
                            value={os.status}
                            onChange={(e) => handleStatusChange(os.id, e.target.value as OSStatus)}
                            disabled={os.status === OSStatus.FINALIZADO}
                            className={`text-xs font-bold uppercase py-1.5 px-2 rounded border cursor-pointer outline-none transition-colors w-full max-w-[140px]
                               ${os.status === OSStatus.FINALIZADO ? 'bg-gray-200 text-gray-500 cursor-not-allowed border-gray-300' : 
                                 os.status === OSStatus.APROVADO ? 'bg-green-100 text-green-700 border-green-200' :
                                 os.status === OSStatus.NAO_APROVADO ? 'bg-red-100 text-red-700 border-red-200' :
                                 os.status === OSStatus.AGUARDANDO_PECAS ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                 os.status === OSStatus.CONCLUIDO ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                               }`}
                         >
                            {Object.values(OSStatus).map(status => (
                               <option key={status} value={status}>{status}</option>
                            ))}
                         </select>
                      </td>
                      <td className="px-6 py-4 align-top text-right font-bold text-blue-600">
                         R$ {os.totalValue.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 align-top text-center">
                         <div className="flex justify-center gap-2">
                           <button 
                              onClick={() => { setEditingOS(os); setIsModalOpen(true); }}
                              className="text-blue-600 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors"
                              title="Editar OS"
                           >
                              <Edit size={16} />
                           </button>
                           <button 
                              onClick={() => setPrintingOS(os)}
                              className="text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition-colors" 
                              title="Imprimir OS"
                           >
                              <Printer size={16} />
                           </button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
             </div>
           </div>
        </div>
     );
  };

  const PurchasesTab = () => {
    // ... (Existing)
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

  // --- Main Render ---
  return (
    <div className="space-y-6">
       {/* Top Navigation Tabs - Hidden on Print */}
       <div className="flex overflow-x-auto gap-2 pb-2 border-b border-gray-200 print:hidden">
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

       {/* Tab Content - Hidden on Print */}
       <div className="min-h-[500px] print:hidden">
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
       {finishModalOSId && <FinishOSModal />}
       
       {/* Print Modal Overlay */}
       <OSPrintModal />
       
       <style>{`
          .label { @apply block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5; }
          .input { @apply w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all text-gray-800 text-sm focus:border-blue-500; }
       `}</style>
    </div>
  );
};
