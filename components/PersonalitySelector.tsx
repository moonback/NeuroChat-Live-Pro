import React from 'react';
import { Personality } from '../types';
import { PERSONALITIES } from '../constants';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 animate-fade-in">
      {/* Premium Backdrop with Blur */}
      <div 
        className="absolute inset-0 bg-black/85 backdrop-blur-xl transition-all duration-500"
        onClick={onClose}
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.1), transparent 70%)'
        }}
      />

      {/* Premium Modal Container */}
      <div className="relative w-full max-w-6xl glass-intense rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in"
        style={{
          boxShadow: '0 25px 100px rgba(0, 0, 0, 0.5), 0 0 100px rgba(99, 102, 241, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}>
        
        {/* Elegant Header */}
        <div className="relative p-8 border-b border-white/10 flex justify-between items-center overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-8 rounded-full bg-gradient-to-b from-indigo-400 to-purple-500"></div>
              <h2 className="text-3xl md:text-4xl font-display font-black text-white tracking-tight">
                Personnalités
              </h2>
            </div>
            <p className="text-slate-400 font-body text-sm md:text-base font-light ml-4">
              Sélectionnez l'intelligence avec laquelle vous souhaitez converser
            </p>
          </div>
          
          <button 
            onClick={onClose}
            className="relative z-10 group p-3 rounded-xl glass border border-white/10 hover:border-white/30 transition-all duration-300 text-slate-400 hover:text-white hover:scale-110 active:scale-95"
          >
            <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Premium Grid with Custom Scrollbar */}
        <div className="p-8 overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {PERSONALITIES.map((p) => {
              const isSelected = currentPersonality.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelect(p);
                    onClose();
                  }}
                  className={`group relative text-left p-7 rounded-2xl border transition-all duration-500 hover:scale-[1.03] overflow-hidden ${
                    isSelected 
                      ? 'glass-intense shadow-2xl' 
                      : 'glass hover:glass-intense'
                  }`}
                  style={{ 
                    borderColor: isSelected ? p.themeColor : 'rgba(255, 255, 255, 0.1)',
                    boxShadow: isSelected 
                      ? `0 0 40px ${p.themeColor}30, 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)` 
                      : '0 8px 32px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  {/* Animated background gradient */}
                  <div 
                    className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${isSelected ? 'opacity-100' : ''}`}
                    style={{
                      background: `radial-gradient(circle at 50% 50%, ${p.themeColor}15, transparent 70%)`
                    }}
                  ></div>

                  {/* Top Bar */}
                  <div className="relative flex items-start justify-between mb-5">
                    <div 
                      className="px-4 py-1.5 rounded-lg font-display text-xs font-bold uppercase tracking-[0.15em] border glass"
                      style={{ 
                        color: p.themeColor,
                        borderColor: `${p.themeColor}50`,
                        textShadow: `0 0 20px ${p.themeColor}60`
                      }}
                    >
                      {p.name}
                    </div>
                    {isSelected && (
                      <div className="relative flex items-center gap-2">
                        <span className="text-emerald-400 font-body text-xs font-semibold">ACTIF</span>
                        <div className="relative w-4 h-4">
                          <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75"></div>
                          <div className="relative w-4 h-4 rounded-full bg-emerald-400" 
                            style={{ boxShadow: '0 0 15px rgba(52, 211, 153, 0.8)' }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Title */}
                  <h3 className="relative text-2xl font-display font-bold text-white mb-3 leading-tight group-hover:text-white transition-colors">
                    {p.description}
                  </h3>
                  
                  {/* Description */}
                  <p className="relative font-body text-sm text-slate-300 leading-relaxed line-clamp-3 mb-4">
                    {p.systemInstruction}
                  </p>

                  {/* Bottom Accent Bar */}
                  <div className="relative h-1 rounded-full overflow-hidden bg-white/5">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isSelected ? 'w-full' : 'w-0 group-hover:w-1/3'
                      }`}
                      style={{ 
                        background: `linear-gradient(90deg, ${p.themeColor}, transparent)`,
                        boxShadow: `0 0 10px ${p.themeColor}60`
                      }}
                    ></div>
                  </div>

                  {/* Hover Glow Border */}
                  <div 
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      boxShadow: `inset 0 0 20px ${p.themeColor}20`
                    }}
                  ></div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalitySelector;