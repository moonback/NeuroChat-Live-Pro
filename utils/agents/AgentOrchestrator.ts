/**
 * Orchestrateur principal pour gérer les agents multiples et la file d'attente
 */

import { AgentType, Task, AgentTask, AgentReport, TaskStatus } from '../../types/agent';
import { TaskPlanner } from './TaskPlanner';
import { TaskExecutor } from './TaskExecutor';
import { ReportGenerator } from './ReportGenerator';
import { ErrorHandler } from './ErrorHandler';

const STORAGE_KEY_TASKS = 'agent_tasks';
const STORAGE_KEY_REPORTS = 'agent_reports';

export class AgentOrchestrator {
  private taskPlanner: TaskPlanner;
  private taskExecutor: TaskExecutor;
  private reportGenerator: ReportGenerator;
  private errorHandler: ErrorHandler;
  private tasks: Map<string, Task>;
  private reports: Map<string, AgentReport>;
  private taskQueue: string[]; // IDs des tâches en file d'attente
  private runningTasks: Set<string>; // IDs des tâches en cours d'exécution
  private maxConcurrentTasks: number;

  constructor(maxConcurrentTasks: number = 3) {
    this.taskPlanner = new TaskPlanner();
    this.taskExecutor = new TaskExecutor();
    this.reportGenerator = new ReportGenerator();
    this.errorHandler = new ErrorHandler();
    this.tasks = new Map();
    this.reports = new Map();
    this.taskQueue = [];
    this.runningTasks = new Set();
    this.maxConcurrentTasks = maxConcurrentTasks;

    // Charger depuis localStorage
    this.loadFromStorage();
  }

