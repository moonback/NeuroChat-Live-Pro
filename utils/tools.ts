/**
 * Gestionnaire d'outils pour l'API Live Gemini
 * Définit les fonctions disponibles et gère leur exécution
 */

import { FunctionDeclaration, FunctionCall, FunctionResponse } from '../types';
import { AgentOrchestrator } from './agents/AgentOrchestrator';
import { AgentType } from '../types/agent';

// Instance singleton de l'orchestrateur
let orchestratorInstance: AgentOrchestrator | null = null;

function getOrchestrator(): AgentOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new AgentOrchestrator();
  }
  return orchestratorInstance;
}

// Définitions des fonctions disponibles
export const AVAILABLE_FUNCTIONS: Record<string, FunctionDeclaration> = {
  create_agent_task: {
    name: 'create_agent_task',
    description: 'Crée une nouvelle tâche d\'agent autonome pour exécuter une tâche complexe multi-étapes',
    parameters: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: 'Description détaillée de la tâche à exécuter',
        },
        agent_type: {
          type: 'string',
          enum: ['research', 'analysis', 'creation'],
          description: 'Type d\'agent à utiliser: research (recherche), analysis (analyse), creation (création)',
        },
      },
      required: ['description', 'agent_type'],
    },
  },
  get_agent_status: {
    name: 'get_agent_status',
    description: 'Obtient le statut d\'une tâche d\'agent en cours ou complétée',
    parameters: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'ID de la tâche d\'agent',
        },
      },
      required: ['task_id'],
    },
  },
  cancel_agent_task: {
    name: 'cancel_agent_task',
    description: 'Annule une tâche d\'agent en cours d\'exécution',
    parameters: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'ID de la tâche d\'agent à annuler',
        },
      },
      required: ['task_id'],
    },
  },
  get_agent_report: {
    name: 'get_agent_report',
    description: 'Obtient le rapport détaillé d\'exécution d\'une tâche d\'agent',
    parameters: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'ID de la tâche d\'agent',
        },
      },
      required: ['task_id'],
    },
  },
};

// Gestionnaire d'exécution des fonctions
export async function executeFunction(functionCall: FunctionCall): Promise<any> {
  const { name, args } = functionCall;
  
  console.log(`[Tools] Exécution de la fonction: ${name}`, args);
  
  const orchestrator = getOrchestrator();

  try {
    switch (name) {
      case 'create_agent_task': {
        const { description, agent_type } = args || {};
        if (!description || !agent_type) {
          return {
            result: 'error',
            message: 'Description et agent_type sont requis',
          };
        }
        if (!['research', 'analysis', 'creation'].includes(agent_type)) {
          return {
            result: 'error',
            message: 'agent_type doit être research, analysis ou creation',
          };
        }
        const task = await orchestrator.createTask(description, agent_type as AgentType);
        return {
          result: 'success',
          message: `Tâche créée avec succès`,
          task_id: task.id,
          task: {
            id: task.id,
            type: task.type,
            status: task.status,
            description: task.description,
            steps_count: task.steps.length,
          },
        };
      }

      case 'get_agent_status': {
        const { task_id } = args || {};
        if (!task_id) {
          return {
            result: 'error',
            message: 'task_id est requis',
          };
        }
        const task = orchestrator.getTaskStatus(task_id);
        if (!task) {
          return {
            result: 'error',
            message: `Tâche ${task_id} non trouvée`,
          };
        }
        return {
          result: 'success',
          task: {
            id: task.id,
            type: task.type,
            status: task.status,
            description: task.description,
            current_step: task.currentStepIndex,
            total_steps: task.steps.length,
            steps_completed: task.steps.filter(s => s.status === 'completed').length,
            retry_count: task.retryCount,
            error: task.error,
          },
        };
      }

      case 'cancel_agent_task': {
        const { task_id } = args || {};
        if (!task_id) {
          return {
            result: 'error',
            message: 'task_id est requis',
          };
        }
        const cancelled = orchestrator.cancelTask(task_id);
        if (!cancelled) {
          return {
            result: 'error',
            message: `Impossible d'annuler la tâche ${task_id}`,
          };
        }
        return {
          result: 'success',
          message: `Tâche ${task_id} annulée avec succès`,
        };
      }

      case 'get_agent_report': {
        const { task_id } = args || {};
        if (!task_id) {
          return {
            result: 'error',
            message: 'task_id est requis',
          };
        }
        const report = orchestrator.getReport(task_id);
        if (!report) {
          return {
            result: 'error',
            message: `Rapport pour la tâche ${task_id} non trouvé`,
          };
        }
        return {
          result: 'success',
          report: {
            task_id: report.taskId,
            agent_type: report.agentType,
            status: report.status,
            duration: report.duration,
            steps_completed: report.stepsCompleted,
            steps_total: report.stepsTotal,
            steps_failed: report.stepsFailed,
            retry_count: report.retryCount,
            success_rate: report.metrics.successRate,
            recommendations: report.recommendations,
            result: report.result,
            error: report.error,
          },
        };
      }

      default:
        console.warn(`[Tools] ⚠️ Fonction inconnue: ${name}`);
        return { 
          result: 'error', 
          message: `Fonction ${name} non implémentée` 
        };
    }
  } catch (error) {
    console.error(`[Tools] Erreur lors de l'exécution de ${name}:`, error);
    return {
      result: 'error',
      message: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

// Créer une réponse de fonction pour l'API
export function createFunctionResponse(
  functionCall: FunctionCall,
  result: any
): FunctionResponse {
  return {
    id: functionCall.id,
    name: functionCall.name,
    response: result
  };
}

// Construire la configuration des outils pour l'API Live
export function buildToolsConfig(
  enableFunctionCalling: boolean = true,
  enableGoogleSearch: boolean = false
): any[] {
  const tools: any[] = [];
  
  if (enableFunctionCalling) {
    const functionDeclarations = Object.values(AVAILABLE_FUNCTIONS);
    tools.push({
      functionDeclarations: functionDeclarations
    });
  }
  
  if (enableGoogleSearch) {
    tools.push({
      googleSearch: {}
    });
  }
  
  return tools;
}

