import { useState, useCallback, useRef, useEffect } from 'react';

type ReconnectionState =
  | { type: 'idle' }
  | { type: 'reconnecting'; attempt: number }
  | { type: 'failed'; reason: string };

interface UseReconnectionOptions {
  maxAttempts?: number;
  onReconnect?: (attempt: number) => void;
  onMaxAttemptsReached?: () => void;
}

interface UseReconnectionResult {
  state: ReconnectionState;
  scheduleReconnect: () => void;
  reset: () => void;
  isReconnecting: boolean;
  isIntentionalDisconnect: boolean;
  setIsIntentionalDisconnect: (value: boolean) => void;
}

/**
 * Hook pour gérer la logique de reconnexion avec backoff exponentiel
 */
export const useReconnection = (
  options: UseReconnectionOptions = {}
): UseReconnectionResult => {
  const { maxAttempts = 5, onReconnect, onMaxAttemptsReached } = options;
  
  const [state, setState] = useState<ReconnectionState>({ type: 'idle' });
  const isIntentionalDisconnectRef = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const attemptCountRef = useRef<number>(0);

  const scheduleReconnect = useCallback(() => {
    if (isIntentionalDisconnectRef.current) {
      console.log('[useReconnection] Déconnexion intentionnelle, pas de reconnexion');
      return;
    }

    if (attemptCountRef.current >= maxAttempts) {
      setState({ type: 'failed', reason: 'Max attempts reached' });
      onMaxAttemptsReached?.();
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, attemptCountRef.current), 10000);
    console.log(
      `[useReconnection] Reconnexion dans ${delay}ms... (Tentative ${attemptCountRef.current + 1}/${maxAttempts})`
    );

    // Nettoyer le timeout précédent s'il existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    attemptCountRef.current += 1;
    setState({ type: 'reconnecting', attempt: attemptCountRef.current });

    timeoutRef.current = setTimeout(() => {
      if (!isIntentionalDisconnectRef.current) {
        onReconnect?.(attemptCountRef.current);
      } else {
        console.log('[useReconnection] Reconnexion annulée (déconnexion intentionnelle)');
        setState({ type: 'idle' });
        attemptCountRef.current = 0;
      }
    }, delay);
  }, [maxAttempts, onReconnect, onMaxAttemptsReached]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setState({ type: 'idle' });
    isIntentionalDisconnectRef.current = false;
    attemptCountRef.current = 0;
  }, []);

  const setIsIntentionalDisconnect = useCallback((value: boolean) => {
    isIntentionalDisconnectRef.current = value;
    if (value) {
      // Si on marque comme déconnexion intentionnelle, annuler la reconnexion
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setState({ type: 'idle' });
      attemptCountRef.current = 0;
    }
  }, []);

  // Cleanup au démontage
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    state,
    scheduleReconnect,
    reset,
    isReconnecting: state.type === 'reconnecting',
    isIntentionalDisconnect: isIntentionalDisconnectRef.current,
    setIsIntentionalDisconnect,
  };
};