  /**
   * Crée une nouvelle tâche d'agent
   */
  async createTask(description: string, agentType: AgentType): Promise<Task> {
    // Créer le plan de tâche
    const task = this.taskPlanner.planTask(description, agentType);

    // Valider la faisabilité
    const validation = this.taskPlanner.validateTaskFeasibility(task);
    if (!validation.feasible) {
      throw new Error(`Tâche non faisable: ${validation.reason}`);
    }

    // Ajouter à la collection
    this.tasks.set(task.id, task);

    // Ajouter à la file d'attente
    this.taskQueue.push(task.id);

    // Sauvegarder
    this.saveToStorage();
    
      // Déclencher un événement personnalisé pour notifier la création
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('agentTaskCreated', { detail: { taskId: task.id } }));
    }

    // Démarrer l'exécution si possible
    this.processQueue();

    return task;
  }

  /**
   * Traite la file d'attente
   */
  private async processQueue(): Promise<void> {
    // Ne pas dépasser le nombre maximum de tâches concurrentes
    while (
      this.runningTasks.size < this.maxConcurrentTasks &&
      this.taskQueue.length > 0
    ) {
      const taskId = this.taskQueue.shift();
      if (!taskId) {
        break;
      }

      const task = this.tasks.get(taskId);
      if (!task) {
        continue;
      }

      // Démarrer l'exécution
      this.runningTasks.add(taskId);
      this.executeTaskAsync(taskId);
    }
  }

  /**
   * Exécute une tâche de manière asynchrone
   */
  private async executeTaskAsync(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      this.runningTasks.delete(taskId);
      return;
    }

    try {
      // Exécuter la tâche
      const result = await this.taskExecutor.executeTask(task);

      // Générer le rapport
      const report = this.reportGenerator.generateReport(task, []);
      this.reports.set(taskId, report);

      // Sauvegarder
      this.saveToStorage();
      
      // Déclencher un événement personnalisé pour notifier les changements
      window.dispatchEvent(new CustomEvent('agentTaskUpdated', { detail: { taskId, status: task.status } }));
    } catch (error) {
      console.error(`[AgentOrchestrator] Erreur lors de l'exécution de la tâche ${taskId}:`, error);
      
      // Marquer comme échouée
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Erreur inconnue';
      task.completedAt = Date.now();

      // Générer un rapport même en cas d'erreur
      const report = this.reportGenerator.generateReport(task, []);
      this.reports.set(taskId, report);

      this.saveToStorage();
      
      // Déclencher un événement personnalisé pour notifier les changements
      window.dispatchEvent(new CustomEvent('agentTaskUpdated', { detail: { taskId, status: task.status } }));
    } finally {
      // Retirer de la liste des tâches en cours
      this.runningTasks.delete(taskId);

      // Traiter la file d'attente pour la prochaine tâche
      this.processQueue();
    }
  }

  /**
   * Obtient le statut d'une tâche
   */
  getTaskStatus(taskId: string): Task | null {
    return this.tasks.get(taskId) || null;
  }

  /**
   * Obtient toutes les tâches
   */
  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Obtient les tâches par statut
   */
  getTasksByStatus(status: TaskStatus): Task[] {
    return Array.from(this.tasks.values()).filter(t => t.status === status);
  }

  /**
   * Annule une tâche
   */
  cancelTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    // Annuler via l'exécuteur
    this.taskExecutor.cancelTask(task);

    // Retirer de la file d'attente si elle y est
    const queueIndex = this.taskQueue.indexOf(taskId);
    if (queueIndex !== -1) {
      this.taskQueue.splice(queueIndex, 1);
    }

    // Retirer des tâches en cours
    this.runningTasks.delete(taskId);

    // Sauvegarder
    this.saveToStorage();

    return true;
  }

  /**
   * Obtient le rapport d'une tâche
   */
  getReport(taskId: string): AgentReport | null {
    return this.reports.get(taskId) || null;
  }

  /**
   * Obtient tous les rapports
   */
  getAllReports(): AgentReport[] {
    return Array.from(this.reports.values());
  }

  /**
   * Supprime une tâche et son rapport
   */
  deleteTask(taskId: string): boolean {
    const deleted = this.tasks.delete(taskId);
    this.reports.delete(taskId);
    
    // Retirer de la file d'attente
    const queueIndex = this.taskQueue.indexOf(taskId);
    if (queueIndex !== -1) {
      this.taskQueue.splice(queueIndex, 1);
    }

    // Retirer des tâches en cours
    this.runningTasks.delete(taskId);

    if (deleted) {
      this.saveToStorage();
    }

    return deleted;
  }

  /**
   * Sauvegarde dans localStorage
   */
  private saveToStorage(): void {
    try {
      // Sauvegarder les tâches
      const tasksArray = Array.from(this.tasks.values());
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasksArray));

      // Sauvegarder les rapports
      const reportsArray = Array.from(this.reports.values());
      localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(reportsArray));
      
      // Déclencher un événement pour notifier la sauvegarde
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('agentStorageUpdated'));
      }
    } catch (error) {
      console.error('[AgentOrchestrator] Erreur lors de la sauvegarde:', error);
    }
  }

  /**
   * Charge depuis localStorage
   */
  private loadFromStorage(): void {
    try {
      // Charger les tâches
      const tasksJson = localStorage.getItem(STORAGE_KEY_TASKS);
      if (tasksJson) {
        const tasksArray = JSON.parse(tasksJson) as Task[];
        for (const task of tasksArray) {
          // Charger toutes les tâches (actives et récemment complétées)
          // Limiter aux 50 dernières tâches pour éviter de surcharger
          this.tasks.set(task.id, task);
          
          // Remettre en file d'attente ou en cours si nécessaire
          if (task.status === 'pending') {
            this.taskQueue.push(task.id);
          } else if (task.status === 'in_progress' || task.status === 'retrying') {
            this.runningTasks.add(task.id);
            // Relancer l'exécution si elle était en cours
            this.processQueue();
          }
        }
      }

      // Charger les rapports
      const reportsJson = localStorage.getItem(STORAGE_KEY_REPORTS);
      if (reportsJson) {
        const reportsArray = JSON.parse(reportsJson) as AgentReport[];
        for (const report of reportsArray) {
          this.reports.set(report.taskId, report);
        }
      }
    } catch (error) {
      console.error('[AgentOrchestrator] Erreur lors du chargement:', error);
    }
  }

  /**
   * Obtient les statistiques globales
   */
  getStats(): {
    totalTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    completedTasks: number;
    failedTasks: number;
    cancelledTasks: number;
  } {
    const allTasks = Array.from(this.tasks.values());
    
    return {
      totalTasks: allTasks.length,
      pendingTasks: allTasks.filter(t => t.status === 'pending').length,
      inProgressTasks: allTasks.filter(t => t.status === 'in_progress' || t.status === 'retrying').length,
      completedTasks: allTasks.filter(t => t.status === 'completed').length,
      failedTasks: allTasks.filter(t => t.status === 'failed').length,
      cancelledTasks: allTasks.filter(t => t.status === 'cancelled').length,
    };
  }
}

