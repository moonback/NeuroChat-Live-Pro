import React, { useEffect, useState, useRef, useCallback } from 'react';
import Visualizer from './components/Visualizer';
import Avatar3D from './components/Avatar3D';
import ControlPanel from './components/ControlPanel';
import Header from './components/Header';


import SystemStatusModal from './components/SystemStatusModal';
import MobileActionsDrawer from './components/MobileActionsDrawer';
import ConclusionsModal from './components/ConclusionsModal';
import HistoryModal from './components/HistoryModal';
import { ActionLogViewer } from './components/ActionLogViewer';
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
import { usePersonalityFiles } from './hooks/usePersonalityFiles';
import { useConnectionLifecycle } from './hooks/useConnectionLifecycle';
import VideoOverlay from './components/VideoOverlay';
import BackgroundLayers from './components/BackgroundLayers';
import ScreenShareOverlay from './components/ScreenShareOverlay';
import { useAppStore } from './stores/appStore';
import { useUIStore } from './stores/uiStore';
import {
  showFunctionCallingToggle,
  showGoogleSearchToggle,
  showDocumentsUpdated,
  showDocumentsLoaded,
} from './utils/toastHelpers';
import { initializeCorePlugins } from './utils/tools/index';

// Initialisation globale du SDK des plugins
initializeCorePlugins();

/**
 * Main App Component
 * Orchestrates the UI, Gemini Session, Vision, and Audio.
 */
