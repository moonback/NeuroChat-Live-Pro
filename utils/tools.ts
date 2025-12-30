/**
 * Gestionnaire d'outils pour l'API Live Gemini
 * Définit les fonctions disponibles et gère leur exécution
 */

import { FunctionDeclaration, FunctionCall, FunctionResponse } from '../types';
import { AVAILABLE_PERSONALITIES } from '../constants';
import type { Personality } from '../types';

// Type pour le callback de changement de personnalité
export type PersonalityChangeCallback = (personality: Personality) => void;

// Type pour une conclusion sauvegardée
export interface SavedConclusion {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  markdown: string;
}

// Clé localStorage pour les conclusions
const CONCLUSIONS_STORAGE_KEY = 'neurochat_conclusions';

// Fonctions utilitaires pour gérer les conclusions sauvegardées
export function getSavedConclusions(): SavedConclusion[] {
  try {
    const json = localStorage.getItem(CONCLUSIONS_STORAGE_KEY);
    if (!json) return [];
    const conclusions = JSON.parse(json);
    return Array.isArray(conclusions) ? conclusions : [];
  } catch (error) {
    console.error('[Tools] Erreur lors de la récupération des conclusions:', error);
    return [];
  }
}

export function getSavedConclusionById(id: string): SavedConclusion | null {
  const conclusions = getSavedConclusions();
  return conclusions.find(c => c.id === id) || null;
}

export function deleteSavedConclusion(id: string): boolean {
  try {
    const conclusions = getSavedConclusions();
    const filtered = conclusions.filter(c => c.id !== id);
    if (filtered.length === conclusions.length) {
      return false; // Conclusion non trouvée
    }
    localStorage.setItem(CONCLUSIONS_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('[Tools] Erreur lors de la suppression de la conclusion:', error);
    return false;
  }
}

export function clearAllSavedConclusions(): void {
  try {
    localStorage.removeItem(CONCLUSIONS_STORAGE_KEY);
  } catch (error) {
    console.error('[Tools] Erreur lors de la suppression de toutes les conclusions:', error);
  }
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
    description: 'Sauvegarde une conclusion dans le localStorage. Utilise cette fonction quand l\'utilisateur demande à sauvegarder une conclusion, un résumé, ou un document de synthèse de la conversation.',
    parameters: {
      type: 'object',
      properties: {
        conclusion: {
          type: 'string',
          description: 'Le contenu de la conclusion à sauvegarder. Doit être une synthèse complète et bien formatée de la demande et de la réponse.'
        },
        title: {
          type: 'string',
          description: 'Le titre du document (optionnel, par défaut: "Conclusion")'
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
  
  // Gestion de la sauvegarde de conclusion dans localStorage
  if (name === 'generate_conclusion_markdown') {
    const { conclusion, title } = args || {};
    
    if (!conclusion || typeof conclusion !== 'string' || conclusion.trim().length === 0) {
      return {
        result: 'error',
        message: 'Le contenu de la conclusion est requis et ne peut pas être vide'
      };
    }
    
    try {
      const date = new Date();
      const documentTitle = title && title.trim() ? title.trim() : 'Conclusion';
      
      // Créer le contenu markdown formaté
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

      // Créer l'objet de conclusion
      const savedConclusion: SavedConclusion = {
        id: `conclusion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: documentTitle,
        content: conclusion,
        createdAt: date.toISOString(),
        markdown: markdownContent
      };
      
      // Récupérer les conclusions existantes
      const existingConclusionsJson = localStorage.getItem(CONCLUSIONS_STORAGE_KEY);
      let existingConclusions: SavedConclusion[] = [];
      
      if (existingConclusionsJson) {
        try {
          existingConclusions = JSON.parse(existingConclusionsJson);
          // Vérifier que c'est un tableau
          if (!Array.isArray(existingConclusions)) {
            existingConclusions = [];
          }
        } catch (e) {
          console.warn('[Tools] Erreur lors de la lecture des conclusions existantes, réinitialisation:', e);
          existingConclusions = [];
        }
      }
      
      // Ajouter la nouvelle conclusion au début du tableau
      existingConclusions.unshift(savedConclusion);
      
      // Limiter à 100 conclusions pour éviter de saturer le localStorage
      if (existingConclusions.length > 100) {
        existingConclusions = existingConclusions.slice(0, 100);
      }
      
      // Sauvegarder dans localStorage
      localStorage.setItem(CONCLUSIONS_STORAGE_KEY, JSON.stringify(existingConclusions));
      
      return {
        result: 'success',
        message: `Conclusion "${documentTitle}" sauvegardée avec succès dans le localStorage`,
        id: savedConclusion.id,
        title: documentTitle,
        totalConclusions: existingConclusions.length
      };
    } catch (error) {
      console.error('[Tools] Erreur lors de la sauvegarde de la conclusion:', error);
      
      // Gérer le cas où localStorage est plein
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        return {
          result: 'error',
          message: 'Le localStorage est plein. Veuillez supprimer d\'anciennes conclusions pour libérer de l\'espace.'
        };
      }
      
      return {
        result: 'error',
        message: `Erreur lors de la sauvegarde: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
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

