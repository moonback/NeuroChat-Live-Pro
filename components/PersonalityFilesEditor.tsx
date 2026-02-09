import React, { useState, useRef } from 'react';
import { X, Save, Plus, Trash2, FileText, User, Brain, History, Download, Upload, RefreshCw } from 'lucide-react';
import { usePersonalityFiles } from '../hooks/usePersonalityFiles';

interface PersonalityFilesEditorProps {
    isOpen: boolean;
    onClose: () => void;
}

const PersonalityFilesEditor: React.FC<PersonalityFilesEditorProps> = ({ isOpen, onClose }) => {
    const {
        files,
        history,
        isLoading,
        error,
        refreshAll,
        updateSoul,
        updateUser,
        updateMemory,
        addUserInformation,
        addPreference,
        addImportantNote,
        removeUserInformation,
        removePreference,
        removeImportantNote,
        exportData,
        importData
    } = usePersonalityFiles();

    const [activeTab, setActiveTab] = useState<'soul' | 'user' | 'memory' | 'history'>('soul');

    // États locaux pour les ajouts
    const [inputs, setInputs] = useState({
        soulTrait: '',
        soulValue: '',
        memoryInfo: '',
        memoryPref: '',
        memoryNote: ''
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    // --- Handlers génériques ---
    const handleInputChange = (key: keyof typeof inputs, value: string) => {
        setInputs(prev => ({ ...prev, [key]: value }));
    };

    // --- SOUL Handlers ---
    const handleAddSoulTrait = async () => {
        if (inputs.soulTrait.trim() && files) {
            await updateSoul({ personality: [...files.soul.personality, inputs.soulTrait.trim()] });
            handleInputChange('soulTrait', '');
        }
    };
    const handleRemoveSoulTrait = async (index: number) => {
        if (files) await updateSoul({ personality: files.soul.personality.filter((_, i) => i !== index) });
    };

    const handleAddSoulValue = async () => {
        if (inputs.soulValue.trim() && files) {
            await updateSoul({ values: [...files.soul.values, inputs.soulValue.trim()] });
            handleInputChange('soulValue', '');
        }
    };
    const handleRemoveSoulValue = async (index: number) => {
        if (files) await updateSoul({ values: files.soul.values.filter((_, i) => i !== index) });
    };

    const handleSoulNameChange = async (name: string) => {
        if (files) await updateSoul({ name });
    };

    // --- USER Handlers ---
    const handleUserPrefChange = async (key: 'communicationStyle' | 'timezone' | 'language', value: string) => {
        if (files) {
            await updateUser({
                preferences: { ...files.user.preferences, [key]: value }
            });
        }
    };

    // --- MEMORY Handlers ---
    const handleAddMemoryInfo = async () => {
        if (inputs.memoryInfo.trim()) {
            await addUserInformation(inputs.memoryInfo.trim());
            handleInputChange('memoryInfo', '');
        }
    };
    const handleAddMemoryPref = async () => {
        if (inputs.memoryPref.trim()) {
            await addPreference(inputs.memoryPref.trim());
            handleInputChange('memoryPref', '');
        }
    };
    const handleAddMemoryNote = async () => {
        if (inputs.memoryNote.trim()) {
            await addImportantNote(inputs.memoryNote.trim());
            handleInputChange('memoryNote', '');
        }
    };

    // --- Import / Export ---
    const handleExport = async () => {
        const json = await exportData();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `neurochat-personality-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (ev) => {
            const content = ev.target?.result as string;
            if (content) {
                const success = await importData(content);
                if (success) alert('Import réussi !');
                else alert('Erreur lors de l\'import.');
            }
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = '';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-5xl max-h-[90vh] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-white/10 flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 shrink-0">
                    <div className="flex items-center gap-3">
                        <Brain className="w-6 h-6 text-indigo-400" />
                        <div>
                            <h2 className="text-2xl font-bold text-white">Fichiers de Personnalité</h2>
                            <p className="text-xs text-indigo-300/80">Gestion complète de l'identité et de la mémoire</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={refreshAll} className="p-2 rounded-lg hover:bg-white/10 hover:text-indigo-400 transition" title="Rafraîchir">
                            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <div className="h-9 w-[1px] bg-white/10 mx-1"></div>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition" title="Fermer">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-2 border-b border-white/10 bg-black/20 overflow-x-auto shrink-0">
                    {[
                        { id: 'soul', label: 'Identité (SOUL)', icon: Brain, color: 'indigo' },
                        { id: 'user', label: 'Utilisateur (USER)', icon: User, color: 'blue' },
                        { id: 'memory', label: 'Mémoire (MEMORY)', icon: FileText, color: 'green' },
                        { id: 'history', label: 'Historique', icon: History, color: 'orange' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? `bg-${tab.color}-600/20 text-${tab.color}-300 border border-${tab.color}-500/30 shadow-[0_0_15px_rgba(0,0,0,0.3)]`
                                    : 'bg-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span className="font-medium">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-black/10">
                    {isLoading && !files ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
                        </div>
                    ) : error ? (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-center">
                            {error}
                        </div>
                    ) : files ? (
                        <div className="max-w-4xl mx-auto space-y-8">

                            {/* --- SOUL TAB --- */}
                            {activeTab === 'soul' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                                        <h3 className="text-lg font-semibold text-indigo-300 mb-4 flex items-center gap-2">
                                            <User className="w-5 h-5" /> Identité Principale
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1 block">Nom de l'assistant</label>
                                                <input
                                                    type="text"
                                                    value={files.soul.name}
                                                    onChange={(e) => handleSoulNameChange(e.target.value)}
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                                            <h3 className="text-lg font-semibold text-purple-300 mb-4">Traits de Personnalité</h3>
                                            <ul className="space-y-2 mb-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                                {files.soul.personality.map((trait, idx) => (
                                                    <li key={idx} className="flex justify-between items-center group bg-black/20 px-3 py-2 rounded-lg">
                                                        <span className="text-gray-300">{trait}</span>
                                                        <button onClick={() => handleRemoveSoulTrait(idx)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"><Trash2 className="w-4 h-4" /></button>
                                                    </li>
                                                ))}
                                            </ul>
                                            <div className="flex gap-2">
                                                <input
                                                    value={inputs.soulTrait}
                                                    onChange={(e) => handleInputChange('soulTrait', e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddSoulTrait()}
                                                    placeholder="Nouveau trait..."
                                                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none"
                                                />
                                                <button onClick={handleAddSoulTrait} className="bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white p-2 rounded-lg transition"><Plus className="w-5 h-5" /></button>
                                            </div>
                                        </div>

                                        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                                            <h3 className="text-lg font-semibold text-emerald-300 mb-4">Valeurs Fondamentales</h3>
                                            <ul className="space-y-2 mb-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                                {files.soul.values.map((val, idx) => (
                                                    <li key={idx} className="flex justify-between items-center group bg-black/20 px-3 py-2 rounded-lg">
                                                        <span className="text-gray-300">{val}</span>
                                                        <button onClick={() => handleRemoveSoulValue(idx)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"><Trash2 className="w-4 h-4" /></button>
                                                    </li>
                                                ))}
                                            </ul>
                                            <div className="flex gap-2">
                                                <input
                                                    value={inputs.soulValue}
                                                    onChange={(e) => handleInputChange('soulValue', e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddSoulValue()}
                                                    placeholder="Nouvelle valeur..."
                                                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                                                />
                                                <button onClick={handleAddSoulValue} className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white p-2 rounded-lg transition"><Plus className="w-5 h-5" /></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- USER TAB --- */}
                            {activeTab === 'user' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                                        <h3 className="text-lg font-semibold text-blue-300 mb-6">Préférences Utilisateur</h3>
                                        <div className="space-y-6">
                                            {[
                                                { key: 'communicationStyle', label: 'Style de Communication', placeholder: 'Ex: Professionnel, Court, Détaillé...' },
                                                { key: 'timezone', label: 'Fuseau Horaire', placeholder: 'Ex: Europe/Paris' },
                                                { key: 'language', label: 'Langue Préférée', placeholder: 'Ex: Français' }
                                            ].map((field) => (
                                                <div key={field.key}>
                                                    <label className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-2 block">{field.label}</label>
                                                    <input
                                                        type="text"
                                                        value={files.user.preferences[field.key as keyof typeof files.user.preferences] || ''}
                                                        onChange={(e) => handleUserPrefChange(field.key as any, e.target.value)}
                                                        placeholder={field.placeholder}
                                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition outline-none"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- MEMORY TAB --- */}
                            {activeTab === 'memory' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    {/* Info Utilisateur */}
                                    <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                                        <h3 className="text-lg font-semibold text-green-300 mb-4">Informations Utilisateur</h3>
                                        <ul className="space-y-2 mb-4">
                                            {files.memory.userInformation.map((info, idx) => (
                                                <li key={idx} className="flex justify-between p-3 bg-black/20 rounded-lg group">
                                                    <span className="text-gray-300">{info}</span>
                                                    <button onClick={() => removeUserInformation(idx)} className="text-red-400 opacity-0 group-hover:opacity-100 transition"><Trash2 className="w-4 h-4" /></button>
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="flex gap-2">
                                            <input
                                                value={inputs.memoryInfo}
                                                onChange={(e) => handleInputChange('memoryInfo', e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddMemoryInfo()}
                                                placeholder="Ajouter une info..."
                                                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-green-500 outline-none"
                                            />
                                            <button onClick={handleAddMemoryInfo} className="bg-green-600/20 hover:bg-green-600 text-green-300 hover:text-white p-2 rounded-lg transition"><Plus className="w-5 h-5" /></button>
                                        </div>
                                    </div>

                                    {/* Préférences */}
                                    <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                                        <h3 className="text-lg font-semibold text-yellow-300 mb-4">Préférences Apprises</h3>
                                        <ul className="space-y-2 mb-4">
                                            {files.memory.preferences.map((pref, idx) => (
                                                <li key={idx} className="flex justify-between p-3 bg-black/20 rounded-lg group">
                                                    <span className="text-gray-300">{pref}</span>
                                                    <button onClick={() => removePreference(idx)} className="text-red-400 opacity-0 group-hover:opacity-100 transition"><Trash2 className="w-4 h-4" /></button>
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="flex gap-2">
                                            <input
                                                value={inputs.memoryPref}
                                                onChange={(e) => handleInputChange('memoryPref', e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddMemoryPref()}
                                                placeholder="Ajouter une préférence..."
                                                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-yellow-500 outline-none"
                                            />
                                            <button onClick={handleAddMemoryPref} className="bg-yellow-600/20 hover:bg-yellow-600 text-yellow-300 hover:text-white p-2 rounded-lg transition"><Plus className="w-5 h-5" /></button>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                                        <h3 className="text-lg font-semibold text-teal-300 mb-4">Notes Importantes</h3>
                                        <ul className="space-y-2 mb-4">
                                            {files.memory.importantNotes.map((note, idx) => (
                                                <li key={idx} className="flex justify-between p-3 bg-black/20 rounded-lg group">
                                                    <span className="text-gray-300">{note}</span>
                                                    <button onClick={() => removeImportantNote(idx)} className="text-red-400 opacity-0 group-hover:opacity-100 transition"><Trash2 className="w-4 h-4" /></button>
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="flex gap-2">
                                            <input
                                                value={inputs.memoryNote}
                                                onChange={(e) => handleInputChange('memoryNote', e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddMemoryNote()}
                                                placeholder="Ajouter une note..."
                                                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-teal-500 outline-none"
                                            />
                                            <button onClick={handleAddMemoryNote} className="bg-teal-600/20 hover:bg-teal-600 text-teal-300 hover:text-white p-2 rounded-lg transition"><Plus className="w-5 h-5" /></button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- HISTORY TAB --- */}
                            {activeTab === 'history' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                                        <h3 className="text-lg font-semibold text-orange-300 mb-6 flex items-center gap-2">
                                            <History className="w-5 h-5" /> Journal des modifications
                                        </h3>
                                        {history.length === 0 ? (
                                            <p className="text-gray-500 text-center py-8">Aucun historique disponible</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {history.map((entry) => (
                                                    <div key={entry.id} className="flex items-start gap-4 p-4 bg-black/20 rounded-lg border border-white/5">
                                                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${entry.file === 'soul' ? 'bg-purple-500' :
                                                                entry.file === 'user' ? 'bg-blue-500' : 'bg-green-500'
                                                            }`} />
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <span className="font-medium text-gray-200 uppercase text-xs tracking-wider">
                                                                    {entry.file.toUpperCase()}.md
                                                                </span>
                                                                <span className="text-xs text-gray-500">
                                                                    {new Date(entry.timestamp).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            <p className="text-gray-400 text-sm">{entry.details}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-white/10 bg-black/20 shrink-0">
                    <div className="flex gap-3">
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition text-gray-300 hover:text-white text-sm"
                        >
                            <Download className="w-4 h-4" /> Exporter JSON
                        </button>
                        <button
                            onClick={handleImportClick}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition text-gray-300 hover:text-white text-sm"
                        >
                            <Upload className="w-4 h-4" /> Importer JSON
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept=".json"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors text-white shadow-lg shadow-indigo-500/20"
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PersonalityFilesEditor;
