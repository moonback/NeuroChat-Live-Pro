import { useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, type LiveServerMessage, Modality } from '@google/genai';
import { ConnectionState, Personality } from '../types';
import { buildSystemInstruction } from '../systemConfig';
import { buildToolsConfig, executeFunction, type PersonalityChangeCallback } from '../utils/tools';
import type { ToastMessage } from '../components/Toast';
import { useReconnection } from './useReconnection';
import { useAudioPipeline } from './useAudioPipeline';
import {
  showReconnectionFailure,
  showDisconnection,
  showConnectionSuccess,
  showFunctionExecuted,
  showSelfCorrection,
  showSessionEnd,
  showSessionError,
  showConnectionFailure,
} from '../utils/toastHelpers';
import { useAppStore } from '../stores/appStore';
import { useUIStore } from '../stores/uiStore';

interface UseGeminiLiveSessionProps {
  connectionState: ConnectionState;
  setConnectionState: (state: ConnectionState) => void;
  setIsTalking: (v: boolean) => void;
  setLatency: (v: number) => void;
  addToast: (type: ToastMessage['type'], title: string, message: string) => void;
  personality: Personality;
  documentsContext: string | undefined;
  personalityFilesContext: string | undefined;
  selectedVoice: string;
  isFunctionCallingEnabled: boolean;
  isGoogleSearchEnabled: boolean;
  isVideoActive: boolean;
  startFrameTransmission: () => void;
  resetVisionState: () => void;
  onToggleScreenShare?: (enabled: boolean) => void;
  sessionRef: { current: any };
  onPersonalityChange?: PersonalityChangeCallback;
}

