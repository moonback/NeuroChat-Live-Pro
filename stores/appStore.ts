import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ConnectionState, Personality, ChatSession, ChatMessage } from '../types';
import { DEFAULT_PERSONALITY } from '../constants';
import type { ProcessedDocument } from '../utils/documentProcessor';

interface AppState {
  // État de connexion
  connectionState: ConnectionState;

  // Personnalité actuelle
  currentPersonality: Personality;

  // Documents uploadés
  uploadedDocuments: ProcessedDocument[];

  // Chat History
  sessions: ChatSession[];
  currentSessionId: string | null;

  // Tools
  isFunctionCallingEnabled: boolean;
  isGoogleSearchEnabled: boolean;
  isEyeTrackingEnabled: boolean;

  // Actions
  setConnectionState: (state: ConnectionState) => void;
  setPersonality: (p: Personality) => void;
  setUploadedDocuments: (documents: ProcessedDocument[]) => void;
  setIsFunctionCallingEnabled: (enabled: boolean) => void;
  setIsGoogleSearchEnabled: (enabled: boolean) => void;
  setIsEyeTrackingEnabled: (enabled: boolean) => void;

  // Session Actions
  createNewSession: (personalityId: string) => string;
  addMessageToCurrentSession: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setCurrentSessionId: (id: string | null) => void;
  deleteSession: (id: string) => void;
  renameSession: (id: string, title: string) => void;
  clearHistory: () => void;
}

// Helper pour désérialiser les documents
const deserializeDocuments = (raw: string): ProcessedDocument[] => {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((doc: any) => ({
      ...doc,
      uploadedAt: doc?.uploadedAt ? new Date(doc.uploadedAt) : new Date(),
    })) as ProcessedDocument[];
  } catch {
    return [];
  }
};

// Helper pour valider la personnalité
const isPersonality = (value: unknown): value is Personality => {
  return Boolean(
    value &&
    typeof value === 'object' &&
    'id' in (value as any) &&
    'systemInstruction' in (value as any) &&
    typeof (value as any).id === 'string' &&
    typeof (value as any).systemInstruction === 'string',
  );
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // État initial
      connectionState: ConnectionState.DISCONNECTED,
      currentPersonality: DEFAULT_PERSONALITY,
      uploadedDocuments: [],
      sessions: [],
      currentSessionId: null,
      isFunctionCallingEnabled: true,
      isGoogleSearchEnabled: false,
      isEyeTrackingEnabled: true,

      // Actions
      setConnectionState: (state) => set({ connectionState: state }),
      setPersonality: (p) => set({ currentPersonality: p }),
      setUploadedDocuments: (documents) => set({ uploadedDocuments: documents }),
      setIsFunctionCallingEnabled: (enabled) => set({ isFunctionCallingEnabled: enabled }),
      setIsGoogleSearchEnabled: (enabled) => set({ isGoogleSearchEnabled: enabled }),
      setIsEyeTrackingEnabled: (enabled) => set({ isEyeTrackingEnabled: enabled }),

      setCurrentSessionId: (id) => set({ currentSessionId: id }),

      createNewSession: (personalityId) => {
        const id = crypto.randomUUID();
        const newSession: ChatSession = {
          id,
          title: `Nouvelle conversation`,
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          personalityId,
        };
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          currentSessionId: id,
        }));
        return id;
      },

      addMessageToCurrentSession: (msg) => {
        const { currentSessionId, sessions } = get();
        let targetId = currentSessionId;

        // Si pas de session courante, on en crée une
        if (!targetId) {
          targetId = get().createNewSession(get().currentPersonality.id);
        }

        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id === targetId) {
              const lastMessage = s.messages[s.messages.length - 1];
              let messages = [...s.messages];

              // Si le dernier message est du même rôle, on concatène (sauf si c'est trop vieux, p.ex. > 1 min)
              const now = new Date();
              const isRecent = lastMessage && (now.getTime() - new Date(lastMessage.timestamp).getTime() < 30000);

              if (lastMessage && lastMessage.role === msg.role && isRecent) {
                const updatedMessage = {
                  ...lastMessage,
                  content: lastMessage.content + (msg.content.startsWith(' ') || lastMessage.content.endsWith(' ') ? '' : ' ') + msg.content,
                  timestamp: now.toISOString(),
                };
                messages[messages.length - 1] = updatedMessage;
              } else {
                const newMessage: ChatMessage = {
                  ...msg,
                  id: crypto.randomUUID(),
                  timestamp: now.toISOString(),
                };
                messages.push(newMessage);
              }

              // Titre automatique basé sur le premier message utilisateur
              let title = s.title;
              if (s.title === 'Nouvelle conversation' && msg.role === 'user' && msg.content) {
                title = msg.content.substring(0, 40) + (msg.content.length > 40 ? '...' : '');
              }

              return {
                ...s,
                messages,
                title,
                updatedAt: now.toISOString(),
              };
            }
            return s;
          }),
        }));
      },

      deleteSession: (id) => set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== id),
        currentSessionId: state.currentSessionId === id ? null : state.currentSessionId,
      })),

      renameSession: (id, title) => set((state) => ({
        sessions: state.sessions.map((s) => (s.id === id ? { ...s, title, updatedAt: new Date().toISOString() } : s)),
      })),

      clearHistory: () => set({ sessions: [], currentSessionId: null }),
    }),
    {
      name: 'neurochat-storage',
      partialize: (state) => ({
        currentPersonality: state.currentPersonality,
        uploadedDocuments: state.uploadedDocuments,
        sessions: state.sessions,
        currentSessionId: state.currentSessionId,
        isFunctionCallingEnabled: state.isFunctionCallingEnabled,
        isGoogleSearchEnabled: state.isGoogleSearchEnabled,
        isEyeTrackingEnabled: state.isEyeTrackingEnabled,
      }),
      merge: (persistedState: any, currentState) => {
        const merged = { ...currentState };

        if (persistedState?.currentPersonality && isPersonality(persistedState.currentPersonality)) {
          merged.currentPersonality = persistedState.currentPersonality;
        }

        if (persistedState?.uploadedDocuments) {
          if (typeof persistedState.uploadedDocuments === 'string') {
            merged.uploadedDocuments = deserializeDocuments(persistedState.uploadedDocuments);
          } else if (Array.isArray(persistedState.uploadedDocuments)) {
            merged.uploadedDocuments = persistedState.uploadedDocuments.map((doc: any) => ({
              ...doc,
              uploadedAt: doc?.uploadedAt ? new Date(doc.uploadedAt) : new Date(),
            }));
          }
        }

        if (persistedState?.sessions) {
          merged.sessions = persistedState.sessions;
        }

        if (persistedState?.currentSessionId) {
          merged.currentSessionId = persistedState.currentSessionId;
        }

        if (typeof persistedState?.isFunctionCallingEnabled === 'boolean') {
          merged.isFunctionCallingEnabled = persistedState.isFunctionCallingEnabled;
        }

        if (typeof persistedState?.isGoogleSearchEnabled === 'boolean') {
          merged.isGoogleSearchEnabled = persistedState.isGoogleSearchEnabled;
        }

        if (typeof persistedState?.isEyeTrackingEnabled === 'boolean') {
          merged.isEyeTrackingEnabled = persistedState.isEyeTrackingEnabled;
        }

        return merged;
      },
    }
  )
);

