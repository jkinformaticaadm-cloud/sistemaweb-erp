
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Wrench, Users, Package, PieChart, Settings, LogOut, BookOpen, FileBadge } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const links = [
    { to: "/", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { to: "/vendas", icon: <ShoppingCart size={20} />, label: "PDV Rápido" },
    { to: "/vendas-completas", icon: <FileBadge size={20} />, label: "Venda Completa" },
    { to: "/os", icon: <Wrench size={20} />, label: "Ordens de Serviço" },
    { to: "/clientes", icon: <Users size={20} />, label: "Clientes" },
    { to: "/produtos", icon: <Package size={20} />, label: "Produtos" },
    { to: "/crediario", icon: <BookOpen size={20} />, label: "Crediário" },
    { to: "/financeiro", icon: <PieChart size={20} />, label: "Financeiro" },
    { to: "/configuracoes", icon: <Settings size={20} />, label: "Configurações" },
  ];

  return (
    <aside className="w-64 bg-primary text-gray-300 flex flex-col h-screen fixed left-0 top-0 z-10 transition-transform print:hidden">
      <div className="p-6 border-b border-gray-700 flex items-center gap-3">
        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-white font-bold">
          TF
        </div>
        <h1 className="text-xl font-bold text-white">TechFix Pro</h1>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {links.map(link => (
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
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-red-900/30 text-red-400 hover:text-red-300 transition-colors">
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
};