const App: React.FC = () => {
  // UI Store for transient states (modals, drawers)
  const ui = useUIStore();

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

  const { activateAudioContext } = useAudioManager();

  // Store Zustand - Main application state
  const {
    connectionState: storeConnectionState,
    currentPersonality,
    uploadedDocuments,
    isFunctionCallingEnabled,
    isGoogleSearchEnabled,
    isEyeTrackingEnabled,
    isAvatar3DEnabled,
    setConnectionState: setStoreConnectionState,
    setPersonality,
    setUploadedDocuments,
    setIsFunctionCallingEnabled,
    setIsGoogleSearchEnabled,
    setIsEyeTrackingEnabled,
    setIsAvatar3DEnabled,
    selectedVoice,
    setSelectedVoice,
    voiceRate,
    voicePitch,
    themePreference,
    compactMode,
  } = useAppStore();

  // Sync useStatusManager with store state
  useEffect(() => {
    if (connectionState !== storeConnectionState) {
      setConnectionState(storeConnectionState);
    }
  }, [storeConnectionState, connectionState, setConnectionState]);

  // Voice State (Now in Store)
  // const [selectedVoice, setSelectedVoice] = useState<string>(DEFAULT_PERSONALITY.voiceName);

  // Documents Context Processing
  const [documentsContext, setDocumentsContext] = useState<string | undefined>(undefined);
  const { systemContext: personalityFilesContext } = usePersonalityFiles();

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

  // Shared Session reference
  const sessionRef = useRef<any>(null);

  // Vision Management logic
  const {
    isVideoActive,
    setIsVideoActive,
    isScreenShareActive,
    toggleScreenShare,
    availableCameras,
    selectedCameraId,
    changeCamera,
    startScreenShare,
    stopScreenShare,
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

  // Gemini Live Session Management
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
    personalityFilesContext,
    selectedVoice,
    voiceRate,
    voicePitch,
    isFunctionCallingEnabled,
    isGoogleSearchEnabled,
    isVideoActive,
    startFrameTransmission,
    resetVisionState,
    onToggleScreenShare: (enabled) => enabled ? startScreenShare() : stopScreenShare(),
    sessionRef,
    onPersonalityChange: (newPersonality) => {
      withAutoReconnect(() => {
        if (currentPersonality.id === 'omnivision' && newPersonality.id !== 'omnivision') {
          setIsVideoActive(false);
        }
        setPersonality(newPersonality);
        if (newPersonality.id === 'omnivision') {
          setIsVideoActive(true);
        }
      });
    },
  });

  // Reconnection Orchestrator for setting changes
  const { withAutoReconnect } = useConnectionLifecycle({ connect, disconnect });

  // Microphone state monitoring
  const [isMicMuted, setIsMicMuted] = useState(false);
  useEffect(() => {
    if (storeConnectionState === ConnectionState.CONNECTED) {
      setIsMicMuted(getMicMutedState());
    } else {
      setIsMicMuted(false);
    }
  }, [storeConnectionState, getMicMutedState]);

  const handleToggleMic = useCallback(() => {
    setIsMicMuted(toggleMic());
  }, [toggleMic]);

  // Unified Event Handlers with Auto-Reconnect Logic
  const handlePersonalityChange = useCallback((newPersonality: Personality) => {
    withAutoReconnect(() => {
      if (currentPersonality.id === 'omnivision' && newPersonality.id !== 'omnivision') {
        setIsVideoActive(false);
      }
      setPersonality(newPersonality);
      if (newPersonality.id === 'omnivision') {
        setIsVideoActive(true);
      }
    });
  }, [currentPersonality.id, setPersonality, setIsVideoActive, withAutoReconnect]);

  const handleFunctionCallingToggle = useCallback((enabled: boolean) => {
    withAutoReconnect(() => {
      setIsFunctionCallingEnabled(enabled);
      showFunctionCallingToggle(addToast, enabled);
    });
  }, [setIsFunctionCallingEnabled, addToast, withAutoReconnect]);

  const handleGoogleSearchToggle = useCallback((enabled: boolean) => {
    withAutoReconnect(() => {
      setIsGoogleSearchEnabled(enabled);
      showGoogleSearchToggle(addToast, enabled);
    });
  }, [setIsGoogleSearchEnabled, addToast, withAutoReconnect]);

  const handleDocumentsChange = useCallback((documents: ProcessedDocument[]) => {
    withAutoReconnect(() => {
      setUploadedDocuments(documents);
      if (storeConnectionState === ConnectionState.CONNECTED) {
        showDocumentsUpdated(addToast);
      } else {
        showDocumentsLoaded(addToast, documents.length);
      }
    });
  }, [setUploadedDocuments, storeConnectionState, addToast, withAutoReconnect]);

  // Main Action Handlers
  const handleConnect = useCallback(() => {
    setIsIntentionalDisconnect(false);
    activateAudioContext();
    connect();
  }, [setIsIntentionalDisconnect, activateAudioContext, connect]);

  const handleDisconnect = useCallback(() => {
    setIsIntentionalDisconnect(true);
    disconnect(true);
  }, [setIsIntentionalDisconnect, disconnect]);

  // Global interactions (Audio Activation)
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

  // Final Cleanup
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const isConnected = storeConnectionState === ConnectionState.CONNECTED;

  const themeClasses = themePreference === 'midnight'
    ? 'bg-[#050510] text-[#E0E0E0]'
    : themePreference === 'zinc'
      ? 'bg-zinc-950 text-zinc-200'
      : themePreference === 'cyberpunk'
        ? 'bg-[#0a0a0f] text-[#00ffcc]'
        : themePreference === 'forest'
          ? 'bg-[#0a1a0a] text-[#a0d0a0]'
          : 'bg-slate-950 text-slate-200'; // default slate

  return (
    <div className={`relative w-full h-screen overflow-hidden font-body selection:bg-indigo-500/30 safe-area-inset theme-${themePreference} ${themeClasses}`}>

      {/* Visual Background Layers */}
      <BackgroundLayers
        themeColor={currentPersonality.themeColor}
        isTalking={isTalking}
        isConnected={isConnected}
      />

      {/* Screen Sharing Indicator */}
      <ScreenShareOverlay isActive={isScreenShareActive} />

      {/* Real-time 3D Avatar or 2D Visualizer */}
      {isAvatar3DEnabled ? (
        <Avatar3D
          analyserRef={analyserRef}
          color={currentPersonality.themeColor}
          isActive={isTalking || isConnected}
        />
      ) : (
        <Visualizer
          analyserRef={analyserRef}
          color={currentPersonality.themeColor}
          isActive={isTalking || isConnected}
          isEyeTrackingEnabled={isEyeTrackingEnabled}
        />
      )}

      {/* Toast Management System */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <InstallPWA />

      {/* Overlays & Modals */}


      <ToolsList
        isOpen={ui.isToolsListOpen}
        onClose={() => ui.setToolsListOpen(false)}
      />

      <SystemStatusModal
        isOpen={ui.isSystemStatusModalOpen}
        onClose={() => ui.setSystemStatusModalOpen(false)}
        connectionState={storeConnectionState}
        currentPersonality={currentPersonality}
        latency={latency}
        isVideoActive={isVideoActive}
        isScreenShareActive={isScreenShareActive}
        isFunctionCallingEnabled={isFunctionCallingEnabled}
        isGoogleSearchEnabled={isGoogleSearchEnabled}
        isEyeTrackingEnabled={isEyeTrackingEnabled}
        onToggleEyeTracking={setIsEyeTrackingEnabled}
        isAvatar3DEnabled={isAvatar3DEnabled}
        onToggleAvatar3D={setIsAvatar3DEnabled}
        onToggleFunctionCalling={handleFunctionCallingToggle}
        onToggleGoogleSearch={handleGoogleSearchToggle}
        selectedVoice={selectedVoice}
        onVoiceChange={setSelectedVoice}
      />

      <ConclusionsModal
        isOpen={ui.isConclusionsModalOpen}
        onClose={() => ui.setConclusionsModalOpen(false)}
        currentPersonality={currentPersonality}
      />

      <HistoryModal
        isOpen={ui.isHistoryModalOpen}
        onClose={() => ui.setHistoryModalOpen(false)}
      />

      <ActionLogViewer />

      <MobileActionsDrawer
        isOpen={ui.isMobileActionsDrawerOpen && !isConnected}
        onClose={() => ui.setMobileActionsDrawerOpen(false)}
        currentPersonality={currentPersonality}
        isFunctionCallingEnabled={isFunctionCallingEnabled}
        isGoogleSearchEnabled={isGoogleSearchEnabled}
        isEyeTrackingEnabled={isEyeTrackingEnabled}
        onToggleFunctionCalling={handleFunctionCallingToggle}
        onToggleGoogleSearch={handleGoogleSearchToggle}
        onToggleEyeTracking={setIsEyeTrackingEnabled}
        isAvatar3DEnabled={isAvatar3DEnabled}
        onToggleAvatar3D={setIsAvatar3DEnabled}
        onOpenToolsList={() => ui.setToolsListOpen(true)}
        onOpenHistory={() => ui.setHistoryModalOpen(true)}
      />

      {/* Dynamic Video Layers */}
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

      {/* Main UI Layout */}
      <div className="relative z-10 w-full h-full flex flex-col lg:flex-row">
        <Header
          connectionState={storeConnectionState}
          currentPersonality={currentPersonality}
          uploadedDocuments={uploadedDocuments}
          onDocumentsChange={handleDocumentsChange}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}


          onOpenToolsList={() => ui.setToolsListOpen(true)}
          onOpenSystemStatus={() => ui.setSystemStatusModalOpen(true)}
          onOpenConclusions={() => ui.setConclusionsModalOpen(true)}
          onOpenHistory={() => ui.setHistoryModalOpen(true)}
        />

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
              isFunctionCallingEnabled={isFunctionCallingEnabled}
              isGoogleSearchEnabled={isGoogleSearchEnabled}
              onToggleFunctionCalling={handleFunctionCallingToggle}
              onToggleGoogleSearch={handleGoogleSearchToggle}
              onOpenMobileActions={() => ui.setMobileActionsDrawerOpen(true)}
            />
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;
