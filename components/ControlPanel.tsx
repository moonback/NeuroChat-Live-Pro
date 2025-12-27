import React, { useMemo } from 'react';
import { ConnectionState, Personality } from '../types';
import { AVAILABLE_PERSONALITIES } from '../constants';
import Loader from './Loader';
import Tooltip from './Tooltip';
import LatencyIndicator from './LatencyIndicator';
import AudioInputVisualizer from './AudioInputVisualizer';

interface ControlPanelProps {
  connectionState: ConnectionState;
  currentPersonality: Personality;
  isVideoActive: boolean;
  isScreenShareActive?: boolean;
  latencyMs?: number;
  inputAnalyser?: AnalyserNode | null;
  availableCameras?: MediaDeviceInfo[];
  selectedCameraId?: string;
  isWakeWordEnabled?: boolean;
  isFunctionCallingEnabled?: boolean;
  isGoogleSearchEnabled?: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare?: () => void;
  onCameraChange?: (cameraId: string) => void;
  onToggleWakeWord?: () => void;
  onEditPersonality?: () => void;
  onSelectPersonality?: (personality: Personality) => void;
  onToggleFunctionCalling?: (enabled: boolean) => void;
  onToggleGoogleSearch?: (enabled: boolean) => void;
  onOpenMobileActions?: () => void;
}

const STATUS_COLOR = {
  connected: {
    color: '#34d399',
    class: 'bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.8)]',
    pulse: 'bg-emerald-400',
    textShadow: '0 0 10px rgba(52, 211, 153, 0.5)',
    text: 'Système Actif'
  },
  connecting: {
    color: '#fbbf24',
    class: 'bg-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.8)] animate-pulse',
    pulse: 'bg-amber-400',
    textShadow: '0 0 10px rgba(251, 191, 36, 0.5)',
    text: 'Initialisation'
  },
  idle: {
    color: '#94a3b8',
    class: 'bg-slate-500',
    pulse: '',
    textShadow: 'none',
    text: 'Mode Veille'
  }
};

