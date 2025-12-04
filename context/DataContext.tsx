
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Customer, Product, ServiceOrder, Transaction, OSStatus, TransactionType, SystemSettings, SalesOrder, OrderStatus, CartItem, Supply, ServiceItem, Purchase, PaymentMachine } from '../types';

interface DataContextType {
  customers: Customer[];
  products: Product[];
  serviceOrders: ServiceOrder[];
  transactions: Transaction[];
  salesOrders: SalesOrder[];
  settings: SystemSettings;
  supplies: Supply[];
  services: ServiceItem[];
  purchases: Purchase[];
  
  addCustomer: (c: Customer) => void;
  updateCustomer: (id: string, c: Partial<Customer>) => void;
  addProduct: (p: Product) => void;
  addServiceOrder: (os: ServiceOrder) => void;
  updateServiceOrder: (id: string, updates: Partial<ServiceOrder>) => void;
  addTransaction: (t: Transaction) => void;
  updateStock: (productId: string, quantity: number) => void;
  addSalesOrder: (order: SalesOrder) => void;
  updateSalesOrder: (id: string, updates: Partial<SalesOrder>) => void;
  updateSettings: (s: Partial<SystemSettings>) => void;
  
  addSupply: (s: Supply) => void;
  updateSupplyStock: (id: string, qty: number) => void;
  addService: (s: ServiceItem) => void;
  addPurchase: (p: Purchase) => void;
  
