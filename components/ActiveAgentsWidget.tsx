/**
 * Widget flottant pour afficher les agents actifs en cours
 */

import React from 'react';
import { useAgentManager } from '../hooks/useAgentManager';
import { Task } from '../types/agent';

interface ActiveAgentsWidgetProps {
  onTaskClick?: (taskId: string) => void;
  onOpenDashboard?: () => void;
}

export default function ActiveAgentsWidget({ onTaskClick, onOpenDashboard }: ActiveAgentsWidgetProps) {
  const { tasks, getReport } = useAgentManager();
  
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
      // Tâches complétées dans les 30 dernières secondes
      return Date.now() - task.completedAt < 30000;
    })
    .slice(0, 1); // Une seule tâche récemment complétée

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

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm">
      <div className="glass-intense rounded-2xl border border-white/20 shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-b border-white/10 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/30">
              <svg className="w-4 h-4 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.393 1.393c.412.412.412 1.08 0 1.492l-1.57 1.57a1.5 1.5 0 01-1.492 0L5 14.5" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Agents Actifs</div>
              <div className="text-xs text-slate-400">{activeTasks.length} tâche(s)</div>
            </div>
          </div>
          {onOpenDashboard && (
            <button
              onClick={onOpenDashboard}
              className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300 hover:bg-white/10 hover:text-white transition-all"
            >
              Voir tout
            </button>
          )}
        </div>

        {/* Tasks List */}
        <div className="max-h-64 overflow-y-auto">
          {/* Tâche récemment complétée avec conclusion */}
          {recentlyCompleted.map((task) => {
            const report = getReport(task.id);
            
            return (
              <div
                key={task.id}
                onClick={() => onTaskClick?.(task.id)}
                className="p-3 border-b border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <span className="text-lg">✅</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-xs font-semibold text-emerald-400">Tâche complétée</div>
                    </div>
                    <div className="text-xs font-medium text-white truncate mb-2">
                      {task.description.length > 35 ? `${task.description.substring(0, 35)}...` : task.description}
                    </div>
                    {report?.conclusion && (
                      <div className="text-xs text-slate-300 line-clamp-2 mb-2">
                        {report.conclusion.split('\n').find(line => line.trim() && !line.startsWith('#'))?.substring(0, 60) || 'Voir la conclusion complète...'}
                      </div>
                    )}
                    <div className="text-xs text-emerald-400 font-medium">Cliquez pour voir la conclusion complète →</div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {activeTasks.slice(0, 3).map((task) => {
            const completedSteps = task.steps.filter(s => s.status === 'completed').length;
            const progress = task.steps.length > 0 ? (completedSteps / task.steps.length) * 100 : 0;

            return (
              <div
                key={task.id}
                onClick={() => onTaskClick?.(task.id)}
                className="p-3 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors last:border-b-0"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <span className="text-lg">{getAgentIcon(task.type)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-xs font-medium text-white truncate">
                        {task.description.length > 40 ? `${task.description.substring(0, 40)}...` : task.description}
                      </div>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(task.status)} animate-pulse flex-shrink-0`} />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-xs text-slate-400">
                        {completedSteps}/{task.steps.length} étapes
                      </div>
                      <div className="text-xs text-slate-500">•</div>
                      <div className="text-xs text-slate-400 capitalize">{task.status}</div>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {activeTasks.length > 3 && (
            <div className="p-3 text-center text-xs text-slate-400 border-t border-white/5">
              +{activeTasks.length - 3} autre(s) tâche(s)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

