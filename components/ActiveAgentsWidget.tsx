/**
 * Widget flottant amélioré pour afficher les agents actifs avec animations
 */

import React, { useState, useEffect } from 'react';
import { useAgentManager } from '../hooks/useAgentManager';
import { Task } from '../types/agent';

interface ActiveAgentsWidgetProps {
  onTaskClick?: (taskId: string) => void;
  onOpenDashboard?: () => void;
}

export default function ActiveAgentsWidget({ onTaskClick, onOpenDashboard }: ActiveAgentsWidgetProps) {
  const { tasks, getReport } = useAgentManager();
  const [isMinimized, setIsMinimized] = useState(false);
  const [notifications, setNotifications] = useState<Set<string>>(new Set());
  
  const activeTasks = tasks.filter(task => 
    task.status === 'in_progress' || 
    task.status === 'retrying' || 
    task.status === 'pending'
  );

  // Tâches récemment complétées (pour afficher la conclusion)
  const recentlyCompleted = tasks
    .filter(task => task.status === 'completed')
    .filter(task => {
      if (!task.completedAt) return false;
      return Date.now() - task.completedAt < 30000; // 30 secondes
    })
    .slice(0, 1);

  // Détecter les nouvelles tâches complétées pour les notifications
  useEffect(() => {
    const completedTaskIds = tasks
      .filter(t => t.status === 'completed' && t.completedAt)
      .filter(t => t.completedAt && Date.now() - t.completedAt < 5000) // Dernières 5 secondes
      .map(t => t.id);

    completedTaskIds.forEach(id => {
      if (!notifications.has(id)) {
        setNotifications(prev => new Set([...prev, id]));
        // Retirer la notification après 5 secondes
        setTimeout(() => {
          setNotifications(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }, 5000);
      }
    });
  }, [tasks, notifications]);

  // Ne pas afficher si aucune tâche active ou récemment complétée
  if (activeTasks.length === 0 && recentlyCompleted.length === 0) {
    return null;
  }

  const getAgentIcon = (type: string) => {
    switch (type) {
      case 'research':
        return '🔍';
      case 'analysis':
        return '📊';
      case 'creation':
        return '✨';
      default:
        return '🤖';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'bg-blue-500';
      case 'retrying':
        return 'bg-amber-500';
      case 'pending':
        return 'bg-slate-500';
      default:
        return 'bg-slate-500';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(0)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm animate-slide-up">
      <div 
        className="glass-intense rounded-2xl border border-white/20 shadow-2xl overflow-hidden backdrop-blur-xl transition-all duration-300 hover:shadow-indigo-500/20"
        style={{
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(99, 102, 241, 0.1)'
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-b border-white/10 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/30 relative">
              <svg className="w-4 h-4 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.393 1.393c.412.412.412 1.08 0 1.492l-1.57 1.57a1.5 1.5 0 01-1.492 0L5 14.5" />
              </svg>
              {activeTasks.length > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse border-2 border-slate-900" />
              )}
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Agents Actifs</div>
              <div className="text-xs text-slate-400">{activeTasks.length} tâche(s)</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300 hover:bg-white/10 hover:text-white transition-all"
            >
              {isMinimized ? (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              )}
            </button>
            {onOpenDashboard && (
              <button
                onClick={onOpenDashboard}
                className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300 hover:bg-white/10 hover:text-white transition-all"
              >
                Voir tout
              </button>
            )}
          </div>
        </div>

        {/* Tasks List */}
        {!isMinimized && (
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {/* Tâche récemment complétée avec conclusion */}
            {recentlyCompleted.map((task) => {
              const report = getReport(task.id);
              const isNew = notifications.has(task.id);
              
              return (
                <div
                  key={task.id}
                  onClick={() => onTaskClick?.(task.id)}
                  className={`p-3 border-b border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 hover:from-emerald-500/15 hover:to-emerald-600/10 cursor-pointer transition-all ${
                    isNew ? 'animate-pulse' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5 relative">
                      <span className="text-lg">✅</span>
                      {isNew && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="text-xs font-semibold text-emerald-400">Tâche complétée</div>
                        {isNew && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300 animate-bounce">
                            Nouveau
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-medium text-white truncate mb-2">
                        {task.description.length > 35 ? `${task.description.substring(0, 35)}...` : task.description}
                      </div>
                      {report?.conclusion && (
                        <div className="text-xs text-slate-300 line-clamp-2 mb-2">
                          {report.conclusion.split('\n').find(line => line.trim() && !line.startsWith('#'))?.substring(0, 60) || 'Voir la conclusion complète...'}
                        </div>
                      )}
                      <div className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                        <span>Cliquez pour voir la conclusion complète</span>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {activeTasks.slice(0, 3).map((task) => {
              const completedSteps = task.steps.filter(s => s.status === 'completed').length;
              const progress = task.steps.length > 0 ? (completedSteps / task.steps.length) * 100 : 0;
              const duration = task.startedAt ? Date.now() - task.startedAt : 0;

              return (
                <div
                  key={task.id}
                  onClick={() => onTaskClick?.(task.id)}
                  className="p-3 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-all last:border-b-0 group"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <span className="text-lg">{getAgentIcon(task.type)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-xs font-medium text-white truncate flex-1">
                          {task.description.length > 40 ? `${task.description.substring(0, 40)}...` : task.description}
                        </div>
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(task.status)} animate-pulse flex-shrink-0`} />
                      </div>
                      <div className="flex items-center gap-2 mb-2 text-xs text-slate-400">
                        <span>{completedSteps}/{task.steps.length} étapes</span>
                        <span>•</span>
                        <span className="capitalize">{task.status}</span>
                        {duration > 0 && (
                          <>
                            <span>•</span>
                            <span>{formatDuration(duration)}</span>
                          </>
                        )}
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 group-hover:from-blue-400 group-hover:to-indigo-400"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {activeTasks.length > 3 && (
              <div className="p-3 text-center text-xs text-slate-400 border-t border-white/5 bg-white/5">
                +{activeTasks.length - 3} autre(s) tâche(s) en cours
              </div>
            )}

            {activeTasks.length === 0 && recentlyCompleted.length === 0 && (
              <div className="p-6 text-center text-slate-400">
                <div className="text-3xl mb-2">🤖</div>
                <div className="text-xs">Aucune tâche active</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
