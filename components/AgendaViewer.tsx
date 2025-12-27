import React, { useState, useEffect } from 'react';
import Input from './Input';
import Select from './Select';
import Card from './Card';
import Button from './Button';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  endTime: string;
  description: string;
  location: string;
  type: string;
  createdAt: string;
}

interface AgendaViewerProps {
  isOpen: boolean;
  onClose: () => void;
  onEventsChange?: () => void;
}

const AgendaViewer: React.FC<AgendaViewerProps> = ({ isOpen, onClose, onEventsChange }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  useEffect(() => {
    if (isOpen) {
      loadEvents();
    }
  }, [isOpen]);

  const loadEvents = () => {
    try {
      const savedEvents = JSON.parse(localStorage.getItem('neurochat_events') || '[]');
      // Trier par date et heure
      savedEvents.sort((a: Event, b: Event) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.time.localeCompare(b.time);
      });
      setEvents(savedEvents);
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
      setEvents([]);
    }
  };

  const deleteEvent = (eventId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      try {
        const updatedEvents = events.filter(event => event.id !== eventId);
        localStorage.setItem('neurochat_events', JSON.stringify(updatedEvents));
        setEvents(updatedEvents);
        if (selectedEvent?.id === eventId) {
          setSelectedEvent(null);
        }
        if (onEventsChange) {
          onEventsChange();
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'work':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'meeting':
        return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      case 'personal':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      default:
        return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'work':
        return 'Travail';
      case 'meeting':
        return 'Réunion';
      case 'personal':
        return 'Personnel';
      default:
        return type;
    }
  };

  const isPastEvent = (event: Event) => {
    const eventDateTime = new Date(`${event.date}T${event.endTime || event.time}`);
    return eventDateTime < new Date();
  };

  const isTodayEvent = (event: Event) => {
    const today = new Date().toISOString().split('T')[0];
    return event.date === today;
  };

  const filteredEvents = events.filter(event => {
    // Filtre par date
    if (filterDate && event.date !== filterDate) {
      return false;
    }
    
    // Filtre par type
    if (filterType !== 'all' && event.type !== filterType) {
      return false;
    }
    
    // Filtre par recherche
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return event.title.toLowerCase().includes(query) || 
           event.description.toLowerCase().includes(query) ||
           event.location.toLowerCase().includes(query);
  });

  const upcomingEvents = events.filter(e => !isPastEvent(e)).slice(0, 5);
  const todayEvents = events.filter(e => isTodayEvent(e));

  // Grouper les événements par date pour la vue calendrier
  const eventsByDate: Record<string, Event[]> = {};
  filteredEvents.forEach(event => {
    if (!eventsByDate[event.date]) {
      eventsByDate[event.date] = [];
    }
    eventsByDate[event.date].push(event);
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
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.8), 0 0 60px rgba(139, 92, 246, 0.3)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h2 className="text-2xl font-display font-bold text-white">
              Mon Agenda
            </h2>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm font-semibold">
                {events.length} événements
              </span>
              {todayEvents.length > 0 && (
                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm font-semibold">
                  {todayEvents.length} aujourd'hui
                </span>
              )}
            </div>
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

        {/* Search and Filter Bar */}
        <div className="p-4 border-b border-white/10 space-y-3">
          <div className="flex items-center gap-3">
            <Input
              type="text"
              placeholder="Rechercher dans l'agenda..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
              className="flex-1"
            />
            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="min-w-[150px]"
            />
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              options={[
                { value: 'all', label: 'Tous les types' },
                { value: 'work', label: 'Travail' },
                { value: 'meeting', label: 'Réunion' },
                { value: 'personal', label: 'Personnel' }
              ]}
              placeholder="Type"
              className="min-w-[150px]"
            />
            <button
              onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
              className="px-4 py-2.5 rounded-lg glass border border-white/10 text-white hover:border-purple-500/50 transition-all"
            >
              {viewMode === 'list' ? '📅 Calendrier' : '📋 Liste'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Events List */}
          <div className="w-1/3 border-r border-white/10 overflow-y-auto custom-scrollbar">
            {filteredEvents.length === 0 ? (
              <div className="p-8 text-center">
                <svg className="w-16 h-16 mx-auto text-slate-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-slate-400 font-body">
                  {searchQuery || filterDate || filterType !== 'all' ? 'Aucun événement trouvé' : 'Aucun événement créé'}
                </p>
              </div>
            ) : (
              <div className="p-2">
                {viewMode === 'list' ? (
                  filteredEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className={`w-full p-4 mb-2 rounded-lg text-left transition-all duration-300 ${
                        selectedEvent?.id === event.id
                          ? 'glass-intense border border-purple-500/50 bg-purple-500/10'
                          : 'glass border border-white/10 hover:border-white/20 hover:bg-white/5'
                      } ${isPastEvent(event) ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white line-clamp-1">
                            {event.title}
                          </h3>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(event.date).toLocaleDateString('fr-FR', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        {isTodayEvent(event) && (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/20 text-blue-300 ml-2">
                            Aujourd'hui
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-slate-300 font-semibold">
                          {event.time} {event.endTime && `- ${event.endTime}`}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getTypeColor(event.type)}`}>
                          {getTypeLabel(event.type)}
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  // Vue calendrier
                  Object.entries(eventsByDate).map(([date, dateEvents]) => (
                    <div key={date} className="mb-4">
                      <h4 className="text-sm font-semibold text-slate-300 mb-2 px-2">
                        {new Date(date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </h4>
                      {dateEvents.map((event) => (
                        <button
                          key={event.id}
                          onClick={() => setSelectedEvent(event)}
                          className={`w-full p-3 mb-2 rounded-lg text-left transition-all duration-300 ${
                            selectedEvent?.id === event.id
                              ? 'glass-intense border border-purple-500/50 bg-purple-500/10'
                              : 'glass border border-white/10 hover:border-white/20 hover:bg-white/5'
                          } ${isPastEvent(event) ? 'opacity-60' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-white text-sm">{event.title}</h4>
                              <p className="text-xs text-slate-400 mt-1">
                                {event.time} {event.endTime && `- ${event.endTime}`}
                              </p>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getTypeColor(event.type)}`}>
                              {getTypeLabel(event.type)}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Event Detail */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedEvent ? (
              <>
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-display font-bold text-white">
                          {selectedEvent.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-lg text-sm font-semibold border ${getTypeColor(selectedEvent.type)}`}>
                          {getTypeLabel(selectedEvent.type)}
                        </span>
                        {isPastEvent(selectedEvent) && (
                          <span className="px-3 py-1 rounded-full bg-slate-500/20 text-slate-300 text-sm font-semibold">
                            Passé
                          </span>
                        )}
                        {isTodayEvent(selectedEvent) && !isPastEvent(selectedEvent) && (
                          <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm font-semibold">
                            Aujourd'hui
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm text-slate-400">
                          📅 {new Date(selectedEvent.date).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                        <span className="text-sm text-slate-400">
                          🕐 {selectedEvent.time} {selectedEvent.endTime && `- ${selectedEvent.endTime}`}
                        </span>
                        {selectedEvent.location && (
                          <span className="text-sm text-slate-400">
                            📍 {selectedEvent.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteEvent(selectedEvent.id)}
                      className="p-2 rounded-lg glass border border-red-500/30 text-red-300 hover:border-red-500/50 hover:text-red-200 hover:bg-red-500/10 transition-all duration-300 hover:scale-105 active:scale-95"
                      title="Supprimer cet événement"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                  <div className="prose prose-invert max-w-none">
                    {selectedEvent.description && (
                      <>
                        <h4 className="text-lg font-semibold text-white mb-3">Description</h4>
                        <p className="text-slate-300 font-body leading-relaxed whitespace-pre-wrap">
                          {selectedEvent.description}
                        </p>
                      </>
                    )}
                    {!selectedEvent.description && (
                      <p className="text-slate-400 font-body">Aucune description fournie</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <svg className="w-20 h-20 mx-auto text-slate-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-slate-400 font-body text-lg">
                    Sélectionnez un événement pour voir les détails
                  </p>
                  {upcomingEvents.length > 0 && (
                    <div className="mt-6 text-left">
                      <h4 className="text-sm font-semibold text-slate-300 mb-3">Prochains événements</h4>
                      <div className="space-y-2">
                        {upcomingEvents.map(event => (
                          <button
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            className="w-full p-3 rounded-lg glass border border-white/10 hover:border-purple-500/50 text-left transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-white font-semibold text-sm">{event.title}</p>
                                <p className="text-xs text-slate-400 mt-1">
                                  {new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à {event.time}
                                </p>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getTypeColor(event.type)}`}>
                                {getTypeLabel(event.type)}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgendaViewer;

