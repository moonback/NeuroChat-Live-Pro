// App.tsx – Refactored with unified orchestrator and clean architecture
import React, { useEffect, useRef, useCallback, useState } from 'react';
import Visualizer from './components/Visualizer';
import Avatar3D from './components/Avatar3D';
import ControlPanel from './components/ControlPanel';
import Header from './components/Header';
import SystemStatusModal from './components/SystemStatusModal';
import MobileActionsDrawer from './components/MobileActionsDrawer';
import ConclusionsModal from './components/ConclusionsModal';
import HistoryModal from './components/HistoryModal';
import { Whiteboard } from './components/Whiteboard';
import { ActionLogViewer } from './components/ActionLogViewer';
import { ToastContainer } from './components/Toast';
import { ConnectionState } from './types';
import { DEFAULT_PERSONALITY } from './constants';
import type { ProcessedDocument } from './utils/documentProcessor';
import InstallPWA from './components/InstallPWA';
import ToolsList from './components/ToolsList';
import { useAppOrchestrator } from './hooks/useAppOrchestrator';
import { usePersonalityFiles } from './hooks/usePersonalityFiles';
import VideoOverlay from './components/VideoOverlay';
import BackgroundLayers from './components/BackgroundLayers';
import ScreenShareOverlay from './components/ScreenShareOverlay';
import { useAppStore } from './stores/appStore';
import { useUIStore } from './stores/uiStore';
import { showFunctionCallingToggle, showGoogleSearchToggle, showDocumentsUpdated, showDocumentsLoaded } from './utils/toastHelpers';
import { initializeCorePlugins } from './utils/tools/index';

// Initialize core plugins once
initializeCorePlugins();

/**
 * Main application component – thin wrapper that delegates all heavy logic to the
 * `useAppOrchestrator` hook. This dramatically reduces cognitive load and
 * eliminates the double source‑of‑truth problem.
 */
