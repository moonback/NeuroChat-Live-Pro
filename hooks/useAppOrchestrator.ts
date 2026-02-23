// hooks/useAppOrchestrator.ts
// Central orchestrator hook that aggregates all core app hooks.
import { useRef } from 'react';
import { useStatusManager } from './useStatusManager';
import { useGeminiLiveSession } from './useGeminiLiveSession';
import { useVisionManager } from './useVisionManager';
import { useConnectionLifecycle } from './useConnectionLifecycle';
import { useAudioManager } from './useAudioManager';
import { usePersonalityFiles } from './usePersonalityFiles';
import { useAppStore } from '../stores/appStore';
import { useUIStore } from '../stores/uiStore';

interface UseAppOrchestratorProps {
    documentsContext?: string;
}

export function useAppOrchestrator({ documentsContext }: UseAppOrchestratorProps = {}) {
    // UI store (modals, drawers)
    const ui = useUIStore();

    // Core Zustand store
    const appStore = useAppStore();

    // Shared session reference
    const sessionRef = useRef<any>(null);

    // Status manager (connection state, toasts, latency, talking flag)
    const status = useStatusManager();

    // Audio manager (activation & unlock handling)
    const audio = useAudioManager();

    // Vision manager
    const vision = useVisionManager({
        connectionState: appStore.connectionState,
        addToast: status.addToast,
        sessionRef,
    });

    // Gemini live session
    const gemini = useGeminiLiveSession({
        connectionState: appStore.connectionState,
        setConnectionState: appStore.setConnectionState,
        connectionStateRef: status.connectionStateRef,
        setIsTalking: status.setIsTalking,
        setLatency: status.setLatency,
        addToast: status.addToast,
        personality: appStore.currentPersonality,
        documentsContext,
        personalityFilesContext: usePersonalityFiles().systemContext,
        selectedVoice: appStore.selectedVoice,
        voiceRate: appStore.voiceRate,
        voicePitch: appStore.voicePitch,
        isFunctionCallingEnabled: appStore.isFunctionCallingEnabled,
        isGoogleSearchEnabled: appStore.isGoogleSearchEnabled,
        isVideoActive: appStore.isVideoActive,
        startFrameTransmission: vision.startFrameTransmission,
        resetVisionState: vision.resetVisionState,
        onToggleScreenShare: (enabled: boolean) => {
            appStore.setScreenShareRequested(enabled);
        },
        sessionRef,
        onPersonalityChange: (newPersonality) => {
            if (appStore.connectionState !== 'CONNECTED') return;
            if (appStore.currentPersonality.id === 'omnivision' && newPersonality.id !== 'omnivision') {
                appStore.setIsVideoActive(false);
            }
            appStore.setPersonality(newPersonality);
            if (newPersonality.id === 'omnivision') {
                appStore.setIsVideoActive(true);
            }
        },
    });

    // Connection lifecycle utilities
    const connectionLifecycle = useConnectionLifecycle({
        connect: gemini.connect,
        disconnect: gemini.disconnect,
    });

    return {
        ui,
        appStore,
        status,
        audio,
        vision,
        gemini,
        connectionLifecycle,
    };
}
