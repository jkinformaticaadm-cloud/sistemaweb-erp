import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { 
  ResponsiveContainer, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Cell 
} from 'recharts';
import { 
  DollarSign, Package, Users, Smartphone, ArrowRight, CheckCircle, AlertCircle, Eye
} from 'lucide-react';
import { TransactionType, CartItem } from '../types';

export const Dashboard: React.FC = () => {
  const { transactions, products, customers } = useData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(value);
  };

  // --- 1. KPI Calculations (Inventory) ---
  const inventoryMetrics = useMemo(() => {
    // Filter logic can be adjusted based on real categories. 
    // For now: 'Devices' = products with high value/specific category, 'Products' = everything else
    const devices = products.filter(p => p.category === 'Celulares' || p.name.includes('iPhone') || p.name.includes('Samsung') || p.price > 1000);
    const generalProducts = products.filter(p => !devices.includes(p));
    
    const calculateMetrics = (items: typeof products) => {
      const count = items.reduce((acc, p) => acc + p.stock, 0);
      const totalCost = items.reduce((acc, p) => acc + (p.cost * p.stock), 0);
      const totalSale = items.reduce((acc, p) => acc + (p.price * p.stock), 0);
      const markup = totalCost > 0 ? ((totalSale - totalCost) / totalCost) * 100 : 0;
      return { count, totalCost, totalSale, markup };
    };

    const deviceMetrics = calculateMetrics(devices);
    const productMetrics = calculateMetrics(generalProducts);
    const totalMetrics = calculateMetrics(products);

    return { deviceMetrics, productMetrics, totalMetrics };
  }, [products]);

  // --- 2. Sales & Profit Calculations ---
  const salesData = useMemo(() => {
    const incomeTransactions = transactions.filter(t => t.type === TransactionType.INCOME);
    
    let totalRevenue = 0;
    let totalProfit = 0;
    
    // Calculate Profit per transaction
    const transactionsWithProfit = incomeTransactions.map(t => {
      const items = t.transactionDetails?.items || [];
      const cost = items.reduce((acc, item: CartItem) => acc + (item.cost * item.quantity), 0);
      const profit = t.amount - cost;
      
      totalRevenue += t.amount;
      totalProfit += profit;

      return { ...t, profit, cost };
    });

    const ticketMedio = incomeTransactions.length > 0 ? totalRevenue / incomeTransactions.length : 0;

    // Group by Payment Method
    const byPaymentMethod: Record<string, number> = {};
    incomeTransactions.forEach(t => {
      const method = t.transactionDetails?.paymentMethod || 'Outros';
      byPaymentMethod[method] = (byPaymentMethod[method] || 0) + t.amount;
    });

    return { 
      totalRevenue, 
      totalProfit, 
      ticketMedio, 
      transactionsWithProfit,
      byPaymentMethod 
    };
  }, [transactions]);

  // --- 3. Chart Data ---
  
  // Daily Sales (Last 15 days)
  const dailyData = useMemo(() => {
    const days = 15;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const dayLabel = `${d.getDate().toString().padStart(2, '0')}`;
      
      const dayTotal = transactions
        .filter(t => t.type === TransactionType.INCOME && t.date.startsWith(dateKey))
        .reduce((acc, t) => acc + t.amount, 0);
      
      data.push({ name: dayLabel, value: dayTotal });
    }
    return data;
  }, [transactions]);

  // Monthly Revenue (Last 6 months)
  const monthlyData = useMemo(() => {
    const data = [];
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthKey = d.toISOString().slice(0, 7); // YYYY-MM
        const monthLabel = `${months[d.getMonth()]}/${d.getFullYear()}`;

        const monthTotal = transactions
            .filter(t => t.type === TransactionType.INCOME && t.date.startsWith(monthKey))
            .reduce((acc, t) => acc + t.amount, 0);

        data.push({ name: monthLabel, value: monthTotal });
    }
    return data;
  }, [transactions]);

  // --- 4. Recent Items ---
  const recentItems = useMemo(() => {
    const items: { date: string; name: string; value: number }[] = [];
    transactions
      .filter(t => t.type === TransactionType.INCOME)
      .slice(0, 5) // Last 5 transactions
      .forEach(t => {
         t.transactionDetails?.items?.forEach(item => {
            items.push({
                date: t.date,
                name: item.name,
                value: item.price
            });
         });
      });
    return items.slice(0, 5); // Just show top 5 items
  }, [transactions]);


  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded">Plus (Mensal)</span>
           </div>
           <h1 className="text-2xl font-bold text-gray-800">Olá, Administrador!</h1>
           <p className="text-gray-500 text-sm">Bem vindo ao TechFix Pro</p>
        </div>
        <div className="flex gap-4 mt-4 md:mt-0">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                <AlertCircle size={16} /> Dúvidas?
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 rounded-lg text-sm font-medium text-red-600 hover:bg-red-100">
                <ArrowRight size={16} /> Vídeos Tutoriais
            </button>
        </div>
      </div>

      {/* KPI Cards (Inventory) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Card 1: Aparelhos */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gray-100 rounded-lg"><Smartphone size={20} className="text-gray-700"/></div>
                <h3 className="font-semibold text-gray-700">Aparelhos disponíveis</h3>
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-4">{inventoryMetrics.deviceMetrics.count}</div>
            <div className="space-y-1 text-xs text-gray-500">
                <div className="flex justify-between"><span>Custo:</span> <span>R$ {formatCurrency(inventoryMetrics.deviceMetrics.totalCost)}</span></div>
                <div className="flex justify-between"><span>Venda:</span> <span>R$ {formatCurrency(inventoryMetrics.deviceMetrics.totalSale)}</span></div>
                <div className="flex justify-between font-medium text-green-600"><span>Markup:</span> <span>{inventoryMetrics.deviceMetrics.markup.toFixed(2)}%</span></div>
            </div>
        </div>

        {/* Card 2: Produtos */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gray-100 rounded-lg"><Package size={20} className="text-gray-700"/></div>
                <h3 className="font-semibold text-gray-700">Produtos disponíveis</h3>
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-4">{inventoryMetrics.productMetrics.count}</div>
            <div className="space-y-1 text-xs text-gray-500">
                <div className="flex justify-between"><span>Custo:</span> <span>R$ {formatCurrency(inventoryMetrics.productMetrics.totalCost)}</span></div>
                <div className="flex justify-between"><span>Venda:</span> <span>R$ {formatCurrency(inventoryMetrics.productMetrics.totalSale)}</span></div>
                <div className="flex justify-between font-medium text-green-600"><span>Markup:</span> <span>{inventoryMetrics.productMetrics.markup.toFixed(2)}%</span></div>
            </div>
        </div>

        {/* Card 3: Estoque Total */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gray-100 rounded-lg"><DollarSign size={20} className="text-gray-700"/></div>
                <h3 className="font-semibold text-gray-700">Estoque total</h3>
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-4">{inventoryMetrics.totalMetrics.count}</div>
            <div className="space-y-1 text-xs text-gray-500">
                <div className="flex justify-between"><span>Custo:</span> <span>R$ {formatCurrency(inventoryMetrics.totalMetrics.totalCost)}</span></div>
                <div className="flex justify-between"><span>Venda:</span> <span>R$ {formatCurrency(inventoryMetrics.totalMetrics.totalSale)}</span></div>
                <div className="flex justify-between font-medium text-green-600"><span>Markup:</span> <span>{inventoryMetrics.totalMetrics.markup.toFixed(2)}%</span></div>
            </div>
        </div>

         {/* Card 4: Clientes */}
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gray-100 rounded-lg"><Users size={20} className="text-gray-700"/></div>
                <h3 className="font-semibold text-gray-700">Clientes cadastrados</h3>
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-4">{customers.length}</div>
            <div className="space-y-1 text-xs text-gray-500">
                <div className="flex justify-between"><span>Clientes:</span> <span>{customers.length}</span></div>
                <div className="flex justify-between"><span>Fornecedores:</span> <span>0</span></div>
                <div className="h-[18px]"></div>
            </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-6">Vendas por dia</h3>
            <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                        <Tooltip 
                            cursor={{fill: '#F3F4F6'}}
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {dailyData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#BFDBFE' : '#93C5FD'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-6">Faturamento bruto por mês</h3>
            <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                        <Tooltip 
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        />
                        <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* Financial Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Col 1: Summary & Sales vs Profit */}
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-gray-100 rounded text-gray-600"><DollarSign size={16}/></div>
                    <h3 className="font-bold text-gray-800">Resumo de vendas</h3>
                </div>
                
                <div className="mb-4">
                    <div className="text-xs text-gray-500 mb-1">Vendas do mês</div>
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-gray-800">R$ {formatCurrency(salesData.totalRevenue)}</span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">Lucro R$ {formatCurrency(salesData.totalProfit)}</span>
                    </div>
                </div>
                
                <div>
                    <div className="text-xs text-gray-500 mb-1">Ticket médio</div>
                    <div className="text-lg font-bold text-gray-800">R$ {formatCurrency(salesData.ticketMedio)}</div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-gray-100 rounded text-gray-600"><BarChart size={16}/></div>
                    <h3 className="font-bold text-gray-800">Vendas x Lucro</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-xs text-gray-400 border-b border-gray-100">
                            <tr>
                                <th className="text-left py-2 font-normal">ID</th>
                                <th className="text-right py-2 font-normal">Valor da venda</th>
                                <th className="text-right py-2 font-normal">Lucro</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {salesData.transactionsWithProfit.slice(0, 5).map(t => (
                                <tr key={t.id}>
                                    <td className="py-2 text-blue-600 text-xs">#{t.id.replace('TR-', '')}</td>
                                    <td className="py-2 text-right text-gray-600">R$ {t.amount.toFixed(2)}</td>
                                    <td className="py-2 text-right text-green-600">R$ {t.profit.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* Col 2: Payment Methods */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
            <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-gray-100 rounded text-gray-600"><DollarSign size={16}/></div>
                <h3 className="font-bold text-gray-800">Meios de pagamento</h3>
            </div>
            <p className="text-xs text-gray-400 mb-4">Volume total transacional pelo período</p>

            <div className="divide-y divide-gray-50">
                {Object.entries(salesData.byPaymentMethod).map(([method, amount]) => (
                    <div key={method} className="flex justify-between py-3 text-sm">
                        <span className="text-gray-600">{method}</span>
                        <span className="font-medium text-gray-800">R$ {formatCurrency(amount)}</span>
                    </div>
                ))}
                {Object.keys(salesData.byPaymentMethod).length === 0 && (
                    <div className="text-center text-gray-400 py-4 text-sm">Nenhuma venda registrada</div>
                )}
            </div>
        </div>

        {/* Col 3: Accounts Payable */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
             <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-gray-100 rounded text-gray-600"><DollarSign size={16}/></div>
                <h3 className="font-bold text-gray-800">Contas a pagar</h3>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <div className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-300 mb-3">
                    <CheckCircle size={24} />
                </div>
                <h4 className="font-bold text-gray-700">Nenhuma conta pendente</h4>
                <p className="text-xs text-gray-400 max-w-[200px]">Suas contas pendentes de pagamento aparecerão aqui</p>
            </div>
        </div>
      </div>

      {/* Bottom Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Last Sales */}
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">Últimas vendas emitidas</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="text-xs text-gray-400 border-b border-gray-100">
                        <tr>
                            <th className="text-left py-2 font-normal">Data</th>
                            <th className="text-left py-2 font-normal">Cliente</th>
                            <th className="text-right py-2 font-normal">Valor</th>
                            <th className="text-center py-2 font-normal">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {transactions.filter(t => t.type === TransactionType.INCOME).slice(0, 5).map(t => (
                            <tr key={t.id}>
                                <td className="py-3 text-gray-600 text-xs">{new Date(t.date).toLocaleDateString()}</td>
                                <td className="py-3 text-gray-800 font-medium truncate max-w-[120px]">
                                    {t.transactionDetails?.customerName || 'Consumidor Final'}
                                </td>
                                <td className="py-3 text-right text-gray-800">R$ {t.amount.toFixed(2)}</td>
                                <td className="py-3 text-center">
                                    <button className="text-gray-400 hover:text-blue-500 flex items-center justify-center w-full gap-1 text-xs">
                                        Ver <Eye size={12} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
         </div>

         {/* Last Products */}
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">Últimos produtos vendidos</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="text-xs text-gray-400 border-b border-gray-100">
                        <tr>
                            <th className="text-left py-2 font-normal">Data</th>
                            <th className="text-left py-2 font-normal">Produto</th>
                            <th className="text-right py-2 font-normal">Valor</th>
                            <th className="text-center py-2 font-normal">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {recentItems.map((item, idx) => (
                            <tr key={idx}>
                                <td className="py-3 text-gray-600 text-xs">{new Date(item.date).toLocaleDateString()}</td>
                                <td className="py-3 text-gray-800 font-medium truncate max-w-[180px] text-xs uppercase">
                                    {item.name}
                                </td>
                                <td className="py-3 text-right text-gray-800">R$ {item.value.toFixed(2)}</td>
                                <td className="py-3 text-center">
                                    <button className="text-gray-400 hover:text-blue-500 flex items-center justify-center w-full">
                                        <Eye size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
         </div>
      </div>
    </div>
  );
};