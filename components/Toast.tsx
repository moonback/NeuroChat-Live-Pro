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
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return (
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        relative flex items-start gap-1.5 sm:gap-2 p-2.5 sm:p-3 mb-1.5 sm:mb-2 rounded-lg sm:rounded-xl glass-intense border backdrop-blur-xl shadow-lg transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98] touch-manipulation sm:max-w-[400px]
        ${getStyles()}
        ${isExiting ? 'opacity-0 translate-x-full scale-95' : 'opacity-100 translate-x-0 scale-100'}
      `}
      style={{ minWidth: '260px', maxWidth: 'calc(100vw - 2rem)' }}
      onClick={handleClose}
      role="alert"
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClose();
        }
      }}
    >
      <div className="flex-shrink-0 mt-0.5">
        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4">
          {getIcon()}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-display text-[10px] sm:text-xs font-bold text-white mb-0.5">{toast.title}</h3>
        <p className="font-body text-[9px] sm:text-[10px] text-slate-300 leading-relaxed break-words">{toast.message}</p>
      </div>
      <button 
        onClick={handleClose}
        className="flex-shrink-0 text-slate-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 rounded p-1 touch-manipulation min-w-[32px] min-h-[32px] flex items-center justify-center"
        aria-label="Fermer la notification"
        tabIndex={0}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    <div className="fixed top-20 right-3 z-[100] flex flex-col items-end pointer-events-none">
      <div className="pointer-events-auto">
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </div>
  );
};

