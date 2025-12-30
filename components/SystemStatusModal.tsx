import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ConnectionState, Personality } from '../types';

interface SystemStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectionState: ConnectionState;
  currentPersonality: Personality;
  latency: number;
  isVideoActive: boolean;
  isScreenShareActive: boolean;
  isFunctionCallingEnabled: boolean;
  isGoogleSearchEnabled: boolean;
  isEyeTrackingEnabled: boolean;
  onToggleEyeTracking: (enabled: boolean) => void;
}

// --- Icons ---
const Icons = {
  Close: memo(() => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )),
  CheckCircle: memo(() => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )),
  Signal: memo(() => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.808-3.808-9.98 0-13.789m13.788 0c3.808 3.808 3.808 9.981 0 13.79" />
    </svg>
  )),
  Eye: memo(() => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ))
};

// --- Status Item Component ---
const StatusItem = memo(({ 
  label, 
  value, 
  isActive,
  activeColor = 'emerald',
  icon
}: { 
  label: string; 
  value: string; 
  isActive: boolean;
  activeColor?: 'emerald' | 'amber' | 'blue' | 'green' | 'purple' | 'indigo';
  icon?: React.ReactNode;
}) => {
  const colorClasses = {
    emerald: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    amber: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    blue: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    green: 'text-green-400 border-green-500/30 bg-green-500/10',
    purple: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
    indigo: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
  };

  return (
    <div className={`
      flex items-center justify-between px-5 py-4 rounded-xl border transition-all duration-300
      ${isActive ? colorClasses[activeColor] : 'border-white/10 bg-white/5'}
    `}>
      <span className="text-base text-slate-200 font-medium flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span className={`text-base font-bold ${isActive ? colorClasses[activeColor].split(' ')[0] : 'text-slate-500'}`}>
        {value}
      </span>
    </div>
  );
});

StatusItem.displayName = 'StatusItem';

// --- Toggle Item Component ---
const ToggleItem = memo(({ 
  label, 
  isEnabled, 
  onToggle,
  activeColor = 'purple',
  icon
}: { 
  label: string; 
  isEnabled: boolean; 
  onToggle: () => void;
  activeColor?: 'emerald' | 'amber' | 'blue' | 'green' | 'purple' | 'indigo';
  icon?: React.ReactNode;
}) => {
  const [isPressed, setIsPressed] = useState(false);
  
  const colorClasses = {
    emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    amber: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    blue: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
    green: 'border-green-500/30 bg-green-500/10 text-green-400',
    purple: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
    indigo: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400',
  };

  return (
    <button 
      onClick={onToggle}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={`
        flex items-center justify-between px-5 py-4 rounded-xl border 
        transition-all duration-300 cursor-pointer w-full 
        hover:bg-white/10 touch-manipulation
        ${isPressed ? 'scale-95' : 'active:scale-95'}
        ${isEnabled ? colorClasses[activeColor] : 'border-white/10 bg-white/5'}
      `}
      role="switch"
      aria-checked={isEnabled}
      aria-label={`${label}: ${isEnabled ? 'activé' : 'désactivé'}`}
    >
      <span className="text-base text-slate-200 font-medium flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span className={`text-base font-bold ${isEnabled ? colorClasses[activeColor].split(' ').pop() : 'text-slate-500'}`}>
        {isEnabled ? 'ON' : 'OFF'}
      </span>
    </button>
  );
});

ToggleItem.displayName = 'ToggleItem';

