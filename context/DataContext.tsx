
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Customer, Product, ServiceOrder, Transaction, OSStatus, TransactionType, SystemSettings, SalesOrder, OrderStatus, CartItem, Supply, ServiceItem, Purchase, PaymentMachine, InstallmentPlan, Installment, PayableAccount, FinancialGoal } from '../types';

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
  installmentPlans: InstallmentPlan[];
  payableAccounts: PayableAccount[];
  financialGoals: FinancialGoal;
  
  addCustomer: (c: Customer) => void;
  updateCustomer: (id: string, c: Partial<Customer>) => void;
  updateCustomerCredit: (customerId: string, amount: number, operation: 'add' | 'set') => void;
  
  addProduct: (p: Product) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  addServiceOrder: (os: ServiceOrder) => void;
  updateServiceOrder: (id: string, updates: Partial<ServiceOrder>) => void;
  addTransaction: (t: Transaction) => void;
  processRefund: (originalTransaction: Transaction, refundType: 'money' | 'credit', customerId?: string) => void;
  
  updateStock: (productId: string, quantity: number) => void;
  addSalesOrder: (order: SalesOrder) => void;
  updateSalesOrder: (id: string, updates: Partial<SalesOrder>) => void;
  updateSettings: (s: Partial<SystemSettings>) => void;
  
  addSupply: (s: Supply) => void;
  updateSupplyStock: (id: string, qty: number) => void;
  addService: (s: ServiceItem) => void;
  addPurchase: (p: Purchase) => void;
  
  // Crediário
  addInstallmentPlan: (plan: InstallmentPlan) => void;
  payInstallment: (planId: string, installmentNumber: number) => void;
  updateInstallmentValue: (planId: string, installmentNumber: number, newValue: number) => void;

  // Financial
  addPayableAccount: (account: PayableAccount) => void;
  payPayableAccount: (id: string) => void;
  deletePayableAccount: (id: string) => void;
  updateFinancialGoals: (goals: FinancialGoal) => void;

  resetData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Initial Mock Data
const initialCustomers: Customer[] = [
  { id: '1', name: 'João Silva', phone: '(11) 99999-9999', email: 'joao@email.com', address: 'Rua das Flores, Bairro Jardim', addressNumber: '123', cep: '01001-000', cpfOrCnpj: '123.456.789-00', creditBalance: 50.00 },
  { id: '2', name: 'Maria Souza', phone: '(11) 88888-8888', email: 'maria@email.com', address: 'Av Paulista, Centro', addressNumber: '1000', cep: '01310-100', cpfOrCnpj: '987.654.321-99', creditBalance: 0 },
];

