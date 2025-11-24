import React from 'react';
import { AVAILABLE_FUNCTIONS } from '../utils/tools';

interface ToolsListProps {
  isOpen: boolean;
  onClose: () => void;
}

const ToolsList: React.FC<ToolsListProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const functions = Object.values(AVAILABLE_FUNCTIONS);

  // Catégoriser les fonctions
  const categories: Record<string, typeof functions> = {
    'Contrôle de l\'environnement': functions.filter(f => 
      f.name.includes('lights')
    ),
    'Temps et dates': functions.filter(f => 
      f.name.includes('time') || f.name.includes('date')
    ),
    'Rappels et timers': functions.filter(f => 
      f.name.includes('reminder') || f.name.includes('timer')
    ),
    'Calculatrice': functions.filter(f => 
      f.name === 'calculate'
    ),
    'Conversion d\'unités': functions.filter(f => 
      f.name === 'convert_units'
    ),
    'Notes et mémos': functions.filter(f => 
      f.name.includes('note')
    ),
    'Suivi des heures travaillées': functions.filter(f => 
      f.name.includes('work_hours')
    ),
    'Météo et informations': functions.filter(f => 
      f.name.includes('weather')
    ),
    'Conversion de devises': functions.filter(f => 
      f.name.includes('currency')
    ),
    'Génération de contenu': functions.filter(f => 
      f.name.includes('generate') && !f.name.includes('summary')
    ),
    'Formatage de texte': functions.filter(f => 
      f.name.includes('format') || f.name.includes('count_words')
    ),
    'Calculs avancés': functions.filter(f => 
      f.name.includes('percentage') || f.name.includes('tip')
    ),
    'Utilitaires de date': functions.filter(f => 
      f.name.includes('age') || f.name.includes('days_until')
    ),
    'Génération de texte': functions.filter(f => 
      f.name.includes('summary')
    ),
    'Utilitaires': functions.filter(f => 
      ['generate_random_number', 'flip_coin', 'roll_dice'].includes(f.name)
    ),
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Contrôle de l\'environnement': '💡',
      'Temps et dates': '🕐',
      'Rappels et timers': '⏰',
      'Calculatrice': '🔢',
      'Conversion d\'unités': '📏',
      'Notes et mémos': '📝',
      'Suivi des heures travaillées': '⏱️',
      'Météo et informations': '🌤️',
      'Conversion de devises': '💱',
      'Génération de contenu': '🔑',
      'Formatage de texte': '✏️',
      'Calculs avancés': '🧮',
      'Utilitaires de date': '📅',
      'Génération de texte': '📄',
      'Utilitaires': '🎲',
    };
    return icons[category] || '⚙️';
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in safe-area-inset"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full h-full max-w-5xl max-h-[90vh] m-4 flex flex-col bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden"
        style={{
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.8), 0 0 60px rgba(99, 102, 241, 0.3)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <h2 className="text-2xl font-display font-bold text-white">
              Fonctions Disponibles
            </h2>
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm font-semibold">
              {functions.length}
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
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="space-y-8">
            {Object.entries(categories).map(([category, categoryFunctions]) => {
              if (categoryFunctions.length === 0) return null;
              
              return (
                <div key={category} className="space-y-4">
                  <div className="flex items-center gap-3 pb-2 border-b border-white/10">
                    <span className="text-2xl">{getCategoryIcon(category)}</span>
                    <h3 className="text-lg font-display font-bold text-white">
                      {category}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-300 text-xs font-semibold">
                      {categoryFunctions.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categoryFunctions.map((func) => (
                      <div
                        key={func.name}
                        className="p-4 rounded-lg glass border border-white/10 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all duration-300"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-white font-mono text-sm">
                            {func.name}
                          </h4>
                        </div>
                        <p className="text-sm text-slate-300 mb-3">
                          {func.description}
                        </p>
                        
                        {func.parameters && func.parameters.properties && Object.keys(func.parameters.properties).length > 0 && (
                          <div className="mt-3 pt-3 border-t border-white/5">
                            <p className="text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wide">
                              Paramètres:
                            </p>
                            <div className="space-y-1.5">
                              {Object.entries(func.parameters.properties).map(([paramName, paramDef]: [string, any]) => {
                                const isRequired = func.parameters?.required?.includes(paramName);
                                return (
                                  <div key={paramName} className="flex items-start gap-2 text-xs">
                                    <code className="text-blue-300 font-mono">
                                      {paramName}
                                    </code>
                                    {isRequired && (
                                      <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px] font-semibold">
                                        requis
                                      </span>
                                    )}
                                    <span className="text-slate-400">
                                      ({paramDef.type || 'any'})
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                            {func.parameters.required && func.parameters.required.length === 0 && (
                              <p className="text-xs text-slate-500 italic mt-2">
                                Aucun paramètre requis
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-900/50">
          <p className="text-xs text-slate-400 text-center">
            Ces fonctions sont disponibles pour l'IA lorsque l'appel de fonction est activé
          </p>
        </div>
      </div>
    </div>
  );
};

export default ToolsList;

