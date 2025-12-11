
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { ServiceOrders } from './pages/ServiceOrders';
import { Sales } from './pages/Sales';
import { CompleteSales } from './pages/CompleteSales';
import { Customers } from './pages/Customers';
import { Products } from './pages/Products';
import { Financial } from './pages/Financial';
import { Settings } from './pages/Settings';
import { Installments } from './pages/Installments';
import { Login } from './pages/Login';
import { DataProvider } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Bell, User as UserIcon } from 'lucide-react';

// Wrapper component to handle protected layout
const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="flex bg-gray-50 min-h-screen font-sans">
      <Sidebar />
      
      <main className="flex-1 ml-64 min-h-screen flex flex-col print:ml-0 print:w-full">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex justify-end items-center px-8 shadow-sm sticky top-0 z-10 print:hidden">
          <div className="flex items-center gap-6">
            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.role === 'ADMIN' ? 'Administrador' : 'Funcionário'}</p>
              </div>
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 border-2 border-white shadow-sm">
                <UserIcon size={20} />
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8 print:p-0">
          {children}
        </div>
      </main>
    </div>
  );
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/vendas" element={<ProtectedLayout><Sales /></ProtectedLayout>} />
      <Route path="/vendas-completas" element={<ProtectedLayout><CompleteSales /></ProtectedLayout>} />
      <Route path="/os" element={<ProtectedLayout><ServiceOrders /></ProtectedLayout>} />
      <Route path="/clientes" element={<ProtectedLayout><Customers /></ProtectedLayout>} />
      <Route path="/produtos" element={<ProtectedLayout><Products /></ProtectedLayout>} />
      <Route path="/crediario" element={<ProtectedLayout><Installments /></ProtectedLayout>} />
      <Route path="/financeiro" element={<ProtectedLayout><Financial /></ProtectedLayout>} />
      <Route path="/configuracoes" element={<ProtectedLayout><Settings /></ProtectedLayout>} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </DataProvider>
    </AuthProvider>
  );
};

export default App;
