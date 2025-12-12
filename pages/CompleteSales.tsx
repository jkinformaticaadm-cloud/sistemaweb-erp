
import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { SalesOrder, OrderStatus, OSItem, Transaction, TransactionType } from '../types';
import { 
  Plus, Search, FileText, X, Package, ShoppingBag, 
  Printer, Smartphone, User, Trash2, Edit, MessageCircle, DollarSign, CreditCard, ShieldCheck, Download
} from 'lucide-react';

export const CompleteSales: React.FC = () => {
  const { 
    salesOrders, customers, products, services, settings, addTransaction,
    addSalesOrder, updateSalesOrder 
  } = useData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [printingSale, setPrintingSale] = useState<SalesOrder | null>(null);
  const [editingSale, setEditingSale] = useState<SalesOrder | null>(null);

  // --- Handle ESC Key ---
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (printingSale) {
            setPrintingSale(null);
        } else if (isModalOpen) {
            setIsModalOpen(false);
            setEditingSale(null);
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [printingSale, isModalOpen]);

  // --- Printing Component ---
  const SalePrintModal = () => {
    if (!printingSale) return null;
    const client = customers.find(c => c.id === printingSale.customerId);

    return (
       <div id="sales-print-modal" className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-4xl min-h-[90vh] shadow-2xl overflow-hidden flex flex-col print:shadow-none print:w-full print:h-auto print:min-h-0 print:overflow-visible">
              
              {/* Header Actions (Hidden on Print) */}
              <div className="bg-gray-800 text-white p-4 flex justify-between items-center print:hidden sticky top-0 z-10 shrink-0">
                 <h2 className="font-bold flex items-center gap-2"><Printer size={20}/> Visualização de Impressão</h2>
                 <button onClick={() => setPrintingSale(null)} className="hover:text-gray-300"><X size={24}/></button>
              </div>

              {/* Printable Content */}
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
                       <h2 className="text-3xl font-bold text-gray-800">PEDIDO DE VENDA</h2>
                       <p className="text-xl font-mono text-gray-600 mt-1">#{printingSale.id}</p>
                       <p className="text-sm text-gray-500 mt-2">Data: {new Date(printingSale.createdAt).toLocaleDateString()}</p>
                       <p className={`text-sm font-bold uppercase mt-1 px-2 py-0.5 inline-block rounded border border-gray-400 text-gray-600`}>
                          {printingSale.status}
                       </p>
                    </div>
                 </div>

                 {/* Client Data Only */}
                 <div className="border border-gray-300 rounded-lg p-4">
                    <h3 className="font-bold border-b border-gray-200 pb-2 mb-3 flex items-center gap-2 uppercase text-sm bg-gray-50 -mx-4 -mt-4 p-2 rounded-t-lg">
                       <User size={16}/> Dados do Cliente
                    </h3>
                    <div className="space-y-1 text-sm">
                       <p><span className="font-bold">Nome:</span> {client?.name || printingSale.customerName}</p>
                       <p><span className="font-bold">Telefone:</span> {client?.phone}</p>
                       <p><span className="font-bold">Endereço:</span> {client?.address}, {client?.addressNumber}</p>
                    </div>
                 </div>

                 {/* Items Details */}
                 <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 p-2 font-bold uppercase text-sm text-center border-b border-gray-300">Itens da Venda</div>
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
                             {printingSale.items.map((item, idx) => (
                                <tr key={idx} className="border-b border-gray-50 last:border-0">
                                   <td className="p-2">
                                       <span className="font-bold block">{item.name}</span>
                                       {item.details && <span className="text-[10px] text-gray-500 block mt-0.5 whitespace-pre-wrap">{item.details}</span>}
                                   </td>
                                   <td className="p-2 text-center uppercase">{item.type === 'product' ? 'Produto' : 'Serviço'}</td>
                                   <td className="p-2 text-center">{item.quantity}</td>
                                   <td className="p-2 text-right">R$ {item.unitPrice.toFixed(2)}</td>
                                   <td className="p-2 text-right">R$ {item.total.toFixed(2)}</td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </div>

                 {/* Observations & Warranty */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-300 rounded-lg p-4">
                        <h3 className="font-bold border-b border-gray-200 pb-2 mb-3 uppercase text-sm bg-gray-50 -mx-4 -mt-4 p-2 rounded-t-lg">
                        Observações / Descrição
                        </h3>
                        <p className="text-sm whitespace-pre-wrap min-h-[40px]">{printingSale.description || 'Sem observações.'}</p>
                    </div>
                    <div className="border border-gray-300 rounded-lg p-4">
                        <h3 className="font-bold border-b border-gray-200 pb-2 mb-3 uppercase text-sm bg-gray-50 -mx-4 -mt-4 p-2 rounded-t-lg flex items-center gap-2">
                           <ShieldCheck size={16}/> Termos de Garantia
                        </h3>
                        <p className="text-sm">
                           Garantia Aplicada: <span className="font-bold text-gray-900">{printingSale.warranty}</span>
                        </p>
                        <p className="text-[10px] text-gray-500 mt-2 text-justify leading-tight">
                           A garantia cobre defeitos de fabricação e funcionamento das peças substituídas ou produtos vendidos. Não cobre danos causados por mau uso, quedas, contato com líquidos ou oxidação.
                        </p>
                    </div>
                 </div>

                 {/* Financials */}
                 <div className="flex justify-end">
                    <div className="w-1/2 border border-gray-300 rounded-lg overflow-hidden">
                       <div className="bg-gray-50 p-2 font-bold uppercase text-sm text-center border-b border-gray-300">Totalização</div>
                       <div className="p-4 space-y-2">
                          {printingSale.paymentMethod && (
                             <div className="flex justify-between text-xs text-gray-600">
                                <span>Forma de Pagamento</span>
                                <span className="font-bold">{printingSale.paymentMethod}</span>
                             </div>
                          )}
                          <div className="flex justify-between text-2xl font-bold pt-2 mt-2 text-gray-900 border-t border-gray-100">
                             <span>Total a Pagar</span>
                             <span>R$ {printingSale.totalValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Signature */}
                 <div className="grid grid-cols-2 gap-16 mt-16 pt-8">
                    <div className="text-center">
                       <div className="border-t border-black w-3/4 mx-auto mb-2"></div>
                       <p className="text-sm font-bold uppercase">{client?.name || 'Assinatura do Cliente'}</p>
                    </div>
                    <div className="text-center">
                       <div className="border-t border-black w-3/4 mx-auto mb-2"></div>
                       <p className="text-sm font-bold uppercase">{settings.companyName}</p>
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

  // --- Form Modal ---
  const SalesFormModal = () => {
     // ... (Existing implementation, just ensure no inline CSS conflicts if any)
     const [formData, setFormData] = useState<Partial<SalesOrder>>({
        customerId: '',
        description: '',
        warranty: '90 Dias',
        status: OrderStatus.PENDING,
        items: [],
        paymentMethod: ''
     });

     const [addedItems, setAddedItems] = useState<OSItem[]>([]);
     
     // Product Selection States
     const [selectedProductId, setSelectedProductId] = useState('');
     const [productQty, setProductQty] = useState(1);
     const [productPrice, setProductPrice] = useState(0);
     const [productImeiInput, setProductImeiInput] = useState(''); // Manual IMEI input
     const [productColor, setProductColor] = useState(''); // Manual Color input

     // Credit Card Logic
     const [selectedPaymentBase, setSelectedPaymentBase] = useState(''); // Holds 'Dinheiro', 'Crédito', etc.
     const [creditMode, setCreditMode] = useState<'vista' | 'parcelado'>('vista');
     const [installments, setInstallments] = useState(1);

     // Init for Edit
     useEffect(() => {
        if (editingSale) {
           setFormData({ ...editingSale });
           setAddedItems(editingSale.items || []);
           // Basic logic to try and parse payment method if editing
           if (editingSale.paymentMethod?.includes('Crédito')) {
              setSelectedPaymentBase('Cartão de Crédito');
              // Would need regex to parse installments, keeping simple for now
           } else {
              setSelectedPaymentBase(editingSale.paymentMethod || '');
           }
        }
     }, []);

     const totalValue = addedItems.reduce((acc, item) => acc + item.total, 0);

     const addItem = (item: OSItem) => setAddedItems([...addedItems, item]);
     const removeItem = (index: number) => {
        const newItems = [...addedItems];
        newItems.splice(index, 1);
        setAddedItems(newItems);
     };

     const handleAddProduct = () => {
        const prod = products.find(p => p.id === selectedProductId);
        if (prod) {
           let detailString = '';
           const specs = [];
           
           if (prod.brand) specs.push(prod.brand);
           if (prod.model) specs.push(prod.model);
           
           // Color Logic: Use manual input if provided, else product default
           if (productColor) specs.push(`Cor: ${productColor}`);
           else if (prod.color) specs.push(prod.color);

           if (prod.storage) specs.push(prod.storage);
           if (prod.condition) specs.push(prod.condition);
           
           if (specs.length > 0) detailString += specs.join(' - ');

           const finalImei = productImeiInput || prod.imei;
           if (finalImei) {
              detailString += ` | IMEI/Serial: ${finalImei}`;
           }

           addItem({
              id: prod.id,
              name: prod.name,
              details: detailString,
              quantity: productQty,
              unitPrice: productPrice,
              total: productPrice * productQty,
              type: 'product'
           });
           
           // Reset fields
           setSelectedProductId('');
           setProductQty(1);
           setProductPrice(0);
           setProductImeiInput('');
           setProductColor('');
        }
     };

     const submit = (e: React.FormEvent, finalize = false) => {
        e.preventDefault();
        const customer = customers.find(c => c.id === formData.customerId);
        if (!customer) return alert("Selecione um cliente");

        if (finalize && !selectedPaymentBase) {
           return alert("Selecione a forma de pagamento para finalizar e receber.");
        }

        // Construct final Payment String
        let finalPaymentMethod = selectedPaymentBase;
        if (selectedPaymentBase === 'Cartão de Crédito') {
           if (creditMode === 'vista') {
              finalPaymentMethod = 'Crédito - À Vista';
           } else {
              const instValue = totalValue / installments;
              finalPaymentMethod = `Crédito - ${installments}x de R$ ${instValue.toFixed(2)}`;
           }
        }

        const finalStatus = finalize ? OrderStatus.FINISHED : (formData.status || OrderStatus.PENDING);

        const saleData: SalesOrder = {
           id: editingSale ? editingSale.id : `V-${Date.now().toString().slice(-6)}`,
           customerId: customer.id,
           customerName: customer.name,
           description: formData.description,
           status: finalStatus,
           createdAt: editingSale ? editingSale.createdAt : new Date().toISOString(),
           totalValue: totalValue,
           warranty: formData.warranty,
           items: addedItems,
           paymentMethod: finalPaymentMethod
        };

        if (editingSale) updateSalesOrder(editingSale.id, saleData);
        else addSalesOrder(saleData);

        if (finalize && finalStatus === OrderStatus.FINISHED) {
            const transaction: Transaction = {
               id: `TR-VS-${saleData.id}`,
               description: `Venda Completa #${saleData.id} - ${saleData.customerName}`,
               amount: totalValue,
               type: TransactionType.INCOME,
               date: new Date().toISOString(),
               category: 'Vendas',
               transactionDetails: {
                  customerName: saleData.customerName,
                  paymentMethod: saleData.paymentMethod,
                  items: saleData.items.map(i => ({...i} as any))
               }
            };
            addTransaction(transaction);
            alert("Venda finalizada e lançada no financeiro!");
        }

        setIsModalOpen(false);
        setEditingSale(null);
     };

     // Get Available Installments from Settings
     const machine = settings.paymentMachines && settings.paymentMachines.length > 0 ? settings.paymentMachines[0] : null;
     const availableInstallments = machine ? machine.creditRates.filter(r => r.installments > 1) : [];

     return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
         <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10 shadow-sm shrink-0">
               <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <ShoppingBag className="text-green-600"/> {editingSale ? `Editar Venda #${editingSale.id}` : 'Nova Venda Completa'}
               </h2>
               <button onClick={() => { setIsModalOpen(false); setEditingSale(null); }}><X className="text-gray-400 hover:text-gray-600"/></button>
            </div>
            
            <form className="p-6 space-y-6 flex-1 overflow-y-auto">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <label className="label">Cliente</label>
                     <select required className="input" value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value})} disabled={!!editingSale}>
                        <option value="">Selecione o cliente...</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                     </select>
                  </div>
                  <div>
                     <label className="label">Status Atual</label>
                     <select className="input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                        <option value={OrderStatus.PENDING}>Pendente</option>
                        <option value={OrderStatus.READY}>Pronto</option>
                        <option value={OrderStatus.DELIVERED}>Entregue</option>
                        <option value={OrderStatus.FINISHED}>Finalizado</option>
                        <option value={OrderStatus.CANCELLED}>Cancelado</option>
                     </select>
                  </div>
               </div>

               <hr className="border-gray-100" />

               {/* Items Section */}
               <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><Package size={18}/> Adicionar Itens</h3>
                  <div className="flex flex-col gap-3">
                     <div className="flex flex-col md:flex-row gap-2">
                        <div className="flex-1 w-full">
                           <label className="label">Produto</label>
                           <select 
                              className="input text-sm" 
                              value={selectedProductId} 
                              onChange={e => {
                                 setSelectedProductId(e.target.value);
                                 const p = products.find(prod => prod.id === e.target.value);
                                 if (p) setProductPrice(p.price);
                              }}
                           >
                              <option value="">Selecione...</option>
                              {products.map(p => <option key={p.id} value={p.id}>{p.name} (Est: {p.stock})</option>)}
                           </select>
                        </div>
                        <div className="w-full md:w-32">
                           <label className="label">Cor</label>
                           <input className="input text-sm" placeholder="Ex: Preto" value={productColor} onChange={e => setProductColor(e.target.value)} />
                        </div>
                        <div className="w-full md:w-48">
                           <label className="label">IMEI/Serial (Opcional)</label>
                           <input className="input text-sm" placeholder="Ex: 3544..." value={productImeiInput} onChange={e => setProductImeiInput(e.target.value)} />
                        </div>
                     </div>
                     <div className="flex gap-2 items-end">
                        <div className="w-20">
                           <label className="label">Qtd</label>
                           <input type="number" className="input text-sm" value={productQty} onChange={e => setProductQty(Number(e.target.value))}/>
                        </div>
                        <div className="w-32">
                           <label className="label">Valor (R$)</label>
                           <input type="number" className="input text-sm" value={productPrice} onChange={e => setProductPrice(Number(e.target.value))}/>
                        </div>
                        <button type="button" onClick={handleAddProduct} className="bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 mb-0.5 flex-1 md:flex-none"><Plus size={20}/></button>
                     </div>
                  </div>
               </div>

               <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm text-left">
                     <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs">
                        <tr>
                           <th className="p-3">Item</th>
                           <th className="p-3 text-center">Qtd</th>
                           <th className="p-3 text-right">Unit.</th>
                           <th className="p-3 text-right">Total</th>
                           <th className="p-3 text-center"></th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {addedItems.map((item, idx) => (
                           <tr key={idx} className="hover:bg-gray-50">
                              <td className="p-3">
                                 <p className="font-bold text-gray-800">{item.name}</p>
                                 {item.details && <p className="text-xs text-gray-500 mt-0.5">{item.details}</p>}
                              </td>
                              <td className="p-3 text-center">{item.quantity}</td>
                              <td className="p-3 text-right">R$ {item.unitPrice.toFixed(2)}</td>
                              <td className="p-3 text-right font-medium">R$ {item.total.toFixed(2)}</td>
                              <td className="p-3 text-center"><button type="button" onClick={() => removeItem(idx)} className="text-gray-400 hover:text-red-600"><Trash2 size={16}/></button></td>
                           </tr>
                        ))}
                     </tbody>
                     <tfoot className="bg-gray-50 font-bold text-gray-800">
                        <tr>
                           <td colSpan={3} className="p-3 text-right">TOTAL:</td>
                           <td className="p-3 text-right text-lg text-blue-700">R$ {totalValue.toFixed(2)}</td>
                           <td></td>
                        </tr>
                     </tfoot>
                  </table>
               </div>

               <div>
                  <label className="label">Descrição / Observações da Venda</label>
                  <textarea className="input min-h-[60px]" placeholder="Detalhes adicionais..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}/>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <label className="label">Garantia</label>
                     <select className="input" value={formData.warranty} onChange={e => setFormData({...formData, warranty: e.target.value})}>
                        <option>Sem garantia</option>
                        <option>30 Dias</option>
                        <option>90 Dias</option>
                        <option>1 Ano</option>
                     </select>
                  </div>
                  <div>
                     <label className="label flex items-center gap-1"><CreditCard size={14}/> Forma de Pagamento</label>
                     <select 
                        className="input font-bold text-gray-700" 
                        value={selectedPaymentBase} 
                        onChange={e => setSelectedPaymentBase(e.target.value)}
                     >
                        <option value="">Selecione...</option>
                        <option>Dinheiro</option>
                        <option>Pix</option>
                        <option>Cartão de Crédito</option>
                        <option>Cartão de Débito</option>
                        <option>Crediário</option>
                     </select>

                     {/* Credit Card Specific Options */}
                     {selectedPaymentBase === 'Cartão de Crédito' && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg animate-fade-in">
                           <p className="text-xs font-bold text-blue-800 uppercase mb-2">Condição de Pagamento</p>
                           <div className="flex gap-4 mb-3">
                              <label className="flex items-center gap-2 cursor-pointer text-sm">
                                 <input 
                                    type="radio" name="creditMode" 
                                    checked={creditMode === 'vista'} 
                                    onChange={() => setCreditMode('vista')} 
                                 /> À Vista
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer text-sm">
                                 <input 
                                    type="radio" name="creditMode" 
                                    checked={creditMode === 'parcelado'} 
                                    onChange={() => setCreditMode('parcelado')} 
                                 /> Parcelado
                              </label>
                           </div>

                           {creditMode === 'parcelado' && (
                              <div className="animate-fade-in">
                                 <label className="block text-xs font-bold text-gray-500 mb-1">Parcelas Disponíveis</label>
                                 <select 
                                    className="w-full border p-2 rounded text-sm bg-white"
                                    value={installments}
                                    onChange={e => setInstallments(Number(e.target.value))}
                                 >
                                    {availableInstallments.map(opt => {
                                       const installmentVal = totalValue / opt.installments;
                                       return (
                                          <option key={opt.installments} value={opt.installments}>
                                             {opt.installments}x de R$ {installmentVal.toFixed(2)}
                                          </option>
                                       );
                                    })}
                                    {availableInstallments.length === 0 && <option value="2">2x (Padrão)</option>}
                                 </select>
                              </div>
                           )}
                        </div>
                     )}
                  </div>
               </div>

               <div className="flex flex-col md:flex-row justify-end pt-6 border-t border-gray-100 gap-3 shrink-0">
                  <button type="button" onClick={() => { setIsModalOpen(false); setEditingSale(null); }} className="px-6 py-3 rounded-lg font-medium text-gray-600 hover:bg-gray-100 border border-gray-200">Cancelar</button>
                  
                  <button 
                     onClick={(e) => submit(e, false)} 
                     className="bg-blue-50 text-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-blue-100 transition-colors"
                  >
                     Salvar Rascunho
                  </button>

                  <button 
                     onClick={(e) => submit(e, true)} 
                     className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 shadow-md flex items-center gap-2"
                  >
                     <DollarSign size={20}/> Receber / Finalizar
                  </button>
               </div>
            </form>
         </div>
      </div>
     );
  };

  // --- Main List Render ---
  const filteredSales = salesOrders.filter(sale => 
     sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     sale.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleWhatsApp = (sale: SalesOrder) => {
     const client = customers.find(c => c.id === sale.customerId);
     if (!client) return alert('Cliente não encontrado');
     const phone = client.phone.replace(/\D/g, '');
     const msg = `Olá ${client.name}, aqui é da TechFix. Segue o resumo do seu pedido #${sale.id}. Valor Total: R$ ${sale.totalValue.toFixed(2)}.`;
     window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-fade-in">
       {/* Header - Hidden on Print */}
       <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-100 shadow-sm print:hidden">
          <div>
             <h2 className="text-xl font-bold text-gray-800">Vendas Completas</h2>
             <p className="text-sm text-gray-500">Gestão detalhada de pedidos de venda com garantia e controle de IMEI.</p>
          </div>
          <button 
             onClick={() => setIsModalOpen(true)}
             className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 shadow-sm font-medium"
          >
             <Plus size={20} /> Novo Pedido
          </button>
       </div>

       {/* Search - Hidden on Print */}
       <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 flex items-center gap-2 print:hidden">
          <Search size={20} className="text-gray-400 ml-2" />
          <input 
             type="text" 
             placeholder="Buscar por cliente, ID..." 
             className="flex-1 outline-none text-gray-700 h-10 bg-transparent"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
          />
       </div>

       {/* List - Hidden on Print */}
       <div className="grid grid-cols-1 gap-4 print:hidden">
          {filteredSales.length === 0 ? (
             <div className="text-center p-12 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
                <ShoppingBag size={48} className="mx-auto mb-3 opacity-20"/>
                <p>Nenhuma venda encontrada.</p>
             </div>
          ) : (
             filteredSales.map(sale => (
                <div key={sale.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-center gap-4">
                   <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                         <span className="font-mono text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{sale.id}</span>
                         <span className="text-xs text-gray-400">{new Date(sale.createdAt).toLocaleDateString()}</span>
                         <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${sale.status === OrderStatus.FINISHED ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>{sale.status}</span>
                      </div>
                      <h3 className="font-bold text-gray-800 text-lg">{sale.customerName}</h3>
                      <p className="text-sm text-gray-600 mt-1">{sale.items.length} itens no pedido</p>
                   </div>

                   <div className="flex flex-col items-end gap-1 min-w-[120px]">
                      <span className="text-xs text-gray-400 uppercase font-bold">Valor Total</span>
                      <span className="text-xl font-bold text-blue-600">R$ {sale.totalValue.toFixed(2)}</span>
                   </div>

                   <div className="flex items-center gap-2 border-l border-gray-100 pl-4 md:pl-6">
                      <button 
                         onClick={() => { setEditingSale(sale); setIsModalOpen(true); }}
                         className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                         title="Editar / Finalizar"
                      >
                         <Edit size={18}/>
                      </button>
                      <button 
                         onClick={() => setPrintingSale(sale)}
                         className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                         title="Imprimir Comprovante"
                      >
                         <Printer size={18}/>
                      </button>
                      <button 
                         onClick={() => handleWhatsApp(sale)}
                         className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                         title="Enviar no WhatsApp"
                      >
                         <MessageCircle size={18}/>
                      </button>
                   </div>
                </div>
             ))
          )}
       </div>

       {/* Modals */}
       {isModalOpen && <SalesFormModal />}
       <SalePrintModal />

       <style>{`
          .label { @apply block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1; }
          .input { @apply w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-shadow; }
          
          @media print {
            body * {
               visibility: hidden;
            }
            #sales-print-modal, #sales-print-modal * {
               visibility: visible;
            }
            #sales-print-modal {
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
            #sales-print-modal > div {
               height: auto !important;
               overflow: visible !important;
            }
         }
       `}</style>
    </div>
  );
};
