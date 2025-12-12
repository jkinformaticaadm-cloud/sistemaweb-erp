
import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Save, Building, Bell, Database, Check, CreditCard, Plus, Trash2, Calculator, Users, Upload, Download, X, UserPlus, AlertTriangle, Lock } from 'lucide-react';
import { PaymentMachine, User as UserType, UserRole } from '../types';
import { useNavigate } from 'react-router-dom';

type SettingsTab = 'general' | 'fees' | 'users';

export const Settings: React.FC = () => {
  const { settings, updateSettings, backupSystem, restoreSystem, resetData } = useData();
  const { user, addUser, updateUser, deleteUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [formData, setFormData] = useState(settings);
  const [isSaved, setIsSaved] = useState(false);
  
  // Machine Editing State
  const [editingMachine, setEditingMachine] = useState<PaymentMachine | null>(null);

  // User Management State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [userForm, setUserForm] = useState({ name: '', username: '', password: '', role: 'USER' as UserRole });

  // Reset Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');

  // Security Check
  useEffect(() => {
     if (user?.role !== 'ADMIN') {
        navigate('/'); // Redirect non-admins
     }
  }, [user, navigate]);

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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData(prev => ({ ...prev, logo: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
       if (confirm("ATENÇÃO: Restaurar um backup substituirá os dados atuais da sessão. Deseja continuar?")) {
          const success = await restoreSystem(file);
          if (success) {
             alert("Sistema restaurado com sucesso!");
             window.location.reload();
          } else {
             alert("Falha ao restaurar o arquivo. Verifique se é um backup válido.");
          }
       }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleResetSystem = async (e: React.FormEvent) => {
     e.preventDefault();
     if (user?.password === adminPasswordInput) {
        await resetData();
        setIsResetModalOpen(false);
        setAdminPasswordInput('');
        alert("Sistema resetado com sucesso. Todos os dados foram apagados.");
        window.location.reload();
     } else {
        alert("Senha de administrador incorreta.");
     }
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

  const handleRateChange = (installments: number, newRate: string) => {
    if (!editingMachine) return;
    const rateVal = parseFloat(newRate) || 0;
    
    const updatedRates = editingMachine.creditRates.map(r => 
      r.installments === installments ? { ...r, rate: rateVal } : r
    );

    const updatedMachine = { ...editingMachine, creditRates: updatedRates };
    handleUpdateMachine(updatedMachine);
  };

  // --- User Management Logic ---
  
  const handleOpenUserModal = (u?: UserType) => {
     if (u) {
        setEditingUser(u);
        setUserForm({ name: u.name, username: u.username, password: u.password || '', role: u.role });
     } else {
        setEditingUser(null);
        setUserForm({ name: '', username: '', password: '', role: 'USER' });
     }
     setIsUserModalOpen(true);
  };

  const handleUserSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if (editingUser) {
        updateUser(editingUser.id, userForm);
     } else {
        if (!userForm.name || !userForm.username || !userForm.password) return alert('Preencha todos os campos');
        addUser({
           id: `user-${Date.now()}`,
           ...userForm
        });
     }
     setIsUserModalOpen(false);
  };

  const handleDeleteUser = (id: string) => {
     if(confirm("Tem certeza que deseja excluir este usuário?")) {
        deleteUser(id);
     }
  };

  if (user?.role !== 'ADMIN') return null;

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
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'general' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
         >
            Geral
         </button>
         <button 
            type="button"
            onClick={() => setActiveTab('fees')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'fees' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
         >
            Taxas e Máquinas
         </button>
         <button 
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'users' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
         >
            <Users size={16}/> Usuários
         </button>
      </div>

      <form onSubmit={handleSave}>
         
         {/* --- GENERAL SETTINGS CONTENT --- */}
         {activeTab === 'general' && (
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Logo da Empresa</label>
                      <div className="flex items-center gap-4">
                         <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 relative group">
                            {formData.logo ? (
                               <>
                                 <img src={formData.logo} alt="Logo" className="w-full h-full object-contain p-1" />
                                 <button type="button" onClick={() => setFormData({...formData, logo: undefined})} className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Trash2 size={20}/>
                                 </button>
                               </>
                            ) : (
                               <span className="text-gray-400 text-xs text-center font-bold">RTJK</span>
                            )}
                         </div>
                         <div>
                            <label className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm cursor-pointer hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-colors">
                               <Upload size={16}/> Carregar Imagem
                               <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                            </label>
                            <p className="text-xs text-gray-500 mt-2">Aparecerá nos recibos e OS. Recomendado: PNG quadrado.</p>
                         </div>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa</label>
                      <input 
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                      <input 
                        name="cnpj"
                        value={formData.cnpj}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
                      <input 
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email de Contato</label>
                      <input 
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Endereço Completo</label>
                      <input 
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Chave PIX Padrão</label>
                      <input 
                        name="pixKey"
                        value={formData.pixKey}
                        onChange={handleChange}
                        placeholder="CPF, CNPJ, Email ou Aleatória"
                        className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Backup & Restore */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                      <Database size={20} />
                    </div>
                    <h2 className="font-semibold text-gray-800">Backup e Restauração</h2>
                  </div>
                  <div className="p-6 flex flex-col md:flex-row gap-6">
                     <div className="flex-1">
                        <h3 className="font-bold text-gray-700 mb-2">Exportar Dados</h3>
                        <p className="text-sm text-gray-500 mb-4">Gere um arquivo de backup completo com todos os dados do sistema (Clientes, Vendas, OS, etc).</p>
                        <button 
                           type="button"
                           onClick={backupSystem}
                           className="bg-gray-800 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-gray-700 transition-colors"
                        >
                           <Download size={16}/> Baixar Backup (.json)
                        </button>
                     </div>
                     <div className="w-px bg-gray-200 hidden md:block"></div>
                     <div className="flex-1">
                        <h3 className="font-bold text-gray-700 mb-2">Restaurar Dados</h3>
                        <p className="text-sm text-gray-500 mb-4">Importe um arquivo de backup para restaurar o sistema. Isso substituirá os dados atuais.</p>
                        <label className="bg-orange-100 text-orange-700 border border-orange-200 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 w-fit cursor-pointer hover:bg-orange-200 transition-colors">
                           <Upload size={16}/> Selecionar Arquivo
                           <input type="file" accept=".json" className="hidden" onChange={handleRestore} />
                        </label>
                     </div>
                  </div>
                </div>

                {/* Danger Zone - Reset System */}
                <div className="bg-red-50 rounded-xl shadow-sm border border-red-200 overflow-hidden">
                  <div className="p-4 bg-red-100 border-b border-red-200 flex items-center gap-3">
                    <div className="p-2 bg-red-200 rounded-lg text-red-700">
                      <AlertTriangle size={20} />
                    </div>
                    <h2 className="font-semibold text-red-800">Zona de Perigo</h2>
                  </div>
                  <div className="p-6">
                     <h3 className="font-bold text-red-800 mb-2">Resetar Sistema Completo</h3>
                     <p className="text-sm text-red-600 mb-4">Esta ação apagará <strong>TODOS</strong> os dados cadastrados (clientes, produtos, financeiro, OS). <br/>Esta ação é irreversível se não houver backup.</p>
                     <button 
                        type="button"
                        onClick={() => setIsResetModalOpen(true)}
                        className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-red-700 transition-colors shadow-sm"
                     >
                        <Trash2 size={16}/> Resetar Sistema
                     </button>
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
         )}

         {/* --- FEES SETTINGS CONTENT --- */}
         {activeTab === 'fees' && (
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
                                 className="text-red-500 hover:text-red-700 p-2"
                              >
                                 <Trash2 size={18}/>
                              </button>
                           </div>
                           <div className="p-6 space-y-4">
                              <div>
                                 <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nome da Máquina</label>
                                 <input 
                                    className="w-full border p-2 rounded-lg"
                                    value={editingMachine.name}
                                    onChange={(e) => handleUpdateMachine({...editingMachine, name: e.target.value})}
                                 />
                              </div>
                              <div>
                                 <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Taxa Débito (%)</label>
                                 <input 
                                    type="number" step="0.01"
                                    className="w-full border p-2 rounded-lg"
                                    value={editingMachine.debitRate}
                                    onChange={(e) => handleUpdateMachine({...editingMachine, debitRate: parseFloat(e.target.value)})}
                                 />
                              </div>
                              
                              <div className="pt-4 border-t border-gray-100">
                                 <h4 className="font-bold text-gray-700 mb-3 text-sm">Taxas de Crédito Parcelado</h4>
                                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {editingMachine.creditRates.map((rate) => (
                                       <div key={rate.installments}>
                                          <label className="block text-xs text-gray-500 mb-1">{rate.installments}x</label>
                                          <input 
                                             type="number" step="0.01"
                                             className="w-full border p-2 rounded text-sm"
                                             value={rate.rate}
                                             onChange={(e) => handleRateChange(rate.installments, e.target.value)}
                                          />
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           </div>
                        </div>
                     ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 border-2 border-dashed border-gray-200 rounded-xl">
                           <Calculator size={48} className="mb-4 opacity-20"/>
                           <p>Selecione ou adicione uma máquina para editar as taxas.</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         )}

         {/* --- USERS SETTINGS CONTENT --- */}
         {activeTab === 'users' && (
            <div className="space-y-6 animate-fade-in">
               <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div>
                     <h2 className="text-lg font-bold text-gray-800">Gerenciar Usuários</h2>
                     <p className="text-sm text-gray-500">Controle de acesso ao sistema</p>
                  </div>
                  <button 
                     type="button"
                     onClick={() => handleOpenUserModal()}
                     className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors"
                  >
                     <UserPlus size={18}/> Novo Usuário
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* User Modal */}
                  {isUserModalOpen && (
                     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                           <h2 className="text-xl font-bold mb-4">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h2>
                           <div className="space-y-3">
                              <input 
                                 placeholder="Nome Completo" 
                                 className="w-full border p-2 rounded" 
                                 value={userForm.name} 
                                 onChange={e => setUserForm({...userForm, name: e.target.value})}
                              />
                              <input 
                                 placeholder="Usuário (Login)" 
                                 className="w-full border p-2 rounded" 
                                 value={userForm.username} 
                                 onChange={e => setUserForm({...userForm, username: e.target.value})}
                              />
                              <input 
                                 type="password" 
                                 placeholder="Senha" 
                                 className="w-full border p-2 rounded" 
                                 value={userForm.password} 
                                 onChange={e => setUserForm({...userForm, password: e.target.value})}
                              />
                              <select 
                                 className="w-full border p-2 rounded bg-white"
                                 value={userForm.role}
                                 onChange={e => setUserForm({...userForm, role: e.target.value as UserRole})}
                              >
                                 <option value="USER">Usuário Padrão</option>
                                 <option value="ADMIN">Administrador</option>
                              </select>
                              <div className="flex justify-end gap-2 mt-4">
                                 <button type="button" onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
                                 <button type="button" onClick={handleUserSubmit} className="bg-blue-600 text-white px-4 py-2 rounded font-bold">Salvar</button>
                              </div>
                           </div>
                        </div>
                     </div>
                  )}

                  {/* List Users (Assuming fetched from auth context or mocked) */}
                  {/* Since users list isn't directly exposed in context provided in prompt, using mock or just self if available */}
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
                           {user?.name.charAt(0)}
                        </div>
                        <div>
                           <p className="font-bold text-gray-800">{user?.name} (Você)</p>
                           <p className="text-xs text-gray-500">{user?.username} • {user?.role}</p>
                        </div>
                     </div>
                     <button type="button" onClick={() => handleOpenUserModal(user!)} className="text-blue-600 hover:underline text-sm font-bold">Editar</button>
                  </div>
                  {/* In a real app with exposed user list in context, map through them here */}
               </div>
            </div>
         )}

         {/* Save Action Bar */}
         <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 flex justify-end z-40 md:pl-72">
            <button 
               type="submit"
               className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-transform active:scale-95"
            >
               <Save size={20}/> Salvar Alterações
            </button>
         </div>
      </form>

      {/* --- RESET PASSWORD MODAL --- */}
      {isResetModalOpen && (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in">
               <div className="bg-red-600 text-white p-4 flex items-center gap-2">
                  <AlertTriangle size={24}/>
                  <h2 className="font-bold text-lg">Confirmação de Segurança</h2>
               </div>
               <div className="p-6">
                  <p className="text-gray-600 mb-4 text-sm">
                     Para confirmar o <strong>RESET COMPLETO</strong> do sistema, digite sua senha de administrador. <br/>
                     <span className="font-bold text-red-600">Esta ação não pode ser desfeita.</span>
                  </p>
                  <form onSubmit={handleResetSystem}>
                     <div className="mb-4">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Senha do Admin</label>
                        <div className="relative">
                           <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                           <input 
                              type="password" 
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                              placeholder="Digite sua senha..."
                              value={adminPasswordInput}
                              onChange={e => setAdminPasswordInput(e.target.value)}
                              autoFocus
                           />
                        </div>
                     </div>
                     <div className="flex justify-end gap-2">
                        <button 
                           type="button" 
                           onClick={() => { setIsResetModalOpen(false); setAdminPasswordInput(''); }}
                           className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium text-sm"
                        >
                           Cancelar
                        </button>
                        <button 
                           type="submit"
                           className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md"
                        >
                           Confirmar Reset
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         </div>
      )}

      <div className="h-20"></div> {/* Spacer for fixed footer */}
    </div>
  );
};
