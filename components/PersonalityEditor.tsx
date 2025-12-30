import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { Personality } from '../types';
import { DEFAULT_PERSONALITY, AVAILABLE_PERSONALITIES } from '../constants';

interface PersonalityEditorProps {
    isOpen: boolean;
    onClose: () => void;
    currentPersonality: Personality;
    onSave: (newPersonality: Personality) => void;
}

// --- Icons ---
const Icons = {
  Close: memo(() => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )),
  Save: memo(() => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )),
  Reset: memo(() => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  )),
  Upload: memo(() => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  )),
  Download: memo(() => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  )),
  Terminal: memo(() => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18.75V5.25A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25v13.5A2.25 2.25 0 005.25 21z" />
    </svg>
  )),
  Robot: memo(() => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
    </svg>
  )),
  Keyboard: memo(() => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5h10.5M6.75 10.5h10.5m-10.5 3h3m3 0h4.5m-7.5 3h7.5M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6z" />
    </svg>
  )),
  Warning: memo(() => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ))
};

// --- Sub-Components ---

// Ripple Button Component
const RippleButton = memo(({ 
  onClick, 
  children, 
  className = '', 
  disabled = false,
  style,
  ariaLabel
}: { 
  onClick: () => void; 
  children: React.ReactNode; 
  className?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  ariaLabel?: string;
}) => {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    
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
  }, [onClick, disabled]);

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      disabled={disabled}
      className={`relative overflow-hidden ${className}`}
      style={style}
      aria-label={ariaLabel}
    >
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 animate-ripple pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: 'translate(-50%, -50%)'
          }}
        />
      ))}
      {children}
    </button>
  );
});

RippleButton.displayName = 'RippleButton';

