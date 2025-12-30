/**
 * Gestionnaire d'outils pour l'API Live Gemini
 * Définit les fonctions disponibles et gère leur exécution
 */

import { FunctionDeclaration, FunctionCall, FunctionResponse } from '../types';
import { AVAILABLE_PERSONALITIES } from '../constants';
import type { Personality } from '../types';

// Type pour le callback de changement de personnalité
export type PersonalityChangeCallback = (personality: Personality) => void;

// Fonction utilitaire pour télécharger un fichier
function downloadFile(content: string, filename: string, mimeType: string = 'text/markdown') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Définitions des fonctions disponibles
export const AVAILABLE_FUNCTIONS: Record<string, FunctionDeclaration> = {
  change_personality: {
    name: 'change_personality',
    description: 'Change la personnalité de l\'assistant. L\'utilisateur peut demander à changer de personnalité en mentionnant le nom ou l\'ID de la personnalité souhaitée. Les personnalités disponibles sont: NeuroChat, Coach Neuro, Coach Scolaire, Analyste, Vision, Traducteur.',
    parameters: {
      type: 'object',
      properties: {
        personalityId: {
          type: 'string',
          description: 'L\'ID de la personnalité (ex: "neurochat-pro", "general", "learning-buddy", "intelligence-analyst", "omnivision", "parrot-translator")'
        },
        personalityName: {
          type: 'string',
          description: 'Le nom de la personnalité (ex: "NeuroChat Pro", "Assistant TDAH/HPI", "Copain d\'Apprentissage", "Analyste Renseignement", "OmniVision", "Perroquet Polyglotte")'
        }
      },
      required: []
    }
  },
  generate_conclusion_markdown: {
    name: 'generate_conclusion_markdown',
    description: 'Génère et télécharge un fichier markdown avec la conclusion de la demande de l\'utilisateur. Utilise cette fonction quand l\'utilisateur demande à télécharger ou sauvegarder une conclusion, un résumé, ou un document de synthèse de la conversation.',
    parameters: {
      type: 'object',
      properties: {
        conclusion: {
          type: 'string',
          description: 'Le contenu de la conclusion à inclure dans le fichier markdown. Doit être une synthèse complète et bien formatée de la demande et de la réponse.'
        },
        title: {
          type: 'string',
          description: 'Le titre du document (optionnel, par défaut: "Conclusion")'
        },
        filename: {
          type: 'string',
          description: 'Le nom du fichier à télécharger (optionnel, par défaut: "conclusion-[date].md")'
        }
      },
      required: ['conclusion']
    }
  }
};

// Gestionnaire d'exécution des fonctions
export async function executeFunction(
  functionCall: FunctionCall,
  options?: {
    onPersonalityChange?: PersonalityChangeCallback;
  }
): Promise<any> {
  const { name, args } = functionCall;
  
  console.log(`[Tools] Exécution de la fonction: ${name}`, args);
  
  // Gestion du changement de personnalité
  if (name === 'change_personality') {
    const { personalityId, personalityName } = args || {};
    
    if (!personalityId && !personalityName) {
      return {
        result: 'error',
        message: 'Veuillez spécifier soit personalityId soit personalityName'
      };
    }
    
    // Rechercher la personnalité par ID ou nom
    let targetPersonality: Personality | undefined;
    
    if (personalityId) {
      targetPersonality = AVAILABLE_PERSONALITIES.find(
        p => p.id.toLowerCase() === personalityId.toLowerCase()
      );
    }
    
    if (!targetPersonality && personalityName) {
      targetPersonality = AVAILABLE_PERSONALITIES.find(
        p => p.name.toLowerCase().includes(personalityName.toLowerCase()) ||
             personalityName.toLowerCase().includes(p.name.toLowerCase())
      );
    }
    
    if (!targetPersonality) {
      const availableNames = AVAILABLE_PERSONALITIES.map(p => `- ${p.name} (${p.id})`).join('\n');
      return {
        result: 'error',
        message: `Personnalité non trouvée. Personnalités disponibles:\n${availableNames}`
      };
    }
    
    // Appeler le callback si disponible
    if (options?.onPersonalityChange) {
      options.onPersonalityChange(targetPersonality);
      return {
        result: 'success',
        message: `Personnalité changée avec succès vers "${targetPersonality.name}"`,
        personality: {
          id: targetPersonality.id,
          name: targetPersonality.name,
          description: targetPersonality.description
        }
      };
    } else {
      return {
        result: 'error',
        message: 'Le changement de personnalité n\'est pas disponible actuellement'
      };
    }
  }
  
  // Gestion de la génération de fichier markdown avec conclusion
  if (name === 'generate_conclusion_markdown') {
    const { conclusion, title, filename } = args || {};
    
    if (!conclusion || typeof conclusion !== 'string' || conclusion.trim().length === 0) {
      return {
        result: 'error',
        message: 'Le contenu de la conclusion est requis et ne peut pas être vide'
      };
    }
    
    try {
      // Générer le nom de fichier avec date si non fourni
      const date = new Date();
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
      const defaultFilename = `conclusion-${dateStr}-${timeStr}.md`;
      const finalFilename = filename && filename.trim() 
        ? (filename.endsWith('.md') ? filename : `${filename}.md`)
        : defaultFilename;
      
      // Créer le contenu markdown formaté
      const documentTitle = title && title.trim() ? title.trim() : 'Conclusion';
      const markdownContent = `# ${documentTitle}

**Date:** ${date.toLocaleDateString('fr-FR', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}

---

${conclusion}

---

*Document généré par NeuroChat Live Pro*
`;

      // Télécharger le fichier
      downloadFile(markdownContent, finalFilename);
      
      return {
        result: 'success',
        message: `Fichier markdown "${finalFilename}" téléchargé avec succès`,
        filename: finalFilename,
        title: documentTitle
      };
    } catch (error) {
      console.error('[Tools] Erreur lors de la génération du fichier markdown:', error);
      return {
        result: 'error',
        message: `Erreur lors de la génération du fichier: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }
  
  console.warn(`[Tools] ⚠️ Fonction inconnue: ${name}`);
  return { 
    result: 'error', 
    message: `Fonction ${name} non implémentée` 
  };
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

