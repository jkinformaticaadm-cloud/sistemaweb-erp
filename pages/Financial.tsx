import React from 'react';
import { useData } from '../context/DataContext';
import { TransactionType } from '../types';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export const Financial: React.FC = () => {
  const { transactions } = useData();

  const income = transactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
  const expense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
  const balance = income - expense;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Financeiro</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Receitas</p>
            <h2 className="text-2xl font-bold text-green-600">+ R$ {income.toFixed(2)}</h2>
          </div>
          <div className="p-3 bg-green-50 rounded-full text-green-600">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Despesas</p>
            <h2 className="text-2xl font-bold text-red-600">- R$ {expense.toFixed(2)}</h2>
          </div>
          <div className="p-3 bg-red-50 rounded-full text-red-600">
            <TrendingDown size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Saldo Atual</p>
            <h2 className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              R$ {balance.toFixed(2)}
            </h2>
          </div>
          <div className="p-3 bg-blue-50 rounded-full text-blue-600">
            <DollarSign size={24} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-700">Histórico de Transações</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
              <tr>
                <th className="px-6 py-3">Data</th>
                <th className="px-6 py-3">Descrição</th>
                <th className="px-6 py-3">Categoria</th>
                <th className="px-6 py-3 text-right">Valor</th>
                <th className="px-6 py-3 text-center">Tipo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{new Date(t.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">{t.description}</td>
                  <td className="px-6 py-4">{t.category}</td>
                  <td className={`px-6 py-4 text-right font-medium ${t.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {t.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${t.type === TransactionType.INCOME ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {t.type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};