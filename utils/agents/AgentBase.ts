/**
 * Classe de base abstraite pour tous les agents autonomes
 */

import { AgentType, Task, TaskResult, TaskStep, LogEntry, AgentConfig, DEFAULT_AGENT_CONFIG } from '../../types/agent';

export abstract class AgentBase {
  protected id: string;
  protected name: string;
  protected type: AgentType;
  protected config: AgentConfig;
  protected logs: LogEntry[] = [];

  constructor(id: string, name: string, type: AgentType, config: Partial<AgentConfig> = {}) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.config = { ...DEFAULT_AGENT_CONFIG, ...config };
  }

  /**
   * Méthode abstraite à implémenter par chaque agent spécialisé
   */
  abstract execute(task: Task): Promise<TaskResult>;

  /**
   * Valide une étape avant son exécution
   */
  validateStep(step: TaskStep): boolean {
    if (!step.dependencies || step.dependencies.length === 0) {
      return true;
    }

    // Vérifier que toutes les dépendances sont complétées
    const task = this.getCurrentTask();
    if (!task) {
      return false;
    }

    for (const depId of step.dependencies) {
      const depStep = task.steps.find(s => s.id === depId);
      if (!depStep || depStep.status !== 'completed') {
        this.log(`Étape ${step.name} ne peut pas être exécutée: dépendance ${depId} non complétée`, 'warn');
        return false;
      }
    }

    return true;
  }

  /**
   * Log un message avec timestamp
   */
  log(message: string, level: LogEntry['level'] = 'info', stepId?: string, metadata?: Record<string, any>): void {
    if (!this.config.enableLogging) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      stepId,
      metadata,
    };

    this.logs.push(logEntry);
    console.log(`[${this.name}] [${level.toUpperCase()}] ${message}`, metadata || '');
  }

  /**
   * Récupère les logs de l'agent
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Réinitialise les logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Récupère la tâche actuelle (à implémenter par les sous-classes si nécessaire)
   */
  protected getCurrentTask(): Task | null {
    return null;
  }

  /**
   * Génère un ID unique pour une étape
   */
  protected generateStepId(stepIndex: number): string {
    return `${this.id}-step-${stepIndex}`;
  }

  /**
   * Vérifie si une étape peut être exécutée
   */
  protected canExecuteStep(step: TaskStep, task: Task): boolean {
    if (step.status === 'completed') {
      return false;
    }

    if (step.status === 'failed' && task.retryCount >= task.maxRetries) {
      return false;
    }

    return this.validateStep(step);
  }

  /**
   * Marque une étape comme en cours
   */
  protected markStepInProgress(step: TaskStep): void {
    step.status = 'in_progress';
    step.startedAt = Date.now();
    this.log(`Démarrage de l'étape: ${step.name}`, 'info', step.id);
  }

  /**
   * Marque une étape comme complétée
   */
  protected markStepCompleted(step: TaskStep, result?: any): void {
    step.status = 'completed';
    step.completedAt = Date.now();
    step.duration = step.completedAt - (step.startedAt || step.completedAt);
    step.result = result;
    this.log(`Étape complétée: ${step.name}`, 'success', step.id);
  }

  /**
   * Marque une étape comme échouée
   */
  protected markStepFailed(step: TaskStep, error: string): void {
    step.status = 'failed';
    step.completedAt = Date.now();
    step.error = error;
    this.log(`Étape échouée: ${step.name} - ${error}`, 'error', step.id);
  }

  /**
   * Getters
   */
  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getType(): AgentType {
    return this.type;
  }

  getConfig(): AgentConfig {
    return { ...this.config };
  }
}

