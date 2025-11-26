import { useCallback, useEffect, useRef, useState } from 'react';
import { ConnectionState } from '../types';
import { ToastMessage } from '../components/Toast';

interface UseStatusManagerResult {
  connectionState: ConnectionState;
  setConnectionState: React.Dispatch<React.SetStateAction<ConnectionState>>;
  connectionStateRef: React.MutableRefObject<ConnectionState>;
  isTalking: boolean;
  setIsTalking: React.Dispatch<React.SetStateAction<boolean>>;
  latency: number;
  setLatency: React.Dispatch<React.SetStateAction<number>>;
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], title: string, message: string) => void;
  removeToast: (id: string) => void;
}

export const useStatusManager = (): UseStatusManagerResult => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [isTalking, setIsTalking] = useState(false);
  const [latency, setLatency] = useState(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const connectionStateRef = useRef<ConnectionState>(ConnectionState.DISCONNECTED);

  useEffect(() => {
    connectionStateRef.current = connectionState;
  }, [connectionState]);

  const addToast = useCallback((type: ToastMessage['type'], title: string, message: string) => {
    setToasts(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        type,
        title,
        message,
      },
    ]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return {
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
  };
};


