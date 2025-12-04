import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { ServiceOrder, OSStatus, Customer } from '../types';
import { Plus, Search, BrainCircuit, CheckCircle, Clock, FileText, X } from 'lucide-react';
import { analyzeTechnicalIssue } from '../services/geminiService';

export const ServiceOrders: React.FC = () => {
  const { serviceOrders, customers, addServiceOrder, updateServiceOrder } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [device, setDevice] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'Baixa'|'Média'|'Alta'>('Média');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiDiagnosis, setAiDiagnosis] = useState('');

  const filteredOS = serviceOrders.filter(os => 
    os.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    os.device.toLowerCase().includes(searchTerm.toLowerCase()) ||
    os.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAnalyze = async () => {
    if (!device || !description) return;
    setIsAnalyzing(true);
    const result = await analyzeTechnicalIssue(device, description);
    setAiDiagnosis(result);
    setIsAnalyzing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) return;

    const newOS: ServiceOrder = {
      id: `OS-${Math.floor(Math.random() * 10000)}`,
      customerId: customer.id,
      customerName: customer.name,
      device,
      description,
      status: OSStatus.PENDENTE,
      priority,
      createdAt: new Date().toISOString(),
      totalValue: 0,
      aiDiagnosis
    };

    addServiceOrder(newOS);
    resetForm();
    setIsModalOpen(false);
  };

  const resetForm = () => {
    setSelectedCustomerId('');
    setDevice('');
    setDescription('');
    setPriority('Média');
    setAiDiagnosis('');
  };

  const getStatusColor = (status: OSStatus) => {
    switch(status) {
      case OSStatus.PENDENTE: return 'bg-yellow-100 text-yellow-800';
      case OSStatus.EM_ANDAMENTO: return 'bg-blue-100 text-blue-800';
      case OSStatus.CONCLUIDO: return 'bg-green-100 text-green-800';
      case OSStatus.CANCELADO: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Ordens de Serviço</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-accent hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} /> Nova OS
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
        <Search size={20} className="text-gray-400" />
        <input 
          type="text" 
          placeholder="Buscar por cliente, aparelho ou ID..." 
          className="flex-1 outline-none text-gray-700"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredOS.map(os => (
          <div key={os.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex justify-between items-start mb-3">
                <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{os.id}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(os.status)}`}>
                  {os.status}
                </span>
              </div>
              <h3 className="font-bold text-lg text-gray-800 mb-1">{os.device}</h3>
              <p className="text-gray-600 text-sm mb-4">{os.customerName}</p>
              
              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Problema</p>
                <p className="text-sm text-gray-700 line-clamp-2">{os.description}</p>
              </div>

              {os.aiDiagnosis && (
                <div className="bg-purple-50 p-3 rounded-lg mb-4 border border-purple-100">
                  <div className="flex items-center gap-2 mb-1 text-purple-700">
                    <BrainCircuit size={14} />
                    <p className="text-xs font-bold uppercase tracking-wide">Diagnóstico IA</p>
                  </div>
                  <p className="text-xs text-gray-700 line-clamp-3 italic">"{os.aiDiagnosis}"</p>
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
                <span className="flex items-center gap-1"><Clock size={14}/> {new Date(os.createdAt).toLocaleDateString()}</span>
                {os.status !== OSStatus.CONCLUIDO && (
                  <button 
                    onClick={() => updateServiceOrder(os.id, { status: OSStatus.CONCLUIDO })}
                    className="text-green-600 hover:text-green-700 font-medium text-xs flex items-center gap-1"
                  >
                    <CheckCircle size={14} /> Concluir
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New OS Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-800">Nova Ordem de Serviço</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                  <select 
                    required 
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                    value={selectedCustomerId}
                    onChange={e => setSelectedCustomerId(e.target.value)}
                  >
                    <option value="">Selecione um cliente...</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aparelho / Modelo</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: iPhone 13 Pro, Notebook Dell G15..."
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                  value={device}
                  onChange={e => setDevice(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição do Problema</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="Descreva o defeito relatado pelo cliente..."
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-accent focus:border-transparent outline-none resize-none"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              {/* Gemini AI Integration */}
              <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                    <BrainCircuit size={16} /> Assistente Inteligente
                  </h3>
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !device || !description}
                    className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                      isAnalyzing || !device || !description
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {isAnalyzing ? 'Analisando...' : 'Gerar Diagnóstico'}
                  </button>
                </div>
                
                {aiDiagnosis ? (
                  <div className="text-sm text-indigo-900 bg-white p-3 rounded-lg border border-indigo-100 whitespace-pre-wrap">
                    {aiDiagnosis}
                  </div>
                ) : (
                  <p className="text-xs text-indigo-400">
                    Preencha o aparelho e a descrição para obter uma sugestão de diagnóstico e possíveis causas.
                  </p>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <button 
                  type="submit" 
                  className="bg-accent hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                >
                  Criar Ordem de Serviço
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};