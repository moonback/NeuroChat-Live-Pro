import React from 'react';
import { Personality } from '../types';
import { AVAILABLE_PERSONALITIES } from '../constants'; // Correction: import from AVAILABLE_PERSONALITIES

interface PersonalitySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentPersonality: Personality;
  onSelect: (p: Personality) => void;
}

const PersonalitySelector: React.FC<PersonalitySelectorProps> = ({
  isOpen,
  onClose,
  currentPersonality,
  onSelect,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      {/* Dark Backdrop */}
      <div 
        className="absolute inset-0 bg-[#000000]/90 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Main Container */}
      <div 
        className="relative w-full max-w-5xl bg-[#08080a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 duration-500"
        style={{
          boxShadow: `0 0 100px -20px ${currentPersonality.themeColor}10, 0 0 40px -10px rgba(0,0,0,0.8)`
        }}
      >
        
        {/* Header */}
        <div className="relative z-10 p-6 md:p-8 border-b border-white/5 bg-white/[0.02] flex items-start justify-between">
          <div>
             <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                <span className="text-xs font-mono font-medium text-indigo-400 tracking-widest uppercase">Selecteur de Noyau</span>
             </div>
             <h2 className="text-3xl font-bold text-white tracking-tight">
               Choisir une Personnalité
             </h2>
             <p className="text-zinc-500 mt-2 max-w-md text-sm leading-relaxed">
               Modifiez le comportement et le ton de l'IA en sélectionnant un module de personnalité ci-dessous.
             </p>
          </div>

          <button 
            onClick={onClose}
            className="group p-2 rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition-all duration-300"
          >
            <svg className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-[#050507]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {AVAILABLE_PERSONALITIES.map((p) => {
              const isSelected = currentPersonality.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelect(p);
                    onClose();
                  }}
                  className={`
                    group relative flex flex-col text-left p-6 rounded-2xl border transition-all duration-300
                    hover:-translate-y-1
                    ${isSelected 
                      ? 'bg-white/[0.03] border-white/20' 
                      : 'bg-[#0a0a0c] border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
                    }
                  `}
                  style={isSelected ? {
                    borderColor: `${p.themeColor}50`,
                    boxShadow: `0 0 30px -10px ${p.themeColor}20`
                  } : {}}
                >
                  {/* Color Accent Top */}
                  <div 
                    className="absolute top-0 left-6 right-6 h-[1px] opacity-0 group-hover:opacity-50 transition-opacity duration-500"
                    style={{ background: `linear-gradient(90deg, transparent, ${p.themeColor}, transparent)` }}
                  />

                  {/* Header: Icon & Tag */}
                  <div className="flex justify-between items-start mb-4">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center border transition-colors duration-300"
                      style={{ 
                        borderColor: isSelected ? `${p.themeColor}40` : 'rgba(255,255,255,0.05)',
                        backgroundColor: isSelected ? `${p.themeColor}10` : 'transparent',
                        color: p.themeColor
                      }}
                    >
                       <div 
                         className="w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]"
                         style={{ backgroundColor: p.themeColor }}
                       />
                    </div>
                    {isSelected && (
                       <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold tracking-widest text-white uppercase">
                         Actif
                       </span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-indigo-200 transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3 mb-4 group-hover:text-zinc-400 transition-colors">
                      {p.description}
                    </p>
                  </div>

                  {/* Footer: Tech details */}
                  <div className="pt-4 mt-2 border-t border-white/5 flex items-center justify-between">
                     <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-mono">
                        <span>ID: {p.id.toUpperCase().substring(0, 4)}</span>
                     </div>
                     <div 
                        className="text-[10px] font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ color: p.themeColor }}
                     >
                        SELECT_MODULE
                     </div>
                  </div>

                </button>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
};

export default PersonalitySelector;