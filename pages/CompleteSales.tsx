
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { SalesOrder, OrderStatus, OSItem, Transaction, TransactionType } from '../types';
import { 
  Package, Search, User, Plus, Trash2, Save, X, MessageCircle, Edit, Printer, ShoppingCart
} from 'lucide-react';

export const CompleteSales: React.FC = () => {
  const { 
    products, customers, salesOrders, settings, 
    addTransaction, updateStock, addSalesOrder, updateSalesOrder 
  } = useData();

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

  // Filter Sales Orders
  const filteredOrders = useMemo(() => {
     return salesOrders.filter(o => 
        o.customerName.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
        o.id.includes(orderSearchTerm) ||
        o.status.toLowerCase().includes(orderSearchTerm.toLowerCase())
     ).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [salesOrders, orderSearchTerm]);

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
             // Lógica simples de parse se necessário
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
              discount: 0 // Simplificação
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
  };

  return (
    <div className="space-y-6 animate-fade-in">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
             <div>
                <h1 className="text-2xl font-bold text-gray-800">Venda Completa (Pedidos)</h1>
                <p className="text-gray-500 text-sm">Gerenciamento detalhado de encomendas e vendas com entrega</p>
             </div>
        </div>

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
