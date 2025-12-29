/**
 * Visualiseur de tâches amélioré avec timeline, graphiques et métriques détaillées
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useAgentManager } from '../hooks/useAgentManager';
import { Task, AgentReport } from '../types/agent';

interface AgentTaskViewerProps {
  isOpen: boolean;
  onClose: () => void;
  taskId?: string;
}

export default function AgentTaskViewer({ isOpen, onClose, taskId }: AgentTaskViewerProps) {
  const { tasks, getReport, cancelTask, refreshTasks } = useAgentManager();
  const [report, setReport] = useState<AgentReport | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'steps' | 'logs' | 'metrics'>('overview');

  const task = taskId ? tasks.find(t => t.id === taskId) || null : null;

  useEffect(() => {
    if (isOpen && taskId) {
      const currentReport = getReport(taskId);
      setReport(currentReport);

      const interval = setInterval(() => {
        refreshTasks();
        const updatedReport = getReport(taskId);
        setReport(updatedReport);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isOpen, taskId, getReport, refreshTasks]);

  // Timeline des étapes (doit être avant le return conditionnel)
  const timelineSteps = useMemo(() => {
    if (!task) return [];
    return task.steps.map((step, index) => {
      const stepDuration = step.duration || 0;
      const stepProgress = step.status === 'completed' ? 100 : step.status === 'in_progress' ? 50 : 0;
      
      return {
        ...step,
        index,
        duration: stepDuration,
        progress: stepProgress,
      };
    });
  }, [task]);

  // Tous les hooks doivent être appelés avant le return conditionnel
  if (!isOpen || !task) {
    return null;
  }

  const handleCancel = () => {
    if (task && (task.status === 'in_progress' || task.status === 'retrying' || task.status === 'pending')) {
      cancelTask(task.id);
      onClose();
    }
  };

  const handleExportReport = () => {
    if (report) {
      const reportText = JSON.stringify(report, null, 2);
      const blob = new Blob([reportText], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-${task.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    retrying: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
    cancelled: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };

  const completedSteps = task.steps.filter(s => s.status === 'completed').length;
  const failedSteps = task.steps.filter(s => s.status === 'failed').length;
  const progress = task.steps.length > 0 ? (completedSteps / task.steps.length) * 100 : 0;

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const getTaskDuration = () => {
    if (task.completedAt && task.startedAt) {
      return task.completedAt - task.startedAt;
    }
    if (task.startedAt) {
      return Date.now() - task.startedAt;
    }
    return 0;
  };

  const getAgentInfo = () => {
    const agents = {
      research: { icon: '🔍', name: 'Agent de Recherche', color: 'blue' },
      analysis: { icon: '📊', name: 'Agent d\'Analyse', color: 'purple' },
      creation: { icon: '✨', name: 'Agent de Création', color: 'green' },
    };
    return agents[task.type] || { icon: '🤖', name: 'Agent', color: 'slate' };
  };

  const agentInfo = getAgentInfo();

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
        className="relative w-full max-w-5xl max-h-[95vh] overflow-hidden glass-intense rounded-3xl shadow-2xl flex flex-col animate-in"
        style={{
          boxShadow: '0 25px 100px rgba(0, 0, 0, 0.5), 0 0 100px rgba(99, 102, 241, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-b from-slate-900/98 to-transparent backdrop-blur-xl">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{agentInfo.icon}</span>
              <div className="flex-1">
                <h2 className="text-2xl font-display font-bold text-white">{task.description}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${statusColors[task.status] || statusColors.pending}`}>
                    {task.status}
                  </span>
                  <span className="text-xs text-slate-400">{agentInfo.name}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {report && (
              <button
                onClick={handleExportReport}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:border-white/30 hover:text-white hover:bg-white/10 transition-all duration-200"
                title="Exporter le rapport"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            )}
            {(task.status === 'in_progress' || task.status === 'retrying' || task.status === 'pending') && (
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all text-sm font-medium"
              >
                Annuler
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

        {/* Tabs */}
        <div className="border-b border-white/10 px-6">
          <div className="flex gap-1">
            {(['overview', 'steps', 'logs', 'metrics'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium transition-all relative ${
                  activeTab === tab
                    ? 'text-indigo-400'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                {tab === 'overview' && 'Vue d\'ensemble'}
                {tab === 'steps' && 'Étapes'}
                {tab === 'logs' && 'Logs'}
                {tab === 'metrics' && 'Métriques'}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {/* Vue d'ensemble */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Progression globale */}
              <div className="glass-intense rounded-xl p-6 border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Progression</h3>
                  <span className="text-2xl font-bold text-indigo-400">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden mb-4">
                  <div
                    className={`h-full transition-all duration-500 ${
                      task.status === 'completed' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                      task.status === 'failed' ? 'bg-gradient-to-r from-red-500 to-rose-500' :
                      'bg-gradient-to-r from-blue-500 to-indigo-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-emerald-400">{completedSteps}</div>
                    <div className="text-xs text-slate-400">Complétées</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-400">{failedSteps}</div>
                    <div className="text-xs text-slate-400">Échouées</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-400">{task.steps.length}</div>
                    <div className="text-xs text-slate-400">Total</div>
                  </div>
                </div>
              </div>

              {/* Métriques rapides */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-intense rounded-xl p-4 border border-white/5">
                  <div className="text-xs text-slate-400 mb-1">Durée</div>
                  <div className="text-lg font-bold text-white">{formatDuration(getTaskDuration())}</div>
                </div>
                <div className="glass-intense rounded-xl p-4 border border-white/5">
                  <div className="text-xs text-slate-400 mb-1">Taux de succès</div>
                  <div className="text-lg font-bold text-emerald-400">
                    {report ? `${Math.round(report.metrics.successRate * 100)}%` : 'N/A'}
                  </div>
                </div>
                <div className="glass-intense rounded-xl p-4 border border-white/5">
                  <div className="text-xs text-slate-400 mb-1">Retries</div>
                  <div className="text-lg font-bold text-amber-400">{task.retryCount}</div>
                </div>
                <div className="glass-intense rounded-xl p-4 border border-white/5">
                  <div className="text-xs text-slate-400 mb-1">Créée le</div>
                  <div className="text-xs font-medium text-white">
                    {new Date(task.createdAt).toLocaleString('fr-FR')}
                  </div>
                </div>
              </div>

              {/* Conclusion */}
              {report && report.conclusion && task.status === 'completed' && (
                <div className="glass-intense rounded-xl p-6 border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5">
                  <h3 className="text-lg font-semibold text-emerald-300 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Conclusion
                  </h3>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <div className="text-white whitespace-pre-wrap leading-relaxed">
                      {report.conclusion.split('\n').map((line, i) => {
                        if (line.startsWith('## ')) {
                          return (
                            <h2 key={i} className="text-lg font-bold text-emerald-300 mt-4 mb-2 first:mt-0">
                              {line.replace('## ', '')}
                            </h2>
                          );
                        }
                        if (line.startsWith('### ')) {
                          return (
                            <h3 key={i} className="text-base font-semibold text-emerald-200 mt-3 mb-2">
                              {line.replace('### ', '')}
                            </h3>
                          );
                        }
                        if (line.startsWith('- ')) {
                          return (
                            <div key={i} className="ml-4 text-slate-200">
                              {line}
                            </div>
                          );
                        }
                        const boldText = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-emerald-200 font-semibold">$1</strong>');
                        const emojiText = boldText.replace(/✅/g, '<span class="text-emerald-400">✅</span>')
                                                  .replace(/❌/g, '<span class="text-red-400">❌</span>')
                                                  .replace(/⚠️/g, '<span class="text-amber-400">⚠️</span>');
                        
                        if (line.trim() === '') {
                          return <br key={i} />;
                        }
                        
                        return (
                          <p key={i} className="mb-2 last:mb-0" dangerouslySetInnerHTML={{ __html: emojiText }} />
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Recommandations */}
              {report && report.recommendations && report.recommendations.length > 0 && (
                <div className="glass-intense rounded-xl p-6 border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-indigo-500/5">
                  <h3 className="text-lg font-semibold text-blue-300 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Recommandations
                  </h3>
                  <ul className="space-y-2">
                    {report.recommendations.map((rec, i) => (
                      <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Étapes avec timeline */}
          {activeTab === 'steps' && (
            <div className="space-y-4">
              <div className="relative">
                {/* Ligne verticale de la timeline */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-white/10" />
                
                {timelineSteps.map((step, index) => {
                  const stepStatusColors = {
                    pending: 'border-slate-500/30 bg-slate-500/5',
                    in_progress: 'border-blue-500/50 bg-blue-500/10',
                    completed: 'border-emerald-500/50 bg-emerald-500/10',
                    failed: 'border-red-500/50 bg-red-500/10',
                  };

                  return (
                    <div key={step.id} className="relative flex items-start gap-4 mb-6">
                      {/* Point de la timeline */}
                      <div className={`relative z-10 w-12 h-12 rounded-full border-2 flex items-center justify-center ${
                        step.status === 'completed' ? 'bg-emerald-500/20 border-emerald-500' :
                        step.status === 'failed' ? 'bg-red-500/20 border-red-500' :
                        step.status === 'in_progress' ? 'bg-blue-500/20 border-blue-500 animate-pulse' :
                        'bg-slate-500/20 border-slate-500'
                      }`}>
                        {step.status === 'completed' ? (
                          <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : step.status === 'failed' ? (
                          <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        ) : step.status === 'in_progress' ? (
                          <svg className="w-6 h-6 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        ) : (
                          <div className="w-3 h-3 rounded-full bg-slate-400" />
                        )}
                      </div>

                      {/* Contenu de l'étape */}
                      <div className={`flex-1 rounded-xl p-4 border ${stepStatusColors[step.status] || stepStatusColors.pending}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-slate-400">Étape {index + 1}</span>
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                step.status === 'completed' ? 'text-emerald-400 bg-emerald-500/20' :
                                step.status === 'failed' ? 'text-red-400 bg-red-500/20' :
                                step.status === 'in_progress' ? 'text-blue-400 bg-blue-500/20' :
                                'text-slate-400 bg-slate-500/20'
                              }`}>
                                {step.status}
                              </span>
                            </div>
                            <div className="text-sm font-semibold text-white mb-1">{step.name}</div>
                            {step.description && (
                              <div className="text-xs text-slate-400">{step.description}</div>
                            )}
                          </div>
                        </div>
                        
                        {step.error && (
                          <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                            <div className="text-xs text-red-400 font-medium">Erreur:</div>
                            <div className="text-xs text-red-300 mt-1">{step.error}</div>
                          </div>
                        )}
                        
                        {step.duration && (
                          <div className="mt-2 text-xs text-slate-500">
                            Durée: {formatDuration(step.duration)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Logs */}
          {activeTab === 'logs' && (
            <div className="glass-intense rounded-xl p-4 border border-white/5 max-h-96 overflow-y-auto">
              {report && report.logs && report.logs.length > 0 ? (
                <div className="space-y-1 font-mono text-xs">
                  {report.logs.map((log, i) => {
                    const logColors: Record<string, string> = {
                      info: 'text-blue-400',
                      success: 'text-emerald-400',
                      warn: 'text-amber-400',
                      error: 'text-red-400',
                    };

                    return (
                      <div key={i} className={`${logColors[log.level] || 'text-slate-400'} py-1`}>
                        <span className="text-slate-500">
                          {new Date(log.timestamp).toLocaleTimeString('fr-FR')}
                        </span>
                        <span className="ml-2 px-2 py-0.5 rounded bg-white/5">
                          [{log.level.toUpperCase()}]
                        </span>
                        <span className="ml-2">{log.message}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-slate-400 py-8">
                  <div className="text-4xl mb-2">📝</div>
                  <div className="text-sm">Aucun log disponible</div>
                </div>
              )}
            </div>
          )}

          {/* Métriques */}
          {activeTab === 'metrics' && report && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-intense rounded-xl p-6 border border-white/5">
                  <div className="text-sm text-slate-400 mb-2">Durée totale</div>
                  <div className="text-3xl font-bold text-white">{formatDuration(report.duration || 0)}</div>
                </div>
                <div className="glass-intense rounded-xl p-6 border border-white/5">
                  <div className="text-sm text-slate-400 mb-2">Durée moyenne par étape</div>
                  <div className="text-3xl font-bold text-white">
                    {formatDuration(report.metrics.averageStepDuration)}
                  </div>
                </div>
                <div className="glass-intense rounded-xl p-6 border border-white/5">
                  <div className="text-sm text-slate-400 mb-2">Taux de succès</div>
                  <div className="text-3xl font-bold text-emerald-400">
                    {Math.round(report.metrics.successRate * 100)}%
                  </div>
                </div>
                <div className="glass-intense rounded-xl p-6 border border-white/5">
                  <div className="text-sm text-slate-400 mb-2">Taux de retry</div>
                  <div className="text-3xl font-bold text-amber-400">
                    {Math.round(report.metrics.retryRate * 100)}%
                  </div>
                </div>
              </div>

              {/* Graphique de progression (simplifié) */}
              <div className="glass-intense rounded-xl p-6 border border-white/5">
                <h3 className="text-lg font-semibold text-white mb-4">Répartition des étapes</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-300">Complétées</span>
                      <span className="text-sm font-semibold text-emerald-400">{completedSteps}</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                        style={{ width: `${(completedSteps / task.steps.length) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-300">Échouées</span>
                      <span className="text-sm font-semibold text-red-400">{failedSteps}</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 to-rose-500 rounded-full transition-all"
                        style={{ width: `${(failedSteps / task.steps.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
