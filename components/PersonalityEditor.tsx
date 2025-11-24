import React, { useState, useEffect } from 'react';
import { Personality } from '../types';

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
    const [name, setName] = useState(currentPersonality.name);
    const [description, setDescription] = useState(currentPersonality.description);
    const [instructions, setInstructions] = useState(currentPersonality.systemInstruction);
    const [isSaving, setIsSaving] = useState(false);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setName(currentPersonality.name);
            setDescription(currentPersonality.description);
            setInstructions(currentPersonality.systemInstruction);
        }
    }, [isOpen, currentPersonality]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        
        // Simulate small delay for effect
        setTimeout(() => {
            onSave({
                ...currentPersonality,
                name,
                description,
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
                    <div>
                        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Nom de l'Assistant</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                            placeholder="Ex: Expert Python"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Description Courte</label>
                        <input 
                            type="text" 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                            placeholder="Ex: Spécialiste en optimisation de code"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Instructions Système (Prompt)</label>
                        <textarea 
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all min-h-[120px] font-mono text-sm leading-relaxed"
                            placeholder="Tu es un expert en..."
                        />
                        <p className="mt-2 text-xs text-slate-500">
                            Ces instructions définissent comment l'IA se comporte, son ton et ses connaissances.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-6 border-t border-white/5 bg-black/20 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                    <button 
                        onClick={onClose}
                        className="px-4 sm:px-5 py-2.5 rounded-lg sm:rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all touch-manipulation min-h-[44px]"
                    >
                        Annuler
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={isSaving}
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
    );
};

export default PersonalityEditor;
