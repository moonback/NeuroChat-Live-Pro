import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Personality } from '../types';

interface MobileActionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentPersonality: Personality;
  isFunctionCallingEnabled: boolean;
  isGoogleSearchEnabled: boolean;
  isEyeTrackingEnabled: boolean;
  onToggleFunctionCalling: (enabled: boolean) => void;
  onToggleGoogleSearch: (enabled: boolean) => void;
  onToggleEyeTracking: (enabled: boolean) => void;
  onEditPersonality: () => void;
  onOpenToolsList: () => void;
}

// --- Icons ---
const Icons = {
  Close: memo(() => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )),
  Lightning: memo(() => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )),
  Edit: memo(() => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )),
  Code: memo(() => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  )),
  Search: memo(() => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )),
  Eye: memo(() => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )),
  Tools: memo(() => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  )),
  ChevronRight: memo(() => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  ))
};

// --- Action Button Component ---
const ActionButton = memo(({ 
  onClick, 
  icon, 
  label, 
  isToggle = false,
  isEnabled = false,
  colorScheme = 'default',
  showChevron = false,
  showBadge = false
}: { 
  onClick: () => void; 
  icon: React.ReactNode;
  label: string;
  isToggle?: boolean;
  isEnabled?: boolean;
  colorScheme?: 'default' | 'pink' | 'blue' | 'emerald' | 'purple';
  showChevron?: boolean;
  showBadge?: boolean;
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const colorConfig = {
    default: {
      base: 'from-white/5 to-white/0 border-white/10 text-slate-200',
      hover: 'hover:border-white/20 hover:from-white/10 hover:text-white',
      icon: 'from-white/5 to-white/0 border-white/10',
      iconHover: 'group-hover:border-white/20 group-hover:from-white/10',
      iconColor: 'text-slate-300 group-hover:text-white'
    },
    pink: {
      base: 'from-white/5 to-white/0 border-white/10 text-slate-200',
      hover: 'hover:border-pink-500/40 hover:from-pink-500/10 hover:to-pink-500/5 hover:text-white hover:shadow-pink-500/10',
      icon: 'from-pink-500/20 to-rose-500/20 border-pink-500/30',
      iconHover: 'group-hover:border-pink-400/50',
      iconColor: 'text-pink-300'
    },
    blue: {
      base: isEnabled 
        ? 'from-blue-500/20 to-blue-600/10 border-blue-500/50 text-blue-200' 
        : 'from-white/5 to-white/0 border-white/10 text-slate-200',
      hover: isEnabled 
        ? 'hover:border-blue-400/70 hover:from-blue-500/25 hover:shadow-blue-500/20'
        : 'hover:border-blue-500/40 hover:from-blue-500/10 hover:to-blue-500/5 hover:text-white hover:shadow-blue-500/10',
      icon: isEnabled 
        ? 'from-blue-500/30 to-blue-600/20 border-blue-400/50'
        : 'from-white/5 to-white/0 border-white/10 group-hover:border-blue-500/40 group-hover:from-blue-500/20',
      iconHover: '',
      iconColor: isEnabled ? 'text-blue-200' : 'text-slate-300 group-hover:text-blue-300'
    },
    emerald: {
      base: isEnabled 
        ? 'from-emerald-500/20 to-green-600/10 border-emerald-500/50 text-emerald-200'
        : 'from-white/5 to-white/0 border-white/10 text-slate-200',
      hover: isEnabled 
        ? 'hover:border-emerald-400/70 hover:from-emerald-500/25 hover:shadow-emerald-500/20'
        : 'hover:border-emerald-500/40 hover:from-emerald-500/10 hover:to-emerald-500/5 hover:text-white hover:shadow-emerald-500/10',
      icon: isEnabled 
        ? 'from-emerald-500/30 to-green-600/20 border-emerald-400/50'
        : 'from-white/5 to-white/0 border-white/10 group-hover:border-emerald-500/40 group-hover:from-emerald-500/20',
      iconHover: '',
      iconColor: isEnabled ? 'text-emerald-200' : 'text-slate-300 group-hover:text-emerald-300'
    },
    purple: {
      base: isEnabled 
        ? 'from-purple-500/20 to-fuchsia-600/10 border-purple-500/50 text-purple-200'
        : 'from-white/5 to-white/0 border-white/10 text-slate-200',
      hover: isEnabled 
        ? 'hover:border-purple-400/70 hover:from-purple-500/25 hover:shadow-purple-500/20'
        : 'hover:border-purple-500/40 hover:from-purple-500/10 hover:to-purple-500/5 hover:text-white hover:shadow-purple-500/10',
      icon: isEnabled 
        ? 'from-purple-500/30 to-fuchsia-600/20 border-purple-400/50'
        : 'from-white/5 to-white/0 border-white/10 group-hover:border-purple-500/40 group-hover:from-purple-500/20',
      iconHover: '',
      iconColor: isEnabled ? 'text-purple-200' : 'text-slate-300 group-hover:text-purple-300'
    }
  };

  const colors = colorConfig[colorScheme];

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const button = buttonRef.current;
    if (button) {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();
      
      setRipples(prev => [...prev, { x, y, id }]);
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== id));
      }, 600);
    }
    onClick();
  }, [onClick]);

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={`
        group relative w-full px-4 py-3.5 rounded-xl 
        bg-gradient-to-br ${colors.base} border
        font-medium text-sm transition-all duration-300 
        text-left flex items-center gap-3.5 
        touch-manipulation min-h-[56px] shadow-sm
        overflow-hidden
        ${colors.hover}
        hover:shadow-lg
        ${isPressed ? 'scale-[0.97]' : 'active:scale-[0.97]'}
      `}
      role={isToggle ? 'switch' : 'button'}
      aria-checked={isToggle ? isEnabled : undefined}
      aria-label={label}
    >
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/20 animate-ripple pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: 'translate(-50%, -50%)'
          }}
        />
      ))}

      {/* Icon container */}
      <div className={`
        p-2.5 rounded-lg bg-gradient-to-br border transition-colors
        ${colors.icon} ${colors.iconHover}
      `}>
        <div className={`transition-colors ${colors.iconColor}`}>
          {icon}
        </div>
      </div>
      
      {/* Label */}
      <span className="flex-1 font-semibold">{label}</span>
      
      {/* Chevron for navigation actions */}
      {showChevron && (
        <div className={`transition-colors ${colorScheme === 'pink' ? 'text-slate-400 group-hover:text-pink-300' : 'text-slate-400 group-hover:text-white'}`}>
          <Icons.ChevronRight />
        </div>
      )}

      {/* Badge for enabled toggles */}
      {showBadge && isEnabled && (
        <div className={`
          px-2.5 py-1 rounded-lg border
          ${colorScheme === 'blue' ? 'bg-blue-500/30 border-blue-400/50' : ''}
          ${colorScheme === 'emerald' ? 'bg-emerald-500/30 border-emerald-400/50' : ''}
          ${colorScheme === 'purple' ? 'bg-purple-500/30 border-purple-400/50' : ''}
        `}>
          <span className={`
            text-[10px] font-bold uppercase tracking-wider
            ${colorScheme === 'blue' ? 'text-blue-200' : ''}
            ${colorScheme === 'emerald' ? 'text-emerald-200' : ''}
            ${colorScheme === 'purple' ? 'text-purple-200' : ''}
          `}>
            ON
          </span>
        </div>
      )}
    </button>
  );
});

