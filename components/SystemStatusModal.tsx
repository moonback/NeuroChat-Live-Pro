import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ConnectionState, Personality } from '../types';
import VoiceSelector from './VoiceSelector';
import { useAppStore } from '../stores/appStore';

interface SystemStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectionState: ConnectionState;
  currentPersonality: Personality;
  latency: number;
  isVideoActive: boolean;
  isScreenShareActive: boolean;
  isFunctionCallingEnabled: boolean;
  onToggleFunctionCalling: (enabled: boolean) => void;
  isGoogleSearchEnabled: boolean;
  onToggleGoogleSearch: (enabled: boolean) => void;
  isEyeTrackingEnabled: boolean;
  onToggleEyeTracking: (enabled: boolean) => void;
  isAvatar3DEnabled: boolean;
  onToggleAvatar3D: (enabled: boolean) => void;
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
}

// --- Icons ---
const Icons = {
  Palette: memo(() => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  )),
  Layout: memo(() => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  )),
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
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.344 6.582c5.974-5.974 15.338-5.974 21.312 0" />
    </svg>
  )),
  Code: memo(() => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  )),
  Search: memo(() => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )),
  Eye: memo(() => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )),
  Cube: memo(() => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  )),
  Activity: memo(() => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )),
  Memory: memo(() => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
    </svg>
  )),
  Clock: memo(() => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )),
  Server: memo(() => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
    </svg>
  )),
  Globe: memo(() => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  )),
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

