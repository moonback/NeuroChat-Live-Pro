/**
 * Visualiseur de tâches en cours avec progression et logs
 */

import React, { useEffect, useState } from 'react';
import { useAgentManager } from '../hooks/useAgentManager';
import { Task, AgentReport, LogEntry } from '../types/agent';

interface AgentTaskViewerProps {
  isOpen: boolean;
  onClose: () => void;
  taskId?: string;
}

export default function AgentTaskViewer({ isOpen, onClose, taskId }: AgentTaskViewerProps) {
  const { tasks, getReport, cancelTask, refreshTasks } = useAgentManager();
  const [report, setReport] = useState<AgentReport | null>(null);

  // Trouver la tâche dans la liste des tâches
  const task = taskId ? tasks.find(t => t.id === taskId) || null : null;

  useEffect(() => {
    if (isOpen && taskId) {
      const currentReport = getReport(taskId);
      setReport(currentReport);

      // Polling pour mettre à jour la tâche et le rapport
      const interval = setInterval(() => {
        refreshTasks();
        const updatedReport = getReport(taskId);
        setReport(updatedReport);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isOpen, taskId, getReport, refreshTasks]);

  if (!isOpen || !task) {
    return null;
  }

  const handleCancel = () => {
    if (task && (task.status === 'in_progress' || task.status === 'retrying' || task.status === 'pending')) {
      cancelTask(task.id);
      onClose();
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
  const progress = task.steps.length > 0 ? (completedSteps / task.steps.length) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-slate-900/98 via-slate-900/95 to-slate-900 rounded-2xl border border-white/20 shadow-2xl m-4">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-b from-slate-900/98 to-transparent backdrop-blur-xl">
          <div className="flex-1">
            <h2 className="text-xl font-display font-bold text-white mb-2">Détails de la Tâche</h2>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${statusColors[task.status] || statusColors.pending}`}>
                {task.status}
              </span>
              {task.type && (
                <span className="text-xs text-slate-400">
                  {task.type === 'research' ? '🔍 Recherche' : task.type === 'analysis' ? '📊 Analyse' : '✨ Création'}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(task.status === 'in_progress' || task.status === 'retrying' || task.status === 'pending') && (
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all text-sm font-medium"
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-slate-400 mb-2">Description</h3>
            <p className="text-white">{task.description}</p>
          </div>

          {/* Progression */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-400">Progression</h3>
              <span className="text-sm text-white">
                {completedSteps}/{task.steps.length} étapes complétées
              </span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Étapes */}
          <div>
            <h3 className="text-sm font-semibold text-slate-400 mb-3">Étapes</h3>
            <div className="space-y-2">
              {task.steps.map((step, index) => {
                const stepStatusColors: Record<string, string> = {
                  pending: 'border-slate-500/30 bg-slate-500/5',
                  in_progress: 'border-blue-500/30 bg-blue-500/10',
                  completed: 'border-emerald-500/30 bg-emerald-500/10',
                  failed: 'border-red-500/30 bg-red-500/10',
                };

                return (
                  <div
                    key={step.id}
                    className={`rounded-lg p-3 border ${stepStatusColors[step.status] || stepStatusColors.pending}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-slate-400">Étape {index + 1}</span>
                          <span className={`text-xs font-semibold ${
                            step.status === 'completed' ? 'text-emerald-400' :
                            step.status === 'failed' ? 'text-red-400' :
                            step.status === 'in_progress' ? 'text-blue-400' :
                            'text-slate-400'
                          }`}>
                            {step.status}
                          </span>
                        </div>
                        <div className="text-sm text-white font-medium">{step.name}</div>
                        {step.description && (
                          <div className="text-xs text-slate-400 mt-1">{step.description}</div>
                        )}
                        {step.error && (
                          <div className="text-xs text-red-400 mt-2">Erreur: {step.error}</div>
                        )}
                        {step.duration && (
                          <div className="text-xs text-slate-500 mt-1">
                            Durée: {(step.duration / 1000).toFixed(2)}s
                          </div>
                        )}
                      </div>
                      {step.status === 'completed' && (
                        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {step.status === 'failed' && (
                        <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Conclusion (si disponible) */}
          {report && report.conclusion && task.status === 'completed' && (
            <div>
              <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Conclusion
              </h3>
              <div className="glass-intense rounded-lg p-5 border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 space-y-3">
                <div className="prose prose-invert prose-sm max-w-none">
                  <div className="text-white whitespace-pre-wrap leading-relaxed">
                    {report.conclusion.split('\n').map((line, i) => {
                      // Formater les titres
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
                      // Formater les listes
                      if (line.startsWith('- ')) {
                        return (
                          <div key={i} className="ml-4 text-slate-200">
                            {line}
                          </div>
                        );
                      }
                      // Formater le texte en gras
                      const boldText = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-emerald-200 font-semibold">$1</strong>');
                      // Formater les emojis
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
            </div>
          )}

          {/* Rapport (si disponible) */}
          {report && (
            <div>
              <h3 className="text-sm font-semibold text-slate-400 mb-3">Rapport d'Exécution</h3>
              <div className="glass-intense rounded-lg p-4 border border-white/5 space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Durée totale:</span>
                    <span className="text-white ml-2">
                      {report.duration ? `${(report.duration / 1000).toFixed(2)}s` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Taux de succès:</span>
                    <span className="text-white ml-2">
                      {Math.round(report.metrics.successRate * 100)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Retries:</span>
                    <span className="text-white ml-2">{report.retryCount}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Étapes échouées:</span>
                    <span className="text-white ml-2">{report.stepsFailed}</span>
                  </div>
                </div>
                {report.recommendations && report.recommendations.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-semibold text-slate-400 mb-2">Recommandations:</div>
                    <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                      {report.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Logs (si disponibles) */}
          {report && report.logs && report.logs.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-400 mb-3">Logs</h3>
              <div className="glass-intense rounded-lg p-4 border border-white/5 max-h-64 overflow-y-auto">
                <div className="space-y-1 font-mono text-xs">
                  {report.logs.map((log, i) => {
                    const logColors: Record<string, string> = {
                      info: 'text-blue-400',
                      success: 'text-emerald-400',
                      warn: 'text-amber-400',
                      error: 'text-red-400',
                    };

                    return (
                      <div key={i} className={logColors[log.level] || 'text-slate-400'}>
                        <span className="text-slate-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="ml-2">[{log.level.toUpperCase()}]</span>
                        <span className="ml-2">{log.message}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Erreur (si présente) */}
          {task.error && (
            <div className="rounded-lg p-4 bg-red-500/10 border border-red-500/30">
              <div className="text-sm font-semibold text-red-400 mb-1">Erreur</div>
              <div className="text-sm text-red-300">{task.error}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

