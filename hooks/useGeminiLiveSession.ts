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
  showSessionEnd,
  showSessionError,
  showSessionCreationError,
  showConnectionFailure,
} from '../utils/toastHelpers';

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
  sessionRef: React.MutableRefObject<any>;
  onPersonalityChange?: PersonalityChangeCallback;
}

export const useGeminiLiveSession = ({
  connectionState,
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
  sessionRef,
  onPersonalityChange,
}: UseGeminiLiveSessionProps) => {
  // Refs for audio
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
  const chatbotSpeechRecognitionRef = useRef<any>(null);
  const connectRef = useRef<(() => Promise<void>) | null>(null);

  // Hook de reconnexion simplifié
  const {
    scheduleReconnect,
    reset: resetReconnection,
    isReconnecting,
    isIntentionalDisconnect,
    setIsIntentionalDisconnect,
  } = useReconnection({
    maxAttempts: 5,
    onReconnect: (attempt) => {
      console.log(`[UseGemini] Tentative de reconnexion ${attempt}...`);
      connect();
    },
    onMaxAttemptsReached: () => {
      console.error('[UseGemini] Nombre maximum de tentatives de reconnexion atteint');
      setConnectionState(ConnectionState.ERROR);
      showReconnectionFailure(addToast);
    },
  });

  // Ref pour compatibilité avec App.tsx
  const isIntentionalDisconnectRef = useRef<boolean>(false);

  // Synchroniser le ref avec l'état du hook
  useEffect(() => {
    isIntentionalDisconnectRef.current = isIntentionalDisconnect;
  }, [isIntentionalDisconnect]);

  // Wrapper pour setIsIntentionalDisconnect qui met aussi à jour le ref
  const setIsIntentionalDisconnectWithRef = useCallback((value: boolean) => {
    setIsIntentionalDisconnect(value);
    isIntentionalDisconnectRef.current = value;
  }, [setIsIntentionalDisconnect]);

  // Keep track of current personality in a ref to avoid closures stale issues
  const currentPersonalityRef = useRef(personality);
  const documentsContextRef = useRef(documentsContext);
  const personalityFilesContextRef = useRef(personalityFilesContext);
  const selectedVoiceRef = useRef(selectedVoice);
  const isFunctionCallingEnabledRef = useRef(isFunctionCallingEnabled);
  const isGoogleSearchEnabledRef = useRef(isGoogleSearchEnabled);
  const isVideoActiveRef = useRef(isVideoActive);

  useEffect(() => {
    currentPersonalityRef.current = personality;
    documentsContextRef.current = documentsContext;
    personalityFilesContextRef.current = personalityFilesContext;
    selectedVoiceRef.current = selectedVoice;
    isFunctionCallingEnabledRef.current = isFunctionCallingEnabled;
    isGoogleSearchEnabledRef.current = isGoogleSearchEnabled;
    isVideoActiveRef.current = isVideoActive;
  }, [personality, documentsContext, personalityFilesContext, selectedVoice, isFunctionCallingEnabled, isGoogleSearchEnabled, isVideoActive]);

  const cleanupAudioResources = useCallback(() => {
    // Stop all audio sources
    audioSourcesRef.current.forEach(src => {
      try {
        src.stop();
        src.disconnect();
      } catch (e) {
        console.warn('[UseGemini] Erreur lors de l\'arrêt d\'une source audio:', e);
      }
    });
    audioSourcesRef.current.clear();
    nextStartTimeRef.current = 0;

    // Cleanup processor
    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
        processorRef.current.onaudioprocess = null;
      } catch (e) {
        console.warn('[UseGemini] Erreur lors du nettoyage du processor:', e);
      }
      processorRef.current = null;
    }

    if (activeSourceInputRef.current) {
      try {
        activeSourceInputRef.current.disconnect();
      } catch (e) {
        console.warn('[UseGemini] Erreur lors de la déconnexion de la source d\'entrée:', e);
      }
      activeSourceInputRef.current = null;
    }

    // Cleanup analysers
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch (e) {
        console.warn('[UseGemini] Erreur lors du nettoyage de l\'analyser:', e);
      }
      analyserRef.current = null;
    }

    if (inputAnalyserRef.current) {
      try {
        inputAnalyserRef.current.disconnect();
      } catch (e) {
        console.warn('[UseGemini] Erreur lors du nettoyage de l\'input analyser:', e);
      }
      inputAnalyserRef.current = null;
    }

    // Cleanup gain node
    if (gainNodeRef.current) {
      try {
        gainNodeRef.current.disconnect();
      } catch (e) {
        console.warn('[UseGemini] Erreur lors du nettoyage du gain node:', e);
      }
      gainNodeRef.current = null;
    }

    // Close audio contexts
    if (inputAudioContextRef.current) {
      try {
        inputAudioContextRef.current.close();
      } catch (e) {
        console.warn('[UseGemini] Erreur lors de la fermeture du contexte audio d\'entrée:', e);
      }
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      try {
        outputAudioContextRef.current.close();
      } catch (e) {
        console.warn('[UseGemini] Erreur lors de la fermeture du contexte audio de sortie:', e);
      }
      outputAudioContextRef.current = null;
    }

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.warn('[UseGemini] Erreur lors de l\'arrêt d\'une piste média:', e);
        }
      });
      mediaStreamRef.current = null;
    }
  }, []);

  const disconnect = useCallback((shouldReload: boolean = false) => {
    setIsIntentionalDisconnectWithRef(true);

    if (chatbotSpeechRecognitionRef.current) {
      try {
        chatbotSpeechRecognitionRef.current.stop();
        chatbotSpeechRecognitionRef.current = null;
      } catch (e) {
        console.warn('[UseGemini] Erreur lors de l\'arrêt de la reconnaissance vocale:', e);
      }
    }

    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch (e) {
        console.warn('[UseGemini] Erreur lors de la fermeture de session:', e);
      }
      sessionRef.current = null;
    }

    cleanupAudioResources();
    resetReconnection();

    resetVisionState();

    setConnectionState(ConnectionState.DISCONNECTED);
    setIsTalking(false);
    setLatency(0);

    if (shouldReload) {
      console.log('[UseGemini] 🔄 Redémarrage complet de l\'application...');
      showDisconnection(addToast);

      setTimeout(() => {
        console.log('[UseGemini] 🔄 Rechargement complet de l\'application...');
        window.location.reload();
      }, 500);
    }
  }, [cleanupAudioResources, resetVisionState, setConnectionState, setIsTalking, setLatency, addToast, setIsIntentionalDisconnectWithRef, resetReconnection]);

  const connect = useCallback(async () => {
    try {
      if (!isReconnecting) {
        setConnectionState(ConnectionState.CONNECTING);
      }

      // 1. Audio Contexts
      const InputContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new InputContextClass({ sampleRate: DEFAULT_AUDIO_CONFIG.inputSampleRate });
      const outputCtx = new InputContextClass({ sampleRate: DEFAULT_AUDIO_CONFIG.outputSampleRate });

      // Résoudre les contextes audio s'ils sont suspendus (nécessaire après un geste utilisateur)
      if (inputCtx.state === 'suspended') {
        await inputCtx.resume();
      }
      if (outputCtx.state === 'suspended') {
        await outputCtx.resume();
      }

      inputAudioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;

      // 2. Visualizer Setup
      const analyser = outputCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.5;
      analyserRef.current = analyser;

      const gainNode = outputCtx.createGain();
      gainNode.connect(analyser);
      analyser.connect(outputCtx.destination);
      gainNodeRef.current = gainNode;

      // 3. Microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // 5. Input Analyser (Visual Feedback)
      const inputAnalyser = inputCtx.createAnalyser();
      inputAnalyser.fftSize = 256;
      inputAnalyser.smoothingTimeConstant = 0.5;
      inputAnalyserRef.current = inputAnalyser;

      // 4. Gemini API
      // Note: Assuming process.env.API_KEY is available globally or injected via build process
      const apiKey = process.env.API_KEY || '';
      const ai = new GoogleGenAI({ apiKey });

      const handleReconnect = () => {
        if (isIntentionalDisconnect) {
          console.log('[UseGemini] Déconnexion intentionnelle, pas de reconnexion');
          return;
        }

        if (sessionRef.current) {
          try {
            sessionRef.current.close();
          } catch (e) {
            console.warn('[UseGemini] Erreur lors de la fermeture de session:', e);
          }
          sessionRef.current = null;
        }

        cleanupAudioResources();

        // Utiliser le hook de reconnexion pour gérer les tentatives
        scheduleReconnect();
      };

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: async () => {
            console.log('Gemini Live Session Opened');
            setConnectionState(ConnectionState.CONNECTED);
            showConnectionSuccess(addToast);
            resetReconnection();

            if (isVideoActiveRef.current) {
              startFrameTransmission();
            }

            if (!inputAudioContextRef.current || !mediaStreamRef.current) {
              console.warn('[UseGemini] AudioContext ou MediaStream manquant dans onopen');
              return;
            }

            // S'assurer que l'AudioContext est actif
            const inputCtx = inputAudioContextRef.current;
            if (inputCtx.state === 'suspended') {
              try {
                await inputCtx.resume();
              } catch (error) {
                console.error('[UseGemini] Erreur lors de la reprise de l\'AudioContext:', error);
                return;
              }
            }

            // Vérifier que l'analyser appartient au même contexte
            if (!inputAnalyserRef.current) {
              console.warn('[UseGemini] InputAnalyser manquant, création d\'un nouveau');
              const inputAnalyser = inputCtx.createAnalyser();
              inputAnalyser.fftSize = 256;
              inputAnalyser.smoothingTimeConstant = 0.5;
              inputAnalyserRef.current = inputAnalyser;
            }

            try {
              const source = inputCtx.createMediaStreamSource(mediaStreamRef.current);
              activeSourceInputRef.current = source;

              if (inputAnalyserRef.current) {
                source.connect(inputAnalyserRef.current);
              }

              const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
              const bufferSize = isMobile ? 1024 : 2048;

              // Note: ScriptProcessorNode est déprécié mais toujours fonctionnel
              // Pour une solution moderne, utiliser AudioWorkletNode (nécessite un fichier worklet séparé)
              const processor = inputCtx.createScriptProcessor(bufferSize, 1, 1);
              processorRef.current = processor;

              processor.onaudioprocess = (e) => {
                if (!sessionRef.current) {
                  return;
                }

                try {
                  const inputData = e.inputBuffer.getChannelData(0);

                  let sum = 0;
                  const dataLength = inputData.length;
                  const step = isMobile ? 4 : 1;
                  for (let i = 0; i < dataLength; i += step) {
                    sum += inputData[i] * inputData[i];
                  }
                  const rms = Math.sqrt(sum / (dataLength / step));
                  if (rms > 0.02) {
                    lastUserAudioTimeRef.current = Date.now();
                  }

                  const pcmBlob = createBlob(inputData, DEFAULT_AUDIO_CONFIG.inputSampleRate);

                  if (sessionRef.current && sessionRef.current.sendRealtimeInput) {
                    const sendPromise = sessionRef.current.sendRealtimeInput({ media: pcmBlob });
                    if (sendPromise && typeof sendPromise.catch === 'function') {
                      sendPromise.catch((err: any) => {
                        if (err && err.message && !err.message.includes('closed')) {
                          console.warn('[UseGemini] Erreur lors de l\'envoi audio:', err);
                        }
                      });
                    }
                  }
                } catch (error) {
                  console.warn('[UseGemini] Erreur dans onaudioprocess:', error);
                }
              };

              source.connect(processor);
              processor.connect(inputCtx.destination);
            } catch (error) {
              console.error('[UseGemini] Erreur lors de la configuration audio dans onopen:', error);
              // Nettoyer les ressources en cas d'erreur
              if (activeSourceInputRef.current) {
                try {
                  activeSourceInputRef.current.disconnect();
                } catch (e) {
                  console.warn('[UseGemini] Erreur lors du nettoyage de la source:', e);
                }
                activeSourceInputRef.current = null;
              }
              if (processorRef.current) {
                try {
                  processorRef.current.disconnect();
                  processorRef.current.onaudioprocess = null;
                } catch (e) {
                  console.warn('[UseGemini] Erreur lors du nettoyage du processor:', e);
                }
                processorRef.current = null;
              }
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            // Function Calls
            if (message.toolCall && message.toolCall.functionCalls) {
              console.log('[UseGemini] 🔧 Appel d\'outil détecté:', message.toolCall);
              const functionCalls = message.toolCall.functionCalls;
              const functionResponses = [];

              for (const functionCall of functionCalls) {
                try {
                  const functionId = functionCall.id || '';
                  const functionName = functionCall.name || '';
                  const functionArgs = functionCall.args || {};

                  console.log(`[UseGemini] 🔧 Exécution de la fonction: ${functionName}`, functionArgs);

                  const result = await executeFunction({
                    id: functionId,
                    name: functionName,
                    args: functionArgs
                  }, {
                    onPersonalityChange: onPersonalityChange
                  });

                  const response = {
                    id: functionId,
                    name: functionName,
                    response: result
                  };
                  functionResponses.push(response);

                  showFunctionExecuted(addToast, functionName);
                } catch (error) {
                  console.error(`[UseGemini] ❌ Erreur lors de l'exécution de ${functionCall.name}:`, error);
                  const errorResponse = {
                    id: functionCall.id || '',
                    name: functionCall.name || '',
                    response: {
                      result: 'error',
                      message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
                    }
                  };
                  functionResponses.push(errorResponse);
                  showFunctionError(addToast, functionCall.name || '');
                }
              }

              if (sessionRef.current && functionResponses.length > 0) {
                try {
                  await sessionRef.current.sendToolResponse({
                    functionResponses: functionResponses
                  });
                  console.log('[UseGemini] ✅ Réponses aux outils envoyées');
                } catch (error) {
                  console.error('[UseGemini] ❌ Erreur lors de l\'envoi des réponses:', error);
                }
              }
            }

            // Google Search Code Execution
            if (message.serverContent?.modelTurn) {
              const parts = message.serverContent.modelTurn.parts || [];
              for (const part of parts) {
                if ((part as any).executableCode) {
                  console.log('[UseGemini] 🔍 Code exécutable détecté (Google Search):', (part as any).executableCode.code);
                }
                if ((part as any).codeExecutionResult) {
                  console.log('[UseGemini] ✅ Résultat d\'exécution:', (part as any).codeExecutionResult.output);
                }
              }
            }

            // Text / Session termination commands
            const modelTurn = message.serverContent?.modelTurn;
            if (modelTurn) {
              const parts = modelTurn.parts || [];
              for (const part of parts) {
                const text = (part as any).text;
                if (text && typeof text === 'string' && text.trim().length > 0) {
                  const textLower = text.toLowerCase().trim();

                  const endSessionPhrases = [
                    'terminer la session',
                  ];

                  const shouldEndSession = endSessionPhrases.some(phrase =>
                    textLower.includes(phrase)
                  );

                  if (shouldEndSession) {
                    console.log('[UseGemini] ✅ Demande de terminer la session détectée dans le texte:', text);
                    console.log('[UseGemini] 🔄 Redémarrage complet de l\'application...');
                    showSessionEnd(addToast);
                    setIsIntentionalDisconnectWithRef(true);

                    if (chatbotSpeechRecognitionRef.current) {
                      try {
                        chatbotSpeechRecognitionRef.current.stop();
                        chatbotSpeechRecognitionRef.current = null;
                      } catch (e) { }
                    }

                    disconnect(true);
                    return;
                  }
                }
              }
            }

            // Handle Audio
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current && gainNodeRef.current) {
              if (lastUserAudioTimeRef.current > 0) {
                const currentLatency = Date.now() - lastUserAudioTimeRef.current;
                if (currentLatency < 5000) {
                  setLatency(currentLatency);
                }
              }

              setIsTalking(true);
              const ctx = outputAudioContextRef.current;

              nextStartTimeRef.current = Math.max(
                nextStartTimeRef.current,
                ctx.currentTime
              );

              const audioBytes = base64ToArrayBuffer(base64Audio);
              const audioBuffer = await decodeAudioData(
                audioBytes,
                ctx,
                DEFAULT_AUDIO_CONFIG.outputSampleRate
              );

              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(gainNodeRef.current);

              source.addEventListener('ended', () => {
                audioSourcesRef.current.delete(source);
                if (audioSourcesRef.current.size === 0) {
                  setIsTalking(false);
                  setTimeout(() => {
                    if (chatbotSpeechRecognitionRef.current && audioSourcesRef.current.size === 0) {
                      try {
                        chatbotSpeechRecognitionRef.current.stop();
                        chatbotSpeechRecognitionRef.current = null;
                        console.log('[UseGemini] Reconnaissance vocale arrêtée après fin de réponse');
                      } catch (e) { }
                    }
                  }, 2000);
                }
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              audioSourcesRef.current.add(source);

              if (!chatbotSpeechRecognitionRef.current && audioSourcesRef.current.size === 1) {
                const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                if (SpeechRecognition) {
                  const recognition = new SpeechRecognition();
                  recognition.continuous = true;
                  recognition.interimResults = true;
                  recognition.lang = 'fr-FR';

                  recognition.onresult = (event: any) => {
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                      const result = event.results[i];
                      const transcript = result[0].transcript.toLowerCase().trim();
                      const isFinal = result.isFinal;

                      if (transcript.length > 0) {
                        console.log(`[UseGemini] Transcription (${isFinal ? 'FINAL' : 'intermédiaire'}):`, transcript);
                      }

                      if (isFinal && transcript.length > 0) {
                        const endSessionKeywords = [
                          'terminer', 'redémarrer', 'relancer', 'arrêter', 'fermer', 'fin', 'stop'
                        ];

                        const endSessionPhrases = [
                          'terminer la session', 'la session se termine', 'session se termine', 'se termine',
                          'se termine ici', 'terminer ici', 'fin de session', 'terminer session',
                          'redémarrer l\'application', 'redémarrer application', 'redémarrer app', 'redémarrer l app',
                          'relancer l\'application', 'relancer application', 'relancer app', 'relancer l app',
                          'arrêter la session', 'arrêter session', 'fermer la session', 'fermer session',
                          'session terminée', 'session est terminée'
                        ];

                        let shouldEndSession = endSessionPhrases.some(phrase => {
                          const found = transcript.includes(phrase);
                          if (found) {
                            console.log('[UseGemini] ✅ Phrase complète détectée:', phrase, 'dans:', transcript);
                          }
                          return found;
                        });

                        if (!shouldEndSession) {
                          shouldEndSession = endSessionKeywords.some(keyword => {
                            const keywordIndex = transcript.indexOf(keyword);
                            if (keywordIndex !== -1) {
                              const contextStart = Math.max(0, keywordIndex - 20);
                              const contextEnd = Math.min(transcript.length, keywordIndex + keyword.length + 20);
                              const context = transcript.substring(contextStart, contextEnd);

                              const contextIndicators = ['session', 'app', 'application', 'ici', 'maintenant', 'tout de suite'];
                              const hasContext = contextIndicators.some(indicator => context.includes(indicator));

                              if (hasContext || keyword === 'redémarrer' || keyword === 'relancer') {
                                console.log('[UseGemini] ✅ Mot-clé avec contexte détecté:', keyword, 'dans:', transcript);
                                return true;
                              }
                            }
                            return false;
                          });
                        }

                        if (shouldEndSession) {
                          console.log('[UseGemini] ✅✅✅ DEMANDE DE TERMINER LA SESSION DÉTECTÉE:', transcript);
                          console.log('[UseGemini] 🔄 Redémarrage complet de l\'application...');
                          showSessionEnd(addToast);
                          setIsIntentionalDisconnectWithRef(true);

                          try {
                            recognition.stop();
                            chatbotSpeechRecognitionRef.current = null;
                          } catch (e) {
                            console.warn('[UseGemini] Erreur lors de l\'arrêt de la reconnaissance:', e);
                          }

                          console.log('[UseGemini] 🔄 Appel de disconnect(true) pour redémarrer complètement...');
                          disconnect(true);
                          return;
                        }
                      }
                    }
                  };

                  recognition.onerror = (event: any) => {
                    const ignorableErrors = ['no-speech', 'aborted'];
                    if (!ignorableErrors.includes(event.error)) {
                      console.warn('[UseGemini] Erreur reconnaissance chatbot:', event.error);
                    }
                  };

                  recognition.onend = () => {
                    chatbotSpeechRecognitionRef.current = null;
                  };

                  try {
                    recognition.start();
                    chatbotSpeechRecognitionRef.current = recognition;
                    console.log('[UseGemini] 🎤 Reconnaissance vocale démarrée pour écouter le chatbot');
                  } catch (e) {
                    console.warn('[UseGemini] Impossible de démarrer la reconnaissance:', e);
                  }
                }
              }
            }

            if (message.serverContent?.interrupted) {
              audioSourcesRef.current.forEach(src => {
                try { src.stop(); } catch (e) { }
              });
              audioSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsTalking(false);
            }
          },
          onclose: (event) => {
            console.log('[UseGemini] Session fermée', event);
            if (!isIntentionalDisconnect && !isReconnecting) {
              console.log('[UseGemini] Fermeture inattendue, tentative de reconnexion...');
              handleReconnect();
            } else {
              console.log('[UseGemini] Fermeture intentionnelle ou reconnexion en cours');
            }
          },
          onerror: (err) => {
            console.error('[UseGemini] Erreur de session:', err);

            let errorMessage = 'Une erreur est survenue avec Gemini Live.';
            if (err && typeof err === 'object') {
              const errorObj = err as any;
              if (errorObj.message) {
                errorMessage = errorObj.message;
              } else if (errorObj.code) {
                switch (errorObj.code) {
                  case 'NETWORK_ERROR':
                    errorMessage = 'Erreur réseau. Vérifiez votre connexion internet.';
                    break;
                  case 'AUTH_ERROR':
                    errorMessage = 'Erreur d\'authentification. Vérifiez votre clé API.';
                    break;
                  case 'RATE_LIMIT':
                    errorMessage = 'Limite de requêtes atteinte. Veuillez réessayer plus tard.';
                    break;
                  default:
                    errorMessage = `Erreur: ${errorObj.code}`;
                }
              }
            }

            showSessionError(addToast, errorMessage);

            if (!isIntentionalDisconnect && !isReconnecting) {
              const shouldReconnect = !(err && typeof err === 'object' && (err as any).code === 'AUTH_ERROR');
              if (shouldReconnect) {
                handleReconnect();
              } else {
                setConnectionState(ConnectionState.ERROR);
                setTimeout(() => {
                  setConnectionState(ConnectionState.DISCONNECTED);
                }, 5000);
              }
            }
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoiceRef.current } }
          },
          systemInstruction: buildSystemInstruction(
            currentPersonalityRef.current.systemInstruction,
            documentsContextRef.current,
            personalityFilesContextRef.current
          ),
          tools: buildToolsConfig(isFunctionCallingEnabledRef.current, isGoogleSearchEnabledRef.current),
        }
      });

      sessionPromise.then(session => {
        sessionRef.current = session;
      }).catch((error) => {
        console.error('[UseGemini] Erreur lors de la création de session:', error);
        cleanupAudioResources();
        setConnectionState(ConnectionState.ERROR);
        showSessionCreationError(addToast);

        if (!isIntentionalDisconnect) {
          setTimeout(() => {
            setConnectionState(ConnectionState.DISCONNECTED);
          }, 3000);
        }
      });

    } catch (error) {
      console.error("[UseGemini] Échec de connexion:", error);

      cleanupAudioResources();

      let errorMessage = "Impossible de se connecter au serveur.";
      let shouldRetry = true;

      if (error instanceof Error) {
        const errorName = error.name;
        const errorMsg = error.message.toLowerCase();

        if (errorName === 'NotAllowedError' || errorMsg.includes('permission') || errorMsg.includes('microphone')) {
          errorMessage = "Permission microphone refusée. Veuillez autoriser l'accès au microphone.";
          shouldRetry = false;
        } else if (errorName === 'NotFoundError' || errorMsg.includes('not found')) {
          errorMessage = "Microphone non trouvé. Vérifiez vos périphériques audio.";
          shouldRetry = false;
        } else if (errorName === 'NotReadableError' || errorMsg.includes('not readable')) {
          errorMessage = "Microphone non accessible. Il est peut-être utilisé par une autre application.";
          shouldRetry = true;
        } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
          errorMessage = "Erreur réseau. Vérifiez votre connexion internet.";
          shouldRetry = true;
        } else if (errorMsg.includes('api key') || errorMsg.includes('authentication')) {
          errorMessage = "Erreur d'authentification. Vérifiez votre clé API Gemini.";
          shouldRetry = false;
        }
      }

      showConnectionFailure(addToast, errorMessage);

      if (shouldRetry && !isIntentionalDisconnect) {
        if (!isReconnecting) {
          scheduleReconnect();
        } else {
          // Si on est déjà en train de reconnecter, on laisse le hook gérer
          setConnectionState(ConnectionState.ERROR);
          setTimeout(() => {
            setConnectionState(ConnectionState.DISCONNECTED);
          }, 5000);
        }
      } else {
        setConnectionState(ConnectionState.ERROR);
        setTimeout(() => {
          setConnectionState(ConnectionState.DISCONNECTED);
        }, 5000);
      }
    }
  }, [cleanupAudioResources, addToast, resetVisionState, setConnectionState, setIsTalking, setLatency, isReconnecting, isIntentionalDisconnect, scheduleReconnect, resetReconnection]);

  // Sync connect function ref
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  // Toggle microphone mute/unmute
  const toggleMic = useCallback(() => {
    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      return !audioTracks[0]?.enabled; // Return new muted state
    }
    return false;
  }, []);

  // Get current mic muted state
  const getMicMutedState = useCallback(() => {
    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      return audioTracks.length > 0 ? !audioTracks[0].enabled : false;
    }
    return false;
  }, []);

  return {
    sessionRef,
    connect,
    disconnect,
    analyserRef,
    inputAnalyserRef,
    mediaStreamRef,
    toggleMic,
    getMicMutedState,
    cleanupAudioResources,
    isIntentionalDisconnectRef,
    setIsIntentionalDisconnect: setIsIntentionalDisconnectWithRef,
    connectRef,
  };
};

