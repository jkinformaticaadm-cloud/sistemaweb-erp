
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { TransactionType, OSStatus, PayableAccount } from '../types';
import { 
  TrendingUp, TrendingDown, DollarSign, PieChart, FileText, 
  Printer, AlertTriangle, ShoppingBag, Wrench, CreditCard, 
  Calendar, ArrowRight, Filter, Download, ChevronDown, ChevronUp,
  Plus, CheckCircle, Trash2, Target
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, AreaChart, Area, CartesianGrid } from 'recharts';

type FinancialTab = 'overview' | 'payable' | 'receivable' | 'goals' | 'reports';
type ReportType = 'os' | 'sales' | 'crediario' | 'stock';

export const Financial: React.FC = () => {
  const { 
    transactions, installmentPlans, serviceOrders, products, 
    payableAccounts, addPayableAccount, payPayableAccount, deletePayableAccount,
    financialGoals, updateFinancialGoals
  } = useData();

  const [activeTab, setActiveTab] = useState<FinancialTab>('overview');
  const [activeReport, setActiveReport] = useState<ReportType>('os');

  // New Payable Form State
  const [showPayableForm, setShowPayableForm] = useState(false);
  const [payableDesc, setPayableDesc] = useState('');
  const [payableAmount, setPayableAmount] = useState('');
  const [payableDate, setPayableDate] = useState('');
  const [payableCategory, setPayableCategory] = useState('Despesas Fixas');

  // Goal Form State
  const [tempGoals, setTempGoals] = useState(financialGoals);
  
  // --- CALCULATIONS ---

  // 1. Cash Flow (Realized)
  const income = transactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
  const expense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
  const balance = income - expense;

  // 2. Accounts Receivable (Future/Pending from Crediário)
  const receivables = useMemo(() => {
    let totalPending = 0;
    installmentPlans.forEach(plan => {
       plan.installments.forEach(inst => {
          if (inst.status === 'Pendente') {
             totalPending += inst.value;
          }
       });
    });
    return totalPending;
  }, [installmentPlans]);

  // 3. Accounts Payable (Pending)
  const totalPayablesPending = useMemo(() => {
    return payableAccounts
      .filter(acc => acc.status === 'Pendente')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [payableAccounts]);

  // 4. Low Stock Items
  const lowStockItems = useMemo(() => {
     return products.filter(p => p.stock < 5);
  }, [products]);

  // --- ACTIONS ---

  const handleAddPayable = (e: React.FormEvent) => {
    e.preventDefault();
    const newAccount: PayableAccount = {
      id: `PAY-${Date.now()}`,
      description: payableDesc,
      amount: parseFloat(payableAmount),
      dueDate: payableDate,
      category: payableCategory,
      status: 'Pendente'
    };
    addPayableAccount(newAccount);
    setShowPayableForm(false);
    setPayableDesc(''); setPayableAmount(''); setPayableDate('');
  };

  const handleUpdateGoals = (e: React.FormEvent) => {
    e.preventDefault();
    updateFinancialGoals(tempGoals);
    alert('Metas atualizadas com sucesso!');
  };

  const handlePrint = () => {
    window.print();
  };

  // --- RENDER COMPONENT ---
  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">Departamento Financeiro</h1>
           <p className="text-gray-500 text-sm">Gestão de fluxo de caixa, contas e relatórios gerenciais.</p>
        </div>
        
        {/* Tab Switcher */}
        <div className="bg-white p-1 rounded-xl border border-gray-200 shadow-sm flex overflow-x-auto max-w-full">
           <button 
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all
              ${activeTab === 'overview' ? 'bg-gray-800 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
           >
              <PieChart size={18}/> Visão Geral
           </button>
           <button 
              onClick={() => setActiveTab('payable')}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all
              ${activeTab === 'payable' ? 'bg-gray-800 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
           >
              <TrendingDown size={18}/> A Pagar
           </button>
           <button 
              onClick={() => setActiveTab('receivable')}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all
              ${activeTab === 'receivable' ? 'bg-gray-800 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
           >
              <TrendingUp size={18}/> A Receber
           </button>
           <button 
              onClick={() => setActiveTab('goals')}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all
              ${activeTab === 'goals' ? 'bg-gray-800 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
           >
              <Target size={18}/> Metas
           </button>
           <button 
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all
              ${activeTab === 'reports' ? 'bg-gray-800 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
           >
              <FileText size={18}/> Relatórios
           </button>
        </div>
      </div>

      {/* --- OVERVIEW TAB --- */}
      {activeTab === 'overview' && (
         <div className="space-y-6">
            {/* Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 text-green-600"><TrendingUp size={80}/></div>
                  <p className="text-sm text-gray-500 font-bold uppercase mb-1">Receitas (Realizadas)</p>
                  <h2 className="text-2xl font-bold text-green-600">+ R$ {income.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h2>
               </div>

               <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 text-red-600"><TrendingDown size={80}/></div>
                  <p className="text-sm text-gray-500 font-bold uppercase mb-1">Despesas (Pagas)</p>
                  <h2 className="text-2xl font-bold text-red-600">- R$ {expense.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h2>
               </div>

               <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 text-blue-600"><DollarSign size={80}/></div>
                  <p className="text-sm text-gray-500 font-bold uppercase mb-1">Saldo em Caixa</p>
                  <h2 className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                     R$ {balance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                  </h2>
               </div>

               <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-5 text-orange-600"><AlertTriangle size={80}/></div>
                   <p className="text-sm text-gray-500 font-bold uppercase mb-1">Contas Pendentes</p>
                   <div className="flex justify-between items-end">
                       <div>
                           <p className="text-xs text-gray-400">A Receber</p>
                           <p className="text-lg font-bold text-green-600">R$ {receivables.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                       </div>
                       <div className="text-right">
                           <p className="text-xs text-gray-400">A Pagar</p>
                           <p className="text-lg font-bold text-red-600">R$ {totalPayablesPending.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                       </div>
                   </div>
               </div>
            </div>

            {/* Recent Transactions & Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               {/* Transactions Table */}
               <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                     <h3 className="font-bold text-gray-700">Fluxo de Caixa Recente</h3>
                     <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">Últimos lançamentos</span>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
                           <tr>
                              <th className="px-6 py-3">Data</th>
                              <th className="px-6 py-3">Descrição</th>
                              <th className="px-6 py-3">Categoria</th>
                              <th className="px-6 py-3 text-right">Valor</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                           {transactions.slice(0, 8).map(t => (
                              <tr key={t.id} className="hover:bg-gray-50">
                                 <td className="px-6 py-3 text-gray-500">{new Date(t.date).toLocaleDateString()}</td>
                                 <td className="px-6 py-3 font-medium text-gray-800">{t.description}</td>
                                 <td className="px-6 py-3">
                                    <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">{t.category}</span>
                                 </td>
                                 <td className={`px-6 py-3 text-right font-bold ${t.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'}`}>
                                    {t.type === TransactionType.EXPENSE && '- '}R$ {t.amount.toFixed(2)}
                                 </td>
                              </tr>
                           ))}
                           {transactions.length === 0 && (
                              <tr><td colSpan={4} className="p-8 text-center text-gray-400">Nenhuma transação registrada.</td></tr>
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>

               {/* Notifications */}
               <div className="space-y-6">
                   <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                      <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                         <ShoppingBag size={18} className="text-orange-500"/> Estoque Baixo
                      </h3>
                      {lowStockItems.length > 0 ? (
                         <div className="space-y-2">
                            {lowStockItems.slice(0,3).map(p => (
                               <div key={p.id} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2 last:border-0">
                                  <span className="text-gray-600">{p.name}</span>
                                  <span className="font-bold text-red-600 bg-red-50 px-2 rounded">{p.stock} un</span>
                               </div>
                            ))}
                            <button onClick={() => { setActiveTab('reports'); setActiveReport('stock'); }} className="w-full text-center text-xs text-blue-600 hover:underline mt-2">
                               Ver todos ({lowStockItems.length})
                            </button>
                         </div>
                      ) : (
                         <p className="text-sm text-gray-400 text-center">Estoque saudável.</p>
                      )}
                   </div>
                   
                   <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                      <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                          <Target size={18} className="text-purple-500"/> Meta Mensal
                      </h3>
                      <div className="space-y-4">
                          <div>
                              <div className="flex justify-between text-xs mb-1">
                                  <span className="text-gray-500">Faturamento</span>
                                  <span className="font-bold text-gray-800">{(income / financialGoals.revenueGoal * 100).toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2">
                                  <div className="bg-green-500 h-2 rounded-full" style={{width: `${Math.min(100, income / financialGoals.revenueGoal * 100)}%`}}></div>
                              </div>
                          </div>
                          <div>
                              <div className="flex justify-between text-xs mb-1">
                                  <span className="text-gray-500">Despesas</span>
                                  <span className="font-bold text-gray-800">{(expense / financialGoals.expenseLimit * 100).toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2">
                                  <div className={`h-2 rounded-full ${expense > financialGoals.expenseLimit ? 'bg-red-500' : 'bg-blue-500'}`} style={{width: `${Math.min(100, expense / financialGoals.expenseLimit * 100)}%`}}></div>
                              </div>
                          </div>
                      </div>
                   </div>
               </div>
            </div>
         </div>
      )}

      {/* --- PAYABLE ACCOUNTS TAB --- */}
      {activeTab === 'payable' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
             <div>
                <h2 className="text-xl font-bold text-gray-800">Contas a Pagar</h2>
                <p className="text-sm text-gray-500">Gestão de despesas futuras e vencimentos.</p>
             </div>
             <button 
                onClick={() => setShowPayableForm(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm"
             >
                <Plus size={20}/> Nova Conta
             </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                   <tr>
                      <th className="px-6 py-4">Vencimento</th>
                      <th className="px-6 py-4">Descrição</th>
                      <th className="px-6 py-4">Categoria</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Valor</th>
                      <th className="px-6 py-4 text-center">Ações</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {payableAccounts.sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map(acc => {
                      const isOverdue = new Date(acc.dueDate) < new Date() && acc.status === 'Pendente';
                      return (
                         <tr key={acc.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                               <div className={`font-bold ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                                  {new Date(acc.dueDate).toLocaleDateString()}
                               </div>
                            </td>
                            <td className="px-6 py-4 font-medium text-gray-800">{acc.description}</td>
                            <td className="px-6 py-4 text-gray-500">{acc.category}</td>
                            <td className="px-6 py-4 text-center">
                               <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${acc.status === 'Pago' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                  {acc.status}
                               </span>
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-gray-700">R$ {acc.amount.toFixed(2)}</td>
                            <td className="px-6 py-4 text-center flex justify-center gap-2">
                               {acc.status === 'Pendente' && (
                                  <button 
                                     onClick={() => { if(confirm('Confirmar pagamento? Isso gerará uma despesa no caixa.')) payPayableAccount(acc.id) }}
                                     className="bg-green-50 text-green-600 hover:bg-green-100 p-2 rounded-lg" title="Dar Baixa"
                                  >
                                     <CheckCircle size={18}/>
                                  </button>
                               )}
                               <button 
                                  onClick={() => { if(confirm('Excluir esta conta?')) deletePayableAccount(acc.id) }}
                                  className="bg-red-50 text-red-600 hover:bg-red-100 p-2 rounded-lg" title="Excluir"
                               >
                                  <Trash2 size={18}/>
                               </button>
                            </td>
                         </tr>
                      );
                   })}
                   {payableAccounts.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">Nenhuma conta cadastrada.</td></tr>}
                </tbody>
             </table>
          </div>
        </div>
      )}

      {/* --- RECEIVABLE ACCOUNTS TAB --- */}
      {activeTab === 'receivable' && (
        <div className="space-y-6 animate-fade-in">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
               <h2 className="text-xl font-bold text-gray-800 mb-2">Contas a Receber (Crediário)</h2>
               <p className="text-sm text-gray-500 mb-6">Visualização consolidada de todas as parcelas pendentes dos clientes.</p>
               
               <div className="overflow-hidden border border-gray-200 rounded-xl">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                          <tr>
                              <th className="px-6 py-3">Vencimento</th>
                              <th className="px-6 py-3">Cliente</th>
                              <th className="px-6 py-3">Contrato / Parcela</th>
                              <th className="px-6 py-3 text-right">Valor</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {installmentPlans
                              .flatMap(plan => plan.installments
                                  .filter(inst => inst.status === 'Pendente')
                                  .map(inst => ({ ...inst, plan }))
                              )
                              .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                              .map((item, idx) => {
                                  const isOverdue = new Date(item.dueDate) < new Date();
                                  return (
                                      <tr key={`${item.plan.id}-${item.number}`} className="hover:bg-gray-50">
                                          <td className={`px-6 py-3 font-bold ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                                              {new Date(item.dueDate).toLocaleDateString()}
                                              {isOverdue && <span className="ml-2 text-[10px] bg-red-100 text-red-700 px-1 rounded uppercase">Atrasado</span>}
                                          </td>
                                          <td className="px-6 py-3 font-medium">{item.plan.customerName}</td>
                                          <td className="px-6 py-3 text-gray-500">#{item.plan.id} - Parc. {item.number}</td>
                                          <td className="px-6 py-3 text-right font-bold text-green-600">R$ {item.value.toFixed(2)}</td>
                                      </tr>
                                  );
                              })
                          }
                          {receivables === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400">Nenhuma conta a receber pendente.</td></tr>}
                      </tbody>
                  </table>
               </div>
           </div>
        </div>
      )}

      {/* --- GOALS TAB --- */}
      {activeTab === 'goals' && (
         <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
             <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-purple-100 rounded-lg text-purple-600"><Target size={24}/></div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Configuração de Metas</h2>
                        <p className="text-sm text-gray-500">Defina seus objetivos financeiros mensais para acompanhar o desempenho.</p>
                    </div>
                 </div>

                 <form onSubmit={handleUpdateGoals} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div>
                         <label className="block text-sm font-bold text-gray-700 mb-2">Meta de Faturamento Mensal (R$)</label>
                         <input 
                            type="number"
                            className="w-full border border-gray-300 rounded-lg p-3 text-lg font-bold text-green-700 outline-none focus:ring-2 focus:ring-green-500"
                            value={tempGoals.revenueGoal}
                            onChange={e => setTempGoals({...tempGoals, revenueGoal: Number(e.target.value)})}
                         />
                         <p className="text-xs text-gray-500 mt-2">Valor alvo para vendas e serviços somados.</p>
                     </div>

                     <div>
                         <label className="block text-sm font-bold text-gray-700 mb-2">Limite de Despesas Mensal (R$)</label>
                         <input 
                            type="number"
                            className="w-full border border-gray-300 rounded-lg p-3 text-lg font-bold text-red-700 outline-none focus:ring-2 focus:ring-red-500"
                            value={tempGoals.expenseLimit}
                            onChange={e => setTempGoals({...tempGoals, expenseLimit: Number(e.target.value)})}
                         />
                         <p className="text-xs text-gray-500 mt-2">Teto máximo para gastos operacionais e compras.</p>
                     </div>

                     <div className="md:col-span-2 pt-4 border-t border-gray-100 flex justify-end">
                         <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-transform active:scale-95">
                             Salvar Metas
                         </button>
                     </div>
                 </form>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                     <h3 className="font-bold text-gray-700 mb-4 text-center">Progresso Faturamento</h3>
                     <div className="relative w-48 h-48 mx-auto flex items-center justify-center rounded-full border-8 border-gray-100">
                         <div 
                            className="absolute inset-0 rounded-full border-8 border-green-500 transition-all duration-1000"
                            style={{clipPath: `inset(${100 - Math.min(100, (income/financialGoals.revenueGoal)*100)}% 0 0 0)`}}
                         ></div>
                         <div className="text-center">
                             <span className="text-3xl font-bold text-gray-800">{(income/financialGoals.revenueGoal*100).toFixed(0)}%</span>
                             <p className="text-xs text-gray-500">Concluído</p>
                         </div>
                     </div>
                     <div className="text-center mt-4">
                         <p className="text-sm text-gray-600">Atual: <strong>R$ {income.toFixed(2)}</strong></p>
                         <p className="text-sm text-gray-400">Meta: R$ {financialGoals.revenueGoal.toFixed(2)}</p>
                     </div>
                 </div>

                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                     <h3 className="font-bold text-gray-700 mb-4 text-center">Consumo do Orçamento</h3>
                     <div className="relative w-48 h-48 mx-auto flex items-center justify-center rounded-full border-8 border-gray-100">
                        {/* Simple CSS Hack for circle progress simulation or use library. Using simple border for now */}
                         <div 
                            className={`absolute inset-0 rounded-full border-8 ${expense > financialGoals.expenseLimit ? 'border-red-500' : 'border-blue-500'} transition-all duration-1000`}
                            style={{clipPath: `inset(${100 - Math.min(100, (expense/financialGoals.expenseLimit)*100)}% 0 0 0)`}}
                         ></div>
                         <div className="text-center">
                             <span className={`text-3xl font-bold ${expense > financialGoals.expenseLimit ? 'text-red-600' : 'text-gray-800'}`}>
                                 {(expense/financialGoals.expenseLimit*100).toFixed(0)}%
                             </span>
                             <p className="text-xs text-gray-500">Utilizado</p>
                         </div>
                     </div>
                     <div className="text-center mt-4">
                         <p className="text-sm text-gray-600">Gasto: <strong>R$ {expense.toFixed(2)}</strong></p>
                         <p className="text-sm text-gray-400">Limite: R$ {financialGoals.expenseLimit.toFixed(2)}</p>
                     </div>
                 </div>
             </div>
         </div>
      )}

      {/* --- REPORTS TAB (Unchanged Logic, just styling consistency) --- */}
      {activeTab === 'reports' && (
         <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Sidebar Menu */}
            <div className="w-full lg:w-64 flex flex-col gap-2 shrink-0">
               <button 
                  onClick={() => setActiveReport('os')}
                  className={`p-4 text-left rounded-xl font-bold text-sm transition-all border flex items-center justify-between
                  ${activeReport === 'os' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
               >
                  <span className="flex items-center gap-2"><Wrench size={18}/> Relatório de OS</span>
                  {activeReport === 'os' && <ArrowRight size={16}/>}
               </button>
               
               <button 
                  onClick={() => setActiveReport('sales')}
                  className={`p-4 text-left rounded-xl font-bold text-sm transition-all border flex items-center justify-between
                  ${activeReport === 'sales' ? 'bg-green-600 text-white border-green-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
               >
                  <span className="flex items-center gap-2"><ShoppingBag size={18}/> Vendas / Fluxo</span>
                  {activeReport === 'sales' && <ArrowRight size={16}/>}
               </button>

               <button 
                  onClick={() => setActiveReport('crediario')}
                  className={`p-4 text-left rounded-xl font-bold text-sm transition-all border flex items-center justify-between
                  ${activeReport === 'crediario' ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
               >
                  <span className="flex items-center gap-2"><CreditCard size={18}/> Crediário</span>
                  {activeReport === 'crediario' && <ArrowRight size={16}/>}
               </button>

               <button 
                  onClick={() => setActiveReport('stock')}
                  className={`p-4 text-left rounded-xl font-bold text-sm transition-all border flex items-center justify-between
                  ${activeReport === 'stock' ? 'bg-orange-600 text-white border-orange-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
               >
                  <span className="flex items-center gap-2"><AlertTriangle size={18}/> Estoque em Falta</span>
                  {activeReport === 'stock' && <ArrowRight size={16}/>}
               </button>
            </div>

            {/* Report Content Area */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px] flex flex-col">
               
               {/* Report Header */}
               <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <div>
                     <h2 className="text-xl font-bold text-gray-800">
                        {activeReport === 'os' && 'Relatório de Ordens de Serviço'}
                        {activeReport === 'sales' && 'Relatório de Vendas'}
                        {activeReport === 'crediario' && 'Relatório de Crediário'}
                        {activeReport === 'stock' && 'Relatório de Estoque Crítico'}
                     </h2>
                     <p className="text-xs text-gray-500">Gerado em {new Date().toLocaleDateString()} às {new Date().toLocaleTimeString()}</p>
                  </div>
                  <button 
                     onClick={handlePrint}
                     className="bg-gray-800 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-gray-700 transition-colors"
                  >
                     <Printer size={16}/> Imprimir
                  </button>
               </div>

               {/* Report Body - Table */}
               <div className="p-0 overflow-x-auto flex-1">
                  
                  {/* --- OS REPORT --- */}
                  {activeReport === 'os' && (
                     <table className="w-full text-left text-sm">
                        <thead className="bg-gray-100 text-xs uppercase font-bold text-gray-600">
                           <tr>
                              <th className="p-4">ID / Data</th>
                              <th className="p-4">Cliente</th>
                              <th className="p-4">Dispositivo</th>
                              <th className="p-4 text-center">Status</th>
                              <th className="p-4 text-right">Valor</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                           {serviceOrders.map(os => (
                              <tr key={os.id} className="hover:bg-gray-50">
                                 <td className="p-4">
                                    <div className="font-bold">{os.id}</div>
                                    <div className="text-xs text-gray-500">{new Date(os.createdAt).toLocaleDateString()}</div>
                                 </td>
                                 <td className="p-4">{os.customerName}</td>
                                 <td className="p-4 text-gray-600">{os.device}</td>
                                 <td className="p-4 text-center">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${os.status === OSStatus.FINALIZADO ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                       {os.status}
                                    </span>
                                 </td>
                                 <td className="p-4 text-right font-medium">R$ {os.totalValue.toFixed(2)}</td>
                              </tr>
                           ))}
                           {serviceOrders.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhum dado encontrado.</td></tr>}
                        </tbody>
                     </table>
                  )}

                  {/* --- SALES REPORT --- */}
                  {activeReport === 'sales' && (
                     <table className="w-full text-left text-sm">
                        <thead className="bg-gray-100 text-xs uppercase font-bold text-gray-600">
                           <tr>
                              <th className="p-4">Data</th>
                              <th className="p-4">Descrição</th>
                              <th className="p-4">Categoria</th>
                              <th className="p-4">Forma Pagto</th>
                              <th className="p-4 text-right">Valor</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                           {transactions.filter(t => t.type === TransactionType.INCOME).map(t => (
                              <tr key={t.id} className="hover:bg-gray-50">
                                 <td className="p-4 text-gray-500">{new Date(t.date).toLocaleDateString()} {new Date(t.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                                 <td className="p-4 font-medium text-gray-800">{t.description}</td>
                                 <td className="p-4 text-gray-600">{t.category}</td>
                                 <td className="p-4 text-gray-600">{t.transactionDetails?.paymentMethod || '-'}</td>
                                 <td className="p-4 text-right font-bold text-green-600">R$ {t.amount.toFixed(2)}</td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  )}

                  {/* --- CREDIARIO REPORT --- */}
                  {activeReport === 'crediario' && (
                     <table className="w-full text-left text-sm">
                        <thead className="bg-gray-100 text-xs uppercase font-bold text-gray-600">
                           <tr>
                              <th className="p-4">Contrato</th>
                              <th className="p-4">Cliente</th>
                              <th className="p-4">Produto</th>
                              <th className="p-4 text-center">Parcelas (Pagas/Total)</th>
                              <th className="p-4 text-right">Restante</th>
                              <th className="p-4 text-right">Total</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                           {installmentPlans.map(plan => {
                              const paidCount = plan.installments.filter(i => i.status === 'Pago').length;
                              const remainingVal = plan.installments.filter(i => i.status === 'Pendente').reduce((acc, i) => acc + i.value, 0);
                              return (
                                 <tr key={plan.id} className="hover:bg-gray-50">
                                    <td className="p-4 font-mono text-xs">{plan.id}</td>
                                    <td className="p-4 font-medium">{plan.customerName}</td>
                                    <td className="p-4 text-gray-600">{plan.productName}</td>
                                    <td className="p-4 text-center">
                                       <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-bold">{paidCount} / {plan.installments.length}</span>
                                    </td>
                                    <td className="p-4 text-right font-bold text-orange-500">R$ {remainingVal.toFixed(2)}</td>
                                    <td className="p-4 text-right font-medium">R$ {plan.totalValue.toFixed(2)}</td>
                                 </tr>
                              );
                           })}
                        </tbody>
                     </table>
                  )}

                  {/* --- STOCK REPORT --- */}
                  {activeReport === 'stock' && (
                     <table className="w-full text-left text-sm">
                        <thead className="bg-gray-100 text-xs uppercase font-bold text-gray-600">
                           <tr>
                              <th className="p-4">Produto</th>
                              <th className="p-4">Categoria</th>
                              <th className="p-4 text-center">Estoque Atual</th>
                              <th className="p-4 text-right">Custo Unit.</th>
                              <th className="p-4 text-center">Status</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                           {lowStockItems.length === 0 ? (
                              <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhum produto com estoque baixo.</td></tr>
                           ) : (
                              lowStockItems.map(p => (
                                 <tr key={p.id} className="hover:bg-gray-50">
                                    <td className="p-4 font-bold text-gray-800">{p.name}</td>
                                    <td className="p-4 text-gray-600">{p.category}</td>
                                    <td className="p-4 text-center text-lg font-bold text-red-600">{p.stock}</td>
                                    <td className="p-4 text-right text-gray-600">R$ {p.cost.toFixed(2)}</td>
                                    <td className="p-4 text-center">
                                       <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold uppercase">Crítico</span>
                                    </td>
                                 </tr>
                              ))
                           )}
                        </tbody>
                     </table>
                  )}

               </div>
               
               {/* Footer for print signature or summary */}
               <div className="hidden print:block p-8 mt-4 border-t border-gray-200">
                  <div className="flex justify-between text-xs text-gray-500">
                     <p>TechFix Pro - Sistema de Gestão</p>
                     <p>Assinatura do Responsável: _____________________________________</p>
                  </div>
               </div>

            </div>
         </div>
      )}

      {/* MODAL: ADD PAYABLE ACCOUNT */}
      {showPayableForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 animate-fade-in">
               <h2 className="text-xl font-bold mb-4 text-gray-800">Nova Conta a Pagar</h2>
               <form onSubmit={handleAddPayable} className="space-y-4">
                  <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">Descrição</label>
                     <input 
                        required 
                        className="w-full border p-2.5 rounded-lg" 
                        placeholder="Ex: Conta de Luz"
                        value={payableDesc}
                        onChange={e => setPayableDesc(e.target.value)}
                     />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Valor (R$)</label>
                        <input 
                           required type="number" step="0.01"
                           className="w-full border p-2.5 rounded-lg" 
                           value={payableAmount}
                           onChange={e => setPayableAmount(e.target.value)}
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Vencimento</label>
                        <input 
                           required type="date"
                           className="w-full border p-2.5 rounded-lg" 
                           value={payableDate}
                           onChange={e => setPayableDate(e.target.value)}
                        />
                     </div>
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">Categoria</label>
                     <select 
                        className="w-full border p-2.5 rounded-lg bg-white"
                        value={payableCategory}
                        onChange={e => setPayableCategory(e.target.value)}
                     >
                        <option>Despesas Fixas</option>
                        <option>Fornecedores</option>
                        <option>Funcionários</option>
                        <option>Manutenção</option>
                        <option>Outros</option>
                     </select>
                  </div>
                  <div className="flex justify-end gap-3 mt-4 pt-2">
                     <button type="button" onClick={() => setShowPayableForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                     <button type="submit" className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold">Salvar Conta</button>
                  </div>
               </form>
           </div>
        </div>
      )}
      
      {/* Print Styles */}
      <style>{`
         @media print {
            body > *:not(.fixed) { display: none !important; }
            .fixed { position: static !important; background: white !important; height: auto !important; }
            nav, aside, header { display: none !important; }
            main { margin: 0 !important; padding: 0 !important; }
            .animate-fade-in { animation: none !important; }
            /* Hide tab buttons and sidebar during print, show only report content */
            button { display: none !important; }
         }
      `}</style>
    </div>
  );
};
