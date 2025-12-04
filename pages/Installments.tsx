
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { InstallmentPlan, Installment } from '../types';
import { Search, Plus, Calendar, CheckCircle, AlertCircle, DollarSign, ChevronDown, ChevronUp, Edit2 } from 'lucide-react';

export const Installments: React.FC = () => {
  const { installmentPlans, customers, addInstallmentPlan, payInstallment, updateInstallmentValue } = useData();
  
  const [activeTab, setActiveTab] = useState<'list' | 'new'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [imei, setImei] = useState('');
  const [totalValue, setTotalValue] = useState('');
  const [installmentsCount, setInstallmentsCount] = useState('3');
  const [frequency, setFrequency] = useState<'Semanal' | 'Mensal'>('Mensal');
  const [customFee, setCustomFee] = useState('0');

  // Computed for Form
  const selectedCustomer = customers.find(c => c.id === customerId);

  // Filtered List
  const filteredPlans = useMemo(() => {
    return installmentPlans.filter(plan => 
      plan.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.id.includes(searchTerm)
    );
  }, [installmentPlans, searchTerm]);

  // Helpers
  const getClientStatus = (plan: InstallmentPlan) => {
    const today = new Date();
    const hasOverdue = plan.installments.some(inst => 
      inst.status !== 'Pago' && new Date(inst.dueDate) < today
    );
    const isFinished = plan.installments.every(inst => inst.status === 'Pago');

    if (isFinished) return { label: 'Quitado', color: 'bg-green-100 text-green-700' };
    if (hasOverdue) return { label: 'Inadimplente', color: 'bg-red-100 text-red-700' };
    return { label: 'Em Dia', color: 'bg-blue-100 text-blue-700' };
  };

  const calculateFinancials = (plan: InstallmentPlan) => {
    const total = plan.totalValue;
    const paid = plan.installments.filter(i => i.status === 'Pago').reduce((acc, i) => acc + i.value, 0);
    const remaining = plan.installments.filter(i => i.status !== 'Pago').reduce((acc, i) => acc + i.value, 0);
    return { total, paid, remaining };
  };

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return alert('Selecione um cliente');

    const amount = parseFloat(totalValue) || 0;
    const count = parseInt(installmentsCount) || 1;
    const fee = parseFloat(customFee) || 0;
    
    // Simple logic: Fee is added to total, then divided
    const finalAmount = amount + fee;
    const installmentValue = finalAmount / count;

    const newInstallments: Installment[] = Array.from({ length: count }, (_, i) => {
       const date = new Date();
       if (frequency === 'Semanal') date.setDate(date.getDate() + ((i + 1) * 7));
       else date.setMonth(date.getMonth() + (i + 1));
       
       return {
          number: i + 1,
          value: installmentValue,
          dueDate: date.toISOString(),
          status: 'Pendente'
       };
    });

    const newPlan: InstallmentPlan = {
       id: `CRED-${Date.now().toString().slice(-6)}`,
       customerId: selectedCustomer.id,
       customerName: selectedCustomer.name,
       customerAddress: `${selectedCustomer.address}, ${selectedCustomer.addressNumber || ''}`,
       productName,
       brand,
       model,
       serialNumber,
       imei,
       totalValue: finalAmount,
       frequency,
       customFee: fee,
       createdAt: new Date().toISOString(),
       installments: newInstallments
    };

    addInstallmentPlan(newPlan);
    alert('Crediário criado com sucesso!');
    setActiveTab('list');
    // Reset form
    setCustomerId(''); setProductName(''); setBrand(''); setModel(''); setSerialNumber(''); setImei(''); setTotalValue(''); setCustomFee('0');
  };

  const handleEditValue = (planId: string, instNum: number, currentVal: number) => {
     const newValStr = prompt('Novo valor da parcela:', currentVal.toString());
     if (newValStr !== null) {
        const newVal = parseFloat(newValStr);
        if (!isNaN(newVal) && newVal > 0) {
           updateInstallmentValue(planId, instNum, newVal);
        }
     }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Crediário / Carnê</h1>
        <div className="flex gap-2">
            <button 
               onClick={() => setActiveTab('list')}
               className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'list' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 border'}`}
            >
               Listagem
            </button>
            <button 
               onClick={() => setActiveTab('new')}
               className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'new' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 border'}`}
            >
               <Plus size={18} /> Novo Crediário
            </button>
        </div>
      </div>

      {activeTab === 'list' ? (
         <div className="space-y-6">
            <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 flex items-center gap-2">
               <Search size={20} className="text-gray-400 ml-2" />
               <input 
                  type="text" 
                  placeholder="Buscar por cliente, produto..." 
                  className="flex-1 outline-none text-gray-700 h-10 bg-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>

            <div className="space-y-4">
               {filteredPlans.map(plan => {
                  const status = getClientStatus(plan);
                  const fin = calculateFinancials(plan);
                  const isExpanded = expandedPlanId === plan.id;

                  return (
                     <div key={plan.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div 
                           className="p-4 flex flex-col md:flex-row items-center justify-between cursor-pointer hover:bg-gray-50"
                           onClick={() => setExpandedPlanId(isExpanded ? null : plan.id)}
                        >
                           <div className="flex items-center gap-4 flex-1">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${status.color.replace('text-', 'bg-').replace('100', '500').replace('700', '100')} text-white`}>
                                 {plan.customerName.charAt(0)}
                              </div>
                              <div>
                                 <h3 className="font-bold text-gray-800">{plan.customerName}</h3>
                                 <p className="text-xs text-gray-500">{plan.productName} - {plan.model}</p>
                              </div>
                           </div>

                           <div className="flex items-center gap-6 mt-4 md:mt-0">
                              <div className="text-center">
                                 <p className="text-xs text-gray-400 uppercase">Recebido</p>
                                 <p className="font-bold text-green-600">R$ {fin.paid.toFixed(2)}</p>
                              </div>
                              <div className="text-center">
                                 <p className="text-xs text-gray-400 uppercase">A Receber</p>
                                 <p className="font-bold text-red-600">R$ {fin.remaining.toFixed(2)}</p>
                              </div>
                              <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${status.color}`}>
                                 {status.label}
                              </div>
                              {isExpanded ? <ChevronUp size={20} className="text-gray-400"/> : <ChevronDown size={20} className="text-gray-400"/>}
                           </div>
                        </div>

                        {isExpanded && (
                           <div className="bg-gray-50 border-t border-gray-100 p-6 animate-fade-in">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                 <div>
                                    <h4 className="font-bold text-gray-700 mb-2 text-sm uppercase">Dados do Cliente</h4>
                                    <p className="text-sm text-gray-600">{plan.customerAddress}</p>
                                 </div>
                                 <div>
                                    <h4 className="font-bold text-gray-700 mb-2 text-sm uppercase">Dados do Produto</h4>
                                    <p className="text-sm text-gray-600">
                                       <strong>Marca:</strong> {plan.brand} | <strong>Serial:</strong> {plan.serialNumber || '-'} | <strong>IMEI:</strong> {plan.imei || '-'}
                                    </p>
                                 </div>
                              </div>

                              <h4 className="font-bold text-gray-700 mb-3 text-sm uppercase">Parcelas</h4>
                              <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                                 <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-100 text-gray-500 text-xs uppercase">
                                       <tr>
                                          <th className="px-4 py-3">#</th>
                                          <th className="px-4 py-3">Vencimento</th>
                                          <th className="px-4 py-3 text-right">Valor</th>
                                          <th className="px-4 py-3 text-center">Status</th>
                                          <th className="px-4 py-3 text-center">Ações</th>
                                       </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                       {plan.installments.map(inst => (
                                          <tr key={inst.number} className="hover:bg-blue-50/50">
                                             <td className="px-4 py-3 font-mono text-gray-500">{inst.number}</td>
                                             <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                   <Calendar size={14} className="text-gray-400"/>
                                                   {new Date(inst.dueDate).toLocaleDateString()}
                                                </div>
                                             </td>
                                             <td className="px-4 py-3 text-right font-medium text-gray-800">R$ {inst.value.toFixed(2)}</td>
                                             <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase 
                                                   ${inst.status === 'Pago' ? 'bg-green-100 text-green-700' : 
                                                     new Date(inst.dueDate) < new Date() ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                   {inst.status === 'Pendente' && new Date(inst.dueDate) < new Date() ? 'Atrasado' : inst.status}
                                                </span>
                                                {inst.paidAt && <div className="text-[10px] text-gray-400 mt-1">em {new Date(inst.paidAt).toLocaleDateString()}</div>}
                                             </td>
                                             <td className="px-4 py-3 text-center flex justify-center gap-2">
                                                {inst.status !== 'Pago' && (
                                                   <>
                                                      <button 
                                                         onClick={() => { if(confirm('Confirmar recebimento desta parcela?')) payInstallment(plan.id, inst.number) }}
                                                         className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-bold flex items-center gap-1"
                                                      >
                                                         <CheckCircle size={12}/> Receber
                                                      </button>
                                                      <button 
                                                         onClick={() => handleEditValue(plan.id, inst.number, inst.value)}
                                                         className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs flex items-center gap-1"
                                                         title="Adicionar Juros/Taxa"
                                                      >
                                                         <Edit2 size={12}/> +
                                                      </button>
                                                   </>
                                                )}
                                             </td>
                                          </tr>
                                       ))}
                                    </tbody>
                                 </table>
                              </div>
                           </div>
                        )}
                     </div>
                  );
               })}
            </div>
         </div>
      ) : (
         <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200 animate-fade-in">
            <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4">Novo Contrato de Crediário</h2>
            <form onSubmit={handleCreatePlan} className="space-y-8">
               
               {/* Section 1 */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">Cliente</label>
                     <select 
                        required 
                        className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
                        value={customerId}
                        onChange={e => setCustomerId(e.target.value)}
                     >
                        <option value="">Selecione o Cliente...</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                     </select>
                     {selectedCustomer && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 border border-gray-100">
                           <p><strong>Endereço:</strong> {selectedCustomer.address}, {selectedCustomer.addressNumber}</p>
                           <p><strong>Tel:</strong> {selectedCustomer.phone}</p>
                        </div>
                     )}
                  </div>
                  <div>
                     {/* Placeholder for future expansion */}
                  </div>
               </div>

               {/* Section 2: Product */}
               <div>
                  <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><DollarSign size={18}/> Dados do Produto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="md:col-span-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Produto</label>
                        <input required placeholder="Ex: Celular" className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={productName} onChange={e => setProductName(e.target.value)} />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Marca</label>
                        <input required placeholder="Ex: Samsung" className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={brand} onChange={e => setBrand(e.target.value)} />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Modelo</label>
                        <input required placeholder="Ex: S23 Ultra" className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={model} onChange={e => setModel(e.target.value)} />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nº Série</label>
                        <input placeholder="Opcional" className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={serialNumber} onChange={e => setSerialNumber(e.target.value)} />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">IMEI</label>
                        <input placeholder="Opcional" className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={imei} onChange={e => setImei(e.target.value)} />
                     </div>
                  </div>
               </div>

               {/* Section 3: Financial */}
               <div>
                  <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><Calendar size={18}/> Condições de Pagamento</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-6 rounded-xl border border-gray-100">
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Valor Total (R$)</label>
                        <input required type="number" className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={totalValue} onChange={e => setTotalValue(e.target.value)} />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Taxas Extras (R$)</label>
                        <input type="number" className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={customFee} onChange={e => setCustomFee(e.target.value)} />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Qtd Parcelas</label>
                        <select className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={installmentsCount} onChange={e => setInstallmentsCount(e.target.value)}>
                           {[1,2,3,4,5,6,10,12].map(n => <option key={n} value={n}>{n}x</option>)}
                        </select>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Frequência</label>
                        <select className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={frequency} onChange={e => setFrequency(e.target.value as any)}>
                           <option>Mensal</option>
                           <option>Semanal</option>
                        </select>
                     </div>
                  </div>
                  <div className="mt-4 text-right text-sm text-gray-600">
                     Simulação: <strong>{installmentsCount}x</strong> de <strong>R$ {((parseFloat(totalValue || '0') + parseFloat(customFee || '0')) / (parseInt(installmentsCount) || 1)).toFixed(2)}</strong>
                  </div>
               </div>

               <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                  <button type="button" onClick={() => setActiveTab('list')} className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Cancelar</button>
                  <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-lg font-bold shadow-lg">Gerar Carnê</button>
               </div>
            </form>
         </div>
      )}
    </div>
  );
};
