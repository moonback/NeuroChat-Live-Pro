import React, { useState } from 'react';
import { AVAILABLE_VOICES, VoiceOption } from '../constants';

interface VoiceSelectorProps {
  currentVoice: string;
  onVoiceChange: (voiceName: string) => void;
  disabled?: boolean;
}

const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  currentVoice,
  onVoiceChange,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const currentVoiceOption = AVAILABLE_VOICES.find(v => v.id === currentVoice) || AVAILABLE_VOICES[3];

  const handleVoiceSelect = (voiceId: string) => {
    onVoiceChange(voiceId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Bouton principal */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="group relative flex items-center gap-1 md:gap-1.5 sm:gap-2 px-1.5 md:px-2.5 sm:px-3 md:px-4 py-1.5 md:py-2 sm:py-2 md:py-2.5 rounded-lg sm:rounded-xl glass-intense border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 touch-manipulation min-h-[36px] md:min-h-[44px]"
        style={{
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}
      >
          <span className="text-sm md:text-base sm:text-lg md:text-xl">{currentVoiceOption.icon}</span>
          <div className="flex flex-col items-start hidden sm:flex">
            <span className="font-display text-[10px] sm:text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">
              Voix: {currentVoiceOption.name}
            </span>
          </div>
        <svg 
          className={`w-3 h-3 md:w-4 md:h-4 text-slate-400 group-hover:text-white transition-all duration-300 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Menu déroulant */}
      {isOpen && (
        <>
          {/* Backdrop pour fermer le menu en cliquant à l'extérieur */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Liste des voix */}
          <div 
            className="absolute top-full mt-2 right-0 w-[calc(100vw-2rem)] sm:w-64 md:w-72 max-w-[calc(100vw-2rem)] sm:max-w-none glass-intense rounded-2xl border border-white/10 overflow-hidden z-50 animate-in"
            style={{
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(99, 102, 241, 0.2)'
            }}
          >
            <div className="p-2 space-y-1">
              {AVAILABLE_VOICES.map((voice) => (
                <button
                  key={voice.id}
                  onClick={() => handleVoiceSelect(voice.id)}
                  className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-200 group touch-manipulation min-h-[44px] ${
                    voice.id === currentVoice 
                      ? 'bg-white/10 border border-white/20' 
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <span className="text-xl sm:text-2xl">{voice.icon}</span>
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-display text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5 sm:gap-2">
                      <span className="truncate">{voice.name}</span>
                      {voice.id === currentVoice && (
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="font-body text-[10px] sm:text-xs text-slate-400 group-hover:text-slate-300 transition-colors truncate">
                      {voice.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            {/* Info footer */}
            <div className="px-4 py-3 bg-white/5 border-t border-white/10">
              <p className="font-body text-[10px] text-slate-400 text-center">
                💡 Changez de voix avant de démarrer une nouvelle session
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VoiceSelector;

