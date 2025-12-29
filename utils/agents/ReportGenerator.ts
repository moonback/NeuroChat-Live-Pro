/**
 * Générateur de rapports d'exécution détaillés
 */

import { Task, AgentReport, LogEntry, AgentType } from '../../types/agent';

export class ReportGenerator {
  /**
   * Génère un rapport détaillé pour une tâche
   */
  generateReport(task: Task, logs: LogEntry[] = []): AgentReport {
    const completedSteps = task.steps.filter(s => s.status === 'completed');
    const failedSteps = task.steps.filter(s => s.status === 'failed');
    const totalDuration = this.calculateTotalDuration(task);
    const averageStepDuration = this.calculateAverageStepDuration(task);
    const successRate = this.calculateSuccessRate(task);
    const retryRate = task.retryCount > 0 ? task.retryCount / (task.retryCount + 1) : 0;

    const report: AgentReport = {
      taskId: task.id,
      agentType: task.type,
      status: task.status,
      createdAt: task.createdAt,
      startedAt: task.startedAt,
      completedAt: task.completedAt,
      duration: totalDuration,
      stepsCompleted: completedSteps.length,
      stepsTotal: task.steps.length,
      stepsFailed: failedSteps.length,
      retryCount: task.retryCount,
      logs: logs.length > 0 ? logs : this.extractLogsFromTask(task),
      result: task.result,
      error: task.error,
      conclusion: this.generateConclusion(task, completedSteps, failedSteps, task.result),
      metrics: {
        totalDuration,
        averageStepDuration,
        successRate,
        retryRate,
      },
      recommendations: this.generateRecommendations(task, completedSteps, failedSteps),
    };

    return report;
  }

  /**
   * Calcule la durée totale de la tâche
   */
  private calculateTotalDuration(task: Task): number {
    if (task.completedAt && task.startedAt) {
      return task.completedAt - task.startedAt;
    }
    if (task.startedAt) {
      return Date.now() - task.startedAt;
    }
    return 0;
  }

  /**
   * Calcule la durée moyenne par étape
   */
  private calculateAverageStepDuration(task: Task): number {
    const stepsWithDuration = task.steps.filter(s => s.duration !== undefined);
    
    if (stepsWithDuration.length === 0) {
      return 0;
    }

    const totalStepDuration = stepsWithDuration.reduce((sum, step) => {
      return sum + (step.duration || 0);
    }, 0);

    return totalStepDuration / stepsWithDuration.length;
  }

  /**
   * Calcule le taux de succès
   */
  private calculateSuccessRate(task: Task): number {
    if (task.steps.length === 0) {
      return 0;
    }

    const completedSteps = task.steps.filter(s => s.status === 'completed').length;
    return completedSteps / task.steps.length;
  }

  /**
   * Extrait les logs de la tâche
   */
  private extractLogsFromTask(task: Task): LogEntry[] {
    const logs: LogEntry[] = [];

    // Ajouter un log pour chaque étape
    for (const step of task.steps) {
      if (step.startedAt) {
        logs.push({
          timestamp: step.startedAt,
          level: 'info',
          message: `Démarrage: ${step.name}`,
          stepId: step.id,
        });
      }

      if (step.completedAt) {
        logs.push({
          timestamp: step.completedAt,
          level: step.status === 'completed' ? 'success' : 'error',
          message: step.status === 'completed' 
            ? `Complété: ${step.name}` 
            : `Échoué: ${step.name} - ${step.error || 'Erreur inconnue'}`,
          stepId: step.id,
        });
      }
    }

    // Trier par timestamp
    logs.sort((a, b) => a.timestamp - b.timestamp);

    return logs;
  }

  /**
   * Génère des recommandations basées sur l'exécution
   */
  private generateRecommendations(
    task: Task,
    completedSteps: any[],
    failedSteps: any[]
  ): string[] {
    const recommendations: string[] = [];

    // Recommandations basées sur les erreurs
    if (failedSteps.length > 0) {
      recommendations.push(
        `${failedSteps.length} étape(s) ont échoué. Vérifiez les erreurs et considérez un retry.`
      );
    }

    // Recommandations basées sur les retries
    if (task.retryCount > 0) {
      recommendations.push(
        `La tâche a nécessité ${task.retryCount} retry(s). Cela peut indiquer des problèmes de stabilité.`
      );
    }

    // Recommandations basées sur la durée
    if (task.estimatedDuration && task.completedAt && task.startedAt) {
      const actualDuration = task.completedAt - task.startedAt;
      const ratio = actualDuration / task.estimatedDuration;

      if (ratio > 1.5) {
        recommendations.push(
          `La tâche a pris ${Math.round(ratio * 100)}% plus de temps que prévu. Optimisation recommandée.`
        );
      } else if (ratio < 0.5) {
        recommendations.push(
          `La tâche a été complétée plus rapidement que prévu. L'estimation peut être ajustée.`
        );
      }
    }

    // Recommandations basées sur le taux de succès
    const successRate = this.calculateSuccessRate(task);
    if (successRate < 0.5) {
      recommendations.push(
        `Taux de succès faible (${Math.round(successRate * 100)}%). Révision de la planification recommandée.`
      );
    }

    // Recommandations positives
    if (completedSteps.length === task.steps.length && task.retryCount === 0) {
      recommendations.push(
        `Tâche complétée avec succès sans retry. Performance optimale.`
      );
    }

    return recommendations;
  }

