
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Customer } from '../types';
import { UserPlus, Search, Mail, Phone, MapPin, Loader2, Edit, Printer, X, User } from 'lucide-react';

export const Customers: React.FC = () => {
  const { customers, addCustomer, updateCustomer } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cep, setCep] = useState('');
  const [address, setAddress] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const openForm = (customer?: Customer) => {
    if (customer) {
      setEditingId(customer.id);
      setName(customer.name);
      setPhone(customer.phone);
      setEmail(customer.email);
      setCep(customer.cep || '');
      setAddress(customer.address);
      setAddressNumber(customer.addressNumber || '');
    } else {
      setEditingId(null);
      setName(''); setPhone(''); setEmail(''); setCep(''); setAddress(''); setAddressNumber('');
    }
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      updateCustomer(editingId, {
        name, phone, email, address, addressNumber, cep
      });
    } else {
      const newCustomer: Customer = {
        id: Date.now().toString(),
        name,
        phone,
        email,
        address,
        addressNumber,
        cep
      };
      addCustomer(newCustomer);
    }
    
    setShowForm(false);
  };

  const handleCepBlur = async () => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
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

  const handlePrint = () => {
    window.print();
  };

  const filtered = customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm));

  const PrintModal = () => {
    if (!viewingCustomer) return null;
    return (
       <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none">
             <div className="bg-gray-800 text-white p-4 flex justify-between items-center print:hidden">
                <h2 className="font-bold flex items-center gap-2"><User size={20}/> Ficha de Cadastro</h2>
                <div className="flex gap-2">
                   <button onClick={handlePrint} className="bg-white text-gray-800 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-gray-100"><Printer size={16}/> Imprimir</button>
                   <button onClick={() => setViewingCustomer(null)} className="hover:text-gray-300"><X size={24}/></button>
                </div>
             </div>

             <div className="p-8 space-y-6 print:p-0">
                <div className="text-center border-b pb-4 mb-6">
                   <h1 className="text-2xl font-bold uppercase tracking-wide text-gray-900">{viewingCustomer.name}</h1>
                   <p className="text-gray-500 text-sm">Código: {viewingCustomer.id}</p>
                </div>

                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                   <div className="bg-gray-50 p-3 rounded-lg print:bg-transparent print:p-0 print:border print:border-gray-300 print:px-2">
                      <p className="text-xs text-gray-500 uppercase font-bold">Telefone / WhatsApp</p>
                      <p className="text-lg text-gray-800 font-medium">{viewingCustomer.phone}</p>
                   </div>
                   <div className="bg-gray-50 p-3 rounded-lg print:bg-transparent print:p-0 print:border print:border-gray-300 print:px-2">
                      <p className="text-xs text-gray-500 uppercase font-bold">Email</p>
                      <p className="text-lg text-gray-800">{viewingCustomer.email || '-'}</p>
                   </div>
                   <div className="col-span-2 bg-gray-50 p-3 rounded-lg print:bg-transparent print:p-0 print:border print:border-gray-300 print:px-2">
                      <p className="text-xs text-gray-500 uppercase font-bold">Endereço</p>
                      <p className="text-lg text-gray-800">{viewingCustomer.address}</p>
                   </div>
                   <div className="bg-gray-50 p-3 rounded-lg print:bg-transparent print:p-0 print:border print:border-gray-300 print:px-2">
                      <p className="text-xs text-gray-500 uppercase font-bold">Número</p>
                      <p className="text-lg text-gray-800">{viewingCustomer.addressNumber || 'S/N'}</p>
                   </div>
                   <div className="bg-gray-50 p-3 rounded-lg print:bg-transparent print:p-0 print:border print:border-gray-300 print:px-2">
                      <p className="text-xs text-gray-500 uppercase font-bold">CEP</p>
                      <p className="text-lg text-gray-800">{viewingCustomer.cep || '-'}</p>
                   </div>
                </div>

                <div className="mt-8 pt-8 border-t border-dashed border-gray-300 text-center print:block hidden">
                   <p className="text-sm text-gray-500">TechFix Pro - Sistema de Gestão</p>
                   <p className="text-xs text-gray-400">Gerado em {new Date().toLocaleDateString()}</p>
                </div>
             </div>
          </div>
       </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col gap-4">
         <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Gerenciar Clientes</h1>
            <button 
               onClick={() => openForm()}
               className="bg-accent hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
               <UserPlus size={20} /> Novo Cliente
            </button>
         </div>

         <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 flex items-center gap-2">
            <Search size={20} className="text-gray-400 ml-2" />
            <input 
               type="text" 
               placeholder="Buscar por nome, telefone..." 
               className="flex-1 outline-none text-gray-700 h-10 bg-transparent"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
           <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 w-full max-w-2xl animate-fade-in relative">
             <button onClick={() => setShowForm(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"><X size={20}/></button>
             <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                {editingId ? <Edit size={24} className="text-blue-600"/> : <UserPlus size={24} className="text-green-600"/>}
                {editingId ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
             </h2>
             
             <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
               <div className="md:col-span-4">
                 <label className="block text-xs font-bold text-gray-700 mb-1">Nome Completo</label>
                 <input 
                   required 
                   placeholder="Ex: João Silva" 
                   className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                   value={name} 
                   onChange={e => setName(e.target.value)}
                 />
               </div>

               <div className="md:col-span-2">
                 <label className="block text-xs font-bold text-gray-700 mb-1">WhatsApp</label>
                 <input 
                   required 
                   placeholder="(00) 00000-0000" 
                   className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                   value={phone} 
                   onChange={e => setPhone(e.target.value)}
                 />
               </div>

               <div className="md:col-span-2">
                 <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
                 <input 
                   placeholder="cliente@email.com" 
                   type="email"
                   className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                   value={email} 
                   onChange={e => setEmail(e.target.value)}
                 />
               </div>

               <div className="md:col-span-1">
                 <label className="block text-xs font-bold text-gray-700 mb-1">CEP</label>
                 <div className="relative">
                   <input 
                     placeholder="00000-000" 
                     className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                     value={cep} 
                     onChange={e => setCep(e.target.value)}
                     onBlur={handleCepBlur}
                     maxLength={9}
                   />
                   {isLoadingCep && (
                     <div className="absolute right-3 top-2.5 text-blue-600 animate-spin">
                       <Loader2 size={16} />
                     </div>
                   )}
                 </div>
               </div>

               <div className="md:col-span-2">
                 <label className="block text-xs font-bold text-gray-700 mb-1">Endereço (Rua, Bairro, Cidade)</label>
                 <input 
                   required 
                   placeholder="Rua das Flores, Centro" 
                   className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                   value={address} 
                   onChange={e => setAddress(e.target.value)}
                 />
               </div>

               <div className="md:col-span-1">
                 <label className="block text-xs font-bold text-gray-700 mb-1">Número</label>
                 <input 
                   required 
                   placeholder="123" 
                   className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                   value={addressNumber} 
                   onChange={e => setAddressNumber(e.target.value)}
                 />
               </div>

               <div className="md:col-span-4 flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                 <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Cancelar</button>
                 <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold">
                    {editingId ? 'Atualizar Cliente' : 'Salvar Cliente'}
                 </button>
               </div>
             </form>
           </div>
        </div>
      )}

      {/* Customer List Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
               <tr>
                  <th className="px-6 py-4">Nome / ID</th>
                  <th className="px-6 py-4">Contato</th>
                  <th className="px-6 py-4">Endereço</th>
                  <th className="px-6 py-4 text-center">Ações</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
               {filtered.length === 0 ? (
                  <tr>
                     <td colSpan={4} className="p-8 text-center text-gray-400">Nenhum cliente encontrado.</td>
                  </tr>
               ) : (
                  filtered.map(customer => (
                     <tr key={customer.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-6 py-4">
                           <p className="font-bold text-gray-800 text-base">{customer.name}</p>
                           <p className="text-xs text-gray-400">ID: {customer.id}</p>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2 text-gray-700 mb-1">
                              <Phone size={14} className="text-green-600"/> {customer.phone}
                           </div>
                           <div className="flex items-center gap-2 text-gray-500">
                              <Mail size={14}/> {customer.email || 'Não informado'}
                           </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                           <div className="flex items-start gap-2">
                              <MapPin size={14} className="mt-0.5 text-gray-400 flex-shrink-0"/> 
                              <span>
                                 {customer.address}, <strong className="text-gray-800">Nº {customer.addressNumber || 'S/N'}</strong>
                                 {customer.cep && <span className="block text-xs text-gray-400">{customer.cep}</span>}
                              </span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex justify-center gap-2">
                              <button 
                                 onClick={() => openForm(customer)} 
                                 className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                 title="Editar"
                              >
                                 <Edit size={18}/>
                              </button>
                              <button 
                                 onClick={() => setViewingCustomer(customer)}
                                 className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                                 title="Visualizar para Impressão"
                              >
                                 <Printer size={18}/>
                              </button>
                           </div>
                        </td>
                     </tr>
                  ))
               )}
            </tbody>
         </table>
      </div>

      {/* Print View Modal */}
      <PrintModal />
      
      {/* Print Styles */}
      <style>{`
         @media print {
            body > *:not(.fixed) { display: none !important; }
            .fixed { position: static !important; background: white !important; height: auto !important; }
            .fixed .bg-white { box-shadow: none !important; max-width: 100% !important; width: 100% !important; }
         }
      `}</style>
    </div>
  );
};
