
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Wrench, Users, Package, PieChart, Settings, LogOut, BookOpen, FileBadge } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  const links = [
    { to: "/", icon: <LayoutDashboard size={20} />, label: "Dashboard", roles: ['ADMIN', 'USER'] },
    { to: "/vendas", icon: <ShoppingCart size={20} />, label: "PDV Rápido", roles: ['ADMIN', 'USER'] },
    { to: "/vendas-completas", icon: <FileBadge size={20} />, label: "Venda Completa", roles: ['ADMIN', 'USER'] },
    { to: "/os", icon: <Wrench size={20} />, label: "Ordens de Serviço", roles: ['ADMIN', 'USER'] },
    { to: "/clientes", icon: <Users size={20} />, label: "Clientes", roles: ['ADMIN', 'USER'] },
    { to: "/produtos", icon: <Package size={20} />, label: "Produtos", roles: ['ADMIN', 'USER'] },
    { to: "/crediario", icon: <BookOpen size={20} />, label: "Crediário", roles: ['ADMIN', 'USER'] },
    { to: "/financeiro", icon: <PieChart size={20} />, label: "Financeiro", roles: ['ADMIN', 'USER'] },
    // Settings only for ADMIN
    { to: "/configuracoes", icon: <Settings size={20} />, label: "Configurações", roles: ['ADMIN'] },
  ];

  return (
    <aside className="w-64 bg-primary text-gray-300 flex flex-col h-screen fixed left-0 top-0 z-10 transition-transform print:hidden">
      <div className="p-6 border-b border-gray-700 flex items-center gap-3">
        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-white font-bold">
          TF
        </div>
        <h1 className="text-xl font-bold text-white">RTJK INFOCELL</h1>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {links.filter(link => user && link.roles.includes(user.role)).map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                ? 'bg-accent text-white shadow-md' 
                : 'hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            {link.icon}
            <span className="font-medium">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <div className="mb-4 px-4">
           <p className="text-xs text-gray-500 uppercase font-bold">Logado como</p>
           <p className="text-sm font-bold text-white truncate">{user?.name || 'Usuário'}</p>
           <p className={`text-[10px] font-bold inline-block px-2 py-0.5 rounded mt-1 
              ${user?.role === 'ADMIN' ? 'bg-red-900/50 text-red-200' : 'bg-blue-900/50 text-blue-200'}`}>
              {user?.role === 'ADMIN' ? 'Administrador' : 'Usuário Padrão'}
           </p>
        </div>
        <button 
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-red-900/30 text-red-400 hover:text-red-300 transition-colors"
        >
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
};
