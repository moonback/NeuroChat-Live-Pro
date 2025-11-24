/**
 * Système de stockage de conversations avec chiffrement bout-en-bout
 * Utilise IndexedDB pour un stockage local performant
 */

import { ConversationMessage, ConversationSession, EncryptedConversation, MessageType, TranscriptionState } from '../types';
import { EncryptionKeyManager, encryptObject, decryptObject } from './encryption';

const DB_NAME = 'neurochat_conversations';
const DB_VERSION = 1;
const STORE_CONVERSATIONS = 'conversations';
const STORE_SESSIONS = 'sessions';

/**
 * Gestionnaire de base de données IndexedDB pour les conversations
 */
export class ConversationStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialise la base de données IndexedDB
   */
  private async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[ConversationStorage] Erreur d\'ouverture de la DB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store pour les conversations chiffrées
        if (!db.objectStoreNames.contains(STORE_CONVERSATIONS)) {
          const conversationStore = db.createObjectStore(STORE_CONVERSATIONS, {
            keyPath: 'sessionId',
          });
          conversationStore.createIndex('createdAt', 'createdAt', { unique: false });
          conversationStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Store pour les métadonnées de sessions
        if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
          const sessionStore = db.createObjectStore(STORE_SESSIONS, {
            keyPath: 'id',
          });
          sessionStore.createIndex('startTime', 'startTime', { unique: false });
          sessionStore.createIndex('endTime', 'endTime', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Sauvegarde une conversation chiffrée
   */
  async saveConversation(
    sessionId: string,
    messages: ConversationMessage[],
    sessionMetadata: ConversationSession
  ): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Base de données non initialisée');

    try {
      // Obtenir la clé de chiffrement
      const encryptionKey = await EncryptionKeyManager.getOrCreateKey();

      // Chiffrer les messages
      const encryptedData = await encryptObject(messages, encryptionKey);

      // Créer l'objet de conversation chiffrée
      const encryptedConversation: EncryptedConversation = {
        sessionId,
        encryptedData,
        metadata: {
          ...sessionMetadata,
          isEncrypted: true,
          messageCount: messages.length,
        },
        createdAt: sessionMetadata.startTime,
        updatedAt: new Date(),
      };

      // Sauvegarder dans IndexedDB
      const transaction = this.db.transaction([STORE_CONVERSATIONS, STORE_SESSIONS], 'readwrite');
      
      await Promise.all([
        new Promise<void>((resolve, reject) => {
          const conversationRequest = transaction.objectStore(STORE_CONVERSATIONS).put(encryptedConversation);
          conversationRequest.onsuccess = () => resolve();
          conversationRequest.onerror = () => reject(conversationRequest.error);
        }),
        new Promise<void>((resolve, reject) => {
          const sessionRequest = transaction.objectStore(STORE_SESSIONS).put(sessionMetadata);
          sessionRequest.onsuccess = () => resolve();
          sessionRequest.onerror = () => reject(sessionRequest.error);
        }),
      ]);

      console.log(`[ConversationStorage] Conversation ${sessionId} sauvegardée (${messages.length} messages)`);
    } catch (error) {
      console.error('[ConversationStorage] Erreur lors de la sauvegarde:', error);
      throw error;
    }
  }

  /**
   * Ajoute un message à une conversation existante
   */
  async addMessageToConversation(
    sessionId: string,
    message: ConversationMessage
  ): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Base de données non initialisée');

    try {
      // Récupérer la conversation existante
      const conversation = await this.getConversation(sessionId);
      if (!conversation) {
        throw new Error(`Conversation ${sessionId} introuvable`);
      }

      // Ajouter le nouveau message
      conversation.push(message);

      // Récupérer les métadonnées
      const transaction = this.db.transaction([STORE_CONVERSATIONS, STORE_SESSIONS], 'readonly');
      const sessionMetadata = await new Promise<ConversationSession>((resolve, reject) => {
        const request = transaction.objectStore(STORE_SESSIONS).get(sessionId);
        request.onsuccess = () => {
          resolve(request.result || {
            id: sessionId,
            startTime: new Date(),
            isEncrypted: true,
            messageCount: 0,
          });
        };
        request.onerror = () => reject(request.error);
      });

      // Sauvegarder la conversation mise à jour
      await this.saveConversation(sessionId, conversation, sessionMetadata);
    } catch (error) {
      console.error('[ConversationStorage] Erreur lors de l\'ajout de message:', error);
      throw error;
    }
  }

  /**
   * Récupère et déchiffre une conversation
   */
  async getConversation(sessionId: string): Promise<ConversationMessage[] | null> {
    await this.init();
    if (!this.db) throw new Error('Base de données non initialisée');

    try {
      const transaction = this.db.transaction([STORE_CONVERSATIONS], 'readonly');
      const encryptedConversation = await new Promise<EncryptedConversation | null>(
        (resolve, reject) => {
          const request = transaction.objectStore(STORE_CONVERSATIONS).get(sessionId);
          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => reject(request.error);
        }
      );

      if (!encryptedConversation) {
        return null;
      }

      // Déchiffrer les messages
      const encryptionKey = await EncryptionKeyManager.getOrCreateKey();
      const messages = await decryptObject<ConversationMessage[]>(
        encryptedConversation.encryptedData,
        encryptionKey
      );

      // Convertir les timestamps en Date
      return messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
    } catch (error) {
      console.error('[ConversationStorage] Erreur lors de la récupération:', error);
      return null;
    }
  }

  /**
   * Liste toutes les sessions de conversation (métadonnées uniquement)
   */
  async listSessions(limit?: number): Promise<ConversationSession[]> {
    await this.init();
    if (!this.db) throw new Error('Base de données non initialisée');

    try {
      const transaction = this.db.transaction([STORE_SESSIONS], 'readonly');
      const index = transaction.objectStore(STORE_SESSIONS).index('startTime');
      
      return new Promise((resolve, reject) => {
        const sessions: ConversationSession[] = [];
        const request = index.openCursor(null, 'prev'); // Ordre décroissant (plus récent d'abord)

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor && (!limit || sessions.length < limit)) {
            const session = cursor.value;
            sessions.push({
              ...session,
              startTime: new Date(session.startTime),
              endTime: session.endTime ? new Date(session.endTime) : undefined,
            });
            cursor.continue();
          } else {
            resolve(sessions);
          }
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('[ConversationStorage] Erreur lors de la liste des sessions:', error);
      return [];
    }
  }

  /**
   * Supprime une conversation
   */
  async deleteConversation(sessionId: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Base de données non initialisée');

    try {
      const transaction = this.db.transaction([STORE_CONVERSATIONS, STORE_SESSIONS], 'readwrite');
      
      await Promise.all([
        new Promise<void>((resolve, reject) => {
          const request = transaction.objectStore(STORE_CONVERSATIONS).delete(sessionId);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        }),
        new Promise<void>((resolve, reject) => {
          const request = transaction.objectStore(STORE_SESSIONS).delete(sessionId);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        }),
      ]);

      console.log(`[ConversationStorage] Conversation ${sessionId} supprimée`);
    } catch (error) {
      console.error('[ConversationStorage] Erreur lors de la suppression:', error);
      throw error;
    }
  }

  /**
   * Supprime toutes les conversations
   */
  async deleteAllConversations(): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Base de données non initialisée');

    try {
      const transaction = this.db.transaction([STORE_CONVERSATIONS, STORE_SESSIONS], 'readwrite');
      
      await Promise.all([
        new Promise<void>((resolve, reject) => {
          const request = transaction.objectStore(STORE_CONVERSATIONS).clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        }),
        new Promise<void>((resolve, reject) => {
          const request = transaction.objectStore(STORE_SESSIONS).clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        }),
      ]);

      console.log('[ConversationStorage] Toutes les conversations supprimées');
    } catch (error) {
      console.error('[ConversationStorage] Erreur lors de la suppression totale:', error);
      throw error;
    }
  }

  /**
   * Recherche dans les conversations (déchiffre et recherche dans le texte)
   */
  async searchConversations(searchQuery: string): Promise<ConversationSession[]> {
    await this.init();
    if (!this.db) throw new Error('Base de données non initialisée');

    try {
      // Récupérer toutes les sessions
      const allSessions = await this.listSessions();
      const matchingSessions: ConversationSession[] = [];

      const lowerQuery = searchQuery.toLowerCase();

      // Rechercher dans chaque conversation
      for (const session of allSessions) {
        const messages = await this.getConversation(session.id);
        if (messages) {
          const hasMatch = messages.some(msg => 
            msg.content.toLowerCase().includes(lowerQuery)
          );
          
          if (hasMatch) {
            matchingSessions.push(session);
          }
        }
      }

      return matchingSessions;
    } catch (error) {
      console.error('[ConversationStorage] Erreur lors de la recherche:', error);
      return [];
    }
  }
}

// Instance singleton
export const conversationStorage = new ConversationStorage();

