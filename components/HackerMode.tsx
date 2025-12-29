import React, { useEffect, useState, useRef } from 'react';
import { ConnectionState } from '../types';

interface HackerModeProps {
  connectionState: ConnectionState;
  isTalking: boolean;
  latency: number;
  isMicMuted: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onToggleMic: () => void;
  currentPersonality: { name: string; themeColor: string };
}

const LOG_LIMIT = 30;

const STATUS_LABELS: Record<ConnectionState, {text: string; color: string}> = {
  [ConnectionState.CONNECTED]:    { text: 'ONLINE',       color: 'hacker-status-online' },
  [ConnectionState.CONNECTING]:   { text: 'CONNECTING...',color: 'hacker-status-connecting' },
  [ConnectionState.DISCONNECTED]:  { text: 'OFFLINE',      color: 'hacker-status-offline' },
  [ConnectionState.ERROR]:        { text: 'ERROR',        color: 'hacker-status-offline' },
  [undefined as any]:             { text: 'UNKNOWN',      color: 'hacker-status-offline' },
};

const getLabel = (cs: ConnectionState) => STATUS_LABELS[cs] || STATUS_LABELS[undefined as any];

const formatTime = (date: Date) =>
  date
    .toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const formatDate = (date: Date) =>
  date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

// Inline animated status dot (SVG neon pulse)
const StatusLED: React.FC<{colorClass: string}> = ({ colorClass }) => (
  <span className="inline-flex items-center ml-1">
    <span className={`relative ${colorClass}`} style={{width: 11, height: 11, display:'inline-block'}}>
      <span className="absolute inset-0 rounded-full opacity-70 animate-ping"
        style={{ backgroundColor: 'currentColor' }}/>
      <span className="relative rounded-full block w-[7px] h-[7px]" style={{background:"currentColor"}}/>
    </span>
  </span>
);

const useScrollToBottom = (dependency: any) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current && (ref.current.scrollTop = ref.current.scrollHeight);
  }, [dependency]);
  return ref;
};

