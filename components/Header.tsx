import React, { useState, useEffect, memo } from 'react';
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
}

// --- Icons ---
const Icons = {
  Search: () => (
    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  ),
  Function: () => (
    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
    </svg>
  ),
  Edit: () => (
    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
    </svg>
  ),
  System: () => (
    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
};

// --- Sub-Components ---

// 1. Sleek Status Badge
const StatusBadge = memo(({ connectionState }: { connectionState: ConnectionState }) => {
  const statusConfig = {
    [ConnectionState.CONNECTED]: {
      label: 'ONLINE',
      colorClass: 'bg-emerald-500',
      textClass: 'text-emerald-400',
      glow: 'shadow-[0_0_10px_rgba(16,185,129,0.4)]'
    },
    [ConnectionState.CONNECTING]: {
      label: 'SYNC...',
      colorClass: 'bg-amber-500',
      textClass: 'text-amber-400',
      glow: 'shadow-[0_0_10px_rgba(245,158,11,0.4)]'
    },
    [ConnectionState.DISCONNECTED]: {
      label: 'OFFLINE',
      colorClass: 'bg-zinc-600',
      textClass: 'text-zinc-500',
      glow: ''
    }
  };

  const config = statusConfig[connectionState] || statusConfig[ConnectionState.DISCONNECTED];
  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isConnecting = connectionState === ConnectionState.CONNECTING;

  return (
    <div className="group flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2 rounded-full bg-black/20 border border-white/5 backdrop-blur-sm transition-all duration-300 hover:bg-black/40">
      <div className="relative flex h-3 w-3 sm:h-3 sm:w-3">
        {(isConnected || isConnecting) && (
          <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${config.colorClass}`} />
        )}
        <span className={`relative inline-flex rounded-full h-3 w-3 sm:h-3 sm:w-3 ${config.colorClass} ${config.glow}`} />
      </div>
      <span className={`text-sm sm:text-sm font-bold tracking-[0.1em] sm:tracking-[0.15em] ${config.textClass} transition-colors duration-300`}>
        {config.label}
      </span>
    </div>
  );
});

// 2. Enhanced Control Button
const ControlButton = ({ 
  active, 
  onClick, 
  icon, 
  label, 
  themeColor 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string;
  themeColor: string;
}) => {
  return (
    <Tooltip content={label} position="bottom">
      <button
        onClick={onClick}
        className={`
          relative group flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl
          transition-all duration-300 ease-out
          border-2 overflow-hidden touch-manipulation
          ${active 
            ? 'text-white shadow-xl scale-105' 
            : 'text-zinc-400 border-transparent hover:text-zinc-200 hover:scale-105 active:scale-95'
          }
        `}
        style={active ? { 
          borderColor: `${themeColor}60`, 
          backgroundColor: `${themeColor}15`,
          boxShadow: `0 0 20px ${themeColor}30, inset 0 0 20px ${themeColor}10` 
        } : {
          borderColor: 'transparent',
          backgroundColor: 'transparent'
        }}
      >
        {/* Animated background gradient */}
        <div 
          className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${active ? 'opacity-100' : ''}`}
          style={{
            background: active 
              ? `linear-gradient(135deg, ${themeColor}20 0%, ${themeColor}05 100%)`
              : `linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 100%)`
          }}
        />
        
        {/* Icon with enhanced styling */}
        <div className={`relative z-10 transition-all duration-300 ${active ? 'scale-110 drop-shadow-lg' : 'group-hover:scale-110'}`}>
          {icon}
        </div>
        
        {/* Active indicator with glow */}
        {active && (
          <>
            <span 
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full z-10"
              style={{ 
                backgroundColor: themeColor,
                boxShadow: `0 0 8px ${themeColor}, 0 0 16px ${themeColor}40`
              }}
            />
            <div 
              className="absolute inset-0 rounded-xl opacity-20 blur-md"
              style={{ backgroundColor: themeColor }}
            />
          </>
        )}
        
        {/* Hover ripple effect */}
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div 
            className="absolute inset-0 rounded-xl"
            style={{
              background: `radial-gradient(circle at center, ${themeColor}20 0%, transparent 70%)`
            }}
          />
        </div>
      </button>
    </Tooltip>
  );
};

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
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const isConnected = connectionState === ConnectionState.CONNECTED;

  useEffect(() => {
    // Cache automatiquement le header après 3 secondes d'inactivité
    let hideTimeout: NodeJS.Timeout;
    
    const resetHideTimeout = () => {
      clearTimeout(hideTimeout);
      setIsVisible(true);
      
      hideTimeout = setTimeout(() => {
        setIsVisible(false);
      }, 3000); // Cache après 3 secondes
    };

    // Réinitialise le timer lors des interactions
    const handleInteraction = () => {
      resetHideTimeout();
    };

    // Détecte quand la souris est dans la zone du header (même s'il est caché)
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY <= 80) { // Zone du header (environ 80px du haut)
        setIsVisible(true);
        resetHideTimeout();
      } else {
        handleInteraction();
      }
    };

    // Événements qui réinitialisent le timer
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleInteraction, { passive: true });
    window.addEventListener('touchstart', handleInteraction, { passive: true });
    window.addEventListener('keydown', handleInteraction, { passive: true });

    // Démarrer le timer initial
    resetHideTimeout();

    return () => {
      clearTimeout(hideTimeout);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  // Base styles for the header container
  const headerBaseClass = `
    fixed top-0 left-0 w-full z-50 transition-all duration-500 border-b
    bg-[#050508]/80 backdrop-blur-xl border-white/5 py-3 sm:py-3 md:py-4
    ${isVisible ? 'translate-y-0' : '-translate-y-full'}
  `;

  return (
    <>
      <header className={headerBaseClass}>
        {/* Ambient Glow effect based on personality */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-24 sm:h-32 opacity-[0.08] pointer-events-none blur-[60px]"
          style={{ 
            background: `radial-gradient(circle, ${currentPersonality.themeColor} 0%, transparent 70%)` 
          }}
        />

        <div className="max-w-[90rem] mx-auto px-4 sm:px-4 md:px-6 flex items-center justify-between relative gap-3 sm:gap-4">
          
          {/* LEFT: Status Badge */}
          <div className="flex items-center z-10 flex-shrink-0">
            <StatusBadge connectionState={connectionState} />
          </div>

          {/* RIGHT: Controls */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 z-10 flex-wrap justify-end min-w-0">
            {/* Context Aware Controls */}
            {!isConnected && (
              <div className="hidden sm:flex items-center gap-2 sm:gap-3 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-md shadow-lg">
                <ControlButton 
                  active={isGoogleSearchEnabled} 
                  onClick={() => onToggleGoogleSearch(!isGoogleSearchEnabled)}
                  icon={<Icons.Search />}
                  label="Recherche Web"
                  themeColor={currentPersonality.themeColor}
                />
                <ControlButton 
                  active={isFunctionCallingEnabled} 
                  onClick={() => onToggleFunctionCalling(!isFunctionCallingEnabled)}
                  icon={<Icons.Function />}
                  label="Fonctions Avancées"
                  themeColor={currentPersonality.themeColor}
                />
                {onEditPersonality && (
                  <>
                    <div className="w-[1px] h-4 sm:h-6 bg-white/10 mx-0.5 sm:mx-1" />
                    <ControlButton 
                      active={false}
                      onClick={onEditPersonality}
                      icon={<Icons.Edit />}
                      label="Modifier Personnalité"
                      themeColor={currentPersonality.themeColor}
                    />
                  </>
                )}
              </div>
            )}

            {/* System Status Button - Always visible */}
            {onOpenSystemStatus && (
              <div className="hidden md:flex items-center gap-2 sm:gap-3 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-md shadow-lg">
                <ControlButton 
                  active={false}
                  onClick={onOpenSystemStatus}
                  icon={<Icons.System />}
                  label="État du Système"
                  themeColor={currentPersonality.themeColor}
                />
              </div>
            )}

            {/* Resources (Docs & Voice) */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 pl-2 sm:pl-3 md:pl-4 border-l border-white/10">
              <div className="relative group">
                <DocumentUploader
                  documents={uploadedDocuments}
                  onDocumentsChange={onDocumentsChange}
                  disabled={isConnected}
                />
                {uploadedDocuments.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-indigo-500 text-[9px] sm:text-[10px] font-bold text-white shadow-lg ring-2 ring-black">
                    {uploadedDocuments.length}
                  </span>
                )}
              </div>
              
              <div className={`${isConnected ? 'opacity-50 grayscale cursor-not-allowed' : ''} transition-all duration-300`}>
                <VoiceSelector
                  currentVoice={selectedVoice}
                  onVoiceChange={onVoiceChange}
                  disabled={isConnected}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Scanline Effect when connected */}
        {isConnected && (
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50">
             <div 
               className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-transparent via-current to-transparent opacity-75 blur-[2px] animate-[scanLine_3s_linear_infinite]"
               style={{ color: currentPersonality.themeColor }}
             />
          </div>
        )}
      </header>

      <style>{`
        @keyframes scanLine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </>
  );
};

export default Header;