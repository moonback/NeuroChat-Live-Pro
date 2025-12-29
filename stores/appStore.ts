import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ConnectionState, Personality } from '../types';
import { DEFAULT_PERSONALITY } from '../constants';
import type { ProcessedDocument } from '../utils/documentProcessor';

interface AppState {
  // État de connexion
  connectionState: ConnectionState;
  
  // Personnalité actuelle
  currentPersonality: Personality;
  
  // Documents uploadés
  uploadedDocuments: ProcessedDocument[];
  
  // Wake word
  isWakeWordEnabled: boolean;
  wakeWordPhrase: string;
  isWakeWordListening: boolean;
  
  // Tools
  isFunctionCallingEnabled: boolean;
  isGoogleSearchEnabled: boolean;
  isEyeTrackingEnabled: boolean;
  
  // Actions
  setConnectionState: (state: ConnectionState) => void;
  setPersonality: (p: Personality) => void;
  setUploadedDocuments: (documents: ProcessedDocument[]) => void;
  setIsWakeWordEnabled: (enabled: boolean) => void;
  setWakeWordPhrase: (phrase: string) => void;
  setIsWakeWordListening: (listening: boolean) => void;
  setIsFunctionCallingEnabled: (enabled: boolean) => void;
  setIsGoogleSearchEnabled: (enabled: boolean) => void;
  setIsEyeTrackingEnabled: (enabled: boolean) => void;
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
    (set) => ({
      // État initial
      connectionState: ConnectionState.DISCONNECTED,
      currentPersonality: DEFAULT_PERSONALITY,
      uploadedDocuments: [],
      isWakeWordEnabled: false,
      wakeWordPhrase: 'bonjour',
      isWakeWordListening: false,
      isFunctionCallingEnabled: true,
      isGoogleSearchEnabled: false,
      isEyeTrackingEnabled: true,

      // Actions
      setConnectionState: (state) => set({ connectionState: state }),
      setPersonality: (p) => set({ currentPersonality: p }),
      setUploadedDocuments: (documents) => set({ uploadedDocuments: documents }),
      setIsWakeWordEnabled: (enabled) => set({ isWakeWordEnabled: enabled }),
      setWakeWordPhrase: (phrase) => set({ wakeWordPhrase: phrase }),
      setIsWakeWordListening: (listening) => set({ isWakeWordListening: listening }),
      setIsFunctionCallingEnabled: (enabled) => set({ isFunctionCallingEnabled: enabled }),
      setIsGoogleSearchEnabled: (enabled) => set({ isGoogleSearchEnabled: enabled }),
      setIsEyeTrackingEnabled: (enabled) => set({ isEyeTrackingEnabled: enabled }),
    }),
    {
      name: 'neurochat-storage',
      partialize: (state) => ({
        // On ne persiste que ce qui doit l'être (pas connectionState)
        currentPersonality: state.currentPersonality,
        uploadedDocuments: state.uploadedDocuments,
        isWakeWordEnabled: state.isWakeWordEnabled,
        wakeWordPhrase: state.wakeWordPhrase,
        isFunctionCallingEnabled: state.isFunctionCallingEnabled,
        isGoogleSearchEnabled: state.isGoogleSearchEnabled,
        isEyeTrackingEnabled: state.isEyeTrackingEnabled,
      }),
      merge: (persistedState: any, currentState) => {
        // Validation et désérialisation personnalisée
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
        
        if (typeof persistedState?.isWakeWordEnabled === 'boolean') {
          merged.isWakeWordEnabled = persistedState.isWakeWordEnabled;
        }

        if (typeof persistedState?.wakeWordPhrase === 'string' && persistedState.wakeWordPhrase.trim().length > 0) {
          merged.wakeWordPhrase = persistedState.wakeWordPhrase;
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

