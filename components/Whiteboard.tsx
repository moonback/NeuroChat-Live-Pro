import React, { useRef, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { X, Eraser, Download, Maximize2, Minimize2, Edit3 } from 'lucide-react';

export const Whiteboard: React.FC = () => {
    const {
        whiteboardContent,
        isWhiteboardOpen,
        setWhiteboardOpen,
        clearWhiteboard,
        themePreference
    } = useAppStore();

    const contentRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when content changes
    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
    }, [whiteboardContent]);

    if (!isWhiteboardOpen) return null;

    const exportToTxt = () => {
        const element = document.createElement("a");
        const file = new Blob([whiteboardContent], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `whiteboard-${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    return (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[450px] md:w-[600px] lg:w-[700px] z-[40] p-4 flex flex-col pointer-events-none">
            <div className={`
                flex-1 flex flex-col glass-premium rounded-[2rem] border border-white/10 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] 
                pointer-events-auto animate-slide-in-right overflow-hidden transition-all duration-500
            `}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                            <Edit3 className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-display font-bold text-white tracking-tight">Tableau Blanc IA</h2>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Espace de travail partagé</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={exportToTxt}
                            className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                            title="Exporter"
                        >
                            <Download className="w-5 h-5" />
                        </button>
                        <button
                            onClick={clearWhiteboard}
                            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                            title="Effacer tout"
                        >
                            <Eraser className="w-5 h-5" />
                        </button>
                        <div className="w-px h-6 bg-white/10 mx-1" />
                        <button
                            onClick={() => setWhiteboardOpen(false)}
                            className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div
                    ref={contentRef}
                    className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#050508]/40"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.03) 1px, transparent 0)',
                        backgroundSize: '32px 32px'
                    }}
                >
                    <div className="prose prose-invert max-w-none">
                        {whiteboardContent ? (
                            <div className="whitespace-pre-wrap font-body text-lg leading-relaxed text-zinc-200 animate-in fade-in duration-700">
                                {whiteboardContent}
                                <span className="inline-block w-2 h-6 bg-indigo-500 ml-1 animate-pulse" />
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4 opacity-50 py-20">
                                <Edit3 className="w-16 h-16 stroke-[1px]" />
                                <p className="text-sm font-medium">Demandez à l'assistant d'écrire quelque chose...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer / Status */}
                <div className="px-6 py-3 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">Synchronisé en temps réel</span>
                    </div>
                    <span className="text-[10px] text-zinc-600 font-mono">
                        {whiteboardContent.length} caractères
                    </span>
                </div>
            </div>
        </div>
    );
};
