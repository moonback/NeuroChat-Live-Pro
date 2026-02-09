import React, { useState, useMemo } from 'react';
import { useAppStore } from '../stores/appStore';
import { ChatSession } from '../types';
import { exportToJSON, exportToTXT, exportToPDF } from '../utils/exportUtils';

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose }) => {
    const { sessions, deleteSession, renameSession, setCurrentSessionId, currentSessionId } = useAppStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');

    const filteredSessions = useMemo(() => {
        return sessions.filter(s =>
            s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.messages.some(m => m.content.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [sessions, searchTerm]);

    const handleRename = (id: string) => {
        if (editTitle.trim()) {
            renameSession(id, editTitle.trim());
        }
        setEditingId(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10 pointer-events-none">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-auto animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-4xl max-h-[85vh] bg-[#0a0a0c] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Historique</h2>
                        <p className="text-zinc-400 text-sm">{sessions.length} conversations sauvegardées</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b border-white/5">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Rechercher dans l'historique..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Sessions List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {filteredSessions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <p className="text-zinc-500">Aucune conversation trouvée</p>
                        </div>
                    ) : (
                        filteredSessions.map((session) => (
                            <div
                                key={session.id}
                                className={`group relative flex flex-col md:flex-row items-start md:items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${currentSessionId === session.id
                                        ? 'bg-indigo-500/10 border-indigo-500/30 ring-1 ring-indigo-500/20'
                                        : 'bg-white/5 border-white/5 hover:bg-white/[0.08] hover:border-white/10'
                                    }`}
                            >
                                <div
                                    className="flex-1 min-w-0 cursor-pointer"
                                    onClick={() => {
                                        setCurrentSessionId(session.id);
                                    }}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        {editingId === session.id ? (
                                            <input
                                                autoFocus
                                                className="bg-zinc-800 text-white text-sm font-bold border-none outline-none ring-1 ring-indigo-500 rounded px-1 py-0.5"
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                onBlur={() => handleRename(session.id)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleRename(session.id)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        ) : (
                                            <h3 className="text-base font-bold text-white truncate group-hover:text-indigo-400 transition-colors">
                                                {session.title}
                                            </h3>
                                        )}
                                        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
                                            {new Date(session.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-500 truncate">
                                        {session.messages.length > 0
                                            ? session.messages[session.messages.length - 1].content
                                            : "Aucun message"}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    {/* Export Buttons */}
                                    <div className="flex items-center bg-black/40 rounded-xl p-1 border border-white/5">
                                        <button
                                            onClick={() => exportToPDF(session)}
                                            className="p-2 text-zinc-400 hover:text-white transition-colors"
                                            title="Export PDF"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => exportToTXT(session)}
                                            className="p-2 text-zinc-400 hover:text-white transition-colors"
                                            title="Export TXT"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => exportToJSON(session)}
                                            className="p-2 text-zinc-400 hover:text-white transition-colors"
                                            title="Export JSON"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Edit/Delete */}
                                    <button
                                        onClick={() => {
                                            setEditingId(session.id);
                                            setEditTitle(session.title);
                                        }}
                                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => deleteSession(session.id)}
                                        className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-white/[0.02]">
                    <button
                        className="w-full py-4 text-center text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
                        onClick={() => {
                            if (confirm('Voulez-vous vraiment effacer tout l\'historique ?')) {
                                useAppStore.getState().clearHistory();
                            }
                        }}
                    >
                        Effacer tout l'historique
                    </button>
                </div>
            </div>

            <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
        </div>
    );
};

export default HistoryModal;
