import React, { useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { ConnectionState, DEFAULT_AUDIO_CONFIG, Personality } from '../types';
import { createBlob, decodeAudioData, base64ToArrayBuffer } from '../utils/audioUtils';
import { buildSystemInstruction } from '../systemConfig';
import { buildToolsConfig, executeFunction, PersonalityChangeCallback } from '../utils/tools';
import { ToastMessage } from '../components/Toast';
import { useReconnection } from './useReconnection';
import {
  showReconnectionFailure,
  showDisconnection,
  showConnectionSuccess,
  showFunctionExecuted,
  showFunctionError,
  showSelfCorrection,
  showSessionEnd,
  showSessionError,
  showSessionCreationError,
  showConnectionFailure,
} from '../utils/toastHelpers';
import { useAppStore } from '../stores/appStore';
import { useUIStore } from '../stores/uiStore';

interface UseGeminiLiveSessionProps {
  connectionState: ConnectionState;
  setConnectionState: (state: ConnectionState) => void;
  connectionStateRef: React.MutableRefObject<ConnectionState>;
  setIsTalking: (isTalking: boolean) => void;
  setLatency: (latency: number) => void;
  addToast: (type: ToastMessage['type'], title: string, message: string) => void;
  personality: Personality;
  documentsContext: string | undefined;
  personalityFilesContext: string | undefined;
  selectedVoice: string;
  voiceRate: number;
  voicePitch: number;
  isFunctionCallingEnabled: boolean;
  isGoogleSearchEnabled: boolean;
  isVideoActive: boolean;
  startFrameTransmission: () => void;
  resetVisionState: () => void;
  onToggleScreenShare?: (enabled: boolean) => void;
  sessionRef: React.MutableRefObject<any>;
  onPersonalityChange?: PersonalityChangeCallback;
}

export const useGeminiLiveSession = ({
  connectionState: _unused, // Passed but we use store for consistency
  setConnectionState,
  connectionStateRef: _connectionStateRef,
  setIsTalking,
  setLatency,
  addToast,
  personality,
  documentsContext,
  personalityFilesContext,
  selectedVoice,
  voiceRate,
  voicePitch,
  isFunctionCallingEnabled,
  isGoogleSearchEnabled,
  isVideoActive,
  startFrameTransmission,
  resetVisionState,
  onToggleScreenShare,
  sessionRef,
  onPersonalityChange,
}: UseGeminiLiveSessionProps) => {
  // Refs for audio resources
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const activeSourceInputRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const lastUserAudioTimeRef = useRef<number>(0);
  const connectRef = useRef<(() => Promise<void>) | null>(null);

  // Connection management hook
  const {
    scheduleReconnect,
    reset: resetReconnection,
    isReconnecting: isGlobalReconnecting,
    isIntentionalDisconnect,
    setIsIntentionalDisconnect,
    attemptCount
  } = useReconnection({
    maxAttempts: 10,
    onReconnect: () => connect(),
    onMaxAttemptsReached: () => {
      setConnectionState(ConnectionState.ERROR);
      showReconnectionFailure(addToast);
    },
  });

  const isReconnecting = isGlobalReconnecting;

  const refs = useRef({
    personality,
    documentsContext,
    personalityFilesContext,
    selectedVoice,
    voiceRate,
    voicePitch,
    isFunctionCallingEnabled,
    isGoogleSearchEnabled,
    isVideoActive
  });

  useEffect(() => {
    refs.current = {
      personality,
      documentsContext,
      personalityFilesContext,
      selectedVoice,
      voiceRate,
      voicePitch,
      isFunctionCallingEnabled,
      isGoogleSearchEnabled,
      isVideoActive
    };
  }, [personality, documentsContext, personalityFilesContext, selectedVoice, voiceRate, voicePitch, isFunctionCallingEnabled, isGoogleSearchEnabled, isVideoActive]);

  const cleanupAudioResources = useCallback(() => {
    audioSourcesRef.current.forEach(src => {
      try { src.stop(); src.disconnect(); } catch (e) { }
    });
    audioSourcesRef.current.clear();
    nextStartTimeRef.current = 0;

    const nodes = [processorRef, activeSourceInputRef, analyserRef, inputAnalyserRef, gainNodeRef];
    nodes.forEach(nodeRef => {
      if (nodeRef.current) {
        try { nodeRef.current.disconnect(); } catch (e) { }
        if ('onaudioprocess' in nodeRef.current) (nodeRef.current as any).onaudioprocess = null;
        (nodeRef as any).current = null;
      }
    });

    [inputAudioContextRef, outputAudioContextRef].forEach(ctxRef => {
      if (ctxRef.current) {
        try { ctxRef.current.close(); } catch (e) { }
        ctxRef.current = null;
      }
    });

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => { try { track.stop(); } catch (e) { } });
      mediaStreamRef.current = null;
    }
  }, []);

  const disconnect = useCallback((shouldReload = false) => {
    setIsIntentionalDisconnect(true);
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch (e) { }
      sessionRef.current = null;
    }
    cleanupAudioResources();
    resetReconnection();
    resetVisionState();
    setConnectionState(ConnectionState.DISCONNECTED);
    setIsTalking(false);
    setLatency(0);

    if (shouldReload) {
      showDisconnection(addToast);
      setTimeout(() => window.location.reload(), 500);
    }
  }, [cleanupAudioResources, resetVisionState, setConnectionState, setIsTalking, setLatency, addToast, setIsIntentionalDisconnect, resetReconnection, sessionRef]);

  const connect = useCallback(async () => {
    try {
      if (!isReconnecting && attemptCount === 0) {
        setConnectionState(ConnectionState.CONNECTING);
      }

      sessionRef.current = null;

      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      const inputCtx = new AudioContextClass({ sampleRate: DEFAULT_AUDIO_CONFIG.inputSampleRate });
      const outputCtx = new AudioContextClass({ sampleRate: DEFAULT_AUDIO_CONFIG.outputSampleRate });

      await Promise.all([inputCtx.resume(), outputCtx.resume()]);
      inputAudioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;

      const analyser = outputCtx.createAnalyser();
      analyser.fftSize = 512;
      analyserRef.current = analyser;

      const gainNode = outputCtx.createGain();
      gainNode.connect(analyser);
      analyser.connect(outputCtx.destination);
      gainNodeRef.current = gainNode;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const inputAnalyser = inputCtx.createAnalyser();
      inputAnalyser.fftSize = 256;
      inputAnalyserRef.current = inputAnalyser;

      const apiKey = process.env.API_KEY || '';
      const ai = new GoogleGenAI({ apiKey });

      const handleInternalReconnect = () => {
        if (isIntentionalDisconnect) return;
        if (sessionRef.current) {
          try { sessionRef.current.close(); } catch (e) { }
          sessionRef.current = null;
        }
        cleanupAudioResources();
        scheduleReconnect();
      };

      console.log('[UseGemini] 🚀 Tentative de connexion (Modèle: gemini-2.0-flash-exp)...');

      const session = await ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025', // Restore original model name
        // Note: keeping the original model name pattern from the code
        callbacks: {
          onopen: async () => {
            try {
              console.log('[UseGemini] ✅ Connexion websocket établie');
              setConnectionState(ConnectionState.CONNECTED);

              if (attemptCount === 0) showConnectionSuccess(addToast);
              else addToast('success', 'Reconnexion Réussie', 'Session rétablie.');

              resetReconnection();

              if (refs.current.isVideoActive) {
                console.log('[UseGemini] 📹 Activation Vision...');
                startFrameTransmission();
              }

              if (!inputAudioContextRef.current || !mediaStreamRef.current) {
                console.error('[UseGemini] 🛑 Ressources audio manquantes !');
                return;
              }

              if (inputAudioContextRef.current.state === 'suspended') {
                await inputAudioContextRef.current.resume();
              }

              const source = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
              activeSourceInputRef.current = source;
              if (inputAnalyserRef.current) source.connect(inputAnalyserRef.current);

              const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
              const bufferSize = isMobile ? 1024 : 2048;
              const processor = inputAudioContextRef.current.createScriptProcessor(bufferSize, 1, 1);
              processorRef.current = processor;

              processor.onaudioprocess = (e) => {
                const activeSession = session || sessionRef.current;
                if (!activeSession) return;

                try {
                  const inputData = e.inputBuffer.getChannelData(0);
                  let sum = 0;
                  for (let i = 0; i < inputData.length; i += (isMobile ? 4 : 1)) {
                    sum += inputData[i] * inputData[i];
                  }
                  const rms = Math.sqrt(sum / (inputData.length / (isMobile ? 4 : 1)));
                  if (rms > 0.02) lastUserAudioTimeRef.current = Date.now();

                  const pcmBlob = createBlob(inputData, DEFAULT_AUDIO_CONFIG.inputSampleRate);
                  activeSession.sendRealtimeInput({ media: pcmBlob });
                } catch (err: any) {
                  if (!err?.message?.includes('closed')) {
                    console.error('[UseGemini] ❌ Erreur audio realtime:', err);
                  }
                }
              };

              source.connect(processor);
              processor.connect(inputAudioContextRef.current.destination);
              console.log('[UseGemini] 🎙️ Pipeline audio prêt');
            } catch (err) {
              console.error('[UseGemini] ❌ Échec critique onopen:', err);
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            const addMessageToStore = useAppStore.getState().addMessageToCurrentSession;
            const serverContent = message.serverContent as any;

            if (serverContent?.userTurn || serverContent?.modelTurn) {
              ['userTurn', 'modelTurn'].forEach(turn => {
                const parts = serverContent?.[turn]?.parts;
                if (parts) {
                  const text = parts.map((p: any) => p.text).filter(Boolean).join('').trim();
                  if (text) {
                    addMessageToStore({ role: turn === 'userTurn' ? 'user' : 'model', content: text });
                  }
                }
              });
            }

            if (message.toolCall?.functionCalls) {
              console.log('[UseGemini] 🛠️ Appel d\'outils:', message.toolCall.functionCalls.length);
              const { setActiveDocument } = useUIStore.getState();
              const functionResponsesPromises = message.toolCall.functionCalls.map(async (fc) => {
                try {
                  const result = await executeFunction(fc, {
                    onPersonalityChange,
                    onToggleScreenShare,
                    onOpenDocument: (doc) => setActiveDocument(doc)
                  });
                  showFunctionExecuted(addToast, fc.name || 'inconnue');
                  return { id: fc.id, name: fc.name, response: result };
                } catch (error) {
                  console.error(`[UseGemini] ❌ Erreur outil ${fc.name}:`, error);
                  showSelfCorrection(addToast, fc.name || 'inconnue');
                  return {
                    id: fc.id,
                    name: fc.name,
                    response: { result: 'error', message: `Erreur d'outil : ${String(error)}` }
                  };
                }
              });

              const responses = await Promise.all(functionResponsesPromises);
              const activeSession = session || sessionRef.current;
              if (activeSession) {
                try {
                  activeSession.sendToolResponse({ functionResponses: responses });
                } catch (e) {
                  console.warn('[UseGemini] ⚠️ Échec envoi réponses outils:', e);
                }
              }
            }

            const modelText = serverContent?.modelTurn?.parts?.map((p: any) => p.text).join('').toLowerCase();
            if (modelText?.includes('terminer la session')) {
              showSessionEnd(addToast);
              disconnect(true);
              return;
            }

            const base64Audio = serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current && gainNodeRef.current) {
              if (lastUserAudioTimeRef.current > 0) {
                const latency = Date.now() - lastUserAudioTimeRef.current;
                if (latency < 5000) setLatency(latency);
              }
              setIsTalking(true);
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(base64ToArrayBuffer(base64Audio), ctx, DEFAULT_AUDIO_CONFIG.outputSampleRate);
              const audioSource = ctx.createBufferSource();
              audioSource.buffer = audioBuffer;
              audioSource.playbackRate.value = refs.current.voiceRate;
              if (audioSource.detune) {
                audioSource.detune.value = (refs.current.voicePitch - 1.0) * 1200;
              }
              audioSource.connect(gainNodeRef.current);
              audioSource.start(nextStartTimeRef.current);
              nextStartTimeRef.current += (audioBuffer.duration / refs.current.voiceRate);
              audioSourcesRef.current.add(audioSource);
              audioSource.onended = () => audioSourcesRef.current.delete(audioSource);
            }

            if (serverContent?.interrupted) {
              audioSourcesRef.current.forEach(src => { try { src.stop(); } catch (e) { } });
              audioSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsTalking(false);
            }
          },
          onclose: (ev: any) => {
            console.warn('[UseGemini] ⚠️ Session fermée :', ev);
            if (!isIntentionalDisconnect && !isReconnecting) {
              const reason = ev?.reason || 'Erreur websocket';
              showSessionError(addToast, attemptCount === 0 ? `Session terminée (${reason})` : 'Reconnexion...');
              handleInternalReconnect();
            }
          },
          onerror: (err: any) => {
            console.error('[UseGemini] ❌ Erreur critique :', err);
            if (!isIntentionalDisconnect && !isReconnecting && err?.code !== 'AUTH_ERROR') {
              handleInternalReconnect();
            } else if (err?.code === 'AUTH_ERROR') {
              showSessionError(addToast, 'Erreur d\'authentification (Clé API).');
              setConnectionState(ConnectionState.ERROR);
            }
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: refs.current.selectedVoice || 'Puck'
              }
            }
          },
          systemInstruction: buildSystemInstruction(
            refs.current.personality?.systemInstruction || '',
            refs.current.documentsContext,
            refs.current.personalityFilesContext
          ),
          tools: buildToolsConfig(refs.current.isFunctionCallingEnabled, refs.current.isGoogleSearchEnabled),
        }
      });
      sessionRef.current = session;
    } catch (error: any) {
      console.error("[UseGemini] ❌ Échec critique connexion :", error);
      cleanupAudioResources();
      if (attemptCount === 0) showConnectionFailure(addToast, error.message || "Échec.");
      if (!isIntentionalDisconnect) scheduleReconnect();
      else setConnectionState(ConnectionState.ERROR);
    }
  }, [cleanupAudioResources, addToast, resetVisionState, setConnectionState, setIsTalking, setLatency, isReconnecting, isIntentionalDisconnect, scheduleReconnect, resetReconnection, sessionRef, onPersonalityChange, onToggleScreenShare, startFrameTransmission, attemptCount]);

  useEffect(() => { connectRef.current = connect; }, [connect]);
  useEffect(() => { return () => { disconnect(); }; }, [disconnect]);

  const toggleMic = useCallback(() => {
    if (mediaStreamRef.current) {
      const tracks = mediaStreamRef.current.getAudioTracks();
      tracks.forEach(track => track.enabled = !track.enabled);
      return !tracks[0]?.enabled;
    }
    return false;
  }, []);

  const getMicMutedState = useCallback(() => {
    return mediaStreamRef.current ? (mediaStreamRef.current.getAudioTracks()[0]?.enabled === false) : false;
  }, []);

  return {
    sessionRef, connect, disconnect, analyserRef, inputAnalyserRef,
    mediaStreamRef, toggleMic, getMicMutedState, cleanupAudioResources,
    setIsIntentionalDisconnect, connectRef
  };
};
