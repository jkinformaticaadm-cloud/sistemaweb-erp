import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Customer } from '../types';
import { UserPlus, Search, Mail, Phone, MapPin } from 'lucide-react';

export const Customers: React.FC = () => {
  const { customers, addCustomer } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCustomer: Customer = {
      id: Date.now().toString(),
      name,
      phone,
      email,
      address
    };
    addCustomer(newCustomer);
    setShowForm(false);
    // Reset
    setName(''); setPhone(''); setEmail(''); setAddress('');
  };

  const filtered = customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gerenciar Clientes</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-accent hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <UserPlus size={20} /> Novo Cliente
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-fade-in">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Cadastrar Cliente</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              required placeholder="Nome Completo" 
              className="border p-2 rounded-lg outline-none focus:ring-2 focus:ring-accent"
              value={name} onChange={e => setName(e.target.value)}
            />
            <input 
              required placeholder="Telefone" 
              className="border p-2 rounded-lg outline-none focus:ring-2 focus:ring-accent"
              value={phone} onChange={e => setPhone(e.target.value)}
            />
            <input 
              required placeholder="Email" type="email"
              className="border p-2 rounded-lg outline-none focus:ring-2 focus:ring-accent"
              value={email} onChange={e => setEmail(e.target.value)}
            />
            <input 
              required placeholder="Endereço" 
              className="border p-2 rounded-lg outline-none focus:ring-2 focus:ring-accent"
              value={address} onChange={e => setAddress(e.target.value)}
            />
            <div className="md:col-span-2 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">Salvar</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
        <Search size={20} className="text-gray-400" />
        <input 
          type="text" 
          placeholder="Buscar clientes..." 
          className="flex-1 outline-none text-gray-700"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(customer => (
          <div key={customer.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                {customer.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-gray-800">{customer.name}</h3>
                <p className="text-xs text-gray-500">ID: {customer.id}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-gray-400" /> {customer.phone}
              </div>
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-gray-400" /> {customer.email}
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-gray-400" /> {customer.address}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};