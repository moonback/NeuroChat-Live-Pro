import React from 'react';
import { useAppStore } from '../stores/appStore';
import { Terminal, CheckCircle, XCircle, Clock, X, Trash2 } from 'lucide-react';

export const ActionLogViewer: React.FC = () => {
    const { actionLogs, isLogsModalOpen, setLogsModalOpen, clearActionLogs, compactMode } = useAppStore();

    if (!isLogsModalOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in transition-all">
            <div className={`glass-premium rounded-3xl w-full ${compactMode ? 'max-w-xl max-h-[70vh]' : 'max-w-3xl max-h-[85vh]'} flex flex-col overflow-hidden animate-scale-in`}>
                <div className={`flex items-center justify-between ${compactMode ? 'p-4' : 'p-5'} border-b border-white/10 bg-white/[0.02]`}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <Terminal className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h2 className={`${compactMode ? 'text-sm' : 'text-lg'} font-semibold text-white tracking-tight`}>Logs d'Actions IA</h2>
                            {!compactMode && <p className="text-xs text-slate-400">Historique des outils exécutés par l'assistant</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {actionLogs.length > 0 && (
                            <button
                                onClick={clearActionLogs}
                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                title="Effacer l'historique"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                        <button
                            onClick={() => setLogsModalOpen(false)}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className={`flex-1 overflow-y-auto ${compactMode ? 'p-3 space-y-2' : 'p-4 space-y-3'} bg-slate-900/50 custom-scrollbar`}>
                    {actionLogs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3 py-12">
                            <Terminal className="w-12 h-12 opacity-20" />
                            <p>Aucune action enregistrée pour le moment.</p>
                        </div>
                    ) : (
                        actionLogs.map((log) => (
                            <div
                                key={log.id}
                                className={`${compactMode ? 'p-2' : 'p-3'} rounded-xl border transition-colors ${log.result === 'success' ? 'bg-green-500/5 border-green-500/10 hover:border-green-500/20' :
                                    log.result === 'error' ? 'bg-red-500/5 border-red-500/10 hover:border-red-500/20' :
                                        'bg-blue-500/5 border-blue-500/10 hover:border-blue-500/20'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        {log.result === 'pending' && <Clock className="w-4 h-4 text-blue-400 animate-pulse" />}
                                        {log.result === 'success' && <CheckCircle className="w-4 h-4 text-green-400" />}
                                        {log.result === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                                        <span className="font-mono text-sm text-slate-200 font-medium">
                                            {log.toolName}
                                        </span>
                                    </div>
                                    <span className="text-xs text-slate-500 font-mono">
                                        {new Date(log.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>

                                {Object.keys(log.args).length > 0 && (
                                    <div className={`bg-black/40 rounded-lg ${compactMode ? 'p-1.5' : 'p-2'} mt-2 border border-white/5`}>
                                        <pre className={`${compactMode ? 'text-[10px]' : 'text-xs'} text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap`}>
                                            {JSON.stringify(log.args, null, 2)}
                                        </pre>
                                    </div>
                                )}

                                {log.message && (
                                    <p className={`text-xs mt-2 font-medium ${log.result === 'error' ? 'text-red-400' : 'text-emerald-400/80'
                                        }`}>
                                        {log.message}
                                    </p>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
