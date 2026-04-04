import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { ConnectionState } from '../types';

export interface Command {
  id: string;
  label: string;
  description?: string;
  icon: string;
  category: 'session' | 'tools' | 'view' | 'settings';
  shortcut?: string;
  disabled?: boolean;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  connectionState: ConnectionState;
  isVideoActive: boolean;
  isScreenShareActive: boolean;
  isMicMuted: boolean;
  isFunctionCallingEnabled: boolean;
  isGoogleSearchEnabled: boolean;
  isAvatar3DEnabled: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleMic: () => void;
  onToggleFunctionCalling: (v: boolean) => void;
  onToggleGoogleSearch: (v: boolean) => void;
  onToggleAvatar3D: (v: boolean) => void;
  onOpenHistory: () => void;
  onOpenConclusions: () => void;
  onOpenSettings: () => void;
  onOpenTools: () => void;
}

const CATEGORY_LABELS: Record<Command['category'], string> = {
  session: 'Session',
  tools: 'Outils',
  view: 'Vue',
  settings: 'Paramètres',
};

const CategoryBadge = memo(({ cat }: { cat: Command['category'] }) => (
  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-white/5 text-zinc-500">
    {CATEGORY_LABELS[cat]}
  </span>
));
CategoryBadge.displayName = 'CategoryBadge';

