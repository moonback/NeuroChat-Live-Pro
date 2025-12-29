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
  onOpenAgentDashboard?: () => void;
}

// Memoized status pill
const StatusPill = memo(({ connectionState }: { connectionState: ConnectionState }) => {
  const configs = {
    [ConnectionState.CONNECTED]: {
      text: 'Connecté',
      styles: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40 shadow-[0_0_12px_rgba(16,185,129,0.1)]',
      dot: 'bg-emerald-400',
      animate: true
    },
    [ConnectionState.CONNECTING]: {
      text: 'Connexion...',
      styles: 'bg-amber-500/15 text-amber-300 border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.15)]',
      dot: 'bg-amber-400',
      animate: true
    },
    [ConnectionState.DISCONNECTED]: {
      text: 'Déconnecté',
      styles: 'bg-slate-900/70 text-slate-500 border-slate-700/40',
      dot: 'bg-slate-500',
      animate: false
    }
  };

  const config = configs[connectionState] || configs[ConnectionState.DISCONNECTED];

  return (
    <div 
      className={`flex items-center gap-1 px-2 py-1 rounded-full border backdrop-blur-[2px] transition-all duration-500 ${config.styles}`}
      role="status"
    >
      <div className="relative flex h-2 w-2">
        {config.animate && (
          <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${config.dot}`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`} />
      </div>
      <span className="text-xs font-semibold tracking-widest uppercase">{config.text}</span>
    </div>
  );
});

// Enhanced mobile action button with icon and label
const MobileActionButton = ({
  onClick,
  icon,
  tooltip,
  active,
  activeClass,
  label
}: {
  onClick: () => void;
  icon: React.ReactNode;
  tooltip?: string;
  active?: boolean;
  activeClass?: string;
  label?: string;
}) => (
  <button
    onClick={onClick}
    aria-label={tooltip}
    className={`
      flex flex-col items-center justify-center gap-2
      px-4 py-3.5 rounded-xl
      transition-all duration-200
      min-w-[90px] min-h-[90px]
      border backdrop-blur-sm
      active:scale-95
      ${
        active
          ? activeClass || 'bg-white/20 text-white border-white/30 shadow-lg'
          : 'text-slate-300 border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 hover:text-white'
      }
    `}
  >
    <div className={`${active ? 'scale-110' : ''} transition-transform duration-200`}>
      {icon}
    </div>
    {label && (
      <span className="text-[11px] font-semibold tracking-wide text-center leading-tight">
        {label}
      </span>
    )}
  </button>
);

// Desktop-only: Pro style action button
const ProActionButton = ({
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
      className={`
        px-3 py-2 rounded-xl border text-base font-semibold flex items-center gap-1
        transition-all duration-200 
        hover:scale-[1.07] active:scale-95 
        focus:outline-none
        ${active 
          ? `${activeClass} shadow-[0_2px_16px_rgba(16,185,129,0.13)]` 
          : 'text-slate-300 border-white/10 bg-white/0 hover:bg-white/8 hover:text-white hover:border-white/30 backdrop-blur-md'}
      `}
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
  onOpenAgentDashboard,
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
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ease-in-out px-2 md:px-8 py-1 ${isScrolled ? 'bg-[#101622c9] backdrop-blur-2xl border-b border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.22)] py-1' : 'bg-transparent'}`}
    >
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 transition-opacity duration-1000"
          style={{
            opacity: isConnected ? 0.14 : 0,
            background: `radial-gradient(circle at 45% 0%, ${currentPersonality.themeColor} 0%,transparent 65%)`
          }}
        />
      </div>

      {/* MOBILE HEADER */}
      <div className="md:hidden flex items-center justify-between max-w-full relative h-12">
        {/* Left (Brand + menu) */}
        <div className="flex items-center gap-1">
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
            <h1 className="text-[16px] font-black tracking-tight text-white flex items-center gap-1">
              <span className="bg-gradient-to-tr from-white via-sky-100 to-sky-400/80 bg-clip-text text-transparent">NEUROCHAT</span>
              <span className="text-[8px] px-1 py-0.5 rounded border border-sky-500/50 bg-sky-600/20 text-sky-300 font-bold tracking-widest ml-0.5 shadow-[0_0_8px_#0ea5e9aa]">
                PRO
              </span>
            </h1>
            <StatusPill connectionState={connectionState} />
          </div>
        </div>

        {/* Right: very compact voice selector and document badge */}
        <div className="flex items-center gap-1 ml-auto">
          {/* Voice Selector */}
          <div className={`${isConnected ? 'opacity-50 grayscale' : 'opacity-100'} transition-opacity duration-300`}>
            <VoiceSelector
              currentVoice={selectedVoice}
              onVoiceChange={onVoiceChange}
              disabled={isConnected}
              size="small"
            />
          </div>
          {/* Document badge */}
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
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md md:hidden flex flex-col animate-in fade-in duration-200"
            onClick={() => setShowMobileActions(false)}
          >
            {/* Prevent bubbling */}
            <div
              className="bg-gradient-to-b from-slate-900/95 via-slate-900/98 to-slate-900 border-b border-white/20 rounded-b-3xl shadow-2xl mx-2 mt-[52px] p-4 space-y-4 animate-in slide-in-from-top-3 duration-300 min-w-[min(320px,96vw)] max-w-md"
              onClick={e => e.stopPropagation()}
              style={{
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(14, 165, 233, 0.15)'
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="text-sm font-bold text-white/90 tracking-wide">Actions Rapides</h3>
                <button
                  onClick={() => setShowMobileActions(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Fermer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Actions group */}
              <div className="flex flex-row flex-wrap gap-3 justify-center py-1">
                {!isConnected && (
                  <>
                    <MobileActionButton
                      tooltip="Recherche Google"
                      label="Recherche"
                      active={isGoogleSearchEnabled}
                      onClick={() => {
                        onToggleGoogleSearch(!isGoogleSearchEnabled);
                        setShowMobileActions(false);
                      }}
                      activeClass="bg-emerald-500/25 text-emerald-200 border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                      icon={
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      }
                    />
                    <MobileActionButton
                      tooltip="Function Calling"
                      label="Fonctions"
                      active={isFunctionCallingEnabled}
                      onClick={() => {
                        onToggleFunctionCalling(!isFunctionCallingEnabled);
                        setShowMobileActions(false);
                      }}
                      activeClass="bg-blue-500/25 text-blue-200 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                      icon={
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                      }
                    />
                  </>
                )}
                {onEditPersonality && (
                  <MobileActionButton
                    tooltip="Modifier Personnalité"
                    label="Personnalité"
                    onClick={() => {
                      onEditPersonality();
                      setShowMobileActions(false);
                    }}
                    icon={
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    }
                  />
                )}
              </div>
              
              {/* Close button */}
              <button
                className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 text-white font-bold shadow-lg hover:from-sky-700 hover:to-sky-600 active:scale-[0.98] transition-all duration-200"
                onClick={() => setShowMobileActions(false)}
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DESKTOP HEADER */}
      <div className="hidden md:flex max-w-7xl xl:max-w-[90rem] mx-auto justify-between items-center min-h-[74px] py-1">
        {/* Left: Branding */}
        <div className="flex items-center gap-4 pointer-events-auto group">
          <div className="flex items-center gap-2.5 transition-transform duration-300 group-hover:scale-[1.015]">
            <span className="inline-block w-2 h-7 rounded-[4px] bg-gradient-to-b from-sky-400 via-purple-400/30 to-indigo-400/20 blur-[2px] shadow-xl opacity-80"></span>
            <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-3 select-none">
              <span className="bg-gradient-to-tr from-white via-sky-100 to-sky-400/80 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(70,190,255,0.28)] select-none">
                NEUROCHAT
              </span>
              <span className="text-[12px] px-3 py-1 rounded-xl border border-sky-500 bg-gradient-to-br from-sky-500/15 to-sky-600/15 text-sky-200 font-bold tracking-widest shadow-[0_0_18px_#0ea5e944] backdrop-blur-sm select-none cursor-pointer">
                PRO
              </span>
            </h1>
            <StatusPill connectionState={connectionState} />
          </div>
        </div>
        {/* Right: Actions */}
        <div className="flex items-center gap-4 pointer-events-auto">
          <div className="flex items-center gap-3.5 px-5 py-3 rounded-2xl bg-gradient-to-br from-white/8 via-white/2 to-white/1 border border-white/30 backdrop-blur-xl shadow-[0_8px_40px_0px_rgba(0,16,32,0.18)] hover:shadow-[0_12px_40px_0px_rgba(16,128,255,0.08)] transition-all duration-400 hover:border-white/40 hover:from-white/16 hover:via-white/10 hover:to-white/2">
            {/* AI Tools Group */}
            {!isConnected && (
              <>
                <div className="flex items-center gap-2 mr-2">
                  <ProActionButton
                    tooltip="Google Search"
                    active={isGoogleSearchEnabled}
                    onClick={() => onToggleGoogleSearch(!isGoogleSearchEnabled)}
                    activeClass="bg-emerald-600/25 text-emerald-300 border-emerald-500/50 shadow-[0_0_18px_rgba(16,185,129,0.30)]"
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                  />
                  <ProActionButton
                    tooltip="Function Calling"
                    active={isFunctionCallingEnabled}
                    onClick={() => onToggleFunctionCalling(!isFunctionCallingEnabled)}
                    activeClass="bg-blue-500/25 text-blue-300 border-blue-500/40 shadow-[0_0_18px_rgba(59,130,246,0.28)]"
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>}
                  />
                </div>
                <div className="w-[1px] h-8 bg-gradient-to-b from-transparent via-white/30 to-transparent mx-2 opacity-60" />
              </>
            )}

            {/* Document Manager */}
            <div className="relative ml-1">
              <DocumentUploader
                documents={uploadedDocuments}
                onDocumentsChange={onDocumentsChange}
                disabled={isConnected}
              />
              {uploadedDocuments.length > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-xs font-bold text-white ring-2 ring-black/40 shadow-lg animate-in zoom-in select-none pointer-events-none">
                  {uploadedDocuments.length}
                </span>
              )}
            </div>

            {/* Voice & Personality */}
            <div className="w-[1px] h-8 bg-gradient-to-b from-transparent via-white/25 to-transparent mx-2 opacity-60" />

            <div className={`transition-all duration-300 ${isConnected ? 'opacity-50 grayscale' : 'opacity-100'}`}>
              <VoiceSelector
                currentVoice={selectedVoice}
                onVoiceChange={onVoiceChange}
                disabled={isConnected}
              />
            </div>

            {onEditPersonality && (
              <>
                <div className="w-[1px] h-8 bg-gradient-to-b from-transparent via-white/25 to-transparent mx-2 opacity-60" />
                <ProActionButton
                  tooltip="Modifier Personnalité"
                  onClick={onEditPersonality}
                  activeClass="bg-pink-600/15 text-pink-300 border-pink-400/40 shadow-[0_0_10px_rgba(244,114,182,0.20)]"
                  icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                />
              </>
            )}

            {onOpenAgentDashboard && (
              <>
                <div className="w-[1px] h-8 bg-gradient-to-b from-transparent via-white/25 to-transparent mx-2 opacity-60" />
                <ProActionButton
                  tooltip="Agents Autonomes"
                  onClick={onOpenAgentDashboard}
                  activeClass="bg-indigo-600/25 text-indigo-300 border-indigo-400/40 shadow-[0_0_18px_rgba(99,102,241,0.30)]"
                  icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.393 1.393c.412.412.412 1.08 0 1.492l-1.57 1.57a1.5 1.5 0 01-1.492 0L5 14.5" /></svg>}
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
          className="absolute bottom-0 left-0 w-full h-[2px] overflow-hidden"
          style={{ background: `${currentPersonality.themeColor}2c` }}
        >
          <div
            className="w-1/3 h-full animate-[scanLine_2.7s_linear_infinite]"
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