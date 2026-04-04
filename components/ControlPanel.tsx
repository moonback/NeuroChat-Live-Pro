import { useMemo, useState, useRef, useCallback, memo } from 'react';
import { ConnectionState, type Personality } from '../types';
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
  onToggleFunctionCalling?: (enabled: boolean) => void;
  onToggleGoogleSearch?: (enabled: boolean) => void;
  onOpenMobileActions?: () => void;
  onOpenCommandPalette?: () => void;
}

// ─── Icons ──────────────────────────────────────────────────────────────────

const CameraIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
  </svg>
);
const CameraOffIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498M3 3l18 18" />
  </svg>
);
const ScreenShareIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
  </svg>
);
const MicIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
  </svg>
);
const MicOffIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75zM3 3l18 18" />
  </svg>
);
const PowerIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
  </svg>
);
const MenuIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);
const CommandIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

// ─── RoundButton ────────────────────────────────────────────────────────────

interface RoundButtonProps {
  onClick: () => void;
  active: boolean;
  activeColor?: string;
  icon: React.ReactNode;
  tooltip: string;
  themeColor?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  danger?: boolean;
}

const RoundButton = memo(({
  onClick, active, activeColor = 'bg-white/10', icon, tooltip,
  themeColor, disabled = false, size = 'md', danger = false,
}: RoundButtonProps) => {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const sizeClass = size === 'sm' ? 'w-10 h-10' : 'w-11 h-11 md:w-12 md:h-12';

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const id = Date.now();
      setRipples(prev => [...prev, { x: e.clientX - rect.left, y: e.clientY - rect.top, id }]);
      setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
    }
    onClick();
  }, [onClick, disabled]);

  const activeStyle = useMemo(() => (
    active && themeColor && !danger
      ? { boxShadow: `0 0 20px ${themeColor}25, inset 0 0 12px ${themeColor}10` }
      : undefined
  ), [active, themeColor, danger]);

  return (
    <Tooltip content={tooltip}>
      <button
        ref={buttonRef}
        onClick={handleClick}
        disabled={disabled}
        aria-pressed={active}
        aria-label={tooltip}
        className={[
          'relative flex items-center justify-center rounded-full border overflow-hidden touch-manipulation',
          'transition-all duration-200 ease-out',
          sizeClass,
          disabled ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 active:scale-90',
          danger
            ? active
              ? 'bg-red-500/20 border-red-500/30 text-red-400'
              : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400'
            : active
              ? `${activeColor} text-white border-white/15`
              : 'bg-white/[0.04] border-white/[0.06] text-zinc-400 hover:bg-white/[0.08] hover:text-white hover:border-white/15',
        ].join(' ')}
        style={activeStyle}
      >
        {/* Ripple */}
        {ripples.map(r => (
          <span
            key={r.id}
            className="absolute rounded-full animate-ripple pointer-events-none"
            style={{
              left: r.x, top: r.y,
              backgroundColor: themeColor ?? 'rgba(255,255,255,0.25)',
              transform: 'translate(-50%,-50%)',
            }}
          />
        ))}

        <span className="relative z-10">{icon}</span>

        {/* Active dot */}
        {active && (
          <span
            className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full animate-pulse"
            style={{ backgroundColor: danger ? '#ef4444' : (themeColor ?? '#fff') }}
          />
        )}
      </button>
    </Tooltip>
  );
});
RoundButton.displayName = 'RoundButton';

// ─── StatusIsland ───────────────────────────────────────────────────────────

const StatusIsland = memo(({ isConnected, inputAnalyser, latencyMs, themeColor }: {
  isConnected: boolean;
  inputAnalyser: AnalyserNode | null;
  latencyMs: number;
  themeColor: string;
}) => (
  <div
    className={[
      'fixed bottom-10 left-5 z-50 pointer-events-auto',
      'transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] origin-bottom-left',
      isConnected ? 'opacity-100 scale-100 translate-x-0' : 'opacity-0 scale-90 -translate-x-4 pointer-events-none',
    ].join(' ')}
    role="status"
    aria-live="polite"
    aria-label="État de la session"
  >
    <div
      className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-zinc-950/80 backdrop-blur-xl border border-white/[0.08] shadow-2xl"
      style={{ boxShadow: `0 0 32px ${themeColor}12, 0 4px 20px rgba(0,0,0,0.5)` }}
    >
      {/* Live dot + label */}
      <div className="flex items-center gap-2">
        <div className="relative w-2 h-2 flex-shrink-0">
          <span className="absolute inset-0 rounded-full bg-emerald-500/50 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="relative w-2 h-2 rounded-full bg-emerald-500" style={{ boxShadow: '0 0 8px rgba(16,185,129,0.8)' }} />
        </div>
        <span className="text-[9px] font-black tracking-[0.25em] text-emerald-400 uppercase">Live</span>
      </div>

      <div className="w-px h-4 bg-white/10" />

      {/* Audio waveform */}
      <div className="w-12 h-4 opacity-80">
        <AudioInputVisualizer analyser={inputAnalyser} isActive={isConnected} />
      </div>

      <div className="w-px h-4 bg-white/10" />

      <div className="scale-90 origin-left">
        <LatencyIndicator latencyMs={latencyMs} />
      </div>
    </div>
  </div>
));
StatusIsland.displayName = 'StatusIsland';

// ─── ConnectButton ───────────────────────────────────────────────────────────

