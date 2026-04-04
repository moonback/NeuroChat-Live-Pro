import { useState, useEffect, memo, useCallback, useRef } from 'react';
import { ConnectionState, type Personality } from '../types';
import Tooltip from './Tooltip';
import DocumentUploader from './DocumentUploader';
import type { ProcessedDocument } from '../utils/documentProcessor';

interface HeaderProps {
  connectionState: ConnectionState;
  currentPersonality: Personality;
  uploadedDocuments: ProcessedDocument[];
  isFunctionCallingEnabled?: boolean;
  isGoogleSearchEnabled?: boolean;
  onDocumentsChange: (documents: ProcessedDocument[]) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onOpenToolsList: () => void;
  onOpenSystemStatus?: () => void;
  onOpenConclusions?: () => void;
  onOpenHistory?: () => void;
  autoHideDelay?: number;
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const SystemIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const FileTextIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);
const HistoryIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusDot = memo(({ state }: { state: ConnectionState }) => {
  const config = {
    [ConnectionState.CONNECTED]: { dot: 'bg-emerald-500', pulse: true, label: 'ACTIF', text: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/15' },
    [ConnectionState.CONNECTING]: { dot: 'bg-amber-400', pulse: true, label: 'SYNC...', text: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/15' },
    [ConnectionState.DISCONNECTED]: { dot: 'bg-zinc-600', pulse: false, label: 'OFFLINE', text: 'text-zinc-500', bg: 'bg-zinc-800/50 border-zinc-700/30' },
    [ConnectionState.ERROR]: { dot: 'bg-red-500', pulse: true, label: 'ERREUR', text: 'text-red-400', bg: 'bg-red-500/10 border-red-500/15' },
  }[state] ?? { dot: 'bg-zinc-600', pulse: false, label: 'OFFLINE', text: 'text-zinc-500', bg: 'bg-zinc-800/50 border-zinc-700/30' };

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bg} transition-all duration-300`}>
      <div className="relative flex h-1.5 w-1.5">
        {config.pulse && <span className={`absolute inset-0 rounded-full ${config.dot} opacity-50 animate-ping`} style={{ animationDuration: '2s' }} />}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${config.dot}`} />
      </div>
      <span className={`text-[9px] font-black tracking-[0.2em] ${config.text}`}>{config.label}</span>
    </div>
  );
});
StatusDot.displayName = 'StatusDot';

/** Pill showing the active personality name with its theme color accent */
const PersonalityBadge = memo(({ personality }: { personality: Personality }) => (
  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] transition-all duration-300">
    <div
      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
      style={{ backgroundColor: personality.themeColor, boxShadow: `0 0 6px ${personality.themeColor}80` }}
    />
    <span className="text-[11px] font-semibold text-white/70 truncate max-w-[120px]">
      {personality.name}
    </span>
  </div>
));
PersonalityBadge.displayName = 'PersonalityBadge';

/** Small badge showing how many tools are active */
const ToolBadges = memo(({
  isFunctionCallingEnabled,
  isGoogleSearchEnabled,
  docsCount,
}: {
  isFunctionCallingEnabled: boolean;
  isGoogleSearchEnabled: boolean;
  docsCount: number;
}) => {
  const badges: { label: string; active: boolean; color: string }[] = [
    { label: '⚡ Outils', active: isFunctionCallingEnabled, color: 'text-amber-400' },
    { label: '🔍 Search', active: isGoogleSearchEnabled, color: 'text-sky-400' },
    { label: `📄 ${docsCount}`, active: docsCount > 0, color: 'text-violet-400' },
  ];

  const active = badges.filter(b => b.active);
  if (active.length === 0) return null;

  return (
    <div className="hidden md:flex items-center gap-1.5">
      {active.map(b => (
        <span
          key={b.label}
          className={`px-2 py-1 rounded-full text-[9px] font-bold bg-white/[0.04] border border-white/[0.06] ${b.color}`}
        >
          {b.label}
        </span>
      ))}
    </div>
  );
});
ToolBadges.displayName = 'ToolBadges';

