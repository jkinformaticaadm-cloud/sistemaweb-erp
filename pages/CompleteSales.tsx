
import React from 'react';
import { Construction, ArrowLeft, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CompleteSales: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-150px)] text-center p-8 animate-fade-in bg-white rounded-2xl shadow-sm border border-gray-100 m-4">
      <div className="bg-yellow-50 p-8 rounded-full mb-6 ring-8 ring-yellow-50/50">
        <Construction size={64} className="text-yellow-600" />
      </div>
      
      <h1 className="text-3xl font-bold text-gray-800 mb-3">Módulo em Manutenção</h1>
      
      <p className="text-gray-500 max-w-md mb-8 leading-relaxed">
        Estamos realizando melhorias no módulo de <strong>Venda Completa</strong> para oferecer mais recursos e estabilidade.
        <br/><br/>
        Por favor, utilize o <strong>PDV Rápido</strong> para realizar suas vendas temporariamente.
      </p>
      
      <div className="flex gap-4">
        <button 
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors flex items-center gap-2"
        >
            <ArrowLeft size={20} />
            Voltar ao Início
        </button>

        <button 
            onClick={() => navigate('/vendas')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-transform hover:-translate-y-1 flex items-center gap-2"
        >
            <ShoppingCart size={20} />
            Ir para PDV Rápido
        </button>
      </div>
    </div>
  );
};
