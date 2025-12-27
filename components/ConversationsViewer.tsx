import React, { useEffect, useMemo, useState } from 'react';
import {
  ConversationMeta,
  ConversationTurn,
  conversationToMarkdown,
  deleteConversation,
  getConversation,
  getUserProfile,
  listConversations,
  upsertUserProfile,
} from '../utils/conversationsDb';

interface ConversationsViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const ConversationsViewer: React.FC<ConversationsViewerProps> = ({ isOpen, onClose }) => {
  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ meta: ConversationMeta; turns: ConversationTurn[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [profile, setProfile] = useState<{ displayName?: string; timezone?: string; preferencesText?: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    Promise.all([listConversations(100), getUserProfile()])
      .then(([list, p]) => {
        setConversations(list);
        setSelectedId(list[0]?.id ?? null);
        setProfile({
          displayName: p.displayName,
          timezone: p.timezone,
          preferencesText: p.preferencesText,
        });
      })
      .finally(() => setIsLoading(false));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (!selectedId) {
      setSelected(null);
      return;
    }
    setIsLoading(true);
    getConversation(selectedId)
      .then((conv) => setSelected(conv ?? null))
      .finally(() => setIsLoading(false));
  }, [isOpen, selectedId]);

  const totalTurns = useMemo(() => selected?.turns.length ?? 0, [selected]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in safe-area-inset"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full h-full max-w-6xl max-h-[90vh] m-4 flex flex-col bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden"
        style={{ boxShadow: '0 25px 80px rgba(0, 0, 0, 0.8), 0 0 60px rgba(99, 102, 241, 0.25)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l6 6v8a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-2xl font-display font-bold text-white">Historique & Transcriptions</h2>
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-sm font-semibold">
              {conversations.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg glass border border-white/10 hover:border-white/30 text-slate-300 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: list */}
          <div className="w-[340px] border-r border-white/10 overflow-y-auto custom-scrollbar">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider">Conversations</h3>
              <p className="text-xs text-slate-400 mt-1">Sélectionnez une conversation pour voir les tours.</p>
            </div>

            {isLoading && conversations.length === 0 ? (
              <div className="p-6 text-slate-400">Chargement…</div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-slate-400">Aucune conversation enregistrée.</div>
            ) : (
              <div className="p-2">
                {conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full p-3 mb-2 rounded-xl text-left transition-all duration-200 ${
                      selectedId === c.id
                        ? 'glass-intense border border-indigo-500/40 bg-indigo-500/10'
                        : 'glass border border-white/10 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-white font-semibold truncate">{c.title}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          {new Date(c.createdAt).toLocaleString('fr-FR')}
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 whitespace-nowrap">{c.summary ? 'Résumé' : ''}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: details */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Profile */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider">Préférences utilisateur</h3>
                  <p className="text-xs text-slate-400 mt-1">Utilisées pour la “mémoire long terme”.</p>
                </div>
                <button
                  onClick={async () => {
                    if (!profile) return;
                    const saved = await upsertUserProfile({
                      displayName: profile.displayName,
                      timezone: profile.timezone,
                      preferencesText: profile.preferencesText,
                    });
                    setProfile({
                      displayName: saved.displayName,
                      timezone: saved.timezone,
                      preferencesText: saved.preferencesText,
                    });
                  }}
                  className="px-3 py-2 rounded-lg glass border border-white/10 text-slate-200 hover:border-white/25"
                >
                  Sauvegarder
                </button>
              </div>

              {profile && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                  <input
                    value={profile.displayName ?? ''}
                    onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                    placeholder="Nom (optionnel)"
                    className="px-3 py-2 rounded-lg glass border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                  />
                  <input
                    value={profile.timezone ?? ''}
                    onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                    placeholder="Timezone (ex: Europe/Paris)"
                    className="px-3 py-2 rounded-lg glass border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                  />
                  <input
                    value={profile.preferencesText ?? ''}
                    onChange={(e) => setProfile({ ...profile, preferencesText: e.target.value })}
                    placeholder="Préférences (texte libre)"
                    className="px-3 py-2 rounded-lg glass border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
              )}
            </div>

            {/* Conversation header actions */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-white font-semibold truncate">{selected?.meta.title ?? '—'}</div>
                <div className="text-xs text-slate-400 mt-1">
                  {selected ? `${totalTurns} tour(s)` : 'Sélectionnez une conversation'}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={!selected}
                  onClick={() => {
                    if (!selected) return;
                    const md = conversationToMarkdown(selected.meta, selected.turns);
                    downloadFile(`neurochat_${selected.meta.id}.md`, md, 'text/markdown;charset=utf-8');
                  }}
                  className="px-3 py-2 rounded-lg glass border border-white/10 text-slate-200 hover:border-white/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Export MD
                </button>
                <button
                  disabled={!selected}
                  onClick={() => {
                    if (!selected) return;
                    const json = JSON.stringify(selected, null, 2);
                    downloadFile(`neurochat_${selected.meta.id}.json`, json, 'application/json;charset=utf-8');
                  }}
                  className="px-3 py-2 rounded-lg glass border border-white/10 text-slate-200 hover:border-white/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Export JSON
                </button>
                <button
                  disabled={!selected}
                  onClick={async () => {
                    if (!selected) return;
                    if (!confirm('Supprimer cette conversation ?')) return;
                    await deleteConversation(selected.meta.id);
                    const list = await listConversations(100);
                    setConversations(list);
                    setSelectedId(list[0]?.id ?? null);
                  }}
                  className="px-3 py-2 rounded-lg glass border border-red-500/25 text-red-200 hover:border-red-500/50 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Supprimer
                </button>
              </div>
            </div>

            {/* Turns */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
              {!selected ? (
                <div className="text-slate-400">Aucune conversation sélectionnée.</div>
              ) : selected.turns.length === 0 ? (
                <div className="text-slate-400">Conversation vide.</div>
              ) : (
                <div className="space-y-3">
                  {selected.turns.map((t) => (
                    <div
                      key={t.id}
                      className={`rounded-2xl border p-4 ${
                        t.role === 'user'
                          ? 'border-white/10 bg-white/5'
                          : t.role === 'assistant'
                            ? 'border-indigo-500/20 bg-indigo-500/10'
                            : 'border-slate-500/20 bg-slate-500/10'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="text-xs font-bold tracking-wider uppercase text-slate-300">
                          {t.role === 'user' ? 'Utilisateur' : t.role === 'assistant' ? 'Assistant' : 'Système'}
                          {t.source ? ` • ${t.source}` : ''}
                        </div>
                        <div className="text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(t.createdAt).toLocaleString('fr-FR')}
                        </div>
                      </div>
                      <div className="text-slate-100 whitespace-pre-wrap leading-relaxed">{t.text}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationsViewer;


