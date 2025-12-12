
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { Product, CartItem, Transaction, TransactionType, SalesOrder, OrderStatus, OSItem } from '../types';
import { 
  ShoppingCart, Plus, Minus, Trash2, Search, User, Package, Calendar, 
  CreditCard, Printer, CheckCircle, X, ChevronRight, 
  DollarSign, MapPin, Truck, MessageCircle, Edit, FileText, Save, Calculator, ArrowLeft
} from 'lucide-react';

type SalesTab = 'quick' | 'orders';
type PDVStep = 'products' | 'customer' | 'payment';

export const Sales: React.FC = () => {
  const { 
    products, customers, salesOrders, settings, 
    addTransaction, updateStock, addSalesOrder, updateSalesOrder,
    transactions 
  } = useData();
  
  // --- Global UI State ---
  const [activeTab, setActiveTab] = useState<SalesTab>('quick');
  
  // ==========================================
  //      PDV RÁPIDO (Quick POS) STATES
  // ==========================================
  const [pdvStep, setPdvStep] = useState<PDVStep>('products');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [pdvSearchTerm, setPdvSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('Dinheiro');
  const [discount, setDiscount] = useState(0);
  
  // ==========================================
  //      GESTÃO DE PEDIDOS (Orders) STATES
  // ==========================================
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<SalesOrder | null>(null);
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  
  // --- Form States for New/Edit Order ---
  const [orderForm, setOrderForm] = useState({
      customerId: '',
      customerName: '',
      status: 'Pendente' as OrderStatus,
      cep: '',
      address: '',
      addressNumber: '',
      description: '', // Descrição adicional
      warranty: 'Sem Garantia',
      paymentMethod: 'Pendente',
      discount: 0
  });
  
  // Order Items
  const [orderItems, setOrderItems] = useState<OSItem[]>([]);
  
  // Item Adder State
  const [newItem, setNewItem] = useState({
      productId: '',
      name: '',
      color: '',
      storage: '',
      imei: '',
      serialNumber: '',
      quantity: 1,
      price: ''
  });

  const [loadingCep, setLoadingCep] = useState(false);

  // ==========================================
  //           HELPERS & CALCULATIONS
  // ==========================================
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Filter Products for PDV
  const filteredProducts = useMemo(() => {
    if (!pdvSearchTerm) return products;
    return products.filter(p => 
      p.name.toLowerCase().includes(pdvSearchTerm.toLowerCase()) || 
      p.id.includes(pdvSearchTerm)
    );
  }, [pdvSearchTerm, products]);

  // Filter Sales Orders
  const filteredOrders = useMemo(() => {
     return salesOrders.filter(o => 
        o.customerName.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
        o.id.includes(orderSearchTerm) ||
        o.status.toLowerCase().includes(orderSearchTerm.toLowerCase())
     ).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [salesOrders, orderSearchTerm]);

  // PDV Cart Totals
  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const finalPdvTotal = Math.max(0, cartTotal - discount);

  // ==========================================
  //           PDV FUNCTIONS
  // ==========================================
  const addToCart = (product: Product) => {
     setCart(prev => {
        const existing = prev.find(item => item.id === product.id);
        if (existing) {
           return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
        }
        return [...prev, { ...product, quantity: 1 }];
     });
  };

  const removeFromCart = (index: number) => {
     const newCart = [...cart];
     newCart.splice(index, 1);
     setCart(newCart);
  };

  const finalizePdvSale = () => {
     if (cart.length === 0) return alert("Carrinho vazio!");

     const customer = customers.find(c => c.id === selectedCustomerId);
     const customerName = customer ? customer.name : 'Consumidor Final';

     // 1. Create Transaction
     const transaction: Transaction = {
        id: `TR-PDV-${Date.now()}`,
        description: `Venda PDV - ${customerName}`,
        amount: finalPdvTotal,
        type: TransactionType.INCOME,
        date: new Date().toISOString(),
        category: 'Vendas',
        transactionDetails: {
           customerName,
           paymentMethod,
           items: cart
        }
     };
     addTransaction(transaction);

     // 2. Create Sales Order Record (Optional but good for history)
     const order: SalesOrder = {
        id: `PDV-${Date.now().toString().slice(-6)}`,
        customerId: selectedCustomerId || 'CONSUMIDOR',
        customerName,
        status: OrderStatus.FINISHED,
        createdAt: new Date().toISOString(),
        items: cart.map(c => ({
           id: c.id,
           name: c.name,
           quantity: c.quantity,
           unitPrice: c.price,
           total: c.price * c.quantity,
           type: 'product'
        })),
        totalValue: finalPdvTotal,
        paymentMethod
     };
     addSalesOrder(order);

     // 3. Update Stock
     cart.forEach(item => {
        updateStock(item.id, item.quantity);
     });

     alert("Venda realizada com sucesso!");
     setCart([]);
     setDiscount(0);
     setPdvStep('products');
     setSelectedCustomerId('');
     setPaymentMethod('Dinheiro');
  };

  // ==========================================
  //        ORDER MANAGEMENT FUNCTIONS
  // ==========================================

  const handleOpenOrderModal = (order?: SalesOrder) => {
      if (order) {
          setEditingOrder(order);
          const customer = customers.find(c => c.id === order.customerId);
          // Tenta extrair dados do endereço se disponíveis
          let address = customer?.address || '';
          let addressNumber = customer?.addressNumber || '';
          let cep = customer?.cep || '';

          // Se tiver technicalNotes com endereço salvo, tenta usar (opcional)
          if (order.technicalNotes && order.technicalNotes.includes('| CEP:')) {
             // Lógica simples de parse se necessário, ou mantém dados do cliente
          }

          setOrderForm({
              customerId: order.customerId,
              customerName: order.customerName,
              status: order.status,
              cep,
              address,
              addressNumber,
              description: order.description || '',
              warranty: order.warranty || 'Sem Garantia',
              paymentMethod: order.paymentMethod || 'Pendente',
              discount: 0 // Simplificação, idealmente salvaria o desconto na SalesOrder
          });
          setOrderItems(order.items || []);
      } else {
          setEditingOrder(null);
          setOrderForm({
              customerId: '',
              customerName: '',
              status: OrderStatus.PENDING,
              cep: '',
              address: '',
              addressNumber: '',
              description: '',
              warranty: '90 Dias',
              paymentMethod: 'Pendente',
              discount: 0
          });
          setOrderItems([]);
      }
      setIsOrderModalOpen(true);
  };

  const handleCepSearch = async () => {
      const cep = orderForm.cep.replace(/\D/g, '');
      if (cep.length !== 8) return;
      
      setLoadingCep(true);
      try {
          const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
          const data = await res.json();
          if (!data.erro) {
              setOrderForm(prev => ({
                  ...prev,
                  address: `${data.logradouro}, ${data.bairro}, ${data.localidade}-${data.uf}`
              }));
          } else {
              alert("CEP não encontrado.");
          }
      } catch (e) {
          console.error(e);
      } finally {
          setLoadingCep(false);
      }
  };

  const handleCustomerSelect = (custId: string) => {
      const c = customers.find(cust => cust.id === custId);
      if (c) {
          setOrderForm(prev => ({
              ...prev,
              customerId: c.id,
              customerName: c.name,
              cep: c.cep || '',
              address: c.address || '',
              addressNumber: c.addressNumber || ''
          }));
      } else {
          setOrderForm(prev => ({ ...prev, customerId: custId }));
      }
  };

  const handleProductSelect = (prodId: string) => {
      const p = products.find(prod => prod.id === prodId);
      if (p) {
          setNewItem(prev => ({
             ...prev,
             productId: p.id,
             name: p.name,
             price: p.price.toString(),
             // Auto fill details if available
             color: p.color || '',
             storage: p.storage || '',
             imei: p.imei || '',
             serialNumber: p.serialNumber || ''
          }));
      }
  };

  const handleAddItemToOrder = () => {
      if (!newItem.name || !newItem.price) return alert("Preencha o produto e valor.");
      
      const priceVal = parseFloat(newItem.price.toString());
      const qtyVal = Number(newItem.quantity);
      
      const item: OSItem = {
          id: newItem.productId || `TEMP-${Date.now()}`,
          name: newItem.name,
          quantity: qtyVal,
          unitPrice: priceVal,
          total: priceVal * qtyVal,
          type: 'product',
          details: [
             newItem.color ? `Cor: ${newItem.color}` : '',
             newItem.storage ? `Armaz: ${newItem.storage}` : '',
             newItem.imei ? `IMEI: ${newItem.imei}` : '',
             newItem.serialNumber ? `SN: ${newItem.serialNumber}` : ''
          ].filter(Boolean).join(' | ')
      };

      setOrderItems([...orderItems, item]);
      // Reset item inputs but keep generic fields empty
      setNewItem({ productId: '', name: '', color: '', storage: '', imei: '', serialNumber: '', quantity: 1, price: '' });
  };

  const handleRemoveOrderItem = (index: number) => {
      const updated = [...orderItems];
      updated.splice(index, 1);
      setOrderItems(updated);
  };

  const handleSaveOrder = (e: React.FormEvent) => {
      e.preventDefault();
      if (!orderForm.customerId && !orderForm.customerName) return alert("Selecione um cliente.");
      if (orderItems.length === 0) return alert("Adicione pelo menos um produto.");

      const subtotal = orderItems.reduce((acc, i) => acc + i.total, 0);
      const total = Math.max(0, subtotal - orderForm.discount);

      const orderData: SalesOrder = {
          id: editingOrder ? editingOrder.id : `PED-${Date.now().toString().slice(-6)}`,
          customerId: orderForm.customerId || 'CONSUMIDOR',
          customerName: orderForm.customerName || 'Consumidor Final',
          status: orderForm.status,
          createdAt: editingOrder ? editingOrder.createdAt : new Date().toISOString(),
          items: orderItems,
          totalValue: total,
          description: orderForm.description,
          warranty: orderForm.warranty,
          paymentMethod: orderForm.paymentMethod,
          technicalNotes: `End: ${orderForm.address}, ${orderForm.addressNumber} | CEP: ${orderForm.cep}`
      };

      if (editingOrder) {
          updateSalesOrder(editingOrder.id, orderData);
      } else {
          addSalesOrder(orderData);
      }

      // Sync with Finance & Stock if Finished
      if (orderForm.status === OrderStatus.FINISHED || orderForm.status === OrderStatus.DELIVERED) {
         // Check if already finalized to prevent dupes (simple check)
         if (!editingOrder || (editingOrder.status !== OrderStatus.FINISHED && editingOrder.status !== OrderStatus.DELIVERED)) {
             const transaction: Transaction = {
                id: `TR-PED-${orderData.id}`,
                description: `Venda Pedido #${orderData.id} - ${orderData.customerName}`,
                amount: total,
                type: TransactionType.INCOME,
                date: new Date().toISOString(),
                category: 'Vendas',
                transactionDetails: {
                   customerName: orderData.customerName,
                   paymentMethod: orderData.paymentMethod,
                   items: [] 
                }
             };
             addTransaction(transaction);

             // Stock
             orderItems.forEach(item => {
                if (item.type === 'product' && item.id && !item.id.startsWith('TEMP-')) {
                    updateStock(item.id, item.quantity);
                }
             });
         }
      }

      setIsOrderModalOpen(false);
      alert("Pedido salvo com sucesso!");
  };

  const handleWhatsAppOrder = (order: SalesOrder) => {
      const customer = customers.find(c => c.id === order.customerId);
      const phone = customer?.phone.replace(/\D/g, '');
      
      if (!phone) return alert("Cliente sem telefone cadastrado.");

      const itemsList = order.items.map(i => `- ${i.quantity}x ${i.name} ${i.details ? `(${i.details})` : ''}`).join('\n');
      const msg = `Olá *${order.customerName}*! Aqui é da *${settings.companyName}*.\n\n` +
                  `📦 *Detalhes do Pedido #${order.id}*\n` +
                  `Status: ${order.status}\n\n` +
                  `*Itens:*\n${itemsList}\n\n` +
                  `💰 *Total: R$ ${order.totalValue.toFixed(2)}*\n` +
                  `\nObrigado pela preferência!`;

      const link = `https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`;
      window.open(link, '_blank');
  };

  const handlePrintOrder = (order: SalesOrder) => {
     alert("Funcionalidade de impressão enviada para a fila.");
     // In a real app, set a printing state and render a print component similar to ServiceOrders
  };

  // ==========================================
  //               RENDER
  // ==========================================
  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
         <div>
            <h1 className="text-2xl font-bold text-gray-800">Vendas e Pedidos</h1>
            <p className="text-gray-500 text-sm">Gerencie o PDV e Encomendas Detalhadas</p>
         </div>
         <div className="flex bg-gray-100 p-1 rounded-lg">
             <button 
                onClick={() => setActiveTab('quick')}
                className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'quick' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
             >
                <ShoppingCart size={18}/> PDV Rápido
             </button>
             <button 
                onClick={() => setActiveTab('orders')}
                className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'orders' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
             >
                <Package size={18}/> Gestão de Pedidos
             </button>
         </div>
      </div>

      {/* ======================= */}
      {/*      PDV TAB CONTENT    */}
      {/* ======================= */}
      {activeTab === 'quick' && (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
            
            {/* Left: Product Grid */}
            <div className="lg:col-span-2 flex flex-col gap-4">
               <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-2">
                  <Search size={20} className="text-gray-400"/>
                  <input 
                     autoFocus
                     placeholder="Buscar produto por nome ou código..."
                     className="flex-1 outline-none text-lg"
                     value={pdvSearchTerm}
                     onChange={e => setPdvSearchTerm(e.target.value)}
                  />
               </div>
               
               <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-4 overflow-y-auto">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                     {filteredProducts.map(p => (
                        <button 
                           key={p.id}
                           onClick={() => addToCart(p)}
                           disabled={p.stock <= 0}
                           className={`p-4 rounded-xl border text-left transition-all flex flex-col h-full justify-between
                              ${p.stock > 0 
                                 ? 'border-gray-200 hover:border-blue-500 hover:shadow-md bg-white' 
                                 : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'}`}
                        >
                           <div>
                              <p className="font-bold text-gray-800 line-clamp-2">{p.name}</p>
                              <p className="text-xs text-gray-500 mt-1">{p.category}</p>
                           </div>
                           <div className="mt-4 flex justify-between items-end">
                              <span className="font-bold text-blue-600">R$ {p.price.toFixed(2)}</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                 {p.stock > 0 ? `${p.stock} un` : 'Sem Estoque'}
                              </span>
                           </div>
                        </button>
                     ))}
                  </div>
               </div>
            </div>
            
            {/* Right: Cart & Checkout */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
               <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                  <h2 className="font-bold text-gray-800 flex items-center gap-2">
                     <ShoppingCart size={20}/> Carrinho
                  </h2>
                  <button onClick={() => setCart([])} className="text-red-500 text-xs font-bold hover:underline">Limpar</button>
               </div>
               
               {/* Cart Items */}
               <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {cart.length === 0 ? (
                     <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                        <ShoppingCart size={48} className="mb-2"/>
                        <p>Carrinho vazio</p>
                     </div>
                  ) : (
                     cart.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                           <div className="flex-1">
                              <p className="font-bold text-gray-800 text-sm line-clamp-1">{item.name}</p>
                              <p className="text-xs text-blue-600 font-bold">R$ {item.price.toFixed(2)}</p>
                           </div>
                           <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 bg-white rounded border border-gray-200 px-1">
                                 <button onClick={() => removeFromCart(idx)} className="text-gray-400 hover:text-red-500"><Minus size={14}/></button>
                                 <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                 <button onClick={() => addToCart(item)} className="text-gray-400 hover:text-green-500"><Plus size={14}/></button>
                              </div>
                              <span className="font-bold text-sm w-16 text-right">R$ {(item.price * item.quantity).toFixed(2)}</span>
                           </div>
                        </div>
                     ))
                  )}
               </div>

               {/* Checkout Footer */}
               <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-3">
                   {pdvStep === 'products' ? (
                       <button 
                         onClick={() => setPdvStep('customer')}
                         disabled={cart.length === 0}
                         className="w-full bg-blue-600 disabled:bg-gray-300 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg flex justify-between px-6"
                       >
                          <span>Avançar</span>
                          <span>R$ {cartTotal.toFixed(2)}</span>
                       </button>
                   ) : pdvStep === 'customer' ? (
                       <div className="space-y-3 animate-fade-in">
                          <button onClick={() => setPdvStep('products')} className="text-xs text-gray-500 flex items-center gap-1 hover:text-gray-800"><ArrowLeft size={12}/> Voltar aos produtos</button>
                          <div>
                             <label className="text-xs font-bold text-gray-500 uppercase">Cliente</label>
                             <select 
                                className="w-full border p-2 rounded-lg bg-white"
                                value={selectedCustomerId}
                                onChange={e => setSelectedCustomerId(e.target.value)}
                             >
                                <option value="">Consumidor Final</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                             </select>
                          </div>
                          <button 
                             onClick={() => setPdvStep('payment')}
                             className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg flex justify-between px-6"
                          >
                             <span>Ir para Pagamento</span>
                             <span>R$ {cartTotal.toFixed(2)}</span>
                          </button>
                       </div>
                   ) : (
                       <div className="space-y-3 animate-fade-in">
                          <button onClick={() => setPdvStep('customer')} className="text-xs text-gray-500 flex items-center gap-1 hover:text-gray-800"><ArrowLeft size={12}/> Voltar ao cliente</button>
                          <div>
                             <label className="text-xs font-bold text-gray-500 uppercase">Forma de Pagamento</label>
                             <select 
                                className="w-full border p-2 rounded-lg bg-white mb-2"
                                value={paymentMethod}
                                onChange={e => setPaymentMethod(e.target.value)}
                             >
                                <option>Dinheiro</option>
                                <option>Pix</option>
                                <option>Cartão de Crédito</option>
                                <option>Cartão de Débito</option>
                             </select>
                             <label className="text-xs font-bold text-gray-500 uppercase">Desconto (R$)</label>
                             <input 
                                type="number" 
                                className="w-full border p-2 rounded-lg bg-white"
                                value={discount}
                                onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                             />
                          </div>
                          <div className="flex justify-between items-center text-lg font-bold border-t border-gray-200 pt-2">
                             <span>Total Final:</span>
                             <span className="text-green-600">R$ {finalPdvTotal.toFixed(2)}</span>
                          </div>
                          <button 
                             onClick={finalizePdvSale}
                             className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg flex justify-center items-center gap-2"
                          >
                             <CheckCircle size={20}/> Finalizar Venda
                          </button>
                       </div>
                   )}
               </div>
            </div>
         </div>
      )}

      {/* ======================= */}
      {/*    ORDERS TAB CONTENT   */}
      {/* ======================= */}
      {activeTab === 'orders' && (
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px]">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200 w-full md:w-96">
                  <Search size={20} className="text-gray-400"/>
                  <input 
                     placeholder="Buscar pedidos por cliente ou status..."
                     className="bg-transparent outline-none flex-1 text-sm"
                     value={orderSearchTerm}
                     onChange={e => setOrderSearchTerm(e.target.value)}
                  />
               </div>
               <button 
                  onClick={() => handleOpenOrderModal()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm whitespace-nowrap"
               >
                  <Plus size={20}/> Nova Venda / Encomenda
               </button>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs border-b border-gray-100">
                     <tr>
                        <th className="px-6 py-4">ID / Data</th>
                        <th className="px-6 py-4">Cliente</th>
                        <th className="px-6 py-4">Itens</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-right">Valor</th>
                        <th className="px-6 py-4 text-center">Ações</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {filteredOrders.length === 0 ? (
                        <tr><td colSpan={6} className="p-8 text-center text-gray-400">Nenhum pedido encontrado.</td></tr>
                     ) : (
                        filteredOrders.map(order => (
                           <tr key={order.id} className="hover:bg-blue-50/30 transition-colors">
                              <td className="px-6 py-4">
                                 <span className="font-mono font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-xs">{order.id}</span>
                                 <div className="text-xs text-gray-400 mt-1">{new Date(order.createdAt).toLocaleDateString()}</div>
                              </td>
                              <td className="px-6 py-4 font-medium text-gray-800">{order.customerName}</td>
                              <td className="px-6 py-4">
                                 <div className="text-xs text-gray-600 max-w-xs truncate">
                                    {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                 </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                 <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase 
                                    ${order.status === 'Finalizado' || order.status === 'Entregue' ? 'bg-green-100 text-green-700' : 
                                      order.status === 'Cancelado' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {order.status}
                                 </span>
                              </td>
                              <td className="px-6 py-4 text-right font-bold text-gray-800">R$ {order.totalValue.toFixed(2)}</td>
                              <td className="px-6 py-4 flex justify-center gap-2">
                                 <button onClick={() => handleWhatsAppOrder(order)} className="p-2 text-green-600 hover:bg-green-50 rounded" title="WhatsApp"><MessageCircle size={18}/></button>
                                 <button onClick={() => handleOpenOrderModal(order)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Editar"><Edit size={18}/></button>
                                 <button onClick={() => handlePrintOrder(order)} className="p-2 text-gray-500 hover:bg-gray-100 rounded" title="Imprimir"><Printer size={18}/></button>
                              </td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      )}

      {/* ========================================== */}
      {/*        MODAL: DETAILED ORDER FORM        */}
      {/* ========================================== */}
      {isOrderModalOpen && (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">
               
               {/* Modal Header */}
               <div className="bg-gray-800 text-white p-4 flex justify-between items-center shrink-0">
                  <h2 className="font-bold text-lg flex items-center gap-2">
                     <Package size={20}/> {editingOrder ? `Editar Pedido #${editingOrder.id}` : 'Nova Venda Detalhada'}
                  </h2>
                  <button onClick={() => setIsOrderModalOpen(false)} className="hover:text-gray-300"><X size={20}/></button>
               </div>

               <form onSubmit={handleSaveOrder} className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-6">
                  
                  {/* Section 1: Customer & Address */}
                  <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                     <h3 className="font-bold text-gray-700 border-b pb-2 mb-4 text-sm uppercase flex items-center gap-2">
                        <User size={16}/> Cliente e Logística
                     </h3>
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                           <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Cliente</label>
                           <select 
                              className="w-full border border-gray-300 rounded p-2 text-sm"
                              value={orderForm.customerId}
                              onChange={e => handleCustomerSelect(e.target.value)}
                           >
                              <option value="">Selecione ou deixe avulso...</option>
                              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                           </select>
                           {!orderForm.customerId && (
                              <input 
                                 placeholder="Nome do Cliente Avulso"
                                 className="w-full border border-gray-300 rounded p-2 text-sm mt-2"
                                 value={orderForm.customerName}
                                 onChange={e => setOrderForm({...orderForm, customerName: e.target.value})}
                              />
                           )}
                        </div>
                        <div className="md:col-span-1">
                           <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Status do Pedido</label>
                           <select 
                              className="w-full border border-gray-300 rounded p-2 text-sm font-bold bg-gray-50"
                              value={orderForm.status}
                              onChange={e => setOrderForm({...orderForm, status: e.target.value as OrderStatus})}
                           >
                              {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                           </select>
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">CEP</label>
                            <div className="relative">
                                <input 
                                    className="w-full border border-gray-300 rounded p-2 text-sm"
                                    placeholder="00000-000"
                                    value={orderForm.cep}
                                    onChange={e => setOrderForm({...orderForm, cep: e.target.value})}
                                    onBlur={handleCepSearch}
                                />
                                {loadingCep && <div className="absolute right-2 top-2"><div className="w-4 h-4 border-2 border-blue-600 rounded-full animate-spin border-t-transparent"></div></div>}
                            </div>
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Endereço Completo</label>
                            <input 
                                className="w-full border border-gray-300 rounded p-2 text-sm"
                                value={orderForm.address}
                                onChange={e => setOrderForm({...orderForm, address: e.target.value})}
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Número</label>
                            <input 
                                className="w-full border border-gray-300 rounded p-2 text-sm"
                                value={orderForm.addressNumber}
                                onChange={e => setOrderForm({...orderForm, addressNumber: e.target.value})}
                            />
                        </div>
                     </div>
                  </div>

                  {/* Section 2: Items */}
                  <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                     <h3 className="font-bold text-gray-700 border-b pb-2 mb-4 text-sm uppercase flex items-center gap-2">
                        <ShoppingCart size={16}/> Produtos / Itens
                     </h3>
                     
                     {/* Item Adder */}
                     <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4 grid grid-cols-1 md:grid-cols-6 gap-3">
                         <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 mb-1">Produto</label>
                            <select 
                               className="w-full border border-gray-300 rounded p-2 text-sm"
                               value={newItem.productId}
                               onChange={e => handleProductSelect(e.target.value)}
                            >
                               <option value="">Selecione...</option>
                               {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            {!newItem.productId && (
                               <input 
                                  placeholder="Nome item livre..." 
                                  className="w-full border border-gray-300 rounded p-2 text-sm mt-1"
                                  value={newItem.name}
                                  onChange={e => setNewItem({...newItem, name: e.target.value})}
                               />
                            )}
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Cor</label>
                            <input className="w-full border border-gray-300 rounded p-2 text-sm" value={newItem.color} onChange={e => setNewItem({...newItem, color: e.target.value})} />
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Armaz.</label>
                            <input className="w-full border border-gray-300 rounded p-2 text-sm" value={newItem.storage} onChange={e => setNewItem({...newItem, storage: e.target.value})} />
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Valor (Unit)</label>
                            <input type="number" className="w-full border border-gray-300 rounded p-2 text-sm" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} />
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Qtd</label>
                            <input type="number" className="w-full border border-gray-300 rounded p-2 text-sm text-center" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})} />
                         </div>
                         
                         <div className="md:col-span-3 grid grid-cols-2 gap-3">
                             <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">IMEI</label>
                                <input className="w-full border border-gray-300 rounded p-2 text-sm" value={newItem.imei} onChange={e => setNewItem({...newItem, imei: e.target.value})} />
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Serial Number (SN)</label>
                                <input className="w-full border border-gray-300 rounded p-2 text-sm" value={newItem.serialNumber} onChange={e => setNewItem({...newItem, serialNumber: e.target.value})} />
                             </div>
                         </div>
                         
                         <div className="md:col-span-3 flex items-end">
                             <button type="button" onClick={handleAddItemToOrder} className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 font-bold text-sm flex items-center justify-center gap-2">
                                <Plus size={16}/> Adicionar Produto
                             </button>
                         </div>
                     </div>

                     {/* Items List */}
                     <table className="w-full text-sm text-left border border-gray-200 rounded">
                        <thead className="bg-gray-100 text-xs font-bold text-gray-600 uppercase">
                           <tr>
                              <th className="p-2">Item / Detalhes</th>
                              <th className="p-2 text-center">Qtd</th>
                              <th className="p-2 text-right">Unit.</th>
                              <th className="p-2 text-right">Total</th>
                              <th className="p-2 w-10"></th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                           {orderItems.map((item, idx) => (
                              <tr key={idx}>
                                 <td className="p-2">
                                    <div className="font-bold">{item.name}</div>
                                    <div className="text-xs text-gray-500">{item.details}</div>
                                 </td>
                                 <td className="p-2 text-center">{item.quantity}</td>
                                 <td className="p-2 text-right">R$ {item.unitPrice.toFixed(2)}</td>
                                 <td className="p-2 text-right font-bold">R$ {item.total.toFixed(2)}</td>
                                 <td className="p-2 text-center">
                                    <button type="button" onClick={() => handleRemoveOrderItem(idx)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                                 </td>
                              </tr>
                           ))}
                           {orderItems.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-gray-400">Nenhum item adicionado.</td></tr>}
                        </tbody>
                     </table>
                  </div>

                  {/* Section 3: Final Details */}
                  <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                              <div>
                                 <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Descrição Adicional</label>
                                 <textarea 
                                    className="w-full border border-gray-300 rounded p-2 text-sm h-20"
                                    placeholder="Observações sobre entrega, detalhes..."
                                    value={orderForm.description}
                                    onChange={e => setOrderForm({...orderForm, description: e.target.value})}
                                 />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                     <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Garantia</label>
                                     <select 
                                        className="w-full border border-gray-300 rounded p-2 text-sm"
                                        value={orderForm.warranty}
                                        onChange={e => setOrderForm({...orderForm, warranty: e.target.value})}
                                     >
                                        <option>Sem Garantia</option>
                                        <option>30 Dias</option>
                                        <option>90 Dias</option>
                                        <option>1 Ano</option>
                                     </select>
                                  </div>
                                  <div>
                                     <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Forma Pagto</label>
                                     <select 
                                        className="w-full border border-gray-300 rounded p-2 text-sm"
                                        value={orderForm.paymentMethod}
                                        onChange={e => setOrderForm({...orderForm, paymentMethod: e.target.value})}
                                     >
                                        <option value="Pendente">Pendente</option>
                                        <option>Dinheiro</option>
                                        <option>Pix</option>
                                        <option>Cartão Crédito</option>
                                        <option>Cartão Débito</option>
                                     </select>
                                  </div>
                              </div>
                          </div>

                          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col justify-center space-y-3">
                              <div className="flex justify-between text-sm text-gray-600">
                                 <span>Subtotal:</span>
                                 <span>R$ {orderItems.reduce((acc, i) => acc + i.total, 0).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                 <span className="text-gray-600">Desconto (R$):</span>
                                 <input 
                                    type="number" 
                                    className="w-24 border border-gray-300 rounded p-1 text-right text-sm"
                                    value={orderForm.discount}
                                    onChange={e => setOrderForm({...orderForm, discount: parseFloat(e.target.value) || 0})}
                                 />
                              </div>
                              <div className="border-t border-gray-300 pt-3 flex justify-between items-center text-xl font-bold text-blue-800">
                                 <span>Total Final:</span>
                                 <span>R$ {Math.max(0, orderItems.reduce((acc, i) => acc + i.total, 0) - orderForm.discount).toFixed(2)}</span>
                              </div>
                          </div>
                      </div>
                  </div>

               </form>

               {/* Footer Actions */}
               <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 shrink-0">
                  <button type="button" onClick={() => setIsOrderModalOpen(false)} className="px-6 py-2 text-gray-600 hover:bg-gray-200 rounded font-medium">Cancelar</button>
                  <button type="button" onClick={handleSaveOrder} className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded font-bold shadow-sm flex items-center gap-2">
                     <Save size={18}/> Salvar Venda
                  </button>
               </div>

            </div>
         </div>
      )}

    </div>
  );
};
