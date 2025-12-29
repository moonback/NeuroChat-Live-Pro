/**
 * Hook React pour gérer l'état des agents et exposer les méthodes
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AgentOrchestrator } from '../utils/agents/AgentOrchestrator';
import { Task, AgentReport, AgentType } from '../types/agent';

export function useAgentManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reports, setReports] = useState<AgentReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const orchestratorRef = useRef<AgentOrchestrator | null>(null);
  const lastStorageCheckRef = useRef<string>('');

  // Initialiser l'orchestrateur
  useEffect(() => {
    if (!orchestratorRef.current) {
      orchestratorRef.current = new AgentOrchestrator();
    }

    // Charger les tâches et rapports initiaux
    loadTasks();
    loadReports();

    // Vérifier les changements dans localStorage
    const checkStorageChanges = () => {
      try {
        const currentTasksJson = localStorage.getItem('agent_tasks') || '';
        const currentReportsJson = localStorage.getItem('agent_reports') || '';
        const currentStorage = currentTasksJson + '|' + currentReportsJson;
        
        // Si le contenu de localStorage a changé, recharger
        if (currentStorage !== lastStorageCheckRef.current) {
          lastStorageCheckRef.current = currentStorage;
          loadTasks();
          loadReports();
        }
      } catch (error) {
        console.warn('[useAgentManager] Erreur lors de la vérification de localStorage:', error);
      }
    };

    // Polling pour mettre à jour les tâches en cours
    const interval = setInterval(() => {
      checkStorageChanges();
    }, 500); // Vérification toutes les 500ms pour une réactivité maximale

    // Écouter les événements de stockage (si plusieurs onglets)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'agent_tasks' || e.key === 'agent_reports') {
        loadTasks();
        loadReports();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Écouter les événements personnalisés pour les mises à jour de tâches
    const handleTaskCreated = () => {
      setTimeout(() => {
        loadTasks();
        loadReports();
      }, 100); // Petit délai pour s'assurer que localStorage est à jour
    };
    const handleTaskUpdated = () => {
      setTimeout(() => {
        loadTasks();
        loadReports();
      }, 100);
    };
    const handleTaskStatusChanged = () => {
      setTimeout(() => {
        loadTasks();
        loadReports();
      }, 100);
    };
    const handleStorageUpdated = () => {
      loadTasks();
      loadReports();
    };
    window.addEventListener('agentTaskCreated', handleTaskCreated);
    window.addEventListener('agentTaskUpdated', handleTaskUpdated);
    window.addEventListener('agentTaskStatusChanged', handleTaskStatusChanged);
    window.addEventListener('agentStorageUpdated', handleStorageUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('agentTaskCreated', handleTaskCreated);
      window.removeEventListener('agentTaskUpdated', handleTaskUpdated);
      window.removeEventListener('agentTaskStatusChanged', handleTaskStatusChanged);
      window.removeEventListener('agentStorageUpdated', handleStorageUpdated);
    };
  }, []);

  /**
   * Charge les tâches depuis l'orchestrateur
   */
  const loadTasks = useCallback(() => {
    if (!orchestratorRef.current) {
      return;
    }
    try {
      // Charger directement depuis localStorage pour avoir les données les plus récentes
      const tasksJson = localStorage.getItem('agent_tasks');
      if (tasksJson) {
        const tasksArray = JSON.parse(tasksJson) as Task[];
        // Mettre à jour l'état directement depuis localStorage
        setTasks([...tasksArray]); // Créer un nouveau tableau pour forcer le re-render
      } else {
        // Si pas de données dans localStorage, utiliser l'orchestrateur
        const allTasks = orchestratorRef.current.getAllTasks();
        setTasks([...allTasks]);
      }
    } catch (error) {
      console.warn('[useAgentManager] Erreur lors du chargement des tâches:', error);
      // En cas d'erreur, utiliser l'orchestrateur
      const allTasks = orchestratorRef.current.getAllTasks();
      setTasks([...allTasks]);
    }
  }, []);

  /**
   * Charge les rapports depuis l'orchestrateur
   */
  const loadReports = useCallback(() => {
    if (!orchestratorRef.current) {
      return;
    }
    try {
      // Charger directement depuis localStorage pour avoir les données les plus récentes
      const reportsJson = localStorage.getItem('agent_reports');
      if (reportsJson) {
        const reportsArray = JSON.parse(reportsJson) as AgentReport[];
        // Mettre à jour l'état directement depuis localStorage
        setReports([...reportsArray]); // Créer un nouveau tableau pour forcer le re-render
      } else {
        // Si pas de données dans localStorage, utiliser l'orchestrateur
        const allReports = orchestratorRef.current.getAllReports();
        setReports([...allReports]);
      }
    } catch (error) {
      console.warn('[useAgentManager] Erreur lors du chargement des rapports:', error);
      // En cas d'erreur, utiliser l'orchestrateur
      const allReports = orchestratorRef.current.getAllReports();
      setReports([...allReports]);
    }
  }, []);

  /**
   * Crée une nouvelle tâche
   */
  const createTask = useCallback(async (description: string, agentType: AgentType): Promise<Task | null> => {
    if (!orchestratorRef.current) {
      return null;
    }

    setIsLoading(true);
    try {
      const task = await orchestratorRef.current.createTask(description, agentType);
      loadTasks();
      return task;
    } catch (error) {
      console.error('[useAgentManager] Erreur lors de la création de la tâche:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [loadTasks]);

  /**
   * Obtient le statut d'une tâche
   */
  const getTaskStatus = useCallback((taskId: string): Task | null => {
    if (!orchestratorRef.current) {
      return null;
    }
    return orchestratorRef.current.getTaskStatus(taskId);
  }, []);

  /**
   * Annule une tâche
   */
  const cancelTask = useCallback((taskId: string): boolean => {
    if (!orchestratorRef.current) {
      return false;
    }
    const cancelled = orchestratorRef.current.cancelTask(taskId);
    if (cancelled) {
      loadTasks();
    }
    return cancelled;
  }, [loadTasks]);

  /**
   * Obtient le rapport d'une tâche
   */
  const getReport = useCallback((taskId: string): AgentReport | null => {
    if (!orchestratorRef.current) {
      return null;
    }
    return orchestratorRef.current.getReport(taskId);
  }, []);

  /**
   * Supprime une tâche
   */
  const deleteTask = useCallback((taskId: string): boolean => {
    if (!orchestratorRef.current) {
      return false;
    }
    const deleted = orchestratorRef.current.deleteTask(taskId);
    if (deleted) {
      loadTasks();
      loadReports();
    }
    return deleted;
  }, [loadTasks, loadReports]);

  /**
   * Obtient les statistiques
   */
  const getStats = useCallback(() => {
    if (!orchestratorRef.current) {
      return {
        totalTasks: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        cancelledTasks: 0,
      };
    }
    return orchestratorRef.current.getStats();
  }, []);

  /**
   * Obtient les tâches par statut
   */
  const getTasksByStatus = useCallback((status: Task['status']): Task[] => {
    if (!orchestratorRef.current) {
      return [];
    }
    return orchestratorRef.current.getTasksByStatus(status);
  }, []);

  return {
    tasks,
    reports,
    isLoading,
    createTask,
    getTaskStatus,
    cancelTask,
    getReport,
    deleteTask,
    getStats,
    getTasksByStatus,
    refreshTasks: loadTasks,
    refreshReports: loadReports,
  };
}

