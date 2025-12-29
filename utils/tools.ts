/**
 * Gestionnaire d'outils pour l'API Live Gemini
 * Définit les fonctions disponibles et gère leur exécution
 */

import { FunctionDeclaration, FunctionCall, FunctionResponse } from '../types';
import {
  drawOnCanvas,
  clearCanvas,
  addTextToCanvas,
  drawSchema,
} from './canvasTools';

// Définitions des fonctions disponibles
export const AVAILABLE_FUNCTIONS: Record<string, FunctionDeclaration> = {
  draw_on_canvas: {
    name: 'draw_on_canvas',
    description: 'Dessine un élément sur le canvas collaboratif (ligne, cercle, rectangle, texte, ou dessin libre). Utilisez cette fonction pour montrer des schémas, diagrammes, ou annotations visuelles à l\'utilisateur.',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['line', 'circle', 'rectangle', 'text', 'freehand'],
          description: 'Type d\'élément à dessiner',
        },
        x: {
          type: 'number',
          description: 'Position X sur le canvas (en pixels)',
        },
        y: {
          type: 'number',
          description: 'Position Y sur le canvas (en pixels)',
        },
        width: {
          type: 'number',
          description: 'Largeur (pour rectangle)',
        },
        height: {
          type: 'number',
          description: 'Hauteur (pour rectangle)',
        },
        radius: {
          type: 'number',
          description: 'Rayon (pour cercle)',
        },
        endX: {
          type: 'number',
          description: 'Position X de fin (pour ligne)',
        },
        endY: {
          type: 'number',
          description: 'Position Y de fin (pour ligne)',
        },
        color: {
          type: 'string',
          description: 'Couleur en hexadécimal (ex: #0ea5e9)',
        },
        strokeWidth: {
          type: 'number',
          description: 'Épaisseur du trait (par défaut: 2)',
        },
        fontSize: {
          type: 'number',
          description: 'Taille de police (pour texte, par défaut: 16)',
        },
        text: {
          type: 'string',
          description: 'Texte à afficher (pour type text)',
        },
      },
      required: ['type', 'x', 'y'],
    },
  },
  clear_canvas: {
    name: 'clear_canvas',
    description: 'Efface tout le contenu du canvas collaboratif. Utilisez cette fonction pour recommencer à zéro.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  add_text_to_canvas: {
    name: 'add_text_to_canvas',
    description: 'Ajoute du texte ou une annotation sur le canvas. Utile pour étiqueter des éléments ou ajouter des explications.',
    parameters: {
      type: 'object',
      properties: {
        x: {
          type: 'number',
          description: 'Position X du texte (en pixels)',
        },
        y: {
          type: 'number',
          description: 'Position Y du texte (en pixels)',
        },
        text: {
          type: 'string',
          description: 'Texte à afficher',
        },
        color: {
          type: 'string',
          description: 'Couleur du texte en hexadécimal (ex: #ffffff)',
        },
        fontSize: {
          type: 'number',
          description: 'Taille de police (par défaut: 16)',
        },
      },
      required: ['x', 'y', 'text'],
    },
  },
  draw_schema: {
    name: 'draw_schema',
    description: 'Dessine un schéma complexe sur le canvas. Accepte une description textuelle ou un JSON décrivant plusieurs formes. Utilisez cette fonction pour créer des diagrammes, organigrammes, ou structures complexes.',
    parameters: {
      type: 'object',
      properties: {
        schema: {
          type: 'string',
          description: 'Description du schéma (texte ou JSON). Exemples: "rectangle 50x30, circle radius 20" ou JSON: [{"type":"rectangle","x":0,"y":0,"width":50,"height":30}]',
        },
        x: {
          type: 'number',
          description: 'Position X de départ (par défaut: 100)',
        },
        y: {
          type: 'number',
          description: 'Position Y de départ (par défaut: 100)',
        },
        color: {
          type: 'string',
          description: 'Couleur par défaut pour les éléments (en hexadécimal)',
        },
      },
      required: ['schema'],
    },
  },
};

// Gestionnaire d'exécution des fonctions
export async function executeFunction(functionCall: FunctionCall): Promise<any> {
  const { name, args = {} } = functionCall;
  
  console.log(`[Tools] Exécution de la fonction: ${name}`, args);
  
  // Fonctions canvas
  if (name === 'draw_on_canvas') {
    const result = drawOnCanvas({
      type: args.type as any,
      x: args.x as number,
      y: args.y as number,
      width: args.width as number | undefined,
      height: args.height as number | undefined,
      radius: args.radius as number | undefined,
      endX: args.endX as number | undefined,
      endY: args.endY as number | undefined,
      color: args.color as string | undefined,
      strokeWidth: args.strokeWidth as number | undefined,
      fontSize: args.fontSize as number | undefined,
      text: args.text as string | undefined,
    });
    return result;
  }

  if (name === 'clear_canvas') {
    const result = clearCanvas();
    return result;
  }

  if (name === 'add_text_to_canvas') {
    const result = addTextToCanvas({
      x: args.x as number,
      y: args.y as number,
      text: args.text as string,
      color: args.color as string | undefined,
      fontSize: args.fontSize as number | undefined,
    });
    return result;
  }

  if (name === 'draw_schema') {
    const result = drawSchema({
      schema: args.schema as string,
      x: args.x as number | undefined,
      y: args.y as number | undefined,
      color: args.color as string | undefined,
    });
    return result;
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

