/**
 * Composant pour créer de nouvelles tâches d'agents avec UI moderne
 */

import React, { useState } from 'react';
import { AgentType } from '../types/agent';
import { useAgentManager } from '../hooks/useAgentManager';

interface AgentTaskCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated?: (taskId: string) => void;
}

const agentTypes: { type: AgentType; name: string; icon: string; description: string; color: string; gradient: string }[] = [
  {
    type: 'research',
    name: 'Agent de Recherche',
    icon: '🔍',
    description: 'Recherche et collecte d\'informations sur un sujet spécifique',
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    type: 'analysis',
    name: 'Agent d\'Analyse',
    icon: '📊',
    description: 'Analyse de données et génération d\'insights',
    color: 'purple',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    type: 'creation',
    name: 'Agent de Création',
    icon: '✨',
    description: 'Création de contenu structuré et optimisé',
    color: 'green',
    gradient: 'from-emerald-500 to-teal-500'
  },
];

export default function AgentTaskCreator({ isOpen, onClose, onTaskCreated }: AgentTaskCreatorProps) {
  const { createTask, isLoading } = useAgentManager();
  const [description, setDescription] = useState('');
  const [selectedType, setSelectedType] = useState<AgentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!description.trim()) {
      setError('Veuillez entrer une description de tâche');
      return;
    }

    if (!selectedType) {
      setError('Veuillez sélectionner un type d\'agent');
      return;
    }

    try {
      const task = await createTask(description.trim(), selectedType);
      if (task) {
        setDescription('');
        setSelectedType(null);
        onTaskCreated?.(task.id);
        onClose();
      } else {
        setError('Erreur lors de la création de la tâche');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  };

  const handleClose = () => {
    setDescription('');
    setSelectedType(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-xl transition-all duration-500"
        onClick={handleClose}
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.1), transparent 70%)'
        }}
      />

      {/* Modal */}
      <div 
        className="relative w-full max-w-2xl glass-intense rounded-3xl shadow-2xl overflow-hidden animate-in"
        style={{
          boxShadow: '0 25px 100px rgba(0, 0, 0, 0.5), 0 0 100px rgba(99, 102, 241, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-gradient-to-b from-slate-900/98 to-transparent backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
                <svg className="w-6 h-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-white">Nouvelle Tâche</h2>
                <p className="text-sm text-slate-400">Créez une nouvelle tâche pour un agent autonome</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:border-white/30 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Sélection du type d'agent */}
          <div>
            <label className="text-sm font-semibold text-slate-300 mb-3 block">
              Sélectionnez un type d'agent
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {agentTypes.map((agent) => {
                const isSelected = selectedType === agent.type;
                return (
                  <button
                    key={agent.type}
                    type="button"
                    onClick={() => setSelectedType(agent.type)}
                    className={`relative p-5 rounded-xl border transition-all text-left group overflow-hidden ${
                      isSelected
                        ? `border-${agent.color}-500/50 bg-${agent.color}-500/10 shadow-lg shadow-${agent.color}-500/20`
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    {/* Gradient background when selected */}
                    {isSelected && (
                      <div className={`absolute inset-0 bg-gradient-to-br ${agent.gradient} opacity-10`} />
                    )}
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">{agent.icon}</span>
                        <div className="flex-1">
                          <div className={`font-semibold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                            {agent.name}
                          </div>
                        </div>
                        {isSelected && (
                          <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${agent.gradient} flex items-center justify-center`}>
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-2">{agent.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description de la tâche */}
          <div>
            <label htmlFor="description" className="text-sm font-semibold text-slate-300 mb-2 block">
              Description de la tâche
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez la tâche que vous souhaitez que l'agent exécute..."
              rows={5}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
              required
            />
            <div className="text-xs text-slate-500 mt-2">
              {description.length} caractère(s)
            </div>
          </div>

          {/* Erreur */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <div className="flex items-center gap-2 text-red-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:border-white/30 hover:text-white hover:bg-white/10 transition-all font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading || !description.trim() || !selectedType}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Création...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Créer la Tâche
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

