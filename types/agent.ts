/**
 * Types et interfaces pour le système d'agents autonomes
 */

export type AgentType = 'research' | 'analysis' | 'creation';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'retrying' | 'cancelled';

export type LogLevel = 'info' | 'warn' | 'error' | 'success';

export interface TaskStep {
  id: string;
  name: string;
  description: string;
  status: TaskStatus;
  dependencies?: string[]; // IDs des étapes dépendantes
  result?: any;
  error?: string;
  startedAt?: number;
  completedAt?: number;
  duration?: number;
}

export interface Task {
  id: string;
  type: AgentType;
  status: TaskStatus;
  description: string;
  steps: TaskStep[];
  currentStepIndex: number;
  result?: any;
  error?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  estimatedDuration?: number; // en millisecondes
  metadata?: Record<string, any>;
}

export interface AgentTask extends Task {
  agentId: string;
  agentType: AgentType;
}

export interface TaskResult {
  success: boolean;
  result?: any;
  error?: string;
  logs: LogEntry[];
  duration: number;
}

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  stepId?: string;
  metadata?: Record<string, any>;
}

export interface AgentReport {
  taskId: string;
  agentType: AgentType;
  status: TaskStatus;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  duration?: number;
  stepsCompleted: number;
  stepsTotal: number;
  stepsFailed: number;
  retryCount: number;
  logs: LogEntry[];
  result?: any;
  error?: string;
  conclusion?: string; // Conclusion générée à la fin de la tâche
  metrics: {
    totalDuration: number;
    averageStepDuration: number;
    successRate: number;
    retryRate: number;
  };
  recommendations?: string[];
}

export interface AgentConfig {
  maxRetries: number;
  timeout: number; // en millisecondes
  retryDelay: number; // en millisecondes (base pour exponential backoff)
  enableLogging: boolean;
  enablePersistence: boolean;
}

export interface ErrorHandlingResult {
  shouldRetry: boolean;
  retryDelay?: number;
  errorType: 'recoverable' | 'non_recoverable' | 'temporary';
  message: string;
  rollbackNeeded: boolean;
}

export interface AgentStats {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  inProgressTasks: number;
  averageDuration: number;
  successRate: number;
}

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  maxRetries: 3,
  timeout: 300000, // 5 minutes
  retryDelay: 1000, // 1 seconde de base
  enableLogging: true,
  enablePersistence: true,
};

