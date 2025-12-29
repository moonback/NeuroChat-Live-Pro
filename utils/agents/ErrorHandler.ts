/**
 * Gestionnaire d'erreurs avec retry logic
 */

import { Task, ErrorHandlingResult } from '../../types/agent';

export class ErrorHandler {
  /**
   * Gère une erreur et détermine si un retry est nécessaire
   */
  handleError(error: Error, task: Task, context: any = {}): ErrorHandlingResult {
    const errorType = this.classifyError(error);
    const shouldRetry = this.shouldRetry(errorType, task);
    const retryDelay = shouldRetry ? this.calculateRetryDelay(task) : undefined;
    const rollbackNeeded = this.needsRollback(errorType, context);

    return {
      shouldRetry,
      retryDelay,
      errorType,
      message: error.message,
      rollbackNeeded,
    };
  }

  /**
   * Classe l'erreur selon son type
   */
  private classifyError(error: Error): 'recoverable' | 'non_recoverable' | 'temporary' {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    // Erreurs temporaires (réseau, timeout, etc.)
    if (
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('econnrefused') ||
      name.includes('timeout') ||
      name.includes('network')
    ) {
      return 'temporary';
    }

    // Erreurs non récupérables (syntaxe, validation, etc.)
    if (
      message.includes('syntax') ||
      message.includes('invalid') ||
      message.includes('not found') ||
      message.includes('unauthorized') ||
      message.includes('forbidden') ||
      name.includes('syntax') ||
      name.includes('type')
    ) {
      return 'non_recoverable';
    }

    // Par défaut, considérer comme récupérable
    return 'recoverable';
  }

  /**
   * Détermine si un retry est nécessaire
   */
  private shouldRetry(
    errorType: 'recoverable' | 'non_recoverable' | 'temporary',
    task: Task
  ): boolean {
    // Ne pas retry si on a atteint le maximum
    if (task.retryCount >= task.maxRetries) {
      return false;
    }

    // Toujours retry pour les erreurs temporaires
    if (errorType === 'temporary') {
      return true;
    }

    // Retry pour les erreurs récupérables
    if (errorType === 'recoverable') {
      return true;
    }

    // Ne pas retry pour les erreurs non récupérables
    return false;
  }

  /**
   * Calcule le délai avant retry (exponential backoff)
   */
  private calculateRetryDelay(task: Task): number {
    const baseDelay = 1000; // 1 seconde de base
    const maxDelay = 30000; // 30 secondes maximum
    const exponentialDelay = baseDelay * Math.pow(2, task.retryCount);
    
    // Ajouter un peu de jitter pour éviter les thundering herd
    const jitter = Math.random() * 0.3 * exponentialDelay;
    const delay = Math.min(exponentialDelay + jitter, maxDelay);
    
    return Math.round(delay);
  }

  /**
   * Détermine si un rollback est nécessaire
   */
  private needsRollback(
    errorType: 'recoverable' | 'non_recoverable' | 'temporary',
    context: any
  ): boolean {
    // Rollback nécessaire pour les erreurs non récupérables si on a des étapes complétées
    if (errorType === 'non_recoverable' && context.completedSteps > 0) {
      return true;
    }

    // Rollback si l'erreur indique une corruption de données
    if (context.dataCorrupted) {
      return true;
    }

    return false;
  }

  /**
   * Effectue un rollback si nécessaire
   */
  async performRollback(task: Task): Promise<void> {
    // Marquer les étapes complétées comme failed
    for (const step of task.steps) {
      if (step.status === 'completed') {
        step.status = 'failed';
        step.error = 'Rollback effectué';
      }
    }

    // Réinitialiser l'index de l'étape courante
    task.currentStepIndex = 0;

    // Nettoyer les métadonnées si nécessaire
    if (task.metadata) {
      // Conserver seulement les métadonnées essentielles
      task.metadata = {
        rollbackPerformed: true,
        rollbackTimestamp: Date.now(),
      };
    }
  }

  /**
   * Prépare la tâche pour un retry
   */
  prepareForRetry(task: Task): void {
    task.retryCount++;
    task.status = 'retrying';

    // Réinitialiser les étapes qui ont échoué mais qui peuvent être retentées
    for (const step of task.steps) {
      if (step.status === 'failed' && task.retryCount <= task.maxRetries) {
        step.status = 'pending';
        step.error = undefined;
        step.startedAt = undefined;
        step.completedAt = undefined;
        step.duration = undefined;
      }
    }

    // Réinitialiser l'index si nécessaire
    const firstPendingStep = task.steps.findIndex(s => s.status === 'pending');
    if (firstPendingStep !== -1) {
      task.currentStepIndex = firstPendingStep;
    }
  }
}

