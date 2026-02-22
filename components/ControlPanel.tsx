import React, { useMemo, useState, useRef, useEffect, useCallback, memo } from 'react';
import { ConnectionState, Personality } from '../types';
import Loader from './Loader';
import Tooltip from './Tooltip';
import LatencyIndicator from './LatencyIndicator';
import AudioInputVisualizer from './AudioInputVisualizer';
import { useAppStore } from '../stores/appStore';

interface ControlPanelProps {
  connectionState: ConnectionState;
  currentPersonality: Personality;
  isVideoActive: boolean;
  isScreenShareActive?: boolean;
  isMicMuted?: boolean;
  latencyMs?: number;
  inputAnalyser?: AnalyserNode | null;
  availableCameras?: MediaDeviceInfo[];
  selectedCameraId?: string;
  isFunctionCallingEnabled?: boolean;
  isGoogleSearchEnabled?: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare?: () => void;
  onToggleMic?: () => void;
  onCameraChange?: (cameraId: string) => void;


  onToggleFunctionCalling?: (enabled: boolean) => void;
  onToggleGoogleSearch?: (enabled: boolean) => void;
  onOpenMobileActions?: () => void;
}

// --- Icons ---
const Icons = {
  Camera: memo(() => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
    </svg>
  )),
  CameraOff: memo(() => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  )),
  ScreenShare: memo(() => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
    </svg>
  )),
  Mic: memo(() => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
    </svg>
  )),
  MicOff: memo(() => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.343 6.343l-1.414 1.414m15.142 15.142l-1.414-1.414M12 18.75v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
    </svg>
  )),
  ChevronUp: memo(() => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
  )),
  ChevronDown: memo(() => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  )),
  Check: memo(() => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )),
  Power: memo(() => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
    </svg>
  )),
  Plus: memo(() => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  ))
};

// --- Sub-Components ---

// Enhanced Round Button with ripple effect
const RoundButton = memo(({
  onClick,
  active,
  activeColor = 'bg-white/10',
  icon,
  tooltip,
  indicator,
  themeColor,
  disabled = false,
  size = 'md'
}: {
  onClick: () => void;
  active: boolean;
  activeColor?: string;
  icon: React.ReactNode;
  tooltip: string;
  indicator?: React.ReactNode;
  themeColor?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12 md:w-14 md:h-14',
    lg: 'w-14 h-14 md:w-16 md:h-16'
  };

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;

    const button = buttonRef.current;
    if (button) {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();

      setRipples(prev => [...prev, { x, y, id }]);
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== id));
      }, 600);
    }

    onClick();
  }, [onClick, disabled]);

  return (
    <Tooltip content={tooltip}>
      <button
        ref={buttonRef}
        onClick={handleClick}
        onMouseDown={() => !disabled && setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        disabled={disabled}
        aria-pressed={active}
        aria-label={tooltip}
        className={`
          relative flex items-center justify-center ${sizeClasses[size]} rounded-full
          transition-all duration-300 ease-out
          border overflow-hidden
          touch-manipulation
          ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
          ${active
            ? `${activeColor} text-white border-white/10 shadow-[0_0_25px_rgba(255,255,255,0.15)]`
            : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white hover:border-white/20'
          }
          ${!disabled && !active ? 'hover:scale-105 active:scale-90' : ''}
          ${isPressed && !disabled ? 'scale-90' : ''}
          ${active && !disabled ? 'scale-105' : ''}
        `}
        style={active && themeColor ? {
          boxShadow: `0 0 25px ${themeColor}30, inset 0 0 15px ${themeColor}10`
        } : undefined}
      >
        {/* Ripple effects */}
        {ripples.map(ripple => (
          <span
            key={ripple.id}
            className="absolute rounded-full animate-ripple pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              backgroundColor: themeColor || 'rgba(255,255,255,0.3)',
              transform: 'translate(-50%, -50%)'
            }}
          />
        ))}

        {/* Hover glow */}
        {!disabled && (
          <div
            className="absolute inset-0 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-300"
            style={{
              background: themeColor
                ? `radial-gradient(circle at center, ${themeColor}20 0%, transparent 70%)`
                : 'radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%)'
            }}
          />
        )}

        <span className="relative z-10">
          {icon}
          {indicator}
        </span>

        {/* Active indicator dot */}
        {active && (
          <span
            className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full animate-pulse"
            style={{
              backgroundColor: themeColor || '#fff',
              boxShadow: themeColor ? `0 0 6px ${themeColor}` : '0 0 6px rgba(255,255,255,0.5)'
            }}
          />
        )}
      </button>
    </Tooltip>
  );
});

