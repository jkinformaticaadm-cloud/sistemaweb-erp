import React from 'react';
import { useData } from '../context/DataContext';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { DollarSign, ClipboardList, AlertTriangle, Package } from 'lucide-react';
import { TransactionType, OSStatus } from '../types';

export const Dashboard: React.FC = () => {
  const { serviceOrders, transactions, products } = useData();

  // Calculations
  const totalRevenue = transactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((acc, curr) => acc + curr.amount, 0);
  
  const pendingOrders = serviceOrders.filter(os => os.status === OSStatus.PENDENTE || os.status === OSStatus.EM_ANALISE).length;
  const lowStockProducts = products.filter(p => p.stock < 5).length;

  // Chart Data Preparation
  const statusData = [
    { name: 'Pendentes', value: serviceOrders.filter(o => o.status === OSStatus.PENDENTE).length },
    { name: 'Em Andamento', value: serviceOrders.filter(o => o.status === OSStatus.EM_ANDAMENTO).length },
    { name: 'Concluídos', value: serviceOrders.filter(o => o.status === OSStatus.CONCLUIDO).length },
  ].filter(d => d.value > 0);

  // Paleta de cores expandida para os dias da semana
  const COLORS = ['#3B82F6', '#10B981', '#FBBF24', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];

  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const revenueData = last7Days.map(date => {
    const dayTotal = transactions
      .filter(t => t.type === TransactionType.INCOME && t.date.startsWith(date))
      .reduce((acc, curr) => acc + curr.amount, 0);
    return { date: date.split('-').slice(1).join('/'), receita: dayTotal };
  });

  const hasRevenue = revenueData.some(d => d.receita > 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      
      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Receita Total</p>
            <h2 className="text-2xl font-bold text-gray-800">R$ {totalRevenue.toFixed(2)}</h2>
          </div>
          <div className="p-3 bg-green-100 rounded-full text-green-600">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">OS Pendentes</p>
            <h2 className="text-2xl font-bold text-gray-800">{pendingOrders}</h2>
          </div>
          <div className="p-3 bg-blue-100 rounded-full text-blue-600">
            <ClipboardList size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Estoque Baixo</p>
            <h2 className="text-2xl font-bold text-gray-800">{lowStockProducts}</h2>
          </div>
          <div className="p-3 bg-red-100 rounded-full text-red-600">
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Produtos Cadastrados</p>
            <h2 className="text-2xl font-bold text-gray-800">{products.length}</h2>
          </div>
          <div className="p-3 bg-purple-100 rounded-full text-purple-600">
            <Package size={24} />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Distribuição da Receita (7 dias)</h3>
          <div className="h-64 flex justify-center">
            {hasRevenue ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="receita"
                    nameKey="date"
                  >
                    {revenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center text-gray-400">Sem vendas no período</div>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
             {revenueData.map((d, i) => (
               d.receita > 0 && (
                <div key={d.date} className="flex items-center text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
                  <div className="w-2 h-2 rounded-full mr-2" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                  {d.date}: <span className="font-semibold ml-1">R$ {d.receita}</span>
                </div>
               )
             ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Status das Ordens de Serviço</h3>
          <div className="h-64 flex justify-center">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center text-gray-400">Sem dados suficientes</div>
            )}
          </div>
          <div className="flex justify-center gap-4 mt-4">
             {statusData.map((d, i) => (
               <div key={d.name} className="flex items-center text-xs text-gray-600">
                 <div className="w-3 h-3 rounded-full mr-1" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                 {d.name} ({d.value})
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};