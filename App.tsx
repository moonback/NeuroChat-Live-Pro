import React, { useEffect, useState, useRef, useCallback } from 'react';
import Visualizer from './components/Visualizer';
import ControlPanel from './components/ControlPanel';
import Header from './components/Header';
import PersonalityEditor from './components/PersonalityEditor';
import SystemStatusModal from './components/SystemStatusModal';
import MobileActionsDrawer from './components/MobileActionsDrawer';
import { ToastContainer } from './components/Toast';
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

// --- Background Layer Component ---
const BackgroundLayers: React.FC<{ 
  themeColor: string; 
  isTalking: boolean; 
  isConnected: boolean;
}> = React.memo(({ themeColor, isTalking, isConnected }) => (
  <>
    {/* Base Layer - Deep Black with Subtle Noise */}
    <div 
      className="absolute inset-0 bg-[#000000] z-0" 
      style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.015) 1px, transparent 0)',
        backgroundSize: '40px 40px'
      }} 
    />
    
    {/* Primary Ambient Glow - Center */}
    <div 
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vh] h-[90vh] rounded-full transition-all duration-[2000ms] ease-out pointer-events-none z-0 animate-float"
      style={{ 
        background: `radial-gradient(circle, ${themeColor}25, ${themeColor}10 40%, transparent 70%)`,
        filter: 'blur(80px)',
        animation: 'pulse-glow 8s ease-in-out infinite'
      }}
    />
    
    {/* Secondary Glow - Top Right for Depth */}
    <div 
      className="absolute top-[15%] right-[15%] w-[60vh] h-[60vh] rounded-full transition-all duration-[2000ms] ease-out pointer-events-none z-0"
      style={{ 
        background: `radial-gradient(circle, ${themeColor}15, transparent 60%)`,
        filter: 'blur(100px)',
        animation: 'pulse-glow 10s ease-in-out infinite reverse, float 12s ease-in-out infinite'
      }}
    />

    {/* Tertiary Glow - Bottom Left */}
    <div 
      className="absolute bottom-[10%] left-[20%] w-[50vh] h-[50vh] rounded-full transition-all duration-[2000ms] ease-out pointer-events-none z-0"
      style={{ 
        background: `radial-gradient(circle, ${themeColor}12, transparent 60%)`,
        filter: 'blur(90px)',
        animation: 'pulse-glow 12s ease-in-out infinite, float 10s ease-in-out infinite reverse'
      }}
    />

    {/* Additional Dynamic Glow - Responsive to connection state */}
    {(isTalking || isConnected) && (
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vh] h-[100vh] rounded-full pointer-events-none z-0 transition-opacity duration-1000"
        style={{ 
          background: `radial-gradient(circle, ${themeColor}20, transparent 50%)`,
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
        backgroundImage: `linear-gradient(135deg, ${themeColor}05 0%, transparent 50%, ${themeColor}05 100%)`,
        backgroundSize: '200% 200%',
        animation: 'gradient-shift 15s ease infinite'
      }}
    />
  </>
));

BackgroundLayers.displayName = 'BackgroundLayers';

// --- Screen Share Overlay Component ---
const ScreenShareOverlay: React.FC<{ isActive: boolean }> = React.memo(({ isActive }) => {
  if (!isActive) return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none z-30 border-[6px] border-indigo-500/50 shadow-[inset_0_0_100px_rgba(99,102,241,0.2)] animate-pulse" />
  );
});

ScreenShareOverlay.displayName = 'ScreenShareOverlay';

