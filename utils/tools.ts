/**
 * Gestionnaire d'outils pour l'API Live Gemini
 * Définit les fonctions disponibles et gère leur exécution
 */

import { FunctionDeclaration, FunctionCall, FunctionResponse } from '../types';
import { AVAILABLE_PERSONALITIES } from '../constants';
import type { Personality } from '../types';

// Type pour le callback de changement de personnalité
export type PersonalityChangeCallback = (personality: Personality) => void;

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