ActionButton.displayName = 'ActionButton';

// --- Separator Component ---
const Separator = memo(() => (
  <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-2" />
));

Separator.displayName = 'Separator';

// --- Main Component ---
const MobileActionsDrawer: React.FC<MobileActionsDrawerProps> = ({
  isOpen,
  onClose,
  currentPersonality,
  isFunctionCallingEnabled,
  isGoogleSearchEnabled,
  isEyeTrackingEnabled,
  onToggleFunctionCalling,
  onToggleGoogleSearch,
  onToggleEyeTracking,
  onEditPersonality,
  onOpenToolsList,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle action with close
  const handleActionWithClose = useCallback((action: () => void) => {
    action();
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Actions rapides"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <div 
        ref={drawerRef}
        className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto bg-gradient-to-b from-slate-900/98 via-slate-900/95 to-slate-900 rounded-t-3xl border-t border-white/20 animate-in slide-in-from-bottom-5 duration-300 safe-area-bottom"
        style={{
          boxShadow: `0 -20px 60px rgba(0, 0, 0, 0.7), 0 0 40px ${currentPersonality.themeColor}20`
        }}
      >
        {/* Drag Handle */}
        <div className="sticky top-0 z-20 pt-3 pb-2 flex justify-center">
          <div className="w-12 h-1.5 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 pb-3 pt-1 border-b border-white/10 bg-gradient-to-b from-slate-900/98 to-transparent backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <div 
              className="p-2 rounded-xl bg-gradient-to-br border"
              style={{
                borderColor: `${currentPersonality.themeColor}40`,
                background: `linear-gradient(135deg, ${currentPersonality.themeColor}20, ${currentPersonality.themeColor}10)`
              }}
            >
              <div style={{ color: currentPersonality.themeColor }}>
                <Icons.Lightning />
              </div>
            </div>
            <h3 className="text-base font-display font-bold text-white tracking-tight">
              Actions Rapides
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:border-white/30 hover:text-white hover:bg-white/10 transition-all duration-200 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center active:scale-95"
            aria-label="Fermer"
          >
            <Icons.Close />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Edit Personality */}
          <ActionButton
            onClick={() => handleActionWithClose(onEditPersonality)}
            icon={<Icons.Edit />}
            label="Modifier la personnalité"
            colorScheme="pink"
            showChevron
          />

          <Separator />

          {/* Function Calling Toggle */}
          <ActionButton
            onClick={() => handleActionWithClose(() => onToggleFunctionCalling(!isFunctionCallingEnabled))}
            icon={<Icons.Code />}
            label={`${isFunctionCallingEnabled ? 'Désactiver' : 'Activer'} Appel de fonction`}
            isToggle
            isEnabled={isFunctionCallingEnabled}
            colorScheme="blue"
            showBadge
          />
          
          {/* Google Search Toggle */}
          <ActionButton
            onClick={() => handleActionWithClose(() => onToggleGoogleSearch(!isGoogleSearchEnabled))}
            icon={<Icons.Search />}
            label={`${isGoogleSearchEnabled ? 'Désactiver' : 'Activer'} Google Search`}
            isToggle
            isEnabled={isGoogleSearchEnabled}
            colorScheme="emerald"
            showBadge
          />

          {/* Eye Tracking Toggle */}
          <ActionButton
            onClick={() => handleActionWithClose(() => onToggleEyeTracking(!isEyeTrackingEnabled))}
            icon={<Icons.Eye />}
            label={`${isEyeTrackingEnabled ? 'Désactiver' : 'Activer'} Suivi des Yeux`}
            isToggle
            isEnabled={isEyeTrackingEnabled}
            colorScheme="purple"
            showBadge
          />

          <Separator />
          
          {/* Tools List */}
          <ActionButton
            onClick={() => handleActionWithClose(onOpenToolsList)}
            icon={<Icons.Tools />}
            label="Voir les fonctions disponibles"
            colorScheme="default"
            showChevron
          />
        </div>

        {/* Bottom padding for safe area */}
        <div className="h-4 safe-area-bottom" />
      </div>

      {/* Styles */}
      <style>{`
        @keyframes ripple {
          0% {
            width: 0;
            height: 0;
            opacity: 0.5;
          }
          100% {
            width: 150px;
            height: 150px;
            opacity: 0;
          }
        }
        
        .animate-ripple {
          animation: ripple 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default memo(MobileActionsDrawer);

