import React, { useMemo, useState, useRef, useEffect, useCallback, memo } from 'react';
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
  onEditPersonality?: () => void;
  onSelectPersonality?: (personality: Personality) => void;
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
      fixed top-24 left-6 z-50 pointer-events-auto 
      transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] origin-top-left
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

// Personality Card Component
const PersonalityCard = memo(({ 
  personality, 
  isSelected, 
  onClick,
  isPreview = false
}: { 
  personality: Personality; 
  isSelected: boolean; 
  onClick: () => void;
  isPreview?: boolean;
}) => (
  <button
    onClick={onClick}
    className={`
      w-full flex items-start gap-3 p-4 transition-all duration-300
      ${isSelected 
        ? 'bg-white/[0.08] border-l-2' 
        : 'hover:bg-white/[0.05] border-l-2 border-transparent hover:border-white/10'
      }
      ${isPreview ? 'scale-[1.02] bg-white/[0.06]' : ''}
    `}
    style={isSelected ? { borderLeftColor: personality.themeColor } : {}}
    role="option"
    aria-selected={isSelected}
  >
    {/* Color Indicator with glow */}
    <div 
      className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mt-0.5 transition-all duration-300 group-hover:scale-110"
      style={{ color: personality.themeColor }}
    >
      <div 
        className="w-3 h-3 rounded-full transition-all duration-300"
        style={{ 
          backgroundColor: personality.themeColor,
          boxShadow: `0 0 12px ${personality.themeColor}, 0 0 24px ${personality.themeColor}40`
        }} 
      />
    </div>

    {/* Content */}
    <div className="flex-1 min-w-0 text-left">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-base font-bold text-white transition-colors duration-300">
          {personality.name}
        </h3>
        {isSelected && (
          <div 
            className="flex-shrink-0 animate-in zoom-in duration-200"
            style={{ color: personality.themeColor }}
          >
            <Icons.Check />
          </div>
        )}
      </div>
      <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
        {personality.description}
      </p>
    </div>
  </button>
));

PersonalityCard.displayName = 'PersonalityCard';

// Personality Selector Component
const PersonalitySelector = memo(({ 
  currentPersonality, 
  onSelectPersonality,
  isOpen,
  onToggle
}: { 
  currentPersonality: Personality; 
  onSelectPersonality: (personality: Personality) => void;
  isOpen: boolean;
  onToggle: () => void;
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onToggle();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onToggle]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onToggle();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onToggle]);

  return (
    <div 
      ref={dropdownRef}
      className="fixed top-1/2 right-6 -translate-y-1/2 pointer-events-auto z-20"
    >
      {/* Main Card */}
      <button
        onClick={onToggle}
        className="group relative w-80 max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-[#050508]/70 backdrop-blur-xl shadow-2xl transition-all duration-500 hover:border-white/20 hover:bg-[#050508]/90 animate-in fade-in slide-in-from-right-4 duration-700 focus:outline-none focus:ring-2 focus:ring-white/20"
        aria-label="Sélectionner une personnalité"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {/* Ambient glow */}
        <div 
          className="absolute inset-0 opacity-20 transition-opacity duration-500 group-hover:opacity-30"
          style={{
            background: `radial-gradient(ellipse at center, ${currentPersonality.themeColor}30 0%, transparent 70%)`
          }}
        />

        <div className="relative z-10 flex items-center justify-between p-4">
          {/* Left Icon */}
          <div 
            className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 shadow-inner transition-all duration-300 group-hover:scale-110 group-hover:bg-white/10"
            style={{ color: currentPersonality.themeColor }}
          >
            <div 
              className="w-3.5 h-3.5 rounded-full transition-all duration-300"
              style={{ 
                backgroundColor: currentPersonality.themeColor,
                boxShadow: `0 0 15px ${currentPersonality.themeColor}, 0 0 30px ${currentPersonality.themeColor}50`
              }} 
            />
          </div>

          {/* Text Info */}
          <div className="flex-1 px-4 text-left">
            <div className="flex items-center gap-2 text-zinc-500 mb-1 transition-colors duration-300 group-hover:text-zinc-400">
              <span className="text-[10px] font-semibold tracking-widest uppercase">Personnalité</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight leading-none transition-all duration-300 group-hover:translate-x-1">
              {currentPersonality.name}
            </h2>
            <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
              {currentPersonality.description}
            </p>
          </div>
          
          {/* Chevron with rotation */}
          <div className={`
            flex items-center justify-center w-8 h-8 text-zinc-400 
            transition-all duration-300 group-hover:text-white
            ${isOpen ? 'rotate-180' : 'rotate-0'}
          `}>
            <Icons.ChevronDown />
          </div>
        </div>

        {/* Bottom accent line */}
        <div 
          className="absolute bottom-0 left-0 h-[2px] w-full opacity-60 transition-all duration-500 group-hover:opacity-100"
          style={{ 
            background: `linear-gradient(90deg, transparent, ${currentPersonality.themeColor}, transparent)` 
          }}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="mt-3 w-80 max-w-sm rounded-2xl border border-white/10 bg-[#050508]/95 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 zoom-in-95 duration-300"
          role="listbox"
          aria-label="Liste des personnalités"
        >
          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
            {AVAILABLE_PERSONALITIES.map((personality) => {
              const isSelected = personality.id === currentPersonality.id;
              const isHovered = hoveredId === personality.id;
              
              return (
                <div
                  key={personality.id}
                  onMouseEnter={() => setHoveredId(personality.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <PersonalityCard
                    personality={personality}
                    isSelected={isSelected}
                    isPreview={isHovered && !isSelected}
                    onClick={() => {
                      if (!isSelected) {
                        onSelectPersonality(personality);
                      }
                      onToggle();
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

PersonalitySelector.displayName = 'PersonalitySelector';

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
      className="group relative flex items-center gap-3 px-7 py-3.5 rounded-full bg-white text-black font-bold text-base transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden touch-manipulation"
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
        group flex items-center justify-center w-14 h-14 rounded-full 
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
  onSelectPersonality,
  onOpenMobileActions,
}) => {
  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isConnecting = connectionState === ConnectionState.CONNECTING;
  const [isPersonalityDropdownOpen, setIsPersonalityDropdownOpen] = useState(false);

  const togglePersonalityDropdown = useCallback(() => {
    setIsPersonalityDropdownOpen(prev => !prev);
  }, []);

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

      {/* 2. PERSONALITY SELECTOR */}
      {!isConnected && onSelectPersonality && (
        <PersonalitySelector
          currentPersonality={currentPersonality}
          onSelectPersonality={onSelectPersonality}
          isOpen={isPersonalityDropdownOpen}
          onToggle={togglePersonalityDropdown}
        />
      )}

      {/* 3. MAIN DOCK */}
      <div className="pointer-events-auto">
        <div 
          className="flex items-center gap-3 md:gap-4 p-2.5 pl-4 pr-3 rounded-full border border-white/10 bg-[#08080a]/95 backdrop-blur-2xl transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 duration-700"
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