const HackerMode: React.FC<HackerModeProps> = ({
  connectionState,
  isTalking,
  latency,
  isMicMuted,
  onConnect,
  onDisconnect,
  onToggleMic,
  currentPersonality,
}) => {
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Flicker effect for attention (e.g. error, connecting)
  const [flicker, setFlicker] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Flicker effect for non-connected/error status
  useEffect(() => {
    let flickerId: number | undefined;
    if (
      connectionState === ConnectionState.ERROR ||
      connectionState === ConnectionState.CONNECTING
    ) {
      flickerId = window.setInterval(
        () => setFlicker(f => !f),
        500
      );
    } else {
      setFlicker(false);
    }
    return () => flickerId && clearInterval(flickerId);
  }, [connectionState]);

  // System log/terminal output management
  useEffect(() => {
    let newOutput: string[] = [];
    const now = formatTime(new Date());
    if (connectionState === ConnectionState.CONNECTING) {
      newOutput.push(`[${now}] [SYSTEM] Initialisation de la connexion...`);
      newOutput.push(`[${now}] [SYSTEM] Établissement du canal sécurisé...`);
    } else if (connectionState === ConnectionState.CONNECTED) {
      newOutput.push(`[${now}] [SYSTEM] Connexion établie ✓`);
      newOutput.push(`[${now}] [SYSTEM] Personnalité active: ${currentPersonality.name}`);
      newOutput.push(`[${now}] [SYSTEM] Latence: ${latency}ms`);
    } else if (connectionState === ConnectionState.DISCONNECTED) {
      newOutput.push(`[${now}] [SYSTEM] Déconnecté`);
    } else if (connectionState === ConnectionState.ERROR) {
      newOutput.push(`[${now}] [SYSTEM] ERREUR DE CONNEXION. Vérifier le réseau.`);
    }
    if (newOutput.length > 0) {
      setTerminalOutput(prev =>
        [...prev, ...newOutput].slice(-LOG_LIMIT)
      );
    }
    // eslint-disable-next-line
  }, [connectionState, latency, currentPersonality.name]);

  // Auto scroll terminal
  const terminalOutputRef = useScrollToBottom(terminalOutput);

  // Accessibility: Ctrl+M = mute (and ESC = exit)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'm' && e.ctrlKey && connectionState === ConnectionState.CONNECTED) {
        onToggleMic();
      }
      if (e.key === 'Escape') {
        // Could dispatch a callback or event. For now just blur.
        (document.activeElement as HTMLElement)?.blur();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [connectionState, onToggleMic]);

  // Customizable status line, quick copy-able
  const statusLine = () => {
    const { text, color } = getLabel(connectionState);
    return (
      <div className="flex items-center gap-2 mb-2">
        <span className="hacker-text-dim">[STATUS]</span>
        <span className={`hacker-text-bright ${color} tracking-widest font-mono text-[12px]`}>
          {text}
        </span>
        {(connectionState === ConnectionState.CONNECTED ||
          connectionState === ConnectionState.CONNECTING) && (
          <StatusLED colorClass={color} />
        )}
        {connectionState === ConnectionState.ERROR && flicker && (
          <span className="hacker-text-bright text-[#ff3131] animate-pulse ml-2">
            <svg width="14" height="14"><circle cx="7" cy="7" r="5" fill="#ff3131" /></svg>
          </span>
        )}
      </div>
    );
  };

  // Decorative data grid for status summary with colored dots/icons
  const statusGrid = () =>
    connectionState === ConnectionState.CONNECTED && (
      <div className="grid grid-cols-2 gap-y-2 gap-x-8 mb-2 text-[13px] font-mono">
        <div className="flex items-center gap-2">
          <span className="hacker-text-dim">[LATENCY]</span>
          <span className={`hacker-text`}>
            <span className={latency < 70 ? "text-[#00fa78]" :
                              latency < 160 ? "text-yellow-400" : "text-red-400"}>
              {latency}ms
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hacker-text-dim">[PERSONALITY]</span>
          <span className="hacker-text whitespace-nowrap" style={{
            color: currentPersonality.themeColor,
            textShadow: `0 0 5px ${currentPersonality.themeColor}90`,
            fontWeight: 'bold'
          }}>
            {currentPersonality.name.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hacker-text-dim">[MIC]</span>
          <span className={`hacker-text ${isMicMuted ? 'hacker-status-offline' : 'hacker-status-online'}`}>
            {isMicMuted ? 'MUTED' : 'ACTIVE'}
          </span>
          <StatusLED colorClass={isMicMuted ? 'hacker-status-offline' : 'hacker-status-online'} />
        </div>
        <div className="flex items-center gap-2">
          <span className="hacker-text-dim">[AUDIO]</span>
          <span className={`hacker-text ${isTalking ? 'hacker-status-online' : 'hacker-status-offline'}`}>
            {isTalking ? 'TRANSMITTING' : 'IDLE'}
          </span>
          <StatusLED colorClass={isTalking ? 'hacker-status-online' : 'hacker-status-offline'} />
        </div>
      </div>
    );

  // Buttons with animated border / neon visual effect
  const ControlButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & {
    color?: string;
    danger?: boolean;
    neon?: boolean;
  }> = ({ children, color, danger, neon, ...props }) => (
    <button
      {...props}
      className={`hacker-border hacker-text px-6 py-2 transition-colors font-mono text-[14px] shadow-sm 
        ${neon ? 'neon-neurochat-btn' : ''}
        ${danger ? 'hover:bg-[#ff3131]/20 border-[#ff3131] text-[#ff3131]' :
                  color ? '' : 'hover:bg-[#00fa78]/15'}`}
      style={{
        borderColor: danger ? '#ff3131' : color || undefined,
        color: danger ? '#ff3131' : color || undefined,
        textShadow: neon ? `0 0 5px ${color || "#00fa78"}` : undefined,
        boxShadow: danger
          ? '0 0 12px #ff3131'
          : neon && color
            ? `0 0 8px ${color}`
            : undefined
      }}
    >
      {children}
    </button>
  );

  // Main render
  return (
    <div className="hacker-second-screen hacker-mode font-mono text-[#b1ffde]">
      {/* Scanline overlay */}
      <div className="hacker-scanline pointer-events-none" />

      {/* Header */}
      <header className="hacker-header px-3 py-1 flex flex-row items-center justify-between">
        <div className="hacker-text-dim tracking-wide">
          <span className="hidden sm:inline">NEUROCHAT // </span>MODE HACKER <span className="sm:inline hidden">// SECOND ÉCRAN</span>
        </div>
        <div className="hacker-text-dim flex gap-3 text-[13px] items-center">
          <span>
            {formatDate(currentTime)}
          </span>
          <span>
            {formatTime(currentTime)}
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="hacker-content px-2 py-2 flex flex-col items-center gap-4">
        {/* Status display */}
        <section className="hacker-window w-full max-w-xl min-w-[330px]">
          <div className="hacker-text mb-4">
            <div className="mb-2">
              <div className="hacker-text-dim text-[10px] mb-1">┌─ SYSTEM STATUS ───────────────────────────────┐</div>
            </div>
            {statusLine()}
            {statusGrid()}
            <div className="mt-2">
              <div className="hacker-text-dim text-[10px]">└────────────────────────────────────────────────┘</div>
            </div>
          </div>
        </section>

        {/* Terminal output */}
        <section
          className="hacker-window hacker-output w-full max-w-xl min-w-[330px] overflow-y-auto relative"
          style={{ maxHeight: '184px' }}
          ref={terminalOutputRef}
        >
          <div className="hacker-text-dim text-[10px] mb-1 mt-1">┌─ SYSTEM LOG ──────────────────────────────────┐</div>
          <div className="pl-1 pr-2 pb-1 select-text leading-tight">
            {terminalOutput.length === 0 && (
              <div className="hacker-text-dim text-[11px] italic opacity-30 mt-2 mb-2">
                [No logs yet. Actions will appear here.]
              </div>
            )}
            {terminalOutput.map((line, idx) => (
              <div
                key={idx}
                className="hacker-text-dim mb-[2px] text-[11px] whitespace-pre tracking-tight"
                style={{
                  color: ~line.indexOf('ERROR') ? '#ff3131' : undefined,
                  fontWeight: ~line.indexOf('✓') ? 'bold' : undefined
                }}
              >
                {line}
              </div>
            ))}
            <span className="hacker-cursor animate-pulse" />
          </div>
          <div className="hacker-text-dim text-[10px] mt-1">└────────────────────────────────────────────────┘</div>
        </section>

        {/* Control buttons (actions) */}
        <div className="flex flex-row gap-4 mt-2 flex-wrap justify-center max-w-xl w-full">
          {connectionState === ConnectionState.CONNECTED ? (
            <>
              <ControlButton
                onClick={onToggleMic}
                color={isMicMuted ? "#feea3a" : "#00ff73"}
                neon
                aria-pressed={isMicMuted}
                title="Toggle microphone [Ctrl+M]"
              >
                {isMicMuted ? 'UNMUTE' : 'MUTE'}
              </ControlButton>
              <ControlButton
                onClick={onDisconnect}
                danger
                neon
                title="Se déconnecter"
              >
                DISCONNECT
              </ControlButton>
            </>
          ) : (
            <ControlButton
              onClick={onConnect}
              disabled={connectionState === ConnectionState.CONNECTING}
              color="#00ffb9"
              neon
              style={{ minWidth: 150 }}
              title="Se connecter"
            >
              {connectionState === ConnectionState.CONNECTING ? 'CONNECTING...' : 'CONNECT'}
            </ControlButton>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="hacker-footer px-2 pb-2 mt-6">
        <div className="hacker-text-dim flex flex-col gap-1 items-center leading-tight">
          <div>
            <span className="font-bold animate-pulse">PRESS [ESC]</span> TO EXIT HACKER MODE
          </div>
          <div className="text-[9px] opacity-40 font-sans tracking-tight">
            SECOND SCREEN MODE // <span className="opacity-70">PERSONAL USE ONLY</span>
          </div>
          <div className="text-[8px] opacity-30 mt-1 font-sans">
            [Ctrl+M] : Mute / Unmute &nbsp;|&nbsp; Actions colored by status
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HackerMode;
