
export enum OSStatus {
  PENDENTE = 'Pendente',
  EM_ANALISE = 'Em Análise',
  APROVADO = 'Aprovado',
  NAO_APROVADO = 'Não Aprovado',
  AGUARDANDO_PECAS = 'Aguardando Peças',
  EM_ANDAMENTO = 'Em Andamento',
  CONCLUIDO = 'Concluído',
  FINALIZADO = 'Finalizado'
}

export enum TransactionType {
  INCOME = 'Receita',
  EXPENSE = 'Despesa'
}

export enum OrderStatus {
  PENDING = 'Pendente',
  READY = 'Pronto',
  DELIVERED = 'Entregue',
  CANCELLED = 'Cancelado'
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  addressNumber?: string;
  cep?: string;
  cpfOrCnpj?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number; // Valor de Venda
  cost: number; // Valor de Custo
  stock: number;
  category: string;
  
  // Device Specific Fields
  brand?: string;
  model?: string;
  imei?: string;
  serialNumber?: string;
  color?: string;
  storage?: string;
  condition?: 'Novo' | 'Usado' | 'Semi Novo';

  // Accessory Specific Fields
  compatibility?: string;
  minStock?: number;
  maxStock?: number;
}

export interface Supply {
  id: string;
  name: string;
  unit: string; // un, kg, lit
  cost: number;
  stock: number;
  minStock: number;
}

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  description: string;
}

export interface Purchase {
  id: string;
  supplyId: string;
  supplyName: string;
  quantity: number;
  totalCost: number;
  date: string;
  supplier: string;
}

export interface OSItem {
  id: string; // Product or Service ID
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  type: 'product' | 'service';
}

export interface ServiceOrder {
  id: string;
  customerId: string;
  customerName: string;
  device: string;
  imei?: string;
  serialNumber?: string;
  description: string;
  aiDiagnosis?: string;
  status: OSStatus;
  priority: 'Baixa' | 'Média' | 'Alta';
  createdAt: string;
  finishedAt?: string;
  totalValue: number;
  warranty?: string;
  technicalNotes?: string;
  items: OSItem[]; // Combined list of products and services
  supplies?: Supply[]; // Internal supplies used (optional tracking)
}

export interface TransactionDetails {
  customerName?: string;
  customerAddress?: string;
  customerPhone?: string;
  deviceIMEI?: string;
  deviceSerial?: string;
  deviceBrand?: string;
  items?: CartItem[];
  paymentMethod?: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  date: string;
  category: string;
  transactionDetails?: TransactionDetails;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface SalesOrder {
  id: string;
  customerId: string;
  customerName: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  deliveryDate?: string;
}

export interface InstallmentRate {
  installments: number; // 1 to 18
  rate: number; // percentage
}

export interface PaymentMachine {
  id: string;
  name: string;
  debitRate: number;
  creditRates: InstallmentRate[]; // Array of rates for 1x to 18x
}

export interface SystemSettings {
  companyName: string;
  cnpj: string;
  phone: string;
  email: string;
  address: string;
  enableNotifications: boolean;
  enableSound: boolean;
  pixKey: string;
  paymentMachines: PaymentMachine[];
}

// --- Crediário Types ---

export interface Installment {
  number: number;
  dueDate: string;
  value: number;
  status: 'Pendente' | 'Pago' | 'Atrasado';
  paidAt?: string;
}

export interface InstallmentPlan {
  id: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  // Product Details
  productName: string;
  brand: string;
  model: string;
  color?: string; // New Field
  storage?: string; // New Field
  serialNumber?: string;
  imei?: string;
  // Financial
  totalValue: number;
  installments: Installment[];
  frequency: 'Semanal' | 'Mensal';
  createdAt: string;
  customFee?: number; // Taxa personalizada aplicada
  downPayment?: number; // Valor de entrada em dinheiro
  tradeInProduct?: { // Produto dado como entrada
    name: string;
    value: number;
  };
}

// --- New Financial Types ---

export interface PayableAccount {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  category: string;
  status: 'Pendente' | 'Pago';
  paidAt?: string;
  supplier?: string;
  recurrence?: 'Mensal' | 'Única';
}

export interface FinancialGoal {
  revenueGoal: number;
  expenseLimit: number;
}
