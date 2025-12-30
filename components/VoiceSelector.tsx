import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { AVAILABLE_VOICES, VoiceOption } from '../constants';

interface VoiceSelectorProps {
  currentVoice: string;
  onVoiceChange: (voiceName: string) => void;
  disabled?: boolean;
}

// --- Icons ---
const Icons = {
  ChevronDown: memo(() => (
    <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )),
  Check: memo(() => (
    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  )),
  Waveform: memo(() => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
  ))
};

// --- Voice Option Component ---
const VoiceOptionItem = memo(({ 
  voice, 
  isSelected, 
  onSelect,
  isHovered,
  onHover
}: { 
  voice: VoiceOption; 
  isSelected: boolean; 
  onSelect: () => void;
  isHovered: boolean;
  onHover: (hovered: boolean) => void;
}) => {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

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
      }, 500);
    }
    onSelect();
  }, [onSelect]);

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className={`
        relative w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 
        rounded-lg sm:rounded-xl transition-all duration-300 group touch-manipulation min-h-[44px]
        overflow-hidden
        ${isSelected 
          ? 'bg-white/10 border border-white/20' 
          : 'hover:bg-white/5 border border-transparent'
        }
        ${isHovered && !isSelected ? 'scale-[1.02] bg-white/[0.03]' : ''}
      `}
      role="option"
      aria-selected={isSelected}
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

      {/* Voice icon */}
      <span className="text-xl sm:text-2xl transition-transform duration-300 group-hover:scale-110">
        {voice.icon}
      </span>
      
      {/* Voice info */}
      <div className="flex-1 text-left min-w-0">
        <div className="font-display text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5 sm:gap-2">
          <span className="truncate">{voice.name}</span>
          {isSelected && (
            <div className="text-emerald-400 flex-shrink-0 animate-in zoom-in duration-200">
              <Icons.Check />
            </div>
          )}
        </div>
        <div className="font-body text-[10px] sm:text-xs text-slate-400 group-hover:text-slate-300 transition-colors truncate">
          {voice.description}
        </div>
      </div>

      {/* Hover indicator */}
      {isHovered && !isSelected && (
        <div className="absolute right-3 opacity-50">
          <Icons.Waveform />
        </div>
      )}

      {/* Selected glow */}
      {isSelected && (
        <div className="absolute inset-0 pointer-events-none rounded-xl opacity-30">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-transparent to-emerald-500/20" />
        </div>
      )}
    </button>
  );
});

VoiceOptionItem.displayName = 'VoiceOptionItem';

// --- Main Component ---
const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  currentVoice,
  onVoiceChange,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredVoiceId, setHoveredVoiceId] = useState<string | null>(null);
  const [isPressed, setIsPressed] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const currentVoiceOption = AVAILABLE_VOICES.find(v => v.id === currentVoice) || AVAILABLE_VOICES[3];

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = AVAILABLE_VOICES.findIndex(v => v.id === currentVoice);
        const nextIndex = e.key === 'ArrowDown' 
          ? (currentIndex + 1) % AVAILABLE_VOICES.length
          : (currentIndex - 1 + AVAILABLE_VOICES.length) % AVAILABLE_VOICES.length;
        onVoiceChange(AVAILABLE_VOICES[nextIndex].id);
      } else if (e.key === 'Enter') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentVoice, onVoiceChange]);

  const handleVoiceSelect = useCallback((voiceId: string) => {
    onVoiceChange(voiceId);
    setIsOpen(false);
  }, [onVoiceChange]);

  const toggleDropdown = useCallback(() => {
    if (!disabled) {
      setIsOpen(prev => !prev);
    }
  }, [disabled]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main Button */}
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        onMouseDown={() => !disabled && setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Voix sélectionnée: ${currentVoiceOption.name}`}
        className={`
          group relative flex items-center gap-1 md:gap-1.5 sm:gap-2 
          px-1.5 md:px-2.5 sm:px-3 md:px-4 py-1.5 md:py-2 sm:py-2 md:py-2.5 
          rounded-lg sm:rounded-xl glass-intense border border-white/10 
          transition-all duration-300 
          min-h-[36px] md:min-h-[44px]
          touch-manipulation
          ${disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:border-white/20 hover:scale-105 active:scale-95'
          }
          ${isOpen ? 'border-white/30 bg-white/10' : ''}
          ${isPressed && !disabled ? 'scale-95' : ''}
        `}
        style={{
          boxShadow: isOpen 
            ? '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
            : '0 8px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Voice emoji */}
        <span className={`
          text-sm md:text-base sm:text-lg md:text-xl
          transition-transform duration-300
          ${isOpen ? 'scale-110' : 'group-hover:scale-110'}
        `}>
          {currentVoiceOption.icon}
        </span>
        
        {/* Voice name (hidden on mobile) */}
        <div className="flex flex-col items-start hidden sm:flex">
          <span className="font-display text-[10px] sm:text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">
            Voix: {currentVoiceOption.name}
          </span>
        </div>
        
        {/* Chevron */}
        <div className={`
          text-slate-400 group-hover:text-white 
          transition-all duration-300 
          ${isOpen ? 'rotate-180 text-white' : ''}
        `}>
          <Icons.ChevronDown />
        </div>

        {/* Open indicator glow */}
        {isOpen && (
          <div className="absolute inset-0 rounded-lg sm:rounded-xl pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-transparent to-indigo-500/10 rounded-lg sm:rounded-xl" />
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Voice List */}
          <div 
            className="absolute top-full mt-2 right-0 w-[calc(100vw-2rem)] sm:w-64 md:w-72 max-w-[calc(100vw-2rem)] sm:max-w-none glass-intense rounded-2xl border border-white/10 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 zoom-in-95 duration-200"
            style={{
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(99, 102, 241, 0.15)'
            }}
            role="listbox"
            aria-label="Liste des voix disponibles"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10 bg-white/[0.03]">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Icons.Waveform />
                <span className="font-semibold uppercase tracking-wider">Sélectionner une voix</span>
              </div>
            </div>

            {/* Voice options */}
            <div className="p-2 space-y-1 max-h-[50vh] overflow-y-auto custom-scrollbar">
              {AVAILABLE_VOICES.map((voice) => (
                <VoiceOptionItem
                  key={voice.id}
                  voice={voice}
                  isSelected={voice.id === currentVoice}
                  onSelect={() => handleVoiceSelect(voice.id)}
                  isHovered={hoveredVoiceId === voice.id}
                  onHover={(hovered) => setHoveredVoiceId(hovered ? voice.id : null)}
                />
              ))}
            </div>
            
            {/* Footer tip */}
            <div className="px-4 py-3 bg-white/5 border-t border-white/10">
              <p className="font-body text-[10px] text-slate-400 text-center flex items-center justify-center gap-2">
                <span>💡</span>
                <span>Changez de voix avant de démarrer une session</span>
              </p>
            </div>
          </div>
        </>
      )}

      {/* Styles */}
      <style>{`
        @keyframes ripple {
          0% {
            width: 0;
            height: 0;
            opacity: 0.5;
          }
          100% {
            width: 100px;
            height: 100px;
            opacity: 0;
          }
        }
        
        .animate-ripple {
          animation: ripple 0.5s ease-out forwards;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
};

export default VoiceSelector;
