import { useCallback, useRef } from 'react';
import { ConnectionState } from '../types';
import { useAppStore } from '../stores/appStore';

interface UseConnectionLifecycleProps {
    connect: () => Promise<void>;
    disconnect: (shouldReload?: boolean) => void;
}

/**
 * Hook to manage connection lifecycle and automatic reconnections when settings change
 */
export const useConnectionLifecycle = ({ connect, disconnect }: UseConnectionLifecycleProps) => {
    const { connectionState } = useAppStore();
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const isConnected = connectionState === ConnectionState.CONNECTED;

    /**
     * Helper to perform an action and reconnect if currently connected
     */
    const withAutoReconnect = useCallback(async (action: () => void, delay: number = 500) => {
        // 1. Perform the action (e.g., update store)
        action();

        // 2. If connected, trigger a restart of the session
        if (isConnected) {
            console.log('[ConnectionLifecycle] Session change detected, restarting session...');

            // Clear any pending reconnect
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }

            // Disconnect current session
            disconnect(false);

            // Reconnect after a small delay to ensure resources are cleaned up
            reconnectTimeoutRef.current = setTimeout(() => {
                console.log('[ConnectionLifecycle] Reconnecting...');
                connect();
                reconnectTimeoutRef.current = null;
            }, delay);
        }
    }, [isConnected, connect, disconnect]);

    // Clean up on unmount
    const cleanup = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
    }, []);

    return {
        withAutoReconnect,
        cleanup
    };
};
