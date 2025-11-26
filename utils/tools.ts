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
  },
  
  // Gestion d'agenda
  create_event: {
    name: 'create_event',
    description: 'Crée un nouvel événement dans l\'agenda (ex: horaire de travail)',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Titre de l\'événement'
        },
        date: {
          type: 'string',
          description: 'Date de l\'événement (format: YYYY-MM-DD)'
        },
        time: {
          type: 'string',
          description: 'Heure de début (format: HH:MM, optionnel)'
        },
        endTime: {
          type: 'string',
          description: 'Heure de fin (format: HH:MM, optionnel)'
        },
        duration: {
          type: 'number',
          description: 'Durée en minutes (optionnel, utilisé si endTime non fourni)'
        },
        description: {
          type: 'string',
          description: 'Description de l\'événement (optionnel)'
        },
        location: {
          type: 'string',
          description: 'Lieu de l\'événement (optionnel)'
        },
        type: {
          type: 'string',
          description: 'Type d\'événement: work, meeting, personal, etc. (optionnel)'
        }
      },
      required: ['title', 'date']
    }
  },
  get_events: {
    name: 'get_events',
    description: 'Récupère les événements de l\'agenda',
    parameters: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          description: 'Date de début (format: YYYY-MM-DD, optionnel)'
        },
        endDate: {
          type: 'string',
          description: 'Date de fin (format: YYYY-MM-DD, optionnel)'
        },
        date: {
          type: 'string',
          description: 'Date spécifique (format: YYYY-MM-DD, optionnel)'
        },
        type: {
          type: 'string',
          description: 'Filtrer par type d\'événement (optionnel)'
        }
      },
      required: []
    }
  },
  get_upcoming_events: {
    name: 'get_upcoming_events',
    description: 'Récupère les prochains événements',
    parameters: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          description: 'Nombre de jours à venir (défaut: 7)'
        }
      },
      required: []
    }
  },
  delete_event: {
    name: 'delete_event',
    description: 'Supprime un événement de l\'agenda',
    parameters: {
      type: 'object',
      properties: {
        eventId: {
          type: 'string',
          description: 'ID de l\'événement à supprimer'
        }
      },
      required: ['eventId']
    }
  },
  
  // Suivi des heures travaillées
  log_work_hours: {
    name: 'log_work_hours',
    description: 'Enregistre des heures travaillées',
    parameters: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date de travail (format: YYYY-MM-DD, défaut: aujourd\'hui)'
        },
        hours: {
          type: 'number',
          description: 'Nombre d\'heures travaillées'
        },
        project: {
          type: 'string',
          description: 'Nom du projet ou description du travail effectué'
        },
        description: {
          type: 'string',
          description: 'Description détaillée du travail (optionnel)'
        }
      },
      required: ['hours', 'project']
    }
  },
  get_work_hours: {
    name: 'get_work_hours',
    description: 'Récupère les heures travaillées',
    parameters: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          description: 'Date de début (format: YYYY-MM-DD, optionnel)'
        },
        endDate: {
          type: 'string',
          description: 'Date de fin (format: YYYY-MM-DD, optionnel)'
        },
        project: {
          type: 'string',
          description: 'Filtrer par projet (optionnel)'
        }
      },
      required: []
    }
  },
  get_work_hours_summary: {
    name: 'get_work_hours_summary',
    description: 'Récupère un résumé des heures travaillées (total par jour, semaine, mois)',
    parameters: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          description: 'Période: today, week, month, year, all (défaut: month)'
        }
      },
      required: []
    }
  },
  delete_work_hours: {
    name: 'delete_work_hours',
    description: 'Supprime une entrée d\'heures travaillées',
    parameters: {
      type: 'object',
      properties: {
        entryId: {
          type: 'string',
          description: 'ID de l\'entrée à supprimer'
        }
      },
      required: ['entryId']
    }
  },
  
  // Météo et informations
  get_weather_info: {
    name: 'get_weather_info',
    description: 'Récupère des informations météorologiques (simulation)',
    parameters: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: 'Nom de la ville (optionnel, défaut: position actuelle)'
        }
      },
      required: []
    }
  },
  
  // Conversion de devises
  convert_currency: {
    name: 'convert_currency',
    description: 'Convertit une devise vers une autre (taux simulés)',
    parameters: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: 'Montant à convertir'
        },
        from: {
          type: 'string',
          description: 'Devise source (ex: EUR, USD, GBP)'
        },
        to: {
          type: 'string',
          description: 'Devise cible (ex: EUR, USD, GBP)'
        }
      },
      required: ['amount', 'from', 'to']
    }
  },
  
  // Génération de contenu
  generate_password: {
    name: 'generate_password',
    description: 'Génère un mot de passe sécurisé',
    parameters: {
      type: 'object',
      properties: {
        length: {
          type: 'number',
          description: 'Longueur du mot de passe (défaut: 16)'
        },
        includeNumbers: {
          type: 'boolean',
          description: 'Inclure des chiffres (défaut: true)'
        },
        includeSymbols: {
          type: 'boolean',
          description: 'Inclure des symboles (défaut: true)'
        }
      },
      required: []
    }
  },
  generate_uuid: {
    name: 'generate_uuid',
    description: 'Génère un identifiant unique universel (UUID)',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  
  // Formatage et transformation
  format_text: {
    name: 'format_text',
    description: 'Formate un texte (uppercase, lowercase, capitalize)',
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Texte à formater'
        },
        format: {
          type: 'string',
          description: 'Format: uppercase, lowercase, capitalize, title'
        }
      },
      required: ['text', 'format']
    }
  },
  count_words: {
    name: 'count_words',
    description: 'Compte les mots, caractères et phrases dans un texte',
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Texte à analyser'
        }
      },
      required: ['text']
    }
  },
  
  // Calculs avancés
  calculate_percentage: {
    name: 'calculate_percentage',
    description: 'Calcule un pourcentage',
    parameters: {
      type: 'object',
      properties: {
        value: {
          type: 'number',
          description: 'Valeur de base'
        },
        percentage: {
          type: 'number',
          description: 'Pourcentage à calculer'
        }
      },
      required: ['value', 'percentage']
    }
  },
  calculate_tip: {
    name: 'calculate_tip',
    description: 'Calcule le pourboire et le total d\'un repas',
    parameters: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: 'Montant du repas'
        },
        tipPercent: {
          type: 'number',
          description: 'Pourcentage de pourboire (défaut: 15)'
        }
      },
      required: ['amount']
    }
  },
  
  // Utilitaires de date
  calculate_age: {
    name: 'calculate_age',
    description: 'Calcule l\'âge à partir d\'une date de naissance',
    parameters: {
      type: 'object',
      properties: {
        birthDate: {
          type: 'string',
          description: 'Date de naissance (format: YYYY-MM-DD)'
        }
      },
      required: ['birthDate']
    }
  },
  days_until: {
    name: 'days_until',
    description: 'Calcule le nombre de jours jusqu\'à une date',
    parameters: {
      type: 'object',
      properties: {
        targetDate: {
          type: 'string',
          description: 'Date cible (format: YYYY-MM-DD)'
        }
      },
      required: ['targetDate']
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
    
     // Gestion d'agenda
     case 'create_event':
       try {
         const title = args?.title || 'Événement sans titre';
         const date = args?.date || new Date().toISOString().split('T')[0];
         const time = args?.time || '09:00';
         const endTime = args?.endTime;
         const duration = args?.duration;
         const description = args?.description || '';
         const location = args?.location || '';
         const type = args?.type || 'personal';
         
         // Calculer l'heure de fin si non fournie
         let calculatedEndTime = endTime;
         if (!calculatedEndTime && duration) {
           const [hours, minutes] = time.split(':').map(Number);
           const startMinutes = hours * 60 + minutes;
           const endMinutes = startMinutes + duration;
           const endHours = Math.floor(endMinutes / 60);
           const endMins = endMinutes % 60;
           calculatedEndTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
         } else if (!calculatedEndTime) {
           // Par défaut, durée de 1 heure
           const [hours, minutes] = time.split(':').map(Number);
           const endHours = (hours + 1) % 24;
           calculatedEndTime = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
         }
         
         const event = {
           id: Date.now().toString(),
           title,
           date,
           time,
           endTime: calculatedEndTime,
           description,
           location,
           type,
           createdAt: new Date().toISOString()
         };
         
         const existingEvents = JSON.parse(localStorage.getItem('neurochat_events') || '[]');
         existingEvents.push(event);
         localStorage.setItem('neurochat_events', JSON.stringify(existingEvents));
         
         console.log(`[Tools] ✅ Événement créé: "${title}" le ${date} de ${time} à ${calculatedEndTime}`);
         return {
           result: 'ok',
           message: `Événement "${title}" créé avec succès`,
           eventId: event.id,
           event: event
         };
       } catch (error) {
         return {
           result: 'error',
           message: 'Erreur lors de la création de l\'événement'
         };
       }
       
     case 'get_events':
       try {
         const startDate = args?.startDate;
         const endDate = args?.endDate;
         const date = args?.date;
         const type = args?.type;
         
         let events = JSON.parse(localStorage.getItem('neurochat_events') || '[]');
         
         // Filtrer par date spécifique
         if (date) {
           events = events.filter((event: any) => event.date === date);
         }
         // Filtrer par plage de dates
         else if (startDate || endDate) {
           events = events.filter((event: any) => {
             const eventDate = event.date;
             if (startDate && eventDate < startDate) return false;
             if (endDate && eventDate > endDate) return false;
             return true;
           });
         }
         
         // Filtrer par type
         if (type) {
           events = events.filter((event: any) => event.type === type);
         }
         
         // Trier par date et heure
         events.sort((a: any, b: any) => {
           const dateCompare = a.date.localeCompare(b.date);
           if (dateCompare !== 0) return dateCompare;
           return a.time.localeCompare(b.time);
         });
         
         console.log(`[Tools] ✅ ${events.length} événement(s) récupéré(s)`);
         return {
           result: 'ok',
           events: events,
           count: events.length
         };
       } catch (error) {
         return {
           result: 'error',
           message: 'Erreur lors de la récupération des événements'
         };
       }
       
     case 'get_upcoming_events':
       try {
         const days = args?.days || 7;
         const today = new Date();
         today.setHours(0, 0, 0, 0);
         const futureDate = new Date(today);
         futureDate.setDate(today.getDate() + days);
         
         const todayStr = today.toISOString().split('T')[0];
         const futureDateStr = futureDate.toISOString().split('T')[0];
         
         let events = JSON.parse(localStorage.getItem('neurochat_events') || '[]');
         
         // Filtrer les événements à venir
         events = events.filter((event: any) => {
           const eventDate = event.date;
           // Inclure les événements d'aujourd'hui et futurs
           if (eventDate >= todayStr && eventDate <= futureDateStr) {
             // Si c'est aujourd'hui, vérifier l'heure
             if (eventDate === todayStr) {
               const [hours, minutes] = event.time.split(':').map(Number);
               const eventTime = new Date();
               eventTime.setHours(hours, minutes, 0, 0);
               return eventTime >= new Date();
             }
             return true;
           }
           return false;
         });
         
         // Trier par date et heure
         events.sort((a: any, b: any) => {
           const dateCompare = a.date.localeCompare(b.date);
           if (dateCompare !== 0) return dateCompare;
           return a.time.localeCompare(b.time);
         });
         
         console.log(`[Tools] ✅ ${events.length} événement(s) à venir récupéré(s)`);
         return {
           result: 'ok',
           events: events,
           count: events.length,
           period: `Prochains ${days} jours`
         };
       } catch (error) {
         return {
           result: 'error',
           message: 'Erreur lors de la récupération des événements à venir'
         };
       }
       
     case 'delete_event':
       try {
         const eventId = args?.eventId;
         if (!eventId) {
           return {
             result: 'error',
             message: 'ID d\'événement requis'
           };
         }
         
         const events = JSON.parse(localStorage.getItem('neurochat_events') || '[]');
         const filteredEvents = events.filter((e: any) => e.id !== eventId);
         
         if (events.length === filteredEvents.length) {
           return {
             result: 'error',
             message: `Événement avec l'ID ${eventId} non trouvé`
           };
         }
         
         localStorage.setItem('neurochat_events', JSON.stringify(filteredEvents));
         console.log(`[Tools] ✅ Événement supprimé: ${eventId}`);
         return {
           result: 'ok',
           message: 'Événement supprimé avec succès'
         };
       } catch (error) {
         return {
           result: 'error',
           message: 'Erreur lors de la suppression de l\'événement'
         };
       }
     
     // Suivi des heures travaillées
     case 'log_work_hours':
      try {
        const date = args?.date || new Date().toISOString().split('T')[0];
        const hours = args?.hours || 0;
        const project = args?.project || 'Travail';
        const description = args?.description || '';
        
        if (hours <= 0) {
          return {
            result: 'error',
            message: 'Le nombre d\'heures doit être supérieur à 0'
          };
        }
        
        const entry = {
          id: Date.now().toString(),
          date,
          hours,
          project,
          description,
          createdAt: new Date().toISOString()
        };
        
        const existingEntries = JSON.parse(localStorage.getItem('neurochat_work_hours') || '[]');
        existingEntries.push(entry);
        localStorage.setItem('neurochat_work_hours', JSON.stringify(existingEntries));
        
        console.log(`[Tools] ✅ Heures enregistrées: ${hours}h pour "${project}" le ${date}`);
        return {
          result: 'ok',
          message: `${hours} heure(s) enregistrée(s) pour "${project}" le ${date}`,
          entryId: entry.id
        };
      } catch (error) {
        return {
          result: 'error',
          message: 'Erreur lors de l\'enregistrement des heures'
        };
      }
      
    case 'get_work_hours':
      try {
        const startDate = args?.startDate;
        const endDate = args?.endDate;
        const project = args?.project;
        
        let entries = JSON.parse(localStorage.getItem('neurochat_work_hours') || '[]');
        
        // Filtrer par dates
        if (startDate || endDate) {
          entries = entries.filter((entry: any) => {
            const entryDate = entry.date;
            if (startDate && entryDate < startDate) return false;
            if (endDate && entryDate > endDate) return false;
            return true;
          });
        }
        
        // Filtrer par projet
        if (project) {
          entries = entries.filter((entry: any) => 
            entry.project.toLowerCase().includes(project.toLowerCase())
          );
        }
        
        // Trier par date (plus récent en premier)
        entries.sort((a: any, b: any) => b.date.localeCompare(a.date));
        
        const totalHours = entries.reduce((sum: number, entry: any) => sum + entry.hours, 0);
        
        console.log(`[Tools] ✅ ${entries.length} entrée(s) récupérée(s), total: ${totalHours}h`);
        return {
          result: 'ok',
          entries: entries,
          count: entries.length,
          totalHours: Number(totalHours.toFixed(2))
        };
      } catch (error) {
        return {
          result: 'error',
          message: 'Erreur lors de la récupération des heures'
        };
      }
      
    case 'get_work_hours_summary':
      try {
        const period = args?.period || 'month';
        const entries = JSON.parse(localStorage.getItem('neurochat_work_hours') || '[]');
        const today = new Date();
        let filteredEntries = entries;
        
        // Filtrer par période
        if (period !== 'all') {
          const startDate = new Date();
          switch (period) {
            case 'today':
              startDate.setHours(0, 0, 0, 0);
              break;
            case 'week':
              startDate.setDate(today.getDate() - 7);
              break;
            case 'month':
              startDate.setMonth(today.getMonth() - 1);
              break;
            case 'year':
              startDate.setFullYear(today.getFullYear() - 1);
              break;
          }
          
          filteredEntries = entries.filter((entry: any) => {
            const entryDate = new Date(entry.date);
            return entryDate >= startDate;
          });
        }
        
        // Calculer les totaux
        const totalHours = filteredEntries.reduce((sum: number, entry: any) => sum + entry.hours, 0);
        
        // Grouper par projet
        const byProject: Record<string, number> = {};
        filteredEntries.forEach((entry: any) => {
          byProject[entry.project] = (byProject[entry.project] || 0) + entry.hours;
        });
        
        // Grouper par jour
        const byDay: Record<string, number> = {};
        filteredEntries.forEach((entry: any) => {
          byDay[entry.date] = (byDay[entry.date] || 0) + entry.hours;
        });
        
        console.log(`[Tools] ✅ Résumé calculé pour la période: ${period}, total: ${totalHours}h`);
        return {
          result: 'ok',
          period: period,
          totalHours: Number(totalHours.toFixed(2)),
          entriesCount: filteredEntries.length,
          byProject: byProject,
          byDay: byDay
        };
      } catch (error) {
        return {
          result: 'error',
          message: 'Erreur lors du calcul du résumé'
        };
      }
      
    case 'delete_work_hours':
      try {
        const entryId = args?.entryId;
        if (!entryId) {
          return {
            result: 'error',
            message: 'ID d\'entrée requis'
          };
        }
        
        const entries = JSON.parse(localStorage.getItem('neurochat_work_hours') || '[]');
        const filteredEntries = entries.filter((e: any) => e.id !== entryId);
        
        if (entries.length === filteredEntries.length) {
          return {
            result: 'error',
            message: `Entrée avec l'ID ${entryId} non trouvée`
          };
        }
        
        localStorage.setItem('neurochat_work_hours', JSON.stringify(filteredEntries));
        console.log(`[Tools] ✅ Entrée supprimée: ${entryId}`);
        return {
          result: 'ok',
          message: 'Entrée supprimée avec succès'
        };
      } catch (error) {
        return {
          result: 'error',
          message: 'Erreur lors de la suppression de l\'entrée'
        };
      }
    
    // Météo et informations
    case 'get_weather_info':
      const city = args?.city || 'Votre position';
      // Simulation de données météo
      const weatherConditions = ['Ensoleillé', 'Nuageux', 'Pluvieux', 'Neigeux', 'Orageux'];
      const temperature = Math.floor(Math.random() * 30) + 10;
      const condition = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
      
      console.log(`[Tools] ✅ Météo récupérée pour: ${city}`);
      return {
        result: 'ok',
        city: city,
        temperature: temperature,
        condition: condition,
        humidity: Math.floor(Math.random() * 40) + 40,
        windSpeed: Math.floor(Math.random() * 20) + 5,
        note: 'Données simulées - Dans une vraie application, utiliser une API météo'
      };
    
    // Conversion de devises
    case 'convert_currency':
      try {
        const amount = args?.amount || 0;
        const from = (args?.from || 'EUR').toUpperCase();
        const to = (args?.to || 'USD').toUpperCase();
        
        // Taux de change simulés (approximatifs)
        const rates: Record<string, number> = {
          'EUR': 1.0,
          'USD': 1.08,
          'GBP': 0.85,
          'JPY': 160.0,
          'CAD': 1.47,
          'AUD': 1.65,
          'CHF': 0.97
        };
        
        const fromRate = rates[from] || 1.0;
        const toRate = rates[to] || 1.0;
        const convertedAmount = (amount / fromRate) * toRate;
        
        console.log(`[Tools] ✅ Conversion: ${amount} ${from} = ${convertedAmount.toFixed(2)} ${to}`);
        return {
          result: 'ok',
          originalAmount: amount,
          originalCurrency: from,
          convertedAmount: Number(convertedAmount.toFixed(2)),
          convertedCurrency: to,
          rate: Number((toRate / fromRate).toFixed(4)),
          note: 'Taux simulés - Dans une vraie application, utiliser une API de change'
        };
      } catch (error) {
        return {
          result: 'error',
          message: 'Erreur lors de la conversion de devise'
        };
      }
    
    // Génération de contenu
    case 'generate_password':
      const length = args?.length || 16;
      const includeNumbers = args?.includeNumbers !== false;
      const includeSymbols = args?.includeSymbols !== false;
      
      const lowercase = 'abcdefghijklmnopqrstuvwxyz';
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const numbers = '0123456789';
      const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      
      let charset = lowercase + uppercase;
      if (includeNumbers) charset += numbers;
      if (includeSymbols) charset += symbols;
      
      let password = '';
      for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
      }
      
      console.log(`[Tools] ✅ Mot de passe généré (${length} caractères)`);
      return {
        result: 'ok',
        password: password,
        length: length,
        includesNumbers: includeNumbers,
        includesSymbols: includeSymbols
      };
      
    case 'generate_uuid':
      const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      
      console.log(`[Tools] ✅ UUID généré: ${uuid}`);
      return {
        result: 'ok',
        uuid: uuid
      };
    
    // Formatage et transformation
    case 'format_text':
      try {
        const text = args?.text || '';
        const format = (args?.format || 'lowercase').toLowerCase();
        
        let formatted = text;
        switch (format) {
          case 'uppercase':
            formatted = text.toUpperCase();
            break;
          case 'lowercase':
            formatted = text.toLowerCase();
            break;
          case 'capitalize':
            formatted = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
            break;
          case 'title':
            formatted = text.split(' ').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');
            break;
          default:
            return {
              result: 'error',
              message: `Format non supporté: ${format}`
            };
        }
        
        console.log(`[Tools] ✅ Texte formaté: ${format}`);
        return {
          result: 'ok',
          original: text,
          formatted: formatted,
          format: format
        };
      } catch (error) {
        return {
          result: 'error',
          message: 'Erreur lors du formatage du texte'
        };
      }
      
    case 'count_words':
      try {
        const text = args?.text || '';
        const words = text.trim().split(/\s+/).filter(w => w.length > 0);
        const characters = text.length;
        const charactersNoSpaces = text.replace(/\s/g, '').length;
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
        
        console.log(`[Tools] ✅ Texte analysé: ${words.length} mots`);
        return {
          result: 'ok',
          words: words.length,
          characters: characters,
          charactersNoSpaces: charactersNoSpaces,
          sentences: sentences.length,
          paragraphs: paragraphs.length || 1
        };
      } catch (error) {
        return {
          result: 'error',
          message: 'Erreur lors de l\'analyse du texte'
        };
      }
    
    // Calculs avancés
    case 'calculate_percentage':
      try {
        const value = args?.value || 0;
        const percentage = args?.percentage || 0;
        const result = (value * percentage) / 100;
        
        console.log(`[Tools] ✅ Pourcentage calculé: ${percentage}% de ${value} = ${result}`);
        return {
          result: 'ok',
          value: value,
          percentage: percentage,
          calculatedValue: Number(result.toFixed(2))
        };
      } catch (error) {
        return {
          result: 'error',
          message: 'Erreur lors du calcul du pourcentage'
        };
      }
      
    case 'calculate_tip':
      try {
        const amount = args?.amount || 0;
        const tipPercent = args?.tipPercent || 15;
        const tip = (amount * tipPercent) / 100;
        const total = amount + tip;
        
        console.log(`[Tools] ✅ Pourboire calculé: ${tipPercent}% de ${amount}`);
        return {
          result: 'ok',
          amount: amount,
          tipPercent: tipPercent,
          tip: Number(tip.toFixed(2)),
          total: Number(total.toFixed(2))
        };
      } catch (error) {
        return {
          result: 'error',
          message: 'Erreur lors du calcul du pourboire'
        };
      }
    
    // Utilitaires de date
    case 'calculate_age':
      try {
        const birthDate = args?.birthDate;
        if (!birthDate) {
          return {
            result: 'error',
            message: 'Date de naissance requise (format: YYYY-MM-DD)'
          };
        }
        
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
        
        console.log(`[Tools] ✅ Âge calculé: ${age} ans`);
        return {
          result: 'ok',
          birthDate: birthDate,
          age: age,
          birthDateFormatted: birth.toLocaleDateString('fr-FR')
        };
      } catch (error) {
        return {
          result: 'error',
          message: 'Format de date invalide. Utilisez YYYY-MM-DD'
        };
      }
      
    case 'days_until':
      try {
        const targetDate = args?.targetDate;
        if (!targetDate) {
          return {
            result: 'error',
            message: 'Date cible requise (format: YYYY-MM-DD)'
          };
        }
        
        const target = new Date(targetDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        target.setHours(0, 0, 0, 0);
        
        const diffTime = target.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        console.log(`[Tools] ✅ Jours calculés: ${diffDays} jours`);
        return {
          result: 'ok',
          targetDate: targetDate,
          days: diffDays,
          targetDateFormatted: target.toLocaleDateString('fr-FR'),
          isPast: diffDays < 0
        };
      } catch (error) {
        return {
          result: 'error',
          message: 'Format de date invalide. Utilisez YYYY-MM-DD'
        };
      }
      
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

