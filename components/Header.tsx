import React, { useState, useEffect, memo, useCallback, useRef } from 'react';
import { ConnectionState, Personality } from '../types';
import Tooltip from './Tooltip';
import DocumentUploader from './DocumentUploader';
import { ProcessedDocument } from '../utils/documentProcessor';

// --- Types ---
interface HeaderProps {
  connectionState: ConnectionState;
  currentPersonality: Personality;
  uploadedDocuments: ProcessedDocument[];
  onDocumentsChange: (documents: ProcessedDocument[]) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onOpenToolsList: () => void;

  onOpenSystemStatus?: () => void;
  onOpenConclusions?: () => void;
  onOpenHistory?: () => void;
  onToggleWhiteboard?: () => void;
  isWhiteboardOpen?: boolean;
  autoHideDelay?: number;
}

// --- Icons ---
const Icons = {
  Search: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  ),
  System: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 12h9" />
    </svg>
  ),
  Power: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
    </svg>
  ),
  FileText: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  History: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Edit: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  )
};

// --- Sub-Components ---

const StatusBadge = memo(({ connectionState }: { connectionState: ConnectionState }) => {
  const statusConfig = {
    [ConnectionState.CONNECTED]: {
      label: 'ACTIF',
      colorClass: 'bg-emerald-400',
      textClass: 'text-emerald-400',
      bgClass: 'bg-emerald-500/10'
    },
    [ConnectionState.CONNECTING]: {
      label: 'SYNC',
      colorClass: 'bg-amber-400',
      textClass: 'text-amber-400',
      bgClass: 'bg-amber-500/10'
    },
    [ConnectionState.DISCONNECTED]: {
      label: 'OFFLINE',
      colorClass: 'bg-zinc-500',
      textClass: 'text-zinc-500',
      bgClass: 'bg-zinc-500/10'
    }
  };

  const config = statusConfig[connectionState] || statusConfig[ConnectionState.DISCONNECTED];
  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isConnecting = connectionState === ConnectionState.CONNECTING;

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border border-white/5 backdrop-blur-md ${config.bgClass} transition-all duration-300`}>
      <div className="relative flex h-1.5 w-1.5">
        {(isConnected || isConnecting) && (
          <span className={`absolute -inset-1 rounded-full opacity-40 ${config.colorClass} animate-ping`} style={{ animationDuration: '2s' }} />
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${config.colorClass}`} />
      </div>
      <span className={`text-[10px] font-black tracking-widest ${config.textClass}`}>
        {isConnecting ? 'SYNC...' : config.label}
      </span>
    </div>
  );
});
StatusBadge.displayName = 'StatusBadge';

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
  return (
    <Tooltip content={disabled && disabledReason ? `${label} - ${disabledReason}` : label} position="bottom">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          relative flex items-center justify-center w-9 h-9 rounded-lg
          transition-all duration-200 ease-out border
          ${disabled
            ? 'opacity-30 cursor-not-allowed border-transparent grayscale'
            : active
              ? 'bg-white/10 border-white/20 text-white'
              : 'text-zinc-400 border-transparent hover:text-white hover:bg-white/5'
          }
        `}
      >
        <div className="relative z-10">{icon}</div>
        {active && !disabled && (
          <span
            className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-zinc-900"
            style={{ backgroundColor: themeColor }}
          />
        )}
      </button>
    </Tooltip>
  );
});
ControlButton.displayName = 'ControlButton';

const ControlGroup = memo(({ children }: { children: React.ReactNode; label: string }) => (
  <div className="flex items-center gap-1 p-0.5 rounded-xl bg-white/[0.03] border border-white/5">
    {children}
  </div>
));
ControlGroup.displayName = 'ControlGroup';

const Header: React.FC<HeaderProps> = ({
  connectionState,
  currentPersonality,
  uploadedDocuments,
  onDocumentsChange,
  onOpenSystemStatus,
  onOpenConclusions,
  onOpenHistory,
  onToggleWhiteboard,
  isWhiteboardOpen,
  autoHideDelay = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnected = connectionState === ConnectionState.CONNECTED;

  const resetHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    setIsVisible(true);
    hideTimeoutRef.current = setTimeout(() => setIsVisible(false), autoHideDelay);
  }, [autoHideDelay]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY <= 80) {
        setIsVisible(true);
        resetHideTimeout();
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', resetHideTimeout, { passive: true });
    window.addEventListener('keydown', resetHideTimeout, { passive: true });
    resetHideTimeout();

    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', resetHideTimeout);
      window.removeEventListener('keydown', resetHideTimeout);
    };
  }, [resetHideTimeout]);

  return (
    <header
      className={`
        fixed top-0 left-0 w-full z-50 px-6 py-4
        transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1)
        ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}
      `}
    >
      <div className="max-w-[120rem] mx-auto flex items-center justify-between relative px-5 py-2.5 rounded-2xl glass-premium shadow-2xl transition-all duration-500">
        {/* LEFT: Status */}
        <div className="flex items-center gap-4">
          <StatusBadge connectionState={connectionState} />
        </div>

        {/* RIGHT: Controls */}
        <nav className="flex items-center gap-4">

          {/* System & Data */}
          <div className="flex items-center gap-2">
            {onOpenSystemStatus && (
              <ControlButton
                active={false}
                onClick={onOpenSystemStatus}
                icon={<Icons.System />}
                label="System"
                themeColor={currentPersonality.themeColor}
              />
            )}
            {onOpenConclusions && (
              <ControlButton
                active={false}
                onClick={onOpenConclusions}
                icon={<Icons.FileText />}
                label="Conclusions"
                themeColor={currentPersonality.themeColor}
              />
            )}
            {onOpenHistory && (
              <ControlButton
                active={false}
                onClick={onOpenHistory}
                icon={<Icons.History />}
                label="Sessions"
                themeColor={currentPersonality.themeColor}
              />
            )}

            {onToggleWhiteboard && (
              <ControlButton
                active={isWhiteboardOpen || false}
                onClick={onToggleWhiteboard}
                icon={<Icons.Edit />}
                label="Tableau"
                themeColor={currentPersonality.themeColor}
              />
            )}
          </div>

          <div className="h-6 w-px bg-white/10" />

          {/* Configuration */}
          <div className="flex items-center gap-3 bg-white/[0.03] px-3 py-1 rounded-xl border border-white/5">
            <div className="relative group">
              <DocumentUploader
                documents={uploadedDocuments}
                onDocumentsChange={onDocumentsChange}
                disabled={isConnected}
              />
              {uploadedDocuments.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-indigo-500 text-[8px] font-black text-white">
                  {uploadedDocuments.length}
                </span>
              )}
            </div>
          </div>
        </nav>
      </div>

      {/* Connectivity Indicator Line */}
      {isConnected && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[80%] h-[0.5px] overflow-hidden opacity-20">
          <div
            className="w-full h-full animate-progress"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${currentPersonality.themeColor} 50%, transparent 100%)`,
              backgroundSize: '200% 100%'
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes progress {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .animate-progress {
          animation: progress 4s linear infinite;
        }
      `}</style>
    </header>
  );
};

export default memo(Header);
