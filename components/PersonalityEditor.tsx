import React, { useState, useEffect } from 'react';
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
  Close: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Save: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  ),
  Reset: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  ),
  Upload: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  ),
  Download: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  ),
  Terminal: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18.75V5.25A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25v13.5A2.25 2.25 0 005.25 21z" />
    </svg>
  ),
  Robot: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
    </svg>
  )
};

const PersonalityEditor: React.FC<PersonalityEditorProps> = ({ 
    isOpen, 
    onClose, 
    currentPersonality, 
    onSave 
}) => {
    const [instructions, setInstructions] = useState(currentPersonality.systemInstruction);
    const [isSaving, setIsSaving] = useState(false);
    const [characterCount, setCharacterCount] = useState(0);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setInstructions(currentPersonality.systemInstruction);
            setCharacterCount(currentPersonality.systemInstruction.length);
        }
    }, [isOpen, currentPersonality]);

    // Update character count when instructions change
    useEffect(() => {
        setCharacterCount(instructions.length);
    }, [instructions]);

    const handleTemplateSelect = (template: Personality) => {
        if (instructions.trim() !== currentPersonality.systemInstruction.trim() && 
            !confirm('Voulez-vous remplacer les instructions actuelles par ce template ?')) {
            return;
        }
        setInstructions(template.systemInstruction);
    };

    const handleExport = () => {
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
    };

    const handleImport = () => {
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
                } catch (error) {
                    alert('Erreur lors de l\'importation : fichier invalide.');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setTimeout(() => {
            onSave({ ...currentPersonality, systemInstruction: instructions });
            setIsSaving(false);
            onClose();
        }, 600);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-xl transition-opacity" 
                onClick={onClose}
            />
            
            {/* Modal Container */}
            <div 
                className="relative w-full max-w-6xl bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden flex flex-col h-[85vh] sm:h-[80vh] animate-in slide-in-from-bottom-8 duration-500"
                style={{
                    boxShadow: `0 25px 80px rgba(0, 0, 0, 0.8), 0 0 60px ${currentPersonality.themeColor}30`
                }}
            >
                {/* Header Strip */}
                <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/30">
                    <div className="flex items-center gap-4">
                        <div 
                            className="p-3 rounded-lg border"
                            style={{ 
                                backgroundColor: `${currentPersonality.themeColor}20`,
                                borderColor: `${currentPersonality.themeColor}30`,
                                color: currentPersonality.themeColor
                            }}
                        >
                            <Icons.Terminal />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-display font-bold text-white">Configuration Système</h2>
                            <p className="text-xs text-slate-400 mt-0.5">Mode Édition Avancé</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={onClose}
                        className="p-2 sm:p-3 rounded-lg glass border border-white/10 hover:border-white/30 text-slate-300 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95"
                        aria-label="Fermer la modal"
                    >
                        <Icons.Close />
                    </button>
                </div>

                {/* Main Content Grid */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
                    
                    {/* LEFT: Templates & Tools (Scrollable) */}
                    <div className="hidden lg:flex lg:col-span-3 flex-col border-r border-white/10 bg-slate-900/50 min-h-0">
                        <div className="flex-shrink-0 p-4 sm:p-6 border-b border-white/10">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Modèles</h3>
                            <p className="text-xs text-slate-500">Sélectionnez une base</p>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2 min-h-0">
                            {AVAILABLE_PERSONALITIES.map((template) => (
                                <button
                                    key={template.id}
                                    onClick={() => handleTemplateSelect(template)}
                                    className="w-full text-left p-4 rounded-xl glass border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 group"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold text-sm text-slate-200 group-hover:text-white transition-colors">
                                            {template.name}
                                        </span>
                                        {template.id === 'sara' && (
                                            <span 
                                                className="text-[9px] px-2 py-1 rounded-full border font-semibold"
                                                style={{
                                                    backgroundColor: `${currentPersonality.themeColor}20`,
                                                    borderColor: `${currentPersonality.themeColor}30`,
                                                    color: currentPersonality.themeColor
                                                }}
                                            >
                                                PRO
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed group-hover:text-slate-300 transition-colors">
                                        {template.description}
                                    </p>
                                </button>
                            ))}
                        </div>

                        <div className="flex-shrink-0 p-4 border-t border-white/10 bg-white/[0.02]">
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={handleImport}
                                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl glass border border-dashed border-white/20 hover:border-white/40 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-all duration-300 group"
                                >
                                    <Icons.Upload />
                                    <span className="text-xs font-medium uppercase tracking-wide">Import</span>
                                </button>
                                <button 
                                    onClick={handleExport}
                                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl glass border border-dashed border-white/20 hover:border-white/40 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-all duration-300 group"
                                >
                                    <Icons.Download />
                                    <span className="text-xs font-medium uppercase tracking-wide">Export</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Code Editor */}
                    <div className="col-span-1 lg:col-span-9 flex flex-col bg-slate-900/30 relative min-h-0 overflow-hidden">
                        {/* Editor Toolbar */}
                        <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 glass-intense border-b border-white/10">
                             <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                                    SYSTEM_INSTRUCTION.TXT
                                </div>
                                <div className="h-4 w-[1px] bg-white/10"></div>
                                <div className="text-xs text-slate-500 font-mono">
                                    {characterCount} CARS
                                </div>
                             </div>

                             <button
                                onClick={() => {
                                    if (confirm('Réinitialiser aux valeurs par défaut ?')) {
                                        setInstructions(DEFAULT_PERSONALITY.systemInstruction);
                                    }
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass border border-white/10 hover:border-red-500/30 hover:bg-red-500/10 text-xs text-slate-400 hover:text-red-400 transition-all duration-300"
                            >
                                <Icons.Reset />
                                <span>RESET</span>
                            </button>
                        </div>

                        {/* Editor Area */}
                        <div className="flex-1 relative group min-h-0 overflow-hidden">
                            <textarea 
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                className="w-full h-full bg-transparent text-sm sm:text-base font-mono text-slate-200 p-4 sm:p-6 focus:outline-none resize-none leading-relaxed custom-scrollbar selection:bg-indigo-500/30 selection:text-indigo-200 overflow-y-auto"
                                placeholder="// Entrez les instructions système ici..."
                                spellCheck={false}
                            />
                            
                            {/* Mobile Template Trigger (Visible only on mobile) */}
                            <div className="lg:hidden absolute bottom-4 right-4 z-10">
                                <button 
                                    onClick={() => { /* TODO: Open mobile template sheet if needed */ }}
                                    className="p-3 rounded-full glass border border-white/20 text-slate-400 hover:text-white shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
                                >
                                    <Icons.Robot />
                                </button>
                            </div>
                        </div>

                        {/* Action Footer */}
                        <div className="flex-shrink-0 p-4 sm:p-6 border-t border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/30 flex justify-end gap-3">
                            <button 
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-xl text-sm font-medium glass border border-white/10 text-slate-400 hover:text-white hover:border-white/30 transition-all duration-300 hover:scale-105 active:scale-95"
                            >
                                Annuler
                            </button>
                            <button 
                                onClick={handleSubmit}
                                disabled={isSaving || instructions.trim().length === 0}
                                className="relative overflow-hidden px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed group"
                                style={{
                                    backgroundColor: currentPersonality.themeColor,
                                    boxShadow: `0 0 20px ${currentPersonality.themeColor}40, 0 0 40px ${currentPersonality.themeColor}20`
                                }}
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
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(15, 23, 42, 0.5);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(56, 189, 248, 0.3);
                    border-radius: 4px;
                    transition: all 0.3s ease;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(56, 189, 248, 0.6);
                }
            `}</style>
        </div>
    );
};

export default PersonalityEditor;