const ControlPanel: React.FC<ControlPanelProps> = ({
  connectionState,
  currentPersonality,
  isVideoActive,
  isScreenShareActive = false,
  latencyMs = 0,
  inputAnalyser = null,
  availableCameras = [],
  selectedCameraId = '',
  isWakeWordEnabled = true,
  isFunctionCallingEnabled = true,
  isGoogleSearchEnabled = false,
  onConnect,
  onDisconnect,
  onToggleVideo,
  onToggleScreenShare,
  onCameraChange,
  onToggleWakeWord,
  onEditPersonality,
  onSelectPersonality,
  onToggleFunctionCalling,
  onToggleGoogleSearch,
  onOpenMobileActions,
}) => {
  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isConnecting = connectionState === ConnectionState.CONNECTING;

  // For memoizing classes/labels that depend on state
  const status = useMemo(() => {
    if (isConnected) return STATUS_COLOR.connected;
    if (isConnecting) return STATUS_COLOR.connecting;
    return STATUS_COLOR.idle;
  }, [isConnected, isConnecting]);

  // Accessibility: aria-live for status
  const ariaLiveStatus = useMemo(() => {
    return status.text;
  }, [status]);

  // Button base classes for DRY (improvements)
  const baseBtn =
    "group relative flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2.5 sm:px-3 md:px-4 lg:px-4 py-1.5 sm:py-2 md:py-2 rounded-md glass border border-white/8 font-body text-[10px] sm:text-xs md:text-sm font-medium transition-all duration-200 hover:border-white/20 hover:scale-[1.02] active:scale-[0.98] overflow-hidden focus:outline-none focus:ring-1 focus:ring-white/20 touch-manipulation select-none hover-lift ripple";

  // Render camera selector only when at least 2 cameras and video is on
  const renderCameraSelector = isConnected && isVideoActive && availableCameras.length > 1;

  // Utils for label
  const getCameraButtonLabel = () => (isVideoActive ? "Désactiver la caméra" : "Activer la caméra");
  const getCameraTooltip = () => (isVideoActive
      ? "Désactiver la caméra - L'IA ne verra plus votre environnement"
      : "Activer la caméra - Permet à l'IA de voir votre environnement"
    );
  const getScreenShareTooltip = () => (isScreenShareActive
      ? "Arrêter le partage d'écran"
      : "Partager votre écran - L'IA pourra voir ce que vous affichez"
    );

  // Main render - Redesigned as a modern floating dock
  return (
    <div className="relative z-10 flex flex-col items-center justify-end h-full pb-6 sm:pb-8 w-full pointer-events-none safe-area-bottom">
      
      {/* Dynamic Status Island (Above Controls) */}
      <div className={`pointer-events-auto mb-4 sm:mb-6 transition-all duration-500 ease-out transform ${isConnected ? 'scale-100 opacity-100' : 'scale-95 opacity-0 h-0 overflow-hidden'}`}>
        <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full glass-intense border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl">
             <div className="flex items-center gap-2 pr-3 sm:pr-4 border-r border-white/10">
                <div className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-emerald-500"></span>
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-emerald-100 tracking-wide">LIVE</span>
             </div>

             <div className="hidden sm:flex items-center gap-2 pr-4 border-r border-white/10">
               <span
                 className="w-2.5 h-2.5 rounded-full"
                 style={{
                   backgroundColor: currentPersonality.themeColor,
                   boxShadow: `0 0 12px ${currentPersonality.themeColor}66`,
                 }}
               />
               <span className="text-xs font-medium text-white/80 max-w-[180px] truncate">
                 {currentPersonality.name}
               </span>
             </div>
             
             <div className="flex items-center gap-2 sm:gap-3">
               <Tooltip content="Latence">
                  <LatencyIndicator latencyMs={latencyMs} />
               </Tooltip>
               <div className="h-3 w-[1px] bg-white/10"></div>
               <Tooltip content="Volume">
                 <div className="w-12 sm:w-16 h-5 sm:h-6 flex items-center">
                    <AudioInputVisualizer analyser={inputAnalyser} isActive={isConnected} />
                 </div>
               </Tooltip>
             </div>
        </div>
      </div>

      {/* Personality Selector (Visible when disconnected) */}
      {!isConnected && (
         <div className="pointer-events-auto mb-6 sm:mb-10 w-full max-w-[90%] sm:max-w-md mx-auto animate-fade-in z-20">
            {/* Label discret */}
            <div className="flex justify-center mb-2 sm:mb-3">
                <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-white/5 border border-white/5 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400 backdrop-blur-md">
                    Assistant Actif
                </span>
            </div>

            {/* Compact Glass Card */}
            <div className="group relative overflow-hidden rounded-2xl bg-[#0a0a0a]/60 border border-white/10 shadow-2xl transition-all duration-500 hover:border-white/20 hover:bg-[#0a0a0a]/80 backdrop-blur-xl">
                
                {/* Ambient Glow */}
                <div 
                    className="absolute -top-20 -left-20 w-32 sm:w-40 h-32 sm:h-40 rounded-full opacity-20 blur-[50px] transition-all duration-700 group-hover:opacity-30"
                    style={{ background: currentPersonality.themeColor }}
                />
                <div 
                    className="absolute -bottom-20 -right-20 w-32 sm:w-40 h-32 sm:h-40 rounded-full opacity-10 blur-[50px] transition-all duration-700 group-hover:opacity-20"
                    style={{ background: currentPersonality.themeColor }}
                />

                {/* Content */}
                <div className="relative z-10">
                    {onSelectPersonality ? (
                        <div className="relative w-full">
                            {/* Invisible Select Overlay */}
                            <select
                                value={currentPersonality.id}
                                onChange={(e) => {
                                    const selected = AVAILABLE_PERSONALITIES.find(p => p.id === e.target.value);
                                    if (selected) onSelectPersonality(selected);
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                                title="Changer de personnalité"
                            >
                                {AVAILABLE_PERSONALITIES.map(p => (
                                    <option key={p.id} value={p.id} className="bg-slate-900 text-white text-base py-2">
                                        {p.name}
                                    </option>
                                ))}
                                {!AVAILABLE_PERSONALITIES.some(p => p.id === currentPersonality.id) && (
                                    <option value={currentPersonality.id} className="bg-slate-900 text-white text-base">
                                        {currentPersonality.name} (Personnalisé)
                                    </option>
                                )}
                            </select>

                            {/* Visual Representation */}
                            <div className="flex flex-col items-center py-4 sm:py-5 px-4 sm:px-6 pointer-events-none">
                                {/* Header with Arrows */}
                                <div className="flex items-center justify-between w-full mb-2 sm:mb-3">
                                    <div className="p-1.5 sm:p-2 rounded-full bg-white/5 text-white/30 group-hover:text-white/60 group-hover:bg-white/10 transition-all duration-300">
                                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </div>

                                    <div className="flex flex-col items-center flex-1 px-2">
                                        <h2 
                                            className="text-xl sm:text-3xl font-display font-bold tracking-tight text-center transition-all duration-300 transform group-hover:scale-105 truncate w-full"
                                            style={{ 
                                                color: currentPersonality.themeColor,
                                                textShadow: `0 0 25px ${currentPersonality.themeColor}40`
                                            }}
                                        >
                                            {currentPersonality.name}
                                        </h2>
                                    </div>

                                    <div className="p-1.5 sm:p-2 rounded-full bg-white/5 text-white/30 group-hover:text-white/60 group-hover:bg-white/10 transition-all duration-300">
                                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="w-12 sm:w-16 h-0.5 rounded-full bg-white/10 mb-2 sm:mb-3 group-hover:w-20 sm:group-hover:w-24 transition-all duration-500" />

                                {/* Description */}
                                <p className="text-slate-300 text-xs sm:text-sm font-light text-center leading-relaxed max-w-sm line-clamp-2 sm:line-clamp-none">
                                    {currentPersonality.description}
                                </p>

                                {/* Hint */}
                                <div className="mt-3 sm:mt-4 opacity-70 group-hover:opacity-100 transition-opacity duration-500 transform translate-y-2 group-hover:translate-y-0">
                                    <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-white/50 font-medium">
                                        Cliquez pour changer
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center py-5 px-6">
                            <h2 
                                className="text-2xl sm:text-3xl font-display font-bold tracking-tight mb-2"
                                style={{ color: currentPersonality.themeColor }}
                            >
                                {currentPersonality.name}
                            </h2>
                            <p className="text-slate-300 text-sm font-light text-center leading-relaxed">
                                {currentPersonality.description}
                            </p>
                        </div>
                    )}
                </div>
            </div>
         </div>
      )}

      {/* Main Control Dock */}
      <div
        className="pointer-events-auto rounded-full p-[1px] animate-slide-up"
        style={{
          background: isConnected
            ? `linear-gradient(90deg, ${currentPersonality.themeColor}55, rgba(255,255,255,0.12), ${currentPersonality.themeColor}55)`
            : 'linear-gradient(90deg, rgba(255,255,255,0.14), rgba(255,255,255,0.05), rgba(255,255,255,0.14))',
          boxShadow: isConnected
            ? `0 24px 60px rgba(0,0,0,0.35), 0 0 60px ${currentPersonality.themeColor}22`
            : '0 24px 60px rgba(0,0,0,0.35)',
        }}
      >
        <div
          className="relative flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-full glass-intense border border-white/10 backdrop-blur-2xl transition-all duration-500 hover:scale-[1.01] hover:border-white/20"
          style={{
            boxShadow: `0 20px 50px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.04), 0 0 40px ${
              isConnected ? currentPersonality.themeColor + '12' : 'transparent'
            }`,
          }}
        >
          {/* Soft inner highlight */}
          <div
            className="absolute inset-[1px] rounded-full pointer-events-none opacity-70"
            aria-hidden="true"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02) 35%, rgba(0,0,0,0.10))',
            }}
          />
          {/* Top specular line */}
          <div
            className="absolute top-[1px] left-6 right-6 h-px rounded-full pointer-events-none opacity-60"
            aria-hidden="true"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)' }}
          />
        
        {/* Left Controls Group */}
        <div className="relative flex items-center gap-2 sm:gap-3 px-2">
            {/* Camera Toggle */}
            {isConnected && (
                <Tooltip content={getCameraTooltip()}>
                    <button
                        onClick={onToggleVideo}
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                            isVideoActive 
                                ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]' 
                                : 'bg-white/5 text-white hover:bg-white/10 hover:scale-110'
                        }`}
                    >
                        {isVideoActive ? (
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                <line x1="3" y1="3" x2="21" y2="21" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                            </svg>
                        ) : (
                             <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        )}
                    </button>
                </Tooltip>
            )}

            {/* Screen Share */}
            {isConnected && onToggleScreenShare && (
                <Tooltip content={getScreenShareTooltip()}>
                    <button
                        onClick={onToggleScreenShare}
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                            isScreenShareActive 
                                ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' 
                                : 'bg-white/5 text-white hover:bg-white/10 hover:scale-110'
                        }`}
                    >
                         {isScreenShareActive ? (
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                <line x1="3" y1="3" x2="21" y2="21" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        )}
                    </button>
                </Tooltip>
            )}

            {/* Wake Word (Disconnected) */}
            {!isConnected && onToggleWakeWord && (
                <Tooltip content={isWakeWordEnabled ? "Désactiver 'Bonjour'" : "Activer 'Bonjour'"}>
                    <button
                        onClick={onToggleWakeWord}
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                            isWakeWordEnabled 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white hover:scale-110'
                        }`}
                    >
                         <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    </button>
                </Tooltip>
            )}
        </div>

        {/* Main Action Button (Center) */}
        <div className="relative mx-2 sm:mx-4">
             {!isConnected ? (
                <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="relative group flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-white text-black font-display font-bold text-base sm:text-lg tracking-wide shadow-[0_0_40px_rgba(255,255,255,0.25)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_70px_rgba(255,255,255,0.45)] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isConnecting ? (
                        <>
                            <Loader size="sm" color="#000000" />
                            <span>Connexion...</span>
                        </>
                    ) : (
                        <>
                            <div className="w-2 h-2 rounded-full bg-black animate-pulse"></div>
                            <span>Démarrer</span>
                        </>
                    )}
                </button>
             ) : (
                 <button
                    onClick={onDisconnect}
                    className="relative group flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-500 text-white shadow-[0_0_40px_rgba(239,68,68,0.4)] transition-all duration-300 hover:scale-110 hover:bg-red-600 hover:shadow-[0_0_60px_rgba(239,68,68,0.6)] active:scale-90"
                 >
                     <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                 </button>
             )}
        </div>

        {/* Right Controls Group */}
        <div className="relative flex items-center gap-2 sm:gap-3 px-2">
            {/* Camera Switcher (Only if multiple cameras) */}
            {renderCameraSelector && onCameraChange && (
                 <div className="relative group">
                    <Tooltip content="Changer de caméra">
                        <button className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 hover:scale-110 transition-all duration-300">
                             <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </Tooltip>
                    <select
                        value={selectedCameraId}
                        onChange={(e) => onCameraChange(e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    >
                        {availableCameras.map((camera) => (
                            <option key={camera.deviceId} value={camera.deviceId}>
                                {camera.label}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Mobile Menu Trigger */}
            {!isConnected && onOpenMobileActions && (
                 <button
                    onClick={onOpenMobileActions}
                    className="lg:hidden w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 hover:scale-110 transition-all duration-300"
                >
                     <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                </button>
            )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;