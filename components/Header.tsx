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

// --- Icons ---
const Icons = {
  Menu: () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  ),
  Close: () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Search: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  ),
  Function: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
    </svg>
  ),
  Edit: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
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
    <div className="group flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/20 border border-white/5 backdrop-blur-sm transition-all duration-300 hover:bg-black/40">
      <div className="relative flex h-2 w-2">
        {(isConnected || isConnecting) && (
          <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${config.colorClass}`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.colorClass} ${config.glow}`} />
      </div>
      <span className={`text-[10px] font-bold tracking-[0.15em] ${config.textClass} transition-colors duration-300`}>
        {config.label}
      </span>
    </div>
  );
});

// 2. Control Button (Desktop)
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
          relative group flex items-center justify-center w-9 h-9 rounded-xl
          transition-all duration-300 ease-out
          border
          ${active 
            ? 'bg-white/10 text-white border-white/20 shadow-lg' 
            : 'bg-transparent text-zinc-400 border-transparent hover:bg-white/5 hover:text-zinc-200'
          }
        `}
        style={active ? { borderColor: `${themeColor}40`, boxShadow: `0 0 15px ${themeColor}20` } : {}}
      >
        <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
          {icon}
        </div>
        {active && (
          <span 
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
            style={{ backgroundColor: themeColor }}
          />
        )}
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
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isConnected = connectionState === ConnectionState.CONNECTED;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Base styles for the header container
  const headerBaseClass = `
    fixed top-0 left-0 w-full z-50 transition-all duration-500 border-b
    ${isScrolled 
      ? 'bg-[#050508]/80 backdrop-blur-xl border-white/5 py-2' 
      : 'bg-transparent border-transparent py-3 md:py-4'
    }
  `;

  return (
    <>
      <header className={headerBaseClass}>
        {/* Ambient Glow effect based on personality */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-32 opacity-[0.08] pointer-events-none blur-[60px]"
          style={{ 
            background: `radial-gradient(circle, ${currentPersonality.themeColor} 0%, transparent 70%)` 
          }}
        />

        <div className="max-w-[90rem] mx-auto px-4 md:px-6 flex items-center justify-between relative">
          
          {/* LEFT: Identity */}
          <div className="flex items-center gap-3 md:gap-4 z-10">
             {/* Mobile Menu Trigger */}
             <button 
              className="md:hidden -ml-2 p-2 text-zinc-400 hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Icons.Menu />
            </button>

            <div className="flex flex-col items-start leading-none select-none">
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-black tracking-tight text-white/90 font-sans">
                  NEUROCHAT
                </h1>
                <span 
                  className="text-[9px] px-1.5 py-0.5 rounded-[4px] font-bold tracking-widest uppercase border border-white/10 text-white/60 bg-white/5 backdrop-blur-sm"
                  style={{ borderColor: `${currentPersonality.themeColor}40`, color: isConnected ? currentPersonality.themeColor : undefined }}
                >
                  PRO
                </span>
              </div>
            </div>

            <div className="hidden md:block h-6 w-[1px] bg-white/10 mx-1" />
            <div className="hidden md:block">
              <StatusBadge connectionState={connectionState} />
            </div>
          </div>

          {/* CENTER: Status (Mobile Only) */}
          <div className="md:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
             <StatusBadge connectionState={connectionState} />
          </div>

          {/* RIGHT: Controls (Desktop) */}
          <div className="hidden md:flex items-center gap-4 z-10">
            {/* Context Aware Controls */}
            {!isConnected && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md">
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
                    <div className="w-[1px] h-4 bg-white/10 mx-1" />
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

            {/* Resources (Docs & Voice) */}
            <div className="flex items-center gap-3 pl-3 border-l border-white/10">
              <div className="relative group">
                <DocumentUploader
                  documents={uploadedDocuments}
                  onDocumentsChange={onDocumentsChange}
                  disabled={isConnected}
                />
                {uploadedDocuments.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-bold text-white shadow-lg ring-2 ring-black">
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

          {/* RIGHT: Controls (Mobile) */}
          <div className="md:hidden flex items-center z-10">
            <div className="relative">
              <DocumentUploader
                documents={uploadedDocuments}
                onDocumentsChange={onDocumentsChange}
                disabled={isConnected}
                compact
              />
              {uploadedDocuments.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-indigo-500 text-[6px] font-bold text-white ring-1 ring-black">
                  {uploadedDocuments.length}
                </span>
              )}
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

      {/* MOBILE MENU OVERLAY */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Drawer */}
          <div className="absolute right-0 top-0 bottom-0 w-[80%] max-w-sm bg-[#0a0a0c] border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <span className="text-sm font-bold text-zinc-400 tracking-wider uppercase">Menu</span>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 -mr-2 text-zinc-400 hover:text-white"
              >
                <Icons.Close />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-8">
              {/* Section 1: Voice */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Voix & Audio</h3>
                <div className={`${isConnected ? 'opacity-50 pointer-events-none' : ''}`}>
                   <VoiceSelector
                    currentVoice={selectedVoice}
                    onVoiceChange={onVoiceChange}
                    disabled={isConnected}
                    size="small"
                  />
                </div>
              </div>

              {/* Section 2: Tools */}
              {!isConnected && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Outils IA</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        onToggleGoogleSearch(!isGoogleSearchEnabled);
                        setMobileMenuOpen(false);
                      }}
                      className={`
                        flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all
                        ${isGoogleSearchEnabled 
                          ? 'bg-white/10 border-white/20 text-white' 
                          : 'bg-white/5 border-transparent text-zinc-400 hover:bg-white/10'
                        }
                      `}
                    >
                      <Icons.Search />
                      <span className="text-xs font-medium">Recherche</span>
                    </button>

                    <button
                      onClick={() => {
                        onToggleFunctionCalling(!isFunctionCallingEnabled);
                        setMobileMenuOpen(false);
                      }}
                      className={`
                        flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all
                        ${isFunctionCallingEnabled 
                          ? 'bg-white/10 border-white/20 text-white' 
                          : 'bg-white/5 border-transparent text-zinc-400 hover:bg-white/10'
                        }
                      `}
                    >
                      <Icons.Function />
                      <span className="text-xs font-medium">Fonctions</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Section 3: Personality */}
              {onEditPersonality && !isConnected && (
                <div className="pt-4 border-t border-white/5">
                  <button
                    onClick={() => {
                      onEditPersonality();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center w-full gap-3 p-3 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-white/5 hover:border-white/20 text-indigo-300 transition-all"
                  >
                    <Icons.Edit />
                    <span className="text-sm font-medium">Modifier la Personnalité</span>
                  </button>
                </div>
              )}
            </div>
            
            <div className="p-5 border-t border-white/5">
               <div className="text-[10px] text-zinc-600 text-center font-mono">
                  NEUROCHAT SYSTEM v2.0
               </div>
            </div>
          </div>
        </div>
      )}

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