export const CommandPalette = memo(({
  isOpen,
  onClose,
  connectionState,
  isVideoActive,
  isScreenShareActive,
  isMicMuted,
  isFunctionCallingEnabled,
  isGoogleSearchEnabled,
  isAvatar3DEnabled,
  onConnect,
  onDisconnect,
  onToggleVideo,
  onToggleScreenShare,
  onToggleMic,
  onToggleFunctionCalling,
  onToggleGoogleSearch,
  onToggleAvatar3D,
  onOpenHistory,
  onOpenConclusions,
  onOpenSettings,
  onOpenTools,
}: CommandPaletteProps) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isConnecting = connectionState === ConnectionState.CONNECTING;

  const commands: Command[] = [
    {
      id: 'connect',
      label: isConnected ? 'Terminer la session' : 'Démarrer la session',
      description: isConnected ? 'Déconnecte Gemini Live' : 'Connecte Gemini Live',
      icon: isConnected ? '⏹' : '▶',
      category: 'session',
      shortcut: 'Enter',
      disabled: isConnecting,
      action: () => { isConnected ? onDisconnect() : onConnect(); onClose(); },
    },
    {
      id: 'mic',
      label: isMicMuted ? 'Activer le micro' : 'Couper le micro',
      description: 'Bascule la capture audio',
      icon: isMicMuted ? '🎙' : '🔇',
      category: 'session',
      shortcut: 'Space',
      disabled: !isConnected,
      action: () => { onToggleMic(); onClose(); },
    },
    {
      id: 'camera',
      label: isVideoActive ? 'Désactiver la caméra' : 'Activer la caméra',
      icon: isVideoActive ? '📷' : '🚫',
      category: 'session',
      disabled: !isConnected,
      action: () => { onToggleVideo(); onClose(); },
    },
    {
      id: 'screen',
      label: isScreenShareActive ? 'Arrêter le partage d\'écran' : 'Partager l\'écran',
      icon: isScreenShareActive ? '🖥' : '📲',
      category: 'session',
      disabled: !isConnected,
      action: () => { onToggleScreenShare(); onClose(); },
    },
    {
      id: 'history',
      label: 'Voir l\'historique',
      description: 'Toutes les conversations',
      icon: '🕐',
      category: 'view',
      action: () => { onOpenHistory(); onClose(); },
    },
    {
      id: 'conclusions',
      label: 'Voir les conclusions',
      description: 'Documents générés par l\'IA',
      icon: '📄',
      category: 'view',
      action: () => { onOpenConclusions(); onClose(); },
    },
    {
      id: 'tools',
      label: 'Liste des outils',
      description: 'Outils disponibles pour l\'agent',
      icon: '🔧',
      category: 'tools',
      action: () => { onOpenTools(); onClose(); },
    },
    {
      id: 'function-calling',
      label: isFunctionCallingEnabled ? 'Désactiver les outils' : 'Activer les outils',
      description: 'Function calling Gemini',
      icon: isFunctionCallingEnabled ? '⚡' : '⚙',
      category: 'settings',
      action: () => { onToggleFunctionCalling(!isFunctionCallingEnabled); onClose(); },
    },
    {
      id: 'google-search',
      label: isGoogleSearchEnabled ? 'Désactiver Google Search' : 'Activer Google Search',
      icon: '🔍',
      category: 'settings',
      action: () => { onToggleGoogleSearch(!isGoogleSearchEnabled); onClose(); },
    },
    {
      id: 'avatar',
      label: isAvatar3DEnabled ? 'Passer en visualiseur 2D' : 'Passer en avatar 3D',
      icon: isAvatar3DEnabled ? '🌐' : '👤',
      category: 'settings',
      action: () => { onToggleAvatar3D(!isAvatar3DEnabled); onClose(); },
    },
    {
      id: 'settings',
      label: 'Paramètres système',
      icon: '⚙',
      category: 'settings',
      action: () => { onOpenSettings(); onClose(); },
    },
  ];

  const filtered = query.trim()
    ? commands.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.description?.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset selection when filter changes
  useEffect(() => { setSelectedIndex(0); }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[selectedIndex] && !filtered[selectedIndex].disabled) {
          filtered[selectedIndex].action();
        }
        break;
      case 'Escape':
        onClose();
        break;
    }
  }, [filtered, selectedIndex, onClose]);

  if (!isOpen) return null;

  // Group by category
  const grouped = filtered.reduce<Record<string, Command[]>>((acc, cmd) => {
    (acc[cmd.category] ??= []).push(cmd);
    return acc;
  }, {});

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Palette de commandes"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div className="relative w-full max-w-lg mx-4 rounded-2xl bg-zinc-950/95 border border-white/10 shadow-2xl overflow-hidden animate-fade-in">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]">
          <span className="text-zinc-500 text-sm">⌘</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher une commande..."
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none"
            aria-label="Recherche de commandes"
            autoComplete="off"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-zinc-600 hover:text-white text-xs"
              aria-label="Effacer"
            >
              ✕
            </button>
          )}
          <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-zinc-500 font-mono">ESC</kbd>
        </div>

        {/* Results */}
        <ul
          ref={listRef}
          className="max-h-[50vh] overflow-y-auto custom-scrollbar py-2"
          role="listbox"
        >
          {filtered.length === 0 && (
            <li className="px-4 py-8 text-center text-zinc-600 text-sm">
              Aucune commande trouvée
            </li>
          )}

          {query.trim()
            ? filtered.map((cmd, i) => (
                <CommandItem
                  key={cmd.id}
                  cmd={cmd}
                  isSelected={i === selectedIndex}
                  onSelect={() => !cmd.disabled && cmd.action()}
                  onHover={() => setSelectedIndex(i)}
                />
              ))
            : (Object.entries(grouped) as [Command['category'], Command[]][]).map(([cat, cmds]) => (
                <li key={cat}>
                  <div className="px-4 py-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                      {CATEGORY_LABELS[cat]}
                    </span>
                  </div>
                  <ul>
                    {cmds.map((cmd, i) => {
                      const globalIndex = filtered.indexOf(cmd);
                      return (
                        <CommandItem
                          key={cmd.id}
                          cmd={cmd}
                          isSelected={globalIndex === selectedIndex}
                          onSelect={() => !cmd.disabled && cmd.action()}
                          onHover={() => setSelectedIndex(globalIndex)}
                        />
                      );
                    })}
                  </ul>
                </li>
              ))
          }
        </ul>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-white/[0.06] text-[10px] text-zinc-600">
          <span><kbd className="font-mono">↑↓</kbd> naviguer</span>
          <span><kbd className="font-mono">↵</kbd> exécuter</span>
          <span><kbd className="font-mono">ESC</kbd> fermer</span>
          <span className="ml-auto opacity-50">⌘K pour ouvrir</span>
        </div>
      </div>
    </div>
  );
});

CommandPalette.displayName = 'CommandPalette';

const CommandItem = memo(({
  cmd,
  isSelected,
  onSelect,
  onHover,
}: {
  cmd: Command;
  isSelected: boolean;
  onSelect: () => void;
  onHover: () => void;
}) => (
  <li
    role="option"
    aria-selected={isSelected}
    aria-disabled={cmd.disabled}
    onMouseEnter={onHover}
    onClick={onSelect}
    className={`
      flex items-center gap-3 px-4 py-2.5 cursor-pointer
      transition-colors duration-100
      ${cmd.disabled ? 'opacity-30 cursor-not-allowed' : ''}
      ${isSelected && !cmd.disabled ? 'bg-white/[0.07]' : 'hover:bg-white/[0.04]'}
    `}
  >
    <span className="text-base w-5 text-center flex-shrink-0">{cmd.icon}</span>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-white truncate">{cmd.label}</p>
      {cmd.description && (
        <p className="text-[11px] text-zinc-500 truncate">{cmd.description}</p>
      )}
    </div>
    {cmd.shortcut && (
      <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-zinc-500 font-mono flex-shrink-0">
        {cmd.shortcut}
      </kbd>
    )}
  </li>
));

CommandItem.displayName = 'CommandItem';
