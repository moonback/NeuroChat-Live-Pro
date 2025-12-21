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
import DocumentUploader from './components/DocumentUploader';
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
    audioContextActivatedRef,
    beepAudioRef,
  } = useAudioManager();

  const [selectedVoice, setSelectedVoice] = useState<string>(DEFAULT_PERSONALITY.voiceName);
  const [isVideoEnlarged, setIsVideoEnlarged] = useState(false);
  
  // Custom Personality State - Charger depuis localStorage ou utiliser la par défaut
  const loadSavedPersonality = (): Personality => {
    try {
      const saved = localStorage.getItem('currentPersonality');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Vérifier que toutes les propriétés requises sont présentes
        if (parsed && parsed.id && parsed.systemInstruction) {
          console.log('[App] Personnalité chargée depuis localStorage:', parsed.name);
          return parsed as Personality;
        }
      }
    } catch (e) {
      console.warn('Erreur lors du chargement de la personnalité:', e);
    }
    // Retourner la personnalité par défaut si aucune sauvegarde
    console.log('[App] Utilisation de la personnalité par défaut');
    return DEFAULT_PERSONALITY;
  };

  const [currentPersonality, setCurrentPersonality] = useState<Personality>(loadSavedPersonality);
  const [isPersonalityEditorOpen, setIsPersonalityEditorOpen] = useState(false);
  const [isNotesViewerOpen, setIsNotesViewerOpen] = useState(false);
  const [isToolsListOpen, setIsToolsListOpen] = useState(false);
  const [isTasksViewerOpen, setIsTasksViewerOpen] = useState(false);
  const [isAgendaViewerOpen, setIsAgendaViewerOpen] = useState(false);
  const [isMobileActionsDrawerOpen, setIsMobileActionsDrawerOpen] = useState(false);
  
  // Document Upload State
  const [uploadedDocuments, setUploadedDocuments] = useState<ProcessedDocument[]>(() => {
    // Charger les documents depuis localStorage
    try {
      const saved = localStorage.getItem('uploadedDocuments');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((doc: any) => ({
          ...doc,
          uploadedAt: new Date(doc.uploadedAt)
        }));
      }
    } catch (e) {
      console.warn('Erreur lors du chargement des documents:', e);
    }
    return [];
  });
  
  // Wake Word Detection State
  const [isWakeWordEnabled, setIsWakeWordEnabled] = useState<boolean>(() => {
    // Charger la préférence depuis localStorage, par défaut activé
    const saved = localStorage.getItem('wakeWordEnabled');
    return saved !== null ? saved === 'true' : true;
  });

  // Tools State
  const [isFunctionCallingEnabled, setIsFunctionCallingEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('functionCallingEnabled');
    return saved !== null ? saved === 'true' : true; // Activé par défaut
  });
  const [isGoogleSearchEnabled, setIsGoogleSearchEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('googleSearchEnabled');
    return saved !== null ? saved === 'true' : false; // Désactivé par défaut
  });

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
  // Initialiser la ref avec la personnalité chargée (pas la par défaut)
  const initialPersonality = loadSavedPersonality();
  const currentPersonalityRef = useRef(initialPersonality); // Ref for seamless updates
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

  useEffect(() => {
    currentPersonalityRef.current = currentPersonality;
    console.log('[App] Ref personnalité mise à jour:', currentPersonality.name);
  }, [currentPersonality]);

  useEffect(() => {
    uploadedDocumentsRef.current = uploadedDocuments;
  }, [uploadedDocuments]);

  // Fonction utilitaire pour normaliser le texte et améliorer la détection
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .replace(/[^\w\s]/g, ' ') // Remplacer la ponctuation par des espaces
      .replace(/\s+/g, ' '); // Normaliser les espaces multiples
  };

  // Fonction améliorée pour détecter les commandes de vision (plus permissive)
  const detectVisionCommand = (text: string): 'activate' | 'deactivate' | null => {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return null;
    }
    
    const normalized = normalizeText(text);
    console.log('[App] 🔍 Analyse de la commande vision - Texte original:', text);
    console.log('[App] 🔍 Texte normalisé:', normalized);
    
    // Mots-clés d'activation simples (sans contexte requis)
    const simpleActivateKeywords = [
      
      'activer la vision', 'active la camera', 'activer la camera',
    ];
    
    // Mots-clés d'activation avec contexte requis (plus permissifs)
    const activateKeywords = [
      'active', 'activer', 'allume', 'allumer', 'ouvre', 'ouvrir', 
      'demarre', 'demarrer', 'lance', 'lancer', 'mets', 'met', 'metre',
      'peux tu activer', 'peux-tu activer', 'tu peux activer',
      'je veux activer', 'je voudrais activer', 'j aimerais activer',
      'peux tu allumer', 'peux-tu allumer', 'tu peux allumer'
    ];
    
    // Mots-clés de désactivation simples (sans contexte requis)
    const simpleDeactivateKeywords = [
      
      'desactiver la vision', 'desactive la camera', 'desactiver la camera',
      
    ];
    
    // Mots-clés de désactivation avec contexte requis
    const deactivateKeywords = [
      'desactive', 'desactiver', 'arrete', 'arreter', 'ferme', 'fermer',
      'eteint', 'eteindre', 'coupe', 'couper', 'stop', 'stoppe', 'stopper'
    ];
    
    // Préfixes négatifs à exclure
    const negativePrefixes = ['ne ', 'non ', 'pas ', 'jamais ', 'plus ', 'n '];
    const pastContextPrefixes = [
      'viens de', 'vient de', 'venait de', 'venais de', 'venaient de',
      'ai ', 'as ', 'a ', 'avons ', 'avez ', 'ont ', 'avait ', 'avais ',
      'aviez ', 'avaient ', 'etait ', 'etais ', 'etiez ', 'etaient ',
      'venait d', 'venais d', 'venaient d'
    ];
    
    // Vérifier d'abord les phrases complètes (plus fiables)
    for (const phrase of simpleActivateKeywords) {
      if (normalized.includes(phrase)) {
        const index = normalized.indexOf(phrase);
        const beforeContext = normalized.substring(Math.max(0, index - 20), index).trim();
        
        const hasNegative = negativePrefixes.some(prefix => 
          beforeContext.endsWith(prefix) || beforeContext.includes(' ' + prefix)
        );
        
        const hasPastContext = pastContextPrefixes.some(prefix => 
          beforeContext.includes(prefix) || beforeContext.endsWith(prefix)
        );
        
        if (!hasNegative && !hasPastContext) {
          console.log('[App] ✅ Commande d\'activation détectée (phrase complète):', phrase, 'dans:', text);
          return 'activate';
        }
      }
    }
    
    // Vérifier les mots-clés simples avec contexte (plus permissif)
    for (const keyword of activateKeywords) {
      const index = normalized.indexOf(keyword);
      if (index !== -1) {
        const beforeContext = normalized.substring(Math.max(0, index - 50), index).trim();
        const afterContext = normalized.substring(index, Math.min(normalized.length, index + keyword.length + 50)).trim();
        const fullContext = beforeContext + ' ' + afterContext;
        
        // Vérifier qu'il n'y a pas de préfixe négatif
        const hasNegative = negativePrefixes.some(prefix => 
          beforeContext.endsWith(prefix) || beforeContext.includes(' ' + prefix) ||
          fullContext.includes(' ne ' + keyword) || fullContext.includes(' pas ' + keyword) ||
          fullContext.includes(' non ' + keyword)
        );
        
        // Vérifier qu'il n'y a pas de contexte passé
        const hasPastContext = pastContextPrefixes.some(prefix => 
          beforeContext.includes(prefix) || beforeContext.endsWith(prefix)
        );
        
        // Vérifier qu'il y a un indicateur de vision/caméra dans le contexte (plus large)
        const visionIndicators = ['vision', 'camera', 'video', 'caméra', 'vidéo', 'webcam', 'web cam', 'webcam', 'webcam'];
        const keywordHasVision = visionIndicators.some(indicator => keyword.includes(indicator));
        const hasVisionContext = keywordHasVision || visionIndicators.some(indicator => 
          fullContext.includes(indicator)
        );
        
        // Si le mot-clé est dans une phrase de demande explicite, on accepte même sans contexte vision
        const requestPhrases = ['peux tu', 'peux-tu', 'tu peux', 'je veux', 'je voudrais', 'j aimerais', 'pourrais tu', 'pourrais-tu'];
        const isExplicitRequest = requestPhrases.some(phrase => beforeContext.includes(phrase));
        
        // Si c'est un verbe d'action simple (active, allume, etc.) et qu'il n'y a pas de contexte négatif,
        // on accepte même sans contexte vision explicite (plus permissif)
        const simpleActionVerbs = ['active', 'activer', 'allume', 'allumer', 'ouvre', 'ouvrir', 'demarre', 'demarrer', 'lance', 'lancer'];
        const isSimpleAction = simpleActionVerbs.some(verb => keyword.includes(verb));
        
        // Accepter si :
        // 1. Il y a un contexte vision explicite, OU
        // 2. C'est une demande explicite (peux-tu, je veux, etc.), OU
        // 3. C'est un verbe d'action simple sans contexte négatif/passé
        if (!hasNegative && !hasPastContext && (hasVisionContext || isExplicitRequest || isSimpleAction)) {
          console.log('[App] ✅ Commande d\'activation détectée:', keyword, 'dans:', text, {
            hasVisionContext,
            isExplicitRequest,
            isSimpleAction,
            hasNegative,
            hasPastContext
          });
          return 'activate';
        }
      }
    }
    
    // Détection supplémentaire : chercher "vision" ou "camera" suivi d'un verbe d'action
    const visionFirstPattern = /(vision|camera|video|caméra|vidéo)\s+(active|activer|allume|allumer|ouvre|ouvrir|demarre|demarrer|lance|lancer)/i;
    if (visionFirstPattern.test(normalized)) {
      const beforeMatch = normalized.substring(0, normalized.search(visionFirstPattern)).trim();
      const hasNegative = negativePrefixes.some(prefix => beforeMatch.includes(prefix));
      const hasPastContext = pastContextPrefixes.some(prefix => beforeMatch.includes(prefix));
      
      if (!hasNegative && !hasPastContext) {
        console.log('[App] ✅ Commande d\'activation détectée (pattern vision d\'abord):', text);
        return 'activate';
      }
    }
    
    // Vérifier la désactivation (phrases complètes d'abord)
    for (const phrase of simpleDeactivateKeywords) {
      if (normalized.includes(phrase)) {
        console.log('[App] ✅ Commande de désactivation détectée (phrase complète):', phrase, 'dans:', text);
        return 'deactivate';
      }
    }
    
    // Vérifier les mots-clés de désactivation avec contexte
    for (const keyword of deactivateKeywords) {
      const index = normalized.indexOf(keyword);
      if (index !== -1) {
        const beforeContext = normalized.substring(Math.max(0, index - 40), index).trim();
        const afterContext = normalized.substring(index, Math.min(normalized.length, index + keyword.length + 40)).trim();
        const fullContext = beforeContext + ' ' + afterContext;
        
        // Vérifier qu'il y a un indicateur de vision/caméra dans le contexte
        const visionIndicators = ['vision', 'camera', 'video', 'caméra', 'vidéo', 'webcam', 'web cam'];
        const keywordHasVision = visionIndicators.some(indicator => keyword.includes(indicator));
        const hasVisionContext = keywordHasVision || visionIndicators.some(indicator => 
          fullContext.includes(indicator)
        );
        
        if (hasVisionContext) {
          console.log('[App] ✅ Commande de désactivation détectée:', keyword, 'dans:', text);
          return 'deactivate';
        }
      }
    }
    
    console.log('[App] ❌ Aucune commande de vision détectée dans:', text);
    return null;
  };

  // Personality Management
  const handlePersonalityChange = (newPersonality: Personality) => {
    // Sauvegarder la personnalité dans localStorage pour la persistance
    try {
      localStorage.setItem('currentPersonality', JSON.stringify(newPersonality));
      console.log('[App] Personnalité sauvegardée dans localStorage');
    } catch (e) {
      console.warn('Erreur lors de la sauvegarde de la personnalité:', e);
    }
    
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
    // Sauvegarder dans localStorage
    try {
      localStorage.setItem('uploadedDocuments', JSON.stringify(documents));
    } catch (e) {
      console.warn('Erreur lors de la sauvegarde des documents:', e);
    }
    
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
  useEffect(() => {
    localStorage.setItem('wakeWordEnabled', isWakeWordEnabled.toString());
  }, [isWakeWordEnabled]);

  // Sauvegarder les préférences des outils dans localStorage
  useEffect(() => {
    localStorage.setItem('functionCallingEnabled', isFunctionCallingEnabled.toString());
  }, [isFunctionCallingEnabled]);

  useEffect(() => {
    localStorage.setItem('googleSearchEnabled', isGoogleSearchEnabled.toString());
  }, [isGoogleSearchEnabled]);

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

      {/* Hidden Video & Canvas for Computer Vision */}
      <video ref={videoRef} className="hidden" muted playsInline autoPlay />
      <canvas ref={canvasRef} className="hidden" />

      {/* Premium Camera Preview (Picture-in-Picture) */}
      {(isVideoActive || isScreenShareActive) && !isVideoEnlarged && (
         <div 
           onClick={() => setIsVideoEnlarged(true)}
           className="absolute top-16 sm:top-20 right-3 sm:right-4 md:top-8 md:right-8 lg:top-24 lg:right-8 xl:top-28 xl:right-12 z-40 w-48 sm:w-32 md:w-56 lg:w-72 xl:w-80 aspect-video rounded-xl sm:rounded-2xl overflow-hidden glass-intense border border-white/20 shadow-2xl animate-in cursor-pointer group hover:scale-105 active:scale-95 transition-transform duration-300 touch-manipulation"
           style={{
             boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(99, 102, 241, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
           }}>
             <div ref={(ref) => {
                 if (ref && videoRef.current) {
                    const stream = isScreenShareActive ? screenStreamRef.current : videoStreamRef.current;
                    if (stream) {
                        ref.innerHTML = '';
                        const previewVideo = document.createElement('video');
                        previewVideo.srcObject = stream;
                        previewVideo.muted = true;
                        previewVideo.play().catch(() => {});
                        previewVideo.className = "w-full h-full object-cover";
                        ref.appendChild(previewVideo);
                    }
                 }
             }} className="w-full h-full bg-black/80" />
             
             {/* Premium Live Indicator */}
             <div className="absolute inset-0 pointer-events-none">
               {/* Top gradient fade */}
               <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/60 to-transparent"></div>
               {/* Bottom gradient fade */}
               <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent"></div>
             </div>
             
             <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg glass-intense">
               <div className="relative">
                 <span className={`block w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full ${isScreenShareActive ? 'bg-indigo-500' : 'bg-red-500'}`}
                   style={{ boxShadow: isScreenShareActive ? '0 0 10px rgba(99, 102, 241, 0.8)' : '0 0 10px rgba(239, 68, 68, 0.8)' }}></span>
                 <span className={`absolute inset-0 w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full animate-ping ${isScreenShareActive ? 'bg-indigo-500' : 'bg-red-500'}`}></span>
               </div>
               <span className="font-display text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.1em] sm:tracking-[0.15em] text-white">
                 {isScreenShareActive ? "Partage" : "Vision"}
               </span>
             </div>
             
             {/* Expand Icon Hint */}
             <div className="absolute top-2 sm:top-3 right-2 sm:right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
               <div className="p-1.5 sm:p-2 rounded-md sm:rounded-lg glass-intense">
                 <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                 </svg>
               </div>
             </div>
         </div>
      )}
      
      {/* Enlarged Camera View */}
      {(isVideoActive || isScreenShareActive) && isVideoEnlarged && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in safe-area-inset"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsVideoEnlarged(false);
            }
          }}
        >
          <div className="relative w-full h-full max-w-6xl max-h-[90vh] m-2 sm:m-4 md:m-8">
            {/* Enlarged Video Container */}
            <div className="relative w-full h-full rounded-3xl overflow-hidden glass-intense border-2 border-white/20 shadow-2xl"
              style={{
                boxShadow: '0 25px 80px rgba(0, 0, 0, 0.8), 0 0 60px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              }}>
              <div ref={(ref) => {
                  if (ref && videoRef.current) {
                     const stream = isScreenShareActive ? screenStreamRef.current : videoStreamRef.current;
                     if (stream) {
                         ref.innerHTML = '';
                         const enlargedVideo = document.createElement('video');
                         enlargedVideo.srcObject = stream;
                         enlargedVideo.muted = true;
                         enlargedVideo.play().catch(() => {});
                         enlargedVideo.className = "w-full h-full object-contain";
                         ref.appendChild(enlargedVideo);
                     }
                  }
              }} className="w-full h-full bg-black" />
              
              {/* Gradient overlays */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent"></div>
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent"></div>
              </div>
              
              {/* Live Indicator */}
              <div className="absolute top-3 sm:top-4 md:top-6 left-3 sm:left-4 md:left-6 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-lg sm:rounded-xl glass-intense">
                <div className="relative">
                  <span className={`block w-2 sm:w-2.5 md:w-3 h-2 sm:h-2.5 md:h-3 rounded-full ${isScreenShareActive ? 'bg-indigo-500' : 'bg-red-500'}`}
                    style={{ boxShadow: isScreenShareActive ? '0 0 15px rgba(99, 102, 241, 0.9)' : '0 0 15px rgba(239, 68, 68, 0.9)' }}></span>
                  <span className={`absolute inset-0 w-2 sm:w-2.5 md:w-3 h-2 sm:h-2.5 md:h-3 rounded-full animate-ping ${isScreenShareActive ? 'bg-indigo-500' : 'bg-red-500'}`}></span>
                </div>
                <span className="font-display text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-white">
                  {isScreenShareActive ? "Partage Écran" : "Vision Active"}
                </span>
              </div>
              
              {/* Close Button */}
              <button
                onClick={() => setIsVideoEnlarged(false)}
                className="absolute top-3 sm:top-4 md:top-6 right-3 sm:right-4 md:right-6 group p-2.5 sm:p-3 rounded-lg sm:rounded-xl glass-intense border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105 active:scale-95 touch-manipulation min-w-[44px] min-h-[44px]"
                style={{
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
                }}
              >
                <svg className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {/* Camera Info */}
              <div className="absolute bottom-3 sm:bottom-4 md:bottom-6 left-3 sm:left-4 md:left-6 right-3 sm:right-4 md:right-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                <div className="px-3 sm:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-lg sm:rounded-xl glass-intense">
                  <span className="font-body text-xs sm:text-sm text-slate-300">
                    {isScreenShareActive 
                      ? 'Partage d\'écran en cours' 
                      : (availableCameras.find(cam => cam.deviceId === selectedCameraId)?.label || 'Caméra')}
                  </span>
                </div>
                
                <div className="px-3 sm:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-lg sm:rounded-xl glass-intense">
                  <span className="font-body text-[10px] sm:text-xs text-slate-400">
                    Cliquez à l'extérieur pour réduire
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
          <aside className="hidden lg:flex lg:flex-col lg:w-80 xl:w-96 lg:border-r lg:border-white/10 lg:bg-black/20 lg:backdrop-blur-sm lg:p-6 xl:p-8 lg:gap-6 xl:gap-8 lg:overflow-y-auto custom-scrollbar">
            {/* Status Panel */}
            <div className="glass-intense rounded-2xl p-5 xl:p-6 space-y-4">
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