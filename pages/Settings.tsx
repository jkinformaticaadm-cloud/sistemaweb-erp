
import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Save, Building, Bell, ShieldAlert, Database, Check, CreditCard, Plus, Trash2, Calculator } from 'lucide-react';
import { PaymentMachine, InstallmentRate } from '../types';

type SettingsTab = 'general' | 'fees';

export const Settings: React.FC = () => {
  const { settings, updateSettings, resetData } = useData();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [formData, setFormData] = useState(settings);
  const [isSaved, setIsSaved] = useState(false);

  // Machine Editing State
  const [editingMachine, setEditingMachine] = useState<PaymentMachine | null>(null);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  // --- Machine Management Logic ---

  const handleAddMachine = () => {
    const newMachine: PaymentMachine = {
      id: `mach-${Date.now()}`,
      name: 'Nova Máquina',
      debitRate: 0,
      creditRates: Array.from({ length: 18 }, (_, i) => ({ installments: i + 1, rate: 0 }))
    };
    const updatedMachines = [...(formData.paymentMachines || []), newMachine];
    setFormData({ ...formData, paymentMachines: updatedMachines });
    setEditingMachine(newMachine);
  };

  const handleRemoveMachine = (id: string) => {
    if (confirm('Tem certeza que deseja remover esta máquina?')) {
      const updatedMachines = formData.paymentMachines.filter(m => m.id !== id);
      setFormData({ ...formData, paymentMachines: updatedMachines });
      if (editingMachine?.id === id) setEditingMachine(null);
    }
  };

  const handleUpdateMachine = (machine: PaymentMachine) => {
     const updatedMachines = formData.paymentMachines.map(m => m.id === machine.id ? machine : m);
     setFormData({ ...formData, paymentMachines: updatedMachines });
     setEditingMachine(machine); // Keep editing
  };

  const handleRateChange = (machineId: string, installments: number, newRate: string) => {
    if (!editingMachine) return;
    const rateVal = parseFloat(newRate) || 0;
    
    const updatedRates = editingMachine.creditRates.map(r => 
      r.installments === installments ? { ...r, rate: rateVal } : r
    );

    const updatedMachine = { ...editingMachine, creditRates: updatedRates };
    handleUpdateMachine(updatedMachine);
  };

  // --- Render Functions ---

  const GeneralSettings = () => (
    <div className="space-y-6 animate-fade-in">
        {/* Company Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <Building size={20} />
            </div>
            <h2 className="font-semibold text-gray-800">Perfil da Empresa</h2>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa</label>
              <input 
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
              <input 
                name="cnpj"
                value={formData.cnpj}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
              <input 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email de Contato</label>
              <input 
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Endereço Completo</label>
              <input 
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
              <Bell size={20} />
            </div>
            <h2 className="font-semibold text-gray-800">Preferências e Notificações</h2>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Notificações por Email</h3>
                <p className="text-sm text-gray-500">Receber resumo diário de vendas e OS pendentes.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  name="enableNotifications"
                  checked={formData.enableNotifications}
                  onChange={handleChange}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Sons do Sistema</h3>
                <p className="text-sm text-gray-500">Reproduzir sons ao completar vendas ou receber mensagens.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  name="enableSound"
                  checked={formData.enableSound}
                  onChange={handleChange}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
    </div>
  );

  const FeesSettings = () => (
    <div className="space-y-6 animate-fade-in">
       <div className="flex flex-col md:flex-row gap-6">
          
          {/* Machine List */}
          <div className="w-full md:w-1/3 space-y-4">
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                   <CreditCard size={20}/> Máquinas Cadastradas
                </h3>
                <div className="space-y-2">
                   {(formData.paymentMachines || []).map(machine => (
                      <button
                        key={machine.id}
                        type="button"
                        onClick={() => setEditingMachine(machine)}
                        className={`w-full text-left p-3 rounded-lg border transition-all flex justify-between items-center
                           ${editingMachine?.id === machine.id 
                              ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' 
                              : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}
                      >
                         <span>{machine.name}</span>
                         <span className="text-xs bg-white px-2 py-1 rounded border border-gray-200 shadow-sm">{machine.debitRate}%</span>
                      </button>
                   ))}
                   <button 
                      type="button"
                      onClick={handleAddMachine}
                      className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 font-medium flex items-center justify-center gap-2 transition-colors"
                   >
                      <Plus size={18} /> Nova Máquina
                   </button>
                </div>
             </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1">
             {editingMachine ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                   <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                         <Calculator size={20} className="text-blue-600"/>
                         <h3 className="font-bold text-gray-800">Editando Taxas</h3>
                      </div>
                      <button 
                         type="button" 
                         onClick={() => handleRemoveMachine(editingMachine.id)}
                         className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-lg"
                      >
                         <Trash2 size={16}/> Excluir
                      </button>
                   </div>
                   
                   <div className="p-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Máquina</label>
                            <input 
                               value={editingMachine.name} 
                               onChange={e => handleUpdateMachine({...editingMachine, name: e.target.value})}
                               className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-accent"
                               placeholder="Ex: Stone - Plano Pro"
                            />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Taxa Débito (%)</label>
                            <input 
                               type="number" step="0.01"
                               value={editingMachine.debitRate} 
                               onChange={e => handleUpdateMachine({...editingMachine, debitRate: parseFloat(e.target.value) || 0})}
                               className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-accent font-bold text-gray-800"
                            />
                         </div>
                      </div>

                      <div>
                         <h4 className="font-bold text-gray-700 mb-3 text-sm border-b pb-2">Parcelamento Crédito (Taxas %)</h4>
                         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                            {editingMachine.creditRates.map((rateObj) => (
                               <div key={rateObj.installments} className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                                  <label className="block text-xs font-bold text-gray-500 mb-1">{rateObj.installments}x</label>
                                  <div className="relative">
                                     <input 
                                        type="number" step="0.01"
                                        value={rateObj.rate}
                                        onChange={e => handleRateChange(editingMachine.id, rateObj.installments, e.target.value)}
                                        className="w-full text-center border border-gray-300 rounded px-1 py-1 text-sm focus:border-blue-500 outline-none"
                                     />
                                     <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>
             ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-8">
                   <CreditCard size={48} className="mb-4 opacity-20"/>
                   <p>Selecione uma máquina para editar ou adicione uma nova.</p>
                </div>
             )}
          </div>
       </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Configurações do Sistema</h1>
        {isSaved && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg animate-fade-in">
            <Check size={20} />
            <span className="font-medium">Salvo com sucesso!</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white p-1 rounded-xl shadow-sm border border-gray-200 w-fit">
         <button 
            onClick={() => setActiveTab('general')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'general' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
         >
            Geral
         </button>
         <button 
            onClick={() => setActiveTab('fees')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'fees' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
         >
            Taxas e Máquinas
         </button>
      </div>

      <form onSubmit={handleSave}>
         {activeTab === 'general' && <GeneralSettings />}
         {activeTab === 'fees' && <FeesSettings />}

         {/* Footer Actions */}
         <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
             
             {/* Danger Zone only visible in General Tab */}
             {activeTab === 'general' ? (
               <div className="flex items-center gap-4">
                  <button 
                     type="button"
                     onClick={resetData}
                     className="flex items-center gap-2 text-red-500 text-sm hover:underline"
                  >
                     <Database size={16} /> Resetar Fábrica
                  </button>
               </div>
             ) : <div></div>}

            <button 
               type="submit" 
               className="flex items-center gap-2 bg-accent hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg"
            >
               <Save size={20} /> Salvar Alterações
            </button>
         </div>
      </form>

    </div>
  );
};
