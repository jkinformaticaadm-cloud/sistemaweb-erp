
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { TransactionType, OSStatus } from '../types';
import { 
  TrendingUp, TrendingDown, DollarSign, PieChart, FileText, 
  Printer, AlertTriangle, ShoppingBag, Wrench, CreditCard, 
  Calendar, ArrowRight, Filter, Download, ChevronDown, ChevronUp
} from 'lucide-react';

type FinancialTab = 'overview' | 'reports';
type ReportType = 'os' | 'sales' | 'crediario' | 'stock';

export const Financial: React.FC = () => {
  const { transactions, installmentPlans, serviceOrders, products } = useData();
  const [activeTab, setActiveTab] = useState<FinancialTab>('overview');
  const [activeReport, setActiveReport] = useState<ReportType>('os');

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

  // 3. Low Stock Items
  const lowStockItems = useMemo(() => {
     return products.filter(p => p.stock < 5);
  }, [products]);


  // --- HELPERS ---
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
        <div className="bg-white p-1 rounded-xl border border-gray-200 shadow-sm flex">
           <button 
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all
              ${activeTab === 'overview' ? 'bg-gray-800 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
           >
              <PieChart size={18}/> Visão Geral
           </button>
           <button 
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all
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
                  <div className="absolute top-0 right-0 p-4 opacity-5 text-orange-600"><Calendar size={80}/></div>
                  <p className="text-sm text-gray-500 font-bold uppercase mb-1">A Receber (Crediário)</p>
                  <h2 className="text-2xl font-bold text-orange-600">
                     R$ {receivables.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                  </h2>
                  <p className="text-xs text-orange-400 mt-1">Parcelas pendentes</p>
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

               {/* Notifications / Payables Placeholder */}
               <div className="space-y-6">
                   {/* Payables/Expenses Card */}
                   <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                      <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                         <AlertTriangle size={18} className="text-red-500"/> Contas a Pagar (Despesas)
                      </h3>
                      <div className="space-y-3">
                         {transactions.filter(t => t.type === TransactionType.EXPENSE).slice(0, 5).map(t => (
                            <div key={t.id} className="flex justify-between items-center p-2 bg-red-50 rounded-lg border border-red-100 text-sm">
                               <div className="flex flex-col">
                                  <span className="font-bold text-red-800">{t.description}</span>
                                  <span className="text-xs text-red-400">{new Date(t.date).toLocaleDateString()}</span>
                               </div>
                               <span className="font-bold text-red-700">- R$ {t.amount.toFixed(2)}</span>
                            </div>
                         ))}
                         {transactions.filter(t => t.type === TransactionType.EXPENSE).length === 0 && (
                            <p className="text-gray-400 text-center text-sm py-2">Nenhuma despesa recente.</p>
                         )}
                      </div>
                   </div>

                   {/* Stock Alert Mini */}
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
               </div>
            </div>
         </div>
      )}

      {/* --- REPORTS TAB --- */}
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
