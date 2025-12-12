
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Product, CartItem, Transaction, TransactionType, SalesOrder, OrderStatus } from '../types';
import { 
  ShoppingCart, Plus, Minus, Search, ArrowLeft, CheckCircle, Trash2
} from 'lucide-react';

type PDVStep = 'products' | 'customer' | 'payment';

export const Sales: React.FC = () => {
  const { 
    products, customers, addTransaction, updateStock, addSalesOrder 
  } = useData();
  
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
  //           HELPERS & CALCULATIONS
  // ==========================================

  // Filter Products for PDV
  const filteredProducts = useMemo(() => {
    if (!pdvSearchTerm) return products;
    return products.filter(p => 
      p.name.toLowerCase().includes(pdvSearchTerm.toLowerCase()) || 
      p.id.includes(pdvSearchTerm)
    );
  }, [pdvSearchTerm, products]);

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

     // 2. Create Sales Order Record (Simplified for history)
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

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
         <div>
            <h1 className="text-2xl font-bold text-gray-800">PDV Rápido</h1>
            <p className="text-gray-500 text-sm">Venda de balcão ágil</p>
         </div>
      </div>

      {/* PDV Content */}
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
    </div>
  );
};
