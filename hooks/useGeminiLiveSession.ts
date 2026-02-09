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
  connectionStateRef,
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
    isReconnecting,
    isIntentionalDisconnect,
    setIsIntentionalDisconnect,
  } = useReconnection({
    maxAttempts: 5,
    onReconnect: () => connect(),
    onMaxAttemptsReached: () => {
      setConnectionState(ConnectionState.ERROR);
      showReconnectionFailure(addToast);
    },
  });

  // Latest values refs for session config (prevents re-triggering connect)
  const refs = useRef({
    personality,
    documentsContext,
    personalityFilesContext,
    selectedVoice,
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
      isFunctionCallingEnabled,
      isGoogleSearchEnabled,
      isVideoActive
    };
  }, [personality, documentsContext, personalityFilesContext, selectedVoice, isFunctionCallingEnabled, isGoogleSearchEnabled, isVideoActive]);

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
      if (!isReconnecting) setConnectionState(ConnectionState.CONNECTING);

      // Crucial: Clear stale session reference from previous attempts
      sessionRef.current = null;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
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

      const session = await ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025', // Restore original model name
        // Note: keeping the original model name pattern from the code
        callbacks: {
          onopen: async () => {
            console.log('Gemini Live Session Opened');
            setConnectionState(ConnectionState.CONNECTED);
            showConnectionSuccess(addToast);
            resetReconnection();

            if (refs.current.isVideoActive) startFrameTransmission();

            if (!inputAudioContextRef.current || !mediaStreamRef.current) return;
            const source = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
            activeSourceInputRef.current = source;
            if (inputAnalyserRef.current) source.connect(inputAnalyserRef.current);

            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const bufferSize = isMobile ? 1024 : 2048;
            const processor = inputAudioContextRef.current.createScriptProcessor(bufferSize, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
              // Only send if we have an active session ref and it's not the stale one
              if (!sessionRef.current) return;

              try {
                const inputData = e.inputBuffer.getChannelData(0);
                let sum = 0;
                for (let i = 0; i < inputData.length; i += (isMobile ? 4 : 1)) {
                  sum += inputData[i] * inputData[i];
                }
                const rms = Math.sqrt(sum / (inputData.length / (isMobile ? 4 : 1)));
                if (rms > 0.02) lastUserAudioTimeRef.current = Date.now();

                const pcmBlob = createBlob(inputData, DEFAULT_AUDIO_CONFIG.inputSampleRate);

                // Final safety check before sending
                if (sessionRef.current) {
                  sessionRef.current.sendRealtimeInput({ media: pcmBlob });
                }
              } catch (err: any) {
                if (err?.message?.includes('closed')) {
                  // Silent fail for already closed sessions to avoid console spam
                  return;
                }
                console.warn('[UseGemini] onaudioprocess error:', err);
              }
            };

            source.connect(processor);
            processor.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const addMessageToStore = useAppStore.getState().addMessageToCurrentSession;
            const serverContent = message.serverContent as any;

            // Transcripts logic
            ['userTurn', 'modelTurn'].forEach(turn => {
              const text = serverContent?.[turn]?.parts?.map((p: any) => p.text).join('').trim();
              if (text) addMessageToStore({ role: turn === 'userTurn' ? 'user' : 'model', content: text });
            });

            // Tool execution
            if (message.toolCall?.functionCalls) {
              const { setActiveDocument } = useUIStore.getState();
              const functionResponses = await Promise.all(message.toolCall.functionCalls.map(async (fc) => {
                try {
                  const result = await executeFunction(fc, {
                    onPersonalityChange,
                    onToggleScreenShare,
                    onOpenDocument: (doc) => setActiveDocument(doc)
                  });
                  showFunctionExecuted(addToast, fc.name);
                  return { id: fc.id, name: fc.name, response: result };
                } catch (error) {
                  console.warn(`[Self-Correction] Tool ${fc.name} failed, informing the model...`, error);
                  showSelfCorrection(addToast, fc.name);
                  return { id: fc.id, name: fc.name, response: { result: 'error', message: `Échec de l'outil ${fc.name} : ${String(error)}. Veuillez analyser l'erreur et tenter une correction autonome si possible.` } };
                }
              }));
              if (sessionRef.current) sessionRef.current.sendToolResponse({ functionResponses });
            }

            // Termination command check
            const modelText = serverContent?.modelTurn?.parts?.map((p: any) => p.text).join('').toLowerCase();
            if (modelText?.includes('terminer la session')) {
              showSessionEnd(addToast);
              disconnect(true);
              return;
            }

            // Audio output logic
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
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(gainNodeRef.current);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              audioSourcesRef.current.add(source);
              source.onended = () => audioSourcesRef.current.delete(source);
            }

            if (serverContent?.interrupted) {
              audioSourcesRef.current.forEach(src => { try { src.stop(); } catch (e) { } });
              audioSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsTalking(false);
            }
          },
          onclose: () => {
            if (!isIntentionalDisconnect && !isReconnecting) handleInternalReconnect();
          },
          onerror: (err: any) => {
            console.error('[UseGemini] Session error:', err);
            showSessionError(addToast, err?.message || 'Une erreur est survenue.');
            if (!isIntentionalDisconnect && !isReconnecting && err?.code !== 'AUTH_ERROR') {
              handleInternalReconnect();
            } else {
              setConnectionState(ConnectionState.ERROR);
              setTimeout(() => setConnectionState(ConnectionState.DISCONNECTED), 5000);
            }
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: refs.current.selectedVoice } } },
          systemInstruction: buildSystemInstruction(
            refs.current.personality.systemInstruction,
            refs.current.documentsContext,
            refs.current.personalityFilesContext
          ),
          tools: buildToolsConfig(refs.current.isFunctionCallingEnabled, refs.current.isGoogleSearchEnabled),
          // @ts-ignore
          transcription: { enabled: true },
        }
      });
      sessionRef.current = session;
    } catch (error: any) {
      console.error("[UseGemini] Connection failure:", error);
      cleanupAudioResources();
      showConnectionFailure(addToast, error.message || "Impossible de se connecter.");
      setConnectionState(ConnectionState.ERROR);
      setTimeout(() => setConnectionState(ConnectionState.DISCONNECTED), 3000);
      if (!isIntentionalDisconnect && !isReconnecting) scheduleReconnect();
    }
  }, [cleanupAudioResources, addToast, resetVisionState, setConnectionState, setIsTalking, setLatency, isReconnecting, isIntentionalDisconnect, scheduleReconnect, resetReconnection, sessionRef, onPersonalityChange, onToggleScreenShare, startFrameTransmission]);

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
