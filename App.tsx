import React, { useEffect, useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import Visualizer from './components/Visualizer';
import ControlPanel from './components/ControlPanel';
import Header from './components/Header';
import PersonalityEditor from './components/PersonalityEditor';
import { ToastContainer } from './components/Toast';
import QuickStartGuide from './components/QuickStartGuide';
import { ConnectionState, DEFAULT_AUDIO_CONFIG, Personality } from './types';
import { DEFAULT_PERSONALITY } from './constants';
import { createBlob, decodeAudioData, base64ToArrayBuffer } from './utils/audioUtils';
import { buildSystemInstruction } from './systemConfig';
import { WakeWordDetector } from './utils/wakeWordDetector';
import type { ProcessedDocument } from './utils/documentProcessor';
import InstallPWA from './components/InstallPWA';
import { buildToolsConfig, executeFunction } from './utils/tools';
import NotesViewer from './components/NotesViewer';
import ToolsList from './components/ToolsList';
import TasksViewer from './components/TasksViewer';
import AgendaViewer from './components/AgendaViewer';
import { useStatusManager } from './hooks/useStatusManager';
import { useAudioManager } from './hooks/useAudioManager';
import { useVisionManager } from './hooks/useVisionManager';
import { useLocalStorageState } from './hooks/useLocalStorageState';
import VideoOverlay from './components/VideoOverlay';

const deserializeDocuments = (raw: string) => {
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.map((doc: any) => ({
    ...doc,
    uploadedAt: doc?.uploadedAt ? new Date(doc.uploadedAt) : new Date(),
  })) as ProcessedDocument[];
};

const deserializeBoolean = (raw: string) => raw === 'true';
const serializeBoolean = (v: boolean) => (v ? 'true' : 'false');

const App: React.FC = () => {
  const sessionRef = useRef<any>(null);

  const {
    connectionState,
    setConnectionState,
    connectionStateRef,
    isTalking,
    setIsTalking,
    latency,
    setLatency,
    toasts,
    addToast,
    removeToast,
  } = useStatusManager();

  const {
    activateAudioContext,
    playBeep,
  } = useAudioManager();

  const [selectedVoice, setSelectedVoice] = useState<string>(DEFAULT_PERSONALITY.voiceName);

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

  const [currentPersonality, setCurrentPersonality] = useLocalStorageState<Personality>(
    'currentPersonality',
    DEFAULT_PERSONALITY,
    {
      validate: isPersonality,
      onError: (e) => console.warn('Erreur lors du chargement de la personnalité:', e),
    },
  );
  const [isPersonalityEditorOpen, setIsPersonalityEditorOpen] = useState(false);
  const [isNotesViewerOpen, setIsNotesViewerOpen] = useState(false);
  const [isToolsListOpen, setIsToolsListOpen] = useState(false);
  const [isTasksViewerOpen, setIsTasksViewerOpen] = useState(false);
  const [isAgendaViewerOpen, setIsAgendaViewerOpen] = useState(false);
  const [isMobileActionsDrawerOpen, setIsMobileActionsDrawerOpen] = useState(false);
  
  // Document Upload State
  const [uploadedDocuments, setUploadedDocuments] = useLocalStorageState<ProcessedDocument[]>(
    'uploadedDocuments',
    [],
    {
      deserialize: deserializeDocuments,
      validate: (v): v is ProcessedDocument[] => Array.isArray(v),
      onError: (e) => console.warn('Erreur lors du chargement des documents:', e),
    },
  );
  
  // Wake Word Detection State
  const [isWakeWordEnabled, setIsWakeWordEnabled] = useLocalStorageState<boolean>('wakeWordEnabled', false, {
    deserialize: deserializeBoolean,
    serialize: serializeBoolean,
  });

  // Tools State
  const [isFunctionCallingEnabled, setIsFunctionCallingEnabled] = useLocalStorageState<boolean>(
    'functionCallingEnabled',
    true,
    {
      deserialize: deserializeBoolean,
      serialize: serializeBoolean,
    },
  );
  const [isGoogleSearchEnabled, setIsGoogleSearchEnabled] = useLocalStorageState<boolean>(
    'googleSearchEnabled',
    false,
    {
      deserialize: deserializeBoolean,
      serialize: serializeBoolean,
    },
  );

  // Refs
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
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const isReconnectingRef = useRef<boolean>(false);
  const isIntentionalDisconnectRef = useRef<boolean>(false);
  const currentPersonalityRef = useRef(currentPersonality); // Ref for seamless updates
  const uploadedDocumentsRef = useRef<ProcessedDocument[]>([]); // Ref for documents
  const wakeWordDetectorRef = useRef<WakeWordDetector | null>(null);
  const connectRef = useRef<(() => Promise<void>) | null>(null);
  const chatbotSpeechRecognitionRef = useRef<any>(null); // SpeechRecognition API
  const loadDocumentsContext = useCallback(async (): Promise<string | undefined> => {
    if (uploadedDocumentsRef.current.length === 0) {
      return undefined;
    }
    const { formatDocumentForContext } = await import('./utils/documentProcessor');
    return formatDocumentForContext(uploadedDocumentsRef.current);
  }, []);

  const {
    isVideoActive,
    setIsVideoActive,
    isVideoActiveRef,
    isScreenShareActive,
    toggleScreenShare,
    availableCameras,
    availableCamerasRef,
    selectedCameraId,
    setSelectedCameraId,
    selectedCameraIdRef,
    changeCamera,
    enumerateCameras,
    startFrameTransmission,
    resetVisionState,
    videoRef,
    canvasRef,
    videoStreamRef,
    screenStreamRef,
    isVideoEnlarged,
    setIsVideoEnlarged,
  } = useVisionManager({
    connectionState,
    addToast,
    sessionRef,
  });

  // Sync refs with state
  useEffect(() => {
    currentPersonalityRef.current = currentPersonality;
    console.log('[App] Ref personnalité mise à jour:', currentPersonality.name);
  }, [currentPersonality]);

  useEffect(() => {
    uploadedDocumentsRef.current = uploadedDocuments;
  }, [uploadedDocuments]);

  // Personality Management
  const handlePersonalityChange = (newPersonality: Personality) => {
    setCurrentPersonality(newPersonality);
    addToast('success', 'Personnalité Mise à Jour', `NeuroChat est maintenant : ${newPersonality.name}. La personnalité sera conservée jusqu'à modification.`);
    
    // If connected, we need to update the session (reconnect for now to apply system prompt)
    if (connectionState === ConnectionState.CONNECTED) {
        // In a real pro version, we might send a tool call to update prompt dynamically
        // For now, a quick seamless reconnect is safer
        disconnect();
        setTimeout(() => {
            connect();
        }, 500);
    }
  };

  // Tools Management
  const handleFunctionCallingToggle = (enabled: boolean) => {
    setIsFunctionCallingEnabled(enabled);
    addToast('success', 'Appel de fonction', enabled ? 'Appel de fonction activé' : 'Appel de fonction désactivé');
    
    // Reconnecter si connecté pour appliquer les changements
    if (connectionState === ConnectionState.CONNECTED) {
      disconnect();
      setTimeout(() => {
        connect();
      }, 500);
    }
  };

  const handleGoogleSearchToggle = (enabled: boolean) => {
    setIsGoogleSearchEnabled(enabled);
    addToast('success', 'Google Search', enabled ? 'Google Search activé' : 'Google Search désactivé');
    
    // Reconnecter si connecté pour appliquer les changements
    if (connectionState === ConnectionState.CONNECTED) {
      disconnect();
      setTimeout(() => {
        connect();
      }, 500);
    }
  };

  // Document Management
  const handleDocumentsChange = (documents: ProcessedDocument[]) => {
    setUploadedDocuments(documents);
    
    // Si connecté, reconnecter pour inclure les nouveaux documents
    if (connectionState === ConnectionState.CONNECTED) {
      addToast('info', 'Documents Mis à Jour', 'Reconnexion pour appliquer les changements...');
      disconnect();
      setTimeout(() => {
        connect();
      }, 500);
    } else {
      addToast('success', 'Documents Chargés', `${documents.length} document(s) prêt(s) à être utilisés`);
    }
  };
  // Vision logic gérée via useVisionManager

  // Activer le contexte audio au premier clic sur la page
  useEffect(() => {
    const handleFirstInteraction = () => {
      activateAudioContext();
      // Retirer les listeners après la première activation
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('touchstart', handleFirstInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [activateAudioContext]);

  // Wake Word Detection - Écoute pour "Neurochat"
  useEffect(() => {
    // Initialiser le détecteur de wake word
    if (!wakeWordDetectorRef.current) {
      wakeWordDetectorRef.current = new WakeWordDetector({
        wakeWord: 'bonjour', // Supporte "Bonjour", "Neurochat", ou "Bonjour Neurochat"
        lang: 'fr-FR',
        continuous: true,
        onWakeWordDetected: () => {
          console.log('[App] Wake word détecté, tentative de connexion...');
          // Activer le contexte audio si ce n'est pas déjà fait
          activateAudioContext();
          // Émettre un bip pour signaler qu'on peut parler
          playBeep();
          
          // Déclencher la connexion si on n'est pas déjà connecté
          const currentState = connectionStateRef.current;
          console.log('[App] État actuel de la connexion:', currentState);
          if (currentState === ConnectionState.DISCONNECTED || currentState === ConnectionState.ERROR) {
            addToast('info', 'Wake Word Détecté', 'Connexion au chat en cours...');
            isIntentionalDisconnectRef.current = false;
            if (connectRef.current) {
              console.log('[App] Appel de la fonction connect()...');
              connectRef.current();
            } else {
              console.error('[App] Erreur: connectRef.current est null!');
            }
          } else {
            console.log('[App] Déjà connecté, connexion ignorée');
          }
        },
      });
    }

    // Démarrer l'écoute si on n'est pas connecté ET si le wake word est activé
    if ((connectionState === ConnectionState.DISCONNECTED || connectionState === ConnectionState.ERROR) && isWakeWordEnabled) {
      if (wakeWordDetectorRef.current && !wakeWordDetectorRef.current.isActive()) {
        wakeWordDetectorRef.current.start();
      }
    } else {
      // Arrêter l'écoute si on est connecté OU si le wake word est désactivé
      if (wakeWordDetectorRef.current && wakeWordDetectorRef.current.isActive()) {
        wakeWordDetectorRef.current.stop();
      }
    }

    // Cleanup au démontage
    return () => {
      if (wakeWordDetectorRef.current) {
        wakeWordDetectorRef.current.destroy();
        wakeWordDetectorRef.current = null;
      }
    };
  }, [connectionState, isWakeWordEnabled]);

  // Sauvegarder la préférence du wake word dans localStorage
  // (géré automatiquement par useLocalStorageState)

  useEffect(() => {
    return () => {
      disconnect();
      if (wakeWordDetectorRef.current) {
        wakeWordDetectorRef.current.destroy();
      }
    };
  }, []);

  const connect = useCallback(async () => {
    try {
      if (!isReconnectingRef.current) {
        setConnectionState(ConnectionState.CONNECTING);
      }
      
      // 1. Audio Contexts
      const InputContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new InputContextClass({ sampleRate: DEFAULT_AUDIO_CONFIG.inputSampleRate });
      const outputCtx = new InputContextClass({ sampleRate: DEFAULT_AUDIO_CONFIG.outputSampleRate });
      
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
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const handleReconnect = () => {
        if (reconnectAttemptsRef.current < 5) {
            isReconnectingRef.current = true;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
            console.log(`Reconnecting in ${delay}ms... (Attempt ${reconnectAttemptsRef.current + 1}/5)`);
            
            if (sessionRef.current) {
                 try { sessionRef.current.close(); } catch(e) {}
                 sessionRef.current = null;
            }
            
            reconnectTimeoutRef.current = setTimeout(() => {
                reconnectAttemptsRef.current++;
                connect();
            }, delay);
        } else {
            console.error("Max reconnect attempts reached");
            setConnectionState(ConnectionState.ERROR);
            isReconnectingRef.current = false;
            disconnect();
        }
      };

      const documentsContext = await loadDocumentsContext();

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log('Gemini Live Session Opened');
            setConnectionState(ConnectionState.CONNECTED);
            addToast('success', 'Connecté', 'Session NeuroChat active');
            reconnectAttemptsRef.current = 0;
            isReconnectingRef.current = false;
            
            if (isVideoActive) {
                startFrameTransmission();
            }

            if (!inputAudioContextRef.current || !mediaStreamRef.current) return;
            
            const source = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
            activeSourceInputRef.current = source;

            // Connect to Input Analyser
            if (inputAnalyserRef.current) {
                source.connect(inputAnalyserRef.current);
            }

            // OPTIMIZATION: Reduced buffer size to 2048 for lower latency
            const processor = inputAudioContextRef.current.createScriptProcessor(2048, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Simple VAD for Latency Tracking
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
              const rms = Math.sqrt(sum / inputData.length);
              if (rms > 0.02) {
                  lastUserAudioTimeRef.current = Date.now();
              }

              const pcmBlob = createBlob(inputData, DEFAULT_AUDIO_CONFIG.inputSampleRate);
              sessionPromise.then((session) => {
                 session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(processor);
            processor.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Gérer les appels d'outils (function calls)
            if (message.toolCall && message.toolCall.functionCalls) {
              console.log('[App] 🔧 Appel d\'outil détecté:', message.toolCall);
              const functionCalls = message.toolCall.functionCalls;
              const functionResponses = [];
              
              for (const functionCall of functionCalls) {
                try {
                  const functionId = functionCall.id || '';
                  const functionName = functionCall.name || '';
                  const functionArgs = functionCall.args || {};
                  
                  console.log(`[App] 🔧 Exécution de la fonction: ${functionName}`, functionArgs);
                  
                  // Exécuter la fonction
                  const result = await executeFunction({
                    id: functionId,
                    name: functionName,
                    args: functionArgs
                  });
                  
                  // Créer la réponse avec le type du SDK
                  const response = {
                    id: functionId,
                    name: functionName,
                    response: result
                  };
                  functionResponses.push(response);
                  
                  // Afficher une notification
                  addToast('info', 'Fonction exécutée', `Fonction ${functionName} exécutée avec succès`);
                } catch (error) {
                  console.error(`[App] ❌ Erreur lors de l'exécution de ${functionCall.name}:`, error);
                  const errorResponse = {
                    id: functionCall.id || '',
                    name: functionCall.name || '',
                    response: {
                      result: 'error',
                      message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
                    }
                  };
                  functionResponses.push(errorResponse);
                  addToast('error', 'Erreur', `Erreur lors de l'exécution de ${functionCall.name}`);
                }
              }
              
              // Envoyer les réponses à l'API
              if (sessionRef.current && functionResponses.length > 0) {
                try {
                  await sessionRef.current.sendToolResponse({
                    functionResponses: functionResponses
                  });
                  console.log('[App] ✅ Réponses aux outils envoyées');
                } catch (error) {
                  console.error('[App] ❌ Erreur lors de l\'envoi des réponses:', error);
                }
              }
            }

            // Gérer les résultats d'exécution de code (pour Google Search)
            if (message.serverContent?.modelTurn) {
              const parts = message.serverContent.modelTurn.parts || [];
              for (const part of parts) {
                // Vérifier s'il y a du code exécutable (Google Search utilise cela)
                if ((part as any).executableCode) {
                  console.log('[App] 🔍 Code exécutable détecté (Google Search):', (part as any).executableCode.code);
                }
                if ((part as any).codeExecutionResult) {
                  console.log('[App] ✅ Résultat d\'exécution:', (part as any).codeExecutionResult.output);
                }
              }
            }

            // Vérifier si le message contient du texte/transcription (seulement si texte présent)
            const modelTurn = message.serverContent?.modelTurn;
            if (modelTurn) {
              const parts = modelTurn.parts || [];
              for (const part of parts) {
                const text = (part as any).text;
                if (text && typeof text === 'string' && text.trim().length > 0) {
                  const textLower = text.toLowerCase().trim();
                  
                  // Phrases qui indiquent une demande de terminer la session
                  const endSessionPhrases = [
                    'terminer la session',
                    
                  ];
                  
                  const shouldEndSession = endSessionPhrases.some(phrase => 
                    textLower.includes(phrase)
                  );
                  
                  if (shouldEndSession) {
                    console.log('[App] ✅ Demande de terminer la session détectée dans le texte:', text);
                    console.log('[App] 🔄 Redémarrage complet de l\'application...');
                    addToast('info', 'Fin de session', 'Redémarrage complet de l\'application...');
                    isIntentionalDisconnectRef.current = true;
                    
                    // Arrêter immédiatement tous les processus
                    if (chatbotSpeechRecognitionRef.current) {
                      try {
                        chatbotSpeechRecognitionRef.current.stop();
                        chatbotSpeechRecognitionRef.current = null;
                      } catch (e) {}
                    }
                    
                    // Nettoyer et redémarrer immédiatement
                      disconnect(true);
                    return;
                  }
                  
                  // Détecter les commandes de vision avec la fonction améliorée
                }
              }
            }

            // Handle Audio
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current && gainNodeRef.current) {
              // Calculate Latency
              if (lastUserAudioTimeRef.current > 0) {
                  const currentLatency = Date.now() - lastUserAudioTimeRef.current;
                  // Filter outliers
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
                    // Garder la reconnaissance vocale active encore 2 secondes après la fin de la réponse
                    // pour capturer les dernières phrases du chatbot
                    setTimeout(() => {
                      if (chatbotSpeechRecognitionRef.current && audioSourcesRef.current.size === 0) {
                        try {
                          chatbotSpeechRecognitionRef.current.stop();
                          chatbotSpeechRecognitionRef.current = null;
                          console.log('[App] Reconnaissance vocale arrêtée après fin de réponse');
                        } catch (e) {}
                      }
                    }, 2000);
                }
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              audioSourcesRef.current.add(source);

              // Démarrer la reconnaissance vocale pour écouter ce que dit le chatbot
              // (via le microphone qui capte l'audio des haut-parleurs)
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
                      
                      // Log toutes les transcriptions (même intermédiaires) pour déboguer
                      if (transcript.length > 0) {
                        console.log(`[App] Transcription (${isFinal ? 'FINAL' : 'intermédiaire'}):`, transcript);
                      }
                      
                      // Vérifier les commandes de fin de session uniquement dans les transcriptions finales
                      if (isFinal && transcript.length > 0) {
                        // Mots-clés qui indiquent une demande de terminer la session (détection flexible)
                        const endSessionKeywords = [
                          'terminer',
                          'redémarrer',
                          'relancer',
                          'arrêter',
                          'fermer',
                          'fin',
                          'stop'
                        ];
                        
                        // Phrases complètes à détecter (avec variantes)
                        const endSessionPhrases = [
                          'terminer la session',
                          'la session se termine',
                          'session se termine',
                          'se termine',
                          'se termine ici',
                          'terminer ici',
                          'fin de session',
                          'terminer session',
                          'redémarrer l\'application',
                          'redémarrer application',
                          'redémarrer app',
                          'redémarrer l app',
                          'relancer l\'application',
                          'relancer application',
                          'relancer app',
                          'relancer l app',
                          'arrêter la session',
                          'arrêter session',
                          'fermer la session',
                          'fermer session',
                          'session terminée',
                          'session est terminée'
                        ];
                        
                        // Vérifier d'abord les phrases complètes
                        let shouldEndSession = endSessionPhrases.some(phrase => {
                          const found = transcript.includes(phrase);
                          if (found) {
                            console.log('[App] ✅ Phrase complète détectée:', phrase, 'dans:', transcript);
                          }
                          return found;
                        });
                        
                        // Si pas de phrase complète, vérifier les mots-clés avec contexte
                        if (!shouldEndSession) {
                          shouldEndSession = endSessionKeywords.some(keyword => {
                            const keywordIndex = transcript.indexOf(keyword);
                            if (keywordIndex !== -1) {
                              // Vérifier le contexte autour du mot-clé (20 caractères avant et après)
                              const contextStart = Math.max(0, keywordIndex - 20);
                              const contextEnd = Math.min(transcript.length, keywordIndex + keyword.length + 20);
                              const context = transcript.substring(contextStart, contextEnd);
                              
                              // Vérifier si le contexte suggère une fin de session
                              const contextIndicators = ['session', 'app', 'application', 'ici', 'maintenant', 'tout de suite'];
                              const hasContext = contextIndicators.some(indicator => context.includes(indicator));
                              
                              if (hasContext || keyword === 'redémarrer' || keyword === 'relancer') {
                                console.log('[App] ✅ Mot-clé avec contexte détecté:', keyword, 'dans:', transcript);
                                return true;
                              }
                            }
                            return false;
                          });
                        }
                        
                        if (shouldEndSession) {
                          console.log('[App] ✅✅✅ DEMANDE DE TERMINER LA SESSION DÉTECTÉE:', transcript);
                          console.log('[App] 🔄 Redémarrage complet de l\'application...');
                          addToast('info', 'Fin de session', 'Redémarrage complet de l\'application...');
                          isIntentionalDisconnectRef.current = true;
                          
                          // Arrêter la reconnaissance
                          try {
                            recognition.stop();
                            chatbotSpeechRecognitionRef.current = null;
                          } catch (e) {
                            console.warn('[App] Erreur lors de l\'arrêt de la reconnaissance:', e);
                          }
                          
                          // Redémarrer immédiatement
                          console.log('[App] 🔄 Appel de disconnect(true) pour redémarrer complètement...');
                          disconnect(true);
                          return;
                        }
                      }
                    }
                  };
                  
                  recognition.onerror = (event: any) => {
                    // Ignorer les erreurs normales
                    const ignorableErrors = ['no-speech', 'aborted'];
                    if (!ignorableErrors.includes(event.error)) {
                      console.warn('[App] Erreur reconnaissance chatbot:', event.error);
                    }
                  };
                  
                  recognition.onend = () => {
                    chatbotSpeechRecognitionRef.current = null;
                  };
                  
                  try {
                    recognition.start();
                    chatbotSpeechRecognitionRef.current = recognition;
                    console.log('[App] 🎤 Reconnaissance vocale démarrée pour écouter le chatbot');
                  } catch (e) {
                    console.warn('[App] Impossible de démarrer la reconnaissance:', e);
                  }
                }
              }
            }

            if (message.serverContent?.interrupted) {
              audioSourcesRef.current.forEach(src => {
                try { src.stop(); } catch(e) {}
              });
              audioSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsTalking(false);
            }
          },
          onclose: () => {
            console.log('Session closed');
            if (!isIntentionalDisconnectRef.current) {
                handleReconnect();
            } else {
                disconnect();
            }
          },
          onerror: (err) => {
            console.error('Session error', err);
            addToast('error', 'Erreur Session', 'Une erreur est survenue avec Gemini Live.');
            if (!isIntentionalDisconnectRef.current) {
                handleReconnect();
            } else {
                disconnect();
            }
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } }
          },
          systemInstruction: buildSystemInstruction(
            currentPersonalityRef.current.systemInstruction,
            documentsContext
          ),
          tools: buildToolsConfig(isFunctionCallingEnabled, isGoogleSearchEnabled),
        }
      });

      sessionPromise.then(session => {
        sessionRef.current = session;
      });

    } catch (error) {
      console.error("Connection failed:", error);
      addToast('error', 'Échec Connexion', "Impossible de se connecter au serveur.");
      
      if (isReconnectingRef.current && reconnectAttemptsRef.current < 5) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
        reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
        }, delay);
      } else {
        setConnectionState(ConnectionState.ERROR);
        setTimeout(() => {
             setConnectionState(ConnectionState.DISCONNECTED);
        }, 3000);
      }
    }
  }, [isVideoActive, selectedVoice, loadDocumentsContext]);

  // Mettre à jour la ref pour le wake word detector
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const disconnect = (shouldReload: boolean = false) => {
    // Arrêter la reconnaissance vocale du chatbot
    if (chatbotSpeechRecognitionRef.current) {
      try {
        chatbotSpeechRecognitionRef.current.stop();
        chatbotSpeechRecognitionRef.current = null;
      } catch (e) {}
    }

    if (sessionRef.current) {
        try { sessionRef.current.close(); } catch (e) {}
        sessionRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (processorRef.current && activeSourceInputRef.current) {
        activeSourceInputRef.current.disconnect();
        processorRef.current.disconnect();
    }

    audioSourcesRef.current.forEach(src => {
        try { src.stop(); } catch(e) {}
    });
    audioSourcesRef.current.clear();

    if (inputAudioContextRef.current) {
        inputAudioContextRef.current.close();
        inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
        outputAudioContextRef.current.close();
        outputAudioContextRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
    }

    resetVisionState();

    setConnectionState(ConnectionState.DISCONNECTED);
    setIsTalking(false);
    
    // Rafraîchir la page uniquement si demandé explicitement (clic sur bouton ou commande vocale)
    if (shouldReload) {
        console.log('[App] 🔄 Redémarrage complet de l\'application...');
        addToast('info', 'Déconnexion', 'Redémarrage en cours...');
        
        // Nettoyer le localStorage si nécessaire (optionnel)
        // localStorage.clear(); // Décommenter si vous voulez tout effacer
        
        // Redémarrer immédiatement avec un reload complet
        setTimeout(() => {
            console.log('[App] 🔄 Rechargement complet de l\'application...');
            // Rechargement complet de l'application (force reload)
            window.location.reload();
        }, 500);
    }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-body text-white selection:bg-indigo-500/30 safe-area-inset">
      {/* Premium Multi-Layer Background System */}
      
      {/* Base Layer - Deep Black with Subtle Noise */}
      <div className="absolute inset-0 bg-[#000000] z-0" 
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.015) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} 
      />
      
      {/* Primary Ambient Glow - Center */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vh] h-[90vh] rounded-full transition-all duration-[2000ms] ease-out pointer-events-none z-0 animate-float"
        style={{ 
          background: `radial-gradient(circle, ${currentPersonality.themeColor}25, ${currentPersonality.themeColor}10 40%, transparent 70%)`,
          filter: 'blur(80px)',
          animation: 'pulse-glow 8s ease-in-out infinite'
        }}
      />
      
      {/* Secondary Glow - Top Right for Depth */}
      <div 
        className="absolute top-[15%] right-[15%] w-[60vh] h-[60vh] rounded-full transition-all duration-[2000ms] ease-out pointer-events-none z-0"
        style={{ 
          background: `radial-gradient(circle, ${currentPersonality.themeColor}15, transparent 60%)`,
          filter: 'blur(100px)',
          animation: 'pulse-glow 10s ease-in-out infinite reverse, float 12s ease-in-out infinite'
        }}
      />

      {/* Tertiary Glow - Bottom Left */}
      <div 
        className="absolute bottom-[10%] left-[20%] w-[50vh] h-[50vh] rounded-full transition-all duration-[2000ms] ease-out pointer-events-none z-0"
        style={{ 
          background: `radial-gradient(circle, ${currentPersonality.themeColor}12, transparent 60%)`,
          filter: 'blur(90px)',
          animation: 'pulse-glow 12s ease-in-out infinite, float 10s ease-in-out infinite reverse'
        }}
      />

      {/* Additional Dynamic Glow - Responsive to connection state */}
      {(isTalking || connectionState === ConnectionState.CONNECTED) && (
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vh] h-[100vh] rounded-full pointer-events-none z-0 transition-opacity duration-1000"
          style={{ 
            background: `radial-gradient(circle, ${currentPersonality.themeColor}20, transparent 50%)`,
            filter: 'blur(120px)',
            animation: 'pulse-glow 6s ease-in-out infinite',
            opacity: isTalking ? 0.8 : 0.4
          }}
        />
      )}

      {/* Sophisticated Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 z-0 pointer-events-none transition-opacity duration-1000" />
      <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-transparent z-0 pointer-events-none transition-opacity duration-1000" />
      
      {/* Animated mesh gradient overlay for depth */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-30"
        style={{
          background: `linear-gradient(135deg, ${currentPersonality.themeColor}05 0%, transparent 50%, ${currentPersonality.themeColor}05 100%)`,
          backgroundSize: '200% 200%',
          animation: 'gradient-shift 15s ease infinite'
        }}
      />
      
      {/* Screen Share Overlay Border */}
      {isScreenShareActive && (
         <div className="absolute inset-0 pointer-events-none z-30 border-[6px] border-indigo-500/50 shadow-[inset_0_0_100px_rgba(99,102,241,0.2)] animate-pulse" />
      )}

      {/* Premium Visualizer */}
      <Visualizer 
        analyserRef={analyserRef} 
        color={currentPersonality.themeColor} 
        isActive={isTalking || connectionState === ConnectionState.CONNECTED}
      />
      
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <InstallPWA />
      
      <QuickStartGuide
        connectionState={connectionState}
        isWakeWordEnabled={isWakeWordEnabled}
        onClose={() => {}}
      />
      
      <PersonalityEditor 
        isOpen={isPersonalityEditorOpen}
        onClose={() => setIsPersonalityEditorOpen(false)}
        currentPersonality={currentPersonality}
        onSave={handlePersonalityChange}
      />

      <NotesViewer
        isOpen={isNotesViewerOpen}
        onClose={() => setIsNotesViewerOpen(false)}
        onNotesChange={() => {
          // Rafraîchir si nécessaire
        }}
      />

      <ToolsList
        isOpen={isToolsListOpen}
        onClose={() => setIsToolsListOpen(false)}
      />

      <TasksViewer
        isOpen={isTasksViewerOpen}
        onClose={() => setIsTasksViewerOpen(false)}
        onTasksChange={() => {
          // Rafraîchir si nécessaire
        }}
      />

      <AgendaViewer
        isOpen={isAgendaViewerOpen}
        onClose={() => setIsAgendaViewerOpen(false)}
        onEventsChange={() => {
          // Rafraîchir si nécessaire
        }}
      />

      <VideoOverlay
        isVideoActive={isVideoActive}
        isScreenShareActive={isScreenShareActive}
        isVideoEnlarged={isVideoEnlarged}
        setIsVideoEnlarged={setIsVideoEnlarged}
        availableCameras={availableCameras}
        selectedCameraId={selectedCameraId}
        videoRef={videoRef}
        canvasRef={canvasRef}
        videoStreamRef={videoStreamRef}
        screenStreamRef={screenStreamRef}
      />

      {/* Main Layout */}
      <div className="relative z-10 w-full h-full flex flex-col lg:flex-row">
        {/* Premium Header */}
        <Header 
            connectionState={connectionState}
            currentPersonality={currentPersonality}
            selectedVoice={selectedVoice}
            onVoiceChange={setSelectedVoice}
            uploadedDocuments={uploadedDocuments}
            onDocumentsChange={handleDocumentsChange}
        />

        {/* Desktop Layout: Sidebar + Main Content */}
        <div className="flex-grow flex flex-col lg:flex-row lg:pt-12 xl:pt-14">
          {/* Desktop Sidebar - Contrôles et informations */}
          <aside className="hidden lg:flex lg:flex-col lg:w-72 xl:w-80 lg:border-r lg:border-white/8 lg:bg-black/20 lg:backdrop-blur-sm lg:p-4 xl:p-5 lg:gap-4 xl:gap-5 lg:overflow-y-auto custom-scrollbar animate-slide-in-left">
            {/* Status Panel */}
            <div className="glass-intense rounded-xl p-4 xl:p-4 space-y-3 hover-lift glass-hover animate-fade-in">
              <h3 className="text-sm xl:text-base font-display font-bold text-white uppercase tracking-wider mb-4">
                État du Système
              </h3>
              
              {/* Connection Status */}
              <div className="flex items-center justify-between">
                <span className="text-xs xl:text-sm text-slate-400 font-medium">Connexion</span>
                <div className="flex items-center gap-2">
                  <span className={`block w-2.5 h-2.5 rounded-full ${
                    connectionState === ConnectionState.CONNECTED ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 
                    connectionState === ConnectionState.CONNECTING ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)] animate-pulse' : 
                    'bg-slate-500'
                  }`}></span>
                  <span className="text-xs xl:text-sm font-medium text-white">
                    {connectionState === ConnectionState.CONNECTED ? 'Actif' : 
                    connectionState === ConnectionState.CONNECTING ? 'Connexion...' : 'Veille'}
                  </span>
                </div>
              </div>

              {/* Latency */}
              {connectionState === ConnectionState.CONNECTED && (
                <div className="flex items-center justify-between">
                  <span className="text-xs xl:text-sm text-slate-400 font-medium">Latence</span>
                  <span className="text-xs xl:text-sm font-bold text-white">
                    {latency > 0 ? `${latency}ms` : '---'}
                  </span>
                </div>
              )}

              {/* Video Status */}
              <div className="flex items-center justify-between">
                <span className="text-xs xl:text-sm text-slate-400 font-medium">Vision</span>
                <span className={`text-xs xl:text-sm font-medium ${
                  isVideoActive || isScreenShareActive ? 'text-red-400' : 'text-slate-500'
                }`}>
                  {isScreenShareActive ? 'Partage d\'écran' : isVideoActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Wake Word Status */}
              <div className="flex items-center justify-between">
                <span className="text-xs xl:text-sm text-slate-400 font-medium">Wake Word</span>
                <span className={`text-xs xl:text-sm font-medium ${
                  isWakeWordEnabled ? 'text-emerald-400' : 'text-slate-500'
                }`}>
                  {isWakeWordEnabled ? 'Activé' : 'Désactivé'}
                </span>
              </div>

              {/* Function Calling Status */}
              <div className="flex items-center justify-between">
                <span className="text-xs xl:text-sm text-slate-400 font-medium">Appel de fonction</span>
                <span className={`text-xs xl:text-sm font-medium ${
                  isFunctionCallingEnabled ? 'text-blue-400' : 'text-slate-500'
                }`}>
                  {isFunctionCallingEnabled ? 'Activé' : 'Désactivé'}
                </span>
              </div>

              {/* Google Search Status */}
              <div className="flex items-center justify-between">
                <span className="text-xs xl:text-sm text-slate-400 font-medium">Google Search</span>
                <span className={`text-xs xl:text-sm font-medium ${
                  isGoogleSearchEnabled ? 'text-green-400' : 'text-slate-500'
                }`}>
                  {isGoogleSearchEnabled ? 'Activé' : 'Désactivé'}
                </span>
              </div>
            </div>

            

            {/* Quick Actions */}
            {connectionState === ConnectionState.DISCONNECTED && (
              <div className="glass-intense rounded-2xl p-5 xl:p-6 space-y-3">
                <h3 className="text-sm xl:text-base font-display font-bold text-white uppercase tracking-wider mb-4">
                  Actions Rapides
                </h3>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setIsPersonalityEditorOpen(true)}
                    className="w-full px-4 py-2.5 rounded-lg glass border border-white/10 text-slate-300 hover:border-white/30 hover:text-white font-body text-xs xl:text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-left flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Modifier la personnalité
                  </button>
                  
                  <button
                    onClick={() => handleFunctionCallingToggle(!isFunctionCallingEnabled)}
                    className={`w-full px-4 py-2.5 rounded-lg glass border font-body text-xs xl:text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-left flex items-center gap-2 ${
                      isFunctionCallingEnabled 
                        ? 'border-blue-500/50 text-blue-300 hover:border-blue-500/70' 
                        : 'border-white/10 text-slate-300 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    {isFunctionCallingEnabled ? 'Désactiver' : 'Activer'} Appel de fonction
                  </button>
                  
                  <button
                    onClick={() => handleGoogleSearchToggle(!isGoogleSearchEnabled)}
                    className={`w-full px-4 py-2.5 rounded-lg glass border font-body text-xs xl:text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-left flex items-center gap-2 ${
                      isGoogleSearchEnabled 
                        ? 'border-green-500/50 text-green-300 hover:border-green-500/70' 
                        : 'border-white/10 text-slate-300 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {isGoogleSearchEnabled ? 'Désactiver' : 'Activer'} Google Search
                  </button>
                  
                  <button
                    onClick={() => setIsToolsListOpen(true)}
                    className="w-full px-4 py-2.5 rounded-lg glass border border-blue-500/30 text-blue-300 hover:border-blue-500/50 hover:text-blue-200 font-body text-xs xl:text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-left flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    Voir les fonctions disponibles
                  </button>
                </div>
              </div>
            )}
          </aside>

          {/* Main Content Area */}
          <main className="flex-grow flex flex-col justify-end pb-0 sm:pb-2 md:pb-4 lg:pb-6 xl:pb-10 safe-area-bottom lg:px-8 xl:px-12">
            <ControlPanel 
              connectionState={connectionState}
              currentPersonality={currentPersonality}
              isVideoActive={isVideoActive}
              isScreenShareActive={isScreenShareActive}
              latencyMs={latency}
              inputAnalyser={inputAnalyserRef.current}
              availableCameras={availableCameras}
              selectedCameraId={selectedCameraId}
              onConnect={() => {
                  isIntentionalDisconnectRef.current = false;
                  // Activer le contexte audio lors de la première interaction
                  activateAudioContext();
                  connect();
              }}
              onDisconnect={() => {
                  isIntentionalDisconnectRef.current = true;
                  disconnect(true);
              }}
              onToggleVideo={() => setIsVideoActive(!isVideoActive)}
              onToggleScreenShare={toggleScreenShare}
              onCameraChange={changeCamera}
              onEditPersonality={() => setIsPersonalityEditorOpen(true)}
              isWakeWordEnabled={isWakeWordEnabled}
              onToggleWakeWord={() => setIsWakeWordEnabled(!isWakeWordEnabled)}
              onSelectPersonality={handlePersonalityChange}
              isFunctionCallingEnabled={isFunctionCallingEnabled}
              isGoogleSearchEnabled={isGoogleSearchEnabled}
              onToggleFunctionCalling={handleFunctionCallingToggle}
              onToggleGoogleSearch={handleGoogleSearchToggle}
              onOpenMobileActions={() => setIsMobileActionsDrawerOpen(true)}
            />
          </main>
        </div>

        {/* Mobile Actions Drawer */}
        {isMobileActionsDrawerOpen && connectionState === ConnectionState.DISCONNECTED && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
              onClick={() => setIsMobileActionsDrawerOpen(false)}
            />
            
            {/* Drawer */}
            <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto glass-intense rounded-t-3xl border-t border-white/20 animate-in safe-area-bottom"
              style={{
                boxShadow: '0 -20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(99, 102, 241, 0.2)'
              }}>
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-white/10 bg-black/40 backdrop-blur-xl">
                <h3 className="text-lg font-display font-bold text-white uppercase tracking-wider">
                  Actions Rapides
                </h3>
                <button
                  onClick={() => setIsMobileActionsDrawerOpen(false)}
                  className="p-2 rounded-lg glass border border-white/10 text-slate-300 hover:border-white/30 hover:text-white transition-all duration-300 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-2">
                <button
                  onClick={() => {
                    setIsPersonalityEditorOpen(true);
                    setIsMobileActionsDrawerOpen(false);
                  }}
                  className="w-full px-4 py-3 rounded-lg glass border border-white/10 text-slate-300 hover:border-white/30 hover:text-white font-body text-sm font-semibold transition-all duration-300 active:scale-[0.98] text-left flex items-center gap-3 touch-manipulation min-h-[44px]"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Modifier la personnalité
                </button>
                
                <button
                  onClick={() => {
                    handleFunctionCallingToggle(!isFunctionCallingEnabled);
                    setIsMobileActionsDrawerOpen(false);
                  }}
                  className={`w-full px-4 py-3 rounded-lg glass border font-body text-sm font-semibold transition-all duration-300 active:scale-[0.98] text-left flex items-center gap-3 touch-manipulation min-h-[44px] ${
                    isFunctionCallingEnabled 
                      ? 'border-blue-500/50 text-blue-300 hover:border-blue-500/70' 
                      : 'border-white/10 text-slate-300 hover:border-white/30 hover:text-white'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  {isFunctionCallingEnabled ? 'Désactiver' : 'Activer'} Appel de fonction
                </button>
                
                <button
                  onClick={() => {
                    handleGoogleSearchToggle(!isGoogleSearchEnabled);
                    setIsMobileActionsDrawerOpen(false);
                  }}
                  className={`w-full px-4 py-3 rounded-lg glass border font-body text-sm font-semibold transition-all duration-300 active:scale-[0.98] text-left flex items-center gap-3 touch-manipulation min-h-[44px] ${
                    isGoogleSearchEnabled 
                      ? 'border-green-500/50 text-green-300 hover:border-green-500/70' 
                      : 'border-white/10 text-slate-300 hover:border-white/30 hover:text-white'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {isGoogleSearchEnabled ? 'Désactiver' : 'Activer'} Google Search
                </button>
                
                <button
                  onClick={() => {
                    setIsToolsListOpen(true);
                    setIsMobileActionsDrawerOpen(false);
                  }}
                  className="w-full px-4 py-3 rounded-lg glass border border-blue-500/30 text-blue-300 hover:border-blue-500/50 hover:text-blue-200 font-body text-sm font-semibold transition-all duration-300 active:scale-[0.98] text-left flex items-center gap-3 touch-manipulation min-h-[44px]"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Voir les fonctions disponibles
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;