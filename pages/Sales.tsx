
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { Product, CartItem, Transaction, TransactionType, SalesOrder, OrderStatus, TransactionDetails } from '../types';
import { 
  ShoppingCart, Plus, Minus, Trash2, Search, Zap, User, Package, Calendar, Clock, 
  CreditCard, Printer, CheckCircle, X, FileText, ArrowLeft, ChevronRight, 
  Monitor, Settings, LogOut, DollarSign, TrendingUp, TrendingDown, Lock, Unlock, Barcode,
  PieChart
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

type SalesTab = 'quick' | 'orders';
type PDVStep = 'products' | 'customer' | 'payment';
type CashierTab = 'status' | 'supply' | 'bleed' | 'open' | 'close';

interface CashierMovement {
  id: string;
  type: 'opening' | 'closing' | 'supply' | 'bleed' | 'sale';
  amount: number;
  description: string;
  time: string;
}

export const Sales: React.FC = () => {
  const { products, customers, salesOrders, transactions, settings, addTransaction, updateStock, addSalesOrder, updateSalesOrder } = useData();
  
  // --- Global UI State ---
  const [activeTab, setActiveTab] = useState<SalesTab>('quick');
  
  // --- PDV State ---
  const [pdvStep, setPdvStep] = useState<PDVStep>('products');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Customer State for PDV
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [tempCustomer, setTempCustomer] = useState({ name: '', phone: '', address: '' });

  // Payment State for PDV
  const [paymentMethod, setPaymentMethod] = useState('Dinheiro');
  const [discount, setDiscount] = useState(0);
  const [receivedAmount, setReceivedAmount] = useState('');

  // --- Cashier State (Local Mock for UI) ---
  const [isCashierModalOpen, setIsCashierModalOpen] = useState(false);
  const [cashierTab, setCashierTab] = useState<CashierTab>('status');
  const [cashierStatus, setCashierStatus] = useState<'open' | 'closed'>('closed');
  const [cashierBalance, setCashierBalance] = useState(0);
  const [cashierMovements, setCashierMovements] = useState<CashierMovement[]>([]);
  const [cashierInputAmount, setCashierInputAmount] = useState('');
  const [cashierInputDesc, setCashierInputDesc] = useState('');

  // --- New Modals State ---
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [stockSearchTerm, setStockSearchTerm] = useState('');

  // --- Order Tab State ---
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderDeliveryDate, setOrderDeliveryDate] = useState('');

  // --- Helpers ---
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return [];
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.id.includes(searchTerm)
    );
  }, [searchTerm, products]);

  // Stock Modal Filter
  const stockList = useMemo(() => {
    if (!stockSearchTerm) return products;
    return products.filter(p => 
      p.name.toLowerCase().includes(stockSearchTerm.toLowerCase()) || 
      p.id.includes(stockSearchTerm) ||
      p.category.toLowerCase().includes(stockSearchTerm.toLowerCase())
    );
  }, [products, stockSearchTerm]);

  // Summary Data Calculation
  const summaryData = useMemo(() => {
    const today = new Date().toLocaleDateString();
    const todaySales = transactions.filter(t => 
      t.type === TransactionType.INCOME && 
      t.category === 'Vendas' &&
      new Date(t.date).toLocaleDateString() === today
    );

    const total = todaySales.reduce((acc, t) => acc + t.amount, 0);
    const count = todaySales.length;
    const avgTicket = count > 0 ? total / count : 0;

    const paymentMethods: Record<string, number> = {};
    todaySales.forEach(t => {
       const method = t.transactionDetails?.paymentMethod || 'Outros';
       paymentMethods[method] = (paymentMethods[method] || 0) + t.amount;
    });

    const chartData = Object.entries(paymentMethods).map(([name, value]) => ({ name, value }));

    return { total, count, avgTicket, chartData, recent: todaySales.slice(0, 5) };
  }, [transactions]);

  const cartTotal = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);
  const finalTotal = Math.max(0, cartTotal - discount);
  const changeAmount = Math.max(0, Number(receivedAmount) - finalTotal);

  // --- PDV Actions ---

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setSearchTerm('');
    setIsSearching(false);
    if(searchInputRef.current) searchInputRef.current.focus();
    
    // Close stock modal if open to allow adding
    if (isStockModalOpen) {
       // Optional: Keep it open or close it. Let's show a toast or feedback, for now just close to show impact on cart
       setIsStockModalOpen(false); 
    }
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, newQty: number) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    if (newQty > 0 && newQty <= product.stock) {
      setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: newQty } : item));
    }
  };

  const handleNextStep = () => {
    if (pdvStep === 'products') {
      if (cart.length === 0) return alert('Adicione produtos ao carrinho.');
      setPdvStep('customer');
    } else if (pdvStep === 'customer') {
      setPdvStep('payment');
    } else if (pdvStep === 'payment') {
      finalizeSale();
    }
  };

  const handlePrevStep = () => {
    if (pdvStep === 'payment') setPdvStep('customer');
    else if (pdvStep === 'customer') setPdvStep('products');
  };

  const finalizeSale = () => {
    if (cashierStatus === 'closed') return alert('O caixa está fechado. Abra o caixa antes de finalizar uma venda.');

    const customerName = selectedCustomerId 
      ? customers.find(c => c.id === selectedCustomerId)?.name 
      : (tempCustomer.name || 'Consumidor Final');

    const transaction: Transaction = {
      id: `TR-${Date.now()}`,
      description: `PDV - ${customerName}`,
      amount: finalTotal,
      type: TransactionType.INCOME,
      date: new Date().toISOString(),
      category: 'Vendas',
      transactionDetails: {
        customerName: customerName,
        paymentMethod: paymentMethod,
        items: [...cart],
      }
    };

    addTransaction(transaction);
    cart.forEach(item => updateStock(item.id, item.quantity));

    // Add to cashier movement
    const movement: CashierMovement = {
      id: Date.now().toString(),
      type: 'sale',
      amount: finalTotal,
      description: `Venda #${transaction.id}`,
      time: new Date().toLocaleTimeString()
    };
    setCashierMovements(prev => [movement, ...prev]);
    setCashierBalance(prev => prev + finalTotal);

    alert('Venda realizada com sucesso!');
    resetPDV();
  };

  const resetPDV = () => {
    setCart([]);
    setPdvStep('products');
    setDiscount(0);
    setReceivedAmount('');
    setSelectedCustomerId('');
    setTempCustomer({ name: '', phone: '', address: '' });
  };

  // --- Cashier Actions ---

  const handleCashierAction = () => {
    const amount = Number(cashierInputAmount);
    if (!amount || amount <= 0) return;

    const newMovement: CashierMovement = {
      id: Date.now().toString(),
      type: cashierTab === 'open' ? 'opening' : cashierTab === 'close' ? 'closing' : cashierTab === 'supply' ? 'supply' : 'bleed',
      amount: amount,
      description: cashierInputDesc || (cashierTab === 'open' ? 'Abertura de Caixa' : cashierTab === 'close' ? 'Fechamento de Caixa' : cashierTab === 'supply' ? 'Suprimento' : 'Sangria'),
      time: new Date().toLocaleTimeString()
    };

    if (cashierTab === 'open') {
      setCashierStatus('open');
      setCashierBalance(amount);
      setCashierMovements([newMovement]);
    } else if (cashierTab === 'close') {
      setCashierStatus('closed');
      setCashierBalance(0); // Reset visual balance or keep history
      setCashierMovements(prev => [newMovement, ...prev]);
      alert(`Caixa fechado com saldo final de: ${formatCurrency(amount)}`);
    } else if (cashierTab === 'supply') {
      setCashierBalance(prev => prev + amount);
      setCashierMovements(prev => [newMovement, ...prev]);
    } else if (cashierTab === 'bleed') {
      if (amount > cashierBalance) return alert('Saldo insuficiente.');
      setCashierBalance(prev => prev - amount);
      setCashierMovements(prev => [newMovement, ...prev]);
    }

    setCashierInputAmount('');
    setCashierInputDesc('');
    if (cashierTab === 'open' || cashierTab === 'close') setIsCashierModalOpen(false);
    else setCashierTab('status');
  };

  // --- Main Render ---

  // Order List Mode
  if (activeTab === 'orders') {
    return (
      <div className="space-y-6">
        <div className="flex gap-4 mb-6">
             <button onClick={() => setActiveTab('quick')} className="px-4 py-2 rounded-lg font-medium text-gray-500 hover:bg-gray-100 transition-colors">PDV Rápido</button>
             <button onClick={() => setActiveTab('orders')} className="px-4 py-2 rounded-lg font-medium bg-white text-accent shadow-sm">Encomendas</button>
        </div>
        {/* Simple Placeholder for Order List to focus on PDV request */}
         <div className="bg-white p-8 rounded-xl text-center border border-gray-200 shadow-sm">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-800">Módulo de Encomendas</h2>
            <p className="text-gray-500">Para focar no PDV, este módulo está simplificado nesta visualização.</p>
            <button onClick={() => setActiveTab('quick')} className="mt-4 text-blue-600 hover:underline">Voltar para o PDV</button>
         </div>
      </div>
    );
  }

  // PDV Rápido Mode
  return (
    <div className="flex h-[calc(100vh-100px)] gap-4 bg-gray-100 -m-8 p-4"> {/* Negative margin to break out of default padding if needed, or adjust parent */}
      
      {/* 1. PDV Sidebar Actions (Left Vertical Bar) */}
      <div className="w-20 bg-gray-900 rounded-xl flex flex-col items-center py-6 gap-6 shadow-xl z-10">
         <button onClick={() => resetPDV()} className="group flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors" title="Novo PDV (Shift + N)">
            <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-900/50 group-hover:scale-110 transition-transform">
               <ShoppingCart size={24} />
            </div>
            <span className="text-[10px] font-bold">PDV</span>
         </button>

         <button 
            onClick={() => setIsStockModalOpen(true)}
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors" 
            title="Estoque (Shift + E)"
         >
            <div className="p-3 hover:bg-gray-800 rounded-xl transition-colors">
               <Package size={24} />
            </div>
            <span className="text-[10px]">Estoque</span>
         </button>

         <button 
            onClick={() => setIsSummaryModalOpen(true)}
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors" 
            title="Resumo (Shift + R)"
         >
            <div className="p-3 hover:bg-gray-800 rounded-xl transition-colors">
               <FileText size={24} />
            </div>
            <span className="text-[10px]">Resumo</span>
         </button>

         <button onClick={() => setIsCashierModalOpen(true)} className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors" title="Caixas (Shift + O)">
            <div className="p-3 hover:bg-gray-800 rounded-xl transition-colors">
               <Monitor size={24} />
            </div>
            <span className="text-[10px]">Caixas</span>
         </button>

         <div className="flex-1"></div>

         <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors">
            <div className="p-3 hover:bg-gray-800 rounded-xl transition-colors">
               <Settings size={24} />
            </div>
            <span className="text-[10px]">Config</span>
         </button>
      </div>

      {/* 2. Main Content Area */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden relative">
         
         {/* Top Header */}
         <div className="h-14 border-b border-gray-200 flex items-center justify-between px-6 bg-white">
            <div className="flex items-center gap-2">
               {/* Breadcrumbs */}
               <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${pdvStep === 'products' ? 'bg-gray-800 text-white' : 'text-gray-400'}`}>
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">1</span> Produto
               </div>
               <ChevronRight size={16} className="text-gray-300" />
               <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${pdvStep === 'customer' ? 'bg-gray-800 text-white' : 'text-gray-400'}`}>
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">2</span> Cliente
               </div>
               <ChevronRight size={16} className="text-gray-300" />
               <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${pdvStep === 'payment' ? 'bg-gray-800 text-white' : 'text-gray-400'}`}>
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">3</span> Pagamento
               </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right">
                   <p className="text-sm font-bold text-gray-800">{new Date().toLocaleDateString()}</p>
                   <p className="text-xs text-gray-500">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
                <button className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded shadow-sm transition-colors uppercase">
                   Definir como Pendente <br/><span className="font-normal opacity-80">(Shift + P)</span>
                </button>
            </div>
         </div>

         {/* Steps Content */}
         <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50">
            
            {pdvStep === 'products' && (
               <div className="flex flex-col h-full p-6 gap-4">
                  {/* Search Bar */}
                  <div className="relative z-20">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
                     <input 
                        ref={searchInputRef}
                        type="text" 
                        placeholder="Incluir produto..." 
                        className="w-full h-14 pl-14 pr-14 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none shadow-sm transition-colors"
                        value={searchTerm}
                        onChange={(e) => {
                           setSearchTerm(e.target.value);
                           setIsSearching(true);
                        }}
                        autoFocus
                     />
                     <Barcode className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />

                     {/* Autocomplete Dropdown */}
                     {isSearching && searchTerm && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-80 overflow-y-auto">
                           {filteredProducts.length === 0 ? (
                              <div className="p-4 text-gray-500 text-center">Nenhum produto encontrado</div>
                           ) : (
                              filteredProducts.map(product => (
                                 <button 
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    className="w-full text-left p-4 hover:bg-blue-50 flex justify-between items-center border-b border-gray-50 last:border-0 group"
                                 >
                                    <div>
                                       <p className="font-bold text-gray-800 group-hover:text-blue-700">{product.name}</p>
                                       <p className="text-xs text-gray-500">SKU: {product.id} | Estoque: {product.stock}</p>
                                    </div>
                                    <span className="font-bold text-blue-600">R$ {product.price.toFixed(2)}</span>
                                 </button>
                              ))
                           )}
                        </div>
                     )}
                  </div>

                  {/* Cart Table */}
                  <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                     <div className="overflow-y-auto flex-1">
                        <table className="w-full text-left">
                           <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold sticky top-0 z-10 shadow-sm">
                              <tr>
                                 <th className="px-6 py-3 w-16">#</th>
                                 <th className="px-6 py-3">Produto</th>
                                 <th className="px-6 py-3 text-center">Qtd</th>
                                 <th className="px-6 py-3 text-right">Unitário</th>
                                 <th className="px-6 py-3 text-right">Total</th>
                                 <th className="px-6 py-3 text-center">Ações</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100 text-sm">
                              {cart.length === 0 ? (
                                 <tr>
                                    <td colSpan={6} className="h-64 text-center text-gray-400">
                                       <ShoppingCart size={48} className="mx-auto mb-2 opacity-20" />
                                       Nenhum item adicionado
                                    </td>
                                 </tr>
                              ) : (
                                 cart.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-blue-50/50 transition-colors group">
                                       <td className="px-6 py-4 text-gray-400 font-mono">{index + 1}</td>
                                       <td className="px-6 py-4">
                                          <p className="font-bold text-gray-800">{item.name}</p>
                                          <p className="text-xs text-gray-400">SKU: {item.id}</p>
                                       </td>
                                       <td className="px-6 py-4">
                                          <div className="flex items-center justify-center gap-2">
                                             <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"><Minus size={14}/></button>
                                             <span className="w-8 text-center font-bold text-gray-800">{item.quantity}</span>
                                             <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded"><Plus size={14}/></button>
                                          </div>
                                       </td>
                                       <td className="px-6 py-4 text-right text-gray-600">R$ {item.price.toFixed(2)}</td>
                                       <td className="px-6 py-4 text-right font-bold text-gray-800">R$ {(item.price * item.quantity).toFixed(2)}</td>
                                       <td className="px-6 py-4 text-center">
                                          <button 
                                             onClick={() => removeFromCart(item.id)}
                                             className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                          >
                                             <Trash2 size={16} />
                                          </button>
                                       </td>
                                    </tr>
                                 ))
                              )}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </div>
            )}

            {pdvStep === 'customer' && (
               <div className="flex-1 flex flex-col items-center justify-center p-8 animate-fade-in">
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 max-w-2xl w-full">
                     <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <User className="text-blue-600"/> Identificar Cliente
                     </h2>
                     
                     <div className="space-y-6">
                        <div>
                           <label className="block text-sm font-bold text-gray-700 mb-2">Cliente Cadastrado</label>
                           <select 
                              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                              value={selectedCustomerId}
                              onChange={e => setSelectedCustomerId(e.target.value)}
                           >
                              <option value="">-- Selecionar Cliente --</option>
                              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                           </select>
                        </div>

                        <div className="relative flex items-center py-2">
                           <div className="flex-grow border-t border-gray-200"></div>
                           <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">OU CONSUMIDOR AVULSO</span>
                           <div className="flex-grow border-t border-gray-200"></div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="col-span-2">
                              <label className="block text-sm font-bold text-gray-700 mb-2">Nome</label>
                              <input 
                                 placeholder="Nome do Consumidor"
                                 className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                 value={tempCustomer.name}
                                 onChange={e => setTempCustomer({...tempCustomer, name: e.target.value})}
                                 disabled={!!selectedCustomerId}
                              />
                           </div>
                           <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">Telefone</label>
                              <input 
                                 placeholder="(00) 00000-0000"
                                 className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                 value={tempCustomer.phone}
                                 onChange={e => setTempCustomer({...tempCustomer, phone: e.target.value})}
                                 disabled={!!selectedCustomerId}
                              />
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {pdvStep === 'payment' && (
               <div className="flex-1 flex flex-col p-8 animate-fade-in">
                  <div className="flex flex-col md:flex-row gap-8 h-full">
                     {/* Summary */}
                     <div className="w-full md:w-1/3 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-fit">
                        <h3 className="font-bold text-gray-800 mb-4 text-lg">Resumo da Venda</h3>
                        <div className="space-y-3 mb-6">
                           <div className="flex justify-between text-gray-600">
                              <span>Subtotal ({cart.length} itens)</span>
                              <span>R$ {cartTotal.toFixed(2)}</span>
                           </div>
                           <div className="flex justify-between text-red-500">
                              <span>Descontos</span>
                              <span>- R$ {discount.toFixed(2)}</span>
                           </div>
                           <div className="border-t pt-3 flex justify-between items-end">
                              <span className="font-bold text-gray-800 text-lg">Total a Pagar</span>
                              <span className="font-bold text-3xl text-blue-600">R$ {finalTotal.toFixed(2)}</span>
                           </div>
                        </div>
                        
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                           <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-blue-800 font-bold">Cliente</span>
                           </div>
                           <p className="text-blue-900 truncate">
                              {selectedCustomerId ? customers.find(c => c.id === selectedCustomerId)?.name : (tempCustomer.name || 'Consumidor Final')}
                           </p>
                        </div>
                     </div>

                     {/* Payment Options */}
                     <div className="flex-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h3 className="font-bold text-gray-800 mb-4 text-lg">Forma de Pagamento</h3>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                           {['Dinheiro', 'Crédito', 'Débito', 'Pix'].map(method => (
                              <button 
                                 key={method}
                                 onClick={() => setPaymentMethod(method)}
                                 className={`p-4 rounded-xl border-2 font-bold transition-all flex flex-col items-center gap-2
                                    ${paymentMethod === method 
                                       ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                       : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                              >
                                 {method === 'Dinheiro' && <DollarSign/>}
                                 {method === 'Crédito' && <CreditCard/>}
                                 {method === 'Débito' && <CreditCard/>}
                                 {method === 'Pix' && <Zap/>}
                                 {method}
                              </button>
                           ))}
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                           <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">Desconto (R$)</label>
                              <input 
                                 type="number"
                                 className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xl"
                                 value={discount}
                                 onChange={e => setDiscount(Number(e.target.value))}
                              />
                           </div>
                           <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">Valor Recebido (R$)</label>
                              <input 
                                 type="number"
                                 className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xl font-bold text-green-700"
                                 value={receivedAmount}
                                 onChange={e => setReceivedAmount(e.target.value)}
                                 placeholder={finalTotal.toFixed(2)}
                              />
                           </div>
                        </div>

                        {Number(receivedAmount) > finalTotal && (
                           <div className="mt-6 bg-green-50 p-4 rounded-xl border border-green-100 flex justify-between items-center animate-fade-in">
                              <span className="font-bold text-green-800 text-lg">Troco</span>
                              <span className="font-bold text-3xl text-green-600">R$ {changeAmount.toFixed(2)}</span>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            )}

         </div>

         {/* Bottom Action Bar */}
         <div className="h-20 bg-gray-900 flex items-center justify-between px-6 text-white">
            <div className="flex items-center gap-6">
               <button 
                  onClick={() => { if(confirm('Limpar carrinho?')) resetPDV(); }}
                  className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors font-medium"
               >
                  <Trash2 size={20} />
                  EXCLUIR ITENS <span className="text-xs bg-gray-800 px-1.5 py-0.5 rounded ml-1 opacity-70">Shift + C</span>
               </button>
               {pdvStep !== 'products' && (
                  <button onClick={handlePrevStep} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                     <ArrowLeft size={20} /> Voltar
                  </button>
               )}
            </div>

            <div className="flex items-center gap-8">
               <div className="text-right">
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Total da Venda</p>
                  <p className="text-3xl font-bold">R$ {cartTotal.toFixed(2)}</p>
               </div>
               
               <button 
                  onClick={handleNextStep}
                  className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-3 transition-transform active:scale-95 shadow-lg shadow-green-900/50"
               >
                  {pdvStep === 'payment' ? 'FINALIZAR VENDA' : 'AVANÇAR'}
                  <ChevronRight size={20} />
               </button>
            </div>
         </div>
      </div>

      {/* --- MODAL: CASHIER MANAGEMENT --- */}
      {isCashierModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Monitor size={20} />
                <h2 className="font-bold text-lg">Gerenciamento de Caixa</h2>
              </div>
              <button onClick={() => setIsCashierModalOpen(false)} className="hover:text-gray-300"><X size={20}/></button>
            </div>
            
            <div className="flex border-b border-gray-200 bg-gray-50">
              <button onClick={() => setCashierTab('status')} className={`flex-1 py-3 font-medium text-sm ${cashierTab === 'status' ? 'bg-white text-blue-600 border-t-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Resumo</button>
              {cashierStatus === 'closed' ? (
                 <button onClick={() => setCashierTab('open')} className={`flex-1 py-3 font-medium text-sm ${cashierTab === 'open' ? 'bg-white text-green-600 border-t-2 border-green-600' : 'text-gray-500 hover:text-gray-700'}`}>Abertura</button>
              ) : (
                <>
                  <button onClick={() => setCashierTab('supply')} className={`flex-1 py-3 font-medium text-sm ${cashierTab === 'supply' ? 'bg-white text-green-600 border-t-2 border-green-600' : 'text-gray-500 hover:text-gray-700'}`}>Suprimento</button>
                  <button onClick={() => setCashierTab('bleed')} className={`flex-1 py-3 font-medium text-sm ${cashierTab === 'bleed' ? 'bg-white text-red-600 border-t-2 border-red-600' : 'text-gray-500 hover:text-gray-700'}`}>Sangria</button>
                  <button onClick={() => setCashierTab('close')} className={`flex-1 py-3 font-medium text-sm ${cashierTab === 'close' ? 'bg-white text-red-600 border-t-2 border-red-600' : 'text-gray-500 hover:text-gray-700'}`}>Fechamento</button>
                </>
              )}
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {cashierTab === 'status' && (
                <div className="space-y-6">
                   <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div>
                        <p className="text-sm text-blue-800 mb-1 font-medium">Status do Caixa</p>
                        <div className="flex items-center gap-2">
                           <span className={`w-3 h-3 rounded-full ${cashierStatus === 'open' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                           <span className="font-bold text-lg text-blue-900">{cashierStatus === 'open' ? 'ABERTO' : 'FECHADO'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-blue-800 mb-1 font-medium">Saldo Atual</p>
                        <p className="text-2xl font-bold text-blue-900">{formatCurrency(cashierBalance)}</p>
                      </div>
                   </div>

                   <div>
                     <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wide">Últimas Movimentações</h3>
                     <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-gray-50 text-gray-500">
                            <tr>
                              <th className="p-3 font-medium">Hora</th>
                              <th className="p-3 font-medium">Tipo</th>
                              <th className="p-3 font-medium">Descrição</th>
                              <th className="p-3 font-medium text-right">Valor</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {cashierMovements.length === 0 ? (
                              <tr><td colSpan={4} className="p-4 text-center text-gray-400">Nenhuma movimentação</td></tr>
                            ) : (
                              cashierMovements.slice(0, 10).map(m => (
                                <tr key={m.id}>
                                  <td className="p-3 text-gray-600">{m.time}</td>
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium 
                                      ${m.type === 'sale' ? 'bg-green-100 text-green-700' : 
                                        m.type === 'bleed' ? 'bg-red-100 text-red-700' :
                                        m.type === 'supply' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                      {m.type === 'sale' ? 'Venda' : m.type === 'bleed' ? 'Sangria' : m.type === 'supply' ? 'Suprimento' : m.type === 'opening' ? 'Abertura' : 'Fechamento'}
                                    </span>
                                  </td>
                                  <td className="p-3 text-gray-800">{m.description}</td>
                                  <td className={`p-3 text-right font-medium ${['bleed', 'closing'].includes(m.type) ? 'text-red-600' : 'text-green-600'}`}>
                                    {['bleed', 'closing'].includes(m.type) ? '-' : '+'} {formatCurrency(m.amount)}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                     </div>
                   </div>
                </div>
              )}

              {['open', 'supply', 'bleed', 'close'].includes(cashierTab) && (
                 <div className="max-w-md mx-auto space-y-4 pt-4">
                    <div className="text-center mb-6">
                       <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3
                         ${cashierTab === 'open' ? 'bg-green-100 text-green-600' : 
                           cashierTab === 'supply' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                          <DollarSign size={32} />
                       </div>
                       <h3 className="text-xl font-bold text-gray-800">
                         {cashierTab === 'open' ? 'Abertura de Caixa' : 
                          cashierTab === 'supply' ? 'Suprimento de Caixa' : 
                          cashierTab === 'bleed' ? 'Sangria de Caixa' : 'Fechamento de Caixa'}
                       </h3>
                       <p className="text-gray-500 text-sm">Informe o valor para prosseguir</p>
                    </div>

                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                       <input 
                          type="number" 
                          autoFocus
                          className="w-full text-2xl font-bold p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          placeholder="0,00"
                          value={cashierInputAmount}
                          onChange={e => setCashierInputAmount(e.target.value)}
                       />
                    </div>

                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Observação / Justificativa</label>
                       <input 
                          type="text" 
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          placeholder="Opcional"
                          value={cashierInputDesc}
                          onChange={e => setCashierInputDesc(e.target.value)}
                       />
                    </div>

                    <button 
                      onClick={handleCashierAction}
                      className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all mt-4
                        ${cashierTab === 'bleed' || cashierTab === 'close' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                      Confirmar Operação
                    </button>
                 </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: STOCK SEARCH --- */}
      {isStockModalOpen && (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
               <div className="bg-gray-800 text-white p-4 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2">
                     <Package size={20} />
                     <h2 className="font-bold text-lg">Consulta de Estoque</h2>
                  </div>
                  <button onClick={() => setIsStockModalOpen(false)} className="hover:text-gray-300"><X size={20}/></button>
               </div>
               
               <div className="p-4 border-b border-gray-200 bg-gray-50">
                   <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                      <input 
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                        placeholder="Buscar por nome, categoria ou código..."
                        value={stockSearchTerm}
                        onChange={e => setStockSearchTerm(e.target.value)}
                        autoFocus
                      />
                   </div>
               </div>

               <div className="overflow-y-auto flex-1 p-4">
                  <table className="w-full text-left text-sm">
                     <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold sticky top-0">
                        <tr>
                           <th className="px-4 py-3 rounded-l-lg">Produto</th>
                           <th className="px-4 py-3 text-center">Estoque</th>
                           <th className="px-4 py-3 text-right">Preço</th>
                           <th className="px-4 py-3 text-center rounded-r-lg">Ação</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {stockList.map(p => (
                           <tr key={p.id} className="hover:bg-blue-50 group">
                              <td className="px-4 py-3">
                                 <p className="font-bold text-gray-800">{p.name}</p>
                                 <p className="text-xs text-gray-400">{p.category} | SKU: {p.id}</p>
                              </td>
                              <td className="px-4 py-3 text-center">
                                 <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.stock <= 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                    {p.stock} un
                                 </span>
                              </td>
                              <td className="px-4 py-3 text-right font-medium text-blue-600">
                                 R$ {p.price.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-center">
                                 <button 
                                    onClick={() => addToCart(p)}
                                    className="bg-gray-900 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
                                 >
                                    Adicionar
                                 </button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
                  {stockList.length === 0 && <p className="text-center text-gray-400 py-8">Nenhum produto encontrado.</p>}
               </div>
            </div>
         </div>
      )}

      {/* --- MODAL: DAILY SUMMARY --- */}
      {isSummaryModalOpen && (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
               <div className="bg-gray-800 text-white p-4 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2">
                     <FileText size={20} />
                     <h2 className="font-bold text-lg">Resumo de Vendas (Hoje)</h2>
                  </div>
                  <button onClick={() => setIsSummaryModalOpen(false)} className="hover:text-gray-300"><X size={20}/></button>
               </div>

               <div className="p-6 overflow-y-auto">
                  {/* KPI Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                     <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                        <p className="text-xs text-green-600 font-bold uppercase mb-1">Total Vendido</p>
                        <p className="text-2xl font-bold text-green-800">R$ {summaryData.total.toFixed(2)}</p>
                     </div>
                     <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <p className="text-xs text-blue-600 font-bold uppercase mb-1">Qtd Vendas</p>
                        <p className="text-2xl font-bold text-blue-800">{summaryData.count}</p>
                     </div>
                     <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                        <p className="text-xs text-purple-600 font-bold uppercase mb-1">Ticket Médio</p>
                        <p className="text-2xl font-bold text-purple-800">R$ {summaryData.avgTicket.toFixed(2)}</p>
                     </div>
                  </div>

                  {/* Charts & Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><PieChart size={16}/> Formas de Pagamento</h3>
                        <div className="bg-white border border-gray-100 rounded-xl p-4 h-64 shadow-sm">
                           <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={summaryData.chartData} layout="vertical" margin={{top: 5, right: 30, left: 40, bottom: 5}}>
                                 <XAxis type="number" hide />
                                 <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}} />
                                 <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', background: '#333', color: '#fff'}} />
                                 <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20}>
                                    {summaryData.chartData.map((entry, index) => (
                                       <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][index % 4]} />
                                    ))}
                                 </Bar>
                              </BarChart>
                           </ResponsiveContainer>
                        </div>
                     </div>

                     <div>
                        <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><Clock size={16}/> Últimas Vendas</h3>
                        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                           <table className="w-full text-left text-xs">
                              <tbody className="divide-y divide-gray-100">
                                 {summaryData.recent.length === 0 ? (
                                    <tr><td className="p-4 text-center text-gray-400">Nenhuma venda hoje.</td></tr>
                                 ) : (
                                    summaryData.recent.map(t => (
                                       <tr key={t.id} className="hover:bg-gray-50">
                                          <td className="p-3 text-gray-500">{new Date(t.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                                          <td className="p-3 font-medium text-gray-800">{t.description}</td>
                                          <td className="p-3 text-right font-bold text-green-600">R$ {t.amount.toFixed(2)}</td>
                                       </tr>
                                    ))
                                 )}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
