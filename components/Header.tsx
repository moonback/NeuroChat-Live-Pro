import React, { useState, useEffect, memo, useCallback, useRef } from 'react';
import { ConnectionState, Personality } from '../types';
import VoiceSelector from './VoiceSelector';
import Tooltip from './Tooltip';
import DocumentUploader from './DocumentUploader';
import { ProcessedDocument } from '../utils/documentProcessor';

// --- Types ---
interface HeaderProps {
  connectionState: ConnectionState;
  currentPersonality: Personality;
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
  uploadedDocuments: ProcessedDocument[];
  onDocumentsChange: (documents: ProcessedDocument[]) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  isFunctionCallingEnabled: boolean;
  onToggleFunctionCalling: (enabled: boolean) => void;
  isGoogleSearchEnabled: boolean;
  onToggleGoogleSearch: (enabled: boolean) => void;
  onOpenToolsList: () => void;
  onEditPersonality?: () => void;
  onOpenSystemStatus?: () => void;
  autoHideDelay?: number; // Configurable auto-hide delay
}

// --- Icons ---
const Icons = {
  Search: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  ),
  Function: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
    </svg>
  ),
  Edit: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
    </svg>
  ),
  System: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Lock: () => (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  )
};

// --- Utility: Debounce Hook ---
function useDebounce<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

// --- Sub-Components ---

// 1. Enhanced Status Badge with richer animations
const StatusBadge = memo(({ connectionState }: { connectionState: ConnectionState }) => {
  const statusConfig = {
    [ConnectionState.CONNECTED]: {
      label: 'CONNECTÉ',
      colorClass: 'bg-emerald-500',
      textClass: 'text-emerald-400',
      glow: 'shadow-[0_0_12px_rgba(16,185,129,0.5)]',
      ringColor: 'ring-emerald-500/30'
    },
    [ConnectionState.CONNECTING]: {
      label: 'SYNCHRONISATION',
      colorClass: 'bg-amber-500',
      textClass: 'text-amber-400',
      glow: 'shadow-[0_0_12px_rgba(245,158,11,0.5)]',
      ringColor: 'ring-amber-500/30'
    },
    [ConnectionState.DISCONNECTED]: {
      label: 'HORS LIGNE',
      colorClass: 'bg-zinc-600',
      textClass: 'text-zinc-500',
      glow: '',
      ringColor: 'ring-zinc-600/30'
    }
  };

  const config = statusConfig[connectionState] || statusConfig[ConnectionState.DISCONNECTED];
  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isConnecting = connectionState === ConnectionState.CONNECTING;

  return (
    <div 
      className={`
        group flex items-center gap-3 px-5 py-2.5 rounded-full 
        bg-black/30 border border-white/10 backdrop-blur-md 
        transition-all duration-500 hover:bg-black/50 hover:border-white/20
        hover:scale-105 active:scale-95
        ${isConnected ? 'ring-2 ' + config.ringColor : ''}
      `}
      role="status"
      aria-live="polite"
      aria-label={`État de connexion: ${config.label}`}
    >
      {/* Animated status indicator */}
      <div className="relative flex h-3 w-3">
        {/* Outer pulse ring */}
        {(isConnected || isConnecting) && (
          <span 
            className={`
              absolute -inset-1 rounded-full opacity-40
              ${config.colorClass} animate-ping
            `} 
            style={{ animationDuration: isConnecting ? '1s' : '2s' }}
          />
        )}
        {/* Middle glow ring */}
        {isConnected && (
          <span 
            className={`
              absolute -inset-0.5 rounded-full opacity-60 animate-pulse
              ${config.colorClass}
            `} 
          />
        )}
        {/* Core dot */}
        <span 
          className={`
            relative inline-flex rounded-full h-3 w-3 
            ${config.colorClass} ${config.glow}
            transition-all duration-300
          `} 
        />
      </div>
      
      {/* Status text with typing animation for connecting */}
      <span className={`text-sm font-bold tracking-[0.12em] ${config.textClass} transition-colors duration-300`}>
        {isConnecting ? (
          <span className="inline-flex items-center gap-1">
            SYNC
            <span className="flex gap-0.5">
              <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
            </span>
          </span>
        ) : (
          config.label
        )}
      </span>
    </div>
  );
});

