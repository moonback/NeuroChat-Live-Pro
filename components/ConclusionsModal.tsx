import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Personality } from '../types';
import { getSavedConclusions, deleteSavedConclusion, clearAllSavedConclusions, SavedConclusion } from '../utils/tools';

interface ConclusionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPersonality: Personality;
}

// --- Icons ---
const Icons = {
  Close: memo(() => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )),
  File: memo(() => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  )),
  Trash: memo(() => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  )),
  Download: memo(() => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  )),
  Eye: memo(() => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )),
  X: memo(() => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ))
};

Icons.Close.displayName = 'CloseIcon';
Icons.File.displayName = 'FileIcon';
Icons.Trash.displayName = 'TrashIcon';
Icons.Download.displayName = 'DownloadIcon';
Icons.Eye.displayName = 'EyeIcon';
Icons.X.displayName = 'XIcon';

// Fonction pour télécharger un fichier markdown
function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Composant pour afficher une conclusion
const ConclusionCard = memo(({ 
  conclusion, 
  onDelete, 
  onView,
  themeColor 
}: { 
  conclusion: SavedConclusion; 
  onDelete: (id: string) => void;
  onView: (conclusion: SavedConclusion) => void;
  themeColor: string;
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const date = new Date(conclusion.createdAt);
  const formattedDate = date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleDelete = useCallback(async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    await new Promise(resolve => setTimeout(resolve, 200)); // Animation
    onDelete(conclusion.id);
    setIsDeleting(false);
  }, [conclusion.id, onDelete, isDeleting]);

  const handleDownload = useCallback(() => {
    const filename = `conclusion-${conclusion.id}.md`;
    downloadMarkdown(conclusion.markdown, filename);
  }, [conclusion]);

  return (
    <div 
      className={`
        group relative p-4 rounded-xl border transition-all duration-300
        ${isDeleting ? 'opacity-50 scale-95' : 'hover:scale-[1.02]'}
        bg-white/[0.03] border-white/10 hover:border-white/20
      `}
      style={{
        boxShadow: isDeleting ? 'none' : `0 0 20px ${themeColor}10`
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white mb-1 truncate">
            {conclusion.title}
          </h3>
          <p className="text-xs text-zinc-400">
            {formattedDate}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onView(conclusion)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all duration-200"
            aria-label="Voir la conclusion"
          >
            <Icons.Eye />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all duration-200"
            aria-label="Télécharger"
          >
            <Icons.Download />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all duration-200 disabled:opacity-50"
            aria-label="Supprimer"
          >
            <Icons.Trash />
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="text-sm text-zinc-300 line-clamp-3">
        {conclusion.content}
      </div>
    </div>
  );
});

ConclusionCard.displayName = 'ConclusionCard';

// Modal de détail d'une conclusion
const ConclusionDetailModal = memo(({
  conclusion,
  isOpen,
  onClose,
  themeColor
}: {
  conclusion: SavedConclusion | null;
  isOpen: boolean;
  onClose: () => void;
  themeColor: string;
}) => {
  if (!isOpen || !conclusion) return null;

  const date = new Date(conclusion.createdAt);
  const formattedDate = date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleDownload = () => {
    const filename = `conclusion-${conclusion.id}.md`;
    downloadMarkdown(conclusion.markdown, filename);
  };

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-md" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] bg-[#08080a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 zoom-in-95 duration-500"
        style={{
          boxShadow: `0 0 100px -20px ${themeColor}20, 0 0 40px -10px rgba(0,0,0,0.5)`
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white truncate">
              {conclusion.title}
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              {formattedDate}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all duration-200"
              aria-label="Télécharger"
            >
              <Icons.Download />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all duration-200"
              aria-label="Fermer"
            >
              <Icons.X />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] custom-scrollbar">
          <div className="prose prose-invert prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-zinc-200 leading-relaxed">
              {conclusion.content}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ConclusionDetailModal.displayName = 'ConclusionDetailModal';

// --- Main Component ---
const ConclusionsModal: React.FC<ConclusionsModalProps> = ({
  isOpen,
  onClose,
  currentPersonality,
}) => {
  const [conclusions, setConclusions] = useState<SavedConclusion[]>([]);
  const [selectedConclusion, setSelectedConclusion] = useState<SavedConclusion | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Charger les conclusions
  useEffect(() => {
    if (isOpen) {
      const saved = getSavedConclusions();
      setConclusions(saved);
    }
  }, [isOpen]);

  // Fermer avec Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isDetailOpen) {
          setIsDetailOpen(false);
          setSelectedConclusion(null);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDetailOpen, onClose]);

  // Empêcher la fermeture en cliquant sur le contenu
  const handleContentClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleDelete = useCallback((id: string) => {
    if (deleteSavedConclusion(id)) {
      setConclusions(prev => prev.filter(c => c.id !== id));
      if (selectedConclusion?.id === id) {
        setIsDetailOpen(false);
        setSelectedConclusion(null);
      }
    }
  }, [selectedConclusion]);

  const handleView = useCallback((conclusion: SavedConclusion) => {
    setSelectedConclusion(conclusion);
    setIsDetailOpen(true);
  }, []);

  const handleClearAll = useCallback(async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer toutes les conclusions ? Cette action est irréversible.')) {
      return;
    }
    
    setIsClearing(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    clearAllSavedConclusions();
    setConclusions([]);
    setIsDetailOpen(false);
    setSelectedConclusion(null);
    setIsClearing(false);
  }, []);

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="conclusions-modal-title"
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" 
          onClick={onClose}
          aria-hidden="true"
        />
        
        {/* Modal Container */}
        <div 
          ref={modalRef}
          onClick={handleContentClick}
          className="relative w-full max-w-4xl bg-[#08080a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 zoom-in-95 duration-500 flex flex-col max-h-[85vh]"
          style={{
            boxShadow: `0 0 100px -20px ${currentPersonality.themeColor}15, 0 0 40px -10px rgba(0,0,0,0.5)`
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-4">
              <div 
                className="p-3 rounded-xl border transition-all duration-300"
                style={{
                  backgroundColor: `${currentPersonality.themeColor}20`,
                  borderColor: `${currentPersonality.themeColor}30`
                }}
              >
                <div style={{ color: currentPersonality.themeColor }}>
                  <Icons.File />
                </div>
              </div>
              <div>
                <h2 id="conclusions-modal-title" className="text-2xl font-display font-bold text-white">
                  Conclusions Sauvegardées
                </h2>
                <p className="text-sm text-zinc-400 mt-1">
                  {conclusions.length} {conclusions.length === 1 ? 'conclusion' : 'conclusions'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {conclusions.length > 0 && (
                <button
                  onClick={handleClearAll}
                  disabled={isClearing}
                  className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all duration-200 disabled:opacity-50 text-sm font-medium"
                >
                  {isClearing ? 'Suppression...' : 'Tout supprimer'}
                </button>
              )}
              <button
                onClick={onClose}
                className="p-3 rounded-xl glass border border-white/10 hover:border-white/30 text-slate-300 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95"
                aria-label="Fermer"
              >
                <Icons.Close />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {conclusions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div 
                  className="p-6 rounded-full mb-4"
                  style={{
                    backgroundColor: `${currentPersonality.themeColor}10`
                  }}
                >
                  <Icons.File />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Aucune conclusion sauvegardée
                </h3>
                <p className="text-zinc-400 max-w-md">
                  Les conclusions que vous sauvegardez apparaîtront ici. Demandez à l'IA de sauvegarder une conclusion pour commencer.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {conclusions.map((conclusion) => (
                  <ConclusionCard
                    key={conclusion.id}
                    conclusion={conclusion}
                    onDelete={handleDelete}
                    onView={handleView}
                    themeColor={currentPersonality.themeColor}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <ConclusionDetailModal
        conclusion={selectedConclusion}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedConclusion(null);
        }}
        themeColor={currentPersonality.themeColor}
      />

      {/* Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </>
  );
};

export default ConclusionsModal;

