/**
 * Interface pour visualiser les agents disponibles et statistiques
 */

import React from 'react';
import { useAgentManager } from '../hooks/useAgentManager';
import { AgentType } from '../types/agent';

interface AgentDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AgentDashboard({ isOpen, onClose }: AgentDashboardProps) {
  const { tasks, getStats, getReport } = useAgentManager();
  const stats = getStats();

  if (!isOpen) {
    return null;
  }

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress' || t.status === 'retrying');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const failedTasks = tasks.filter(t => t.status === 'failed');

  const agentTypes: { type: AgentType; name: string; icon: string; color: string }[] = [
    { type: 'research', name: 'Agent de Recherche', icon: '🔍', color: 'blue' },
    { type: 'analysis', name: 'Agent d\'Analyse', icon: '📊', color: 'purple' },
    { type: 'creation', name: 'Agent de Création', icon: '✨', color: 'green' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-slate-900/98 via-slate-900/95 to-slate-900 rounded-2xl border border-white/20 shadow-2xl m-4">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-b from-slate-900/98 to-transparent backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
              <svg className="w-6 h-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.393 1.393c.412.412.412 1.08 0 1.492l-1.57 1.57a1.5 1.5 0 01-1.492 0L5 14.5" />
              </svg>
            </div>
            <h2 className="text-2xl font-display font-bold text-white">Agents Autonomes</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:border-white/30 hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Statistiques globales */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="glass-intense rounded-xl p-4 border border-white/5">
              <div className="text-sm text-slate-400 mb-1">Total</div>
              <div className="text-2xl font-bold text-white">{stats.totalTasks}</div>
            </div>
            <div className="glass-intense rounded-xl p-4 border border-white/5">
              <div className="text-sm text-slate-400 mb-1">En attente</div>
              <div className="text-2xl font-bold text-amber-400">{stats.pendingTasks}</div>
            </div>
            <div className="glass-intense rounded-xl p-4 border border-white/5">
              <div className="text-sm text-slate-400 mb-1">En cours</div>
              <div className="text-2xl font-bold text-blue-400">{stats.inProgressTasks}</div>
            </div>
            <div className="glass-intense rounded-xl p-4 border border-white/5">
              <div className="text-sm text-slate-400 mb-1">Complétées</div>
              <div className="text-2xl font-bold text-emerald-400">{stats.completedTasks}</div>
            </div>
            <div className="glass-intense rounded-xl p-4 border border-white/5">
              <div className="text-sm text-slate-400 mb-1">Échouées</div>
              <div className="text-2xl font-bold text-red-400">{stats.failedTasks}</div>
            </div>
          </div>

          {/* Agents disponibles */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Agents Disponibles</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {agentTypes.map((agent) => {
                const agentTasks = tasks.filter(t => t.type === agent.type);
                const agentInProgress = agentTasks.filter(t => t.status === 'in_progress' || t.status === 'retrying').length;
                
                return (
                  <div
                    key={agent.type}
                    className="glass-intense rounded-xl p-4 border border-white/5 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{agent.icon}</span>
                      <div>
                        <div className="font-semibold text-white">{agent.name}</div>
                        <div className="text-sm text-slate-400">{agentTasks.length} tâche(s)</div>
                      </div>
                    </div>
                    {agentInProgress > 0 && (
                      <div className="text-sm text-blue-400">
                        {agentInProgress} en cours
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tâches récentes */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Tâches Récentes</h3>
            <div className="space-y-2">
              {tasks.length === 0 ? (
                <div className="text-center text-slate-400 py-8">
                  <div className="text-4xl mb-2">🤖</div>
                  <div className="text-sm">Aucune tâche pour le moment</div>
                  <div className="text-xs text-slate-500 mt-2">
                    Créez une tâche via les fonctions d'agents autonomes
                  </div>
                </div>
              ) : (
                tasks.slice(0, 5).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).map((task) => {
                  const statusColors: Record<string, string> = {
                    pending: 'text-amber-400',
                    in_progress: 'text-blue-400',
                    retrying: 'text-blue-400',
                    completed: 'text-emerald-400',
                    failed: 'text-red-400',
                    cancelled: 'text-slate-400',
                  };
                  
                  const report = task.status === 'completed' ? getReport(task.id) : null;

                  return (
                    <div
                      key={task.id}
                      className="glass-intense rounded-lg p-3 border border-white/5 hover:border-white/20 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white font-medium truncate mb-1">{task.description}</div>
                          <div className="text-xs text-slate-400 mb-2">
                            {task.steps.filter(s => s.status === 'completed').length}/{task.steps.length} étapes
                          </div>
                          {report?.conclusion && task.status === 'completed' && (
                            <div className="text-xs text-slate-300 line-clamp-2 mt-2 p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                              {report.conclusion.split('\n').find(line => line.trim() && !line.startsWith('#') && !line.startsWith('**'))?.substring(0, 100) || 'Conclusion disponible...'}
                            </div>
                          )}
                        </div>
                        <div className={`text-sm font-semibold flex-shrink-0 ${statusColors[task.status] || 'text-slate-400'}`}>
                          {task.status}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

