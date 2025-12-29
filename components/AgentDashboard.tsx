/**
 * Dashboard complet pour visualiser et gérer les agents autonomes
 * Avec filtres, recherche, graphiques et historique
 */

import React, { useState, useMemo } from 'react';
import { useAgentManager } from '../hooks/useAgentManager';
import { AgentType, Task, TaskStatus } from '../types/agent';

interface AgentDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskClick?: (taskId: string) => void;
  onCreateTask?: () => void;
}

type FilterStatus = TaskStatus | 'all';
type FilterType = AgentType | 'all';
type SortOption = 'newest' | 'oldest' | 'status' | 'duration';

export default function AgentDashboard({ 
  isOpen, 
  onClose, 
  onTaskClick,
  onCreateTask 
}: AgentDashboardProps) {
  const { tasks, getStats, getReport, deleteTask } = useAgentManager();
  const stats = getStats();
  
  // États pour les filtres et la recherche
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Filtrer et trier les tâches (doit être avant le return conditionnel)
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.description.toLowerCase().includes(query) ||
        task.id.toLowerCase().includes(query)
      );
    }

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    // Filtre par type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(task => task.type === typeFilter);
    }

    // Trier
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'newest':
          return (b.createdAt || 0) - (a.createdAt || 0);
        case 'oldest':
          return (a.createdAt || 0) - (b.createdAt || 0);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'duration':
          const aDuration = (a.completedAt || Date.now()) - (a.startedAt || a.createdAt || Date.now());
          const bDuration = (b.completedAt || Date.now()) - (b.startedAt || b.createdAt || Date.now());
          return bDuration - aDuration;
        default:
          return 0;
      }
    });

    return filtered;
  }, [tasks, searchQuery, statusFilter, typeFilter, sortOption]);

  // Tous les hooks doivent être appelés avant le return conditionnel
  if (!isOpen) {
    return null;
  }

  const agentTypes: { type: AgentType; name: string; icon: string; color: string; gradient: string }[] = [
    { type: 'research', name: 'Agent de Recherche', icon: '🔍', color: 'blue', gradient: 'from-blue-500/20 to-cyan-500/20' },
    { type: 'analysis', name: 'Agent d\'Analyse', icon: '📊', color: 'purple', gradient: 'from-purple-500/20 to-pink-500/20' },
    { type: 'creation', name: 'Agent de Création', icon: '✨', color: 'green', gradient: 'from-emerald-500/20 to-teal-500/20' },
  ];

  const statusOptions: { value: FilterStatus; label: string; color: string }[] = [
    { value: 'all', label: 'Tous', color: 'slate' },
    { value: 'pending', label: 'En attente', color: 'amber' },
    { value: 'in_progress', label: 'En cours', color: 'blue' },
    { value: 'retrying', label: 'Retry', color: 'blue' },
    { value: 'completed', label: 'Complétées', color: 'emerald' },
    { value: 'failed', label: 'Échouées', color: 'red' },
    { value: 'cancelled', label: 'Annulées', color: 'slate' },
  ];

  const handleDeleteTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      deleteTask(taskId);
    }
  };

  const handleExportReport = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const report = getReport(taskId);
    if (report) {
      const reportText = JSON.stringify(report, null, 2);
      const blob = new Blob([reportText], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-${taskId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    const colors: Record<TaskStatus, string> = {
      pending: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      in_progress: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      retrying: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      completed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      failed: 'text-red-400 bg-red-500/10 border-red-500/30',
      cancelled: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
    };
    return colors[status] || colors.pending;
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const getTaskDuration = (task: Task) => {
    if (task.completedAt && task.startedAt) {
      return task.completedAt - task.startedAt;
    }
    if (task.startedAt) {
      return Date.now() - task.startedAt;
    }
    return 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-xl transition-all duration-500"
        onClick={onClose}
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.1), transparent 70%)'
        }}
      />

      {/* Modal */}
      <div 
        className="relative w-full max-w-7xl max-h-[95vh] overflow-hidden glass-intense rounded-3xl shadow-2xl flex flex-col animate-in"
        style={{
          boxShadow: '0 25px 100px rgba(0, 0, 0, 0.5), 0 0 100px rgba(99, 102, 241, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-b from-slate-900/98 to-transparent backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
              <svg className="w-6 h-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.393 1.393c.412.412.412 1.08 0 1.492l-1.57 1.57a1.5 1.5 0 01-1.492 0L5 14.5" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-white">Agents Autonomes</h2>
              <p className="text-sm text-slate-400">Gestion et suivi des tâches automatisées</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {onCreateTask && (
              <button
                onClick={onCreateTask}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg shadow-indigo-500/25"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nouvelle Tâche
                </span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:border-white/30 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 space-y-6">
            {/* Statistiques globales */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="glass-intense rounded-xl p-4 border border-white/5 hover:border-white/20 transition-all group">
                <div className="text-sm text-slate-400 mb-1">Total</div>
                <div className="text-3xl font-bold text-white group-hover:scale-110 transition-transform">{stats.totalTasks}</div>
              </div>
              <div className="glass-intense rounded-xl p-4 border border-amber-500/20 hover:border-amber-500/40 transition-all group">
                <div className="text-sm text-slate-400 mb-1">En attente</div>
                <div className="text-3xl font-bold text-amber-400 group-hover:scale-110 transition-transform">{stats.pendingTasks}</div>
              </div>
              <div className="glass-intense rounded-xl p-4 border border-blue-500/20 hover:border-blue-500/40 transition-all group">
                <div className="text-sm text-slate-400 mb-1">En cours</div>
                <div className="text-3xl font-bold text-blue-400 group-hover:scale-110 transition-transform">{stats.inProgressTasks}</div>
              </div>
              <div className="glass-intense rounded-xl p-4 border border-emerald-500/20 hover:border-emerald-500/40 transition-all group">
                <div className="text-sm text-slate-400 mb-1">Complétées</div>
                <div className="text-3xl font-bold text-emerald-400 group-hover:scale-110 transition-transform">{stats.completedTasks}</div>
              </div>
              <div className="glass-intense rounded-xl p-4 border border-red-500/20 hover:border-red-500/40 transition-all group">
                <div className="text-sm text-slate-400 mb-1">Échouées</div>
                <div className="text-3xl font-bold text-red-400 group-hover:scale-110 transition-transform">{stats.failedTasks}</div>
              </div>
            </div>

            {/* Agents disponibles */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Agents Disponibles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {agentTypes.map((agent) => {
                  const agentTasks = tasks.filter(t => t.type === agent.type);
                  const agentInProgress = agentTasks.filter(t => t.status === 'in_progress' || t.status === 'retrying').length;
                  const agentCompleted = agentTasks.filter(t => t.status === 'completed').length;
                  
                  return (
                    <div
                      key={agent.type}
                      className={`glass-intense rounded-xl p-5 border border-white/5 hover:border-white/20 transition-all cursor-pointer group relative overflow-hidden bg-gradient-to-br ${agent.gradient}`}
                      onClick={() => setTypeFilter(agent.type)}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-4xl">{agent.icon}</span>
                          <div className="flex-1">
                            <div className="font-semibold text-white">{agent.name}</div>
                            <div className="text-sm text-slate-400">{agentTasks.length} tâche(s)</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          {agentInProgress > 0 && (
                            <div className="text-blue-400 flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                              {agentInProgress} en cours
                            </div>
                          )}
                          {agentCompleted > 0 && (
                            <div className="text-emerald-400">
                              {agentCompleted} complétée(s)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Filtres et recherche */}
            <div className="glass-intense rounded-xl p-4 border border-white/5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Recherche */}
                <div className="md:col-span-2">
                  <label className="text-xs text-slate-400 mb-2 block">Recherche</label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher une tâche..."
                      className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* Filtre par statut */}
                <div>
                  <label className="text-xs text-slate-400 mb-2 block">Statut</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Tri */}
                <div>
                  <label className="text-xs text-slate-400 mb-2 block">Trier par</label>
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  >
                    <option value="newest">Plus récent</option>
                    <option value="oldest">Plus ancien</option>
                    <option value="status">Statut</option>
                    <option value="duration">Durée</option>
                  </select>
                </div>
              </div>

              {/* Filtres actifs */}
              {(statusFilter !== 'all' || typeFilter !== 'all' || searchQuery) && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-400">Filtres actifs:</span>
                  {statusFilter !== 'all' && (
                    <button
                      onClick={() => setStatusFilter('all')}
                      className="px-2 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-xs border border-blue-500/30 hover:bg-blue-500/30 transition-all"
                    >
                      {statusOptions.find(o => o.value === statusFilter)?.label} ×
                    </button>
                  )}
                  {typeFilter !== 'all' && (
                    <button
                      onClick={() => setTypeFilter('all')}
                      className="px-2 py-1 rounded-lg bg-purple-500/20 text-purple-400 text-xs border border-purple-500/30 hover:bg-purple-500/30 transition-all"
                    >
                      {agentTypes.find(a => a.type === typeFilter)?.name} ×
                    </button>
                  )}
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="px-2 py-1 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs border border-indigo-500/30 hover:bg-indigo-500/30 transition-all"
                    >
                      "{searchQuery}" ×
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Liste des tâches */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Tâches ({filteredTasks.length})
                </h3>
              </div>

              {filteredTasks.length === 0 ? (
                <div className="text-center text-slate-400 py-12 glass-intense rounded-xl border border-white/5">
                  <div className="text-5xl mb-4">🤖</div>
                  <div className="text-lg font-medium mb-2">Aucune tâche trouvée</div>
                  <div className="text-sm text-slate-500">
                    {tasks.length === 0 
                      ? "Créez votre première tâche via les fonctions d'agents autonomes"
                      : "Aucune tâche ne correspond aux filtres sélectionnés"}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTasks.map((task) => {
                    const report = task.status === 'completed' ? getReport(task.id) : null;
                    const completedSteps = task.steps.filter(s => s.status === 'completed').length;
                    const progress = task.steps.length > 0 ? (completedSteps / task.steps.length) * 100 : 0;
                    const duration = getTaskDuration(task);
                    const agentInfo = agentTypes.find(a => a.type === task.type);

                    return (
                      <div
                        key={task.id}
                        onClick={() => {
                          setSelectedTaskId(task.id);
                          onTaskClick?.(task.id);
                        }}
                        className={`glass-intense rounded-xl p-4 border transition-all cursor-pointer group hover:border-white/30 ${
                          selectedTaskId === task.id ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-white/5'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-2xl">{agentInfo?.icon || '🤖'}</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-white truncate mb-1">
                                  {task.description}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-400">
                                  <span className={`px-2 py-0.5 rounded border ${getStatusColor(task.status)}`}>
                                    {task.status}
                                  </span>
                                  <span>{completedSteps}/{task.steps.length} étapes</span>
                                  <span>•</span>
                                  <span>{formatDuration(duration)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Barre de progression */}
                            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden mt-3">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  task.status === 'completed' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                                  task.status === 'failed' ? 'bg-gradient-to-r from-red-500 to-rose-500' :
                                  'bg-gradient-to-r from-blue-500 to-indigo-500'
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>

                            {/* Résultats prévisualisés */}
                            {task.result && task.status === 'completed' && (
                              <div className="mt-3 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                <div className="text-xs text-blue-300 font-semibold mb-1">Résultats:</div>
                                {task.result.summary && (
                                  <div className="text-xs text-slate-300 line-clamp-2">
                                    {task.result.summary}
                                  </div>
                                )}
                                {task.result.finalContent && (
                                  <div className="text-xs text-slate-300 line-clamp-2">
                                    {task.result.finalContent.substring(0, 100)}...
                                  </div>
                                )}
                                {!task.result.summary && !task.result.finalContent && (
                                  <div className="text-xs text-slate-400">
                                    {task.result.searchResults?.length ? `${task.result.searchResults.length} source(s) trouvée(s)` :
                                     task.result.extractedData?.length ? `${task.result.extractedData.length} donnée(s) extraite(s)` :
                                     task.result.content?.length ? `${task.result.content.length} section(s) créée(s)` :
                                     'Résultats disponibles'}
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Conclusion prévisualisée */}
                            {report?.conclusion && task.status === 'completed' && (
                              <div className="mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <div className="text-xs text-emerald-300 font-semibold mb-1">Conclusion:</div>
                                <div className="text-xs text-slate-300 line-clamp-2">
                                  {report.conclusion.split('\n').find(line => line.trim() && !line.startsWith('#') && !line.startsWith('**'))?.substring(0, 100) || 'Conclusion disponible...'}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {report && (
                              <button
                                onClick={(e) => handleExportReport(task.id, e)}
                                className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:border-white/30 hover:text-white hover:bg-white/10 transition-all"
                                title="Exporter le rapport"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={(e) => handleDeleteTask(task.id, e)}
                              className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all"
                              title="Supprimer"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
