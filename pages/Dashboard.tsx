
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Link } from 'react-router-dom';
import { 
  ArrowUpRight, ArrowDownRight, Users, DollarSign, ShoppingBag, 
  Target, Calendar, ChevronDown, MoreHorizontal, Wallet 
} from 'lucide-react';
import { TransactionType, OSStatus } from '../types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { transactions, customers, serviceOrders } = useData();
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month'>('week');

  // --- Statistics Calculation ---
  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toLocaleDateString();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filter Income Transactions
    const incomeTransactions = transactions.filter(t => t.type === TransactionType.INCOME);

    // 1. Sales Today
    const salesToday = incomeTransactions
      .filter(t => new Date(t.date).toLocaleDateString() === todayStr)
      .reduce((acc, t) => acc + t.amount, 0);

    // 2. Sales Month
    const salesMonth = incomeTransactions
      .filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((acc, t) => acc + t.amount, 0);

    // 3. Average Ticket (Month)
    const monthCount = incomeTransactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
    const avgTicket = monthCount > 0 ? salesMonth / monthCount : 0;

    return { salesToday, salesMonth, avgTicket, totalCustomers: customers.length };
  }, [transactions, customers]);

  // --- Chart Data Logic ---
  const chartData = useMemo(() => {
    const data = [];
    const now = new Date();
    
    if (chartPeriod === 'week') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayStr = d.toLocaleDateString();
        
        const total = transactions
          .filter(t => t.type === TransactionType.INCOME && new Date(t.date).toLocaleDateString() === dayStr)
          .reduce((acc, t) => acc + t.amount, 0);
          
        data.push({
          name: d.toLocaleDateString('pt-BR', { weekday: 'short' }),
          date: dayStr,
          total: total
        });
      }
    } else {
      // Current Month (by weeks roughly or days) - let's do days of current month
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
         // Only show up to today to avoid empty space if preferred, or show all
         if (i > now.getDate()) break; 
         
         const d = new Date(now.getFullYear(), now.getMonth(), i);
         const dayStr = d.toLocaleDateString();
         
         const total = transactions
          .filter(t => t.type === TransactionType.INCOME && new Date(t.date).toLocaleDateString() === dayStr)
          .reduce((acc, t) => acc + t.amount, 0);

         data.push({
            name: i.toString(),
            total: total
         });
      }
    }
    return data;
  }, [transactions, chartPeriod]);

  // --- Goals Logic (Mocked for Demo) ---
  const goals = {
    weekly: 5000,
    monthly: 20000
  };
  
  // Calculate Weekly Sales (Real)
  const currentWeeklySales = useMemo(() => {
     const now = new Date();
     const oneWeekAgo = new Date();
     oneWeekAgo.setDate(now.getDate() - 7);
     
     return transactions
      .filter(t => t.type === TransactionType.INCOME && new Date(t.date) >= oneWeekAgo)
      .reduce((acc, t) => acc + t.amount, 0);
  }, [transactions]);

  const weeklyProgress = Math.min(100, (currentWeeklySales / goals.weekly) * 100);
  const monthlyProgress = Math.min(100, (stats.salesMonth / goals.monthly) * 100);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Geral</h1>
          <p className="text-gray-500 text-sm">Bem-vindo de volta! Aqui está o resumo da sua loja.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
           <button 
              onClick={() => setChartPeriod('week')}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${chartPeriod === 'week' ? 'bg-gray-900 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
           >
              Semana
           </button>
           <button 
              onClick={() => setChartPeriod('month')}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${chartPeriod === 'month' ? 'bg-gray-900 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
           >
              Mês
           </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Daily Sales */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <DollarSign size={64} className="text-blue-600"/>
           </div>
           <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                 <ShoppingBag size={20}/>
              </div>
              <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Vendas Hoje</span>
           </div>
           <div>
              <h3 className="text-3xl font-bold text-gray-800">R$ {stats.salesToday.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                 <span className="text-green-600 font-bold bg-green-50 px-1 rounded flex items-center"><ArrowUpRight size={12}/> +12%</span> vs ontem
              </p>
           </div>
        </div>

        {/* Card 2: Monthly Sales */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Calendar size={64} className="text-purple-600"/>
           </div>
           <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                 <Wallet size={20}/>
              </div>
              <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Faturamento Mês</span>
           </div>
           <div>
              <h3 className="text-3xl font-bold text-gray-800">R$ {stats.salesMonth.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                 <span className="text-green-600 font-bold bg-green-50 px-1 rounded flex items-center"><ArrowUpRight size={12}/> +5%</span> vs mês anterior
              </p>
           </div>
        </div>

        {/* Card 3: Customers */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users size={64} className="text-orange-600"/>
           </div>
           <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                 <Users size={20}/>
              </div>
              <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Clientes Ativos</span>
           </div>
           <div>
              <h3 className="text-3xl font-bold text-gray-800">{stats.totalCustomers}</h3>
              <p className="text-xs text-gray-500 mt-1">Total cadastrado na base</p>
           </div>
        </div>

        {/* Card 4: Avg Ticket */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Target size={64} className="text-green-600"/>
           </div>
           <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                 <Target size={20}/>
              </div>
              <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Ticket Médio</span>
           </div>
           <div>
              <h3 className="text-3xl font-bold text-gray-800">R$ {stats.avgTicket.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3>
              <p className="text-xs text-gray-500 mt-1">Média por venda este mês</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* Main Chart Section */}
         <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-gray-800 text-lg">Desempenho de Vendas</h3>
               <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={20}/></button>
            </div>
            
            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                     <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                     <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#9ca3af', fontSize: 12}} 
                        dy={10}
                     />
                     <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#9ca3af', fontSize: 12}} 
                        tickFormatter={(value) => `R$${value/1000}k`}
                     />
                     <Tooltip 
                        contentStyle={{backgroundColor: '#1f2937', color: '#fff', borderRadius: '8px', border: 'none'}}
                        itemStyle={{color: '#fff'}}
                        formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Vendas']}
                     />
                     <Area 
                        type="monotone" 
                        dataKey="total" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorTotal)" 
                     />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Goals Section */}
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
               <h3 className="font-bold text-gray-800 text-lg mb-6 flex items-center gap-2">
                  <Target className="text-red-500"/> Metas Financeiras
               </h3>

               {/* Weekly Goal */}
               <div className="mb-8">
                  <div className="flex justify-between items-end mb-2">
                     <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">Meta Semanal</p>
                        <p className="text-lg font-bold text-gray-800">R$ {currentWeeklySales.toLocaleString('pt-BR')} <span className="text-gray-400 text-sm font-normal">/ {goals.weekly.toLocaleString('pt-BR')}</span></p>
                     </div>
                     <span className="text-sm font-bold text-blue-600">{weeklyProgress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                     <div 
                        className="bg-blue-600 h-3 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                        style={{ width: `${weeklyProgress}%` }}
                     ></div>
                  </div>
               </div>

               {/* Monthly Goal */}
               <div>
                  <div className="flex justify-between items-end mb-2">
                     <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">Meta Mensal</p>
                        <p className="text-lg font-bold text-gray-800">R$ {stats.salesMonth.toLocaleString('pt-BR')} <span className="text-gray-400 text-sm font-normal">/ {goals.monthly.toLocaleString('pt-BR')}</span></p>
                     </div>
                     <span className="text-sm font-bold text-purple-600">{monthlyProgress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                     <div 
                        className="bg-purple-600 h-3 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(147,51,234,0.5)]" 
                        style={{ width: `${monthlyProgress}%` }}
                     ></div>
                  </div>
               </div>
            </div>

            <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
               <p className="text-xs text-gray-500 mb-2 font-bold uppercase">Dica do sistema</p>
               <p className="text-sm text-gray-600">Para alcançar a meta mensal, você precisa vender uma média de <span className="font-bold text-gray-900">R$ {((goals.monthly - stats.salesMonth) / 15).toFixed(2)}</span> por dia nos próximos 15 dias.</p>
            </div>
         </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
         <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 text-lg">Últimas Transações</h3>
            <Link to="/financeiro" className="text-sm text-blue-600 font-bold hover:underline">Ver Extrato Completo</Link>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
               <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                  <tr>
                     <th className="px-6 py-4">Data</th>
                     <th className="px-6 py-4">Descrição</th>
                     <th className="px-6 py-4">Categoria</th>
                     <th className="px-6 py-4 text-center">Tipo</th>
                     <th className="px-6 py-4 text-right">Valor</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {transactions.slice(0, 5).map((t) => (
                     <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-gray-500">{new Date(t.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 font-medium text-gray-800">{t.description}</td>
                        <td className="px-6 py-4 text-gray-500">
                           <span className="px-2 py-1 bg-gray-100 rounded text-xs">{t.category}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                           {t.type === TransactionType.INCOME ? (
                              <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-bold uppercase">
                                 <ArrowUpRight size={12}/> Receita
                              </span>
                           ) : (
                              <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-bold uppercase">
                                 <ArrowDownRight size={12}/> Despesa
                              </span>
                           )}
                        </td>
                        <td className={`px-6 py-4 text-right font-bold ${t.type === TransactionType.INCOME ? 'text-gray-800' : 'text-red-500'}`}>
                           {t.type === TransactionType.EXPENSE && '- '}R$ {t.amount.toFixed(2)}
                        </td>
                     </tr>
                  ))}
                  {transactions.length === 0 && (
                     <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhuma movimentação registrada hoje.</td></tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};
