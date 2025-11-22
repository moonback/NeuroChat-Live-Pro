import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(toast.id);
    }, 300);
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getStyles = () => {
    switch (toast.type) {
      case 'success': return 'border-emerald-500/20 bg-emerald-500/10 shadow-emerald-500/10';
      case 'error': return 'border-red-500/20 bg-red-500/10 shadow-red-500/10';
      case 'warning': return 'border-amber-500/20 bg-amber-500/10 shadow-amber-500/10';
      default: return 'border-indigo-500/20 bg-indigo-500/10 shadow-indigo-500/10';
    }
  };

  return (
    <div 
      className={`
        relative flex items-start gap-3 p-4 mb-3 rounded-xl glass-intense border backdrop-blur-xl shadow-lg transition-all duration-300
        ${getStyles()}
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
      style={{ minWidth: '300px', maxWidth: '400px' }}
    >
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>
      <div className="flex-1">
        <h3 className="font-display text-sm font-bold text-white mb-0.5">{toast.title}</h3>
        <p className="font-body text-xs text-slate-300 leading-relaxed">{toast.message}</p>
      </div>
      <button 
        onClick={handleClose}
        className="flex-shrink-0 text-slate-400 hover:text-white transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 h-0.5 bg-white/20 rounded-b-xl overflow-hidden w-full">
        <div 
            className="h-full bg-white/50 origin-left"
            style={{ 
                animation: `shrink ${toast.duration || 5000}ms linear forwards` 
            }}
        ></div>
      </div>
      
      <style>{`
        @keyframes shrink {
            from { transform: scaleX(1); }
            to { transform: scaleX(0); }
        }
      `}</style>
    </div>
  );
};

export const ToastContainer: React.FC<{ toasts: ToastMessage[], removeToast: (id: string) => void }> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-24 right-4 z-[100] flex flex-col items-end pointer-events-none">
      <div className="pointer-events-auto">
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </div>
  );
};