// --- Main App Component ---
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

  // Sync useStatusManager with store (unidirectional)
  useEffect(() => {
    if (connectionState !== storeConnectionState) {
      setConnectionState(storeConnectionState);
    }
  }, [storeConnectionState]);

  // UI State
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
    isScreenShareActive,
    toggleScreenShare,
    availableCameras,
    selectedCameraId,
    changeCamera,
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
      if (currentPersonality.id === 'omnivision' && newPersonality.id !== 'omnivision') {
        setIsVideoActive(false);
      }
      setPersonality(newPersonality);
      if (newPersonality.id === 'omnivision') {
        setIsVideoActive(true);
      }
      if (storeConnectionState === ConnectionState.CONNECTED) {
        disconnect();
        setTimeout(() => connect(), 500);
      }
    },
  });

  // Microphone mute state
  const [isMicMuted, setIsMicMuted] = useState(false);

  useEffect(() => {
    if (storeConnectionState === ConnectionState.CONNECTED) {
      const muted = getMicMutedState();
      setIsMicMuted(muted);
    } else {
      setIsMicMuted(false);
    }
  }, [storeConnectionState, getMicMutedState]);

  const handleToggleMic = useCallback(() => {
    const newMutedState = toggleMic();
    setIsMicMuted(newMutedState);
  }, [toggleMic]);

  // Personality Management
  const handlePersonalityChange = useCallback((newPersonality: Personality) => {
    if (currentPersonality.id === 'omnivision' && newPersonality.id !== 'omnivision') {
      setIsVideoActive(false);
    }
    setPersonality(newPersonality);
    if (newPersonality.id === 'omnivision') {
      setIsVideoActive(true);
    }
    if (storeConnectionState === ConnectionState.CONNECTED) {
      disconnect();
      setTimeout(() => connect(), 500);
    }
  }, [currentPersonality.id, setPersonality, setIsVideoActive, storeConnectionState, disconnect, connect]);

  // Tools Management
  const handleFunctionCallingToggle = useCallback((enabled: boolean) => {
    setIsFunctionCallingEnabled(enabled);
    showFunctionCallingToggle(addToast, enabled);
    if (storeConnectionState === ConnectionState.CONNECTED) {
      disconnect();
      setTimeout(() => connect(), 500);
    }
  }, [setIsFunctionCallingEnabled, addToast, storeConnectionState, disconnect, connect]);

  const handleGoogleSearchToggle = useCallback((enabled: boolean) => {
    setIsGoogleSearchEnabled(enabled);
    showGoogleSearchToggle(addToast, enabled);
    if (storeConnectionState === ConnectionState.CONNECTED) {
      disconnect();
      setTimeout(() => connect(), 500);
    }
  }, [setIsGoogleSearchEnabled, addToast, storeConnectionState, disconnect, connect]);

  const handleEyeTrackingToggle = useCallback((enabled: boolean) => {
    setIsEyeTrackingEnabled(enabled);
  }, [setIsEyeTrackingEnabled]);

  // Document Management
  const handleDocumentsChange = useCallback((documents: ProcessedDocument[]) => {
    setUploadedDocuments(documents);
    if (storeConnectionState === ConnectionState.CONNECTED) {
      showDocumentsUpdated(addToast);
      disconnect();
      setTimeout(() => connect(), 500);
    } else {
      showDocumentsLoaded(addToast, documents.length);
    }
  }, [setUploadedDocuments, storeConnectionState, addToast, disconnect, connect]);

  // Connection handlers
  const handleConnect = useCallback(() => {
    setIsIntentionalDisconnect(false);
    activateAudioContext();
    connect();
  }, [setIsIntentionalDisconnect, activateAudioContext, connect]);

  const handleDisconnect = useCallback(() => {
    setIsIntentionalDisconnect(true);
    disconnect(true);
  }, [setIsIntentionalDisconnect, disconnect]);

  // Modal handlers
  const openPersonalityEditor = useCallback(() => setIsPersonalityEditorOpen(true), []);
  const closePersonalityEditor = useCallback(() => setIsPersonalityEditorOpen(false), []);
  const openToolsList = useCallback(() => setIsToolsListOpen(true), []);
  const closeToolsList = useCallback(() => setIsToolsListOpen(false), []);
  const openMobileActions = useCallback(() => setIsMobileActionsDrawerOpen(true), []);
  const closeMobileActions = useCallback(() => setIsMobileActionsDrawerOpen(false), []);
  const openSystemStatus = useCallback(() => setIsSystemStatusModalOpen(true), []);
  const closeSystemStatus = useCallback(() => setIsSystemStatusModalOpen(false), []);

  // Audio context activation on first interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      activateAudioContext();
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const isConnected = storeConnectionState === ConnectionState.CONNECTED;

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-body text-white selection:bg-indigo-500/30 safe-area-inset">
      
      {/* Premium Multi-Layer Background System */}
      <BackgroundLayers 
        themeColor={currentPersonality.themeColor}
        isTalking={isTalking}
        isConnected={isConnected}
      />
      
      {/* Screen Share Overlay Border */}
      <ScreenShareOverlay isActive={isScreenShareActive} />

      {/* Premium Visualizer */}
      <Visualizer 
        analyserRef={analyserRef} 
        color={currentPersonality.themeColor} 
        isActive={isTalking || isConnected}
        isEyeTrackingEnabled={isEyeTrackingEnabled}
      />
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* PWA Install Prompt */}
      <InstallPWA />
      
      {/* Modals */}
      <PersonalityEditor 
        isOpen={isPersonalityEditorOpen}
        onClose={closePersonalityEditor}
        currentPersonality={currentPersonality}
        onSave={handlePersonalityChange}
      />

      <ToolsList
        isOpen={isToolsListOpen}
        onClose={closeToolsList}
      />

      <SystemStatusModal
        isOpen={isSystemStatusModalOpen}
        onClose={closeSystemStatus}
        connectionState={storeConnectionState}
        currentPersonality={currentPersonality}
        latency={latency}
        isVideoActive={isVideoActive}
        isScreenShareActive={isScreenShareActive}
        isFunctionCallingEnabled={isFunctionCallingEnabled}
        isGoogleSearchEnabled={isGoogleSearchEnabled}
        isEyeTrackingEnabled={isEyeTrackingEnabled}
        onToggleEyeTracking={handleEyeTrackingToggle}
      />

      <MobileActionsDrawer
        isOpen={isMobileActionsDrawerOpen && !isConnected}
        onClose={closeMobileActions}
        currentPersonality={currentPersonality}
        isFunctionCallingEnabled={isFunctionCallingEnabled}
        isGoogleSearchEnabled={isGoogleSearchEnabled}
        isEyeTrackingEnabled={isEyeTrackingEnabled}
        onToggleFunctionCalling={handleFunctionCallingToggle}
        onToggleGoogleSearch={handleGoogleSearchToggle}
        onToggleEyeTracking={handleEyeTrackingToggle}
        onEditPersonality={openPersonalityEditor}
        onOpenToolsList={openToolsList}
      />

      {/* Video Overlay */}
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
        
        {/* Header */}
        <Header 
          connectionState={storeConnectionState}
          currentPersonality={currentPersonality}
          selectedVoice={selectedVoice}
          onVoiceChange={setSelectedVoice}
          uploadedDocuments={uploadedDocuments}
          onDocumentsChange={handleDocumentsChange}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          isFunctionCallingEnabled={isFunctionCallingEnabled}
          onToggleFunctionCalling={handleFunctionCallingToggle}
          isGoogleSearchEnabled={isGoogleSearchEnabled}
          onToggleGoogleSearch={handleGoogleSearchToggle}
          onEditPersonality={openPersonalityEditor}
          onOpenToolsList={openToolsList}
          onOpenSystemStatus={openSystemStatus}
        />

        {/* Main Content Area */}
        <div className="relative flex-grow flex flex-col lg:pt-0 xl:pt-0">
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
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onToggleVideo={() => setIsVideoActive(!isVideoActive)}
              onToggleScreenShare={toggleScreenShare}
              onToggleMic={handleToggleMic}
              onCameraChange={changeCamera}
              onEditPersonality={openPersonalityEditor}
              onSelectPersonality={handlePersonalityChange}
              isFunctionCallingEnabled={isFunctionCallingEnabled}
              isGoogleSearchEnabled={isGoogleSearchEnabled}
              onToggleFunctionCalling={handleFunctionCallingToggle}
              onToggleGoogleSearch={handleGoogleSearchToggle}
              onOpenMobileActions={openMobileActions}
            />
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;
