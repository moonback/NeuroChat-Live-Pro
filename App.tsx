import React, { useEffect, useState, useRef, useCallback } from 'react';
import Visualizer from './components/Visualizer';
import ControlPanel from './components/ControlPanel';
import Header from './components/Header';
import PersonalityEditor from './components/PersonalityEditor';
import { ToastContainer } from './components/Toast';
import QuickStartGuide from './components/QuickStartGuide';
import { ConnectionState, Personality } from './types';
import { DEFAULT_PERSONALITY } from './constants';
import { WakeWordDetector } from './utils/wakeWordDetector';
import type { ProcessedDocument } from './utils/documentProcessor';
import InstallPWA from './components/InstallPWA';
import ToolsList from './components/ToolsList';
import { useStatusManager } from './hooks/useStatusManager';
import { useAudioManager } from './hooks/useAudioManager';
import { useVisionManager } from './hooks/useVisionManager';
import { useGeminiLiveSession } from './hooks/useGeminiLiveSession';
import VideoOverlay from './components/VideoOverlay';
import { useAppStore } from './stores/appStore';

const App: React.FC = () => {
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

  // Store Zustand - État global (source unique de vérité)
  const {
    connectionState: storeConnectionState,
    currentPersonality,
    uploadedDocuments,
    isWakeWordEnabled,
    isFunctionCallingEnabled,
    isGoogleSearchEnabled,
    setConnectionState: setStoreConnectionState,
    setPersonality,
    setUploadedDocuments,
    setIsWakeWordEnabled,
    setIsFunctionCallingEnabled,
    setIsGoogleSearchEnabled,
  } = useAppStore();

  // Utiliser le store comme source unique de vérité pour connectionState
  // Synchroniser useStatusManager avec le store (unidirectionnel)
  useEffect(() => {
    if (connectionState !== storeConnectionState) {
      setConnectionState(storeConnectionState);
    }
  }, [storeConnectionState]); // Seulement storeConnectionState dans les dépendances

  const [selectedVoice, setSelectedVoice] = useState<string>(DEFAULT_PERSONALITY.voiceName);
  const [isPersonalityEditorOpen, setIsPersonalityEditorOpen] = useState(false);
  const [isToolsListOpen, setIsToolsListOpen] = useState(false);
  const [isMobileActionsDrawerOpen, setIsMobileActionsDrawerOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(false);
  const sidebarCloseTimeoutRef = useRef<number | null>(null);

  // Documents Context
  const [documentsContext, setDocumentsContext] = useState<string | undefined>(undefined);
  useEffect(() => {
    const updateContext = async () => {
        if (uploadedDocuments.length === 0) {
            setDocumentsContext(undefined);
            return;
        }
        const { formatDocumentForContext } = await import('./utils/documentProcessor');
        const context = await formatDocumentForContext(uploadedDocuments);
        setDocumentsContext(context);
    };
    updateContext();
  }, [uploadedDocuments]);

  // Session Ref (Shared)
  const sessionRef = useRef<any>(null);

  // Vision Manager
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
    connectionState: storeConnectionState,
    addToast,
    sessionRef,
  });

  // Gemini Live Session Hook
  const {
    connect,
    disconnect,
    analyserRef,
    inputAnalyserRef,
    connectRef,
    isIntentionalDisconnectRef,
    setIsIntentionalDisconnect,
  } = useGeminiLiveSession({
    connectionState: storeConnectionState,
    setConnectionState: setStoreConnectionState,
    connectionStateRef,
    setIsTalking,
    setLatency,
    addToast,
    personality: currentPersonality,
    documentsContext,
    selectedVoice,
    isFunctionCallingEnabled,
    isGoogleSearchEnabled,
    isVideoActive,
    startFrameTransmission,
    resetVisionState,
    sessionRef,
  });

  // Wake Word Detector Ref
  const wakeWordDetectorRef = useRef<WakeWordDetector | null>(null);

  // Personality Management
  const handlePersonalityChange = (newPersonality: Personality) => {
    setPersonality(newPersonality);
    
    // If connected, we need to update the session (reconnect for now to apply system prompt)
    if (storeConnectionState === ConnectionState.CONNECTED) {
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
    if (storeConnectionState === ConnectionState.CONNECTED) {
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
    if (storeConnectionState === ConnectionState.CONNECTED) {
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
    if (storeConnectionState === ConnectionState.CONNECTED) {
      addToast('info', 'Documents Mis à Jour', 'Reconnexion pour appliquer les changements...');
      disconnect();
      setTimeout(() => {
        connect();
      }, 500);
    } else {
      addToast('success', 'Documents Chargés', `${documents.length} document(s) prêt(s) à être utilisés`);
    }
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

  // Sidebar Desktop: auto repli (fermer à la connexion, et après sortie de la zone)
  useEffect(() => {
    if (storeConnectionState === ConnectionState.CONNECTED) {
      setIsDesktopSidebarOpen(false);
    }
  }, [storeConnectionState]);

  const openDesktopSidebar = useCallback(() => {
    if (sidebarCloseTimeoutRef.current) {
      window.clearTimeout(sidebarCloseTimeoutRef.current);
      sidebarCloseTimeoutRef.current = null;
    }
    setIsDesktopSidebarOpen(true);
  }, []);

  const scheduleCloseDesktopSidebar = useCallback(() => {
    if (sidebarCloseTimeoutRef.current) {
      window.clearTimeout(sidebarCloseTimeoutRef.current);
    }
    sidebarCloseTimeoutRef.current = window.setTimeout(() => {
      setIsDesktopSidebarOpen(false);
      sidebarCloseTimeoutRef.current = null;
    }, 700);
  }, []);

  useEffect(() => {
    return () => {
      if (sidebarCloseTimeoutRef.current) {
        window.clearTimeout(sidebarCloseTimeoutRef.current);
      }
    };
  }, []);

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
          const currentState = storeConnectionState;
          console.log('[App] État actuel de la connexion:', currentState);
          if (currentState === ConnectionState.DISCONNECTED || currentState === ConnectionState.ERROR) {
            addToast('info', 'Wake Word Détecté', 'Connexion au chat en cours...');
            setIsIntentionalDisconnect(false);
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
    if ((storeConnectionState === ConnectionState.DISCONNECTED || storeConnectionState === ConnectionState.ERROR) && isWakeWordEnabled) {
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
  }, [storeConnectionState, isWakeWordEnabled, connectionStateRef, setIsIntentionalDisconnect, connectRef, activateAudioContext, playBeep, addToast]);

  // Sauvegarder la préférence du wake word dans localStorage
  // (géré automatiquement par useLocalStorageState)

  useEffect(() => {
    return () => {
      disconnect();
      if (wakeWordDetectorRef.current) {
        wakeWordDetectorRef.current.destroy();
      }
    };
  }, [disconnect]);

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
      {(isTalking || storeConnectionState === ConnectionState.CONNECTED) && (
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
          backgroundImage: `linear-gradient(135deg, ${currentPersonality.themeColor}05 0%, transparent 50%, ${currentPersonality.themeColor}05 100%)`,
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
        isActive={isTalking || storeConnectionState === ConnectionState.CONNECTED}
      />
      
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <InstallPWA />
      
      <QuickStartGuide
        connectionState={storeConnectionState}
        isWakeWordEnabled={isWakeWordEnabled}
        onClose={() => {}}
      />
      
      <PersonalityEditor 
        isOpen={isPersonalityEditorOpen}
        onClose={() => setIsPersonalityEditorOpen(false)}
        currentPersonality={currentPersonality}
        onSave={handlePersonalityChange}
      />

      <ToolsList
        isOpen={isToolsListOpen}
        onClose={() => setIsToolsListOpen(false)}
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
            connectionState={storeConnectionState}
            currentPersonality={currentPersonality}
            selectedVoice={selectedVoice}
            onVoiceChange={setSelectedVoice}
            uploadedDocuments={uploadedDocuments}
            onDocumentsChange={handleDocumentsChange}
            onConnect={() => {
                  setIsIntentionalDisconnect(false);
                  activateAudioContext();
                  connect();
            }}
            onDisconnect={() => {
                  setIsIntentionalDisconnect(true);
                  disconnect(true);
            }}
            isFunctionCallingEnabled={isFunctionCallingEnabled}
            onToggleFunctionCalling={handleFunctionCallingToggle}
            isGoogleSearchEnabled={isGoogleSearchEnabled}
            onToggleGoogleSearch={handleGoogleSearchToggle}
            onEditPersonality={() => setIsPersonalityEditorOpen(true)}
            onOpenToolsList={() => setIsToolsListOpen(true)}
        />

        {/* Desktop Layout: Sidebar + Main Content */}
        <div className="relative flex-grow flex flex-col lg:flex-row lg:pt-10 xl:pt-12">
          {/* Hotzone (Desktop) - survol bord gauche pour ouvrir */}
          <div
            className={`hidden lg:block absolute left-0 top-0 h-full ${isDesktopSidebarOpen ? 'w-0' : 'w-3'} z-30`}
            onMouseEnter={openDesktopSidebar}
          />

          {/* Desktop Sidebar - Contrôles et informations */}
          <aside
            onMouseEnter={openDesktopSidebar}
            onMouseLeave={scheduleCloseDesktopSidebar}
            className={`hidden lg:flex lg:flex-col lg:overflow-hidden custom-scrollbar z-20 transition-all duration-300 ease-out ${
              isDesktopSidebarOpen
                ? 'lg:w-64 xl:w-72 lg:border-r lg:border-white/5 lg:bg-black/40 lg:backdrop-blur-xl lg:p-3 xl:p-4 lg:gap-4 xl:gap-5 shadow-[5px_0_30px_rgba(0,0,0,0.5)]'
                : 'lg:w-0 xl:w-0 lg:p-0 lg:border-r-0 lg:bg-transparent lg:backdrop-blur-0 shadow-none'
            }`}
          >
            {/* Toggle button (quand ouvert) */}
            <div
              className={`hidden lg:flex items-center justify-end ${
                isDesktopSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
              } transition-opacity duration-200`}
            >
              <button
                onClick={() => setIsDesktopSidebarOpen(false)}
                className="mb-3 p-2 rounded-lg glass border border-white/10 text-slate-300 hover:text-white hover:border-white/25"
                aria-label="Replier la sidebar"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>

            <div
              className={`${isDesktopSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-200`}
            >
            {/* Status Panel */}
            <div className="glass-intense rounded-xl p-3 space-y-3 hover-lift glass-hover animate-fade-in border border-white/5 group transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]">
              <h3 className="text-[10px] font-display font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <span className="w-0.5 h-3 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></span>
                État du Système
              </h3>
              
              <div className="space-y-2">
                {/* Connection Status */}
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors duration-300">
                  <span className="text-[10px] text-slate-300 font-medium">Connexion</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`relative flex h-2 w-2`}>
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        storeConnectionState === ConnectionState.CONNECTED ? 'bg-emerald-400' : 
                        storeConnectionState === ConnectionState.CONNECTING ? 'bg-amber-400' : 'hidden'
                      }`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${
                        storeConnectionState === ConnectionState.CONNECTED ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 
                        storeConnectionState === ConnectionState.CONNECTING ? 'bg-amber-500' : 
                        'bg-slate-600'
                      }`}></span>
                    </span>
                    <span className={`text-[10px] font-bold ${
                      storeConnectionState === ConnectionState.CONNECTED ? 'text-emerald-400' : 
                      storeConnectionState === ConnectionState.CONNECTING ? 'text-amber-400' : 'text-slate-500'
                    }`}>
                      {storeConnectionState === ConnectionState.CONNECTED ? 'ONLINE' : 
                       storeConnectionState === ConnectionState.CONNECTING ? 'SYNC...' : 'OFFLINE'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {/* Latency */}
                  <div className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors duration-300">
                     <span className="text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">Latence</span>
                     <span className={`text-xs font-bold font-mono ${latency > 200 ? 'text-amber-400' : 'text-emerald-400'}`}>
                       {storeConnectionState === ConnectionState.CONNECTED && latency > 0 ? `${latency}ms` : '-'}
                     </span>
                  </div>

                   {/* Vision Status */}
                   <div className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors duration-300">
                     <span className="text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">Vision</span>
                     <span className={`text-[10px] font-bold ${isVideoActive || isScreenShareActive ? 'text-indigo-400' : 'text-slate-500'}`}>
                       {isScreenShareActive ? 'PARTAGE' : isVideoActive ? 'ON' : 'OFF'}
                     </span>
                  </div>
                </div>

                {/* Toggles Status Compact */}
                <div className="grid grid-cols-1 gap-1 mt-1.5">
                   <div className={`flex items-center justify-between px-1.5 py-1 rounded border ${isWakeWordEnabled ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/5 bg-transparent'}`}>
                      <span className="text-[9px] text-slate-300">Wake Word</span>
                      <span className={`text-[9px] font-bold ${isWakeWordEnabled ? 'text-emerald-400' : 'text-slate-500'}`}>{isWakeWordEnabled ? 'ON' : 'OFF'}</span>
                   </div>
                   <div className={`flex items-center justify-between px-1.5 py-1 rounded border ${isFunctionCallingEnabled ? 'border-blue-500/20 bg-blue-500/5' : 'border-white/5 bg-transparent'}`}>
                      <span className="text-[9px] text-slate-300">Fonctions</span>
                      <span className={`text-[9px] font-bold ${isFunctionCallingEnabled ? 'text-blue-400' : 'text-slate-500'}`}>{isFunctionCallingEnabled ? 'ON' : 'OFF'}</span>
                   </div>
                   <div className={`flex items-center justify-between px-1.5 py-1 rounded border ${isGoogleSearchEnabled ? 'border-green-500/20 bg-green-500/5' : 'border-white/5 bg-transparent'}`}>
                      <span className="text-[9px] text-slate-300">Recherche</span>
                      <span className={`text-[9px] font-bold ${isGoogleSearchEnabled ? 'text-green-400' : 'text-slate-500'}`}>{isGoogleSearchEnabled ? 'ON' : 'OFF'}</span>
                   </div>
                </div>
              </div>
            </div>

            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-grow flex flex-col justify-end pb-0 sm:pb-1.5 md:pb-3 lg:pb-4 xl:pb-6 safe-area-bottom lg:px-6 xl:px-8">
            <ControlPanel 
              connectionState={storeConnectionState}
              currentPersonality={currentPersonality}
              isVideoActive={isVideoActive}
              isScreenShareActive={isScreenShareActive}
              latencyMs={latency}
              inputAnalyser={inputAnalyserRef.current}
              availableCameras={availableCameras}
              selectedCameraId={selectedCameraId}
              onConnect={() => {
                  setIsIntentionalDisconnect(false);
                  // Activer le contexte audio lors de la première interaction
                  activateAudioContext();
                  connect();
              }}
              onDisconnect={() => {
                  setIsIntentionalDisconnect(true);
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
        {isMobileActionsDrawerOpen && storeConnectionState === ConnectionState.DISCONNECTED && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300"
              onClick={() => setIsMobileActionsDrawerOpen(false)}
            />
            
            {/* Drawer */}
            <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto bg-gradient-to-b from-slate-900/98 via-slate-900/95 to-slate-900 rounded-t-3xl border-t border-white/20 animate-in slide-in-from-bottom-5 duration-300 safe-area-bottom"
              style={{
                boxShadow: '0 -20px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(14, 165, 233, 0.25)'
              }}>
              {/* Drag Handle */}
              <div className="sticky top-0 z-20 pt-3 pb-2 flex justify-center">
                <div className="w-12 h-1.5 rounded-full bg-white/20" />
              </div>

              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between px-4 pb-3 pt-1 border-b border-white/10 bg-gradient-to-b from-slate-900/98 to-transparent backdrop-blur-xl">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/30">
                    <svg className="w-5 h-5 text-sky-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-display font-bold text-white tracking-tight">
                    Actions Rapides
                  </h3>
                </div>
                <button
                  onClick={() => setIsMobileActionsDrawerOpen(false)}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:border-white/30 hover:text-white hover:bg-white/10 transition-all duration-200 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                {/* Personnalité */}
                <button
                  onClick={() => {
                    setIsPersonalityEditorOpen(true);
                    setIsMobileActionsDrawerOpen(false);
                  }}
                  className="group w-full px-4 py-3.5 rounded-xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 hover:border-pink-500/40 hover:from-pink-500/10 hover:to-pink-500/5 text-slate-200 hover:text-white font-medium text-sm transition-all duration-300 active:scale-[0.97] text-left flex items-center gap-3.5 touch-manipulation min-h-[56px] shadow-sm hover:shadow-lg hover:shadow-pink-500/10"
                >
                  <div className="p-2.5 rounded-lg bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-500/30 group-hover:border-pink-400/50 transition-colors">
                    <svg className="w-5 h-5 text-pink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <span className="flex-1 font-semibold">Modifier la personnalité</span>
                  <svg className="w-5 h-5 text-slate-400 group-hover:text-pink-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Séparateur */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-2" />

                {/* Function Calling */}
                <button
                  onClick={() => {
                    handleFunctionCallingToggle(!isFunctionCallingEnabled);
                    setIsMobileActionsDrawerOpen(false);
                  }}
                  className={`group w-full px-4 py-3.5 rounded-xl border font-medium text-sm transition-all duration-300 active:scale-[0.97] text-left flex items-center gap-3.5 touch-manipulation min-h-[56px] shadow-sm ${
                    isFunctionCallingEnabled 
                      ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/50 text-blue-200 hover:border-blue-400/70 hover:from-blue-500/25 hover:shadow-lg hover:shadow-blue-500/20' 
                      : 'bg-gradient-to-br from-white/5 to-white/0 border-white/10 text-slate-200 hover:border-blue-500/40 hover:from-blue-500/10 hover:to-blue-500/5 hover:text-white hover:shadow-lg hover:shadow-blue-500/10'
                  }`}
                >
                  <div className={`p-2.5 rounded-lg border transition-colors ${
                    isFunctionCallingEnabled
                      ? 'bg-gradient-to-br from-blue-500/30 to-blue-600/20 border-blue-400/50'
                      : 'bg-gradient-to-br from-white/5 to-white/0 border-white/10 group-hover:border-blue-500/40 group-hover:from-blue-500/20'
                  }`}>
                    <svg className={`w-5 h-5 transition-colors ${isFunctionCallingEnabled ? 'text-blue-200' : 'text-slate-300 group-hover:text-blue-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <span className="flex-1 font-semibold">
                    {isFunctionCallingEnabled ? 'Désactiver' : 'Activer'} Appel de fonction
                  </span>
                  {isFunctionCallingEnabled && (
                    <div className="px-2.5 py-1 rounded-lg bg-blue-500/30 border border-blue-400/50">
                      <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">ON</span>
                    </div>
                  )}
                </button>
                
                {/* Google Search */}
                <button
                  onClick={() => {
                    handleGoogleSearchToggle(!isGoogleSearchEnabled);
                    setIsMobileActionsDrawerOpen(false);
                  }}
                  className={`group w-full px-4 py-3.5 rounded-xl border font-medium text-sm transition-all duration-300 active:scale-[0.97] text-left flex items-center gap-3.5 touch-manipulation min-h-[56px] shadow-sm ${
                    isGoogleSearchEnabled 
                      ? 'bg-gradient-to-br from-emerald-500/20 to-green-600/10 border-emerald-500/50 text-emerald-200 hover:border-emerald-400/70 hover:from-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/20' 
                      : 'bg-gradient-to-br from-white/5 to-white/0 border-white/10 text-slate-200 hover:border-emerald-500/40 hover:from-emerald-500/10 hover:to-emerald-500/5 hover:text-white hover:shadow-lg hover:shadow-emerald-500/10'
                  }`}
                >
                  <div className={`p-2.5 rounded-lg border transition-colors ${
                    isGoogleSearchEnabled
                      ? 'bg-gradient-to-br from-emerald-500/30 to-green-600/20 border-emerald-400/50'
                      : 'bg-gradient-to-br from-white/5 to-white/0 border-white/10 group-hover:border-emerald-500/40 group-hover:from-emerald-500/20'
                  }`}>
                    <svg className={`w-5 h-5 transition-colors ${isGoogleSearchEnabled ? 'text-emerald-200' : 'text-slate-300 group-hover:text-emerald-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <span className="flex-1 font-semibold">
                    {isGoogleSearchEnabled ? 'Désactiver' : 'Activer'} Google Search
                  </span>
                  {isGoogleSearchEnabled && (
                    <div className="px-2.5 py-1 rounded-lg bg-emerald-500/30 border border-emerald-400/50">
                      <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider">ON</span>
                    </div>
                  )}
                </button>

                {/* Séparateur */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-2" />
                
                {/* Tools List */}
                <button
                  onClick={() => {
                    setIsToolsListOpen(true);
                    setIsMobileActionsDrawerOpen(false);
                  }}
                  className="group w-full px-4 py-3.5 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-500/30 hover:border-blue-400/50 hover:from-blue-500/15 hover:to-indigo-500/10 text-blue-200 hover:text-blue-100 font-medium text-sm transition-all duration-300 active:scale-[0.97] text-left flex items-center gap-3.5 touch-manipulation min-h-[56px] shadow-sm hover:shadow-lg hover:shadow-blue-500/15"
                >
                  <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-400/40 group-hover:border-blue-300/60 transition-colors">
                    <svg className="w-5 h-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <span className="flex-1 font-semibold">Voir les fonctions disponibles</span>
                  <svg className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Bottom padding for safe area */}
              <div className="h-4 safe-area-bottom" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
