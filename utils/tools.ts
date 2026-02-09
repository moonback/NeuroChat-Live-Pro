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
    description: 'Change la personnalité de l\'assistant. L\'utilisateur peut demander à changer de personnalité en mentionnant le nom ou l\'ID de la personnalité souhaitée. Les personnalités disponibles sont: NeuroChat Pro.',
    parameters: {
      type: 'object',
      properties: {
        personalityId: {
          type: 'string',
          description: 'L\'ID de la personnalité (ex: "neurochat-pro")'
        },
        personalityName: {
          type: 'string',
          description: 'Le nom de la personnalité (ex: "NeuroChat Pro")'
        }
      },
      required: []
    }
  },
  generate_conclusion_markdown: {
    name: 'generate_conclusion_markdown',
    description: 'Sauvegarde une conclusion complète dans le localStorage. Utilise cette fonction quand l\'utilisateur demande à sauvegarder une conclusion, un résumé, ou un document de synthèse de la conversation. La conclusion doit être COMPLÈTE et inclure tous les détails importants de la conversation.',
    parameters: {
      type: 'object',
      properties: {
        conclusion: {
          type: 'string',
          description: 'Le contenu COMPLET de la conclusion à sauvegarder. Doit inclure : 1) Le contexte et la demande initiale de l\'utilisateur, 2) Tous les points importants discutés, 3) Les solutions, réponses ou informations fournies, 4) Les conclusions et recommandations, 5) Tous les détails pertinents de la conversation. La conclusion doit être exhaustive et bien structurée avec des sections claires.'
        },
        title: {
          type: 'string',
          description: 'Le titre du document (optionnel, par défaut: "Conclusion")'
        }
      },
      required: ['conclusion']
    }
  },
  create_formatted_page: {
    name: 'create_formatted_page',
    description: 'Crée et affiche immédiatement une nouvelle page formatée avec du contenu markdown. Utilisez cet outil quand l\'utilisateur demande d\'écrire quelque chose, de créer un rapport, une note, ou de formaliser des informations. La page s\'ouvrira automatiquement pour l\'utilisateur.',
    parameters: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'Le contenu markdown complet et formaté de la page.'
        },
        title: {
          type: 'string',
          description: 'Le titre de la page (ex: "Rapport d\'analyse", "Note de service")'
        }
      },
      required: ['content', 'title']
    }
  },
  download_document: {
    name: 'download_document',
    description: 'Télécharge un document sauvegardé ou du contenu markdown directement sur l\'ordinateur de l\'utilisateur (dossier Téléchargements). Utilisez cet outil quand l\'utilisateur demande de télécharger un écrit.',
    parameters: {
      type: 'object',
      properties: {
        documentId: {
          type: 'string',
          description: 'L\'ID du document à télécharger (optionnel si content est fourni)'
        },
        content: {
          type: 'string',
          description: 'Le contenu markdown à télécharger (si documentId n\'est pas fourni)'
        },
        filename: {
          type: 'string',
          description: 'Le nom du fichier (ex: "mon_rapport.md")'
        }
      },
      required: ['filename']
    }
  },
  get_saved_documents: {
    name: 'get_saved_documents',
    description: 'Récupère la liste de tous les documents, écrits et conclusions sauvegardés en mémoire. Utile pour savoir ce qui est disponible avant de proposer un téléchargement ou une consultation.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  run_terminal_command: {
    name: 'run_terminal_command',
    description: 'Exécute une commande dans le terminal du PC local de l\'utilisateur. Utilisez cette fonction pour interagir avec le système d\'exploitation (Windows), gérer des fichiers locaux ou MODIFIER VOTRE PROPRE CODE SOURCE (si le mode Auto-Évolution est activé). NOTE: Pour naviguer sur le web, utilisez PRIORITAIREMENT les outils "browser_*".',
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'La commande terminal complète à exécuter (ex: "Get-Content path/to/file", "dir", "mkdir", "whoami")'
        }
      },
      required: ['command']
    }
  },
  set_screen_share: {
    name: 'set_screen_share',
    description: 'Active ou désactive le partage d\'écran sur le PC de l\'utilisateur. Cela permet à l\'assistant de voir ce qui se passe sur l\'écran pour aider l\'utilisateur.',
    parameters: {
      type: 'object',
      properties: {
        enabled: {
          type: 'boolean',
          description: 'True pour activer le partage d\'écran, False pour l\'arrêter.'
        }
      },
      required: ['enabled']
    }
  },
  browser_search: {
    name: 'browser_search',
    description: 'Effectue une recherche directe sur Google et attend les résultats. Plus rapide que de naviguer manuellement.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Les termes de recherche'
        }
      },
      required: ['query']
    }
  },
  browser_navigate: {
    name: 'browser_navigate',
    description: 'Navigue vers une URL spécifique dans le navigateur autonome. Reutilise la fenêtre existante par défaut. Utilisez cela pour accéder à des sites web spécifiques.',
    parameters: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'L\'URL complète vers laquelle naviguer (ex: "https://fr.wikipedia.org")'
        },
        newTab: {
          type: 'boolean',
          description: 'Si true, ouvre l\'URL dans un nouvel onglet de la même fenêtre.'
        }
      },
      required: ['url']
    }
  },
  browser_click: {
    name: 'browser_click',
    description: 'Clique sur un élément spécifique. L\'outil fera défiler la page automatiquement vers l\'élément si nécessaire.',
    parameters: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'Le sélecteur CSS (ex: "h3 a", "button.submit")'
        }
      },
      required: ['selector']
    }
  },
  browser_scroll: {
    name: 'browser_scroll',
    description: 'Fait défiler la page dans une direction spécifique.',
    parameters: {
      type: 'object',
      properties: {
        direction: {
          type: 'string',
          enum: ['up', 'down', 'top', 'bottom'],
          description: 'La direction du défilement'
        }
      },
      required: ['direction']
    }
  },
  browser_back: {
    name: 'browser_back',
    description: 'Retourne à la page précédente dans l\'historique.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  browser_forward: {
    name: 'browser_forward',
    description: 'Avance à la page suivante dans l\'historique.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  browser_type: {
    name: 'browser_type',
    description: 'Saisit du texte dans un champ de formulaire.',
    parameters: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'Le sélecteur CSS du champ'
        },
        text: {
          type: 'string',
          description: 'Le texte à saisir'
        }
      },
      required: ['selector', 'text']
    }
  },
  browser_press: {
    name: 'browser_press',
    description: 'Appuie sur une touche (ex: "Enter", "Tab").',
    parameters: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'La touche à presser'
        }
      },
      required: ['key']
    }
  },
  browser_get_content: {
    name: 'browser_get_content',
    description: 'Récupère le texte principal de la page. Les scripts et styles sont ignorés pour ne garder que l\'essentiel.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  browser_screenshot: {
    name: 'browser_screenshot',
    description: 'Prend une capture d\'écran de la zone visible.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  }
};