export const useGeminiLiveSession = ({
  connectionState: _unused,
  setConnectionState,
  setIsTalking,
  setLatency,
  addToast,
  personality,
  documentsContext,
  personalityFilesContext,
  selectedVoice,
  isFunctionCallingEnabled,
  isGoogleSearchEnabled,
  isVideoActive,
  startFrameTransmission,
  resetVisionState,
  onToggleScreenShare,
  sessionRef,
  onPersonalityChange,
}: UseGeminiLiveSessionProps) => {
  // Keep latest config values in a ref — prevents re-triggering connect on every prop change
  const configRef = useRef({
    personality,
    documentsContext,
    personalityFilesContext,
    selectedVoice,
    isFunctionCallingEnabled,
    isGoogleSearchEnabled,
    isVideoActive,
  });

  useEffect(() => {
    configRef.current = {
      personality,
      documentsContext,
      personalityFilesContext,
      selectedVoice,
      isFunctionCallingEnabled,
      isGoogleSearchEnabled,
      isVideoActive,
    };
  }, [personality, documentsContext, personalityFilesContext, selectedVoice, isFunctionCallingEnabled, isGoogleSearchEnabled, isVideoActive]);

  // Stable function refs — declared early so they can be referenced in callbacks below
  const connectRef = useRef<() => Promise<void>>(async () => {});
  const disconnectRef = useRef<(shouldReload?: boolean) => void>(() => {});

  // Audio pipeline (input 16kHz + output 24kHz)
  // sendAudio is stable: sessionRef.current is checked at call-time (not captured)
  const sendAudio = useCallback((blob: Blob) => {
    sessionRef.current?.sendRealtimeInput({ media: blob });
  // sessionRef is a stable object (useRef) — its identity never changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const audio = useAudioPipeline(sendAudio, sessionRef);

  // Reconnection logic
  const {
    scheduleReconnect,
    reset: resetReconnection,
    isReconnecting,
    isIntentionalDisconnect,
    setIsIntentionalDisconnect,
  } = useReconnection({
    maxAttempts: 5,
    onReconnect: () => connectRef.current(),
    onMaxAttemptsReached: () => {
      setConnectionState(ConnectionState.ERROR);
      showReconnectionFailure(addToast);
    },
  });

  const disconnect = useCallback((shouldReload = false) => {
    setIsIntentionalDisconnect(true);
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch { /* ok */ }
      sessionRef.current = null;
    }
    audio.cleanup();
    resetReconnection();
    resetVisionState();
    setConnectionState(ConnectionState.DISCONNECTED);
    setIsTalking(false);
    setLatency(0);

    if (shouldReload) {
      showDisconnection(addToast);
      setTimeout(() => window.location.reload(), 500);
    }
  }, [audio, resetVisionState, setConnectionState, setIsTalking, setLatency, addToast, setIsIntentionalDisconnect, resetReconnection, sessionRef]);

  const connect = useCallback(async () => {
    try {
      if (!isReconnecting) setConnectionState(ConnectionState.CONNECTING);
      sessionRef.current = null;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      await audio.setup(stream);

      const handleInternalReconnect = () => {
        if (isIntentionalDisconnect) return;
        if (sessionRef.current) {
          try { sessionRef.current.close(); } catch { /* ok */ }
          sessionRef.current = null;
        }
        audio.cleanup();
        scheduleReconnect();
      };

      const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY
        || (process as any).env?.GEMINI_API_KEY
        || '';

      const ai = new GoogleGenAI({ apiKey });
      const cfg = configRef.current;

      const session = await ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: async () => {
            setConnectionState(ConnectionState.CONNECTED);
            showConnectionSuccess(addToast);
            resetReconnection();
            if (cfg.isVideoActive) startFrameTransmission();
          },

          onmessage: async (message: LiveServerMessage) => {
            const addMsg = useAppStore.getState().addMessageToCurrentSession;
            const serverContent = (message as any).serverContent;

            // Transcripts
            for (const [turn, role] of [['userTurn', 'user'], ['modelTurn', 'model']] as const) {
              const text = serverContent?.[turn]?.parts?.map((p: any) => p.text).join('').trim();
              if (text) addMsg({ role, content: text });
            }

            // Tool execution
            if (message.toolCall?.functionCalls) {
              const { setActiveDocument } = useUIStore.getState();
              const functionResponses = await Promise.all(
                message.toolCall.functionCalls.map(async (fc) => {
                  try {
                    const result = await executeFunction(fc, {
                      onPersonalityChange,
                      onToggleScreenShare,
                      onOpenDocument: (doc) => setActiveDocument(doc),
                    });
                    showFunctionExecuted(addToast, fc.name);
                    return { id: fc.id, name: fc.name, response: result };
                  } catch (error) {
                    showSelfCorrection(addToast, fc.name);
                    return {
                      id: fc.id,
                      name: fc.name,
                      response: {
                        result: 'error',
                        message: `Échec de l'outil ${fc.name}: ${String(error)}. Analysez l'erreur et tentez une correction autonome.`,
                      },
                    };
                  }
                }),
              );
              if (sessionRef.current) sessionRef.current.sendToolResponse({ functionResponses });
            }

            // Session termination command
            const modelText = serverContent?.modelTurn?.parts?.map((p: any) => p.text).join('').toLowerCase();
            if (modelText?.includes('terminer la session')) {
              showSessionEnd(addToast);
              disconnectRef.current(true);
              return;
            }

            // Audio output
            const base64Audio = serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              const lastUserTime = audio.lastUserAudioTimeRef.current;
              if (lastUserTime > 0) {
                const latency = Date.now() - lastUserTime;
                if (latency < 5000) setLatency(latency);
              }
              setIsTalking(true);
              await audio.scheduleOutputAudio(base64Audio);
            }

            if (serverContent?.interrupted) {
              audio.interruptOutput();
              setIsTalking(false);
            }
          },

          onclose: () => {
            if (!isIntentionalDisconnect && !isReconnecting) handleInternalReconnect();
          },

          onerror: (err: any) => {
            console.error('[GeminiSession] error:', err);
            showSessionError(addToast, err?.message ?? 'Une erreur est survenue.');
            if (!isIntentionalDisconnect && !isReconnecting && err?.code !== 'AUTH_ERROR') {
              handleInternalReconnect();
            } else {
              setConnectionState(ConnectionState.ERROR);
              setTimeout(() => setConnectionState(ConnectionState.DISCONNECTED), 5000);
            }
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: cfg.selectedVoice } },
          },
          systemInstruction: buildSystemInstruction(
            cfg.personality.systemInstruction,
            cfg.documentsContext,
            cfg.personalityFilesContext,
          ),
          tools: buildToolsConfig(cfg.isFunctionCallingEnabled, cfg.isGoogleSearchEnabled),
          // @ts-ignore — transcription is a valid but not yet typed field
          transcription: { enabled: true },
        },
      });

      sessionRef.current = session;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Impossible de se connecter.';
      console.error('[GeminiSession] connection failure:', error);
      audio.cleanup();
      showConnectionFailure(addToast, msg);
      setConnectionState(ConnectionState.ERROR);
      setTimeout(() => setConnectionState(ConnectionState.DISCONNECTED), 3000);
      if (!isIntentionalDisconnect && !isReconnecting) scheduleReconnect();
    }
  }, [
    audio, addToast, resetVisionState, setConnectionState, setIsTalking, setLatency,
    isReconnecting, isIntentionalDisconnect, scheduleReconnect, resetReconnection,
    sessionRef, onPersonalityChange, onToggleScreenShare, startFrameTransmission,
    // disconnect intentionally omitted — accessed via disconnectRef to break circular dep
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ]);

  // Keep stable refs up to date after each render
  useEffect(() => { connectRef.current = connect; }, [connect]);
  useEffect(() => { disconnectRef.current = disconnect; }, [disconnect]);

  // Cleanup ONLY on unmount — empty deps prevents the infinite loop caused by
  // disconnect changing → cleanup runs → setState in useReconnection → re-render → repeat
  useEffect(() => { return () => { disconnectRef.current(); }; }, []);

  return {
    connect,
    disconnect,
    analyserRef: audio.analyserRef,
    inputAnalyserRef: audio.inputAnalyserRef,
    mediaStreamRef: audio.mediaStreamRef,
    toggleMic: audio.toggleMic,
    getMicMutedState: audio.getMicMuted,
    cleanupAudioResources: audio.cleanup,
    setIsIntentionalDisconnect,
    connectRef,
  };
};
