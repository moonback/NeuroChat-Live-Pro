/**
 * Gestionnaire d'outils pour l'API Live Gemini
 * Définit les fonctions disponibles et gère leur exécution
 */

import { FunctionDeclaration, FunctionCall, FunctionResponse } from '../types';

// Définitions des fonctions disponibles
export const AVAILABLE_FUNCTIONS: Record<string, FunctionDeclaration> = {
  // Contrôle de l'environnement
  turn_on_the_lights: {
    name: 'turn_on_the_lights',
    description: 'Active les lumières dans l\'environnement',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  turn_off_the_lights: {
    name: 'turn_off_the_lights',
    description: 'Désactive les lumières dans l\'environnement',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  
  // Temps et dates
  get_current_time: {
    name: 'get_current_time',
    description: 'Récupère l\'heure actuelle avec la date',
    parameters: {
      type: 'object',
      properties: {
        timezone: {
          type: 'string',
          description: 'Fuseau horaire (optionnel, ex: "Europe/Paris")'
        }
      },
      required: []
    }
  },
  get_current_date: {
    name: 'get_current_date',
    description: 'Récupère la date actuelle',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  
  // Rappels et timers
  set_reminder: {
    name: 'set_reminder',
    description: 'Définit un rappel pour plus tard',
    parameters: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Le message du rappel'
        },
        minutes: {
          type: 'number',
          description: 'Nombre de minutes avant le rappel'
        }
      },
      required: ['message', 'minutes']
    }
  },
  start_timer: {
    name: 'start_timer',
    description: 'Démarre un minuteur (chronomètre)',
    parameters: {
      type: 'object',
      properties: {
        duration: {
          type: 'number',
          description: 'Durée en secondes'
        },
        label: {
          type: 'string',
          description: 'Label du minuteur (optionnel)'
        }
      },
      required: ['duration']
    }
  },
  
  // Calculatrice
  calculate: {
    name: 'calculate',
    description: 'Effectue un calcul mathématique',
    parameters: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'Expression mathématique à calculer (ex: "2 + 2", "10 * 5", "sqrt(16)")'
        }
      },
      required: ['expression']
    }
  },
  
  // Conversion d'unités
  convert_units: {
    name: 'convert_units',
    description: 'Convertit des unités (température, longueur, poids, etc.)',
    parameters: {
      type: 'object',
      properties: {
        value: {
          type: 'number',
          description: 'Valeur à convertir'
        },
        from: {
          type: 'string',
          description: 'Unité source (ex: "celsius", "kilometers", "kilograms")'
        },
        to: {
          type: 'string',
          description: 'Unité cible (ex: "fahrenheit", "miles", "pounds")'
        }
      },
      required: ['value', 'from', 'to']
    }
  },
  
  // Notes et mémos
  save_note: {
    name: 'save_note',
    description: 'Sauvegarde une note dans le stockage local',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Titre de la note'
        },
        content: {
          type: 'string',
          description: 'Contenu de la note'
        }
      },
      required: ['title', 'content']
    }
  },
  get_notes: {
    name: 'get_notes',
    description: 'Récupère toutes les notes sauvegardées',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  delete_note: {
    name: 'delete_note',
    description: 'Supprime une note spécifique par son ID ou son titre',
    parameters: {
      type: 'object',
      properties: {
        noteId: {
          type: 'string',
          description: 'ID de la note à supprimer'
        },
        title: {
          type: 'string',
          description: 'Titre de la note à supprimer (alternative à noteId)'
        }
      },
      required: []
    }
  },
  delete_all_notes: {
    name: 'delete_all_notes',
    description: 'Supprime toutes les notes sauvegardées',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  
  // Génération de texte
  generate_summary: {
    name: 'generate_summary',
    description: 'Génère un résumé d\'un texte',
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Texte à résumer'
        },
        max_length: {
          type: 'number',
          description: 'Longueur maximale du résumé en mots (optionnel)'
        }
      },
      required: ['text']
    }
  },
  
  // Utilitaires
  generate_random_number: {
    name: 'generate_random_number',
    description: 'Génère un nombre aléatoire dans une plage',
    parameters: {
      type: 'object',
      properties: {
        min: {
          type: 'number',
          description: 'Valeur minimale'
        },
        max: {
          type: 'number',
          description: 'Valeur maximale'
        }
      },
      required: ['min', 'max']
    }
  },
  flip_coin: {
    name: 'flip_coin',
    description: 'Lance une pièce (pile ou face)',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  roll_dice: {
    name: 'roll_dice',
    description: 'Lance un ou plusieurs dés',
    parameters: {
      type: 'object',
      properties: {
        sides: {
          type: 'number',
          description: 'Nombre de faces du dé (défaut: 6)'
        },
        count: {
          type: 'number',
          description: 'Nombre de dés à lancer (défaut: 1)'
        }
      },
      required: []
    }
  }
};