RoundButton.displayName = 'RoundButton';

// Status Island Component
const StatusIsland = memo(({
  isConnected,
  inputAnalyser,
  latencyMs,
  themeColor
}: {
  isConnected: boolean;
  inputAnalyser: AnalyserNode | null;
  latencyMs: number;
  themeColor: string;
}) => (
  <div
    className={`
      fixed bottom-10 left-6 z-50 pointer-events-auto 
      transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] origin-bottom-left
      ${isConnected ? 'opacity-100 scale-100 translate-x-0' : 'opacity-0 scale-90 -translate-x-4 pointer-events-none'}
    `}
    role="status"
    aria-live="polite"
    aria-label="État de la session"
  >
    <div
      className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-[#050508]/70 backdrop-blur-xl border border-white/10 shadow-2xl"
      style={{
        boxShadow: `0 0 40px ${themeColor}15, 0 4px 20px rgba(0,0,0,0.4)`
      }}
    >
      {/* Live Indicator with enhanced animation */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <span className="absolute inset-0 rounded-full bg-emerald-500/50 animate-ping" />
            <span className="absolute inset-0 rounded-full bg-emerald-400/30 animate-pulse" />
            <div
              className="relative w-2 h-2 rounded-full bg-emerald-500"
              style={{ boxShadow: '0 0 10px rgba(16,185,129,0.8), 0 0 20px rgba(16,185,129,0.4)' }}
            />
          </div>
          <span className="text-[10px] font-black tracking-[0.2em] text-emerald-400 uppercase">
            Live
          </span>
        </div>

        <div className="w-[1px] h-4 bg-gradient-to-b from-transparent via-white/20 to-transparent" />

        {/* Audio Visualizer */}
        <div className="w-14 h-4 flex items-center opacity-90">
          <AudioInputVisualizer analyser={inputAnalyser} isActive={isConnected} />
        </div>
      </div>

      <div className="w-[1px] h-4 bg-gradient-to-b from-transparent via-white/20 to-transparent" />

      {/* Latency */}
      <div className="scale-90 origin-left">
        <LatencyIndicator latencyMs={latencyMs} />
      </div>
    </div>
  </div>
));

StatusIsland.displayName = 'StatusIsland';

// Main Connect Button Component
const ConnectButton = memo(({
  isConnecting,
  onClick,
  themeColor
}: {
  isConnecting: boolean;
  onClick: () => void;
  themeColor: string;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      disabled={isConnecting}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex items-center justify-center gap-2 md:gap-3 px-5 py-2.5 md:px-7 md:py-3.5 min-w-[140px] md:min-w-[170px] rounded-full bg-white text-black font-bold text-sm md:text-base transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden touch-manipulation"
      style={{
        boxShadow: isHovered
          ? `0 0 40px rgba(255,255,255,0.3), 0 0 60px ${themeColor}30`
          : '0 0 20px rgba(255,255,255,0.1)'
      }}
      aria-label={isConnecting ? "Connexion en cours" : "Démarrer la session"}
    >
      {/* Animated gradient sweep */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          transform: isHovered ? 'translateX(100%)' : 'translateX(-100%)',
          transition: 'transform 0.7s ease-out'
        }}
      />

      {/* Themed glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-full"
        style={{
          background: `linear-gradient(135deg, ${themeColor} 0%, transparent 50%)`
        }}
      />

      {isConnecting ? (
        <>
          <Loader size="sm" color="#000000" />
          <span className="relative z-10">Connexion...</span>
        </>
      ) : (
        <>
          {/* Pulsing indicator */}
          <span className="relative z-10 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-30" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-black" />
          </span>
          <span className="relative z-10 tracking-wide">COMMENCER</span>
        </>
      )}
    </button>
  );
});

ConnectButton.displayName = 'ConnectButton';

// Disconnect Button Component
const DisconnectButton = memo(({ onClick }: { onClick: () => void }) => {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={`
        group flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full 
        bg-red-500/10 border border-red-500/20 text-red-500 
        transition-all duration-300 
        hover:bg-red-500 hover:text-white hover:border-red-500 
        shadow-[0_0_20px_rgba(239,68,68,0.1)] 
        hover:shadow-[0_0_40px_rgba(239,68,68,0.5)] 
        touch-manipulation
        ${isPressed ? 'scale-90' : 'active:scale-90'}
      `}
      aria-label="Terminer la session"
    >
      <div className="transition-transform duration-300 group-hover:rotate-90">
        <Icons.Power />
      </div>
    </button>
  );
});

DisconnectButton.displayName = 'DisconnectButton';

