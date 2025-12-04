import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { ServiceOrders } from './pages/ServiceOrders';
import { Sales } from './pages/Sales';
import { Customers } from './pages/Customers';
import { Products } from './pages/Products';
import { Financial } from './pages/Financial';
import { Settings } from './pages/Settings';
import { DataProvider } from './context/DataContext';
import { Bell, User } from 'lucide-react';

const App: React.FC = () => {
  return (
    <DataProvider>
      <HashRouter>
        <div className="flex bg-gray-50 min-h-screen font-sans">
          <Sidebar />
          
          <main className="flex-1 ml-64 min-h-screen flex flex-col">
            {/* Top Bar */}
            <header className="h-16 bg-white border-b border-gray-200 flex justify-end items-center px-8 shadow-sm sticky top-0 z-10">
              <div className="flex items-center gap-6">
                <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                  <Bell size={20} />
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
                <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-semibold text-gray-800">Admin</p>
                    <p className="text-xs text-gray-500">Gerente</p>
                  </div>
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 border-2 border-white shadow-sm">
                    <User size={20} />
                  </div>
                </div>
              </div>
            </header>

            {/* Content */}
            <div className="p-8">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/vendas" element={<Sales />} />
                <Route path="/os" element={<ServiceOrders />} />
                <Route path="/clientes" element={<Customers />} />
                <Route path="/produtos" element={<Products />} />
                <Route path="/financeiro" element={<Financial />} />
                <Route path="/configuracoes" element={<Settings />} />
              </Routes>
            </div>
          </main>
        </div>
      </HashRouter>
    </DataProvider>
  );
};

export default App;