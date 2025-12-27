import React, { useState, useEffect } from 'react';
import { ToastMessage } from './Toast';
import Input from './Input';
import Card from './Card';
import Button from './Button';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface NotesViewerProps {
  isOpen: boolean;
  onClose: () => void;
  onNotesChange?: () => void;
}

const NotesViewer: React.FC<NotesViewerProps> = ({ isOpen, onClose, onNotesChange }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadNotes();
    }
  }, [isOpen]);

  const loadNotes = () => {
    try {
      const savedNotes = JSON.parse(localStorage.getItem('neurochat_notes') || '[]');
      setNotes(savedNotes);
    } catch (error) {
      console.error('Erreur lors du chargement des notes:', error);
      setNotes([]);
    }
  };

  const deleteNote = (noteId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) {
      try {
        const updatedNotes = notes.filter(note => note.id !== noteId);
        localStorage.setItem('neurochat_notes', JSON.stringify(updatedNotes));
        setNotes(updatedNotes);
        if (selectedNote?.id === noteId) {
          setSelectedNote(null);
        }
        if (onNotesChange) {
          onNotesChange();
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const filteredNotes = notes.filter(note => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return note.title.toLowerCase().includes(query) || 
           note.content.toLowerCase().includes(query);
  });

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in safe-area-inset"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full h-full max-w-6xl max-h-[90vh] m-4 flex flex-col bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden"
        style={{
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.8), 0 0 60px rgba(99, 102, 241, 0.3)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-2xl font-display font-bold text-white">
              Mes Notes
            </h2>
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-sm font-semibold">
              {notes.length}
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

        {/* Search Bar */}
        <div className="p-4 border-b border-white/10">
          <Input
            type="text"
            placeholder="Rechercher dans les notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Notes List */}
          <div className="w-1/3 border-r border-white/10 overflow-y-auto custom-scrollbar">
            {filteredNotes.length === 0 ? (
              <div className="p-8 text-center">
                <svg className="w-16 h-16 mx-auto text-slate-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-slate-400 font-body">
                  {searchQuery ? 'Aucune note trouvée' : 'Aucune note sauvegardée'}
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {filteredNotes.map((note) => (
                  <Card
                    key={note.id}
                    variant={selectedNote?.id === note.id ? "elevated" : "interactive"}
                    size="sm"
                    hover
                    onClick={() => setSelectedNote(note)}
                    className={`cursor-pointer ${
                      selectedNote?.id === note.id
                        ? 'border-indigo-500/50 bg-indigo-500/10'
                        : ''
                    }`}
                  >
                    <h3 className="font-semibold text-white mb-1 line-clamp-1">
                      {note.title}
                    </h3>
                    <p className="text-xs text-slate-400 mb-2 line-clamp-2">
                      {note.content}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(note.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Note Detail */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedNote ? (
              <>
                <div className="p-6 border-b border-white/10 flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-2xl font-display font-bold text-white mb-2">
                      {selectedNote.title}
                    </h3>
                    <p className="text-sm text-slate-400">
                      Créée le {new Date(selectedNote.createdAt).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => deleteNote(selectedNote.id)}
                    title="Supprimer cette note"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                  <div className="prose prose-invert max-w-none">
                    <p className="text-slate-300 font-body leading-relaxed whitespace-pre-wrap">
                      {selectedNote.content}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <svg className="w-20 h-20 mx-auto text-slate-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-slate-400 font-body text-lg">
                    Sélectionnez une note pour voir son contenu
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotesViewer;

