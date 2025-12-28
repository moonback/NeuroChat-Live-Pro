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

// Memoized status pill
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
      className={`flex items-center gap-[2px] px-1.5 py-0.5 md:px-2 md:py-0.5 rounded-full border backdrop-blur-md transition-all duration-500 ${config.styles}`}
      role="status"
    >
      <div className="relative flex h-1 w-1 md:h-1.5 md:w-1.5">
        {config.animate && (
          <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${config.dot}`} />
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 md:h-2 md:w-2 ${config.dot}`} />
      </div>
      <span className="text-[9px] md:text-[10px] font-bold tracking-widest uppercase">{config.text}</span>
    </div>
  );
});

// Simple icon-only action button for mobile
const MobileActionButton = ({
  onClick,
  icon,
  tooltip,
  active,
  activeClass
}: {
  onClick: () => void;
  icon: React.ReactNode;
  tooltip?: string;
  active?: boolean;
  activeClass?: string;
}) => (
  <Tooltip content={tooltip || ''} position="bottom">
    <button
      onClick={onClick}
      aria-label={tooltip}
      className={`p-2 rounded-full transition hover:scale-110 duration-200 ${
        active
          ? activeClass || 'bg-white text-black'
          : 'text-slate-400 hover:bg-white/10'
      }`}
    >
      {icon}
    </button>
  </Tooltip>
);

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
      className={`p-2 rounded-lg transition-all duration-300 border hover:scale-110 active:scale-95 ${
        active 
          ? `${activeClass} shadow-lg` 
          : 'text-slate-300 border-white/10 hover:bg-white/8 hover:text-white hover:border-white/20'
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
  const [showMobileActions, setShowMobileActions] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mobile: toggle menu drawer
  const handleMobileToggle = () => setShowMobileActions(s => !s);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ease-in-out px-2 md:px-6 py-1 md:py-2.5 ${
        isScrolled
          ? 'bg-black/80 backdrop-blur-xl border-b border-white/10 py-1 md:py-2'
          : 'bg-transparent'
      }`}
    >
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 transition-opacity duration-1000"
          style={{
            opacity: isConnected ? 0.18 : 0,
            background: `radial-gradient(circle at 50% 0%, ${currentPersonality.themeColor}, transparent 70%)`
          }}
        />
      </div>

      {/* MOBILE HEADER */}
      <div className="md:hidden flex items-center justify-between max-w-full relative h-12">
        {/* Left (Brand + menu) */}
        <div className="flex items-center gap-1">
          {/* Menu/hamburger for extra settings/tools */}
          <button
            aria-label="Show menu"
            className="p-2 rounded-full text-sky-400 hover:bg-white/10 focus:outline-none"
            onClick={handleMobileToggle}
          >
            <svg width="21" height="21" viewBox="0 0 21 21" fill="none">
              <rect x="4" y="6" width="13" height="1.5" rx=".4" fill="currentColor"/>
              <rect x="4" y="10" width="13" height="1.5" rx=".4" fill="currentColor"/>
              <rect x="4" y="14" width="13" height="1.5" rx=".4" fill="currentColor"/>
            </svg>
          </button>
          <div className="flex items-center gap-0.5">
            <h1 className="text-[16px] font-black tracking-tighter text-white flex items-center gap-1">
              <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">NEUROCHAT</span>
              <span className="text-[8px] px-1 py-0.5 rounded border border-sky-500/50 bg-sky-500/10 text-sky-400 font-bold tracking-widest">
                PRO
              </span>
            </h1>
            <StatusPill connectionState={connectionState} />
          </div>
        </div>

        {/* Right: very compact voice selector and document badge */}
        <div className="flex items-center gap-1 ml-auto">
          {/* Voice Selector, shrunk */}
          <div className={`${isConnected ? 'opacity-50 grayscale' : 'opacity-100'} transition-opacity duration-300`}>
            <VoiceSelector
              currentVoice={selectedVoice}
              onVoiceChange={onVoiceChange}
              disabled={isConnected}
              size="small"
            />
          </div>
          {/* Document badge only clickable */}
          <div className="relative flex items-center">
            <DocumentUploader
              documents={uploadedDocuments}
              onDocumentsChange={onDocumentsChange}
              disabled={isConnected}
              compact
            />
            {uploadedDocuments.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-indigo-500 text-[7px] font-bold text-white ring-1 ring-black">
                {uploadedDocuments.length}
              </span>
            )}
          </div>
        </div>

        {/* Mobile slide-down/overlay for actions */}
        {showMobileActions && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden flex flex-col"
            onClick={() => setShowMobileActions(false)}
          >
            {/* Prevent bubbling */}
            <div
              className="bg-slate-900 border-b border-white/10 rounded-b-2xl shadow-2xl mx-2 mt-[52px] p-3 space-y-3 animate-in slide-in-from-top-2 min-w-[min(300px,96vw)]"
              onClick={e => e.stopPropagation()}
            >
              {/* Actions group */}
              <div className="flex flex-row flex-wrap gap-2 justify-center">
                {!isConnected && (
                  <>
                    <MobileActionButton
                      tooltip="Recherche Google"
                      active={isGoogleSearchEnabled}
                      onClick={() => {
                        onToggleGoogleSearch(!isGoogleSearchEnabled);
                        setShowMobileActions(false);
                      }}
                      activeClass="bg-emerald-500/30 text-emerald-300"
                      icon={
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      }
                    />
                    <MobileActionButton
                      tooltip="Function Calling"
                      active={isFunctionCallingEnabled}
                      onClick={() => {
                        onToggleFunctionCalling(!isFunctionCallingEnabled);
                        setShowMobileActions(false);
                      }}
                      activeClass="bg-blue-500/30 text-blue-300"
                      icon={
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                      }
                    />
                  </>
                )}
                {onEditPersonality && (
                  <MobileActionButton
                    tooltip="Modifier Personnalité"
                    onClick={() => {
                      onEditPersonality();
                      setShowMobileActions(false);
                    }}
                    icon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    }
                  />
                )}
                {/* Add other quick actions here as needed */}
              </div>
              <button
                className="w-full py-2 mt-3 rounded-xl bg-sky-600 text-white font-bold shadow-inner hover:bg-sky-700 active:bg-sky-800 transition"
                onClick={() => setShowMobileActions(false)}
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DESKTOP HEADER */}
      <div className="hidden md:flex max-w-7xl mx-auto justify-between items-center min-h-[64px] py-2">
        {/* Left: Branding */}
        <div className="flex items-center gap-3 pointer-events-auto group">
          <div className="flex items-center gap-2.5 transition-transform duration-300 group-hover:scale-[1.02]">
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                NEUROCHAT
              </span>
              <span className="text-[10px] px-2 py-1 rounded-md border border-sky-500/60 bg-gradient-to-br from-sky-500/20 to-sky-600/10 text-sky-300 font-bold tracking-widest shadow-[0_0_12px_rgba(14,165,233,0.2)] backdrop-blur-sm">
                PRO
              </span>
            </h1>
            <StatusPill connectionState={connectionState} />
          </div>
        </div>
        {/* Right: Actions */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-gradient-to-br from-white/8 via-white/5 to-white/3 border border-white/20 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] transition-all duration-500 hover:border-white/30 hover:from-white/12 hover:via-white/8 hover:to-white/5">
            {/* AI Tools Group */}
            {!isConnected && (
              <>
                <div className="flex items-center gap-1.5">
                  <ControlButton
                    tooltip="Google Search"
                    active={isGoogleSearchEnabled}
                    onClick={() => onToggleGoogleSearch(!isGoogleSearchEnabled)}
                    activeClass="bg-emerald-500/25 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                  />
                  <ControlButton
                    tooltip="Function Calling"
                    active={isFunctionCallingEnabled}
                    onClick={() => onToggleFunctionCalling(!isFunctionCallingEnabled)}
                    activeClass="bg-blue-500/25 text-blue-300 border-blue-500/40 shadow-[0_0_12px_rgba(59,130,246,0.3)]"
                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>}
                  />
                </div>
                <div className="w-[1px] h-6 bg-gradient-to-b from-transparent via-white/20 to-transparent mx-1" />
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
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-[9px] font-bold text-white ring-2 ring-black/50 shadow-lg animate-in zoom-in">
                  {uploadedDocuments.length}
                </span>
              )}
            </div>

            {/* Voice & Personality */}
            <div className="w-[1px] h-6 bg-gradient-to-b from-transparent via-white/20 to-transparent mx-1" />

            <div className={`transition-all duration-300 ${isConnected ? 'opacity-50 grayscale' : 'opacity-100'}`}>
              <VoiceSelector
                currentVoice={selectedVoice}
                onVoiceChange={onVoiceChange}
                disabled={isConnected}
              />
            </div>

            {onEditPersonality && (
              <>
                <div className="w-[1px] h-6 bg-gradient-to-b from-transparent via-white/20 to-transparent mx-1" />
                <ControlButton
                  tooltip="Modifier Personnalité"
                  onClick={onEditPersonality}
                  activeClass=""
                  icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                />
              </>
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