const ConnectButton = memo(({ isConnecting, onClick, themeColor }: {
  isConnecting: boolean;
  onClick: () => void;
  themeColor: string;
}) => (
  <button
    onClick={onClick}
    disabled={isConnecting}
    className="group relative flex items-center gap-2.5 px-6 py-3 rounded-full bg-white text-black font-bold text-sm tracking-wide transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden touch-manipulation"
    style={{ boxShadow: '0 0 24px rgba(255,255,255,0.15)' }}
    aria-label={isConnecting ? 'Connexion en cours...' : 'Démarrer la session'}
  >
    {/* Gradient sweep on hover */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

    {isConnecting ? (
      <>
        <Loader size="sm" color="#000000" />
        <span className="relative z-10">Connexion...</span>
      </>
    ) : (
      <>
        <span className="relative z-10 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black/40" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-black" />
        </span>
        <span className="relative z-10">COMMENCER</span>
      </>
    )}
  </button>
));
ConnectButton.displayName = 'ConnectButton';

// ─── DisconnectButton ────────────────────────────────────────────────────────

const DisconnectButton = memo(({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="group flex items-center justify-center w-11 h-11 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-300 shadow-[0_0_20px_rgba(239,68,68,0.08)] hover:shadow-[0_0_40px_rgba(239,68,68,0.4)] touch-manipulation active:scale-90"
    aria-label="Terminer la session"
  >
    <div className="transition-transform duration-300 group-hover:rotate-90">
      <PowerIcon />
    </div>
  </button>
));
DisconnectButton.displayName = 'DisconnectButton';

const Divider = () => (
  <div className="w-px h-7 bg-gradient-to-b from-transparent via-white/12 to-transparent mx-0.5" />
);

// ─── Main Component ──────────────────────────────────────────────────────────

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
  onOpenCommandPalette,
}) => {
  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isConnecting = connectionState === ConnectionState.CONNECTING;

  const dockStyle = useMemo(() => ({
    boxShadow: isConnected
      ? `0 0 60px -15px ${currentPersonality.themeColor}35, 0 0 30px rgba(0,0,0,0.6)`
      : '0 0 40px rgba(0,0,0,0.5)',
  }), [isConnected, currentPersonality.themeColor]);

  return (
    <div
      className="relative z-40 flex flex-col items-center justify-end h-full pb-6 sm:pb-8 md:pb-10 w-full pointer-events-none safe-area-bottom"
      role="region"
      aria-label="Panneau de contrôle"
    >
      {/* Status island (bottom-left) */}
      <StatusIsland
        isConnected={isConnected}
        inputAnalyser={inputAnalyser}
        latencyMs={latencyMs}
        themeColor={currentPersonality.themeColor}
      />

      {/* Main dock */}
      <div className="pointer-events-auto">
        <div
          className="flex items-center gap-2 md:gap-3 p-2 rounded-full border border-white/[0.08] bg-zinc-950/90 backdrop-blur-2xl transition-all duration-500"
          style={dockStyle}
          role="toolbar"
          aria-label="Contrôles de session"
        >
          {/* ── Media controls (only when connected) ── */}
          {isConnected && (
            <>
              <div className="flex items-center gap-1.5 pl-1" role="group" aria-label="Contrôles média">
                {/* Mic */}
                {onToggleMic && (
                  <RoundButton
                    onClick={onToggleMic}
                    active={!isMicMuted}
                    icon={isMicMuted ? <MicOffIcon /> : <MicIcon />}
                    tooltip={isMicMuted ? 'Activer le micro  [Space]' : 'Couper le micro  [Space]'}
                    themeColor={currentPersonality.themeColor}
                    danger={isMicMuted}
                  />
                )}

                {/* Camera */}
                <RoundButton
                  onClick={onToggleVideo}
                  active={isVideoActive}
                  icon={isVideoActive ? <CameraIcon /> : <CameraOffIcon />}
                  tooltip={isVideoActive ? 'Désactiver la caméra' : 'Activer la caméra'}
                  themeColor={currentPersonality.themeColor}
                />

                {/* Screen share */}
                {onToggleScreenShare && (
                  <RoundButton
                    onClick={onToggleScreenShare}
                    active={isScreenShareActive}
                    activeColor="bg-indigo-500/20"
                    icon={<ScreenShareIcon />}
                    tooltip={isScreenShareActive ? "Arrêter le partage d'écran" : "Partager l'écran"}
                    themeColor="#6366f1"
                  />
                )}
              </div>

              <Divider />
            </>
          )}

          {/* ── Main action ── */}
          {isConnected
            ? <DisconnectButton onClick={onDisconnect} />
            : (
              <div className="flex items-center gap-2 px-1">
                <ConnectButton isConnecting={isConnecting} onClick={onConnect} themeColor={currentPersonality.themeColor} />

                {/* Command palette shortcut button */}
                {onOpenCommandPalette && (
                  <RoundButton
                    onClick={onOpenCommandPalette}
                    active={false}
                    icon={<CommandIcon />}
                    tooltip="Palette de commandes  [⌘K]"
                    size="sm"
                  />
                )}

                {/* Mobile overflow menu */}
                {onOpenMobileActions && (
                  <div className="md:hidden">
                    <RoundButton
                      onClick={onOpenMobileActions}
                      active={false}
                      icon={<MenuIcon />}
                      tooltip="Plus d'options"
                      size="sm"
                    />
                  </div>
                )}
              </div>
            )
          }

          {/* Command palette accessible while connected too */}
          {isConnected && onOpenCommandPalette && (
            <>
              <Divider />
              <div className="pr-1">
                <RoundButton
                  onClick={onOpenCommandPalette}
                  active={false}
                  icon={<CommandIcon />}
                  tooltip="Palette de commandes  [⌘K]"
                  size="sm"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
