import React, { useEffect, useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import Visualizer from './components/Visualizer';
import ControlPanel from './components/ControlPanel';
import Header from './components/Header';
import { ToastContainer, ToastMessage } from './components/Toast';
import { ConnectionState, DEFAULT_AUDIO_CONFIG } from './types';
import { DEFAULT_PERSONALITY } from './constants';
import { createBlob, decodeAudioData, base64ToArrayBuffer, arrayBufferToBase64 } from './utils/audioUtils';
import { buildSystemInstruction } from './systemConfig';

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

  // Video Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const frameIntervalRef = useRef<number | null>(null);

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
        window.clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
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
            try {
                const constraints: MediaStreamConstraints = {
                  video: selectedCameraId ? { deviceId: { exact: selectedCameraId } } : true
                };
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                videoStreamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }
                
                // Start sending frames if we are connected
                if (connectionState === ConnectionState.CONNECTED) {
                    startFrameTransmission();
                }
            } catch (e) {
                console.error("Failed to access camera", e);
                addToast('error', 'Erreur Caméra', "Impossible d'accéder à la caméra. Vérifiez les permissions.");
                setIsVideoActive(false);
            }
        } else if (!isVideoActive && videoStreamRef.current) {
            videoStreamRef.current.getTracks().forEach(t => t.stop());
            videoStreamRef.current = null;
            
            // Only stop transmission if screen share is also not active
            if (!isScreenShareActive && frameIntervalRef.current) {
                window.clearInterval(frameIntervalRef.current);
                frameIntervalRef.current = null;
            }
        }
    };
    startVideo();
  }, [isVideoActive, connectionState, isScreenShareActive]);

  const startFrameTransmission = () => {
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
      
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      if (!canvas || !video) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Send frames at 1 FPS to save bandwidth but maintain context
      frameIntervalRef.current = window.setInterval(async () => {
          const isScreenSharing = isScreenShareActiveRef.current;
          const currentStream = isScreenSharing ? screenStreamRef.current : videoStreamRef.current;
          
          if (sessionRef.current && currentStream && video.readyState === 4) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              ctx.drawImage(video, 0, 0);
              
              // Quality adjusted for screen sharing (higher) vs camera (standard)
              const quality = isScreenSharing ? 0.8 : 0.6;
              const base64 = canvas.toDataURL('image/jpeg', quality).split(',')[1];
              
              try {
                sessionRef.current.sendRealtimeInput({
                    media: {
                        mimeType: 'image/jpeg',
                        data: base64
                    }
                });
              } catch (e) {
                  console.warn("Error sending frame", e);
              }
          }
      }, isScreenShareActiveRef.current ? 500 : 1000); // Faster updates for screen share (2 FPS) 
  };

  useEffect(() => {
    return () => {
      disconnect();
      if (videoStreamRef.current) {
          videoStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (frameIntervalRef.current) {
          window.clearInterval(frameIntervalRef.current);
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
                }
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              audioSourcesRef.current.add(source);
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
          systemInstruction: buildSystemInstruction(DEFAULT_PERSONALITY.systemInstruction),
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

  const disconnect = (shouldReload: boolean = false) => {
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
        clearInterval(frameIntervalRef.current);
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
    
    // Rafraîchir la page uniquement si demandé explicitement (clic sur bouton)
    if (shouldReload) {
        addToast('info', 'Déconnexion', 'Session terminée.');
        setTimeout(() => {
            window.location.reload();
        }, 800);
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
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vh] h-[90vh] rounded-full transition-all duration-[2000ms] ease-out pointer-events-none z-0"
        style={{ 
          background: `radial-gradient(circle, ${DEFAULT_PERSONALITY.themeColor}25, ${DEFAULT_PERSONALITY.themeColor}10 40%, transparent 70%)`,
          filter: 'blur(80px)',
          animation: 'pulse-glow 8s ease-in-out infinite'
        }}
      />
      
      {/* Secondary Glow - Top Right for Depth */}
      <div 
        className="absolute top-[15%] right-[15%] w-[60vh] h-[60vh] rounded-full transition-all duration-[2000ms] ease-out pointer-events-none z-0"
        style={{ 
          background: `radial-gradient(circle, ${DEFAULT_PERSONALITY.themeColor}15, transparent 60%)`,
          filter: 'blur(100px)',
          animation: 'pulse-glow 10s ease-in-out infinite reverse'
        }}
      />

      {/* Tertiary Glow - Bottom Left */}
      <div 
        className="absolute bottom-[10%] left-[20%] w-[50vh] h-[50vh] rounded-full transition-all duration-[2000ms] ease-out pointer-events-none z-0"
        style={{ 
          background: `radial-gradient(circle, ${DEFAULT_PERSONALITY.themeColor}12, transparent 60%)`,
          filter: 'blur(90px)',
          animation: 'pulse-glow 12s ease-in-out infinite'
        }}
      />

      {/* Sophisticated Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-transparent z-0 pointer-events-none" />
      
      {/* Screen Share Overlay Border */}
      {isScreenShareActive && (
         <div className="absolute inset-0 pointer-events-none z-30 border-[6px] border-indigo-500/50 shadow-[inset_0_0_100px_rgba(99,102,241,0.2)] animate-pulse" />
      )}

      {/* Premium Visualizer */}
      <Visualizer 
        analyserRef={analyserRef} 
        color={DEFAULT_PERSONALITY.themeColor} 
        isActive={isTalking || connectionState === ConnectionState.CONNECTED}
      />
      
      <ToastContainer toasts={toasts} removeToast={removeToast} />

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
            currentPersonality={DEFAULT_PERSONALITY}
            selectedVoice={selectedVoice}
            onVoiceChange={setSelectedVoice}
        />

        <main className="flex-grow flex flex-col justify-end pb-10">
          <ControlPanel 
            connectionState={connectionState}
            currentPersonality={DEFAULT_PERSONALITY}
            isVideoActive={isVideoActive}
            isScreenShareActive={isScreenShareActive}
            latencyMs={latency}
            inputAnalyser={inputAnalyserRef.current}
            availableCameras={availableCameras}
            selectedCameraId={selectedCameraId}
            onConnect={() => {
                isIntentionalDisconnectRef.current = false;
                connect();
            }}
            onDisconnect={() => {
                isIntentionalDisconnectRef.current = true;
                disconnect(true);
            }}
            onToggleVideo={() => setIsVideoActive(!isVideoActive)}
            onToggleScreenShare={toggleScreenShare}
            onCameraChange={changeCamera}
          />
        </main>
      </div>
    </div>
  );
};

export default App;