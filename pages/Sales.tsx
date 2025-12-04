import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Product, CartItem, Transaction, TransactionType, SalesOrder, OrderStatus } from '../types';
import { ShoppingCart, Plus, Minus, Trash2, Search, Zap, User, Package, Calendar, Clock, CreditCard, Banknote } from 'lucide-react';

type SalesTab = 'quick' | 'full' | 'orders';

export const Sales: React.FC = () => {
  const { products, customers, transactions, salesOrders, addTransaction, updateStock, addSalesOrder, updateSalesOrder } = useData();
  
  // UI State
  const [activeTab, setActiveTab] = useState<SalesTab>('quick');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Full Sale / Order Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Dinheiro');
  const [orderDeliveryDate, setOrderDeliveryDate] = useState('');

  // Orders View State
  const [showNewOrder, setShowNewOrder] = useState(false);

  // --- Helpers & Logic ---

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) && p.stock > 0
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty > 0 && newQty <= item.stock) return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const total = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);

  const handleCheckout = () => {
    if (cart.length === 0) return;

    if (activeTab === 'quick') {
      // Simple Transaction
      const transaction: Transaction = {
        id: `TR-${Date.now()}`,
        description: `PDV Rápido - ${cart.length} itens`,
        amount: total,
        type: TransactionType.INCOME,
        date: new Date().toISOString(),
        category: 'Vendas'
      };
      addTransaction(transaction);
      cart.forEach(item => updateStock(item.id, item.quantity));
      setCart([]);
      alert('Venda rápida realizada!');
    } 
    else if (activeTab === 'full') {
      // Full Sale with Customer
      if (!selectedCustomerId) {
        alert('Por favor, selecione um cliente para Venda Completa.');
        return;
      }
      const customer = customers.find(c => c.id === selectedCustomerId);
      
      const transaction: Transaction = {
        id: `TR-${Date.now()}`,
        description: `Venda - ${customer?.name} - (${paymentMethod})`,
        amount: total,
        type: TransactionType.INCOME,
        date: new Date().toISOString(),
        category: 'Vendas'
      };
      addTransaction(transaction);
      cart.forEach(item => updateStock(item.id, item.quantity));
      setCart([]);
      setSelectedCustomerId('');
      alert('Venda completa registrada com sucesso!');
    }
    else if (activeTab === 'orders') {
      // Create Order (Encomenda)
      if (!selectedCustomerId) {
        alert('Selecione um cliente para a encomenda.');
        return;
      }
      const customer = customers.find(c => c.id === selectedCustomerId);
      
      const newOrder: SalesOrder = {
        id: `ENC-${Math.floor(Math.random() * 10000)}`,
        customerId: selectedCustomerId,
        customerName: customer?.name || 'Desconhecido',
        items: [...cart],
        total: total,
        status: OrderStatus.PENDING,
        createdAt: new Date().toISOString(),
        deliveryDate: orderDeliveryDate || undefined
      };
      
      addSalesOrder(newOrder);
      // Note: Stock is NOT deducted until delivery in this logic, 
      // OR you can deduct now to reserve. Let's reserve (deduct) now for simplicity.
      cart.forEach(item => updateStock(item.id, item.quantity));
      
      setCart([]);
      setSelectedCustomerId('');
      setShowNewOrder(false); // Return to list view
      alert('Encomenda criada com sucesso!');
    }
  };

  const deliverOrder = (order: SalesOrder) => {
    // Convert to transaction
    const transaction: Transaction = {
      id: `TR-ENC-${order.id}`,
      description: `Entrega Encomenda ${order.id} - ${order.customerName}`,
      amount: order.total,
      type: TransactionType.INCOME,
      date: new Date().toISOString(),
      category: 'Vendas'
    };
    addTransaction(transaction);
    updateSalesOrder(order.id, { status: OrderStatus.DELIVERED });
    alert('Encomenda entregue e receita registrada!');
  };

  // --- Components ---

  const ProductGrid = () => (
    <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
      {filteredProducts.map(product => (
        <button 
          key={product.id}
          onClick={() => addToCart(product)}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-accent transition-all text-left flex flex-col justify-between group h-40"
        >
          <div>
            <h3 className="font-semibold text-gray-800 line-clamp-2 group-hover:text-accent transition-colors">{product.name}</h3>
            <p className="text-xs text-gray-500 mt-1">{product.category}</p>
          </div>
          <div className="mt-2">
            <p className="font-bold text-gray-900 text-lg">R$ {product.price.toFixed(2)}</p>
            <p className="text-xs text-gray-400">Estoque: {product.stock}</p>
          </div>
        </button>
      ))}
    </div>
  );

  const CartSidebar = () => (
    <div className="lg:w-1/3 bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden h-full">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
        <ShoppingCart className="text-accent" />
        <h2 className="font-bold text-gray-800">
          {activeTab === 'orders' ? 'Nova Encomenda' : 'Carrinho de Compras'}
        </h2>
      </div>

      {/* Extra Fields for Full Sale or Orders */}
      {(activeTab === 'full' || activeTab === 'orders') && (
        <div className="p-4 bg-blue-50 border-b border-blue-100 space-y-3">
          <div>
            <label className="text-xs font-semibold text-blue-800 uppercase mb-1 block">Cliente</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-2.5 text-blue-400" />
              <select 
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              >
                <option value="">Selecione o Cliente...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {activeTab === 'full' && (
            <div>
              <label className="text-xs font-semibold text-blue-800 uppercase mb-1 block">Pagamento</label>
              <div className="flex gap-2">
                {['Dinheiro', 'Crédito', 'Débito', 'Pix'].map(method => (
                  <button 
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`flex-1 py-1 text-xs rounded border transition-colors ${
                      paymentMethod === method 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
             <div>
               <label className="text-xs font-semibold text-blue-800 uppercase mb-1 block">Previsão Entrega</label>
               <div className="relative">
                 <Calendar size={16} className="absolute left-3 top-2.5 text-blue-400" />
                 <input 
                    type="date" 
                    value={orderDeliveryDate}
                    onChange={e => setOrderDeliveryDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                 />
               </div>
             </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <ShoppingCart size={48} className="mb-2 opacity-20" />
            <p>O carrinho está vazio</p>
          </div>
        ) : (
          cart.map(item => (
            <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
              <div className="flex-1">
                <h4 className="font-medium text-gray-800 text-sm line-clamp-1">{item.name}</h4>
                <p className="text-accent text-sm font-bold">R$ {(item.price * item.quantity).toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white rounded-md border border-gray-200 px-1 py-1">
                  <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-gray-100 rounded text-gray-600"><Minus size={14} /></button>
                  <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-gray-100 rounded text-gray-600"><Plus size={14} /></button>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-6 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <span className="text-gray-600 text-lg">Total</span>
          <span className="text-2xl font-bold text-gray-800">R$ {total.toFixed(2)}</span>
        </div>
        <button 
          disabled={cart.length === 0}
          onClick={handleCheckout}
          className="w-full bg-accent hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold text-lg shadow-md hover:shadow-lg transition-all"
        >
          {activeTab === 'orders' ? 'Salvar Encomenda' : 'Finalizar Venda'}
        </button>
      </div>
    </div>
  );

  const OrdersList = () => (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800">Encomendas Pendentes</h2>
        <button 
          onClick={() => setShowNewOrder(true)}
          className="flex items-center gap-2 bg-accent hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} /> Nova Encomenda
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {salesOrders.length === 0 ? (
            <div className="text-center py-10 text-gray-400">Nenhuma encomenda registrada.</div>
        ) : (
            salesOrders.map(order => (
            <div key={order.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-mono">{order.id}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === OrderStatus.DELIVERED ? 'bg-green-100 text-green-700' : 
                        order.status === OrderStatus.CANCELLED ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                    }`}>
                        {order.status}
                    </span>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar size={14} /> {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                </div>
                <h3 className="font-bold text-gray-800">{order.customerName}</h3>
                <div className="text-sm text-gray-600 mt-1">
                    {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                </div>
                {order.deliveryDate && (
                    <div className="text-xs text-orange-600 mt-2 flex items-center gap-1 font-medium">
                        <Clock size={12} /> Previsão: {new Date(order.deliveryDate).toLocaleDateString()}
                    </div>
                )}
                </div>
                <div className="flex flex-col items-end gap-3 min-w-[120px]">
                <span className="text-xl font-bold text-gray-800">R$ {order.total.toFixed(2)}</span>
                {order.status === OrderStatus.PENDING && (
                    <button 
                        onClick={() => deliverOrder(order)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    >
                        Entregar
                    </button>
                )}
                </div>
            </div>
            ))
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] gap-6">
      
      {/* Tab Navigation */}
      <div className="flex gap-2 bg-gray-200/50 p-1 rounded-xl w-fit">
        <button 
          onClick={() => { setActiveTab('quick'); setShowNewOrder(false); }}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'quick' ? 'bg-white text-accent shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Zap size={18} /> PDV Rápido
        </button>
        <button 
          onClick={() => { setActiveTab('full'); setShowNewOrder(false); }}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'full' ? 'bg-white text-accent shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <CreditCard size={18} /> Venda Completa
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'orders' ? 'bg-white text-accent shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Package size={18} /> Encomendas
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'orders' && !showNewOrder ? (
        <div className="flex-1 overflow-y-auto">
            <OrdersList />
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
            {/* Product List */}
            <div className="lg:w-2/3 flex flex-col space-y-4 h-full">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-2">
                <Search className="text-gray-400" />
                <input 
                type="text" 
                placeholder="Buscar produtos..." 
                className="flex-1 outline-none text-gray-700"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <ProductGrid />
            </div>

            {/* Dynamic Cart Sidebar */}
            <CartSidebar />
        </div>
      )}
    </div>
  );
};