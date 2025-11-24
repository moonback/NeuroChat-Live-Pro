import React, { useState, useEffect } from 'react';

interface WorkHoursEntry {
  id: string;
  date: string;
  hours: number;
  project: string;
  description: string;
  createdAt: string;
}

interface TasksViewerProps {
  isOpen: boolean;
  onClose: () => void;
  onTasksChange?: () => void;
}

const TasksViewer: React.FC<TasksViewerProps> = ({ isOpen, onClose, onTasksChange }) => {
  const [entries, setEntries] = useState<WorkHoursEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<WorkHoursEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all');
  const [filterProject, setFilterProject] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadEntries();
    }
  }, [isOpen]);

  const loadEntries = () => {
    try {
      const savedEntries = JSON.parse(localStorage.getItem('neurochat_work_hours') || '[]');
      // Trier par date (plus récent en premier)
      savedEntries.sort((a: WorkHoursEntry, b: WorkHoursEntry) => b.date.localeCompare(a.date));
      setEntries(savedEntries);
    } catch (error) {
      console.error('Erreur lors du chargement des heures:', error);
      setEntries([]);
    }
  };

  const deleteEntry = (entryId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette entrée ?')) {
      try {
        const updatedEntries = entries.filter(entry => entry.id !== entryId);
        localStorage.setItem('neurochat_work_hours', JSON.stringify(updatedEntries));
        setEntries(updatedEntries);
        if (selectedEntry?.id === entryId) {
          setSelectedEntry(null);
        }
        if (onTasksChange) {
          onTasksChange();
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const getTotalHours = (entriesList: WorkHoursEntry[]) => {
    return entriesList.reduce((sum, entry) => sum + entry.hours, 0);
  };

  const getUniqueProjects = () => {
    const projects = new Set(entries.map(e => e.project));
    return Array.from(projects).sort();
  };

  const filteredEntries = entries.filter(entry => {
    // Filtre par période
    if (filterPeriod !== 'all') {
      const entryDate = new Date(entry.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      switch (filterPeriod) {
        case 'today':
          const todayStr = today.toISOString().split('T')[0];
          if (entry.date !== todayStr) return false;
          break;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(today.getDate() - 7);
          if (entryDate < weekAgo) return false;
          break;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(today.getMonth() - 1);
          if (entryDate < monthAgo) return false;
          break;
        case 'year':
          const yearAgo = new Date(today);
          yearAgo.setFullYear(today.getFullYear() - 1);
          if (entryDate < yearAgo) return false;
          break;
      }
    }
    
    // Filtre par projet
    if (filterProject && entry.project !== filterProject) {
      return false;
    }
    
    // Filtre par recherche
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return entry.project.toLowerCase().includes(query) || 
           entry.description.toLowerCase().includes(query) ||
           entry.date.includes(query);
  });

  const totalHours = getTotalHours(filteredEntries);
  const allProjects = getUniqueProjects();

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
            <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-display font-bold text-white">
              Mes Heures Travaillées
            </h2>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-sm font-semibold">
                {entries.length} entrées
              </span>
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm font-semibold">
                {getTotalHours(entries).toFixed(1)}h total
              </span>
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
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher dans les tâches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg glass border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilterPeriod('all')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                filterPeriod === 'all'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'glass border border-white/10 text-slate-300 hover:border-white/20'
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => setFilterPeriod('today')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                filterPeriod === 'today'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'glass border border-white/10 text-slate-300 hover:border-white/20'
              }`}
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => setFilterPeriod('week')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                filterPeriod === 'week'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'glass border border-white/10 text-slate-300 hover:border-white/20'
              }`}
            >
              Semaine
            </button>
            <button
              onClick={() => setFilterPeriod('month')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                filterPeriod === 'month'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'glass border border-white/10 text-slate-300 hover:border-white/20'
              }`}
            >
              Mois
            </button>
            <button
              onClick={() => setFilterPeriod('year')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                filterPeriod === 'year'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'glass border border-white/10 text-slate-300 hover:border-white/20'
              }`}
            >
              Année
            </button>
            {allProjects.length > 0 && (
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="px-4 py-1.5 rounded-lg glass border border-white/10 text-white text-sm font-semibold bg-slate-800/50 focus:outline-none focus:border-emerald-500/50"
              >
                <option value="">Tous les projets</option>
                {allProjects.map(project => (
                  <option key={project} value={project} className="bg-slate-800">
                    {project}
                  </option>
                ))}
              </select>
            )}
          </div>
          {totalHours > 0 && (
            <div className="text-right">
              <span className="text-sm text-slate-400">Total filtré: </span>
              <span className="text-lg font-bold text-emerald-400">{totalHours.toFixed(1)}h</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Entries List */}
          <div className="w-1/3 border-r border-white/10 overflow-y-auto custom-scrollbar">
            {filteredEntries.length === 0 ? (
              <div className="p-8 text-center">
                <svg className="w-16 h-16 mx-auto text-slate-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-slate-400 font-body">
                  {searchQuery || filterPeriod !== 'all' || filterProject ? 'Aucune entrée trouvée' : 'Aucune heure enregistrée'}
                </p>
              </div>
            ) : (
              <div className="p-2">
                {filteredEntries.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry)}
                    className={`w-full p-4 mb-2 rounded-lg text-left transition-all duration-300 ${
                      selectedEntry?.id === entry.id
                        ? 'glass-intense border border-emerald-500/50 bg-emerald-500/10'
                        : 'glass border border-white/10 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white line-clamp-1">
                          {entry.project}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(entry.date).toLocaleDateString('fr-FR', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-sm font-bold ml-2">
                        {entry.hours}h
                      </span>
                    </div>
                    {entry.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 mt-2">
                        {entry.description}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Entry Detail */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedEntry ? (
              <>
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-display font-bold text-white">
                          {selectedEntry.project}
                        </h3>
                        <span className="px-4 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 text-xl font-bold">
                          {selectedEntry.hours}h
                        </span>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm text-slate-400">
                          Date: {new Date(selectedEntry.date).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                        <span className="text-sm text-slate-400">
                          Enregistré le {new Date(selectedEntry.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteEntry(selectedEntry.id)}
                      className="p-2 rounded-lg glass border border-red-500/30 text-red-300 hover:border-red-500/50 hover:text-red-200 hover:bg-red-500/10 transition-all duration-300 hover:scale-105 active:scale-95"
                      title="Supprimer cette entrée"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                  <div className="prose prose-invert max-w-none">
                    <h4 className="text-lg font-semibold text-white mb-3">Description</h4>
                    <p className="text-slate-300 font-body leading-relaxed whitespace-pre-wrap">
                      {selectedEntry.description || 'Aucune description fournie'}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <svg className="w-20 h-20 mx-auto text-slate-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-slate-400 font-body text-lg">
                    Sélectionnez une entrée pour voir les détails
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

export default TasksViewer;

