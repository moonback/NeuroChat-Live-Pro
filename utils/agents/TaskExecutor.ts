/**
 * Exécuteur de tâches avec vérifications
 */

import { Task, TaskResult, TaskStep } from '../../types/agent';
import { ResearchAgent } from './ResearchAgent';
import { AnalysisAgent } from './AnalysisAgent';
import { CreationAgent } from './CreationAgent';
import { ErrorHandler } from './ErrorHandler';
import { AgentBase } from './AgentBase';

export class TaskExecutor {
  private errorHandler: ErrorHandler;
  private agents: Map<string, AgentBase>;

  constructor() {
    this.errorHandler = new ErrorHandler();
    this.agents = new Map();
    
    // Initialiser les agents
    this.agents.set('research', new ResearchAgent());
    this.agents.set('analysis', new AnalysisAgent());
    this.agents.set('creation', new CreationAgent());
  }

  /**
   * Exécute une tâche avec vérifications et gestion d'erreurs
   */
  async executeTask(task: Task): Promise<TaskResult> {
    // Vérifier que la tâche est valide
    if (task.status === 'cancelled') {
      return {
        success: false,
        error: 'Tâche annulée',
        logs: [],
        duration: 0,
      };
    }

    // Obtenir l'agent approprié
    const agent = this.agents.get(task.type);
    if (!agent) {
      return {
        success: false,
        error: `Agent de type ${task.type} non trouvé`,
        logs: [],
        duration: 0,
      };
    }

    // Marquer la tâche comme en cours
    task.status = 'in_progress';
    task.startedAt = Date.now();
    
    // Notifier le changement de statut
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('agentTaskStatusChanged', { 
        detail: { taskId: task.id, status: task.status } 
      }));
    }

    try {
      // Exécuter la tâche avec l'agent
      const result = await this.executeWithRetry(task, agent);
      
      // Marquer comme complétée
      if (result.success) {
        task.status = 'completed';
        task.result = result.result;
      } else {
        task.status = 'failed';
        task.error = result.error;
      }

      task.completedAt = Date.now();
      
      // Notifier le changement de statut final
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('agentTaskStatusChanged', { 
          detail: { taskId: task.id, status: task.status } 
        }));
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      task.status = 'failed';
      task.error = errorMessage;
      task.completedAt = Date.now();

      return {
        success: false,
        error: errorMessage,
        logs: agent.getLogs(),
        duration: Date.now() - (task.startedAt || Date.now()),
      };
    }
  }

  /**
   * Exécute une tâche avec retry automatique
   */
  private async executeWithRetry(task: Task, agent: AgentBase): Promise<TaskResult> {
    let lastResult: TaskResult | null = null;

    while (task.retryCount <= task.maxRetries) {
      try {
        // Exécuter la tâche
        const result = await agent.execute(task);
        
        if (result.success) {
          return result;
        }

        // Si échec, gérer l'erreur
        const error = new Error(result.error || 'Erreur inconnue');
        const handlingResult = this.errorHandler.handleError(error, task, {
          completedSteps: task.steps.filter(s => s.status === 'completed').length,
        });

        if (!handlingResult.shouldRetry) {
          return result; // Ne pas retry, retourner l'erreur
        }

        // Préparer pour retry
        this.errorHandler.prepareForRetry(task);
        lastResult = result;

        // Attendre avant de retry
        if (handlingResult.retryDelay) {
          await new Promise(resolve => setTimeout(resolve, handlingResult.retryDelay));
        }

        // Effectuer rollback si nécessaire
        if (handlingResult.rollbackNeeded) {
          await this.errorHandler.performRollback(task);
        }
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error('Erreur inconnue');
        const handlingResult = this.errorHandler.handleError(errorObj, task, {
          completedSteps: task.steps.filter(s => s.status === 'completed').length,
        });

        if (!handlingResult.shouldRetry) {
          return {
            success: false,
            error: errorObj.message,
            logs: agent.getLogs(),
            duration: Date.now() - (task.startedAt || Date.now()),
          };
        }

        // Préparer pour retry
        this.errorHandler.prepareForRetry(task);

        // Attendre avant de retry
        if (handlingResult.retryDelay) {
          await new Promise(resolve => setTimeout(resolve, handlingResult.retryDelay));
        }

        // Effectuer rollback si nécessaire
        if (handlingResult.rollbackNeeded) {
          await this.errorHandler.performRollback(task);
        }
      }
    }

    // Si on arrive ici, tous les retries ont échoué
    return lastResult || {
      success: false,
      error: 'Tous les retries ont échoué',
      logs: agent.getLogs(),
      duration: Date.now() - (task.startedAt || Date.now()),
    };
  }

  /**
   * Vérifie une étape après son exécution
   */
  verifyStep(step: TaskStep, task: Task): boolean {
    // Vérifier que l'étape a un résultat si elle est complétée
    if (step.status === 'completed' && step.result === undefined) {
      return false;
    }

    // Vérifier que l'étape a une erreur si elle a échoué
    if (step.status === 'failed' && !step.error) {
      return false;
    }

    // Vérifier la cohérence des timestamps
    if (step.completedAt && step.startedAt && step.completedAt < step.startedAt) {
      return false;
    }

    return true;
  }

  /**
   * Vérifie toutes les étapes d'une tâche
   */
  verifyAllSteps(task: Task): { valid: boolean; invalidSteps: string[] } {
    const invalidSteps: string[] = [];

    for (const step of task.steps) {
      if (!this.verifyStep(step, task)) {
        invalidSteps.push(step.id);
      }
    }

    return {
      valid: invalidSteps.length === 0,
      invalidSteps,
    };
  }

  /**
   * Annule une tâche en cours
   */
  cancelTask(task: Task): void {
    if (task.status === 'in_progress' || task.status === 'retrying') {
      task.status = 'cancelled';
      task.completedAt = Date.now();

      // Marquer les étapes en cours comme annulées
      for (const step of task.steps) {
        if (step.status === 'in_progress') {
          step.status = 'failed';
          step.error = 'Tâche annulée';
          step.completedAt = Date.now();
        }
      }
    }
  }
}

