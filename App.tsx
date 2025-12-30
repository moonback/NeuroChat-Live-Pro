import React, { useEffect, useState, useRef, useCallback } from 'react';
import Visualizer from './components/Visualizer';
import ControlPanel from './components/ControlPanel';
import Header from './components/Header';
import PersonalityEditor from './components/PersonalityEditor';
import { ToastContainer } from './components/Toast';
import QuickStartGuide from './components/QuickStartGuide';
import { ConnectionState, Personality } from './types';
import { DEFAULT_PERSONALITY } from './constants';
import type { ProcessedDocument } from './utils/documentProcessor';
import InstallPWA from './components/InstallPWA';
import ToolsList from './components/ToolsList';
import { useStatusManager } from './hooks/useStatusManager';
import { useAudioManager } from './hooks/useAudioManager';
import { useVisionManager } from './hooks/useVisionManager';
import { useGeminiLiveSession } from './hooks/useGeminiLiveSession';
import VideoOverlay from './components/VideoOverlay';
import { useAppStore } from './stores/appStore';
import {
  showFunctionCallingToggle,
  showGoogleSearchToggle,
  showDocumentsUpdated,
  showDocumentsLoaded,
} from './utils/toastHelpers';

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
    isFunctionCallingEnabled,
    isGoogleSearchEnabled,
    isEyeTrackingEnabled,
    setConnectionState: setStoreConnectionState,
    setPersonality,
    setUploadedDocuments,
    setIsFunctionCallingEnabled,
    setIsGoogleSearchEnabled,
    setIsEyeTrackingEnabled,
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
  const [isSystemStatusModalOpen, setIsSystemStatusModalOpen] = useState(false);

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
    toggleMic,
    getMicMutedState,
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
    onPersonalityChange: (newPersonality) => {
      // Changer la personnalité
      setPersonality(newPersonality);
      
      // Si connecté, reconnecter pour appliquer le nouveau system prompt
      if (storeConnectionState === ConnectionState.CONNECTED) {
        disconnect();
        setTimeout(() => {
          connect();
        }, 500);
      }
    },
  });

  // Microphone mute state
  const [isMicMuted, setIsMicMuted] = useState(false);

  // Sync mic muted state with actual stream state
  useEffect(() => {
    if (storeConnectionState === ConnectionState.CONNECTED) {
      const muted = getMicMutedState();
      setIsMicMuted(muted);
    } else {
      setIsMicMuted(false);
    }
  }, [storeConnectionState, getMicMutedState]);

  // Toggle microphone
  const handleToggleMic = useCallback(() => {
    const newMutedState = toggleMic();
    setIsMicMuted(newMutedState);
  }, [toggleMic]);


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
    showFunctionCallingToggle(addToast, enabled);
    
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
    showGoogleSearchToggle(addToast, enabled);
    
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
      showDocumentsUpdated(addToast);
      disconnect();
      setTimeout(() => {
        connect();
      }, 500);
    } else {
      showDocumentsLoaded(addToast, documents.length);
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


  useEffect(() => {
    return () => {
      disconnect();
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
        isEyeTrackingEnabled={isEyeTrackingEnabled}
      />
      
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <InstallPWA />
      
      <QuickStartGuide
        connectionState={storeConnectionState}
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

      {/* System Status Modal */}
      {isSystemStatusModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" 
            onClick={() => setIsSystemStatusModalOpen(false)}
          />
          
          {/* Modal Container */}
          <div 
            className="relative w-full max-w-2xl bg-[#08080a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500"
            style={{
              boxShadow: `0 0 100px -20px ${currentPersonality.themeColor}15, 0 0 40px -10px rgba(0,0,0,0.5)`
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-display font-bold text-white">
                  État du Système
                </h2>
              </div>
              <button
                onClick={() => setIsSystemStatusModalOpen(false)}
                className="p-3 rounded-lg glass border border-white/10 hover:border-white/30 text-slate-300 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95"
                aria-label="Fermer la modal"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {/* Connection Status */}
              <div className="flex items-center justify-between p-5 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors duration-300">
                <span className="text-base text-slate-200 font-semibold">Connexion</span>
                <div className="flex items-center gap-4">
                  <span className={`relative flex h-4 w-4`}>
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      storeConnectionState === ConnectionState.CONNECTED ? 'bg-emerald-400' : 
                      storeConnectionState === ConnectionState.CONNECTING ? 'bg-amber-400' : 'hidden'
                    }`}></span>
                    <span className={`relative inline-flex rounded-full h-4 w-4 ${
                      storeConnectionState === ConnectionState.CONNECTED ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)]' : 
                      storeConnectionState === ConnectionState.CONNECTING ? 'bg-amber-500' : 
                      'bg-slate-600'
                    }`}></span>
                  </span>
                  <span className={`text-base font-bold ${
                    storeConnectionState === ConnectionState.CONNECTED ? 'text-emerald-400' : 
                    storeConnectionState === ConnectionState.CONNECTING ? 'text-amber-400' : 'text-slate-500'
                  }`}>
                    {storeConnectionState === ConnectionState.CONNECTED ? 'ONLINE' : 
                     storeConnectionState === ConnectionState.CONNECTING ? 'SYNC...' : 'OFFLINE'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Latency */}
                <div className="flex flex-col items-center justify-center p-5 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors duration-300">
                   <span className="text-sm text-slate-400 uppercase tracking-wider mb-2">Latence</span>
                   <span className={`text-2xl font-bold font-mono ${latency > 200 ? 'text-amber-400' : 'text-emerald-400'}`}>
                     {storeConnectionState === ConnectionState.CONNECTED && latency > 0 ? `${latency}ms` : '-'}
                   </span>
                </div>

                 {/* Vision Status */}
                 <div className="flex flex-col items-center justify-center p-5 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors duration-300">
                   <span className="text-sm text-slate-400 uppercase tracking-wider mb-2">Vision</span>
                   <span className={`text-xl font-bold ${isVideoActive || isScreenShareActive ? 'text-indigo-400' : 'text-slate-500'}`}>
                     {isScreenShareActive ? 'PARTAGE' : isVideoActive ? 'ON' : 'OFF'}
                   </span>
                </div>
              </div>

              {/* Toggles Status */}
              <div className="grid grid-cols-1 gap-4 mt-2">
                 <div className={`flex items-center justify-between px-5 py-4 rounded-xl border ${isFunctionCallingEnabled ? 'border-blue-500/30 bg-blue-500/10' : 'border-white/10 bg-white/5'}`}>
                    <span className="text-base text-slate-200 font-medium">Fonctions</span>
                    <span className={`text-base font-bold ${isFunctionCallingEnabled ? 'text-blue-400' : 'text-slate-500'}`}>{isFunctionCallingEnabled ? 'ON' : 'OFF'}</span>
                 </div>
                 <div className={`flex items-center justify-between px-5 py-4 rounded-xl border ${isGoogleSearchEnabled ? 'border-green-500/30 bg-green-500/10' : 'border-white/10 bg-white/5'}`}>
                    <span className="text-base text-slate-200 font-medium">Recherche</span>
                    <span className={`text-base font-bold ${isGoogleSearchEnabled ? 'text-green-400' : 'text-slate-500'}`}>{isGoogleSearchEnabled ? 'ON' : 'OFF'}</span>
                 </div>
                 
                 {/* Eye Tracking Toggle */}
                 <button 
                   onClick={() => setIsEyeTrackingEnabled(!isEyeTrackingEnabled)}
                   className={`flex items-center justify-between px-5 py-4 rounded-xl border transition-colors cursor-pointer w-full hover:bg-white/10 touch-manipulation ${isEyeTrackingEnabled ? 'border-purple-500/30 bg-purple-500/10' : 'border-white/10 bg-white/5'}`}
                 >
                    <span className="text-base text-slate-200 font-medium">Suivi Yeux</span>
                    <span className={`text-base font-bold ${isEyeTrackingEnabled ? 'text-purple-400' : 'text-slate-500'}`}>{isEyeTrackingEnabled ? 'ON' : 'OFF'}</span>
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
            onOpenSystemStatus={() => setIsSystemStatusModalOpen(true)}
        />

        {/* Desktop Layout: Main Content - Mode Kiosque */}
        <div className="relative flex-grow flex flex-col lg:pt-0 xl:pt-0">
          {/* Main Content Area - Mode Kiosque: Optimisé pour plein écran */}
          <main className="flex-grow flex flex-col justify-end pb-0 sm:pb-2 md:pb-4 lg:pb-6 xl:pb-8 safe-area-bottom lg:px-8 xl:px-12">
            <ControlPanel 
              connectionState={storeConnectionState}
              currentPersonality={currentPersonality}
              isVideoActive={isVideoActive}
              isScreenShareActive={isScreenShareActive}
              isMicMuted={isMicMuted}
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
              onToggleMic={handleToggleMic}
              onCameraChange={changeCamera}
              onEditPersonality={() => setIsPersonalityEditorOpen(true)}
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

                {/* Eye Tracking */}
                <button
                  onClick={() => {
                    setIsEyeTrackingEnabled(!isEyeTrackingEnabled);
                    setIsMobileActionsDrawerOpen(false);
                  }}
                  className={`group w-full px-4 py-3.5 rounded-xl border font-medium text-sm transition-all duration-300 active:scale-[0.97] text-left flex items-center gap-3.5 touch-manipulation min-h-[56px] shadow-sm ${
                    isEyeTrackingEnabled 
                      ? 'bg-gradient-to-br from-purple-500/20 to-fuchsia-600/10 border-purple-500/50 text-purple-200 hover:border-purple-400/70 hover:from-purple-500/25 hover:shadow-lg hover:shadow-purple-500/20' 
                      : 'bg-gradient-to-br from-white/5 to-white/0 border-white/10 text-slate-200 hover:border-purple-500/40 hover:from-purple-500/10 hover:to-purple-500/5 hover:text-white hover:shadow-lg hover:shadow-purple-500/10'
                  }`}
                >
                  <div className={`p-2.5 rounded-lg border transition-colors ${
                    isEyeTrackingEnabled
                      ? 'bg-gradient-to-br from-purple-500/30 to-fuchsia-600/20 border-purple-400/50'
                      : 'bg-gradient-to-br from-white/5 to-white/0 border-white/10 group-hover:border-purple-500/40 group-hover:from-purple-500/20'
                  }`}>
                    <svg className={`w-5 h-5 transition-colors ${isEyeTrackingEnabled ? 'text-purple-200' : 'text-slate-300 group-hover:text-purple-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <span className="flex-1 font-semibold">
                    {isEyeTrackingEnabled ? 'Désactiver' : 'Activer'} Suivi des Yeux
                  </span>
                  {isEyeTrackingEnabled && (
                    <div className="px-2.5 py-1 rounded-lg bg-purple-500/30 border border-purple-400/50">
                      <span className="text-[10px] font-bold text-purple-200 uppercase tracking-wider">ON</span>
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