// --- Main Component ---
const SystemStatusModal: React.FC<SystemStatusModalProps> = ({
  isOpen,
  onClose,
  connectionState,
  currentPersonality,
  latency,
  isVideoActive,
  isScreenShareActive,
  isFunctionCallingEnabled,
  isGoogleSearchEnabled,
  isEyeTrackingEnabled,
  onToggleEyeTracking,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return;
      
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  const handleToggleEyeTracking = useCallback(() => {
    onToggleEyeTracking(!isEyeTrackingEnabled);
  }, [isEyeTrackingEnabled, onToggleEyeTracking]);

  if (!isOpen) return null;

  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isConnecting = connectionState === ConnectionState.CONNECTING;

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="status-modal-title"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Container */}
      <div 
        ref={modalRef}
        className="relative w-full max-w-2xl bg-[#08080a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 zoom-in-95 duration-500"
        style={{
          boxShadow: `0 0 100px -20px ${currentPersonality.themeColor}15, 0 0 40px -10px rgba(0,0,0,0.5)`
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div 
              className="p-3 rounded-xl border transition-all duration-300 hover:scale-105"
              style={{
                backgroundColor: `${currentPersonality.themeColor}20`,
                borderColor: `${currentPersonality.themeColor}30`
              }}
            >
              <div style={{ color: currentPersonality.themeColor }}>
                <Icons.CheckCircle />
              </div>
            </div>
            <h2 id="status-modal-title" className="text-2xl font-display font-bold text-white">
              État du Système
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-xl glass border border-white/10 hover:border-white/30 text-slate-300 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95"
            aria-label="Fermer"
          >
            <Icons.Close />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          
          {/* Connection Status */}
          <div className="flex items-center justify-between p-5 rounded-xl bg-white/5 transition-colors duration-300 hover:bg-white/[0.07]">
            <span className="text-base text-slate-200 font-semibold flex items-center gap-3">
              <Icons.Signal />
              Connexion
            </span>
            <div className="flex items-center gap-4">
              <span className="relative flex h-4 w-4">
                {(isConnected || isConnecting) && (
                  <span className={`
                    animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 
                    ${isConnected ? 'bg-emerald-400' : 'bg-amber-400'}
                  `} />
                )}
                <span className={`
                  relative inline-flex rounded-full h-4 w-4 
                  ${isConnected 
                    ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)]' 
                    : isConnecting 
                      ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)]' 
                      : 'bg-slate-600'
                  }
                `} />
              </span>
              <span className={`
                text-base font-bold 
                ${isConnected ? 'text-emerald-400' : isConnecting ? 'text-amber-400' : 'text-slate-500'}
              `}>
                {isConnected ? 'CONNECTÉ' : isConnecting ? 'SYNCHRONISATION...' : 'HORS LIGNE'}
              </span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Latency */}
            <div className="flex flex-col items-center justify-center p-5 rounded-xl bg-white/5 transition-all duration-300 hover:bg-white/[0.07] group">
              <span className="text-sm text-slate-400 uppercase tracking-wider mb-2 group-hover:text-slate-300 transition-colors">
                Latence
              </span>
              <span className={`
                text-2xl font-bold font-mono transition-colors duration-300
                ${!isConnected || latency === 0 
                  ? 'text-slate-500' 
                  : latency > 200 
                    ? 'text-amber-400' 
                    : 'text-emerald-400'
                }
              `}>
                {isConnected && latency > 0 ? `${latency}ms` : '-'}
              </span>
              {isConnected && latency > 0 && (
                <span className={`
                  text-[10px] mt-1 uppercase tracking-wider
                  ${latency > 200 ? 'text-amber-400/60' : 'text-emerald-400/60'}
                `}>
                  {latency > 200 ? 'Lent' : latency > 100 ? 'Moyen' : 'Rapide'}
                </span>
              )}
            </div>

            {/* Vision Status */}
            <div className="flex flex-col items-center justify-center p-5 rounded-xl bg-white/5 transition-all duration-300 hover:bg-white/[0.07] group">
              <span className="text-sm text-slate-400 uppercase tracking-wider mb-2 group-hover:text-slate-300 transition-colors">
                Vision
              </span>
              <span className={`
                text-xl font-bold transition-colors duration-300
                ${isScreenShareActive 
                  ? 'text-indigo-400' 
                  : isVideoActive 
                    ? 'text-indigo-400' 
                    : 'text-slate-500'
                }
              `}>
                {isScreenShareActive ? 'PARTAGE' : isVideoActive ? 'CAMÉRA' : 'INACTIF'}
              </span>
              {(isVideoActive || isScreenShareActive) && (
                <span className="text-[10px] mt-1 uppercase tracking-wider text-indigo-400/60">
                  En cours
                </span>
              )}
            </div>
          </div>

          {/* Features Status */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
              Fonctionnalités
            </h3>
            
            <StatusItem
              label="Appel de Fonctions"
              value={isFunctionCallingEnabled ? 'ON' : 'OFF'}
              isActive={isFunctionCallingEnabled}
              activeColor="blue"
            />
            
            <StatusItem
              label="Recherche Google"
              value={isGoogleSearchEnabled ? 'ON' : 'OFF'}
              isActive={isGoogleSearchEnabled}
              activeColor="green"
            />
            
            <ToggleItem
              label="Suivi des Yeux"
              isEnabled={isEyeTrackingEnabled}
              onToggle={handleToggleEyeTracking}
              activeColor="purple"
              icon={<Icons.Eye />}
            />
          </div>

          {/* Personality Info */}
          <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ 
                  backgroundColor: currentPersonality.themeColor,
                  boxShadow: `0 0 12px ${currentPersonality.themeColor}`
                }}
              />
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Personnalité Active</p>
                <p className="text-sm font-semibold text-white">{currentPersonality.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
};

export default memo(SystemStatusModal);

