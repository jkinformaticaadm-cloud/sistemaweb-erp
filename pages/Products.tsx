
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Product } from '../types';
import { PackagePlus, Search, Smartphone, Headphones, Box, Tag } from 'lucide-react';

type ProductTab = 'accessories' | 'devices';

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
  const { products, addProduct } = useData();
  const [activeTab, setActiveTab] = useState<ProductTab>('accessories');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  
  // Generic Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [stock, setStock] = useState('');
  
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
    
    let newProduct: Product;

    if (activeTab === 'accessories') {
       newProduct = {
         id: Date.now().toString(),
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
       newProduct = {
         id: Date.now().toString(),
         name: `${brand} ${model} ${storage}`, // Auto-generate name for list consistency
         price: Number(price),
         cost: Number(cost),
         stock: 1, // Devices usually unique, but can be edited later
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

    addProduct(newProduct);
    setShowForm(false);
    resetForm();
  };

  const resetForm = () => {
    setName(''); setPrice(''); setCost(''); setStock('');
    setCompatibility(''); setMinStock(''); setMaxStock('');
    setBrand(''); setModel(''); setImei(''); setSerial(''); setColor(''); setStorage('');
  };

  const filtered = useMemo(() => {
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
  }, [products, searchTerm, activeTab]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Estoque de Produtos</h1>
          <p className="text-gray-500 text-sm">Gerencie acessórios e aparelhos disponíveis.</p>
        </div>
        
        {/* Tabs */}
        <div className="bg-white p-1 rounded-xl border border-gray-200 shadow-sm flex">
           <button 
              onClick={() => { setActiveTab('accessories'); setShowForm(false); }}
              className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all
              ${activeTab === 'accessories' ? 'bg-gray-800 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
           >
              <Headphones size={18}/> Acessórios
           </button>
           <button 
              onClick={() => { setActiveTab('devices'); setShowForm(false); }}
              className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all
              ${activeTab === 'devices' ? 'bg-gray-800 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
           >
              <Smartphone size={18}/> Aparelhos
           </button>
        </div>

        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-accent hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <PackagePlus size={20} /> {activeTab === 'accessories' ? 'Novo Acessório' : 'Novo Aparelho'}
        </button>
      </div>

      {/* --- FORM SECTION --- */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-fade-in">
          <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
             {activeTab === 'accessories' ? <Headphones size={20}/> : <Smartphone size={20}/>}
             {activeTab === 'accessories' ? 'Cadastrar Acessório' : 'Cadastrar Aparelho'}
          </h2>
          
          <form onSubmit={handleSubmit}>
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
                     <input required type="number" step="0.01" className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-accent" value={cost} onChange={e => setCost(e.target.value)} />
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
                     <input required type="number" step="0.01" className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-accent" value={cost} onChange={e => setCost(e.target.value)} />
                  </div>
               </div>
            )}

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold">Salvar Produto</button>
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
              placeholder={activeTab === 'accessories' ? "Buscar acessório..." : "Buscar por IMEI, Modelo..."}
              className="flex-1 bg-transparent outline-none text-gray-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-sm text-gray-500">
             Mostrando {filtered.length} itens
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-100 text-xs uppercase font-bold text-gray-500">
              <tr>
                {activeTab === 'accessories' ? (
                   <>
                     <th className="px-6 py-4">Produto</th>
                     <th className="px-6 py-4">Categoria</th>
                     <th className="px-6 py-4">Compatibilidade</th>
                     <th className="px-6 py-4 text-center">Estoque (Min/Max)</th>
                     <th className="px-6 py-4 text-right">Custo</th>
                     <th className="px-6 py-4 text-right">Venda</th>
                   </>
                ) : (
                   <>
                     <th className="px-6 py-4">Modelo / Marca</th>
                     <th className="px-6 py-4">Detalhes</th>
                     <th className="px-6 py-4">IMEI / Serial</th>
                     <th className="px-6 py-4 text-center">Condição</th>
                     <th className="px-6 py-4 text-right">Custo</th>
                     <th className="px-6 py-4 text-right">Venda</th>
                   </>
                )}
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(product => (
                <tr key={product.id} className="hover:bg-blue-50/50 transition-colors">
                  
                  {activeTab === 'accessories' && (
                     <>
                        <td className="px-6 py-4 font-bold text-gray-800">{product.name}</td>
                        <td className="px-6 py-4">
                           <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs border border-gray-200">{product.category}</span>
                        </td>
                        <td className="px-6 py-4">{product.compatibility || '-'}</td>
                        <td className="px-6 py-4 text-center">
                           <span className="font-bold">{product.stock}</span> 
                           <span className="text-xs text-gray-400 ml-1">({product.minStock}/{product.maxStock})</span>
                        </td>
                        <td className="px-6 py-4 text-right">R$ {product.cost.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right font-bold text-blue-600">R$ {product.price.toFixed(2)}</td>
                     </>
                  )}

                  {activeTab === 'devices' && (
                     <>
                        <td className="px-6 py-4">
                           <p className="font-bold text-gray-800">{product.model}</p>
                           <p className="text-xs text-gray-500">{product.brand}</p>
                        </td>
                        <td className="px-6 py-4 text-xs">
                           <p><strong>Cor:</strong> {product.color}</p>
                           <p><strong>Armaz:</strong> {product.storage}</p>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-gray-500">
                           <p>IMEI: {product.imei || '-'}</p>
                           <p>SN: {product.serialNumber || '-'}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                              product.condition === 'Novo' ? 'bg-green-100 text-green-700' : 
                              product.condition === 'Semi Novo' ? 'bg-blue-100 text-blue-700' :
                              'bg-orange-100 text-orange-700'
                           }`}>
                              {product.condition}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right">R$ {product.cost.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right font-bold text-blue-600">R$ {product.price.toFixed(2)}</td>
                     </>
                  )}

                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${product.stock < (product.minStock || 1) ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {product.stock < (product.minStock || 1) ? 'Baixo' : 'Ok'}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                 <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-400">Nenhum produto encontrado nesta categoria.</td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
