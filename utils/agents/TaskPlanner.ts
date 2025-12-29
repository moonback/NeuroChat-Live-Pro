/**
 * Planificateur de tâches multi-étapes
 */

import { AgentType, Task, TaskStep } from '../../types/agent';

export class TaskPlanner {
  /**
   * Crée un plan de tâche à partir d'une description
   */
  planTask(description: string, agentType: AgentType): Task {
    const taskId = this.generateTaskId();
    const steps = this.createSteps(description, agentType);
    const estimatedDuration = this.estimateDuration(steps);

    const task: Task = {
      id: taskId,
      type: agentType,
      status: 'pending',
      description,
      steps,
      currentStepIndex: 0,
      retryCount: 0,
      maxRetries: 3,
      createdAt: Date.now(),
      estimatedDuration,
    };

    return task;
  }

  /**
   * Génère un ID unique pour une tâche
   */
  private generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Crée les étapes en fonction du type d'agent
   */
  private createSteps(description: string, agentType: AgentType): TaskStep[] {
    switch (agentType) {
      case 'research':
        return this.createResearchSteps(description);
      case 'analysis':
        return this.createAnalysisSteps(description);
      case 'creation':
        return this.createCreationSteps(description);
      default:
        return this.createGenericSteps(description);
    }
  }

  /**
   * Étapes pour un agent de recherche
   */
  private createResearchSteps(description: string): TaskStep[] {
    const steps: TaskStep[] = [
      {
        id: 'research-1',
        name: 'Recherche initiale',
        description: `Rechercher des informations sur: ${description}`,
        status: 'pending',
      },
      {
        id: 'research-2',
        name: 'Vérification des sources',
        description: 'Vérifier la fiabilité et la cohérence des sources trouvées',
        status: 'pending',
        dependencies: ['research-1'],
      },
      {
        id: 'research-3',
        name: 'Synthèse des résultats',
        description: 'Synthétiser les informations collectées',
        status: 'pending',
        dependencies: ['research-2'],
      },
    ];

    return steps;
  }

  /**
   * Étapes pour un agent d'analyse
   */
  private createAnalysisSteps(description: string): TaskStep[] {
    const steps: TaskStep[] = [
      {
        id: 'analysis-1',
        name: 'Extraction d\'informations',
        description: `Extraire les informations pertinentes de: ${description}`,
        status: 'pending',
      },
      {
        id: 'analysis-2',
        name: 'Détection de patterns',
        description: 'Identifier les patterns et tendances dans les données',
        status: 'pending',
        dependencies: ['analysis-1'],
      },
      {
        id: 'analysis-3',
        name: 'Création de synthèse',
        description: 'Créer une synthèse structurée des analyses',
        status: 'pending',
        dependencies: ['analysis-2'],
      },
      {
        id: 'analysis-4',
        name: 'Génération d\'insights',
        description: 'Générer des insights et recommandations',
        status: 'pending',
        dependencies: ['analysis-3'],
      },
    ];

    return steps;
  }

  /**
   * Étapes pour un agent de création
   */
  private createCreationSteps(description: string): TaskStep[] {
    const steps: TaskStep[] = [
      {
        id: 'creation-1',
        name: 'Création de structure',
        description: `Créer la structure pour: ${description}`,
        status: 'pending',
      },
      {
        id: 'creation-2',
        name: 'Génération de contenu',
        description: 'Générer le contenu selon la structure',
        status: 'pending',
        dependencies: ['creation-1'],
      },
      {
        id: 'creation-3',
        name: 'Validation du contenu',
        description: 'Valider la qualité et la cohérence du contenu',
        status: 'pending',
        dependencies: ['creation-2'],
      },
      {
        id: 'creation-4',
        name: 'Révision finale',
        description: 'Réviser et améliorer le contenu si nécessaire',
        status: 'pending',
        dependencies: ['creation-3'],
      },
    ];

    return steps;
  }

  /**
   * Étapes génériques
   */
  private createGenericSteps(description: string): TaskStep[] {
    return [
      {
        id: 'generic-1',
        name: 'Exécution de la tâche',
        description,
        status: 'pending',
      },
    ];
  }

  /**
   * Estime la durée totale de la tâche
   */
  private estimateDuration(steps: TaskStep[]): number {
    // Estimation basique: 1 seconde par étape (sera ajusté selon l'implémentation réelle)
    const baseTimePerStep = 1000;
    const dependencyMultiplier = 1.2; // Les étapes avec dépendances prennent plus de temps
    
    let totalDuration = 0;
    
    for (const step of steps) {
      let stepDuration = baseTimePerStep;
      
      if (step.dependencies && step.dependencies.length > 0) {
        stepDuration *= dependencyMultiplier;
      }
      
      totalDuration += stepDuration;
    }
    
    return totalDuration;
  }

  /**
   * Valide la faisabilité d'une tâche
   */
  validateTaskFeasibility(task: Task): { feasible: boolean; reason?: string } {
    if (!task.description || task.description.trim().length === 0) {
      return { feasible: false, reason: 'Description de tâche vide' };
    }

    if (task.steps.length === 0) {
      return { feasible: false, reason: 'Aucune étape définie' };
    }

    // Vérifier les dépendances circulaires
    const hasCircularDependency = this.checkCircularDependencies(task.steps);
    if (hasCircularDependency) {
      return { feasible: false, reason: 'Dépendances circulaires détectées' };
    }

    return { feasible: true };
  }

  /**
   * Vérifie les dépendances circulaires
   */
  private checkCircularDependencies(steps: TaskStep[]): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (stepId: string): boolean => {
      if (recursionStack.has(stepId)) {
        return true; // Cycle détecté
      }

      if (visited.has(stepId)) {
        return false; // Déjà visité, pas de cycle
      }

      visited.add(stepId);
      recursionStack.add(stepId);

      const step = steps.find(s => s.id === stepId);
      if (step && step.dependencies) {
        for (const depId of step.dependencies) {
          if (hasCycle(depId)) {
            return true;
          }
        }
      }

      recursionStack.delete(stepId);
      return false;
    };

    for (const step of steps) {
      if (hasCycle(step.id)) {
        return true;
      }
    }

    return false;
  }
}