// Gestionnaire d'exécution des fonctions
export async function executeFunction(functionCall: FunctionCall): Promise<any> {
  const { name, args } = functionCall;
  
  console.log(`[Tools] Exécution de la fonction: ${name}`, args);
  
  switch (name) {
    // Contrôle de l'environnement
    case 'turn_on_the_lights':
      console.log('[Tools] ✅ Lumières activées');
      return { result: 'ok', message: 'Les lumières ont été activées' };
      
    case 'turn_off_the_lights':
      console.log('[Tools] ✅ Lumières désactivées');
      return { result: 'ok', message: 'Les lumières ont été désactivées' };
    
    // Temps et dates
    case 'get_current_time':
      const now = new Date();
      const timeString = now.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
      const dateString = now.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      console.log(`[Tools] ✅ Heure actuelle: ${timeString}`);
      return { 
        result: 'ok', 
        time: timeString,
        date: dateString,
        timestamp: now.toISOString()
      };
      
    case 'get_current_date':
      const today = new Date();
      const dateStr = today.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      console.log(`[Tools] ✅ Date actuelle: ${dateStr}`);
      return {
        result: 'ok',
        date: dateStr,
        timestamp: today.toISOString()
      };
    
    // Rappels et timers
    case 'set_reminder':
      const message = args?.message || 'Rappel';
      const minutes = args?.minutes || 0;
      const reminderTime = new Date(Date.now() + minutes * 60 * 1000);
      console.log(`[Tools] ✅ Rappel défini: "${message}" dans ${minutes} minutes (${reminderTime.toLocaleTimeString('fr-FR')})`);
      
      setTimeout(() => {
        console.log(`[Tools] 🔔 Rappel: ${message}`);
        // Notification visuelle pourrait être ajoutée ici
      }, minutes * 60 * 1000);
      
      return { 
        result: 'ok', 
        message: `Rappel défini: "${message}" dans ${minutes} minutes`,
        scheduledTime: reminderTime.toISOString()
      };
      
    case 'start_timer':
      const duration = args?.duration || 0;
      const label = args?.label || 'Minuteur';
      const timerEnd = new Date(Date.now() + duration * 1000);
      console.log(`[Tools] ✅ Minuteur démarré: "${label}" pour ${duration} secondes`);
      
      setTimeout(() => {
        console.log(`[Tools] ⏰ Minuteur terminé: ${label}`);
      }, duration * 1000);
      
      return {
        result: 'ok',
        message: `Minuteur "${label}" démarré pour ${duration} secondes`,
        endTime: timerEnd.toISOString()
      };
    
    // Calculatrice
    case 'calculate':
      try {
        const expression = args?.expression || '';
        // Sécuriser l'évaluation en utilisant Function au lieu de eval
        // Note: Dans un environnement de production, utiliser une bibliothèque de parsing mathématique
        const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
        const result = Function(`"use strict"; return (${sanitized})`)();
        console.log(`[Tools] ✅ Calcul: ${expression} = ${result}`);
        return {
          result: 'ok',
          expression: expression,
          value: result
        };
      } catch (error) {
        console.error('[Tools] ❌ Erreur de calcul:', error);
        return {
          result: 'error',
          message: 'Expression mathématique invalide'
        };
      }
    
    // Conversion d'unités
    case 'convert_units':
      try {
        const value = args?.value || 0;
        const from = (args?.from || '').toLowerCase();
        const to = (args?.to || '').toLowerCase();
        
        let convertedValue = value;
        
        // Température
        if (from === 'celsius' && to === 'fahrenheit') {
          convertedValue = (value * 9/5) + 32;
        } else if (from === 'fahrenheit' && to === 'celsius') {
          convertedValue = (value - 32) * 5/9;
        }
        // Longueur
        else if (from === 'kilometers' && to === 'miles') {
          convertedValue = value * 0.621371;
        } else if (from === 'miles' && to === 'kilometers') {
          convertedValue = value * 1.60934;
        } else if (from === 'meters' && to === 'feet') {
          convertedValue = value * 3.28084;
        } else if (from === 'feet' && to === 'meters') {
          convertedValue = value * 0.3048;
        }
        // Poids
        else if (from === 'kilograms' && to === 'pounds') {
          convertedValue = value * 2.20462;
        } else if (from === 'pounds' && to === 'kilograms') {
          convertedValue = value * 0.453592;
        }
        // Volume
        else if (from === 'liters' && to === 'gallons') {
          convertedValue = value * 0.264172;
        } else if (from === 'gallons' && to === 'liters') {
          convertedValue = value * 3.78541;
        }
        else {
          return {
            result: 'error',
            message: `Conversion de ${from} vers ${to} non supportée`
          };
        }
        
        console.log(`[Tools] ✅ Conversion: ${value} ${from} = ${convertedValue.toFixed(2)} ${to}`);
        return {
          result: 'ok',
          originalValue: value,
          originalUnit: from,
          convertedValue: Number(convertedValue.toFixed(2)),
          convertedUnit: to
        };
      } catch (error) {
        return {
          result: 'error',
          message: 'Erreur lors de la conversion'
        };
      }
    
    // Notes et mémos
    case 'save_note':
      try {
        const title = args?.title || 'Note sans titre';
        const content = args?.content || '';
        const note = {
          id: Date.now().toString(),
          title,
          content,
          createdAt: new Date().toISOString()
        };
        
        // Sauvegarder dans localStorage
        const existingNotes = JSON.parse(localStorage.getItem('neurochat_notes') || '[]');
        existingNotes.push(note);
        localStorage.setItem('neurochat_notes', JSON.stringify(existingNotes));
        
        console.log(`[Tools] ✅ Note sauvegardée: "${title}"`);
        return {
          result: 'ok',
          message: `Note "${title}" sauvegardée avec succès`,
          noteId: note.id
        };
      } catch (error) {
        return {
          result: 'error',
          message: 'Erreur lors de la sauvegarde de la note'
        };
      }
      
    case 'get_notes':
      try {
        const notes = JSON.parse(localStorage.getItem('neurochat_notes') || '[]');
        console.log(`[Tools] ✅ ${notes.length} note(s) récupérée(s)`);
        return {
          result: 'ok',
          notes: notes,
          count: notes.length
        };
      } catch (error) {
        return {
          result: 'error',
          message: 'Erreur lors de la récupération des notes'
        };
      }
      
    case 'delete_note':
      try {
        const noteId = args?.noteId;
        const title = args?.title;
        
        if (!noteId && !title) {
          return {
            result: 'error',
            message: 'Veuillez fournir un ID ou un titre de note à supprimer'
          };
        }
        
        const notes = JSON.parse(localStorage.getItem('neurochat_notes') || '[]');
        const initialLength = notes.length;
        
        // Filtrer les notes à garder
        const filteredNotes = notes.filter((note: any) => {
          if (noteId) {
            return note.id !== noteId;
          } else if (title) {
            return note.title.toLowerCase() !== title.toLowerCase();
          }
          return true;
        });
        
        const deletedCount = initialLength - filteredNotes.length;
        
        if (deletedCount === 0) {
          return {
            result: 'error',
            message: noteId 
              ? `Aucune note trouvée avec l'ID: ${noteId}`
              : `Aucune note trouvée avec le titre: ${title}`
          };
        }
        
        localStorage.setItem('neurochat_notes', JSON.stringify(filteredNotes));
        console.log(`[Tools] ✅ Note supprimée: ${noteId || title}`);
        
        return {
          result: 'ok',
          message: `Note supprimée avec succès`,
          deletedCount: deletedCount,
          remainingCount: filteredNotes.length
        };
      } catch (error) {
        return {
          result: 'error',
          message: 'Erreur lors de la suppression de la note'
        };
      }
      
    case 'delete_all_notes':
      try {
        const notes = JSON.parse(localStorage.getItem('neurochat_notes') || '[]');
        const count = notes.length;
        
        localStorage.setItem('neurochat_notes', JSON.stringify([]));
        console.log(`[Tools] ✅ ${count} note(s) supprimée(s)`);
        
        return {
          result: 'ok',
          message: `Toutes les notes ont été supprimées`,
          deletedCount: count
        };
      } catch (error) {
        return {
          result: 'error',
          message: 'Erreur lors de la suppression de toutes les notes'
        };
      }
    
    // Génération de texte
    case 'generate_summary':
      const text = args?.text || '';
      const maxLength = args?.max_length || 100;
      // Simulation d'un résumé simple (dans une vraie app, utiliser une API de résumé)
      const words = text.split(' ');
      const summary = words.slice(0, maxLength).join(' ');
      const isTruncated = words.length > maxLength;
      
      console.log(`[Tools] ✅ Résumé généré (${summary.length} caractères)`);
      return {
        result: 'ok',
        summary: summary + (isTruncated ? '...' : ''),
        originalLength: text.length,
        summaryLength: summary.length
      };
    
    // Utilitaires
    case 'generate_random_number':
      const min = args?.min || 0;
      const max = args?.max || 100;
      const random = Math.floor(Math.random() * (max - min + 1)) + min;
      console.log(`[Tools] ✅ Nombre aléatoire: ${random} (entre ${min} et ${max})`);
      return {
        result: 'ok',
        number: random,
        range: { min, max }
      };
      
    case 'flip_coin':
      const coinResult = Math.random() < 0.5 ? 'pile' : 'face';
      console.log(`[Tools] ✅ Pièce lancée: ${coinResult}`);
      return {
        result: 'ok',
        outcome: coinResult
      };
      
    case 'roll_dice':
      const sides = args?.sides || 6;
      const count = args?.count || 1;
      const rolls: number[] = [];
      for (let i = 0; i < count; i++) {
        rolls.push(Math.floor(Math.random() * sides) + 1);
      }
      const total = rolls.reduce((a, b) => a + b, 0);
      console.log(`[Tools] ✅ Dé(s) lancé(s): ${rolls.join(', ')} (total: ${total})`);
      return {
        result: 'ok',
        rolls: rolls,
        total: total,
        sides: sides,
        count: count
      };
      
    default:
      console.warn(`[Tools] ⚠️ Fonction inconnue: ${name}`);
      return { 
        result: 'error', 
        message: `Fonction ${name} non implémentée` 
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

