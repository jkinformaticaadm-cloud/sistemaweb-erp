
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Customer, Product, ServiceOrder, Transaction, OSStatus, TransactionType, SystemSettings, SalesOrder, OrderStatus, CartItem, Supply, ServiceItem, Purchase, PaymentMachine, InstallmentPlan, Installment, PayableAccount, FinancialGoal } from '../types';
import { supabase, toCamel, toSnake } from '../services/supabase';

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
  
  isLoading: boolean;
  
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

  resetData: () => Promise<void>;
  backupSystem: () => void;
  restoreSystem: (file: File) => Promise<boolean>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// --- MOCK DATA (Fallback) ---
const initialCustomers: Customer[] = [
  { id: '1', name: 'João Silva', phone: '(11) 99999-9999', email: 'joao@email.com', address: 'Rua das Flores, Bairro Jardim', addressNumber: '123', cep: '01001-000', cpfOrCnpj: '123.456.789-00', creditBalance: 50.00 },
];
const initialProducts: Product[] = [
  { id: '1', name: 'Tela iPhone 13 Original', price: 1200, cost: 600, stock: 5, category: 'Peças', compatibility: 'iPhone 13', minStock: 2, maxStock: 10 },
];
const initialSupplies: Supply[] = [];
const initialServices: ServiceItem[] = [
    { id: '1', name: 'Troca de Tela', price: 150.00, description: 'Mão de obra para troca de frontal' }
];
const initialOS: ServiceOrder[] = [];
const initialTransactions: Transaction[] = [];
const initialSalesOrders: SalesOrder[] = [];
const initialInstallmentPlans: InstallmentPlan[] = [];
const initialPayables: PayableAccount[] = [];
const initialGoals: FinancialGoal = { revenueGoal: 20000, expenseLimit: 5000 };
const defaultMachine: PaymentMachine = {
  id: 'machine-1',
  name: 'Máquina Padrão',
  debitRate: 1.99,
  creditRates: Array.from({ length: 18 }, (_, i) => ({ installments: i + 1, rate: 3.0 + (i * 1.5) }))
};
const initialSettings: SystemSettings = {
  companyName: 'RTJK INFOCELL',
  cnpj: '00.000.000/0001-00',
  email: 'contato@rtjkinfocell.com',
  phone: '(11) 9999-9999',
  address: 'Rua das Tecnologias, 100, São Paulo - SP',
  enableNotifications: true,
  enableSound: true,
  pixKey: '00.000.000/0001-00',
  paymentMachines: [defaultMachine]
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  
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

  // --- Supabase Data Loading ---
  useEffect(() => {
    const loadData = async () => {
      if (!supabase) {
         console.warn("Supabase not configured. Using mock data.");
         setIsLoading(false);
         return;
      }

      try {
        setIsLoading(true);

        const [
            { data: cust }, { data: prod }, { data: supp }, { data: serv },
            { data: os }, { data: so }, { data: tx }, { data: pay },
            { data: plans }, { data: goals }, { data: sett }, { data: purch }
        ] = await Promise.all([
            supabase.from('customers').select('*'),
            supabase.from('products').select('*'),
            supabase.from('supplies').select('*'),
            supabase.from('services').select('*'),
            supabase.from('service_orders').select('*, service_order_items(*)'),
            supabase.from('sales_orders').select('*, sales_order_items(*)'),
            supabase.from('transactions').select('*'),
            supabase.from('payable_accounts').select('*'),
            supabase.from('installment_plans').select('*, installments(*)'),
            supabase.from('financial_goals').select('*').single(),
            supabase.from('system_settings').select('*').single(),
            supabase.from('purchases').select('*')
        ]);

        if (cust) setCustomers(toCamel(cust));
        if (prod) setProducts(toCamel(prod));
        if (supp) setSupplies(toCamel(supp));
        if (serv) setServices(toCamel(serv));
        if (tx) setTransactions(toCamel(tx));
        if (pay) setPayableAccounts(toCamel(pay));
        if (goals) setFinancialGoals(toCamel(goals));
        if (sett) setSettings(toCamel(sett));
        if (purch) setPurchases(toCamel(purch));

        if (os) {
            const formattedOS = os.map((order: any) => ({
                ...toCamel(order),
                items: order.service_order_items ? toCamel(order.service_order_items) : []
            }));
            setServiceOrders(formattedOS);
        }

        if (so) {
            const formattedSO = so.map((order: any) => ({
                ...toCamel(order),
                items: order.sales_order_items ? toCamel(order.sales_order_items) : []
            }));
            setSalesOrders(formattedSO);
        }

        if (plans) {
             const formattedPlans = plans.map((plan: any) => ({
                 ...toCamel(plan),
                 installments: plan.installments ? toCamel(plan.installments) : []
             }));
             setInstallmentPlans(formattedPlans);
        }

      } catch (error) {
         console.error("Error loading data from Supabase:", error);
      } finally {
         setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // --- Actions Wrappers ---
  // Helper to sync with local state and Supabase
  const sync = async (table: string, data: any, id?: string) => {
      if (!supabase) return;
      
      // Sanitização básica para evitar envio de objetos aninhados que não são colunas JSONB
      const { ...cleanData } = data;
      
      const snakeData = toSnake(cleanData);
      
      let error;
      if (id) {
          const { error: err } = await supabase.from(table).update(snakeData).eq('id', id);
          error = err;
      } else {
          const { error: err } = await supabase.from(table).insert(snakeData);
          error = err;
      }

      if (error) {
          console.error(`Erro ao sincronizar tabela ${table}:`, error);
          // Only alert for non-background syncs usually, but keeping it visible for debug
          console.warn(`Erro detalhado ao salvar em ${table}:`, error.message, error.details);
      }
  };
  
  const addCustomer = (c: Customer) => {
      setCustomers([...customers, c]);
      sync('customers', c);
  };
  
  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    sync('customers', updates, id);
  };

  const updateCustomerCredit = (customerId: string, amount: number, operation: 'add' | 'set') => {
     setCustomers(prev => {
        const newCustomers = prev.map(c => {
            if (c.id === customerId) {
                const newBalance = operation === 'add' ? (c.creditBalance || 0) + amount : amount;
                return { ...c, creditBalance: Math.max(0, newBalance) };
            }
            return c;
        });
        const updatedCustomer = newCustomers.find(c => c.id === customerId);
        if (updatedCustomer) sync('customers', { creditBalance: updatedCustomer.creditBalance }, customerId);
        return newCustomers;
     });
  };

  const addProduct = (p: Product) => {
      setProducts([...products, p]);
      sync('products', p);
  };
  
  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    sync('products', updates, id);
  };

  const addServiceOrder = async (os: ServiceOrder) => {
    setServiceOrders(prev => [os, ...prev]); // Optimistic update
    
    if (supabase) {
        // Explicitly reconstruct payload to avoid sending 'items', 'supplies' or unknown fields to the parent table
        const cleanOS = {
            id: os.id,
            customer_id: os.customerId,
            customer_name: os.customerName,
            device: os.device,
            imei: os.imei,
            serial_number: os.serialNumber,
            device_password: os.devicePassword,
            pattern_password: os.patternPassword,
            description: os.description,
            ai_diagnosis: os.aiDiagnosis,
            status: os.status,
            priority: os.priority,
            created_at: os.createdAt,
            finished_at: os.finishedAt,
            total_value: os.totalValue,
            warranty: os.warranty,
            technical_notes: os.technicalNotes,
            payment_method: os.paymentMethod
        };

        const { error } = await supabase.from('service_orders').insert(cleanOS);
        
        if (error) {
            console.error("Erro CRÍTICO ao salvar Service Order:", error);
            alert("Erro ao salvar OS no banco de dados: " + error.message);
            return;
        }
        
        if (os.items && os.items.length > 0) {
            const itemsWithId = os.items.map(i => ({ 
                service_order_id: os.id,
                name: i.name,
                details: i.details,
                quantity: i.quantity,
                unit_price: i.unitPrice,
                total: i.total,
                type: i.type
            }));
            const { error: itemsError } = await supabase.from('service_order_items').insert(itemsWithId);
            if (itemsError) console.error("Erro ao salvar itens da OS:", itemsError);
        }
    }
  };

  const updateServiceOrder = async (id: string, updates: Partial<ServiceOrder>) => {
    // Optimistic Update
    setServiceOrders(prev => prev.map(os => {
      if (os.id === id) {
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
                  paymentMethod: updates.paymentMethod || 'Dinheiro',
                  items: []
               }
             };
             addTransaction(newTransaction); // Will trigger sync
           }
        }
        return { ...os, ...updates };
      }
      return os;
    }));

    if (supabase) {
        // Handle items update if present
        const { items, supplies, ...fieldsToUpdate } = updates;
        await sync('service_orders', fieldsToUpdate, id);
        
        // If items changed, replace them (simplest strategy)
        if (items) {
             const { error: delError } = await supabase.from('service_order_items').delete().eq('service_order_id', id);
             if (!delError) {
                 const itemsWithId = items.map(i => ({ ...i, serviceOrderId: id }));
                 const { error: insError } = await supabase.from('service_order_items').insert(toSnake(itemsWithId));
                 if (insError) console.error("Erro ao reinserir itens da OS:", insError);
             } else {
                 console.error("Erro ao limpar itens antigos da OS:", delError);
             }
        }
    }
  };

  const addTransaction = (t: Transaction) => {
      setTransactions(prev => [t, ...prev]);
      sync('transactions', t);
  };

  const processRefund = (originalTransaction: Transaction, refundType: 'money' | 'credit', customerId?: string) => {
     const refundTransaction: Transaction = {
        id: `REF-${originalTransaction.id}-${Date.now()}`,
        description: `Estorno (${refundType === 'money' ? 'Devolução' : 'Crédito'}) - Ref: ${originalTransaction.description}`,
        amount: originalTransaction.amount,
        type: TransactionType.EXPENSE,
        date: new Date().toISOString(),
        category: 'Estornos',
        transactionDetails: { ...originalTransaction.transactionDetails, refunded: true }
     };
     addTransaction(refundTransaction);

     setTransactions(prev => prev.map(t => 
        t.id === originalTransaction.id 
        ? { ...t, transactionDetails: { ...t.transactionDetails, refunded: true } }
        : t
     ));
     if (supabase) {
         const updatedDetails = { ...originalTransaction.transactionDetails, refunded: true };
         sync('transactions', { transactionDetails: updatedDetails }, originalTransaction.id);
     }

     if (refundType === 'credit' && customerId) {
        updateCustomerCredit(customerId, originalTransaction.amount, 'add');
     }
  };

  const updateStock = (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
        const newStock = product.stock - quantity;
        updateProduct(productId, { stock: newStock });
    }
  };

  const addSalesOrder = async (order: SalesOrder) => {
    setSalesOrders([order, ...salesOrders]);
    if (supabase) {
        const { items, ...orderData } = order;
        await sync('sales_orders', orderData);
        if (items && items.length > 0) {
            const itemsWithId = items.map(i => ({ ...i, salesOrderId: order.id }));
            const { error } = await supabase.from('sales_order_items').insert(toSnake(itemsWithId));
            if (error) console.error("Erro ao salvar itens da Venda:", error);
        }
    }
  };

  const updateSalesOrder = (id: string, updates: Partial<SalesOrder>) => {
    setSalesOrders(prev => prev.map(order => order.id === id ? { ...order, ...updates } : order));
    const { items, ...fields } = updates;
    sync('sales_orders', fields, id);
  };

  const updateSettings = (s: Partial<SystemSettings>) => {
    setSettings(prev => ({ ...prev, ...s }));
    if (supabase) {
        supabase.from('system_settings').update(toSnake(s)).eq('id', 1).then();
    }
  };

  const addSupply = (s: Supply) => {
      setSupplies([...supplies, s]);
      sync('supplies', s);
  };

  const updateSupplyStock = (id: string, qty: number) => {
    setSupplies(prev => prev.map(s => {
        if(s.id === id) {
            const newStock = s.stock + qty;
            sync('supplies', {stock: newStock}, id);
            return { ...s, stock: newStock };
        }
        return s;
    }));
  };

  const addService = (s: ServiceItem) => {
      setServices([...services, s]);
      sync('services', s);
  };
  
  const addPurchase = (p: Purchase) => {
    setPurchases([p, ...purchases]);
    sync('purchases', p);
    updateSupplyStock(p.supplyId, p.quantity);
    addTransaction({
      id: `TR-BUY-${Date.now()}`,
      description: `Compra: ${p.supplyName}`,
      amount: p.totalCost,
      type: TransactionType.EXPENSE,
      date: p.date,
      category: 'Insumos'
    });
  };

  const addInstallmentPlan = async (plan: InstallmentPlan) => {
    setInstallmentPlans([plan, ...installmentPlans]);
    if (supabase) {
        const { installments, ...planData } = plan;
        await sync('installment_plans', planData);
        if (installments.length > 0) {
            const instWithId = installments.map(i => ({ ...i, planId: plan.id }));
            const { error } = await supabase.from('installments').insert(toSnake(instWithId));
            if (error) console.error("Erro ao salvar parcelas:", error);
        }
    }
  };

  const payInstallment = (planId: string, installmentNumber: number) => {
    setInstallmentPlans(prev => prev.map(plan => {
      if (plan.id !== planId) return plan;

      const updatedInstallments = plan.installments.map(inst => {
        if (inst.number === installmentNumber && inst.status !== 'Pago') {
           const paidAt = new Date().toISOString();
           const newTransaction: Transaction = {
             id: `TR-CRED-${plan.id}-${inst.number}`,
             description: `Crediário ${plan.customerName} - Parc. ${inst.number}`,
             amount: inst.value,
             type: TransactionType.INCOME,
             date: paidAt,
             category: 'Crediário'
           };
           addTransaction(newTransaction);
           
           if(supabase) {
               supabase.from('installments')
                 .update(toSnake({ status: 'Pago', paidAt }))
                 .eq('plan_id', planId)
                 .eq('number', installmentNumber)
                 .then();
           }

           return { ...inst, status: 'Pago' as const, paidAt };
        }
        return inst;
      });
      return { ...plan, installments: updatedInstallments };
    }));
  };

  const updateInstallmentValue = (planId: string, installmentNumber: number, newValue: number) => {
     setInstallmentPlans(prev => prev.map(plan => {
        if (plan.id !== planId) return plan;
        if(supabase) {
            supabase.from('installments')
                 .update({ value: newValue })
                 .eq('plan_id', planId)
                 .eq('number', installmentNumber)
                 .then();
        }
        return {
           ...plan,
           installments: plan.installments.map(inst => 
              inst.number === installmentNumber ? { ...inst, value: newValue } : inst
           )
        };
     }));
  };

  const addPayableAccount = (account: PayableAccount) => {
    setPayableAccounts(prev => [...prev, account]);
    sync('payable_accounts', account);
  };

  const payPayableAccount = (id: string) => {
    setPayableAccounts(prev => prev.map(acc => {
      if (acc.id === id && acc.status !== 'Pago') {
        const paidAt = new Date().toISOString();
        const newTransaction: Transaction = {
          id: `TR-PAY-${id}-${Date.now()}`,
          description: `Pagamento: ${acc.description}`,
          amount: acc.amount,
          type: TransactionType.EXPENSE,
          date: paidAt,
          category: acc.category
        };
        addTransaction(newTransaction);
        sync('payable_accounts', { status: 'Pago', paidAt }, id);
        return { ...acc, status: 'Pago', paidAt };
      }
      return acc;
    }));
  };

  const deletePayableAccount = (id: string) => {
    setPayableAccounts(prev => prev.filter(acc => acc.id !== id));
    if (supabase) supabase.from('payable_accounts').delete().eq('id', id).then();
  };

  const updateFinancialGoals = (goals: FinancialGoal) => {
    setFinancialGoals(goals);
    if(supabase) supabase.from('financial_goals').update(toSnake(goals)).eq('id', 1).then();
  };

  const resetData = async () => {
    // Clear Local State
    setCustomers([]);
    setProducts([]);
    setServiceOrders([]);
    setTransactions([]);
    setSalesOrders([]);
    setSupplies([]);
    setServices([]);
    setPurchases([]);
    setInstallmentPlans([]);
    setPayableAccounts([]);
    
    // Clear Supabase Data if connected
    if (supabase) {
        try {
            await Promise.all([
                supabase.from('service_order_items').delete().neq('id', 0), // Delete child tables first
                supabase.from('sales_order_items').delete().neq('id', 0),
                supabase.from('installments').delete().neq('id', 0),
            ]);
            
            await Promise.all([
                supabase.from('customers').delete().neq('id', '0'), // Hack to delete all rows
                supabase.from('products').delete().neq('id', '0'),
                supabase.from('service_orders').delete().neq('id', '0'),
                supabase.from('transactions').delete().neq('id', '0'),
                supabase.from('sales_orders').delete().neq('id', '0'),
                supabase.from('supplies').delete().neq('id', '0'),
                supabase.from('services').delete().neq('id', '0'),
                supabase.from('purchases').delete().neq('id', '0'),
                supabase.from('installment_plans').delete().neq('id', '0'),
                supabase.from('payable_accounts').delete().neq('id', '0')
            ]);
        } catch (error) {
            console.error("Erro ao resetar Supabase:", error);
            alert("Erro ao limpar dados do banco de dados online. Dados locais foram limpos.");
        }
    }
  };

  const backupSystem = () => {
    const data = {
      customers,
      products,
      serviceOrders,
      transactions,
      salesOrders,
      settings,
      supplies,
      services,
      purchases,
      installmentPlans,
      payableAccounts,
      financialGoals,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_rtjk_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const restoreSystem = async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          
          if (data.customers) setCustomers(data.customers);
          if (data.products) setProducts(data.products);
          if (data.serviceOrders) setServiceOrders(data.serviceOrders);
          if (data.transactions) setTransactions(data.transactions);
          if (data.salesOrders) setSalesOrders(data.salesOrders);
          if (data.settings) setSettings(data.settings);
          if (data.supplies) setSupplies(data.supplies);
          if (data.services) setServices(data.services);
          if (data.purchases) setPurchases(data.purchases);
          if (data.installmentPlans) setInstallmentPlans(data.installmentPlans);
          if (data.payableAccounts) setPayableAccounts(data.payableAccounts);
          if (data.financialGoals) setFinancialGoals(data.financialGoals);

          resolve(true);
        } catch (error) {
          console.error("Erro ao restaurar backup:", error);
          resolve(false);
        }
      };
      reader.readAsText(file);
    });
  };

  return (
    <DataContext.Provider value={{
      customers, products, serviceOrders, transactions, salesOrders, settings,
      supplies, services, purchases, installmentPlans, payableAccounts, financialGoals, isLoading,
      addCustomer, updateCustomer, updateCustomerCredit,
      addProduct, updateProduct, addServiceOrder, updateServiceOrder, addTransaction, processRefund,
      updateStock, 
      addSalesOrder, updateSalesOrder, updateSettings, 
      addSupply, updateSupplyStock, addService, addPurchase,
      addInstallmentPlan, payInstallment, updateInstallmentValue,
      addPayableAccount, payPayableAccount, deletePayableAccount, updateFinancialGoals,
      resetData, backupSystem, restoreSystem
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
