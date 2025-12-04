import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Customer } from '../types';
import { UserPlus, Search, Mail, Phone, MapPin, Loader2 } from 'lucide-react';

export const Customers: React.FC = () => {
  const { customers, addCustomer } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cep, setCep] = useState('');
  const [address, setAddress] = useState('');
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCustomer: Customer = {
      id: Date.now().toString(),
      name,
      phone, // WhatsApp
      email,
      address
    };
    addCustomer(newCustomer);
    setShowForm(false);
    // Reset
    setName(''); setPhone(''); setEmail(''); setCep(''); setAddress('');
  };

  const handleCepBlur = async () => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        // Formata o endereço automaticamente
        setAddress(`${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`);
      } else {
        alert('CEP não encontrado!');
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      alert('Erro ao buscar CEP. Verifique sua conexão.');
    } finally {
      setIsLoadingCep(false);
    }
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
            
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Nome Completo</label>
              <input 
                required 
                placeholder="Ex: João Silva" 
                className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-accent"
                value={name} 
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">WhatsApp / Telefone</label>
              <input 
                required 
                placeholder="(00) 00000-0000" 
                className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-accent"
                value={phone} 
                onChange={e => setPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
              <input 
                placeholder="cliente@email.com" 
                type="email"
                className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-accent"
                value={email} 
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">CEP (Busca Automática)</label>
              <div className="relative">
                <input 
                  placeholder="00000-000" 
                  className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-accent"
                  value={cep} 
                  onChange={e => setCep(e.target.value)}
                  onBlur={handleCepBlur}
                  maxLength={9}
                />
                {isLoadingCep && (
                  <div className="absolute right-3 top-2.5 text-accent animate-spin">
                    <Loader2 size={20} />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Endereço Completo</label>
              <input 
                required 
                placeholder="Rua, Número, Bairro - Cidade/UF" 
                className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-accent"
                value={address} 
                onChange={e => setAddress(e.target.value)}
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium">Salvar Cliente</button>
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
                <Phone size={16} className="text-green-600" /> <span className="font-medium">{customer.phone}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-gray-400" /> {customer.email}
                </div>
              )}
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-gray-400 mt-0.5" /> <span className="flex-1">{customer.address}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};