const initialProducts: Product[] = [
  { 
    id: '1', 
    name: 'Tela iPhone 13 Original', 
    price: 1200, 
    cost: 600, 
    stock: 5, 
    category: 'Peças',
    compatibility: 'iPhone 13',
    minStock: 2,
    maxStock: 10
  },
  { 
    id: '2', 
    name: 'iPhone 11 64GB', 
    price: 2500, 
    cost: 1800, 
    stock: 2, 
    category: 'Aparelhos',
    brand: 'Apple',
    model: 'iPhone 11',
    storage: '64GB',
    color: 'Preto',
    condition: 'Usado',
    imei: '35489000000001'
  },
  {
    id: '3',
    name: 'Capa TPU Transparente',
    price: 30,
    cost: 5,
    stock: 50,
    category: 'Capas TPU',
    compatibility: 'Samsung S20',
    minStock: 10,
    maxStock: 100
  }
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

// Crediário Mock
const initialInstallmentPlans: InstallmentPlan[] = [
   {
      id: 'CRED-1001',
      customerId: '1',
      customerName: 'João Silva',
      customerAddress: 'Rua das Flores, Bairro Jardim, 123',
      productName: 'iPhone 13',
      brand: 'Apple',
      model: '128GB Midnight',
      serialNumber: 'SN123456',
      totalValue: 4000,
      frequency: 'Mensal',
      createdAt: new Date().toISOString(),
      installments: [
         { number: 1, value: 1000, dueDate: new Date().toISOString(), status: 'Pago', paidAt: new Date().toISOString() },
         { number: 2, value: 1000, dueDate: new Date(Date.now() + 2592000000).toISOString(), status: 'Pendente' },
         { number: 3, value: 1000, dueDate: new Date(Date.now() + 5184000000).toISOString(), status: 'Pendente' },
         { number: 4, value: 1000, dueDate: new Date(Date.now() + 7776000000).toISOString(), status: 'Pendente' },
      ]
   }
];

// Payable Accounts Mock
const initialPayables: PayableAccount[] = [
  {
    id: 'PAY-1',
    description: 'Conta de Energia',
    amount: 350.00,
    dueDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(),
    status: 'Pendente',
    category: 'Despesas Fixas',
    recurrence: 'Mensal'
  },
  {
    id: 'PAY-2',
    description: 'Aluguel Loja',
    amount: 1500.00,
    dueDate: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString(),
    status: 'Pendente',
    category: 'Despesas Fixas',
    recurrence: 'Mensal'
  }
];

const initialGoals: FinancialGoal = {
  revenueGoal: 20000,
  expenseLimit: 5000
};

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
  const [installmentPlans, setInstallmentPlans] = useState<InstallmentPlan[]>(initialInstallmentPlans);
  const [payableAccounts, setPayableAccounts] = useState<PayableAccount[]>(initialPayables);
  const [financialGoals, setFinancialGoals] = useState<FinancialGoal>(initialGoals);
  const [settings, setSettings] = useState<SystemSettings>(initialSettings);

  const addCustomer = (c: Customer) => setCustomers([...customers, c]);
  
  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const updateCustomerCredit = (customerId: string, amount: number, operation: 'add' | 'set') => {
     setCustomers(prev => prev.map(c => {
        if (c.id === customerId) {
           const newBalance = operation === 'add' ? (c.creditBalance || 0) + amount : amount;
           return { ...c, creditBalance: Math.max(0, newBalance) };
        }
        return c;
     }));
  };

  const addProduct = (p: Product) => setProducts([...products, p]);
  
  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

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
               category: 'Serviços de Assistência',
               transactionDetails: {
                  customerName: os.customerName,
                  paymentMethod: updates.paymentMethod || 'Dinheiro', // Capture payment method here
                  items: [] // Could populate with OS items if structure matched CartItem perfectly
               }
             };
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

  const processRefund = (originalTransaction: Transaction, refundType: 'money' | 'credit', customerId?: string) => {
     // 1. Create Refund Transaction (Expense to neutralize the Income)
     const refundTransaction: Transaction = {
        id: `REF-${originalTransaction.id}-${Date.now()}`,
        description: `Estorno (${refundType === 'money' ? 'Devolução' : 'Crédito'}) - Ref: ${originalTransaction.description}`,
        amount: originalTransaction.amount,
        type: TransactionType.EXPENSE, // Money out or liability created
        date: new Date().toISOString(),
        category: 'Estornos',
        transactionDetails: {
           ...originalTransaction.transactionDetails,
           refunded: true
        }
     };
     addTransaction(refundTransaction);

     // 2. Mark original transaction as refunded (Optional in simple model, but good for UI)
     setTransactions(prev => prev.map(t => 
        t.id === originalTransaction.id 
        ? { ...t, transactionDetails: { ...t.transactionDetails, refunded: true } }
        : t
     ));

     // 3. If Credit Store, add balance to customer
     if (refundType === 'credit' && customerId) {
        updateCustomerCredit(customerId, originalTransaction.amount, 'add');
     }
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

  // --- Crediário Methods ---
  const addInstallmentPlan = (plan: InstallmentPlan) => {
    setInstallmentPlans([plan, ...installmentPlans]);
  };

  const payInstallment = (planId: string, installmentNumber: number) => {
    setInstallmentPlans(prev => prev.map(plan => {
      if (plan.id !== planId) return plan;

      const updatedInstallments = plan.installments.map(inst => {
        if (inst.number === installmentNumber && inst.status !== 'Pago') {
           // Create Transaction
           const newTransaction: Transaction = {
             id: `TR-CRED-${plan.id}-${inst.number}`,
             description: `Crediário ${plan.customerName} - Parc. ${inst.number}`,
             amount: inst.value,
             type: TransactionType.INCOME,
             date: new Date().toISOString(),
             category: 'Crediário'
           };
           // We need to use setTimeout to update transactions state to avoid race condition/render cycle issues here
           setTimeout(() => setTransactions(curr => [newTransaction, ...curr]), 0);
           
           return { ...inst, status: 'Pago' as const, paidAt: new Date().toISOString() };
        }
        return inst;
      });

      return { ...plan, installments: updatedInstallments };
    }));
  };

  const updateInstallmentValue = (planId: string, installmentNumber: number, newValue: number) => {
     setInstallmentPlans(prev => prev.map(plan => {
        if (plan.id !== planId) return plan;
        return {
           ...plan,
           installments: plan.installments.map(inst => 
              inst.number === installmentNumber ? { ...inst, value: newValue } : inst
           )
        };
     }));
  };

  // --- Payable Accounts Methods ---
  const addPayableAccount = (account: PayableAccount) => {
    setPayableAccounts(prev => [...prev, account]);
  };

  const payPayableAccount = (id: string) => {
    setPayableAccounts(prev => prev.map(acc => {
      if (acc.id === id && acc.status !== 'Pago') {
        // Create Transaction
        const newTransaction: Transaction = {
          id: `TR-PAY-${id}-${Date.now()}`,
          description: `Pagamento: ${acc.description}`,
          amount: acc.amount,
          type: TransactionType.EXPENSE,
          date: new Date().toISOString(),
          category: acc.category
        };
        setTimeout(() => setTransactions(curr => [newTransaction, ...curr]), 0);
        return { ...acc, status: 'Pago', paidAt: new Date().toISOString() };
      }
      return acc;
    }));
  };

  const deletePayableAccount = (id: string) => {
    setPayableAccounts(prev => prev.filter(acc => acc.id !== id));
  };

  const updateFinancialGoals = (goals: FinancialGoal) => {
    setFinancialGoals(goals);
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
      setInstallmentPlans(initialInstallmentPlans);
      setSettings(initialSettings);
      setPayableAccounts(initialPayables);
      setFinancialGoals(initialGoals);
    }
  };

  return (
    <DataContext.Provider value={{
      customers, products, serviceOrders, transactions, salesOrders, settings,
      supplies, services, purchases, installmentPlans, payableAccounts, financialGoals,
      addCustomer, updateCustomer, updateCustomerCredit,
      addProduct, updateProduct, addServiceOrder, updateServiceOrder, addTransaction, processRefund,
      updateStock, 
      addSalesOrder, updateSalesOrder, updateSettings, 
      addSupply, updateSupplyStock, addService, addPurchase,
      addInstallmentPlan, payInstallment, updateInstallmentValue,
      addPayableAccount, payPayableAccount, deletePayableAccount, updateFinancialGoals,
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