const App: React.FC = () => {
  // UI transient state (modals, drawers)
  const ui = useUIStore();

  // Global Zustand store – Single Source of Truth
  const {
    connectionState,
    currentPersonality,
    uploadedDocuments,
    setUploadedDocuments,
    isFunctionCallingEnabled,
    setIsFunctionCallingEnabled,
    isGoogleSearchEnabled,
    setIsGoogleSearchEnabled,
    isEyeTrackingEnabled,
    setIsEyeTrackingEnabled,
    isAvatar3DEnabled,
    setIsAvatar3DEnabled,
    selectedVoice,
    setSelectedVoice,
    voiceRate,
    voicePitch,
    themePreference,
    compactMode,
    isWhiteboardOpen,
    setWhiteboardOpen,
    setScreenShareRequested,
  } = useAppStore();

  // 1. Documents context processing
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

  // 2. Unified orchestrator aggregates status, audio, vision, Gemini and connection lifecycle
  const { status, audio, vision, gemini, connectionLifecycle } = useAppOrchestrator({
    documentsContext
  });

  // Destructure orchestrator components for readability
  const {
    isTalking,
    latency,
    toasts,
    addToast,
    removeToast,
  } = status;

  const { activateAudioContext } = audio;

  const {
    isVideoActive,
    setIsVideoActive,
    isScreenShareActive,
    availableCameras,
    selectedCameraId,
    videoRef,
    canvasRef,
    videoStreamRef,
    screenStreamRef,
    isVideoEnlarged,
    setIsVideoEnlarged,
  } = vision;

  const {
    connect,
    disconnect,
    analyserRef,
    inputAnalyserRef,
    setIsIntentionalDisconnect,
    toggleMic,
    getMicMutedState,
  } = gemini;

  const { withAutoReconnect } = connectionLifecycle;

  // Microphone mute monitoring – reactive to state changes
  const [isMicMuted, setIsMicMuted] = useState(false);
  useEffect(() => {
    if (connectionState === ConnectionState.CONNECTED) {
      setIsMicMuted(getMicMutedState());
    } else {
      setIsMicMuted(false);
    }
  }, [connectionState, getMicMutedState]);

  // Action handlers
  const handleConnect = useCallback(() => {
    setIsIntentionalDisconnect(false);
    activateAudioContext(); // unlock once on user interaction
    connect();
  }, [setIsIntentionalDisconnect, activateAudioContext, connect]);

  const handleDisconnect = useCallback(() => {
    setIsIntentionalDisconnect(true);
    disconnect(true);
  }, [setIsIntentionalDisconnect, disconnect]);

  const handleToggleMic = useCallback(() => {
    setIsMicMuted(toggleMic());
  }, [toggleMic]);

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
      if (connectionState === ConnectionState.CONNECTED) {
        showDocumentsUpdated(addToast);
      } else {
        showDocumentsLoaded(addToast, documents.length);
      }
    });
  }, [setUploadedDocuments, connectionState, addToast, withAutoReconnect]);

  const handleScreenShareToggle = useCallback(() => {
    setScreenShareRequested(!isScreenShareActive);
  }, [setScreenShareRequested, isScreenShareActive]);

  // Global audio unlock effect
  useEffect(() => {
    const unlockOnce = () => {
      activateAudioContext();
      document.removeEventListener('click', unlockOnce);
      document.removeEventListener('touchstart', unlockOnce);
    };
    document.addEventListener('click', unlockOnce, { once: true });
    document.addEventListener('touchstart', unlockOnce, { once: true });
    return () => {
      document.removeEventListener('click', unlockOnce);
      document.removeEventListener('touchstart', unlockOnce);
    };
  }, [activateAudioContext]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const isConnected = connectionState === ConnectionState.CONNECTED;

  // Theme classes – unchanged
  const themeClasses = 'bg-slate-950 text-slate-200'; // simplified for brevity

  return (
    <div className={`relative w-full h-screen overflow-hidden font-body selection:bg-indigo-500/30 safe-area-inset theme-${themePreference} ${themeClasses}`}>
      {/* UI Layout */}
      <Header
        onDocumentsChange={handleDocumentsChange}
        onOpenSystemStatus={() => ui.setSystemStatusModalOpen(true)}
        onOpenConclusions={() => ui.setConclusionsModalOpen(true)}
        onOpenHistory={() => ui.setHistoryModalOpen(true)}
        onToggleWhiteboard={() => setWhiteboardOpen(!isWhiteboardOpen)}
      />
      <div className="relative flex-grow flex flex-col lg:flex-row">
        <div className="relative flex-grow flex flex-col lg:pt-0 xl:pt-0">
          <main className={`flex-grow flex flex-col ${connectionState === ConnectionState.CONNECTED ? 'justify-end' : 'justify-start'} pb-0 sm:pb-2 md:pb-4 lg:pb-6 xl:pb-8 safe-area-bottom lg:px-8 xl:px-12`}>
            <ControlPanel
              connectionState={connectionState}
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
              onToggleScreenShare={handleScreenShareToggle}
              isFunctionCallingEnabled={isFunctionCallingEnabled}
              isGoogleSearchEnabled={isGoogleSearchEnabled}
              onToggleFunctionCalling={handleFunctionCallingToggle}
              onToggleGoogleSearch={handleGoogleSearchToggle}
              onOpenMobileActions={() => ui.setMobileActionsDrawerOpen(true)}
            />
          </main>
        </div>
      </div>

      {/* Visualizer / Avatar */}
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

      {/* Toasts */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <InstallPWA />

      {/* Modals and Overlays */}
      <ToolsList isOpen={ui.isToolsListOpen} onClose={() => ui.setToolsListOpen(false)} />
      <SystemStatusModal
        isOpen={ui.isSystemStatusModalOpen}
        onClose={() => ui.setSystemStatusModalOpen(false)}
        latency={latency}
        isVideoActive={isVideoActive}
        isScreenShareActive={isScreenShareActive}
        onToggleFunctionCalling={handleFunctionCallingToggle}
        onToggleGoogleSearch={handleGoogleSearchToggle}
      />
      <ConclusionsModal isOpen={ui.isConclusionsModalOpen} onClose={() => ui.setConclusionsModalOpen(false)} currentPersonality={currentPersonality} />
      <HistoryModal isOpen={ui.isHistoryModalOpen} onClose={() => ui.setHistoryModalOpen(false)} />
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
    </div>
  );
};

export default App;
