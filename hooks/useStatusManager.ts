import { useCallback, useState } from 'react';
import { ConnectionState } from '../types';
import { ToastMessage } from '../components/Toast';

interface UseStatusManagerResult {
  connectionState: ConnectionState;
  setConnectionState: (state: ConnectionState) => void;
  isTalking: boolean;
  setIsTalking: (v: boolean) => void;
  latency: number;
  setLatency: (v: number) => void;
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], title: string, message: string) => void;
  removeToast: (id: string) => void;
}

export const useStatusManager = (): UseStatusManagerResult => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [isTalking, setIsTalking] = useState(false);
  const [latency, setLatency] = useState(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Dedup by title+message — prevents spam on repeated errors (e.g. 5x reconnect failures)
  const addToast = useCallback((type: ToastMessage['type'], title: string, message: string) => {
    setToasts(prev => {
      const isDuplicate = prev.some(t => t.title === title && t.message === message);
      if (isDuplicate) return prev;
      return [
        ...prev,
        { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, type, title, message },
      ];
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return {
    connectionState,
    setConnectionState,
    isTalking,
    setIsTalking,
    latency,
    setLatency,
    toasts,
    addToast,
    removeToast,
  };
};
