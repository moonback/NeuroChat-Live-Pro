import React, { useRef, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { X, Eraser, Download, Edit3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const Whiteboard: React.FC = () => {
    const {
        whiteboardContent,
        isWhiteboardOpen,
        setWhiteboardOpen,
        clearWhiteboard,
    } = useAppStore();

    const contentRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom only if user is already near bottom
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8 md:p-12 lg:p-16 pointer-events-none">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-auto animate-fade-in"
                onClick={() => setWhiteboardOpen(false)}
            />

            <div className={`
                relative w-full h-full max-w-7xl flex flex-col glass-premium rounded-[3rem] border border-white/20 shadow-[0_64px_256px_-32px_rgba(0,0,0,0.9)] 
                pointer-events-auto animate-scale-in overflow-hidden transition-all duration-700
            `}>
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-white/10 bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
                            <Edit3 className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-display font-bold text-white tracking-tight">Tableau Blanc IA</h2>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Espace de travail haute résolution</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={exportToTxt}
                            className="p-2.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-all flex items-center gap-2"
                            title="Exporter"
                        >
                            <Download className="w-5 h-5" />
                            <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Exporter</span>
                        </button>
                        <button
                            onClick={clearWhiteboard}
                            className="p-2.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all flex items-center gap-2"
                            title="Effacer tout"
                        >
                            <Eraser className="w-5 h-5" />
                            <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Effacer</span>
                        </button>
                        <div className="w-px h-8 bg-white/10 mx-2" />
                        <button
                            onClick={() => setWhiteboardOpen(false)}
                            className="p-2.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div
                    ref={contentRef}
                    className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-[#050510]/60"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, rgba(99, 102, 241, 0.07) 1.5px, transparent 0)',
                        backgroundSize: '40px 40px'
                    }}
                >
                    <div className="max-w-4xl mx-auto">
                        <div className="prose prose-invert prose-brand max-w-none">
                            {(whiteboardContent && whiteboardContent.trim().length > 0) ? (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            h1: ({ node, ...props }) => <h1 className="text-4xl font-display font-black text-white mb-8 border-b border-indigo-500/30 pb-4" {...props} />,
                                            h2: ({ node, ...props }) => <h2 className="text-2xl font-display font-bold text-indigo-300 mt-12 mb-6" {...props} />,
                                            h3: ({ node, ...props }) => <h3 className="text-xl font-display font-semibold text-white/90 mt-8 mb-4" {...props} />,
                                            p: ({ node, ...props }) => <p className="text-lg leading-relaxed text-zinc-300 mb-6 font-body" {...props} />,
                                            li: ({ node, ...props }) => <li className="text-lg text-zinc-300 my-2" {...props} />,
                                            code: ({ node, inline, ...props }: any) => (
                                                inline
                                                    ? <code className="bg-white/10 px-1.5 py-0.5 rounded text-indigo-300 text-sm font-mono" {...props} />
                                                    : <div className="relative my-8 group">
                                                        <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                                                        <code className="block bg-[#020205] p-6 rounded-xl border border-white/10 text-emerald-400 text-sm font-mono overflow-x-auto relative" {...props} />
                                                    </div>
                                            ),
                                            blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-indigo-500 pl-6 my-8 italic text-zinc-400 bg-indigo-500/5 py-4 rounded-r-xl" {...props} />,
                                            table: ({ node, ...props }) => <div className="overflow-x-auto my-8 border border-white/10 rounded-2xl"><table className="w-full text-left bg-white/[0.02]" {...props} /></div>,
                                            th: ({ node, ...props }) => <th className="px-6 py-4 bg-white/[0.05] text-indigo-300 font-bold uppercase tracking-wider text-xs border-b border-white/10" {...props} />,
                                            td: ({ node, ...props }) => <td className="px-6 py-4 border-b border-white/5 text-zinc-400" {...props} />,
                                        }}
                                    >
                                        {whiteboardContent}
                                    </ReactMarkdown>
                                    <span className="inline-block w-2.5 h-6 bg-indigo-500 ml-2 animate-pulse rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                                </div>
                            ) : (
                                <div className="h-[60vh] flex flex-col items-center justify-center text-zinc-600 space-y-6 opacity-30">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full" />
                                        <Edit3 className="w-24 h-24 stroke-[1px] relative" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xl font-display font-medium uppercase tracking-[0.2em] mb-2">Espace Vierge</p>
                                        <p className="text-sm font-mono">Prêt pour la transcription neuronale...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer / Status */}
                <div className="px-8 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse delay-75" />
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse delay-150" />
                        </div>
                        <span className="text-[10px] text-zinc-500 font-black tracking-[0.2em] uppercase">Transmission Sécurisée</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="h-4 w-px bg-white/10" />
                        <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-2">
                            <span className="text-indigo-400">DATA_LENGTH:</span>
                            <span className="text-white">{whiteboardContent.length}</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
