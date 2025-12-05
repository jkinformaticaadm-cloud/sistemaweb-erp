
import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { ServiceOrder, OSStatus, Customer, Supply, ServiceItem, Purchase, TransactionType, OSItem } from '../types';
import { 
  Plus, Search, BrainCircuit, CheckCircle, Clock, FileText, X, 
  Calendar, BarChart3, Wrench, Package, ShoppingCart, Filter, QrCode, 
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Users, AlertTriangle, Printer, Smartphone, User, Trash2, Lock, Grid3X3, Edit, DollarSign, Download, PenTool
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
      <div className="relative select-none" style={{ width: size, height: size }}>
         <svg viewBox="0 0 100 100" className="w-full h-full bg-white rounded-lg border border-gray-200">
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

  useEffect(() => {
     if (paramCustomerId) {
        setIsModalOpen(true);
     }
  }, [paramCustomerId]);

  // Handle ESC key to close modals
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
     setSearchParams({}); // Clear query params to clean URL
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
    // ... (Same print component code as before, kept short for this response) ...
    if (!printingOS) return null;
    const client = customers.find(c => c.id === printingOS.customerId);
    const productItems = printingOS.items.filter(i => i.type === 'product');
    const serviceItems = printingOS.items.filter(i => i.type === 'service');

    return (
       <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 print:absolute print:inset-0 print:z-[9999] print:bg-white print:p-0 print:block print:h-auto print:overflow-visible">
          <div className="bg-white w-full max-w-4xl max-h-[95vh] shadow-2xl overflow-hidden flex flex-col print:shadow-none print:w-full print:h-auto print:min-h-0 print:overflow-visible print:max-w-none print:block print:static">
              {/* Header Actions */}
              <div className="bg-gray-800 text-white p-4 flex justify-between items-center print:hidden shrink-0">
                 <h2 className="font-bold flex items-center gap-2"><Printer size={20}/> Visualização de Impressão</h2>
                 <button onClick={() => setPrintingOS(null)} className="hover:text-gray-300"><X size={24}/></button>
              </div>
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-6 text-gray-800 font-sans print:p-4 print:space-y-3 print:text-xs print:overflow-visible print:h-auto print:block">
                 {/* Standard Header */}
                 <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 print:pb-2 print:border-b">
                    <div className="flex items-center gap-4 print:gap-2">
                       <div className="w-16 h-16 bg-gray-800 text-white flex items-center justify-center rounded-lg font-bold text-2xl print:text-black print:border print:border-black print:bg-transparent print:w-12 print:h-12 print:text-xl">TF</div>
                       <div>
                          <h1 className="text-2xl font-bold uppercase text-gray-900 print:text-black print:text-lg">{settings.companyName}</h1>
                          <p className="text-sm text-gray-700 print:text-black print:text-[10px]">CNPJ: {settings.cnpj}</p>
                          <p className="text-sm text-gray-700 print:text-black print:text-[10px]">{settings.address}</p>
                          <p className="text-sm text-gray-700 print:text-black print:text-[10px]">Tel: {settings.phone}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <h2 className="text-3xl font-bold text-gray-800 print:text-black print:text-xl">ORDEM DE SERVIÇO</h2>
                       <p className="text-xl font-mono text-gray-600 mt-1 print:text-black print:text-sm">#{printingOS.id}</p>
                       <p className="text-sm text-gray-500 mt-2 print:text-black print:text-[10px] print:mt-0">{new Date(printingOS.createdAt).toLocaleDateString()}</p>
                    </div>
                 </div>
                 {/* Content similar to previous versions ... */}
                 <div className="grid grid-cols-2 gap-8 print:gap-2">
                    <div className="border border-gray-300 rounded-lg p-4 print:p-2 print:border-black">
                       <h3 className="font-bold border-b border-gray-200 pb-2 mb-3 uppercase text-sm print:text-[10px] print:mb-1">Cliente</h3>
                       <div className="space-y-1 text-sm print:text-[10px] print:space-y-0">
                          <p><span className="font-bold">Nome:</span> {client?.name || printingOS.customerName}</p>
                          <p><span className="font-bold">Tel:</span> {client?.phone}</p>
                          <p><span className="font-bold">End:</span> {client?.address}</p>
                       </div>
                    </div>
                    <div className="border border-gray-300 rounded-lg p-4 print:p-2 print:border-black">
                       <h3 className="font-bold border-b border-gray-200 pb-2 mb-3 uppercase text-sm print:text-[10px] print:mb-1">Aparelho</h3>
                       <div className="space-y-1 text-sm print:text-[10px] print:space-y-0">
                          <p><span className="font-bold">Modelo:</span> {printingOS.device}</p>
                          <p><span className="font-bold">IMEI:</span> {printingOS.imei || '-'}</p>
                          <p><span className="font-bold">Senha:</span> {printingOS.devicePassword || 'N/A'}</p>
                          {printingOS.patternPassword && <p>[Senha Padrão Anexada]</p>}
                       </div>
                    </div>
                 </div>
                 <div className="border border-gray-300 rounded-lg p-4 print:p-2 print:border-black">
                    <h3 className="font-bold border-b border-gray-200 pb-2 mb-3 uppercase text-sm print:text-[10px] print:mb-1">Defeito Relatado / Diagnóstico</h3>
                    <p className="text-sm whitespace-pre-wrap print:text-[10px]">{printingOS.description}</p>
                 </div>
                 {/* Items */}
                 <div className="border border-gray-300 rounded-lg overflow-hidden print:border-black">
                    <div className="bg-gray-50 p-2 font-bold uppercase text-sm text-center border-b border-gray-300 print:text-[10px]">Serviços e Peças</div>
                    <table className="w-full text-xs print:text-[10px]">
                        <thead><tr className="border-b"><th className="p-2 text-left">Item</th><th className="p-2 text-right">Valor</th></tr></thead>
                        <tbody>
                           {printingOS.items.map((i, idx) => (
                              <tr key={idx} className="border-b last:border-0"><td className="p-2">{i.name}</td><td className="p-2 text-right">R$ {i.total.toFixed(2)}</td></tr>
                           ))}
                        </tbody>
                    </table>
                 </div>
                 <div className="flex justify-end"><div className="text-xl font-bold print:text-sm">Total: R$ {printingOS.totalValue.toFixed(2)}</div></div>
                 <div className="mt-8 pt-6 border-t-2 border-gray-800 print:border-black"><div className="grid grid-cols-2 gap-16 text-center"><div className="border-t border-black pt-2 text-sm font-bold">Cliente</div><div className="border-t border-black pt-2 text-sm font-bold">Técnico</div></div></div>
              </div>
              <div className="bg-gray-100 p-4 border-t border-gray-200 flex justify-end gap-4 print:hidden shrink-0">
                 <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2">Imprimir</button>
              </div>
          </div>
       </div>
    );
  };

  const NewOSModal = () => {
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
         <div className="bg-white rounded-xl w-full max-w-4xl max-h-[95vh] overflow-y-auto flex flex-col shadow-xl">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10 shadow-sm shrink-0">
               <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <FileText className="text-blue-600"/> {editingOS ? `Editar OS #${editingOS.id}` : 'Nova Ordem de Serviço'}
               </h2>
               <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
            </div>
            
            <form onSubmit={submit} className="p-6 space-y-6 flex-1 overflow-y-auto bg-white">
               
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Row 1: Client & Basic Info */}
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

                  {/* Row 2: Device Info */}
                  <div className="md:col-span-2">
                     <label className="label">Aparelho / Modelo *</label>
                     <input 
                        required 
                        className="input" 
                        placeholder="Ex: iPhone 13 Pro Max - Azul" 
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
                     <label className="label">Nº de Série</label>
                     <input 
                        className="input" 
                        placeholder="Serial" 
                        value={formData.serialNumber} 
                        onChange={e => setFormData({...formData, serialNumber: e.target.value})}
                     />
                  </div>

                  {/* Row 3: Security */}
                  <div className="md:col-span-1">
                     <label className="label flex items-center gap-1"><Lock size={12}/> Senha (PIN/Texto)</label>
                     <input 
                        className="input" 
                        placeholder="Ex: 123456" 
                        value={formData.devicePassword} 
                        onChange={e => setFormData({...formData, devicePassword: e.target.value})}
                     />
                  </div>
                  <div className="md:col-span-3 flex items-center gap-4 border border-gray-200 rounded-lg p-3">
                     <div className="flex-1">
                        <label className="label mb-0 flex items-center gap-1"><Grid3X3 size={12}/> Senha Padrão</label>
                        <p className="text-[10px] text-gray-400">Desenhe ao lado se necessário</p>
                     </div>
                     <div className="transform scale-75 origin-right">
                        <PatternLock size={100} value={formData.patternPassword} onChange={(val) => setFormData({...formData, patternPassword: val})} />
                     </div>
                  </div>

                  {/* Row 4: Description */}
                  <div className="md:col-span-4">
                     <label className="label">Descrição do Defeito *</label>
                     <textarea 
                        required 
                        className="input min-h-[100px]" 
                        placeholder="Descreva o problema relatado pelo cliente..." 
                        value={formData.description} 
                        onChange={e => setFormData({...formData, description: e.target.value})}
                     />
                     <div className="mt-2 flex justify-end">
                        <button type="button" onClick={handleAI} disabled={isAnalyzing || !formData.device || !formData.description} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded flex items-center gap-2 transition-colors border border-indigo-200">
                           <BrainCircuit size={14}/> {isAnalyzing ? 'Analisando...' : 'Diagnóstico IA'}
                        </button>
                     </div>
                     {(aiResult || formData.aiDiagnosis) && (
                        <div className="mt-2 p-3 bg-indigo-50 rounded-lg text-sm text-gray-700 border border-indigo-100">
                           <strong className="text-indigo-700 block mb-1">Sugestão IA:</strong>
                           {aiResult || formData.aiDiagnosis}
                        </div>
                     )}
                  </div>
                  
                  <div className="md:col-span-4 border-t border-gray-100 my-2"></div>

                  {/* Row 5: Add Items (Compact) */}
                  <div className="md:col-span-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                     <h3 className="font-bold text-gray-700 mb-3 text-sm flex items-center gap-2"><ShoppingCart size={16}/> Adicionar Itens (Peças/Serviços)</h3>
                     
                     <div className="flex flex-col md:flex-row gap-4 mb-4">
                        {/* Product Add */}
                        <div className="flex-1 flex gap-2">
                           <select className="input text-sm" value={selectedProductId} onChange={e => {
                                 setSelectedProductId(e.target.value);
                                 const p = products.find(prod => prod.id === e.target.value);
                                 if (p) setProductPrice(p.price);
                              }}>
                              <option value="">+ Produto...</option>
                              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                           </select>
                           <input type="number" className="input w-20 text-sm" placeholder="Qtd" value={productQty} onChange={e => setProductQty(Number(e.target.value))}/>
                           <input type="number" className="input w-24 text-sm" placeholder="R$" value={productPrice} onChange={e => setProductPrice(Number(e.target.value))}/>
                           <button type="button" onClick={handleAddProduct} className="bg-white border border-gray-300 text-green-600 hover:bg-green-50 p-2 rounded-lg"><Plus size={18}/></button>
                        </div>
                        {/* Service Add */}
                        <div className="flex-1 flex gap-2">
                           <select className="input text-sm" value={selectedServiceId} onChange={e => {
                                 setSelectedServiceId(e.target.value);
                                 const s = services.find(svc => svc.id === e.target.value);
                                 if (s) { setServicePrice(s.price); setServiceDescription(s.name); } 
                                 else { setServiceDescription(''); }
                              }}>
                              <option value="">+ Serviço...</option>
                              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                              <option value="custom">Outro</option>
                           </select>
                           {selectedServiceId === 'custom' && <input className="input text-sm" placeholder="Desc." value={serviceDescription} onChange={e => setServiceDescription(e.target.value)}/>}
                           <input type="number" className="input w-24 text-sm" placeholder="R$" value={servicePrice} onChange={e => setServicePrice(Number(e.target.value))}/>
                           <button type="button" onClick={handleAddService} className="bg-white border border-gray-300 text-blue-600 hover:bg-blue-50 p-2 rounded-lg"><Plus size={18}/></button>
                        </div>
                     </div>

                     {/* Items List */}
                     {addedItems.length > 0 && (
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                           <table className="w-full text-sm text-left">
                              <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                                 <tr><th className="p-2">Item</th><th className="p-2 text-center">Tipo</th><th className="p-2 text-right">Valor</th><th className="p-2"></th></tr>
                              </thead>
                              <tbody>
                                 {addedItems.map((item, idx) => (
                                    <tr key={idx} className="border-t border-gray-100">
                                       <td className="p-2">{item.name} <span className="text-xs text-gray-400">x{item.quantity}</span></td>
                                       <td className="p-2 text-center text-xs text-gray-500 uppercase">{item.type === 'product' ? 'Peça' : 'Serviço'}</td>
                                       <td className="p-2 text-right font-medium">R$ {item.total.toFixed(2)}</td>
                                       <td className="p-2 text-center"><button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button></td>
                                    </tr>
                                 ))}
                              </tbody>
                              <tfoot className="bg-gray-50 font-bold text-gray-800">
                                 <tr>
                                    <td colSpan={2} className="p-2 text-right">Total Estimado:</td>
                                    <td className="p-2 text-right text-blue-600">R$ {totalValue.toFixed(2)}</td>
                                    <td></td>
                                 </tr>
                              </tfoot>
                           </table>
                        </div>
                     )}
                  </div>

                  <div className="md:col-span-4">
                     <label className="label">Garantia</label>
                     <select className="input" value={formData.warranty} onChange={e => setFormData({...formData, warranty: e.target.value})}>
                        <option>Sem garantia</option>
                        <option>30 Dias (Serviço)</option>
                        <option>90 Dias (Peças e Mão de Obra)</option>
                        <option>1 Ano (Fabricante)</option>
                     </select>
                  </div>
               </div>

               <div className="flex justify-end pt-4 border-t border-gray-100 gap-3">
                  <button type="button" onClick={handleCloseModal} className="px-6 py-2.5 rounded-lg font-bold text-gray-600 hover:bg-gray-100 border border-gray-200">Cancelar</button>
                  <button type="submit" className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-blue-700 shadow-md flex items-center gap-2">
                     <CheckCircle size={18}/> {editingOS ? 'Salvar Alterações' : 'Criar Ordem de Serviço'}
                  </button>
               </div>
            </form>
         </div>
         
         <style>{`
            .label { @apply block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1; }
            .input { @apply w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm text-gray-700 bg-white; }
         `}</style>
      </div>
     );
  };

  // ... (Rest of the component remains unchanged) ...
  const NewPurchaseModal = () => {
     // ... (Existing NewPurchaseModal code) ...
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
     // ... (Existing FinishOSModal code) ...
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
    // ... (Existing DashboardTab code) ...
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
     // ... (Existing OSListTab code) ...
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
               <div key={os.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all group flex flex-col">
                  <div className="p-5 flex-1 cursor-pointer" onClick={() => { setEditingOS(os); setIsModalOpen(true); }}>
                     <div className="flex justify-between items-start mb-3">
                        <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">{os.id}</span>
                     </div>
                     <h3 className="font-bold text-lg text-gray-800 mb-1">{os.device}</h3>
                     <p className="text-gray-600 text-sm mb-4 flex items-center gap-1"><Users size={14}/> {os.customerName}</p>
                     
                     <div className="bg-gray-50 p-3 rounded-lg mb-4 border border-gray-100">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 font-bold">Problema Relatado</p>
                        <p className="text-sm text-gray-700 line-clamp-2">{os.description}</p>
                     </div>
                     <div className="flex justify-between items-center">
                        {os.imei && <p className="text-xs text-gray-400">IMEI: {os.imei}</p>}
                        <p className="text-sm font-bold text-blue-600">R$ {os.totalValue.toFixed(2)}</p>
                     </div>
                  </div>

                  <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-col gap-3">
                     <div className="flex items-center justify-between">
                         <div className="flex items-center gap-1 text-xs text-gray-500">
                           <Clock size={14}/> {new Date(os.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex gap-2">
                           <button 
                              onClick={() => { setEditingOS(os); setIsModalOpen(true); }}
                              className="text-blue-600 bg-white border border-blue-200 hover:bg-blue-50 p-1.5 rounded-lg transition-colors shadow-sm"
                              title="Editar OS"
                           >
                              <Edit size={18} />
                           </button>
                           <button 
                              onClick={() => setPrintingOS(os)}
                              className="text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 p-1.5 rounded-lg transition-colors shadow-sm" 
                              title="Imprimir OS"
                           >
                              <Printer size={18} />
                           </button>
                        </div>
                     </div>
                     
                     {/* Status Dropdown */}
                     <select 
                        value={os.status}
                        onChange={(e) => handleStatusChange(os.id, e.target.value as OSStatus)}
                        disabled={os.status === OSStatus.FINALIZADO}
                        className={`w-full text-xs font-bold uppercase p-2 rounded border cursor-pointer outline-none transition-colors
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
                  </div>
               </div>
            ))}
           </div>
        </div>
     );
  };

  const PurchasesTab = () => {
    // ... (Existing PurchasesTab code) ...
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
          .label { @apply block text-sm font-bold text-gray-700 uppercase tracking-wide mb-1; }
          .input { @apply w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-shadow; }
       `}</style>
    </div>
  );
};
