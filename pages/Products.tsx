
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Product, ServiceItem } from '../types';
import { PackagePlus, Search, Smartphone, Headphones, Box, Tag, Eye, X, Barcode, Calendar, DollarSign, Edit, Wrench } from 'lucide-react';

type ProductTab = 'accessories' | 'devices' | 'services';

const ACCESSORY_CATEGORIES = [
  'Capas TPU',
  'Capas Color',
  'Cabos',
  'Película 3D',
  'Película Privacidade',
  'Informática',
  'Fone de ouvido',
  'Carregador',
  'Caixa de som',
  'Maquininha',
  'Diversos',
  'Outros'
];

export const Products: React.FC = () => {
  const { products, services, addProduct, updateProduct, addService, updateService } = useData();
  const [activeTab, setActiveTab] = useState<ProductTab>('accessories');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  
  // Edit State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  
  // Generic Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [stock, setStock] = useState('');
  
  // Service Specific
  const [serviceDesc, setServiceDesc] = useState('');

  // Accessory Specific
  const [accCategory, setAccCategory] = useState(ACCESSORY_CATEGORIES[0]);
  const [compatibility, setCompatibility] = useState('');
  const [minStock, setMinStock] = useState('');
  const [maxStock, setMaxStock] = useState('');

  // Device Specific
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [imei, setImei] = useState('');
  const [serial, setSerial] = useState('');
  const [color, setColor] = useState('');
  const [storage, setStorage] = useState('');
  const [condition, setCondition] = useState<'Novo' | 'Usado' | 'Semi Novo'>('Usado');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Service Handling
    if (activeTab === 'services') {
        const serviceData = {
            name,
            price: Number(price),
            description: serviceDesc
        };

        if (editingService) {
            updateService(editingService.id, serviceData);
        } else {
            addService({
                id: `SVC-${Date.now()}`,
                ...serviceData
            });
        }
        setShowForm(false);
        resetForm();
        return;
    }

    // 2. Product Handling
    let productData: Partial<Product>;

    if (activeTab === 'accessories') {
       productData = {
         name,
         price: Number(price),
         cost: Number(cost),
         stock: Number(stock),
         category: accCategory,
         compatibility,
         minStock: Number(minStock),
         maxStock: Number(maxStock)
       };
    } else {
       productData = {
         name: `${brand} ${model} ${storage}`, // Auto-generate name for list consistency
         price: Number(price),
         cost: Number(cost),
         stock: editingProduct ? Number(stock) : 1, // Preserve stock if editing, default 1 if new
         category: 'Aparelhos',
         brand,
         model,
         imei,
         serialNumber: serial,
         color,
         storage,
         condition
       };
    }

    if (editingProduct) {
       updateProduct(editingProduct.id, productData);
    } else {
       const newProduct = {
          ...productData,
          id: Date.now().toString(),
       } as Product;
       addProduct(newProduct);
    }

    setShowForm(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingProduct(null);
    setEditingService(null);
    setName(''); setPrice(''); setCost(''); setStock('');
    setCompatibility(''); setMinStock(''); setMaxStock('');
    setBrand(''); setModel(''); setImei(''); setSerial(''); setColor(''); setStorage('');
    setServiceDesc('');
  };

  const handleEdit = (item: Product | ServiceItem) => {
     resetForm();
     
     // Check if it's a Service (duck typing or passed context)
     if ('description' in item && !('stock' in item)) {
         // It's a service
         const service = item as ServiceItem;
         setEditingService(service);
         setActiveTab('services');
         setName(service.name);
         setPrice(service.price.toString());
         setServiceDesc(service.description);
     } else {
         // It's a product
         const product = item as Product;
         setEditingProduct(product);
         setPrice(product.price.toString());
         setCost(product.cost.toString());
         setStock(product.stock.toString());
         
         if (product.category === 'Aparelhos') {
            setActiveTab('devices');
            setBrand(product.brand || '');
            setModel(product.model || '');
            setImei(product.imei || '');
            setSerial(product.serialNumber || '');
            setColor(product.color || '');
            setStorage(product.storage || '');
            setCondition(product.condition || 'Usado');
         } else {
            setActiveTab('accessories');
            setName(product.name);
            setAccCategory(product.category);
            setCompatibility(product.compatibility || '');
            setMinStock(product.minStock?.toString() || '');
            setMaxStock(product.maxStock?.toString() || '');
         }
     }
     setShowForm(true);
  };

  const handleNewItem = () => {
     resetForm();
     setShowForm(!showForm);
  };

  const filteredList = useMemo(() => {
     if (activeTab === 'services') {
         return services.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
     }

     return products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              p.id.includes(searchTerm) || 
                              (p.imei && p.imei.includes(searchTerm));
        
        if (activeTab === 'devices') {
           return matchesSearch && p.category === 'Aparelhos';
        } else {
           return matchesSearch && p.category !== 'Aparelhos';
        }
     });
  }, [products, services, searchTerm, activeTab]);

  const ProductDetailsModal = () => {
    if (!viewingProduct) return null;
    const isDevice = viewingProduct.category === 'Aparelhos';

    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="bg-gray-800 text-white p-6 flex justify-between items-start">
             <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                   {isDevice ? <Smartphone size={24}/> : <Headphones size={24}/>}
                   Detalhes do Produto
                </h2>
                <p className="text-gray-400 text-sm mt-1">{viewingProduct.name}</p>
             </div>
             <button onClick={() => setViewingProduct(null)} className="bg-gray-700 hover:bg-gray-600 p-2 rounded-full transition-colors">
                <X size={20}/>
             </button>
          </div>

          <div className="p-6 overflow-y-auto">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Basic Info Block */}
                <div className="md:col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-200">
                   <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 flex items-center gap-2"><Tag size={16}/> Informações Básicas</h3>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                         <p className="text-xs text-gray-500">ID / SKU</p>
                         <p className="font-mono font-bold text-gray-800 text-sm">{viewingProduct.id}</p>
                      </div>
                      <div>
                         <p className="text-xs text-gray-500">Categoria</p>
                         <span className="inline-block bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">{viewingProduct.category}</span>
                      </div>
                      {isDevice && (
                         <>
                           <div>
                              <p className="text-xs text-gray-500">Condição</p>
                              <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${viewingProduct.condition === 'Novo' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                 {viewingProduct.condition}
                              </span>
                           </div>
                         </>
                      )}
                      {!isDevice && (
                         <div>
                            <p className="text-xs text-gray-500">Compatibilidade</p>
                            <p className="font-bold text-gray-800 text-sm">{viewingProduct.compatibility || '-'}</p>
                         </div>
                      )}
                   </div>
                </div>

                {/* Specific Details */}
                {isDevice ? (
                   <div className="md:col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 flex items-center gap-2"><Smartphone size={16}/> Especificações do Aparelho</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-2">
                         <div>
                            <p className="text-xs text-gray-500">Marca</p>
                            <p className="font-bold text-gray-800">{viewingProduct.brand}</p>
                         </div>
                         <div>
                            <p className="text-xs text-gray-500">Modelo</p>
                            <p className="font-bold text-gray-800">{viewingProduct.model}</p>
                         </div>
                         <div>
                            <p className="text-xs text-gray-500">Cor</p>
                            <p className="font-bold text-gray-800">{viewingProduct.color}</p>
                         </div>
                         <div>
                            <p className="text-xs text-gray-500">Armazenamento</p>
                            <p className="font-bold text-gray-800">{viewingProduct.storage}</p>
                         </div>
                         <div className="col-span-2">
                            <p className="text-xs text-gray-500">IMEI</p>
                            <p className="font-mono font-bold text-gray-800">{viewingProduct.imei || 'Não informado'}</p>
                         </div>
                         <div className="col-span-2">
                            <p className="text-xs text-gray-500">Nº de Série</p>
                            <p className="font-mono font-bold text-gray-800">{viewingProduct.serialNumber || 'Não informado'}</p>
                         </div>
                      </div>
                   </div>
                ) : (
                   <div className="md:col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 flex items-center gap-2"><Box size={16}/> Controle de Estoque</h3>
                      <div className="flex justify-between items-center">
                         <div className="text-center">
                            <p className="text-xs text-gray-500">Atual</p>
                            <p className="text-2xl font-bold text-gray-800">{viewingProduct.stock}</p>
                         </div>
                         <div className="h-8 w-px bg-gray-300"></div>
                         <div className="text-center">
                            <p className="text-xs text-gray-500">Mínimo</p>
                            <p className="text-lg font-bold text-orange-600">{viewingProduct.minStock || '-'}</p>
                         </div>
                         <div className="h-8 w-px bg-gray-300"></div>
                         <div className="text-center">
                            <p className="text-xs text-gray-500">Máximo</p>
                            <p className="text-lg font-bold text-green-600">{viewingProduct.maxStock || '-'}</p>
                         </div>
                      </div>
                   </div>
                )}

                {/* Financials */}
                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                   <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                      <p className="text-xs text-red-600 font-bold uppercase mb-1">Custo Unitário</p>
                      <p className="text-2xl font-bold text-red-700">R$ {viewingProduct.cost.toFixed(2)}</p>
                   </div>
                   <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                      <p className="text-xs text-green-600 font-bold uppercase mb-1">Preço de Venda</p>
                      <p className="text-2xl font-bold text-green-700">R$ {viewingProduct.price.toFixed(2)}</p>
                   </div>
                   <div className="col-span-2 text-center text-xs text-gray-500 mt-2">
                      Margem de Lucro Estimada: <span className="font-bold text-green-600">{(((viewingProduct.price - viewingProduct.cost) / viewingProduct.price) * 100).toFixed(1)}%</span>
                   </div>
                </div>

             </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Catálogo de Produtos e Serviços</h1>
          <p className="text-gray-500 text-sm">Gerencie o estoque, preços e serviços oferecidos.</p>
        </div>
        
        {/* Tabs */}
        <div className="bg-white p-1 rounded-xl border border-gray-200 shadow-sm flex overflow-x-auto max-w-full">
           <button 
              onClick={() => { setActiveTab('accessories'); setShowForm(false); }}
              className={`px-4 md:px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap
              ${activeTab === 'accessories' ? 'bg-gray-800 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
           >
              <Headphones size={18}/> Acessórios
           </button>
           <button 
              onClick={() => { setActiveTab('devices'); setShowForm(false); }}
              className={`px-4 md:px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap
              ${activeTab === 'devices' ? 'bg-gray-800 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
           >
              <Smartphone size={18}/> Aparelhos
           </button>
           <button 
              onClick={() => { setActiveTab('services'); setShowForm(false); }}
              className={`px-4 md:px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap
              ${activeTab === 'services' ? 'bg-gray-800 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
           >
              <Wrench size={18}/> Serviços
           </button>
        </div>

        <button 
          onClick={handleNewItem}
          className="bg-accent hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm whitespace-nowrap"
        >
          <PackagePlus size={20} /> 
          {activeTab === 'accessories' ? 'Novo Acessório' : activeTab === 'devices' ? 'Novo Aparelho' : 'Novo Serviço'}
        </button>
      </div>

      {/* --- FORM SECTION --- */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
               {editingProduct || editingService ? <Edit size={20} className="text-orange-500"/> : (activeTab === 'accessories' ? <Headphones size={20}/> : activeTab === 'devices' ? <Smartphone size={20}/> : <Wrench size={20}/>)}
               {editingProduct || editingService ? 'Editar Item' : (activeTab === 'accessories' ? 'Cadastrar Acessório' : activeTab === 'devices' ? 'Cadastrar Aparelho' : 'Cadastrar Serviço')}
            </h2>
            <button onClick={() => setShowForm(false)}><X className="text-gray-400 hover:text-gray-600"/></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            
            {/* Service Form */}
            {activeTab === 'services' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Nome do Serviço</label>
                        <input required placeholder="Ex: Troca de Tela iPhone 11" className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-accent" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Valor (R$)</label>
                        <input required type="number" step="0.01" className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-accent" value={price} onChange={e => setPrice(e.target.value)} />
                    </div>
                    <div className="md:col-span-4">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Descrição Detalhada</label>
                        <textarea 
                            placeholder="Descreva o que está incluso no serviço..." 
                            className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-accent min-h-[80px]" 
                            value={serviceDesc} 
                            onChange={e => setServiceDesc(e.target.value)} 
                        />
                    </div>
                </div>
            )}

            {/* Accessory Form */}
            {activeTab === 'accessories' && (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="lg:col-span-2">
                     <label className="block text-xs font-bold text-gray-700 mb-1">Nome do Produto</label>
                     <input required placeholder="Ex: Capa Anti-impacto" className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-accent" value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-700 mb-1">Compatibilidade</label>
                     <input placeholder="Ex: iPhone 13 / 14" className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-accent" value={compatibility} onChange={e => setCompatibility(e.target.value)} />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-700 mb-1">Categoria</label>
                     <select className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-accent bg-white" value={accCategory} onChange={e => setAccCategory(e.target.value)}>
                        {ACCESSORY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                     </select>
                  </div>
                  
                  <div>
                     <label className="block text-xs font-bold text-gray-700 mb-1">Preço Venda (R$)</label>
                     <input required type="number" step="0.01" className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-accent" value={price} onChange={e => setPrice(e.target.value)} />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-700 mb-1">Valor Custo (R$)</label>
                     <input type="number" step="0.01" className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-accent" value={cost} onChange={e => setCost(e.target.value)} />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-700 mb-1">Estoque Atual</label>
                     <input required type="number" className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-accent" value={stock} onChange={e => setStock(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                     <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Mín</label>
                        <input type="number" className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-accent" value={minStock} onChange={e => setMinStock(e.target.value)} />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Máx</label>
                        <input type="number" className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-accent" value={maxStock} onChange={e => setMaxStock(e.target.value)} />
                     </div>
                  </div>
               </div>
            )}

            {/* Device Form */}
            {activeTab === 'devices' && (
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                     <label className="block text-xs font-bold text-gray-700 mb-1">Marca</label>
                     <input required placeholder="Ex: Apple" className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-accent" value={brand} onChange={e => setBrand(e.target.value)} />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-700 mb-1">Modelo</label>
                     <input required placeholder="Ex: iPhone 12" className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-accent" value={model} onChange={e => setModel(e.target.value)} />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-700 mb-1">Condição</label>
                     <select className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-accent bg-white" value={condition} onChange={e => setCondition(e.target.value as any)}>
                        <option>Novo</option>
                        <option>Semi Novo</option>
                        <option>Usado</option>
                     </select>
                  </div>

                  <div>
                     <label className="block text-xs font-bold text-gray-700 mb-1">Cor</label>
                     <input required placeholder="Ex: Azul" className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-accent" value={color} onChange={e => setColor(e.target.value)} />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-700 mb-1">Armazenamento</label>
                     <input required placeholder="Ex: 128GB" className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-accent" value={storage} onChange={e => setStorage(e.target.value)} />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-700 mb-1">IMEI</label>
                     <input required placeholder="Identificação única" className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-accent" value={imei} onChange={e => setImei(e.target.value)} />
                  </div>

                  <div>
                     <label className="block text-xs font-bold text-gray-700 mb-1">Nº Série</label>
                     <input placeholder="Opcional" className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-accent" value={serial} onChange={e => setSerial(e.target.value)} />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-700 mb-1">Preço Venda (R$)</label>
                     <input required type="number" step="0.01" className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-accent" value={price} onChange={e => setPrice(e.target.value)} />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-700 mb-1">Custo (R$)</label>
                     <input type="number" step="0.01" className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-accent" value={cost} onChange={e => setCost(e.target.value)} />
                  </div>
               </div>
            )}

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold">
                   {editingProduct || editingService ? 'Atualizar Item' : 'Salvar Item'}
                </button>
            </div>
          </form>
        </div>
      )}

      {/* --- TABLE SECTION --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 w-full max-w-md shadow-sm">
            <Search size={20} className="text-gray-400" />
            <input 
              type="text" 
              placeholder={activeTab === 'accessories' ? "Buscar acessório..." : activeTab === 'services' ? "Buscar serviço..." : "Buscar por IMEI, Modelo..."}
              className="flex-1 bg-transparent outline-none text-gray-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-sm text-gray-500">
             Mostrando {filteredList.length} itens
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-100 text-xs uppercase font-bold text-gray-500">
              <tr>
                {activeTab === 'services' ? (
                    <>
                        <th className="px-6 py-4">Serviço</th>
                        <th className="px-6 py-4">Descrição</th>
                        <th className="px-6 py-4 text-right">Valor</th>
                        <th className="px-6 py-4 text-center">Ações</th>
                    </>
                ) : activeTab === 'accessories' ? (
                   <>
                     <th className="px-6 py-4">Produto</th>
                     <th className="px-6 py-4">Categoria</th>
                     <th className="px-6 py-4">Compatibilidade</th>
                     <th className="px-6 py-4 text-center">Estoque (Min/Max)</th>
                     <th className="px-6 py-4 text-right">Custo</th>
                     <th className="px-6 py-4 text-right">Venda</th>
                     <th className="px-6 py-4 text-center">Status</th>
                     <th className="px-6 py-4 text-center">Ações</th>
                   </>
                ) : (
                   <>
                     <th className="px-6 py-4">Modelo / Marca</th>
                     <th className="px-6 py-4">Detalhes</th>
                     <th className="px-6 py-4">IMEI / Serial</th>
                     <th className="px-6 py-4 text-center">Condição</th>
                     <th className="px-6 py-4 text-right">Custo</th>
                     <th className="px-6 py-4 text-right">Venda</th>
                     <th className="px-6 py-4 text-center">Status</th>
                     <th className="px-6 py-4 text-center">Ações</th>
                   </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredList.map((item: any) => (
                <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                  
                  {activeTab === 'services' && (
                      <>
                        <td className="px-6 py-4 font-bold text-gray-800">{item.name}</td>
                        <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate">{item.description}</td>
                        <td className="px-6 py-4 text-right font-bold text-blue-600">R$ {item.price.toFixed(2)}</td>
                        <td className="px-6 py-4 text-center">
                            <button 
                                onClick={() => handleEdit(item)}
                                className="bg-orange-100 hover:bg-orange-200 text-orange-600 p-2 rounded-lg transition-colors"
                                title="Editar Serviço"
                            >
                                <Edit size={18}/>
                            </button>
                        </td>
                      </>
                  )}

                  {activeTab === 'accessories' && (
                     <>
                        <td className="px-6 py-4 font-bold text-gray-800">{item.name}</td>
                        <td className="px-6 py-4">
                           <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs border border-gray-200">{item.category}</span>
                        </td>
                        <td className="px-6 py-4">{item.compatibility || '-'}</td>
                        <td className="px-6 py-4 text-center">
                           <span className="font-bold">{item.stock}</span> 
                           <span className="text-xs text-gray-400 ml-1">({item.minStock}/{item.maxStock})</span>
                        </td>
                        <td className="px-6 py-4 text-right">R$ {item.cost.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right font-bold text-blue-600">R$ {item.price.toFixed(2)}</td>
                     </>
                  )}

                  {activeTab === 'devices' && (
                     <>
                        <td className="px-6 py-4">
                           <p className="font-bold text-gray-800">{item.model}</p>
                           <p className="text-xs text-gray-500">{item.brand}</p>
                        </td>
                        <td className="px-6 py-4 text-xs">
                           <p><strong>Cor:</strong> {item.color}</p>
                           <p><strong>Armaz:</strong> {item.storage}</p>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-gray-500">
                           <p>IMEI: {item.imei || '-'}</p>
                           <p>SN: {item.serialNumber || '-'}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                              item.condition === 'Novo' ? 'bg-green-100 text-green-700' : 
                              item.condition === 'Semi Novo' ? 'bg-blue-100 text-blue-700' :
                              'bg-orange-100 text-orange-700'
                           }`}>
                              {item.condition}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right">R$ {item.cost.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right font-bold text-blue-600">R$ {item.price.toFixed(2)}</td>
                     </>
                  )}

                  {activeTab !== 'services' && (
                    <>
                        <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.stock < (item.minStock || 1) ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {item.stock < (item.minStock || 1) ? 'Baixo' : 'Ok'}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                            <div className="flex justify-center gap-2">
                                <button 
                                onClick={() => handleEdit(item)}
                                className="bg-orange-100 hover:bg-orange-200 text-orange-600 p-2 rounded-lg transition-colors"
                                title="Editar Produto"
                                >
                                <Edit size={18}/>
                                </button>
                                <button 
                                onClick={() => setViewingProduct(item)}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-lg transition-colors"
                                title="Visualizar Detalhes"
                                >
                                <Eye size={18}/>
                                </button>
                            </div>
                        </td>
                    </>
                  )}
                </tr>
              ))}
              {filteredList.length === 0 && (
                 <tr>
                    <td colSpan={activeTab === 'services' ? 4 : 8} className="p-8 text-center text-gray-400">Nenhum item encontrado nesta categoria.</td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Details Modal */}
      <ProductDetailsModal />

    </div>
  );
};