// Dock Divider Component
const DockDivider = memo(() => (
  <div className="w-[1px] h-8 bg-gradient-to-b from-transparent via-white/15 to-transparent mx-1" />
));

DockDivider.displayName = 'DockDivider';

// --- Main Component ---
const ControlPanel: React.FC<ControlPanelProps> = ({
  connectionState,
  currentPersonality,
  isVideoActive,
  isScreenShareActive = false,
  isMicMuted = false,
  latencyMs = 0,
  inputAnalyser = null,
  onConnect,
  onDisconnect,
  onToggleVideo,
  onToggleScreenShare,
  onToggleMic,
  onOpenMobileActions,
}) => {
  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isConnecting = connectionState === ConnectionState.CONNECTING;
  const { compactMode } = useAppStore();

  // Memoized dock style
  const dockStyle = useMemo(() => ({
    boxShadow: isConnected
      ? `0 0 80px -20px ${currentPersonality.themeColor}40, 0 0 40px rgba(0,0,0,0.5)`
      : '0 0 50px rgba(0,0,0,0.5)'
  }), [isConnected, currentPersonality.themeColor]);

  return (
    <div
      className="relative z-40 flex flex-col items-center justify-end h-full pb-6 sm:pb-8 md:pb-10 w-full pointer-events-none safe-area-bottom"
      role="region"
      aria-label="Panneau de contrôle"
    >

      {/* 1. STATUS ISLAND */}
      <StatusIsland
        isConnected={isConnected}
        inputAnalyser={inputAnalyser}
        latencyMs={latencyMs}
        themeColor={currentPersonality.themeColor}
      />


      {/* 3. MAIN DOCK */}
      <div className="pointer-events-auto">
        <div
          className={`
            flex items-center gap-2 md:gap-3 rounded-full border border-white/10 bg-[#08080a]/95 backdrop-blur-2xl transition-all duration-500 animate-in fade-in slide-in-from-bottom-4
            ${compactMode ? 'p-1.5 pl-3 pr-1.5' : 'p-2.5 pl-4 pr-3'}
          `}
          style={dockStyle}
          role="toolbar"
          aria-label="Contrôles de session"
        >

          {/* Media Controls Group */}
          <div
            className="flex items-center gap-2"
            role="group"
            aria-label="Contrôles média"
          >
            {/* Microphone */}
            {isConnected && onToggleMic && (
              <RoundButton
                size={compactMode ? 'sm' : 'md'}
                onClick={onToggleMic}
                active={!isMicMuted}
                activeColor="bg-white/10"
                icon={isMicMuted ? <Icons.MicOff /> : <Icons.Mic />}
                tooltip={isMicMuted ? "Activer Microphone" : "Couper Microphone"}
                themeColor={currentPersonality.themeColor}
              />
            )}

            {/* Camera */}
            {isConnected && (
              <RoundButton
                size={compactMode ? 'sm' : 'md'}
                onClick={onToggleVideo}
                active={isVideoActive}
                activeColor="bg-white/10"
                icon={isVideoActive ? <Icons.Camera /> : <Icons.CameraOff />}
                tooltip={isVideoActive ? "Désactiver Caméra" : "Activer Caméra"}
                themeColor={currentPersonality.themeColor}
              />
            )}

            {/* Screen Share */}
            {isConnected && onToggleScreenShare && (
              <RoundButton
                size={compactMode ? 'sm' : 'md'}
                onClick={onToggleScreenShare}
                active={isScreenShareActive}
                activeColor="bg-indigo-500/30"
                icon={<Icons.ScreenShare />}
                tooltip="Partage d'écran"
                themeColor="#6366f1"
              />
            )}
          </div>

          <DockDivider />

          {/* Main Action Button */}
          {!isConnected ? (
            <ConnectButton
              isConnecting={isConnecting}
              onClick={onConnect}
              themeColor={currentPersonality.themeColor}
            />
          ) : (
            <DisconnectButton onClick={onDisconnect} />
          )}

          {/* Mobile Menu */}
          {!isConnected && onOpenMobileActions && (
            <div className="md:hidden flex items-center pl-2 border-l border-white/10">
              <button
                onClick={onOpenMobileActions}
                className="p-2.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-all duration-300 touch-manipulation active:scale-90"
                aria-label="Plus d'options"
              >
                <Icons.Plus />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Styles */}
      <style>{`
        @keyframes ripple {
          0% {
            width: 0;
            height: 0;
            opacity: 0.5;
          }
          100% {
            width: 120px;
            height: 120px;
            opacity: 0;
          }
        }
        
        .animate-ripple {
          animation: ripple 0.6s ease-out forwards;
        }
        
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

export default ControlPanel;
