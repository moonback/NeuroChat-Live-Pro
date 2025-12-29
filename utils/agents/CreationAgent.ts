/**
 * Agent spécialisé en création de contenu
 */

import { AgentBase } from './AgentBase';
import { Task, TaskResult, TaskStep } from '../../types/agent';

export class CreationAgent extends AgentBase {
  private currentTask: Task | null = null;

  constructor(config?: Partial<any>) {
    super('creation-agent', 'Agent de Création', 'creation', config);
  }

  async execute(task: Task): Promise<TaskResult> {
    this.currentTask = task;
    const startTime = Date.now();
    this.log(`Démarrage de la création: ${task.description}`, 'info');

    try {
      // Exécuter chaque étape séquentiellement
      for (let i = 0; i < task.steps.length; i++) {
        const step = task.steps[i];
        
        if (!this.canExecuteStep(step, task)) {
          continue;
        }

        this.markStepInProgress(step);
        task.currentStepIndex = i;

        try {
          const stepResult = await this.executeStep(step, task);
          this.markStepCompleted(step, stepResult);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
          this.markStepFailed(step, errorMessage);
          throw error;
        }
      }

      // Générer le contenu final
      const result = this.generateFinalContent(task);
      const duration = Date.now() - startTime;

      this.log(`Création complétée en ${duration}ms`, 'success');
      this.currentTask = null;

      return {
        success: true,
        result,
        logs: this.getLogs(),
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      
      this.log(`Création échouée: ${errorMessage}`, 'error');
      this.currentTask = null;

      return {
        success: false,
        error: errorMessage,
        logs: this.getLogs(),
        duration,
      };
    }
  }

  protected getCurrentTask(): Task | null {
    return this.currentTask;
  }

  /**
   * Exécute une étape de création
   */
  private async executeStep(step: TaskStep, task: Task): Promise<any> {
    this.log(`Exécution de l'étape: ${step.name}`, 'info', step.id);

    // Simuler un traitement
    await new Promise(resolve => setTimeout(resolve, 400));

    // Analyser le type d'étape
    if (step.name.toLowerCase().includes('plan') || step.name.toLowerCase().includes('structure')) {
      return await this.createStructure(step.description, task);
    } else if (step.name.toLowerCase().includes('génération') || step.name.toLowerCase().includes('generate')) {
      return await this.generateContent(step.description, task);
    } else if (step.name.toLowerCase().includes('validation') || step.name.toLowerCase().includes('validate')) {
      return await this.validateContent(step.description, task);
    } else if (step.name.toLowerCase().includes('révision') || step.name.toLowerCase().includes('review')) {
      return await this.reviewContent(step.description, task);
    }

    // Par défaut
    return {
      stepId: step.id,
      result: `Étape ${step.name} exécutée`,
      data: step.description,
    };
  }

  /**
   * Crée la structure du contenu
   */
  private async createStructure(description: string, task: Task): Promise<any> {
    this.log(`Création de structure: ${description}`, 'info');

    const structure = {
      description,
      sections: [
        { id: 'intro', title: 'Introduction', order: 1 },
        { id: 'main', title: 'Contenu principal', order: 2 },
        { id: 'conclusion', title: 'Conclusion', order: 3 },
      ],
      outline: `Plan structuré pour: ${description}`,
      timestamp: Date.now(),
    };

    if (!task.metadata) {
      task.metadata = {};
    }
    task.metadata.structure = structure;

    return structure;
  }

  /**
   * Génère le contenu
   */
  private async generateContent(description: string, task: Task): Promise<any> {
    this.log(`Génération de contenu: ${description}`, 'info');

    const structure = task.metadata?.structure;
    
    const content = {
      description,
      sections: structure?.sections || [],
      content: `Contenu généré pour: ${description}\n\nCe contenu a été créé selon les spécifications demandées.`,
      wordCount: 50,
      timestamp: Date.now(),
    };

    if (!task.metadata) {
      task.metadata = {};
    }
    if (!task.metadata.generatedContent) {
      task.metadata.generatedContent = [];
    }
    task.metadata.generatedContent.push(content);

    return content;
  }

  /**
   * Valide la qualité du contenu
   */
  private async validateContent(description: string, task: Task): Promise<any> {
    this.log(`Validation: ${description}`, 'info');

    const generatedContent = task.metadata?.generatedContent || [];
    
    if (generatedContent.length === 0) {
      throw new Error('Aucun contenu à valider');
    }

    const validation = {
      description,
      contentValidated: generatedContent.length,
      quality: {
        completeness: 0.9,
        coherence: 0.85,
        relevance: 0.9,
      },
      passed: true,
      issues: [],
      timestamp: Date.now(),
    };

    if (!task.metadata) {
      task.metadata = {};
    }
    task.metadata.validation = validation;

    return validation;
  }

  /**
   * Révision du contenu
   */
  private async reviewContent(description: string, task: Task): Promise<any> {
    this.log(`Révision: ${description}`, 'info');

    const validation = task.metadata?.validation;
    const generatedContent = task.metadata?.generatedContent || [];

    const review = {
      description,
      contentReviewed: generatedContent.length,
      improvements: [
        { type: 'clarity', suggestion: 'Améliorer la clarté de certaines sections' },
      ],
      finalQuality: validation?.quality || { completeness: 0.8, coherence: 0.8, relevance: 0.8 },
      timestamp: Date.now(),
    };

    if (!task.metadata) {
      task.metadata = {};
    }
    task.metadata.review = review;

    return review;
  }

  /**
   * Génère le contenu final
   */
  private generateFinalContent(task: Task): any {
    const completedSteps = task.steps.filter(s => s.status === 'completed');
    const structure = task.metadata?.structure;
    const generatedContent = task.metadata?.generatedContent || [];
    const validation = task.metadata?.validation;
    const review = task.metadata?.review;

    return {
      taskId: task.id,
      description: task.description,
      stepsCompleted: completedSteps.length,
      totalSteps: task.steps.length,
      structure,
      content: generatedContent,
      validation,
      review,
      finalContent: generatedContent.map((c: any) => c.content).join('\n\n'),
      summary: `Création complétée avec ${completedSteps.length} étapes réussies`,
      timestamp: Date.now(),
    };
  }
}

