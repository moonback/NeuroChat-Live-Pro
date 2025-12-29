/**
 * Outils de gestion du canvas collaboratif
 * Gère l'état et les opérations de dessin pour l'IA
 */

import { CanvasElement } from '../components/CanvasPanel';

// Store global pour les éléments du canvas (accessible depuis les fonctions)
let canvasElementsStore: CanvasElement[] = [];
let canvasUpdateCallback: ((elements: CanvasElement[]) => void) | null = null;

/**
 * Initialise le système de canvas avec un callback de mise à jour
 */
export function initCanvas(callback: (elements: CanvasElement[]) => void) {
  canvasUpdateCallback = callback;
}

/**
 * Obtient tous les éléments du canvas
 */
export function getCanvasElements(): CanvasElement[] {
  return [...canvasElementsStore];
}

/**
 * Met à jour les éléments du canvas et déclenche le callback
 */
function updateCanvas(elements: CanvasElement[]) {
  canvasElementsStore = elements;
  if (canvasUpdateCallback) {
    canvasUpdateCallback([...elements]);
  }
}

/**
 * Génère un ID unique pour un élément
 */
function generateId(): string {
  return `canvas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Dessine un élément sur le canvas
 */
export function drawOnCanvas(params: {
  type: 'line' | 'circle' | 'rectangle' | 'text' | 'freehand';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  endX?: number;
  endY?: number;
  color?: string;
  strokeWidth?: number;
  fontSize?: number;
  text?: string;
  points?: Array<{ x: number; y: number }>;
}): { success: boolean; message: string; elementId?: string } {
  try {
    const element: CanvasElement = {
      id: generateId(),
      type: params.type,
      x: params.x,
      y: params.y,
      width: params.width,
      height: params.height,
      radius: params.radius,
      endX: params.endX,
      endY: params.endY,
      color: params.color || '#0ea5e9',
      strokeWidth: params.strokeWidth || 2,
      fontSize: params.fontSize || 16,
      text: params.text,
      points: params.points,
    };

    const newElements = [...canvasElementsStore, element];
    updateCanvas(newElements);

    return {
      success: true,
      message: `${params.type} dessiné avec succès`,
      elementId: element.id,
    };
  } catch (error) {
    return {
      success: false,
      message: `Erreur lors du dessin: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
    };
  }
}

/**
 * Efface tout le canvas
 */
export function clearCanvas(): { success: boolean; message: string } {
  try {
    updateCanvas([]);
    return {
      success: true,
      message: 'Canvas effacé avec succès',
    };
  } catch (error) {
    return {
      success: false,
      message: `Erreur lors de l'effacement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
    };
  }
}

/**
 * Ajoute du texte au canvas
 */
export function addTextToCanvas(params: {
  x: number;
  y: number;
  text: string;
  color?: string;
  fontSize?: number;
}): { success: boolean; message: string; elementId?: string } {
  return drawOnCanvas({
    type: 'text',
    x: params.x,
    y: params.y,
    text: params.text,
    color: params.color,
    fontSize: params.fontSize,
  });
}

/**
 * Dessine un schéma complexe (combinaison de formes)
 * Accepte une description textuelle ou JSON
 */
export function drawSchema(params: {
  schema: string;
  x?: number;
  y?: number;
  color?: string;
}): { success: boolean; message: string; elementsCreated?: number } {
  try {
    const startX = params.x || 100;
    const startY = params.y || 100;
    const color = params.color || '#0ea5e9';
    let elementsCreated = 0;

    // Essayer de parser comme JSON d'abord
    try {
      const jsonSchema = JSON.parse(params.schema);
      if (Array.isArray(jsonSchema)) {
        jsonSchema.forEach((item: any) => {
          const element: CanvasElement = {
            id: generateId(),
            type: item.type || 'rectangle',
            x: (item.x || 0) + startX,
            y: (item.y || 0) + startY,
            width: item.width,
            height: item.height,
            radius: item.radius,
            color: item.color || color,
            strokeWidth: item.strokeWidth || 2,
            text: item.text,
            fontSize: item.fontSize || 16,
          };
          canvasElementsStore.push(element);
          elementsCreated++;
        });
        updateCanvas([...canvasElementsStore]);
        return {
          success: true,
          message: `Schéma dessiné avec ${elementsCreated} éléments`,
          elementsCreated,
        };
      }
    } catch {
      // Pas du JSON, traiter comme description textuelle
    }

    // Traitement de description textuelle simple
    // Exemple: "rectangle 50x30, circle radius 20, line from 0,0 to 50,50"
    const description = params.schema.toLowerCase();
    
    // Détection simple de formes communes
    if (description.includes('rectangle') || description.includes('rect')) {
      const widthMatch = description.match(/(\d+)\s*x\s*(\d+)/);
      const width = widthMatch ? parseInt(widthMatch[1]) : 50;
      const height = widthMatch ? parseInt(widthMatch[2]) : 50;
      
      drawOnCanvas({
        type: 'rectangle',
        x: startX,
        y: startY,
        width,
        height,
        color,
      });
      elementsCreated++;
    }

    if (description.includes('circle') || description.includes('cercle')) {
      const radiusMatch = description.match(/radius\s*:?\s*(\d+)/i) || description.match(/r\s*:?\s*(\d+)/i);
      const radius = radiusMatch ? parseInt(radiusMatch[1]) : 20;
      
      drawOnCanvas({
        type: 'circle',
        x: startX + 100,
        y: startY,
        radius,
        color,
      });
      elementsCreated++;
    }

    if (description.includes('line') || description.includes('ligne')) {
      const coordsMatch = description.match(/(\d+)\s*,\s*(\d+)\s+to\s+(\d+)\s*,\s*(\d+)/i);
      if (coordsMatch) {
        drawOnCanvas({
          type: 'line',
          x: startX + parseInt(coordsMatch[1]),
          y: startY + parseInt(coordsMatch[2]),
          endX: startX + parseInt(coordsMatch[3]),
          endY: startY + parseInt(coordsMatch[4]),
          color,
        });
        elementsCreated++;
      }
    }

    if (elementsCreated === 0) {
      // Si aucune forme détectée, créer un rectangle par défaut avec le texte
      addTextToCanvas({
        x: startX,
        y: startY,
        text: params.schema.substring(0, 50), // Limiter la longueur
        color,
      });
      elementsCreated++;
    }

    return {
      success: true,
      message: `Schéma créé avec ${elementsCreated} élément(s)`,
      elementsCreated,
    };
  } catch (error) {
    return {
      success: false,
      message: `Erreur lors de la création du schéma: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
    };
  }
}

/**
 * Charge des éléments depuis le localStorage
 */
export function loadCanvasFromStorage(): CanvasElement[] {
  try {
    const stored = localStorage.getItem('neurochat_canvas_elements');
    if (stored) {
      const elements = JSON.parse(stored) as CanvasElement[];
      canvasElementsStore = elements;
      if (canvasUpdateCallback) {
        canvasUpdateCallback([...elements]);
      }
      return elements;
    }
  } catch (error) {
    console.warn('[Canvas] Erreur lors du chargement depuis localStorage:', error);
  }
  return [];
}

/**
 * Sauvegarde les éléments dans le localStorage
 */
export function saveCanvasToStorage(): void {
  try {
    localStorage.setItem('neurochat_canvas_elements', JSON.stringify(canvasElementsStore));
  } catch (error) {
    console.warn('[Canvas] Erreur lors de la sauvegarde dans localStorage:', error);
  }
}

