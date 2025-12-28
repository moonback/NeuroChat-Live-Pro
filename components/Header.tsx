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
}

// --- Sous-composants mémoïsés pour la performance ---

const StatusPill = memo(({ connectionState }: { connectionState: ConnectionState }) => {
  const configs = {
    [ConnectionState.CONNECTED]: {
      text: 'Connecté',
      styles: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/50 shadow-[0_0_16px_rgba(16,185,129,0.2)]',
      dot: 'bg-emerald-400',
      animate: true
    },
    [ConnectionState.CONNECTING]: {
      text: 'Connexion...',
      styles: 'bg-amber-500/15 text-amber-300 border-amber-400/50 shadow-[0_0_16px_rgba(245,158,11,0.2)]',
      dot: 'bg-amber-400',
      animate: true
    },
    [ConnectionState.DISCONNECTED]: {
      text: 'Déconnecté',
      styles: 'bg-slate-800/40 text-slate-400 border-slate-700/50',
      dot: 'bg-slate-500',
      animate: false
    }
  };

  const config = configs[connectionState] || configs[ConnectionState.DISCONNECTED];

  return (
    <div 
      className={`flex items-center gap-1 md:gap-2 px-2 py-0.5 md:px-3 md:py-1 rounded-full border backdrop-blur-md transition-all duration-500 ${config.styles}`}
      role="status"
    >
      <div className="relative flex h-1.5 w-1.5 md:h-2 md:w-2">
        {config.animate && (
          <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${config.dot}`} />
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 md:h-2 md:w-2 ${config.dot}`} />
      </div>
      <span className="text-[9px] md:text-xs font-bold tracking-widest uppercase">{config.text}</span>
    </div>
  );
});

const ControlButton = ({ 
  onClick, 
  active, 
  icon, 
  activeClass, 
  tooltip 
}: { 
  onClick: () => void; 
  active?: boolean; 
  icon: React.ReactNode; 
  activeClass: string;
  tooltip: string;
}) => (
  <Tooltip content={tooltip} position="bottom">
    <button
      onClick={onClick}
      className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-all duration-300 border hover:scale-110 active:scale-95 ${
        active 
          ? `${activeClass} shadow-lg` 
          : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white'
      }`}
    >
      {icon}
    </button>
  </Tooltip>
);

// --- Composant Principal ---

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
  onOpenToolsList,
  onEditPersonality,
}) => {
  const isConnected = connectionState === ConnectionState.CONNECTED;
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ease-in-out px-2 md:px-10 py-2 md:py-4 ${
        isScrolled 
          ? 'bg-black/80 backdrop-blur-xl border-b border-white/10 py-1.5 md:py-3' 
          : 'bg-transparent'
      }`}
    >
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ 
            opacity: isConnected ? 0.15 : 0,
            background: `radial-gradient(circle at 50% 0%, ${currentPersonality.themeColor}, transparent 70%)` 
          }} 
        />
      </div>

      <div className="max-w-7xl mx-auto flex justify-between items-center">
        
        {/* Left: Branding */}
        <div className="flex flex-col gap-0.5 md:gap-1 pointer-events-auto group">
          <div className="flex items-center gap-1.5 md:gap-3">
            <h1 className="text-lg md:text-2xl font-black tracking-tighter text-white flex items-center gap-1 md:gap-2">
              <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                NEUROCHAT
              </span>
              <span className="text-[8px] md:text-[10px] px-1.5 md:px-2 py-0.5 rounded border border-sky-500/50 bg-sky-500/10 text-sky-400 font-bold tracking-widest">
                PRO
              </span>
            </h1>
            <div className="hidden md:block">
              <StatusPill connectionState={connectionState} />
            </div>
          </div>
          {/* Mobile Status Only */}
          <div className="md:hidden">
            <StatusPill connectionState={connectionState} />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 md:gap-4 pointer-events-auto">
          <div className="flex items-center gap-1 md:gap-1.5 p-1 md:p-1.5 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl">
            
            {/* AI Tools Group */}
            {!isConnected && (
              <>
                <ControlButton 
                  tooltip="Google Search"
                  active={isGoogleSearchEnabled}
                  onClick={() => onToggleGoogleSearch(!isGoogleSearchEnabled)}
                  activeClass="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  icon={<svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                />
                <ControlButton 
                  tooltip="Function Calling"
                  active={isFunctionCallingEnabled}
                  onClick={() => onToggleFunctionCalling(!isFunctionCallingEnabled)}
                  activeClass="bg-blue-500/20 text-blue-400 border-blue-500/30"
                  icon={<svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>}
                />
                <div className="w-px h-5 md:h-6 bg-white/10 mx-0.5 md:mx-1" />
              </>
            )}

            {/* Document Manager */}
            <div className="relative">
              <DocumentUploader
                documents={uploadedDocuments}
                onDocumentsChange={onDocumentsChange}
                disabled={isConnected}
              />
              {uploadedDocuments.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 md:-top-1 md:-right-1 flex h-3.5 w-3.5 md:h-4 md:w-4 items-center justify-center rounded-full bg-indigo-500 text-[8px] md:text-[9px] font-bold text-white ring-1 md:ring-2 ring-black animate-in zoom-in">
                  {uploadedDocuments.length}
                </span>
              )}
            </div>

            {/* Voice & Personality */}
            <div className="w-px h-5 md:h-6 bg-white/10 mx-0.5 md:mx-1" />
            
            <div className={`transition-opacity duration-300 ${isConnected ? 'opacity-50 grayscale' : 'opacity-100'}`}>
              <VoiceSelector
                currentVoice={selectedVoice}
                onVoiceChange={onVoiceChange}
                disabled={isConnected}
              />
            </div>

            {onEditPersonality && (
              <ControlButton 
                tooltip="Modifier Personnalité"
                onClick={onEditPersonality}
                activeClass="" 
                icon={<svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
              />
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scanLine {
          0% { transform: translateX(-100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateX(300%); opacity: 0; }
        }
      `}</style>
      
      {/* Animated Bottom Border Glow */}
      {isConnected && (
        <div 
          className="absolute bottom-0 left-0 w-full h-[1px] overflow-hidden"
          style={{ background: `${currentPersonality.themeColor}33` }}
        >
          <div 
            className="w-1/3 h-full animate-[scanLine_3s_linear_infinite]"
            style={{ 
              background: `linear-gradient(90deg, transparent, ${currentPersonality.themeColor}, transparent)` 
            }}
          />
        </div>
      )}
    </header>
  );
};

export default Header;