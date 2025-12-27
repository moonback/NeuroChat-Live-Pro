import React, { useState, useEffect } from 'react';
import { Personality } from '../types';
import { DEFAULT_PERSONALITY, AVAILABLE_PERSONALITIES } from '../constants';

interface PersonalityEditorProps {
    isOpen: boolean;
    onClose: () => void;
    currentPersonality: Personality;
    onSave: (newPersonality: Personality) => void;
}

const PersonalityEditor: React.FC<PersonalityEditorProps> = ({ 
    isOpen, 
    onClose, 
    currentPersonality, 
    onSave 
}) => {
    const [instructions, setInstructions] = useState(currentPersonality.systemInstruction);
    const [isSaving, setIsSaving] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
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
        setShowTemplates(false);
    };

    const handleExport = () => {
        const personalityToExport = {
            ...currentPersonality,
            systemInstruction: instructions
        };
        const dataStr = JSON.stringify(personalityToExport, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `personnalite-${currentPersonality.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
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
                    console.error('Import error:', error);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        
        // Simulate small delay for effect
        setTimeout(() => {
            onSave({
                ...currentPersonality,
                systemInstruction: instructions
            });
            setIsSaving(false);
            onClose();
        }, 600);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in">
            <div 
                className="relative w-full max-w-lg mx-2 sm:mx-4 bg-[#0f0f19] border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]"
                style={{
                    boxShadow: `0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px ${currentPersonality.themeColor}20`
                }}
            >
                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <h2 className="text-lg sm:text-xl font-display font-bold text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Modifier la Personnalité
                    </h2>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-4 sm:space-y-5">
                    

                    {/* Templates Section */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
                                Templates de Personnalités
                            </label>
                            <button
                                onClick={() => setShowTemplates(!showTemplates)}
                                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors px-3 py-1.5 rounded-lg border border-indigo-500/30 hover:border-indigo-500/50 hover:bg-indigo-500/10 flex items-center gap-1.5"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                {showTemplates ? 'Masquer' : 'Afficher'} Templates
                            </button>
                        </div>
                        
                        {showTemplates && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 max-h-[200px] overflow-y-auto custom-scrollbar p-2 bg-black/20 rounded-lg border border-white/5">
                                {AVAILABLE_PERSONALITIES.map((template) => (
                                    <button
                                        key={template.id}
                                        onClick={() => handleTemplateSelect(template)}
                                        className="text-left p-3 rounded-lg border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all duration-200 group"
                                    >
                                        <div className="flex items-start gap-2">
                                            <span className="text-lg flex-shrink-0">🤖</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">
                                                    {template.name}
                                                </p>
                                                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                                                    {template.description}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
                                Instructions Système (Prompt)
                            </label>
                            <div className="flex items-center gap-3">
                                <span className={`text-xs ${
                                    characterCount > 0 ? 'text-slate-400' : 'text-slate-600'
                                }`}>
                                    {characterCount} caractères
                                </span>
                                <button
                                    onClick={() => {
                                        if (confirm('Êtes-vous sûr de vouloir réinitialiser à la personnalité par défaut ? Vos modifications actuelles seront perdues.')) {
                                            setInstructions(DEFAULT_PERSONALITY.systemInstruction);
                                        }
                                    }}
                                    className="text-xs text-slate-400 hover:text-indigo-400 transition-colors px-2 py-1 rounded hover:bg-indigo-500/10"
                                    title="Réinitialiser à la personnalité par défaut"
                                >
                                    Réinitialiser
                                </button>
                            </div>
                        </div>
                        <textarea 
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all min-h-[200px] sm:min-h-[250px] font-mono text-sm leading-relaxed resize-y"
                            placeholder="Tu es un expert en..."
                        />
                        <p className="mt-2 text-xs text-slate-500">
                            Ces instructions définissent comment l'IA se comporte, son ton et ses connaissances. Elles sont appliquées à chaque nouvelle connexion.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-6 border-t border-white/5 bg-black/20">
                    {/* Export/Import Actions */}
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/5">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            <span>Export / Import</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleExport}
                                className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all flex items-center gap-1.5"
                                title="Exporter la personnalité"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Exporter
                            </button>
                            <button
                                onClick={handleImport}
                                className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all flex items-center gap-1.5"
                                title="Importer une personnalité"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                Importer
                            </button>
                        </div>
                    </div>
                    
                    {/* Save/Cancel Buttons */}
                    <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                        <button 
                            onClick={onClose}
                            className="px-4 sm:px-5 py-2.5 rounded-lg sm:rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all touch-manipulation min-h-[44px]"
                        >
                            Annuler
                        </button>
                        <button 
                            onClick={handleSubmit}
                            disabled={isSaving || instructions.trim().length === 0}
                            className="px-5 sm:px-6 py-2.5 rounded-lg sm:rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 touch-manipulation min-h-[44px]"
                        >
                            {isSaving ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Application...
                                </>
                            ) : (
                                'Sauvegarder'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PersonalityEditor;
