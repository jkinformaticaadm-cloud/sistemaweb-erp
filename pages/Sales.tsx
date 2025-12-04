import React, { useState, useMemo, useRef } from 'react';
import { useData } from '../context/DataContext';
import { Product, CartItem, Transaction, TransactionType, SalesOrder, OrderStatus, TransactionDetails } from '../types';
import { ShoppingCart, Plus, Minus, Trash2, Search, Zap, User, Package, Calendar, Clock, CreditCard, Printer, CheckCircle, X, FileText } from 'lucide-react';

type SalesTab = 'quick' | 'full' | 'orders';
type SaleStage = 'input' | 'payment' | 'success';

export const Sales: React.FC = () => {
  const { products, customers, transactions, salesOrders, settings, addTransaction, updateStock, addSalesOrder, updateSalesOrder } = useData();
  
  // UI State
  const [activeTab, setActiveTab] = useState<SalesTab>('quick');
  const [saleStage, setSaleStage] = useState<SaleStage>('input');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Full Sale Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customName, setCustomName] = useState('');
  const [customAddress, setCustomAddress] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  
  // Device Specifics (for selling used phones/devices)
  const [deviceBrand, setDeviceBrand] = useState('');
  const [deviceIMEI, setDeviceIMEI] = useState('');
  const [deviceSerial, setDeviceSerial] = useState('');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('Dinheiro');
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);

  // Orders View State
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [orderDeliveryDate, setOrderDeliveryDate] = useState('');

  // --- Helpers & Logic ---

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) && p.stock > 0
  );

  const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedCustomerId(id);
    const customer = customers.find(c => c.id === id);
    if (customer) {
      setCustomName(customer.name);
      setCustomAddress(customer.address);
      setCustomPhone(customer.phone);
    } else {
      setCustomName('');
      setCustomAddress('');
      setCustomPhone('');
    }
  };

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

  const handleInitiatePayment = () => {
    if (cart.length === 0) return;
    setSaleStage('payment');
  };

  const handleFinalizeSale = () => {
    const isFullSale = activeTab === 'full';
    
    // Prepare Details
    const details: TransactionDetails = isFullSale ? {
        customerName: customName || 'Consumidor Final',
        customerAddress: customAddress,
        customerPhone: customPhone,
        deviceBrand,
        deviceIMEI,
        deviceSerial,
        items: [...cart],
        paymentMethod
    } : {
        customerName: 'Consumidor Final',
        items: [...cart],
        paymentMethod
    };

    const transaction: Transaction = {
      id: `TR-${Date.now()}`,
      description: isFullSale ? `Venda Completa - ${details.customerName}` : `PDV Rápido - ${cart.length} itens`,
      amount: total,
      type: TransactionType.INCOME,
      date: new Date().toISOString(),
      category: 'Vendas',
      transactionDetails: details
    };

    addTransaction(transaction);
    cart.forEach(item => updateStock(item.id, item.quantity));
    
    setLastTransaction(transaction);
    setSaleStage('success');
  };

  const handleCreateOrder = () => {
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
      cart.forEach(item => updateStock(item.id, item.quantity));
      
      resetSale();
      setShowNewOrder(false);
      alert('Encomenda criada com sucesso!');
  };

  const deliverOrder = (order: SalesOrder) => {
    const transaction: Transaction = {
      id: `TR-ENC-${order.id}`,
      description: `Entrega Encomenda ${order.id} - ${order.customerName}`,
      amount: order.total,
      type: TransactionType.INCOME,
      date: new Date().toISOString(),
      category: 'Vendas',
      transactionDetails: {
          customerName: order.customerName,
          items: order.items,
          paymentMethod: 'Encomenda'
      }
    };
    addTransaction(transaction);
    updateSalesOrder(order.id, { status: OrderStatus.DELIVERED });
    alert('Encomenda entregue e receita registrada!');
  };

  const resetSale = () => {
    setCart([]);
    setSelectedCustomerId('');
    setCustomName('');
    setCustomAddress('');
    setCustomPhone('');
    setDeviceBrand('');
    setDeviceIMEI('');
    setDeviceSerial('');
    setSaleStage('input');
    setLastTransaction(null);
  };

  // --- Printing Logic ---
  
  const printReceipt = (type: 'A4' | 'Thermal') => {
    if (!lastTransaction || !lastTransaction.transactionDetails) return;
    const { id, date, amount, transactionDetails } = lastTransaction;
    const { items, customerName, customerAddress, customerPhone, deviceBrand, deviceIMEI, deviceSerial, paymentMethod } = transactionDetails;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    const formattedDate = new Date(date).toLocaleString('pt-BR');

    let content = '';

    if (type === 'Thermal') {
        // Thermal 80mm Layout
        content = `
        <html>
        <head>
            <style>
                body { font-family: 'Courier New', monospace; width: 80mm; margin: 0; padding: 10px; font-size: 12px; }
                .center { text-align: center; }
                .line { border-bottom: 1px dashed #000; margin: 5px 0; }
                .bold { font-weight: bold; }
                .flex { display: flex; justify-content: space-between; }
            </style>
        </head>
        <body>
            <div class="center bold">${settings.companyName}</div>
            <div class="center">${settings.address}</div>
            <div class="center">Tel: ${settings.phone}</div>
            <div class="line"></div>
            <div class="center bold">CUPOM NÃO FISCAL</div>
            <div class="line"></div>
            <div>Data: ${formattedDate}</div>
            <div>Venda: ${id}</div>
            <div>Cliente: ${customerName}</div>
            <div class="line"></div>
            <div class="bold">ITEM  | QTD | VALOR</div>
            ${items?.map(i => `
                <div class="flex">
                    <span>${i.name.substring(0, 15)}</span>
                    <span>${i.quantity}x ${i.price.toFixed(2)}</span>
                </div>
            `).join('')}
            <div class="line"></div>
            <div class="flex bold" style="font-size: 14px">
                <span>TOTAL:</span>
                <span>R$ ${amount.toFixed(2)}</span>
            </div>
            <div class="line"></div>
            <div>Pagamento: ${paymentMethod}</div>
            ${deviceIMEI ? `<div>IMEI: ${deviceIMEI}</div>` : ''}
            <div class="center" style="margin-top: 20px;">Obrigado pela preferência!</div>
        </body>
        </html>`;
    } else {
        // A4 Layout
        content = `
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
                .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                .company-info h1 { margin: 0; color: #000; font-size: 24px; }
                .invoice-details { text-align: right; }
                .box { border: 1px solid #ddd; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
                .box-title { font-weight: bold; margin-bottom: 10px; color: #555; font-size: 14px; text-transform: uppercase; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                th { text-align: left; border-bottom: 2px solid #ddd; padding: 10px; background: #f9f9f9; }
                td { border-bottom: 1px solid #eee; padding: 10px; }
                .total-section { text-align: right; font-size: 20px; font-weight: bold; margin-top: 20px; }
                .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #eee; pt: 20px; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="company-info">
                    <h1>${settings.companyName}</h1>
                    <p>${settings.address}</p>
                    <p>${settings.phone} | ${settings.email}</p>
                    <p>CNPJ: ${settings.cnpj}</p>
                </div>
                <div class="invoice-details">
                    <h2>RECIBO DE VENDA</h2>
                    <p>#${id}</p>
                    <p>${formattedDate}</p>
                </div>
            </div>

            <div class="box">
                <div class="box-title">Dados do Cliente</div>
                <p><strong>Nome:</strong> ${customerName}</p>
                <p><strong>Telefone:</strong> ${customerPhone || '-'}</p>
                <p><strong>Endereço:</strong> ${customerAddress || '-'}</p>
            </div>

            ${(deviceIMEI || deviceSerial) ? `
            <div class="box">
                <div class="box-title">Detalhes do Dispositivo / Serviço</div>
                ${deviceBrand ? `<p><strong>Marca/Modelo:</strong> ${deviceBrand}</p>` : ''}
                ${deviceIMEI ? `<p><strong>IMEI:</strong> ${deviceIMEI}</p>` : ''}
                ${deviceSerial ? `<p><strong>Nº Série:</strong> ${deviceSerial}</p>` : ''}
            </div>
            ` : ''}

            <table>
                <thead>
                    <tr>
                        <th>Produto / Serviço</th>
                        <th>Qtd</th>
                        <th>Unitário</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${items?.map(i => `
                        <tr>
                            <td>${i.name}</td>
                            <td>${i.quantity}</td>
                            <td>R$ ${i.price.toFixed(2)}</td>
                            <td>R$ ${(i.price * i.quantity).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="total-section">
                TOTAL: R$ ${amount.toFixed(2)}
            </div>
            <div style="text-align: right; margin-top: 5px; color: #666; font-size: 14px;">
                Forma de Pagamento: ${paymentMethod}
            </div>

            <div class="footer">
                <p>Garantia de 90 dias para serviços prestados, conforme lei vigente.</p>
                <p>Documento não fiscal.</p>
            </div>
        </body>
        </html>`;
    }

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };


  // --- Components ---

  const ProductGrid = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
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

  const CartList = () => (
    <div className="flex-1 overflow-y-auto space-y-3 pr-2">
       {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <ShoppingCart size={32} className="mb-2 opacity-20" />
            <p className="text-sm">Carrinho vazio</p>
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
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
    </div>
  );

  // Success Screen
  if (saleStage === 'success') {
      return (
          <div className="h-full flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle size={40} />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Venda Realizada!</h2>
              <p className="text-gray-500 mb-8">A transação foi registrada com sucesso no financeiro.</p>
              
              <div className="flex gap-4">
                  <button 
                    onClick={() => printReceipt('A4')}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                  >
                      <FileText size={20} /> Imprimir A4
                  </button>
                  <button 
                    onClick={() => printReceipt('Thermal')}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                  >
                      <Printer size={20} /> Imprimir Térmica
                  </button>
                  <button 
                    onClick={resetSale}
                    className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl hover:bg-blue-600 font-bold transition-colors shadow-md"
                  >
                      <Plus size={20} /> Nova Venda
                  </button>
              </div>
          </div>
      );
  }

  // Payment Confirmation Modal
  if (saleStage === 'payment') {
      return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                  <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center">
                      <h2 className="text-xl font-bold text-gray-800">Finalizar Pagamento</h2>
                      <button onClick={() => setSaleStage('input')} className="text-gray-400 hover:text-gray-600">
                          <X size={24} />
                      </button>
                  </div>
                  <div className="p-6">
                      <div className="text-center mb-8">
                          <p className="text-gray-500 text-sm uppercase tracking-wide">Valor Total</p>
                          <p className="text-4xl font-bold text-gray-800">R$ {total.toFixed(2)}</p>
                      </div>

                      <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700">Forma de Pagamento</label>
                        <div className="grid grid-cols-2 gap-3">
                            {['Dinheiro', 'Crédito', 'Débito', 'Pix'].map(method => (
                            <button 
                                key={method}
                                onClick={() => setPaymentMethod(method)}
                                className={`py-3 rounded-lg border font-medium transition-all ${
                                paymentMethod === method 
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                {method}
                            </button>
                            ))}
                        </div>
                      </div>

                      <button 
                        onClick={handleFinalizeSale}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg mt-8 flex items-center justify-center gap-2"
                      >
                          <CheckCircle size={24} /> Confirmar Recebimento
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  const renderOrdersTab = () => (
    <div className="w-full space-y-4 h-full flex flex-col">
       <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800">Encomendas Pendentes</h2>
        <button 
          onClick={() => setShowNewOrder(true)}
          className="flex items-center gap-2 bg-accent hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} /> Nova Encomenda
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
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
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] gap-6">
      
      {/* Tab Navigation */}
      <div className="flex gap-2 bg-gray-200/50 p-1 rounded-xl w-fit">
        <button 
          onClick={() => { setActiveTab('quick'); setShowNewOrder(false); setSaleStage('input'); }}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'quick' ? 'bg-white text-accent shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Zap size={18} /> PDV Rápido
        </button>
        <button 
          onClick={() => { setActiveTab('full'); setShowNewOrder(false); setSaleStage('input'); }}
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

      {activeTab === 'orders' && !showNewOrder ? (
          renderOrdersTab()
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
            
            {/* Left Column (Inputs or Product Grid based on mode) */}
            <div className={`flex flex-col space-y-4 h-full ${activeTab === 'full' ? 'lg:w-1/2' : 'lg:w-2/3'}`}>
                
                {activeTab === 'full' && (
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-4 overflow-y-auto max-h-[40vh] lg:max-h-none">
                         <h3 className="font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                             <User size={18} /> Dados do Cliente
                         </h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Buscar Cliente Cadastrado</label>
                                <select 
                                    value={selectedCustomerId}
                                    onChange={handleCustomerSelect}
                                    className="w-full border rounded-lg p-2 bg-gray-50 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                                >
                                    <option value="">-- Selecione ou Preencha Abaixo --</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                             </div>
                             
                             <div className="md:col-span-2">
                                 <label className="block text-xs font-medium text-gray-500 mb-1">Nome Completo</label>
                                 <input 
                                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                                    value={customName}
                                    onChange={e => setCustomName(e.target.value)}
                                    placeholder="Nome do Cliente"
                                 />
                             </div>
                             <div>
                                 <label className="block text-xs font-medium text-gray-500 mb-1">WhatsApp / Telefone</label>
                                 <input 
                                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                                    value={customPhone}
                                    onChange={e => setCustomPhone(e.target.value)}
                                    placeholder="(00) 00000-0000"
                                 />
                             </div>
                              <div className="md:col-span-2">
                                 <label className="block text-xs font-medium text-gray-500 mb-1">Endereço Completo</label>
                                 <input 
                                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                                    value={customAddress}
                                    onChange={e => setCustomAddress(e.target.value)}
                                    placeholder="Rua, Número, Bairro"
                                 />
                             </div>
                         </div>

                         <h3 className="font-bold text-gray-800 border-b pb-2 pt-2 flex items-center gap-2">
                             <Zap size={18} /> Detalhes do Dispositivo (Opcional)
                         </h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                 <label className="block text-xs font-medium text-gray-500 mb-1">Marca / Modelo</label>
                                 <input 
                                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                                    value={deviceBrand}
                                    onChange={e => setDeviceBrand(e.target.value)}
                                    placeholder="Ex: iPhone 12"
                                 />
                             </div>
                             <div>
                                 <label className="block text-xs font-medium text-gray-500 mb-1">Nº de Série</label>
                                 <input 
                                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                                    value={deviceSerial}
                                    onChange={e => setDeviceSerial(e.target.value)}
                                    placeholder="Serial Number"
                                 />
                             </div>
                             <div className="md:col-span-2">
                                 <label className="block text-xs font-medium text-gray-500 mb-1">IMEI</label>
                                 <input 
                                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                                    value={deviceIMEI}
                                    onChange={e => setDeviceIMEI(e.target.value)}
                                    placeholder="IMEI do aparelho"
                                 />
                             </div>
                         </div>
                    </div>
                )}
                
                {/* Product Search & Grid */}
                <div className="flex-1 flex flex-col space-y-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-2">
                        <Search className="text-gray-400" />
                        <input 
                        type="text" 
                        placeholder="Adicionar produtos ao carrinho..." 
                        className="flex-1 outline-none text-gray-700"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto">
                         <ProductGrid />
                    </div>
                </div>
            </div>

            {/* Right Column (Cart & Totals) */}
            <div className={`lg:w-1/3 bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden h-full ${activeTab === 'full' ? 'lg:w-1/2' : ''}`}>
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                    <ShoppingCart className="text-accent" />
                    <h2 className="font-bold text-gray-800">
                    {activeTab === 'orders' || showNewOrder ? 'Nova Encomenda' : 'Resumo do Pedido'}
                    </h2>
                </div>

                {/* Extra field for Order Date if applicable */}
                {activeTab === 'orders' && showNewOrder && (
                     <div className="p-4 bg-orange-50 border-b border-orange-100">
                       <label className="text-xs font-semibold text-orange-800 uppercase mb-1 block">Previsão Entrega</label>
                       <input 
                          type="date" 
                          value={orderDeliveryDate}
                          onChange={e => setOrderDeliveryDate(e.target.value)}
                          className="w-full p-2 text-sm rounded-lg border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                       />
                     </div>
                )}

                <div className="flex-1 overflow-y-auto p-4">
                    <CartList />
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-gray-600 text-lg">Total</span>
                        <span className="text-3xl font-bold text-gray-800">R$ {total.toFixed(2)}</span>
                    </div>
                    
                    {activeTab === 'orders' || showNewOrder ? (
                         <button 
                         disabled={cart.length === 0}
                         onClick={handleCreateOrder}
                         className="w-full bg-accent hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold text-lg shadow-md hover:shadow-lg transition-all"
                       >
                         Salvar Encomenda
                       </button>
                    ) : (
                        <button 
                            disabled={cart.length === 0}
                            onClick={handleInitiatePayment}
                            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2"
                        >
                            <span>Finalizar e Ir para Pagamento</span>
                            <Zap size={20} fill="currentColor" />
                        </button>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};