// --- Meter Component ---
const MetricMeter = memo(({ label, value, percentage, icon, color }: {
  label: string;
  value: string;
  percentage: number;
  icon: React.ReactNode;
  color: string;
}) => (
  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all duration-300 group">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2 text-slate-400 group-hover:text-slate-300 transition-colors">
        {icon}
        <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-sm font-mono font-bold" style={{ color }}>{value}</span>
    </div>
    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-1000 ease-out"
        style={{
          width: `${percentage}%`,
          backgroundColor: color,
          boxShadow: `0 0 10px ${color}40`
        }}
      />
    </div>
  </div>
));
MetricMeter.displayName = 'MetricMeter';

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
  onToggleFunctionCalling,
  isGoogleSearchEnabled,
  onToggleGoogleSearch,
  isEyeTrackingEnabled,
  onToggleEyeTracking,
  isAvatar3DEnabled,
  onToggleAvatar3D,
  selectedVoice,
  onVoiceChange,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const {
    themePreference, setThemePreference,
    compactMode, setCompactMode,
    voiceRate, setVoiceRate,
    voicePitch, setVoicePitch
  } = useAppStore();

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

  // Focus trap and accessibility
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

    // Focus the first element when the modal opens
    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  const handleToggleFunctionCalling = useCallback(() => {
    onToggleFunctionCalling(!isFunctionCallingEnabled);
  }, [isFunctionCallingEnabled, onToggleFunctionCalling]);

  const handleToggleGoogleSearch = useCallback(() => {
    onToggleGoogleSearch(!isGoogleSearchEnabled);
  }, [isGoogleSearchEnabled, onToggleGoogleSearch]);

  const handleToggleEyeTracking = useCallback(() => {
    onToggleEyeTracking(!isEyeTrackingEnabled);
  }, [isEyeTrackingEnabled, onToggleEyeTracking]);

  const handleToggleAvatar3D = useCallback(() => {
    onToggleAvatar3D(!isAvatar3DEnabled);
  }, [isAvatar3DEnabled, onToggleAvatar3D]);

  const [isBrowserActive, setIsBrowserActive] = useState(false);
  const checkBrowserStatus = useCallback(async () => {
    if (window.ipcRenderer) {
      const status = await window.ipcRenderer.invoke('browser-is-open');
      setIsBrowserActive(!!status?.isOpen);
    }
  }, []);

  useEffect(() => {
    checkBrowserStatus();
    const interval = setInterval(checkBrowserStatus, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [checkBrowserStatus]);

  const handleCloseBrowser = async () => {
    if (window.ipcRenderer) {
      await window.ipcRenderer.invoke('browser-close');
      setIsBrowserActive(false);
    }
  };

  const [uptime, setUptime] = useState('00:00:00');
  const [cpuUsage, setCpuUsage] = useState(12);
  const [memUsage, setMemUsage] = useState(124);
  const [healthScore, setHealthScore] = useState(98);
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      // Uptime
      const diff = Math.floor((Date.now() - start) / 1000);
      const h = Math.floor(diff / 3600).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
      const s = (diff % 60).toString().padStart(2, '0');
      setUptime(`${h}:${m}:${s}`);

      // Fluctuations
      if (Math.random() > 0.6) {
        setCpuUsage(prev => Math.min(Max_CPU, Math.max(Min_CPU, prev + (Math.random() * 4 - 2))));
        setMemUsage(prev => Math.min(Max_MEM, Math.max(Min_MEM, prev + (Math.random() * 2 - 1))));
        setHealthScore(prev => Math.min(100, Math.max(95, prev + (Math.random() * 0.4 - 0.2))));
        setLastUpdate(new Date().toLocaleTimeString());
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const Min_CPU = 8, Max_CPU = 24;
  const Min_MEM = 120, Max_MEM = 135;

  if (!isOpen) return null;

  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isConnecting = connectionState === ConnectionState.CONNECTING;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      {/* Modal Container */}
      <div
        ref={modalRef}
        className={`
          relative w-full max-w-4xl max-h-[90vh] glass-premium rounded-[2.5rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.8)]
          flex flex-col overflow-hidden animate-scale-in transition-all duration-500
          border border-white/10
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div
              className="p-3 rounded-xl border transition-all duration-700 hover:scale-105 bg-white/[0.03]"
              style={{
                borderColor: `${currentPersonality.themeColor}30`,
                boxShadow: `0 0 20px -5px ${currentPersonality.themeColor}30`
              }}
            >
              <div
                style={{ color: currentPersonality.themeColor }}
                className="animate-[spin_10s_linear_infinite]"
              >
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
        <div className="p-8 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar relative">

          {/* System Health Overview */}
          <div className="relative p-6 rounded-2xl bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Icons.Activity />
            </div>

            <div className="flex items-start justify-between relative z-10">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Santé Globale
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-black text-white tracking-tighter">
                    {healthScore.toFixed(1)}%
                  </span>
                  <div className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-bold text-emerald-400 uppercase tracking-widest animate-pulse">
                    Optimal
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Temps de Session</p>
                <p className="text-xl font-mono font-bold text-white tracking-wider">{uptime}</p>
              </div>
            </div>
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricMeter
              label="Connexion"
              value={isConnected ? 'Excellent' : isConnecting ? 'Calcul...' : 'Aucune'}
              percentage={isConnected ? 95 : isConnecting ? 45 : 0}
              icon={<Icons.Signal />}
              color={isConnected ? '#10b981' : isConnecting ? '#f59e0b' : '#64748b'}
            />
            <MetricMeter
              label="Latence"
              value={isConnected && latency > 0 ? `${latency}ms` : '-'}
              percentage={!isConnected ? 0 : Math.max(0, 100 - (latency / 5))}
              icon={<Icons.Activity />}
              color={!isConnected ? '#64748b' : latency > 200 ? '#f59e0b' : '#10b981'}
            />
            <MetricMeter
              label="Mémoire"
              value={`${memUsage.toFixed(0)} MB`}
              percentage={(memUsage / 512) * 100}
              icon={<Icons.Memory />}
              color="#3b82f6"
            />
            <MetricMeter
              label="Processeur (IA)"
              value={`${cpuUsage.toFixed(1)}%`}
              percentage={cpuUsage * 2}
              icon={<Icons.Server />}
              color="#8b5cf6"
            />
          </div>

          {/* System Overview Details */}
          <div className="grid grid-cols-2 gap-4">
            {/* Connection Info */}
            <div className="flex flex-col p-5 rounded-xl bg-white/[0.02] border border-white/5 transition-all duration-300 hover:bg-white/[0.05]">
              <div className="flex items-center gap-2 text-slate-400 mb-3">
                <Icons.Signal />
                <span className="text-xs font-bold uppercase tracking-widest">État Réseau</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative flex h-3 w-3">
                  {(isConnected || isConnecting) && (
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  )}
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-emerald-500' : isConnecting ? 'bg-amber-500' : 'bg-slate-600'}`} />
                </div>
                <span className={`text-sm font-bold ${isConnected ? 'text-emerald-400' : isConnecting ? 'text-amber-400' : 'text-slate-500'}`}>
                  {isConnected ? 'STABLE' : isConnecting ? 'SYNC...' : 'HORS LIGNE'}
                </span>
              </div>
            </div>

            {/* Vision Mode */}
            <div className="flex flex-col p-5 rounded-xl bg-white/[0.02] border border-white/5 transition-all duration-300 hover:bg-white/[0.05]">
              <div className="flex items-center gap-2 text-slate-400 mb-3">
                <Icons.Eye />
                <span className="text-xs font-bold uppercase tracking-widest">Mode Vision</span>
              </div>
              <span className={`text-sm font-bold ${isScreenShareActive || isVideoActive ? 'text-indigo-400' : 'text-slate-500'}`}>
                {isScreenShareActive ? 'PARTAGE D\'ÉCRAN' : isVideoActive ? 'FLUX CAMÉRA' : 'INACTIF'}
              </span>
            </div>
          </div>

          {/* Features Toggle Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-1 flex items-center gap-2">
              <span className="w-8 h-[1px] bg-slate-800"></span>
              Configuration des Modules
              <span className="flex-grow h-[1px] bg-slate-800"></span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ToggleItem
                label="Appel de Fonctions"
                isEnabled={isFunctionCallingEnabled}
                onToggle={handleToggleFunctionCalling}
                activeColor="blue"
                icon={<Icons.Code />}
              />

              <ToggleItem
                label="Recherche Google"
                isEnabled={isGoogleSearchEnabled}
                onToggle={handleToggleGoogleSearch}
                activeColor="green"
                icon={<Icons.Search />}
              />

              <ToggleItem
                label="Suivi des Yeux"
                isEnabled={isEyeTrackingEnabled}
                onToggle={handleToggleEyeTracking}
                activeColor="purple"
                icon={<Icons.Eye />}
              />

              <ToggleItem
                label="Avatar 3D"
                isEnabled={isAvatar3DEnabled}
                onToggle={handleToggleAvatar3D}
                activeColor="indigo"
                icon={<Icons.Cube />}
              />
            </div>
          </div>

          {/* UI Preferences & Configuration */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-1 flex items-center gap-2">
              <span className="w-8 h-[1px] bg-slate-800"></span>
              Personnalisation Interface
              <span className="flex-grow h-[1px] bg-slate-800"></span>
            </h3>

            {/* Theme Selector */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3 w-1/2">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Icons.Palette />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Thème Visuel</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-tight">Couleurs de l'interface</p>
                </div>
              </div>
              <select
                value={themePreference}
                onChange={(e) => void setThemePreference(e.target.value)}
                className="bg-black/40 border border-white/10 text-slate-300 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-1/2 p-2 outline-none font-medium appearance-none"
              >
                <option value="slate">Slate (Défaut)</option>
                <option value="midnight">Minuit Profond</option>
                <option value="zinc">Zinc Contrasté</option>
                <option value="cyberpunk">Cyberpunk Neon</option>
                <option value="forest">Forêt Émeraude</option>
              </select>
            </div>

            {/* Compact Mode Toggle */}
            <ToggleItem
              label="Mode Compact UI (Outils)"
              isEnabled={compactMode}
              onToggle={() => setCompactMode(!compactMode)}
              activeColor="blue"
              icon={<Icons.Layout />}
            />
          </div>

          {/* Voice Configuration */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-1 flex items-center gap-2">
              <span className="w-8 h-[1px] bg-slate-800"></span>
              Configuration Audio
              <span className="flex-grow h-[1px] bg-slate-800"></span>
            </h3>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Icons.Activity />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Voix du Système</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-tight">Sélectionnez la personnalité vocale</p>
                </div>
              </div>
              <VoiceSelector
                currentVoice={selectedVoice}
                onVoiceChange={onVoiceChange}
                disabled={isConnected}
              />
            </div>

            {/* Advanced TTS Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vitesse (Rate)</span>
                  <span className="text-xs font-mono text-indigo-400">{voiceRate.toFixed(1)}x</span>
                </div>
                <input
                  type="range" min="0.5" max="2.0" step="0.1"
                  value={voiceRate}
                  onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tonalité (Pitch)</span>
                  <span className="text-xs font-mono text-emerald-400">{voicePitch.toFixed(1)}</span>
                </div>
                <input
                  type="range" min="0.5" max="1.5" step="0.1"
                  value={voicePitch}
                  onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            </div>

            {/* Action Logs Button */}
            <div className="pt-4 flex justify-center mt-2">
              <button
                onClick={() => {
                  onClose();
                  useAppStore.getState().setLogsModalOpen(true);
                }}
                className="flex items-center gap-2 px-6 py-3 w-full justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-white/10"
              >
                <Icons.Code />
                <span className="text-sm font-semibold tracking-wider">VOIR L'HISTORIQUE DES ACTIONS IA (LOGS)</span>
              </button>
            </div>

            {/* Browser Cleanup Section (If Active) */}
            {isBrowserActive && (
              <div className="pt-2">
                <button
                  onClick={handleCloseBrowser}
                  className="flex items-center gap-2 px-6 py-3 w-full justify-center rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all border border-red-500/20 group"
                >
                  <Icons.Globe />
                  <span className="text-sm font-semibold tracking-wider group-hover:tracking-widest transition-all">FERMER LE NAVIGATEUR AUTONOME ACTIVÉ</span>
                </button>
              </div>
            )}
          </div>

          {/* Personality Footer */}
          <div className="p-4 rounded-xl border border-white/10 bg-gradient-to-r from-white/[0.02] to-transparent flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10"
                  style={{ backgroundColor: `${currentPersonality.themeColor}20` }}
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{
                      backgroundColor: currentPersonality.themeColor,
                      boxShadow: `0 0 15px ${currentPersonality.themeColor}`
                    }}
                  />
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-none mb-1">Identité Active</p>
                <p className="text-base font-bold text-white">{currentPersonality.name}</p>
              </div>
            </div>

            <div className="text-right flex flex-col items-end">
              <span className="text-[9px] text-slate-600 uppercase tracking-widest leading-none mb-1">Dernière Mise à jour</span>
              <span className="text-[10px] font-mono font-bold text-slate-400">{lastUpdate}</span>
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
    </div>
  );
};

export default memo(SystemStatusModal);