// Template Card Component with Preview
const TemplateCard = memo(({ 
  template, 
  isActive, 
  onSelect,
  themeColor 
}: { 
  template: Personality; 
  isActive: boolean;
  onSelect: () => void;
  themeColor: string;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        w-full text-left p-4 rounded-xl border transition-all duration-300 group
        ${isActive 
          ? 'bg-white/10 border-white/30' 
          : 'glass border-white/10 hover:border-white/20 hover:bg-white/10'
        }
        ${isHovered ? 'scale-[1.02] shadow-lg' : ''}
      `}
      style={isActive ? {
        borderColor: `${themeColor}50`,
        backgroundColor: `${themeColor}15`
      } : undefined}
      role="option"
      aria-selected={isActive}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`
          font-semibold text-sm transition-colors duration-300
          ${isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'}
        `}>
          {template.name}
        </span>
        <div className="flex items-center gap-2">
          {template.id === 'sara' && (
            <span 
              className="text-[9px] px-2 py-1 rounded-full border font-semibold"
              style={{
                backgroundColor: `${themeColor}20`,
                borderColor: `${themeColor}30`,
                color: themeColor
              }}
            >
              PRO
            </span>
          )}
          {isActive && (
            <div 
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ 
                backgroundColor: themeColor,
                boxShadow: `0 0 8px ${themeColor}`
              }}
            />
          )}
        </div>
      </div>
      <p className={`
        text-xs leading-relaxed transition-colors duration-300 line-clamp-2
        ${isActive ? 'text-slate-300' : 'text-slate-400 group-hover:text-slate-300'}
      `}>
        {template.description}
      </p>
      
      {/* Preview tooltip on hover */}
      {isHovered && !isActive && (
        <div className="mt-3 pt-3 border-t border-white/10 animate-in fade-in slide-in-from-top-1 duration-200">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Aperçu</p>
          <p className="text-[11px] text-slate-400 font-mono line-clamp-3 leading-relaxed">
            {template.systemInstruction.slice(0, 150)}...
          </p>
        </div>
      )}
    </button>
  );
});

TemplateCard.displayName = 'TemplateCard';

// Unsaved Changes Modal
const UnsavedChangesModal = memo(({ 
  isOpen, 
  onDiscard, 
  onCancel,
  themeColor 
}: { 
  isOpen: boolean; 
  onDiscard: () => void; 
  onCancel: () => void;
  themeColor: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div 
        className="relative bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/20 p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="unsaved-title"
        aria-describedby="unsaved-desc"
      >
        <div className="flex items-start gap-4 mb-6">
          <div 
            className="p-3 rounded-xl"
            style={{ backgroundColor: `${themeColor}20` }}
          >
            <div style={{ color: themeColor }}>
              <Icons.Warning />
            </div>
          </div>
          <div>
            <h3 id="unsaved-title" className="text-lg font-bold text-white mb-1">
              Modifications non sauvegardées
            </h3>
            <p id="unsaved-desc" className="text-sm text-slate-400">
              Vous avez des modifications en cours. Voulez-vous les abandonner ?
            </p>
          </div>
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium glass border border-white/10 text-slate-400 hover:text-white hover:border-white/30 transition-all duration-300"
          >
            Continuer l'édition
          </button>
          <button
            onClick={onDiscard}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 hover:text-red-300 transition-all duration-300"
          >
            Abandonner
          </button>
        </div>
      </div>
    </div>
  );
});

UnsavedChangesModal.displayName = 'UnsavedChangesModal';

// Line Numbers Component
const LineNumbers = memo(({ content }: { content: string }) => {
  const lineCount = useMemo(() => {
    return content.split('\n').length;
  }, [content]);

  return (
    <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col items-end pr-3 pt-4 sm:pt-6 text-xs font-mono text-slate-600 select-none pointer-events-none overflow-hidden">
      {Array.from({ length: lineCount }, (_, i) => (
        <div key={i} className="leading-relaxed h-[1.625rem]">
          {i + 1}
        </div>
      ))}
    </div>
  );
});

LineNumbers.displayName = 'LineNumbers';

// Keyboard Shortcut Badge
const ShortcutBadge = memo(({ keys }: { keys: string[] }) => (
  <div className="flex items-center gap-1">
    {keys.map((key, i) => (
      <React.Fragment key={key}>
        <kbd className="px-1.5 py-0.5 rounded bg-slate-700/50 border border-slate-600/50 text-[10px] font-mono text-slate-400">
          {key}
        </kbd>
        {i < keys.length - 1 && <span className="text-slate-600 text-[10px]">+</span>}
      </React.Fragment>
    ))}
  </div>
));

ShortcutBadge.displayName = 'ShortcutBadge';

// --- Main Component ---
const PersonalityEditor: React.FC<PersonalityEditorProps> = ({ 
    isOpen, 
    onClose, 
    currentPersonality, 
    onSave 
}) => {
    const [instructions, setInstructions] = useState(currentPersonality.systemInstruction);
    const [originalInstructions, setOriginalInstructions] = useState(currentPersonality.systemInstruction);
    const [isSaving, setIsSaving] = useState(false);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    // Check if there are unsaved changes
    const hasUnsavedChanges = useMemo(() => {
      return instructions !== originalInstructions;
    }, [instructions, originalInstructions]);

    // Character count (memoized)
    const characterCount = useMemo(() => instructions.length, [instructions]);
    
    // Line count (memoized)
    const lineCount = useMemo(() => instructions.split('\n').length, [instructions]);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setInstructions(currentPersonality.systemInstruction);
            setOriginalInstructions(currentPersonality.systemInstruction);
            // Focus textarea after animation
            setTimeout(() => {
              textareaRef.current?.focus();
            }, 500);
        }
    }, [isOpen, currentPersonality]);

    // Keyboard shortcuts
    useEffect(() => {
      if (!isOpen) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        // Ctrl/Cmd + S to save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
          e.preventDefault();
          if (instructions.trim().length > 0 && !isSaving) {
            handleSubmit();
          }
        }
        
        // Escape to close (with unsaved check)
        if (e.key === 'Escape') {
          e.preventDefault();
          handleCloseAttempt();
        }

        // Ctrl/Cmd + Shift + R to reset
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
          e.preventDefault();
          handleReset();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, instructions, isSaving]);

    // Trap focus in modal
    useEffect(() => {
      if (!isOpen) return;
      
      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key !== 'Tab' || !modalRef.current) return;
        
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      };

      document.addEventListener('keydown', handleTabKey);
      return () => document.removeEventListener('keydown', handleTabKey);
    }, [isOpen]);

    const handleCloseAttempt = useCallback(() => {
      if (hasUnsavedChanges) {
        setShowUnsavedModal(true);
      } else {
        onClose();
      }
    }, [hasUnsavedChanges, onClose]);

    const handleDiscardChanges = useCallback(() => {
      setShowUnsavedModal(false);
      onClose();
    }, [onClose]);

    const handleTemplateSelect = useCallback((template: Personality) => {
        if (hasUnsavedChanges && 
            !confirm('Voulez-vous remplacer les instructions actuelles par ce template ?')) {
            return;
        }
        setInstructions(template.systemInstruction);
    }, [hasUnsavedChanges]);

    const handleReset = useCallback(() => {
      if (confirm('Réinitialiser aux valeurs par défaut ?')) {
        setInstructions(DEFAULT_PERSONALITY.systemInstruction);
      }
    }, []);

    const handleExport = useCallback(() => {
        const personalityToExport = { ...currentPersonality, systemInstruction: instructions };
        const dataStr = JSON.stringify(personalityToExport, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `neurochat-personality-${currentPersonality.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [currentPersonality, instructions]);

    const handleImport = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const imported = JSON.parse(event.target?.result as string) as Personality;
                    if (imported.systemInstruction) {
                        if (confirm('Voulez-vous importer cette personnalité ? Les instructions actuelles seront remplacées.')) {
                            setInstructions(imported.systemInstruction);
                        }
                    } else {
                        alert('Le fichier importé ne contient pas de personnalité valide.');
                    }
                } catch {
                    alert('Erreur lors de l\'importation : fichier invalide.');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }, []);

    const handleSubmit = useCallback(() => {
        setIsSaving(true);
        setTimeout(() => {
            onSave({ ...currentPersonality, systemInstruction: instructions });
            setOriginalInstructions(instructions);
            setIsSaving(false);
            onClose();
        }, 600);
    }, [currentPersonality, instructions, onSave, onClose]);

    if (!isOpen) return null;

    return (
        <>
          <div 
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby="editor-title"
          >
              {/* Backdrop */}
              <div 
                  className="absolute inset-0 bg-black/80 backdrop-blur-xl transition-opacity" 
                  onClick={handleCloseAttempt}
                  aria-hidden="true"
              />
              
              {/* Modal Container */}
              <div 
                  ref={modalRef}
                  className="relative w-full max-w-6xl bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden flex flex-col h-[85vh] sm:h-[80vh] animate-in slide-in-from-bottom-8 zoom-in-95 duration-500"
                  style={{
                      boxShadow: `0 25px 80px rgba(0, 0, 0, 0.8), 0 0 60px ${currentPersonality.themeColor}30`
                  }}
              >
                  {/* Header Strip */}
                  <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/30">
                      <div className="flex items-center gap-4">
                          <div 
                              className="p-3 rounded-xl border transition-all duration-300 hover:scale-110"
                              style={{ 
                                  backgroundColor: `${currentPersonality.themeColor}20`,
                                  borderColor: `${currentPersonality.themeColor}30`,
                                  color: currentPersonality.themeColor
                              }}
                          >
                              <Icons.Terminal />
                          </div>
                          <div>
                              <h2 id="editor-title" className="text-xl sm:text-2xl font-display font-bold text-white flex items-center gap-3">
                                Configuration Système
                                {hasUnsavedChanges && (
                                  <span className="flex items-center gap-1.5 text-xs font-normal text-amber-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                    Non sauvegardé
                                  </span>
                                )}
                              </h2>
                              <p className="text-xs text-slate-400 mt-0.5">Mode Édition Avancé</p>
                          </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {/* Keyboard shortcuts toggle */}
                        <button
                          onClick={() => setShowShortcuts(!showShortcuts)}
                          className={`
                            p-2 rounded-lg glass border transition-all duration-300 hover:scale-105 active:scale-95
                            ${showShortcuts 
                              ? 'border-white/30 text-white bg-white/10' 
                              : 'border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                            }
                          `}
                          aria-label="Afficher les raccourcis clavier"
                          aria-pressed={showShortcuts}
                        >
                          <Icons.Keyboard />
                        </button>

                        {/* Close button */}
                        <RippleButton 
                            onClick={handleCloseAttempt}
                            className="p-2 sm:p-3 rounded-xl glass border border-white/10 hover:border-white/30 text-slate-300 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95"
                            ariaLabel="Fermer l'éditeur"
                        >
                            <Icons.Close />
                        </RippleButton>
                      </div>
                  </div>

                  {/* Keyboard Shortcuts Panel */}
                  {showShortcuts && (
                    <div className="px-6 sm:px-8 py-3 border-b border-white/10 bg-slate-800/30 animate-in slide-in-from-top-2 duration-200">
                      <div className="flex flex-wrap items-center gap-6 text-xs">
                        <div className="flex items-center gap-2">
                          <ShortcutBadge keys={['Ctrl', 'S']} />
                          <span className="text-slate-400">Sauvegarder</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ShortcutBadge keys={['Esc']} />
                          <span className="text-slate-400">Fermer</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ShortcutBadge keys={['Ctrl', 'Shift', 'R']} />
                          <span className="text-slate-400">Réinitialiser</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Main Content Grid */}
                  <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
                      
                      {/* LEFT: Templates & Tools */}
                      <div className="hidden lg:flex lg:col-span-3 flex-col border-r border-white/10 bg-slate-900/50 min-h-0">
                          <div className="flex-shrink-0 p-4 sm:p-6 border-b border-white/10">
                              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Modèles</h3>
                              <p className="text-xs text-slate-500">Sélectionnez une base</p>
                          </div>
                          
                          <div 
                            className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2 min-h-0"
                            role="listbox"
                            aria-label="Liste des modèles de personnalité"
                          >
                              {AVAILABLE_PERSONALITIES.map((template) => (
                                  <TemplateCard
                                    key={template.id}
                                    template={template}
                                    isActive={instructions === template.systemInstruction}
                                    onSelect={() => handleTemplateSelect(template)}
                                    themeColor={currentPersonality.themeColor}
                                  />
                              ))}
                          </div>

                          <div className="flex-shrink-0 p-4 border-t border-white/10 bg-white/[0.02]">
                              <div className="grid grid-cols-2 gap-3">
                                  <RippleButton 
                                      onClick={handleImport}
                                      className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl glass border border-dashed border-white/20 hover:border-white/40 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-all duration-300 group"
                                      ariaLabel="Importer une personnalité"
                                  >
                                      <Icons.Upload />
                                      <span className="text-xs font-medium uppercase tracking-wide">Import</span>
                                  </RippleButton>
                                  <RippleButton 
                                      onClick={handleExport}
                                      className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl glass border border-dashed border-white/20 hover:border-white/40 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-all duration-300 group"
                                      ariaLabel="Exporter la personnalité"
                                  >
                                      <Icons.Download />
                                      <span className="text-xs font-medium uppercase tracking-wide">Export</span>
                                  </RippleButton>
                              </div>
                          </div>
                      </div>

                      {/* RIGHT: Code Editor */}
                      <div className="col-span-1 lg:col-span-9 flex flex-col bg-slate-900/30 relative min-h-0 overflow-hidden">
                          {/* Editor Toolbar */}
                          <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 glass-intense border-b border-white/10">
                               <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                                      <span 
                                        className={`w-2 h-2 rounded-full transition-all duration-300 ${hasUnsavedChanges ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                        style={{ 
                                          boxShadow: hasUnsavedChanges 
                                            ? '0 0 8px rgba(245,158,11,0.6)' 
                                            : '0 0 8px rgba(16,185,129,0.6)' 
                                        }}
                                      />
                                      SYSTEM_INSTRUCTION.TXT
                                  </div>
                                  <div className="h-4 w-[1px] bg-white/10" />
                                  <div className="text-xs text-slate-500 font-mono flex items-center gap-3">
                                      <span>{characterCount.toLocaleString()} caractères</span>
                                      <span className="text-slate-600">•</span>
                                      <span>{lineCount} lignes</span>
                                  </div>
                               </div>

                               <RippleButton
                                  onClick={handleReset}
                                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass border border-white/10 hover:border-red-500/30 hover:bg-red-500/10 text-xs text-slate-400 hover:text-red-400 transition-all duration-300"
                                  ariaLabel="Réinitialiser les instructions"
                              >
                                  <Icons.Reset />
                                  <span>RESET</span>
                              </RippleButton>
                          </div>

                          {/* Editor Area with Line Numbers */}
                          <div className="flex-1 relative group min-h-0 overflow-hidden">
                              {/* Line numbers */}
                              <LineNumbers content={instructions} />
                              
                              {/* Textarea */}
                              <textarea 
                                  ref={textareaRef}
                                  value={instructions}
                                  onChange={(e) => setInstructions(e.target.value)}
                                  className="w-full h-full bg-transparent text-sm sm:text-base font-mono text-slate-200 pl-14 pr-4 sm:pr-6 py-4 sm:py-6 focus:outline-none resize-none leading-relaxed custom-scrollbar selection:bg-indigo-500/30 selection:text-indigo-200 overflow-y-auto"
                                  placeholder="// Entrez les instructions système ici..."
                                  spellCheck={false}
                                  aria-label="Instructions système"
                              />
                              
                              {/* Mobile Template Trigger */}
                              <div className="lg:hidden absolute bottom-4 right-4 z-10">
                                  <RippleButton 
                                      onClick={() => { /* TODO: Open mobile template sheet */ }}
                                      className="p-3 rounded-full glass border border-white/20 text-slate-400 hover:text-white shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
                                      ariaLabel="Ouvrir les modèles"
                                  >
                                      <Icons.Robot />
                                  </RippleButton>
                              </div>

                              {/* Focus glow effect */}
                              <div 
                                className="absolute inset-0 pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 rounded-lg"
                                style={{
                                  boxShadow: `inset 0 0 60px ${currentPersonality.themeColor}10`
                                }}
                              />
                          </div>

                          {/* Action Footer */}
                          <div className="flex-shrink-0 p-4 sm:p-6 border-t border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/30 flex items-center justify-between">
                              {/* Left: Status */}
                              <div className="text-xs text-slate-500">
                                {hasUnsavedChanges ? (
                                  <span className="flex items-center gap-2 text-amber-400">
                                    <Icons.Warning />
                                    Modifications en attente
                                  </span>
                                ) : (
                                  <span className="text-emerald-400">✓ Synchronisé</span>
                                )}
                              </div>

                              {/* Right: Actions */}
                              <div className="flex gap-3">
                                <RippleButton 
                                    onClick={handleCloseAttempt}
                                    className="px-5 py-2.5 rounded-xl text-sm font-medium glass border border-white/10 text-slate-400 hover:text-white hover:border-white/30 transition-all duration-300 hover:scale-105 active:scale-95"
                                    ariaLabel="Annuler et fermer"
                                >
                                    Annuler
                                </RippleButton>
                                <RippleButton 
                                    onClick={handleSubmit}
                                    disabled={isSaving || instructions.trim().length === 0}
                                    className="relative overflow-hidden px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed group"
                                    style={{
                                        backgroundColor: currentPersonality.themeColor,
                                        boxShadow: `0 0 20px ${currentPersonality.themeColor}40, 0 0 40px ${currentPersonality.themeColor}20`
                                    }}
                                    ariaLabel="Sauvegarder les modifications"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                    <span className="relative flex items-center gap-2">
                                        {isSaving ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                <span>Traitement...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Icons.Save />
                                                <span>Sauvegarder</span>
                                            </>
                                        )}
                                    </span>
                                </RippleButton>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
              
              <style>{`
                  @keyframes ripple {
                    0% {
                      width: 0;
                      height: 0;
                      opacity: 0.5;
                    }
                    100% {
                      width: 200px;
                      height: 200px;
                      opacity: 0;
                    }
                  }
                  
                  .animate-ripple {
                    animation: ripple 0.6s ease-out forwards;
                  }

                  .custom-scrollbar::-webkit-scrollbar {
                      width: 8px;
                  }
                  .custom-scrollbar::-webkit-scrollbar-track {
                      background: rgba(15, 23, 42, 0.5);
                  }
                  .custom-scrollbar::-webkit-scrollbar-thumb {
                      background: rgba(255, 255, 255, 0.1);
                      border-radius: 4px;
                      transition: all 0.3s ease;
                  }
                  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                      background: rgba(255, 255, 255, 0.2);
                  }
              `}</style>
          </div>

          {/* Unsaved Changes Modal */}
          <UnsavedChangesModal
            isOpen={showUnsavedModal}
            onDiscard={handleDiscardChanges}
            onCancel={() => setShowUnsavedModal(false)}
            themeColor={currentPersonality.themeColor}
          />
        </>
    );
};

export default PersonalityEditor;