const NavButton = memo(({
  onClick, icon, label, themeColor,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  themeColor: string;
}) => (
  <Tooltip content={label} position="bottom">
    <button
      onClick={onClick}
      aria-label={label}
      className="flex items-center justify-center w-8 h-8 rounded-lg text-zinc-500 border border-transparent hover:text-white hover:bg-white/[0.06] hover:border-white/[0.08] transition-all duration-200"
    >
      {icon}
    </button>
  </Tooltip>
));
NavButton.displayName = 'NavButton';

// ─── Main Header ─────────────────────────────────────────────────────────────

const Header: React.FC<HeaderProps> = ({
  connectionState,
  currentPersonality,
  uploadedDocuments,
  isFunctionCallingEnabled = false,
  isGoogleSearchEnabled = false,
  onDocumentsChange,
  onOpenSystemStatus,
  onOpenConclusions,
  onOpenHistory,
  autoHideDelay = 4000,
}) => {
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isConnected = connectionState === ConnectionState.CONNECTED;

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(true);
    timerRef.current = setTimeout(() => setVisible(false), autoHideDelay);
  }, [autoHideDelay]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (e.clientY <= 80) resetTimer();
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', resetTimer, { passive: true });
    window.addEventListener('keydown', resetTimer, { passive: true });
    resetTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', resetTimer);
      window.removeEventListener('keydown', resetTimer);
    };
  }, [resetTimer]);

  return (
    <header
      className={[
        'fixed top-0 left-0 w-full z-50 px-4 pt-3 pb-2',
        'transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
        visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none',
      ].join(' ')}
    >
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-4 px-4 py-2 rounded-2xl bg-zinc-950/65 backdrop-blur-2xl border border-white/[0.07] shadow-lg">

        {/* LEFT: status + personality */}
        <div className="flex items-center gap-3 min-w-0">
          <StatusDot state={connectionState} />
          <PersonalityBadge personality={currentPersonality} />
          <ToolBadges
            isFunctionCallingEnabled={isFunctionCallingEnabled}
            isGoogleSearchEnabled={isGoogleSearchEnabled}
            docsCount={uploadedDocuments.length}
          />
        </div>

        {/* RIGHT: nav actions */}
        <nav className="flex items-center gap-2 flex-shrink-0" aria-label="Navigation">
          {/* View actions */}
          <div className="flex items-center gap-0.5">
            {onOpenHistory && (
              <NavButton onClick={onOpenHistory} icon={<HistoryIcon />} label="Historique" themeColor={currentPersonality.themeColor} />
            )}
            {onOpenConclusions && (
              <NavButton onClick={onOpenConclusions} icon={<FileTextIcon />} label="Conclusions" themeColor={currentPersonality.themeColor} />
            )}
          </div>

          <div className="w-px h-5 bg-white/[0.07]" />

          {/* Settings + Documents */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <div className="relative">
              <DocumentUploader
                documents={uploadedDocuments}
                onDocumentsChange={onDocumentsChange}
                disabled={isConnected}
              />
              {uploadedDocuments.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-indigo-500 text-[8px] font-black text-white pointer-events-none">
                  {uploadedDocuments.length}
                </span>
              )}
            </div>

            {onOpenSystemStatus && (
              <NavButton
                onClick={onOpenSystemStatus}
                icon={<SystemIcon />}
                label="Paramètres système"
                themeColor={currentPersonality.themeColor}
              />
            )}
          </div>
        </nav>
      </div>

      {/* Animated connection progress line */}
      {isConnected && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-px overflow-hidden opacity-25 pointer-events-none">
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${currentPersonality.themeColor} 50%, transparent 100%)`,
              backgroundSize: '200% 100%',
              animation: 'progress 4s linear infinite',
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes progress {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </header>
  );
};

export default memo(Header);