  /**
   * Génère une conclusion basée sur les résultats de la tâche
   */
  private generateConclusion(
    task: Task,
    completedSteps: any[],
    failedSteps: any[],
    result?: any
  ): string {
    const successRate = this.calculateSuccessRate(task);
    const duration = this.formatDuration(this.calculateTotalDuration(task));
    
    let conclusion = '';

    // Introduction
    conclusion += `## Conclusion de l'exécution\n\n`;
    conclusion += `La tâche "${task.description}" a été exécutée par l'agent ${this.getAgentTypeName(task.type)}.\n\n`;

    // Résultats principaux
    if (task.status === 'completed' && successRate === 1) {
      conclusion += `✅ **Succès complet** : Toutes les ${completedSteps.length} étapes ont été complétées avec succès.\n\n`;
    } else if (task.status === 'completed' && successRate > 0.5) {
      conclusion += `✅ **Succès partiel** : ${completedSteps.length} sur ${task.steps.length} étapes complétées (${Math.round(successRate * 100)}% de réussite).\n\n`;
    } else if (task.status === 'failed') {
      conclusion += `❌ **Échec** : La tâche n'a pas pu être complétée. ${failedSteps.length} étape(s) ont échoué.\n\n`;
    } else {
      conclusion += `⚠️ **Statut** : ${task.status}\n\n`;
    }

    // Résultats détaillés
    if (result) {
      conclusion += `### Résultats obtenus\n\n`;
      
      if (result.summary) {
        conclusion += `${result.summary}\n\n`;
      } else if (typeof result === 'object') {
        // Extraire les informations clés du résultat
        if (result.searchResults) {
          conclusion += `- ${result.searchResults.length || 0} source(s) de recherche analysée(s)\n`;
        }
        if (result.extractedData) {
          conclusion += `- ${result.extractedData.length || 0} point(s) de données extrait(s)\n`;
        }
        if (result.content) {
          conclusion += `- Contenu généré : ${result.content.length || 0} élément(s)\n`;
        }
        if (result.finalContent) {
          conclusion += `- Contenu final produit\n`;
        }
        conclusion += '\n';
      } else {
        conclusion += `${result}\n\n`;
      }
    }

    // Métriques de performance
    conclusion += `### Performance\n\n`;
    conclusion += `- **Durée totale** : ${duration}\n`;
    conclusion += `- **Taux de succès** : ${Math.round(successRate * 100)}%\n`;
    if (task.retryCount > 0) {
      conclusion += `- **Tentatives** : ${task.retryCount} retry(s) nécessaire(s)\n`;
    }
    conclusion += '\n';

    // Synthèse finale
    if (task.status === 'completed' && successRate === 1) {
      conclusion += `**Synthèse** : La tâche a été exécutée avec succès dans les temps prévus. Tous les objectifs ont été atteints.`;
    } else if (task.status === 'completed' && successRate > 0.5) {
      conclusion += `**Synthèse** : La tâche a été majoritairement réussie. Certaines étapes ont nécessité des ajustements, mais les objectifs principaux ont été atteints.`;
    } else if (task.status === 'failed') {
      conclusion += `**Synthèse** : La tâche n'a pas pu être complétée. Des erreurs sont survenues lors de l'exécution. Consultez les logs pour plus de détails.`;
    } else {
      conclusion += `**Synthèse** : La tâche est en cours d'exécution ou a été interrompue.`;
    }

    return conclusion;
  }

  /**
   * Obtient le nom lisible du type d'agent
   */
  private getAgentTypeName(type: AgentType): string {
    switch (type) {
      case 'research':
        return 'de Recherche';
      case 'analysis':
        return 'd\'Analyse';
      case 'creation':
        return 'de Création';
      default:
        return 'Autonome';
    }
  }

  /**
   * Génère un résumé textuel du rapport
   */
  generateSummary(report: AgentReport): string {
    const lines: string[] = [];

    lines.push(`=== Rapport d'exécution - Tâche ${report.taskId} ===`);
    lines.push(`Type d'agent: ${report.agentType}`);
    lines.push(`Statut: ${report.status}`);
    lines.push(`Durée totale: ${this.formatDuration(report.duration || 0)}`);
    lines.push(`Étapes: ${report.stepsCompleted}/${report.stepsTotal} complétées`);
    lines.push(`Taux de succès: ${Math.round(report.metrics.successRate * 100)}%`);
    
    if (report.retryCount > 0) {
      lines.push(`Retries: ${report.retryCount}`);
    }

    if (report.error) {
      lines.push(`Erreur: ${report.error}`);
    }

    if (report.recommendations && report.recommendations.length > 0) {
      lines.push(`\nRecommandations:`);
      report.recommendations.forEach((rec, i) => {
        lines.push(`  ${i + 1}. ${rec}`);
      });
    }

    return lines.join('\n');
  }

  /**
   * Formate une durée en millisecondes en format lisible
   */
  private formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(2)}s`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    }
  }
}