StatusBadge.displayName = 'StatusBadge';

// 2. Enhanced Control Button with ripple effect and better feedback
const ControlButton = memo(({ 
  active, 
  onClick, 
  icon, 
  label, 
  themeColor,
  disabled = false,
  disabledReason
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string;
  themeColor: string;
  disabled?: boolean;
  disabledReason?: string;
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    
    // Create ripple effect
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
  };

  const tooltipContent = disabled && disabledReason 
    ? `${label} - ${disabledReason}` 
    : label;

  return (
    <Tooltip content={tooltipContent} position="bottom">
      <button
        ref={buttonRef}
        onClick={handleClick}
        onMouseDown={() => !disabled && setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        disabled={disabled}
        aria-pressed={active}
        aria-label={label}
        aria-disabled={disabled}
        className={`
          relative group flex items-center justify-center w-12 h-12 rounded-xl
          transition-all duration-300 ease-out
          border-2 overflow-hidden
          ${disabled 
            ? 'opacity-40 cursor-not-allowed grayscale' 
            : active 
              ? 'text-white shadow-xl' 
              : 'text-zinc-400 border-transparent hover:text-zinc-200'
          }
          ${!disabled && !active ? 'hover:scale-105 active:scale-90' : ''}
          ${isPressed && !disabled ? 'scale-90' : ''}
          ${active && !disabled ? 'scale-105' : ''}
        `}
        style={active && !disabled ? { 
          borderColor: `${themeColor}60`, 
          backgroundColor: `${themeColor}15`,
          boxShadow: `0 0 20px ${themeColor}30, inset 0 0 20px ${themeColor}10` 
        } : {
          borderColor: 'transparent',
          backgroundColor: disabled ? 'rgba(255,255,255,0.02)' : 'transparent'
        }}
      >
        {/* Ripple effects */}
        {ripples.map(ripple => (
          <span
            key={ripple.id}
            className="absolute rounded-full animate-ripple pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              backgroundColor: active ? themeColor : 'rgba(255,255,255,0.3)',
              transform: 'translate(-50%, -50%)'
            }}
          />
        ))}

        {/* Animated background gradient */}
        <div 
          className={`
            absolute inset-0 opacity-0 transition-opacity duration-300 
            ${!disabled && 'group-hover:opacity-100'} 
            ${active && !disabled ? 'opacity-100' : ''}
          `}
          style={{
            background: active 
              ? `linear-gradient(135deg, ${themeColor}20 0%, ${themeColor}05 100%)`
              : `linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 100%)`
          }}
        />
        
        {/* Icon with enhanced styling */}
        <div className={`
          relative z-10 transition-all duration-300 
          ${active && !disabled ? 'scale-110 drop-shadow-lg' : ''} 
          ${!disabled && 'group-hover:scale-110'}
        `}>
          {icon}
        </div>

        {/* Disabled lock indicator */}
        {disabled && (
          <div className="absolute -bottom-0.5 -right-0.5 p-1 rounded-full bg-zinc-800 text-zinc-500 z-20">
            <Icons.Lock />
          </div>
        )}
        
        {/* Active indicator with glow */}
        {active && !disabled && (
          <>
            <span 
              className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full z-10 animate-pulse"
              style={{ 
                backgroundColor: themeColor,
                boxShadow: `0 0 8px ${themeColor}, 0 0 16px ${themeColor}40`
              }}
            />
            <div 
              className="absolute inset-0 rounded-xl opacity-20 blur-md animate-pulse"
              style={{ backgroundColor: themeColor }}
            />
          </>
        )}
        
        {/* Hover glow effect */}
        {!disabled && (
          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div 
              className="absolute inset-0 rounded-xl"
              style={{
                background: `radial-gradient(circle at center, ${themeColor}20 0%, transparent 70%)`
              }}
            />
          </div>
        )}
      </button>
    </Tooltip>
  );
});

