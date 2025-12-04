import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Product, CartItem, Transaction, TransactionType } from '../types';
import { ShoppingCart, Plus, Minus, Trash2, Search } from 'lucide-react';

export const Sales: React.FC = () => {
  const { products, addTransaction, updateStock } = useData();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

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

    // Create transaction
    const transaction: Transaction = {
      id: `TR-${Date.now()}`,
      description: `Venda PDV - ${cart.length} itens`,
      amount: total,
      type: TransactionType.INCOME,
      date: new Date().toISOString(),
      category: 'Vendas'
    };
    
    addTransaction(transaction);

    // Update stock
    cart.forEach(item => updateStock(item.id, item.quantity));

    setCart([]);
    alert('Venda realizada com sucesso!');
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)] gap-6">
      {/* Product List */}
      <div className="lg:w-2/3 flex flex-col space-y-4">
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
      </div>

      {/* Cart */}
      <div className="lg:w-1/3 bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <ShoppingCart className="text-accent" />
          <h2 className="font-bold text-gray-800">Carrinho de Compras</h2>
        </div>

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
            Finalizar Venda
          </button>
        </div>
      </div>
    </div>
  );
};