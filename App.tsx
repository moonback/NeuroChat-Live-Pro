import React, { useEffect, useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import Visualizer from './components/Visualizer';
import ControlPanel from './components/ControlPanel';
import Header from './components/Header';
import PersonalityEditor from './components/PersonalityEditor';
import { ToastContainer, ToastMessage } from './components/Toast';
import { ConnectionState, DEFAULT_AUDIO_CONFIG, Personality } from './types';
import { DEFAULT_PERSONALITY } from './constants';
import { createBlob, decodeAudioData, base64ToArrayBuffer, arrayBufferToBase64 } from './utils/audioUtils';
import { buildSystemInstruction } from './systemConfig';
import { VideoContextAnalyzer } from './utils/videoContextAnalyzer';
import { WakeWordDetector } from './utils/wakeWordDetector';

const App: React.FC = () => {
  // State
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [isTalking, setIsTalking] = useState(false);
  
  // New Features State
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [isScreenShareActive, setIsScreenShareActive] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<string>(DEFAULT_PERSONALITY.voiceName);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [latency, setLatency] = useState<number>(0);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isVideoEnlarged, setIsVideoEnlarged] = useState(false);
  
  // Custom Personality State
  const [currentPersonality, setCurrentPersonality] = useState<Personality>(DEFAULT_PERSONALITY);
  const [isPersonalityEditorOpen, setIsPersonalityEditorOpen] = useState(false);
  
  // Wake Word Detection State
  const [isWakeWordEnabled, setIsWakeWordEnabled] = useState<boolean>(() => {
    // Charger la préférence depuis localStorage, par défaut activé
    const saved = localStorage.getItem('wakeWordEnabled');
    return saved !== null ? saved === 'true' : true;
  });

  // Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const activeSourceInputRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const lastUserAudioTimeRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const isReconnectingRef = useRef<boolean>(false);
  const isIntentionalDisconnectRef = useRef<boolean>(false);
  const isScreenShareActiveRef = useRef(false); // Ref to track screen share state for closures
  const isVideoActiveRef = useRef(false); // Ref to track video state for closures
  const availableCamerasRef = useRef<MediaDeviceInfo[]>([]); // Ref to track cameras for closures
  const selectedCameraIdRef = useRef<string>(''); // Ref to track selected camera for closures
  const currentPersonalityRef = useRef(DEFAULT_PERSONALITY); // Ref for seamless updates

  // Sync refs with state
  useEffect(() => {
    currentPersonalityRef.current = currentPersonality;
  }, [currentPersonality]);

  useEffect(() => {
    isVideoActiveRef.current = isVideoActive;
  }, [isVideoActive]);

  useEffect(() => {
    availableCamerasRef.current = availableCameras;
  }, [availableCameras]);

  useEffect(() => {
    selectedCameraIdRef.current = selectedCameraId;
  }, [selectedCameraId]);

  useEffect(() => {
    connectionStateRef.current = connectionState;
  }, [connectionState]);

  // Video Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const frameIntervalRef = useRef<number | NodeJS.Timeout | null>(null);
  const videoContextAnalyzerRef = useRef<VideoContextAnalyzer | null>(null);
  const wakeWordDetectorRef = useRef<WakeWordDetector | null>(null);
  const connectRef = useRef<(() => Promise<void>) | null>(null);
  const connectionStateRef = useRef<ConnectionState>(ConnectionState.DISCONNECTED);
  const chatbotSpeechRecognitionRef = useRef<any>(null); // SpeechRecognition API
  const beepAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextActivatedRef = useRef<boolean>(false);

  const addToast = (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => {
    setToasts(prev => [...prev, {
        id: Date.now().toString(),
        type,
        title,
        message
    }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Activer le contexte audio lors de la première interaction utilisateur
  const activateAudioContext = useCallback(() => {
    if (audioContextActivatedRef.current) return;
    
    try {
      // Créer un contexte audio silencieux pour activer le contexte
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      gainNode.gain.value = 0; // Son silencieux
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.001);
      
      // Marquer comme activé
      audioContextActivatedRef.current = true;
      
      // Précharger l'audio maintenant que le contexte est activé
      if (!beepAudioRef.current) {
        const audio = new Audio('/bip.mp3');
        audio.volume = 0.7;
        audio.preload = 'auto';
        audio.load();
        beepAudioRef.current = audio;
      }
    } catch (error) {
      console.warn('[App] Impossible d\'activer le contexte audio:', error);
    }
  }, []);

  // Précharger le fichier audio du bip
  useEffect(() => {
    const audio = new Audio('/bip.mp3');
    audio.volume = 0.7; // Volume à 70%
    audio.preload = 'auto';
    
    // Précharger le fichier
    audio.load();
    
    beepAudioRef.current = audio;
    
    return () => {
      if (beepAudioRef.current) {
        beepAudioRef.current.pause();
        beepAudioRef.current = null;
      }
    };
  }, []);

  // Fonction pour émettre un bip sonore depuis un fichier audio
  const playBeep = useCallback(() => {
    try {
      // Utiliser l'instance préchargée si disponible
      if (beepAudioRef.current) {
        // Réinitialiser la position pour pouvoir rejouer
        beepAudioRef.current.currentTime = 0;
        
        // Jouer le son
        const playPromise = beepAudioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // Succès silencieux - pas besoin de log
            })
            .catch(error => {
              // Ignorer silencieusement les erreurs NotAllowedError
              // C'est normal si l'utilisateur n'a pas encore interagi avec la page
              if (error.name !== 'NotAllowedError') {
                console.warn('[App] Erreur lors de la lecture du bip:', error);
              }
            });
        }
      } else {
        // Fallback : créer une nouvelle instance si l'audio n'est pas préchargé
        const audio = new Audio('/bip.mp3');
        audio.volume = 0.7;
        audio.play().catch(error => {
          // Ignorer silencieusement les erreurs NotAllowedError
          if (error.name !== 'NotAllowedError') {
            console.warn('[App] Impossible de jouer le bip (fallback):', error);
          }
        });
      }
    } catch (error) {
      // Ignorer silencieusement les erreurs
      if ((error as any).name !== 'NotAllowedError') {
        console.warn('[App] Erreur lors de la création du bip:', error);
      }
    }
  }, []);

  // Personality Management
  const handlePersonalityChange = (newPersonality: Personality) => {
    setCurrentPersonality(newPersonality);
    addToast('success', 'Personnalité Mise à Jour', `NeuroChat est maintenant : ${newPersonality.name}`);
    
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
  // Enumerate available cameras
  const enumerateCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(videoDevices);
      
      // Try to load saved camera preference
      const savedCameraId = localStorage.getItem('selectedCameraId');
      
      if (videoDevices.length > 0) {
        // Use saved camera if it exists in the list, otherwise use first camera
        if (savedCameraId && videoDevices.some(device => device.deviceId === savedCameraId)) {
          setSelectedCameraId(savedCameraId);
        } else if (!selectedCameraId) {
          setSelectedCameraId(videoDevices[0].deviceId);
        }
      }
    } catch (e) {
      console.error("Failed to enumerate cameras", e);
    }
  };

  // Change camera function
  const changeCamera = async (cameraId: string) => {
    setSelectedCameraId(cameraId);
    
    // Save camera preference to localStorage
    localStorage.setItem('selectedCameraId', cameraId);
    
    // If video is active, restart the stream with the new camera
    if (isVideoActive && videoStreamRef.current) {
      // Stop current stream
      videoStreamRef.current.getTracks().forEach(t => t.stop());
      videoStreamRef.current = null;
      
      // Stop frame transmission
      if (frameIntervalRef.current) {
        clearTimeout(frameIntervalRef.current as NodeJS.Timeout);
        clearInterval(frameIntervalRef.current as number);
        frameIntervalRef.current = null;
      }
      
      // Reset context analyzer for new camera source
      if (videoContextAnalyzerRef.current) {
        videoContextAnalyzerRef.current.reset();
      }
      
      // Start new stream with selected camera
      try {
        const constraints: MediaStreamConstraints = {
          video: { deviceId: { exact: cameraId } }
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        videoStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        
        // Restart frame transmission
        if (connectionState === ConnectionState.CONNECTED) {
          startFrameTransmission();
        }
        
        addToast('success', 'Caméra changée', 'La nouvelle caméra est maintenant active');
      } catch (e) {
        console.error("Failed to switch camera", e);
        addToast('error', 'Erreur', "Impossible de changer de caméra");
      }
    }
  };

  // Load cameras on mount
  useEffect(() => {
    enumerateCameras();
  }, []);

  // Screen Share Functions
  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = stream;
      setIsScreenShareActive(true);
      isScreenShareActiveRef.current = true;

      // Reset context analyzer for screen share source
      if (videoContextAnalyzerRef.current) {
        videoContextAnalyzerRef.current.reset();
      }

      // Use screen stream in video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Handle "Stop sharing" from browser UI
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      // Ensure transmission uses the new stream content
      if (connectionState === ConnectionState.CONNECTED) {
        startFrameTransmission();
      }
      
      addToast('success', 'Partage d\'écran', 'Partage d\'écran activé');

    } catch (e) {
      console.error("Error sharing screen", e);
      // Don't show error if user cancelled
      if ((e as any).name !== 'NotAllowedError') {
        addToast('error', 'Erreur', "Impossible de partager l'écran");
      }
      setIsScreenShareActive(false);
    }
  };

  const stopScreenShare = async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    setIsScreenShareActive(false);
    isScreenShareActiveRef.current = false;

    // Reset context analyzer when switching back to camera
    if (videoContextAnalyzerRef.current) {
      videoContextAnalyzerRef.current.reset();
    }

    // Restore camera if active
    if (isVideoActive && videoStreamRef.current && videoRef.current) {
       videoRef.current.srcObject = videoStreamRef.current;
       await videoRef.current.play();
    } else if (videoRef.current) {
       videoRef.current.srcObject = null;
    }
  };

  const toggleScreenShare = () => {
    if (isScreenShareActive) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  };

  // Video Stream Management
  useEffect(() => {
    const startVideo = async () => {
        if (isScreenShareActive) return;

        if (isVideoActive && !videoStreamRef.current) {
            console.log('[App] 🎥 Démarrage de la caméra...', { isVideoActive, selectedCameraId });
            try {
                const constraints: MediaStreamConstraints = {
                  video: selectedCameraId ? { deviceId: { exact: selectedCameraId } } : true
                };
                console.log('[App] 📹 Contraintes caméra:', constraints);
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                console.log('[App] ✅ Stream caméra obtenu:', stream);
                videoStreamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                    console.log('[App] ✅ Vidéo démarrée avec succès');
                }
                
                // Reset context analyzer for new video stream
                if (videoContextAnalyzerRef.current) {
                    videoContextAnalyzerRef.current.reset();
                }
                
                // Start sending frames if we are connected
                if (connectionState === ConnectionState.CONNECTED) {
                    console.log('[App] 📤 Démarrage de l\'envoi des frames...');
                    startFrameTransmission();
                }
            } catch (e) {
                console.error("[App] ❌ Échec d'accès à la caméra", e);
                addToast('error', 'Erreur Caméra', "Impossible d'accéder à la caméra. Vérifiez les permissions.");
                setIsVideoActive(false);
            }
        } else if (!isVideoActive && videoStreamRef.current) {
            console.log('[App] 🛑 Arrêt de la caméra...');
            
            // Arrêter tous les tracks vidéo
            videoStreamRef.current.getTracks().forEach(t => {
                t.stop();
                console.log('[App] 🛑 Track arrêté:', t.kind, t.label);
            });
            videoStreamRef.current = null;
            
            // Nettoyer la vidéo
            if (videoRef.current) {
                videoRef.current.srcObject = null;
                videoRef.current.pause();
                console.log('[App] 🛑 Élément vidéo nettoyé');
            }
            
            // Only stop transmission if screen share is also not active
            if (!isScreenShareActive && frameIntervalRef.current) {
                clearTimeout(frameIntervalRef.current as NodeJS.Timeout);
                clearInterval(frameIntervalRef.current as number);
                frameIntervalRef.current = null;
                console.log('[App] 🛑 Transmission de frames arrêtée');
            }
        }
    };
    startVideo();
  }, [isVideoActive, connectionState, isScreenShareActive, selectedCameraId]);

  const startFrameTransmission = () => {
      if (frameIntervalRef.current) {
          clearTimeout(frameIntervalRef.current as NodeJS.Timeout);
          clearInterval(frameIntervalRef.current as number);
      }
      
      // Initialize context analyzer if not already done
      if (!videoContextAnalyzerRef.current) {
          videoContextAnalyzerRef.current = new VideoContextAnalyzer();
      }
      
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      if (!canvas || !video) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: false });
      if (!ctx) return;

      let lastFrameTime = 0;
      const targetInterval = isScreenShareActiveRef.current ? 500 : 1000;
      
      // Optimized frame capture with downscaling for performance
      const captureAndSend = async () => {
          const now = Date.now();
          if (now - lastFrameTime < targetInterval) {
              frameIntervalRef.current = window.setTimeout(captureAndSend, targetInterval - (now - lastFrameTime));
              return;
          }
          
          lastFrameTime = now;
          const isScreenSharing = isScreenShareActiveRef.current;
          const currentStream = isScreenSharing ? screenStreamRef.current : videoStreamRef.current;
          
          if (!sessionRef.current || !currentStream || video.readyState !== 4) {
              frameIntervalRef.current = window.setTimeout(captureAndSend, targetInterval);
              return;
          }

          try {
              const sourceWidth = video.videoWidth;
              const sourceHeight = video.videoHeight;
              
              if (sourceWidth === 0 || sourceHeight === 0) {
                  frameIntervalRef.current = window.setTimeout(captureAndSend, targetInterval);
                  return;
              }

              // Downscale for performance (max 1280px width for screen, 640px for camera)
              const maxWidth = isScreenSharing ? 1280 : 640;
              const scale = Math.min(1, maxWidth / sourceWidth);
              const targetWidth = Math.floor(sourceWidth * scale);
              const targetHeight = Math.floor(sourceHeight * scale);

              // Only resize canvas if dimensions changed
              if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
                  canvas.width = targetWidth;
                  canvas.height = targetHeight;
              }

              // Draw with scaling for better performance
              ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
              
              // Context Awareness: Analyze frame before sending
              const analysis = videoContextAnalyzerRef.current.analyzeFrame(canvas, isScreenSharing);
              
              // Only send frame if analysis indicates significant change or first frame
              if (!analysis.shouldSend) {
                  frameIntervalRef.current = window.setTimeout(captureAndSend, targetInterval);
                  return;
              }
              
              // Use lower quality for faster encoding (still readable)
              const quality = isScreenSharing ? 0.75 : 0.55;
              
              // Use setTimeout to defer heavy encoding off main thread
              setTimeout(() => {
                  try {
                      const base64 = canvas.toDataURL('image/jpeg', quality).split(',')[1];
                      
                      if (sessionRef.current) {
                          // Send frame with optional context prompt
                          const input: any = {
                              media: {
                                  mimeType: 'image/jpeg',
                                  data: base64
                              }
                          };
                          
                          // Add context prompt as text input if available (Gemini Live supports mixed inputs)
                          if (analysis.contextPrompt) {
                              // Note: Gemini Live API may support sending text context with media
                              // For now, we log it for debugging. In future, this could be sent as a tool call or text input
                              console.debug('Context vidéo:', analysis.contextPrompt);
                          }
                          
                          sessionRef.current.sendRealtimeInput(input);
                      }
                  } catch (e) {
                      console.warn("Error encoding/sending frame", e);
                  }
              }, 0);
              
          } catch (e) {
              console.warn("Error capturing frame", e);
          }
          
          frameIntervalRef.current = window.setTimeout(captureAndSend, targetInterval);
      };

      captureAndSend();
  };

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

  useEffect(() => {
    return () => {
      disconnect();
      if (videoStreamRef.current) {
          videoStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (frameIntervalRef.current) {
          clearTimeout(frameIntervalRef.current as NodeJS.Timeout);
          clearInterval(frameIntervalRef.current as number);
      }
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
                    'fin de session',
                    'terminer session',
                    'redémarrer l\'application',
                    'redémarrer application',
                    'redémarrer app',
                    'relancer l\'application',
                    'relancer application',
                    'relancer app',
                    'redémarrer',
                    'relancer',
                    'terminer',
                    'arrêter la session',
                    'arrêter session',
                    'fermer la session',
                    'fermer session'
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
                  
                  // Phrases qui indiquent une demande d'activation de la vision
                  const activateVisionPhrases = [
                    'active la vision',
                    'activer la vision',
                    'active vision',
                    'activer vision',
                    'active la caméra',
                    'activer la caméra',
                    'active caméra',
                    'activer caméra',
                    'active la vidéo',
                    'activer la vidéo',
                    'active vidéo',
                    'activer vidéo',
                    'allume la caméra',
                    'allumer la caméra',
                    'allume caméra',
                    'allumer caméra',
                    'allume la vision',
                    'allumer la vision',
                    'ouvre la caméra',
                    'ouvrir la caméra',
                    'ouvre caméra',
                    'ouvrir caméra',
                    'démarre la caméra',
                    'démarrer la caméra',
                    'démarre caméra',
                    'démarrer caméra',
                    'peux-tu activer la vision',
                    'peux tu activer la vision',
                    'peux-tu activer la caméra',
                    'peux tu activer la caméra',
                    'tu peux activer la vision',
                    'tu peux activer la caméra',
                    'j\'aimerais activer la vision',
                    'j aimerais activer la vision',
                    'je veux activer la vision',
                    'je voudrais activer la vision'
                  ];
                  
                  // Vérifier les phrases d'activation, mais exclure les négations et les contextes passés
                  const negativePrefixes = ['dés', 'des', 'non', 'pas', 'arrêt', 'arrêter', 'ferm', 'fermer', 'stop'];
                  const pastContextPrefixes = ['viens d\'', 'viens d', 'vient d\'', 'vient d', 'ai ', 'as ', 'a ', 'avons ', 'avez ', 'ont ', 'venait de', 'venais de', 'venaient de', 'venions de', 'veniez de'];
                  
                  const shouldActivateVision = activateVisionPhrases.some(phrase => {
                    const index = textLower.indexOf(phrase);
                    if (index === -1) return false;
                    
                    // Vérifier qu'il n'y a pas de préfixe négatif avant la phrase
                    const beforePhrase = textLower.substring(Math.max(0, index - 15), index).trim();
                    const hasNegativePrefix = negativePrefixes.some(prefix => 
                      beforePhrase.endsWith(prefix) || textLower.substring(Math.max(0, index - prefix.length - 2), index).includes(prefix)
                    );
                    
                    // Vérifier qu'il n'y a pas de contexte passé (ex: "je viens d'activer")
                    const hasPastContext = pastContextPrefixes.some(prefix => 
                      beforePhrase.includes(prefix) || textLower.substring(Math.max(0, index - 20), index).includes(prefix)
                    );
                    
                    return !hasNegativePrefix && !hasPastContext;
                  });
                  
                  if (shouldActivateVision && !isVideoActiveRef.current) {
                    console.log('[App] ✅ Demande d\'activation de la vision détectée dans le texte:', text);
                    
                    // Vérifier qu'une caméra est disponible
                    if (availableCamerasRef.current.length === 0) {
                      console.log('[App] ⚠️ Aucune caméra disponible, énumération des caméras...');
                      enumerateCameras().then(() => {
                        setTimeout(() => {
                          if (availableCamerasRef.current.length > 0) {
                            if (!selectedCameraIdRef.current) {
                              setSelectedCameraId(availableCamerasRef.current[0].deviceId);
                              console.log('[App] 📹 Caméra sélectionnée:', availableCamerasRef.current[0].deviceId);
                            }
                            addToast('success', 'Activation Vision', 'Activation de la caméra...');
                            setIsVideoActive(true);
                          } else {
                            console.log('[App] ❌ Aucune caméra disponible');
                            addToast('error', 'Erreur', 'Aucune caméra disponible');
                          }
                        }, 100);
                      });
                    } else {
                      // S'assurer qu'une caméra est sélectionnée
                      if (!selectedCameraIdRef.current && availableCamerasRef.current.length > 0) {
                        setSelectedCameraId(availableCamerasRef.current[0].deviceId);
                        console.log('[App] 📹 Caméra sélectionnée:', availableCamerasRef.current[0].deviceId);
                      }
                      addToast('success', 'Activation Vision', 'Activation de la caméra...');
                      setIsVideoActive(true);
                    }
                  }
                  
                  // Phrases qui indiquent une demande de désactivation de la vision
                  const deactivateVisionPhrases = [
                    'désactive la vision',
                    'désactiver la vision',
                    'désactive vision',
                    'désactiver vision',
                    'désactive la caméra',
                    'désactiver la caméra',
                    'désactive caméra',
                    'désactiver caméra',
                    'arrête la vision',
                    'arrêter la vision',
                    'arrête vision',
                    'arrêter vision',
                    'arrête la caméra',
                    'arrêter la caméra',
                    'arrête caméra',
                    'arrêter caméra',
                    'ferme la vision',
                    'fermer la vision',
                    'ferme vision',
                    'fermer vision',
                    'ferme la caméra',
                    'fermer la caméra',
                    'ferme caméra',
                    'fermer caméra',
                    'éteint la vision',
                    'éteindre la vision',
                    'éteint vision',
                    'éteindre vision',
                    'éteint la caméra',
                    'éteindre la caméra',
                    'éteint caméra',
                    'éteindre caméra',
                    'coupe la vision',
                    'couper la vision',
                    'coupe vision',
                    'couper vision',
                    'coupe la caméra',
                    'couper la caméra',
                    'coupe caméra',
                    'couper caméra',
                    'stop la vision',
                    'stop vision',
                    'stop la caméra',
                    'stop caméra',
                    'stoppe la vision',
                    'stopper la vision',
                    'stoppe vision',
                    'stopper vision',
                    'stoppe la caméra',
                    'stopper la caméra',
                    'stoppe caméra',
                    'stopper caméra'
                  ];
                  
                  const shouldDeactivateVision = deactivateVisionPhrases.some(phrase => 
                    textLower.includes(phrase)
                  );
                  
                  if (shouldDeactivateVision && isVideoActiveRef.current) {
                    console.log('[App] ✅ Demande de désactivation de la vision détectée dans le texte:', text);
                    console.log('[App] 📊 État actuel de la vision avant désactivation:', isVideoActiveRef.current);
                    addToast('info', 'Désactivation Vision', 'Désactivation de la caméra...');
                    setIsVideoActive(false);
                    console.log('[App] 🛑 setIsVideoActive(false) appelé');
                  }
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
                      
                      if (isFinal && transcript.length > 0) {
                        console.log('[App] 🔍 Analyse de la transcription finale:', transcript);
                        
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
                        
                        // Phrases qui indiquent une demande d'activation de la vision
                        const activateVisionPhrases = [
                          'active la vision',
                          'activer la vision',
                          'active vision',
                          'activer vision',
                          'active la caméra',
                          'activer la caméra',
                          'active caméra',
                          'activer caméra',
                          'active la vidéo',
                          'activer la vidéo',
                          'active vidéo',
                          'activer vidéo',
                          'allume la caméra',
                          'allumer la caméra',
                          'allume caméra',
                          'allumer caméra',
                          'allume la vision',
                          'allumer la vision',
                          'ouvre la caméra',
                          'ouvrir la caméra',
                          'ouvre caméra',
                          'ouvrir caméra',
                          'démarre la caméra',
                          'démarrer la caméra',
                          'démarre caméra',
                          'démarrer caméra',
                          'peux-tu activer la vision',
                          'peux tu activer la vision',
                          'peux-tu activer la caméra',
                          'peux tu activer la caméra',
                          'tu peux activer la vision',
                          'tu peux activer la caméra',
                          'j\'aimerais activer la vision',
                          'j aimerais activer la vision',
                          'je veux activer la vision',
                          'je voudrais activer la vision'
                        ];
                        
                        // Mots-clés pour l'activation de vision
                        const activateVisionKeywords = [
                          'active',
                          'activer',
                          'allume',
                          'allumer',
                          'ouvre',
                          'ouvrir',
                          'démarre',
                          'démarrer'
                        ];
                        
                        // Vérifier d'abord les phrases complètes, en excluant les négations et les contextes passés
                        const negativePrefixes = ['dés', 'des', 'non', 'pas', 'arrêt', 'arrêter', 'ferm', 'fermer', 'stop'];
                        const pastContextPrefixes = ['viens d\'', 'viens d', 'vient d\'', 'vient d', 'ai ', 'as ', 'a ', 'avons ', 'avez ', 'ont ', 'venait de', 'venais de', 'venaient de', 'venions de', 'veniez de'];
                        
                        let shouldActivateVision = activateVisionPhrases.some(phrase => {
                          const index = transcript.indexOf(phrase);
                          if (index === -1) return false;
                          
                          // Vérifier qu'il n'y a pas de préfixe négatif avant la phrase
                          const beforePhrase = transcript.substring(Math.max(0, index - 15), index).trim();
                          const hasNegativePrefix = negativePrefixes.some(prefix => 
                            beforePhrase.endsWith(prefix) || transcript.substring(Math.max(0, index - prefix.length - 2), index).includes(prefix)
                          );
                          
                          // Vérifier qu'il n'y a pas de contexte passé (ex: "je viens d'activer")
                          const hasPastContext = pastContextPrefixes.some(prefix => 
                            beforePhrase.includes(prefix) || transcript.substring(Math.max(0, index - 20), index).includes(prefix)
                          );
                          
                          if (!hasNegativePrefix && !hasPastContext) {
                            console.log('[App] ✅ Phrase d\'activation vision détectée:', phrase, 'dans:', transcript);
                            return true;
                          }
                          return false;
                        });
                        
                        // Si pas de phrase complète, vérifier les mots-clés avec contexte
                        if (!shouldActivateVision) {
                          shouldActivateVision = activateVisionKeywords.some(keyword => {
                            const keywordIndex = transcript.indexOf(keyword);
                            if (keywordIndex !== -1) {
                              // Vérifier le contexte autour du mot-clé (20 caractères avant et après)
                              const contextStart = Math.max(0, keywordIndex - 20);
                              const contextEnd = Math.min(transcript.length, keywordIndex + keyword.length + 20);
                              const context = transcript.substring(contextStart, contextEnd);
                              
                              // Vérifier qu'il n'y a pas de contexte passé
                              const beforeKeyword = transcript.substring(Math.max(0, keywordIndex - 15), keywordIndex);
                              const hasPastContext = pastContextPrefixes.some(prefix => 
                                beforeKeyword.includes(prefix) || context.includes(prefix)
                              );
                              
                              // Vérifier si le contexte suggère une activation de vision
                              const contextIndicators = ['vision', 'caméra', 'camera', 'vidéo', 'video'];
                              const hasContext = contextIndicators.some(indicator => context.includes(indicator));
                              
                              if (hasContext && !hasPastContext) {
                                console.log('[App] ✅ Mot-clé d\'activation vision avec contexte détecté:', keyword, 'dans:', transcript);
                                return true;
                              }
                            }
                            return false;
                          });
                        }
                        
                        if (shouldActivateVision && !isVideoActiveRef.current) {
                          console.log('[App] ✅✅✅ DEMANDE D\'ACTIVATION DE LA VISION DÉTECTÉE:', transcript);
                          console.log('[App] 🚀 Activation de la caméra...');
                          console.log('[App] 📊 État actuel de la vision:', isVideoActiveRef.current);
                          
                          // Vérifier qu'une caméra est disponible
                          if (availableCamerasRef.current.length === 0) {
                            console.log('[App] ⚠️ Aucune caméra disponible, énumération des caméras...');
                            enumerateCameras().then(() => {
                              // Après l'énumération, vérifier à nouveau
                              setTimeout(() => {
                                if (availableCamerasRef.current.length > 0) {
                                  if (!selectedCameraIdRef.current) {
                                    setSelectedCameraId(availableCamerasRef.current[0].deviceId);
                                  }
                                  setIsVideoActive(true);
                                  addToast('success', 'Activation Vision', 'Activation de la caméra...');
                        } else {
                                  addToast('error', 'Erreur', 'Aucune caméra disponible');
                                }
                              }, 100);
                            });
                          } else {
                            // S'assurer qu'une caméra est sélectionnée
                            if (!selectedCameraIdRef.current && availableCamerasRef.current.length > 0) {
                              setSelectedCameraId(availableCamerasRef.current[0].deviceId);
                            }
                            addToast('success', 'Activation Vision', 'Activation de la caméra...');
                            setIsVideoActive(true);
                          }
                          return;
                        }
                        
                        // Phrases qui indiquent une demande de désactivation de la vision
                        const deactivateVisionPhrases = [
                          'désactive la vision',
                          'désactiver la vision',
                          'désactive vision',
                          'désactiver vision',
                          'désactive la caméra',
                          'désactiver la caméra',
                          'désactive caméra',
                          'désactiver caméra',
                          'arrête la vision',
                          'arrêter la vision',
                          'arrête vision',
                          'arrêter vision',
                          'arrête la caméra',
                          'arrêter la caméra',
                          'arrête caméra',
                          'arrêter caméra',
                          'ferme la vision',
                          'fermer la vision',
                          'ferme vision',
                          'fermer vision',
                          'ferme la caméra',
                          'fermer la caméra',
                          'ferme caméra',
                          'fermer caméra',
                          'éteint la vision',
                          'éteindre la vision',
                          'éteint vision',
                          'éteindre vision',
                          'éteint la caméra',
                          'éteindre la caméra',
                          'éteint caméra',
                          'éteindre caméra',
                          'coupe la vision',
                          'couper la vision',
                          'coupe vision',
                          'couper vision',
                          'coupe la caméra',
                          'couper la caméra',
                          'coupe caméra',
                          'couper caméra',
                          'stop la vision',
                          'stop vision',
                          'stop la caméra',
                          'stop caméra',
                          'stoppe la vision',
                          'stopper la vision',
                          'stoppe vision',
                          'stopper vision',
                          'stoppe la caméra',
                          'stopper la caméra',
                          'stoppe caméra',
                          'stopper caméra'
                        ];
                        
                        const shouldDeactivateVision = deactivateVisionPhrases.some(phrase => 
                          transcript.includes(phrase)
                        );
                        
                        if (shouldDeactivateVision && isVideoActiveRef.current) {
                          console.log('[App] ✅✅✅ DEMANDE DE DÉSACTIVATION DE LA VISION DÉTECTÉE:', transcript);
                          console.log('[App] 🛑 Désactivation de la caméra...');
                          console.log('[App] 📊 État actuel de la vision avant désactivation:', isVideoActiveRef.current);
                          addToast('info', 'Désactivation Vision', 'Désactivation de la caméra...');
                          setIsVideoActive(false);
                          console.log('[App] 🛑 setIsVideoActive(false) appelé');
                          return;
                        }
                        
                        if (!shouldEndSession && !shouldActivateVision && !shouldDeactivateVision) {
                          console.log('[App] ❌ Aucune commande détectée dans:', transcript);
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
          systemInstruction: buildSystemInstruction(currentPersonalityRef.current.systemInstruction),
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
  }, [isVideoActive, selectedVoice]);

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

    if (frameIntervalRef.current) {
        clearTimeout(frameIntervalRef.current as NodeJS.Timeout);
        clearInterval(frameIntervalRef.current as number);
        frameIntervalRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
    }

    // Cleanup video stream
    if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach(t => t.stop());
        videoStreamRef.current = null;
    }
    
    // Cleanup screen share
    if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
    }
    setIsScreenShareActive(false);
    isScreenShareActiveRef.current = false;

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
    <div className="relative w-full h-screen bg-black overflow-hidden font-body text-white selection:bg-indigo-500/30">
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
      
      <PersonalityEditor 
        isOpen={isPersonalityEditorOpen}
        onClose={() => setIsPersonalityEditorOpen(false)}
        currentPersonality={currentPersonality}
        onSave={handlePersonalityChange}
      />

      {/* Hidden Video & Canvas for Computer Vision */}
      <video ref={videoRef} className="hidden" muted playsInline autoPlay />
      <canvas ref={canvasRef} className="hidden" />

      {/* Premium Camera Preview (Picture-in-Picture) */}
      {(isVideoActive || isScreenShareActive) && !isVideoEnlarged && (
         <div 
           onClick={() => setIsVideoEnlarged(true)}
           className="absolute top-20 right-4 md:top-8 md:right-8 z-40 w-32 md:w-56 aspect-video rounded-2xl overflow-hidden glass-intense border border-white/20 shadow-2xl animate-in cursor-pointer group hover:scale-105 transition-transform duration-300"
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
             
             <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-lg glass-intense">
               <div className="relative">
                 <span className={`block w-2 h-2 rounded-full ${isScreenShareActive ? 'bg-indigo-500' : 'bg-red-500'}`}
                   style={{ boxShadow: isScreenShareActive ? '0 0 10px rgba(99, 102, 241, 0.8)' : '0 0 10px rgba(239, 68, 68, 0.8)' }}></span>
                 <span className={`absolute inset-0 w-2 h-2 rounded-full animate-ping ${isScreenShareActive ? 'bg-indigo-500' : 'bg-red-500'}`}></span>
               </div>
               <span className="font-display text-[9px] font-bold uppercase tracking-[0.15em] text-white">
                 {isScreenShareActive ? "Partage Écran" : "Vision Active"}
               </span>
             </div>
             
             {/* Expand Icon Hint */}
             <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
               <div className="p-2 rounded-lg glass-intense">
                 <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                 </svg>
               </div>
             </div>
         </div>
      )}
      
      {/* Enlarged Camera View */}
      {(isVideoActive || isScreenShareActive) && isVideoEnlarged && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsVideoEnlarged(false);
            }
          }}
        >
          <div className="relative w-full h-full max-w-6xl max-h-[90vh] m-4 md:m-8">
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
              <div className="absolute top-6 left-6 flex items-center gap-3 px-4 py-2.5 rounded-xl glass-intense">
                <div className="relative">
                  <span className={`block w-3 h-3 rounded-full ${isScreenShareActive ? 'bg-indigo-500' : 'bg-red-500'}`}
                    style={{ boxShadow: isScreenShareActive ? '0 0 15px rgba(99, 102, 241, 0.9)' : '0 0 15px rgba(239, 68, 68, 0.9)' }}></span>
                  <span className={`absolute inset-0 w-3 h-3 rounded-full animate-ping ${isScreenShareActive ? 'bg-indigo-500' : 'bg-red-500'}`}></span>
                </div>
                <span className="font-display text-xs font-bold uppercase tracking-[0.2em] text-white">
                  {isScreenShareActive ? "Partage Écran" : "Vision Active"}
                </span>
              </div>
              
              {/* Close Button */}
              <button
                onClick={() => setIsVideoEnlarged(false)}
                className="absolute top-6 right-6 group p-3 rounded-xl glass-intense border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105"
                style={{
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
                }}
              >
                <svg className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {/* Camera Info */}
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                <div className="px-4 py-2.5 rounded-xl glass-intense">
                  <span className="font-body text-sm text-slate-300">
                    {isScreenShareActive 
                      ? 'Partage d\'écran en cours' 
                      : (availableCameras.find(cam => cam.deviceId === selectedCameraId)?.label || 'Caméra')}
                  </span>
                </div>
                
                <div className="px-4 py-2.5 rounded-xl glass-intense">
                  <span className="font-body text-xs text-slate-400">
                    Cliquez à l'extérieur pour réduire
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="relative z-10 w-full h-full flex flex-col">
        {/* Premium Header */}
        <Header 
            connectionState={connectionState}
            currentPersonality={currentPersonality}
            selectedVoice={selectedVoice}
            onVoiceChange={setSelectedVoice}
        />

        <main className="flex-grow flex flex-col justify-end pb-10">
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
          />
        </main>
      </div>
    </div>
  );
};

export default App;