ControlButton.displayName = 'ControlButton';

// 3. Section Divider Component
const SectionDivider = memo(() => (
  <div className="h-8 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
));

SectionDivider.displayName = 'SectionDivider';

// 4. Control Group Container
const ControlGroup = memo(({ children, label }: { children: React.ReactNode; label: string }) => (
  <div 
    className="flex items-center gap-2 p-2 rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 backdrop-blur-md shadow-lg transition-all duration-300 hover:from-white/[0.08] hover:to-white/[0.03]"
    role="group"
    aria-label={label}
  >
    {children}
  </div>
));

ControlGroup.displayName = 'ControlGroup';

// --- Main Component ---
const Header: React.FC<HeaderProps> = ({
  connectionState,
  currentPersonality,
  selectedVoice,
  onVoiceChange,
  uploadedDocuments,
  onDocumentsChange,
  isFunctionCallingEnabled,
  onToggleFunctionCalling,
  isGoogleSearchEnabled,
  onToggleGoogleSearch,
  onEditPersonality,
  onOpenSystemStatus,
  autoHideDelay = 5000, // Default 5 seconds
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [hasEntered, setHasEntered] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnected = connectionState === ConnectionState.CONNECTED;

  // Debounced mouse move handler for performance
  const handleMouseMoveDebounced = useDebounce((clientY: number) => {
    if (clientY <= 100) {
      setIsVisible(true);
      resetHideTimeout();
    }
  }, 50);

  const resetHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    setIsVisible(true);
    
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, autoHideDelay);
  }, [autoHideDelay]);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => {
      setHasEntered(true);
    });

    const handleInteraction = () => {
      resetHideTimeout();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY <= 100) {
        setIsVisible(true);
        resetHideTimeout();
      } else {
        handleMouseMoveDebounced(e.clientY);
      }
    };

    // Event listeners
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleInteraction, { passive: true });
    window.addEventListener('touchstart', handleInteraction, { passive: true });
    window.addEventListener('keydown', handleInteraction, { passive: true });

    // Start initial timer
    resetHideTimeout();

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, [resetHideTimeout, handleMouseMoveDebounced]);

  const disabledReason = isConnected ? "Déconnectez-vous pour modifier" : undefined;

  return (
    <>
      <header 
        className={`
          fixed top-0 left-0 w-full z-50 border-b
          bg-[#050508]/85 backdrop-blur-xl border-white/5 py-4
          transition-all duration-500 ease-out
          ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}
          ${hasEntered ? 'header-entered' : 'header-entering'}
        `}
        role="banner"
        aria-label="Navigation principale"
      >
        {/* Ambient Glow effect based on personality */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-32 opacity-[0.08] pointer-events-none blur-[60px] transition-all duration-700"
          style={{ 
            background: `radial-gradient(ellipse, ${currentPersonality.themeColor} 0%, transparent 70%)` 
          }}
        />

        {/* Subtle top border glow */}
        <div 
          className="absolute top-0 left-0 w-full h-[1px] opacity-30"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${currentPersonality.themeColor}50 50%, transparent 100%)`
          }}
        />

        <div className="max-w-[90rem] mx-auto px-6 flex items-center justify-between relative">
          
          {/* LEFT: Status Badge */}
          <div className="flex items-center z-10">
            <StatusBadge connectionState={connectionState} />
          </div>

          {/* RIGHT: Controls */}
          <nav className="flex items-center gap-4 z-10" aria-label="Contrôles">
            
            {/* AI Features Group - Always visible, disabled when connected */}
            <ControlGroup label="Fonctionnalités IA">
              <ControlButton 
                active={isGoogleSearchEnabled} 
                onClick={() => onToggleGoogleSearch(!isGoogleSearchEnabled)}
                icon={<Icons.Search />}
                label="Recherche Web"
                themeColor={currentPersonality.themeColor}
                disabled={isConnected}
                disabledReason={disabledReason}
              />
              <ControlButton 
                active={isFunctionCallingEnabled} 
                onClick={() => onToggleFunctionCalling(!isFunctionCallingEnabled)}
                icon={<Icons.Function />}
                label="Fonctions Avancées"
                themeColor={currentPersonality.themeColor}
                disabled={isConnected}
                disabledReason={disabledReason}
              />
              {onEditPersonality && (
                <>
                  <div className="w-[1px] h-6 bg-white/10 mx-1" />
                  <ControlButton 
                    active={false}
                    onClick={onEditPersonality}
                    icon={<Icons.Edit />}
                    label="Modifier Personnalité"
                    themeColor={currentPersonality.themeColor}
                    disabled={isConnected}
                    disabledReason={disabledReason}
                  />
                </>
              )}
            </ControlGroup>

            {/* System Status Button */}
            {onOpenSystemStatus && (
              <ControlGroup label="Système">
                <ControlButton 
                  active={false}
                  onClick={onOpenSystemStatus}
                  icon={<Icons.System />}
                  label="État du Système"
                  themeColor={currentPersonality.themeColor}
                />
              </ControlGroup>
            )}

            <SectionDivider />

            {/* Resources Group (Docs & Voice) */}
            <ControlGroup label="Ressources">
              <div className="relative group px-1">
                <DocumentUploader
                  documents={uploadedDocuments}
                  onDocumentsChange={onDocumentsChange}
                  disabled={isConnected}
                />
                {uploadedDocuments.length > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-lg ring-2 ring-black/50 transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: currentPersonality.themeColor }}
                  >
                    {uploadedDocuments.length}
                  </span>
                )}
              </div>
              
              <div className="w-[1px] h-6 bg-white/10 mx-1" />
              
              <div className={`
                transition-all duration-300 px-1
                ${isConnected ? 'opacity-40 grayscale cursor-not-allowed' : ''}
              `}>
                <Tooltip content={isConnected ? "Déconnectez-vous pour changer la voix" : "Sélectionner une voix"} position="bottom">
                  <div>
                    <VoiceSelector
                      currentVoice={selectedVoice}
                      onVoiceChange={onVoiceChange}
                      disabled={isConnected}
                    />
                  </div>
                </Tooltip>
              </div>
            </ControlGroup>
          </nav>
        </div>

        {/* Scanline Effect when connected */}
        {isConnected && (
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50">
            <div 
              className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-transparent via-current to-transparent opacity-75 blur-[2px] animate-scanLine"
              style={{ color: currentPersonality.themeColor }}
            />
          </div>
        )}

        {/* Bottom border glow when connected */}
        {isConnected && (
          <div 
            className="absolute bottom-0 left-0 w-full h-[2px] opacity-60"
            style={{
              background: `linear-gradient(90deg, transparent 10%, ${currentPersonality.themeColor} 50%, transparent 90%)`
            }}
          />
        )}
      </header>

      <style>{`
        @keyframes scanLine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        
        .animate-scanLine {
          animation: scanLine 3s linear infinite;
        }
        
        @keyframes ripple {
          0% {
            width: 0;
            height: 0;
            opacity: 0.5;
          }
          100% {
            width: 150px;
            height: 150px;
            opacity: 0;
          }
        }
        
        .animate-ripple {
          animation: ripple 0.6s ease-out forwards;
        }
        
        @keyframes headerSlideDown {
          0% { 
            transform: translateY(-100%); 
            opacity: 0; 
          }
          100% { 
            transform: translateY(0); 
            opacity: 1; 
          }
        }
        
        .header-entering {
          animation: headerSlideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        .header-entered {
          /* Animation complete, normal transitions take over */
        }
        
        @keyframes buttonGlow {
          0%, 100% { 
            filter: drop-shadow(0 0 3px var(--glow-color)); 
          }
          50% { 
            filter: drop-shadow(0 0 8px var(--glow-color)) drop-shadow(0 0 16px var(--glow-color)); 
          }
        }
        
        .animate-glow {
          animation: buttonGlow 2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};

export default Header;