// Gestionnaire d'exécution des fonctions
export async function executeFunction(
  functionCall: FunctionCall,
  options?: {
    onPersonalityChange?: PersonalityChangeCallback;
    onToggleScreenShare?: (enabled: boolean) => void;
    onOpenDocument?: (document: SavedConclusion) => void;
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

      // Créer le contenu markdown formaté avec structure complète
      const formattedDate = date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const markdownContent = `# ${documentTitle}

## 📅 Informations

**Date de génération:** ${formattedDate}  
**Généré par:** NeuroChat Live Pro

---

## 📝 Contenu

${conclusion}

---

*Document généré automatiquement par NeuroChat Live Pro*  
*Cette conclusion contient l'ensemble des informations discutées lors de la conversation*
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

      // Appeler le callback pour ouvrir le document si disponible
      if (options?.onOpenDocument) {
        options.onOpenDocument(savedConclusion);
      }

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

  // Gestion de la création et affichage d'une page formatée
  if (name === 'create_formatted_page') {
    const { content, title } = args || {};

    if (!content || !title) {
      return {
        result: 'error',
        message: 'Le titre et le contenu sont requis'
      };
    }

    try {
      const date = new Date();
      const documentTitle = title.trim();

      const formattedDate = date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const markdownContent = `# ${documentTitle}
 
**Date:** ${formattedDate}
**Source:** NeuroChat Assistant

---

${content}

---
*Document généré par NeuroChat Live Pro*
`;

      const savedDocument: SavedConclusion = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: documentTitle,
        content: content,
        createdAt: date.toISOString(),
        markdown: markdownContent
      };

      // Sauvegarder dans localStorage
      const existingJson = localStorage.getItem(CONCLUSIONS_STORAGE_KEY);
      let existing: SavedConclusion[] = [];
      if (existingJson) {
        try {
          existing = JSON.parse(existingJson);
          if (!Array.isArray(existing)) existing = [];
        } catch (e) { existing = []; }
      }

      existing.unshift(savedDocument);
      if (existing.length > 100) existing = existing.slice(0, 100);
      localStorage.setItem(CONCLUSIONS_STORAGE_KEY, JSON.stringify(existing));

      // Ouvrir immédiatement le document
      if (options?.onOpenDocument) {
        options.onOpenDocument(savedDocument);
      }

      return {
        result: 'success',
        message: `La page "${documentTitle}" a été créée et ouverte pour l'utilisateur.`,
        id: savedDocument.id
      };
    } catch (error) {
      return {
        result: 'error',
        message: `Erreur lors de la création de la page: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  // Télécharger un document
  if (name === 'download_document') {
    const { documentId, content, filename } = args || {};

    let contentToDownload = content;
    let finalFilename = filename || 'document.md';

    if (documentId) {
      const doc = getSavedConclusionById(documentId);
      if (doc) {
        contentToDownload = doc.markdown || doc.content;
        if (!filename) finalFilename = `${doc.title.replace(/\s+/g, '_')}.md`;
      } else if (!contentToDownload) {
        return { result: 'error', message: 'Document non trouvé' };
      }
    }

    if (!contentToDownload) {
      return { result: 'error', message: 'Aucun contenu à télécharger' };
    }

    if (window.ipcRenderer) {
      try {
        const response = await window.ipcRenderer.invoke('save-to-downloads', {
          filename: finalFilename,
          content: contentToDownload
        });
        return response;
      } catch (error) {
        return { result: 'error', message: String(error) };
      }
    } else {
      return { result: 'error', message: 'IPC non disponible (version web ?)' };
    }
  }

  // Récupérer tous les documents
  if (name === 'get_saved_documents') {
    const documents = getSavedConclusions();
    return {
      result: 'success',
      count: documents.length,
      documents: documents.map(d => ({
        id: d.id,
        title: d.title,
        createdAt: d.createdAt,
        preview: d.content.substring(0, 100) + '...'
      }))
    };
  }

  // Gestion de l'exécution d'une commande terminal
  if (name === 'run_terminal_command') {
    const { command } = args || {};

    if (!command) {
      return {
        result: 'error',
        message: 'La commande est requise'
      };
    }

    // Vérifier si nous sommes dans un environnement Electron
    if (typeof window !== 'undefined' && window.ipcRenderer) {
      try {
        console.log(`[Tools] Appel IPC pour exécuter la commande: ${command}`);
        const response = await window.ipcRenderer.invoke('execute-command', command);
        return response;
      } catch (error) {
        console.error('[Tools] Erreur lors de l\'invocation IPC:', error);
        return {
          result: 'error',
          message: `Erreur d'exécution via Electron: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    } else {
      return {
        result: 'error',
        message: 'L\'exécution de commandes terminal nécessite que l\'application soit lancée via la version Desktop (Electron). Cette fonctionnalité n\'est pas disponible dans le navigateur standard pour des raisons de sécurité.'
      };
    }
  }

  // Gestion du partage d'écran
  if (name === 'set_screen_share') {
    const { enabled } = args || {};

    if (enabled === undefined) {
      return {
        result: 'error',
        message: 'Le paramètre "enabled" est requis'
      };
    }

    if (options?.onToggleScreenShare) {
      options.onToggleScreenShare(enabled);
      return {
        result: 'success',
        message: `Partage d'écran ${enabled ? 'activé' : 'désactivé'} avec succès`
      };
    } else {
      return {
        result: 'error',
        message: 'Le contrôle du partage d\'écran n\'est pas disponible actuellement'
      };
    }
  }

  // --- Gestion des outils du navigateur autonome ---

  if (name === 'browser_navigate') {
    const { url, newTab } = args || {};
    if (!url) return { result: 'error', message: 'URL requise' };
    return await window.ipcRenderer?.invoke('browser-navigate', { url, newTab });
  }

  if (name === 'browser_search') {
    const { query } = args || {};
    if (!query) return { result: 'error', message: 'Requête requise' };
    return await window.ipcRenderer?.invoke('browser-search', query);
  }

  if (name === 'browser_click') {
    const { selector } = args || {};
    if (!selector) return { result: 'error', message: 'Sélecteur requis' };
    return await window.ipcRenderer?.invoke('browser-click', selector);
  }

  if (name === 'browser_scroll') {
    const { direction } = args || {};
    if (!direction) return { result: 'error', message: 'Direction requise' };
    return await window.ipcRenderer?.invoke('browser-scroll', direction);
  }

  if (name === 'browser_back') {
    return await window.ipcRenderer?.invoke('browser-back');
  }

  if (name === 'browser_forward') {
    return await window.ipcRenderer?.invoke('browser-forward');
  }

  if (name === 'browser_type') {
    const { selector, text } = args || {};
    if (!selector || text === undefined) return { result: 'error', message: 'Sélecteur et texte requis' };
    return await window.ipcRenderer?.invoke('browser-type', { selector, text });
  }

  if (name === 'browser_press') {
    const { key } = args || {};
    if (!key) return { result: 'error', message: 'Touche requise' };
    return await window.ipcRenderer?.invoke('browser-press', key);
  }

  if (name === 'browser_get_content') {
    return await window.ipcRenderer?.invoke('browser-get-content');
  }

  if (name === 'browser_screenshot') {
    const base64 = await window.ipcRenderer?.invoke('browser-screenshot');
    return {
      status: 'success',
      message: 'Capture d\'écran effectuée',
      image: base64
    };
  }

  console.warn(`[Tools] ⚠️ Fonction inconnue: ${name}`);
  return {
    result: 'error',
    message: `Fonction ${name} non implémentée`
  };
}

/**
 * Créer une réponse de fonction pour l'API
 */
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

/**
 * Construire la configuration des outils pour l'API Live
 */
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

