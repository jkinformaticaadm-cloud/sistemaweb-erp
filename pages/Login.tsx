
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  
  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(username, password);
      if (!success) setError('Usuário ou senha incorretos.');
    } catch (err) {
      setError('Ocorreu um erro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side (Visual) - Handled as full card */}
        <div className="w-full p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gray-900 rounded-xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-lg shadow-blue-900/20">
              RTJK
            </div>
            <h1 className="text-2xl font-bold text-gray-800">RTJK INFOCELL</h1>
            <p className="text-gray-500 text-sm mt-1">Sistema de Gestão Integrado</p>
          </div>

          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            Acesso Restrito
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 uppercase ml-1">Usuário</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text" 
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Seu usuário"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 uppercase ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="password" 
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="******"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center font-medium">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verificando...' : 'Entrar no Sistema'}
              {!isLoading && <ArrowRight size={20}/>}
            </button>
          </form>

          <div className="mt-8 text-center text-xs text-gray-400 bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200">
             <div className="flex justify-center mb-1 text-gray-500"><ShieldCheck size={16} /></div>
             <p>Acesso exclusivo para funcionários.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
