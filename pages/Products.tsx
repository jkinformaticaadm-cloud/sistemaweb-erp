import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Product } from '../types';
import { PackagePlus, Search } from 'lucide-react';

export const Products: React.FC = () => {
  const { products, addProduct } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  
  // Form
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('Peças');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: Product = {
      id: Date.now().toString(),
      name,
      price: Number(price),
      cost: Number(cost),
      stock: Number(stock),
      category
    };
    addProduct(newProduct);
    setShowForm(false);
    setName(''); setPrice(''); setCost(''); setStock('');
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Estoque de Produtos</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-accent hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <PackagePlus size={20} /> Novo Produto
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Cadastrar Produto</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <input required placeholder="Nome do Produto" className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-accent" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <input required placeholder="Preço Venda (R$)" type="number" className="border p-2 rounded-lg outline-none focus:ring-2 focus:ring-accent" value={price} onChange={e => setPrice(e.target.value)} />
            <input required placeholder="Custo (R$)" type="number" className="border p-2 rounded-lg outline-none focus:ring-2 focus:ring-accent" value={cost} onChange={e => setCost(e.target.value)} />
            <input required placeholder="Qtd Estoque" type="number" className="border p-2 rounded-lg outline-none focus:ring-2 focus:ring-accent" value={stock} onChange={e => setStock(e.target.value)} />
            <div className="lg:col-span-5 flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">Salvar Produto</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200 max-w-md">
            <Search size={20} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar no estoque..." 
              className="flex-1 bg-transparent outline-none text-gray-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
              <tr>
                <th className="px-6 py-3">Produto</th>
                <th className="px-6 py-3">Categoria</th>
                <th className="px-6 py-3 text-right">Custo</th>
                <th className="px-6 py-3 text-right">Preço</th>
                <th className="px-6 py-3 text-center">Estoque</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(product => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-800">{product.name}</td>
                  <td className="px-6 py-4">{product.category}</td>
                  <td className="px-6 py-4 text-right">R$ {product.cost.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-bold text-accent">R$ {product.price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">{product.stock}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.stock < 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {product.stock < 5 ? 'Baixo' : 'Normal'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};