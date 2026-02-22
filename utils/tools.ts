/**
 * Gestionnaire d'outils pour l'API Live Gemini
 * Définit les fonctions disponibles et gère leur exécution
 */

import { FunctionDeclaration, FunctionCall, FunctionResponse } from '../types';
import { AVAILABLE_PERSONALITIES } from '../constants';
import type { Personality } from '../types';
import { useAppStore } from '../stores/appStore';
import { toolRegistry } from './tools/ToolRegistry';

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
    description: 'Change la personnalité de l\'assistant. Les personnalités disponibles sont: NeuroChat Pro.',
    parameters: {
      type: 'object',
      properties: {
        personalityId: { type: 'string' },
        personalityName: { type: 'string' }
      },
      required: []
    }
  },
  generate_conclusion_markdown: {
    name: 'generate_conclusion_markdown',
    description: 'Sauvegarde une conclusion complète de la conversation.',
    parameters: {
      type: 'object',
      properties: {
        conclusion: { type: 'string' },
        title: { type: 'string' }
      },
      required: ['conclusion']
    }
  },
  create_formatted_page: {
    name: 'create_formatted_page',
    description: 'Crée et affiche immédiatement une nouvelle page formatée avec du contenu markdown.',
    parameters: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        title: { type: 'string' }
      },
      required: ['content', 'title']
    }
  },
  download_document: {
    name: 'download_document',
    description: 'Télécharge un document ou du contenu markdown sur l\'ordinateur de l\'utilisateur.',
    parameters: {
      type: 'object',
      properties: {
        documentId: { type: 'string' },
        content: { type: 'string' },
        filename: { type: 'string' }
      },
      required: ['filename']
    }
  },
  get_saved_documents: {
    name: 'get_saved_documents',
    description: 'Récupère la liste de tous les documents sauvegardés.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  run_terminal_command: {
    name: 'run_terminal_command',
    description: 'Exécute une commande dans le terminal Windows PowerShell.',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string' }
      },
      required: ['command']
    }
  },
  set_screen_share: {
    name: 'set_screen_share',
    description: 'Active ou désactive le partage d\'écran.',
    parameters: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' }
      },
    }
  },

  // Importer toutes les définitions des plugins enregistrés
  ...toolRegistry.getDeclarations()
};

// Fonction interne d'exécution (sans les logs)
async function _executeFunctionImpl(
  functionCall: FunctionCall,
  options?: {
    onPersonalityChange?: PersonalityChangeCallback;
    onToggleScreenShare?: (enabled: boolean) => void;
    onOpenDocument?: (document: SavedConclusion) => void;
  }
): Promise<any> {
  const { name, args } = functionCall;

  console.log(`[Tools] Exécution de la fonction: ${name}`, args);

  // 1. Plugins enregistrés (Priorité)
  if (toolRegistry.hasTool(name)) {
    try {
      return await toolRegistry.executeTool(name, args, options);
    } catch (e) {
      return { result: 'error', message: `Erreur plugin ${name}: ${String(e)}` };
    }
  }

  // 2. Gestion du changement de personnalité (Legacy conditionnel)
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

  console.warn(`[Tools] ⚠️ Fonction inconnue: ${name}`);
  return {
    result: 'error',
    message: `Fonction ${name} non implémentée`
  };
}

// Fonction publique qui enveloppe l'exécution d'un log système
export async function executeFunction(
  functionCall: FunctionCall,
  options?: {
    onPersonalityChange?: PersonalityChangeCallback;
    onToggleScreenShare?: (enabled: boolean) => void;
    onOpenDocument?: (document: SavedConclusion) => void;
  }
): Promise<any> {
  const { name = 'unknown_function', args = {} } = functionCall;
  const store = useAppStore.getState();

  const logId = store.addActionLog({
    toolName: name,
    args: args,
    result: 'pending'
  });

  try {
    const response = await _executeFunctionImpl(functionCall, options);

    // Déterminer le statut
    let status: 'success' | 'error' = 'success';
    if (response?.result === 'error' || response?.error) {
      status = 'error';
    }

    store.updateActionLog(logId, {
      result: status,
      message: response?.message || (status === 'success' ? 'Exécuté avec succès' : 'Une erreur est survenue')
    });

    return response;
  } catch (error) {
    store.updateActionLog(logId, {
      result: 'error',
      message: String(error)
    });
    console.error(`[Tools] Error executing ${name}:`, error);
    throw error;
  }
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

