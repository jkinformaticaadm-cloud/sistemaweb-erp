import React, { createContext, useContext, useState, useEffect } from 'react';
import { Customer, Product, ServiceOrder, Transaction, OSStatus, TransactionType, SystemSettings } from '../types';

interface DataContextType {
  customers: Customer[];
  products: Product[];
  serviceOrders: ServiceOrder[];
  transactions: Transaction[];
  settings: SystemSettings;
  addCustomer: (c: Customer) => void;
  addProduct: (p: Product) => void;
  addServiceOrder: (os: ServiceOrder) => void;
  updateServiceOrder: (id: string, updates: Partial<ServiceOrder>) => void;
  addTransaction: (t: Transaction) => void;
  updateStock: (productId: string, quantity: number) => void;
  updateSettings: (s: Partial<SystemSettings>) => void;
  resetData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Initial Mock Data
const initialCustomers: Customer[] = [
  { id: '1', name: 'João Silva', phone: '(11) 99999-9999', email: 'joao@email.com', address: 'Rua A, 123' },
  { id: '2', name: 'Maria Souza', phone: '(11) 88888-8888', email: 'maria@email.com', address: 'Av B, 456' },
];

const initialProducts: Product[] = [
  { id: '1', name: 'Tela iPhone 13 Original', price: 1200, cost: 600, stock: 5, category: 'Peças' },
  { id: '2', name: 'Bateria Samsung S20', price: 350, cost: 150, stock: 10, category: 'Peças' },
  { id: '3', name: 'Película de Vidro 3D', price: 50, cost: 5, stock: 100, category: 'Acessórios' },
  { id: '4', name: 'Cabo USB-C Premium', price: 80, cost: 20, stock: 30, category: 'Acessórios' },
];

const initialOS: ServiceOrder[] = [
  { 
    id: 'OS-001', 
    customerId: '1', 
    customerName: 'João Silva', 
    device: 'iPhone 13', 
    description: 'Tela quebrada após queda.', 
    status: OSStatus.EM_ANDAMENTO, 
    priority: 'Alta', 
    createdAt: new Date().toISOString(), 
    totalValue: 1200 
  },
  { 
    id: 'OS-002', 
    customerId: '2', 
    customerName: 'Maria Souza', 
    device: 'Notebook Dell', 
    description: 'Não liga, luz de power pisca laranja.', 
    status: OSStatus.PENDENTE, 
    priority: 'Média', 
    createdAt: new Date(Date.now() - 86400000).toISOString(), 
    totalValue: 0 
  }
];

const initialTransactions: Transaction[] = [
  { id: '1', description: 'Venda Balcão #101', amount: 150, type: TransactionType.INCOME, date: new Date().toISOString(), category: 'Vendas' },
  { id: '2', description: 'Compra de Peças', amount: 450, type: TransactionType.EXPENSE, date: new Date().toISOString(), category: 'Fornecedor' },
];

const initialSettings: SystemSettings = {
  companyName: 'TechFix Pro',
  cnpj: '00.000.000/0001-00',
  email: 'contato@techfix.com',
  phone: '(11) 9999-9999',
  address: 'Rua das Tecnologias, 100, São Paulo - SP',
  enableNotifications: true,
  enableSound: true
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>(initialOS);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [settings, setSettings] = useState<SystemSettings>(initialSettings);

  const addCustomer = (c: Customer) => setCustomers([...customers, c]);
  const addProduct = (p: Product) => setProducts([...products, p]);
  
  const addServiceOrder = (os: ServiceOrder) => {
    setServiceOrders([os, ...serviceOrders]);
  };

  const updateServiceOrder = (id: string, updates: Partial<ServiceOrder>) => {
    setServiceOrders(prev => prev.map(os => os.id === id ? { ...os, ...updates } : os));
  };

  const addTransaction = (t: Transaction) => setTransactions([t, ...transactions]);

  const updateStock = (productId: string, quantity: number) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: p.stock - quantity } : p));
  };

  const updateSettings = (s: Partial<SystemSettings>) => {
    setSettings(prev => ({ ...prev, ...s }));
  };

  const resetData = () => {
    if (confirm("Tem certeza? Todos os dados adicionados serão perdidos e restaurados para o estado inicial.")) {
      setCustomers(initialCustomers);
      setProducts(initialProducts);
      setServiceOrders(initialOS);
      setTransactions(initialTransactions);
      setSettings(initialSettings);
    }
  };

  return (
    <DataContext.Provider value={{
      customers, products, serviceOrders, transactions, settings,
      addCustomer, addProduct, addServiceOrder, updateServiceOrder, addTransaction, updateStock, updateSettings, resetData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within a DataProvider");
  return context;
};