  resetData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Initial Mock Data
const initialCustomers: Customer[] = [
  { id: '1', name: 'João Silva', phone: '(11) 99999-9999', email: 'joao@email.com', address: 'Rua das Flores, Bairro Jardim', addressNumber: '123', cep: '01001-000', cpfOrCnpj: '123.456.789-00' },
  { id: '2', name: 'Maria Souza', phone: '(11) 88888-8888', email: 'maria@email.com', address: 'Av Paulista, Centro', addressNumber: '1000', cep: '01310-100', cpfOrCnpj: '987.654.321-99' },
];

const initialProducts: Product[] = [
  { id: '1', name: 'Tela iPhone 13 Original', price: 1200, cost: 600, stock: 5, category: 'Peças' },
  { id: '2', name: 'Bateria Samsung S20', price: 350, cost: 150, stock: 10, category: 'Peças' },
];

const initialSupplies: Supply[] = [
  { id: '1', name: 'Cola B-7000', unit: 'un', cost: 15.00, stock: 20, minStock: 5 },
  { id: '2', name: 'Álcool Isopropílico', unit: 'litro', cost: 45.00, stock: 2, minStock: 1 },
];

const initialServices: ServiceItem[] = [
  { id: '1', name: 'Troca de Tela', price: 150.00, description: 'Mão de obra para troca de frontal' },
  { id: '2', name: 'Banho Químico', price: 120.00, description: 'Desoxidação de placa lógica' },
];

const initialOS: ServiceOrder[] = [
  { 
    id: 'OS-1001', 
    customerId: '1', 
    customerName: 'João Silva', 
    device: 'iPhone 13', 
    imei: '354810000000001',
    serialNumber: 'F17D9A001',
    description: 'Tela quebrada após queda.', 
    status: OSStatus.EM_ANDAMENTO, 
    priority: 'Alta', 
    createdAt: new Date().toISOString(), 
    totalValue: 1350,
    warranty: '90 Dias (Peça e Mão de obra)',
    technicalNotes: 'Aguardando secagem da cola.',
    items: [
      { id: '1', name: 'Troca de Tela', quantity: 1, unitPrice: 150, total: 150, type: 'service' },
      { id: 'p1', name: 'Tela iPhone 13 Original', quantity: 1, unitPrice: 1200, total: 1200, type: 'product' }
    ]
  },
  { 
    id: 'OS-1002', 
    customerId: '2', 
    customerName: 'Maria Souza', 
    device: 'Notebook Dell', 
    imei: '',
    serialNumber: 'TAG-DX0001',
    description: 'Não liga, luz de power pisca laranja.', 
    status: OSStatus.PENDENTE, 
    priority: 'Média', 
    createdAt: new Date(Date.now() - 86400000).toISOString(), 
    totalValue: 0,
    warranty: '30 Dias (Diagnóstico)',
    items: []
  }
];

const initialTransactions: Transaction[] = [
  { id: '1', description: 'Venda Balcão #101', amount: 150, type: TransactionType.INCOME, date: new Date().toISOString(), category: 'Vendas' },
];

const initialSalesOrders: SalesOrder[] = [];

// Default Machine Data
const defaultMachine: PaymentMachine = {
  id: 'machine-1',
  name: 'Máquina Padrão (Ex: Stone/Cielo)',
  debitRate: 1.99,
  creditRates: Array.from({ length: 18 }, (_, i) => ({ installments: i + 1, rate: 3.0 + (i * 1.5) }))
};

const initialSettings: SystemSettings = {
  companyName: 'TechFix Pro',
  cnpj: '00.000.000/0001-00',
  email: 'contato@techfix.com',
  phone: '(11) 9999-9999',
  address: 'Rua das Tecnologias, 100, São Paulo - SP',
  enableNotifications: true,
  enableSound: true,
  pixKey: '00.000.000/0001-00',
  paymentMachines: [defaultMachine]
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [supplies, setSupplies] = useState<Supply[]>(initialSupplies);
  const [services, setServices] = useState<ServiceItem[]>(initialServices);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>(initialOS);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(initialSalesOrders);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(initialSettings);

  const addCustomer = (c: Customer) => setCustomers([...customers, c]);
  
  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const addProduct = (p: Product) => setProducts([...products, p]);
  
  const addServiceOrder = (os: ServiceOrder) => {
    setServiceOrders([os, ...serviceOrders]);
  };

  const addTransaction = (t: Transaction) => setTransactions(prev => [t, ...prev]);

  const updateServiceOrder = (id: string, updates: Partial<ServiceOrder>) => {
    setServiceOrders(prev => prev.map(os => {
      if (os.id === id) {
        // If status changing to FINALIZADO, create income transaction
        if (updates.status === OSStatus.FINALIZADO && os.status !== OSStatus.FINALIZADO) {
           const finalTotal = updates.totalValue !== undefined ? updates.totalValue : os.totalValue;
           if (finalTotal > 0) {
             const newTransaction: Transaction = {
               id: `TR-OS-${os.id}-${Date.now()}`,
               description: `Faturamento OS #${os.id} - ${os.customerName}`,
               amount: finalTotal,
               type: TransactionType.INCOME,
               date: new Date().toISOString(),
               category: 'Serviços de Assistência'
             };
             // Use the functional update from setTransactions directly or the wrapper
             // Since we are inside the map, we need to be careful with state updates.
             // We'll call addTransaction outside. But wait, we can't easily.
             // Best to use a timeout or just call the state setter.
             setTimeout(() => {
                setTransactions(curr => [newTransaction, ...curr]);
             }, 0);
           }
        }
        return { ...os, ...updates };
      }
      return os;
    }));
  };

  const updateStock = (productId: string, quantity: number) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: p.stock - quantity } : p));
  };

  const addSalesOrder = (order: SalesOrder) => {
    setSalesOrders([order, ...salesOrders]);
  };

  const updateSalesOrder = (id: string, updates: Partial<SalesOrder>) => {
    setSalesOrders(prev => prev.map(order => order.id === id ? { ...order, ...updates } : order));
  };

  const updateSettings = (s: Partial<SystemSettings>) => {
    setSettings(prev => ({ ...prev, ...s }));
  };

  // New Methods
  const addSupply = (s: Supply) => setSupplies([...supplies, s]);
  const updateSupplyStock = (id: string, qty: number) => {
    setSupplies(prev => prev.map(s => s.id === id ? { ...s, stock: s.stock + qty } : s));
  };
  const addService = (s: ServiceItem) => setServices([...services, s]);
  
  const addPurchase = (p: Purchase) => {
    setPurchases([p, ...purchases]);
    // Increase stock
    updateSupplyStock(p.supplyId, p.quantity);
    // Add Expense Transaction
    addTransaction({
      id: `TR-BUY-${Date.now()}`,
      description: `Compra: ${p.supplyName}`,
      amount: p.totalCost,
      type: TransactionType.EXPENSE,
      date: p.date,
      category: 'Insumos'
    });
  };

  const resetData = () => {
    if (confirm("Tem certeza? Todos os dados adicionados serão perdidos.")) {
      setCustomers(initialCustomers);
      setProducts(initialProducts);
      setServiceOrders(initialOS);
      setTransactions(initialTransactions);
      setSupplies(initialSupplies);
      setServices(initialServices);
      setPurchases([]);
      setSettings(initialSettings);
    }
  };

  return (
    <DataContext.Provider value={{
      customers, products, serviceOrders, transactions, salesOrders, settings,
      supplies, services, purchases,
      addCustomer, updateCustomer, addProduct, addServiceOrder, updateServiceOrder, addTransaction, updateStock, 
      addSalesOrder, updateSalesOrder, updateSettings, 
      addSupply, updateSupplyStock, addService, addPurchase,
      resetData
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
