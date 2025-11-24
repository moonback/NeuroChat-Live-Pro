/**
 * Composant pour afficher et gérer l'historique des conversations chiffrées
 */

import React, { useState, useEffect } from 'react';
import { ConversationSession, ConversationMessage, MessageType } from '../types';
import { conversationStorage } from '../utils/conversationStorage';

interface ConversationHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConversationHistory: React.FC<ConversationHistoryProps> = ({ isOpen, onClose }) => {
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Charger les sessions au montage ou quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen]);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const loadedSessions = await conversationStorage.listSessions(50); // Limiter à 50 sessions
      setSessions(loadedSessions);
    } catch (error) {
      console.error('[ConversationHistory] Erreur lors du chargement des sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversation = async (sessionId: string) => {
    setIsLoading(true);
    try {
      const loadedMessages = await conversationStorage.getConversation(sessionId);
      if (loadedMessages) {
        setMessages(loadedMessages);
        setSelectedSession(sessionId);
      } else {
        setMessages([]);
        setSelectedSession(null);
      }
    } catch (error) {
      console.error('[ConversationHistory] Erreur lors du chargement de la conversation:', error);
      setMessages([]);
      setSelectedSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette conversation ? Cette action est irréversible.')) {
      return;
    }

    setIsDeleting(sessionId);
    try {
      await conversationStorage.deleteConversation(sessionId);
      // Recharger les sessions
      await loadSessions();
      // Si la session supprimée était sélectionnée, la désélectionner
      if (selectedSession === sessionId) {
        setSelectedSession(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('[ConversationHistory] Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de la conversation');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadSessions();
      return;
    }

    setIsLoading(true);
    try {
      const matchingSessions = await conversationStorage.searchConversations(searchQuery);
      setSessions(matchingSessions);
    } catch (error) {
      console.error('[ConversationHistory] Erreur lors de la recherche:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date();
    const duration = Math.floor((end.getTime() - startTime.getTime()) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds}s`;
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="relative w-full h-full max-w-6xl max-h-[90vh] m-4 rounded-3xl overflow-hidden glass-intense border border-white/20 shadow-2xl flex flex-col"
        style={{
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.8), 0 0 60px rgba(99, 102, 241, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">
              Historique des Conversations
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Conversations chiffrées bout-en-bout
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg glass-intense border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 sm:p-6 border-b border-white/10">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              placeholder="Rechercher dans les conversations..."
              className="flex-1 px-4 py-2 rounded-lg glass-intense border border-white/10 focus:border-indigo-500 focus:outline-none text-white placeholder-slate-400"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 rounded-lg glass-intense border border-white/10 hover:border-indigo-500 transition-all duration-300 text-white"
            >
              Rechercher
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Sessions List */}
          <div className="w-full sm:w-1/3 border-r border-white/10 overflow-y-auto">
            {isLoading && sessions.length === 0 ? (
              <div className="p-6 text-center text-slate-400">
                Chargement...
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-6 text-center text-slate-400">
                Aucune conversation sauvegardée
              </div>
            ) : (
              <div className="p-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => loadConversation(session.id)}
                    className={`p-4 mb-2 rounded-lg cursor-pointer transition-all duration-300 ${
                      selectedSession === session.id
                        ? 'glass-intense border border-indigo-500/50 bg-indigo-500/10'
                        : 'glass-intense border border-white/10 hover:border-white/30 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-indigo-400 uppercase">
                            🔒 Chiffré
                          </span>
                          {session.personalityName && (
                            <span className="text-xs text-slate-400">
                              {session.personalityName}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-white font-medium truncate">
                          {formatDate(session.startTime)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {session.messageCount} message{session.messageCount > 1 ? 's' : ''} • {formatDuration(session.startTime, session.endTime)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session.id);
                        }}
                        disabled={isDeleting === session.id}
                        className="ml-2 p-1 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                      >
                        {isDeleting === session.id ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Messages View */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {isLoading && selectedSession ? (
              <div className="text-center text-slate-400 py-12">
                Chargement de la conversation...
              </div>
            ) : selectedSession && messages.length > 0 ? (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-lg glass-intense border ${
                      message.type === MessageType.USER
                        ? 'border-blue-500/30 bg-blue-500/10 ml-auto max-w-[80%]'
                        : 'border-indigo-500/30 bg-indigo-500/10 mr-auto max-w-[80%]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold uppercase">
                        {message.type === MessageType.USER ? '👤 Vous' : '🤖 Assistant'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatDate(message.timestamp)}
                      </span>
                    </div>
                    <p className="text-white whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : selectedSession ? (
              <div className="text-center text-slate-400 py-12">
                Aucun message dans cette conversation
              </div>
            ) : (
              <div className="text-center text-slate-400 py-12">
                Sélectionnez une conversation pour afficher les messages
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationHistory;

