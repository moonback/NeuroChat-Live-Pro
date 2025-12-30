import React, { useState, useEffect } from 'react';
import { ConnectionState } from '../types';

interface QuickStartGuideProps {
  connectionState: ConnectionState;
  onClose: () => void;
}

const QuickStartGuide: React.FC<QuickStartGuideProps> = ({
  connectionState,
  onClose
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenGuide, setHasSeenGuide] = useState(() => {
    return localStorage.getItem('hasSeenQuickStart') === 'true';
  });

  useEffect(() => {
    // Afficher le guide seulement si l'utilisateur ne l'a pas encore vu et qu'il n'est pas connecté
    if (!hasSeenGuide && connectionState === ConnectionState.DISCONNECTED) {
      const timer = setTimeout(() => {
        setHasSeenGuide(false); // Forcer l'affichage pour la première fois
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [hasSeenGuide, connectionState]);

  const steps = [
    {
      title: "Bienvenue dans NeuroChat Pro",
      content: "Une interface vocale immersive propulsée par Gemini Live. Parlez naturellement avec l'IA en temps réel.",
      icon: "🚀"
    },
    {
      title: "Activation simple",
      content: "Cliquez sur 'Activer' pour démarrer une session.",
      icon: "🎤"
    },
    {
      title: "Vision par ordinateur",
      content: "Activez la caméra pour que l'IA puisse voir votre environnement et vous aider visuellement.",
      icon: "👁️"
    },
    {
      title: "Personnalisation",
      content: "Modifiez la personnalité de l'IA selon vos besoins : expert technique, créatif, assistant, etc.",
      icon: "🎭"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    localStorage.setItem('hasSeenQuickStart', 'true');
    setHasSeenGuide(true);
    onClose();
  };

  const handleSkip = () => {
    handleFinish();
  };

  // Ne pas afficher si déjà vu ou si connecté
  if (hasSeenGuide || connectionState !== ConnectionState.DISCONNECTED) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in p-3 sm:p-4">
      <div 
        className="relative w-full max-w-lg glass-intense rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-scale-in"
        style={{
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(99, 102, 241, 0.2)'
        }}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 md:p-6 border-b border-white/5 bg-white/5 flex justify-between items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <span className="text-2xl sm:text-3xl flex-shrink-0">{steps[currentStep].icon}</span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-display font-bold text-white truncate">
                {steps[currentStep].title}
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">
                Étape {currentStep + 1} sur {steps.length}
              </p>
            </div>
          </div>
          <button 
            onClick={handleSkip}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
            aria-label="Fermer le guide"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 md:p-6">
          <p className="text-slate-300 font-body text-sm sm:text-base leading-relaxed">
            {steps[currentStep].content}
          </p>
          
          {/* Progress indicators */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-4 sm:mt-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                  index === currentStep 
                    ? 'w-6 sm:w-8 bg-indigo-500' 
                    : index < currentStep 
                    ? 'w-1.5 sm:w-2 bg-indigo-500/50' 
                    : 'w-1.5 sm:w-2 bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 md:p-6 border-t border-white/5 bg-black/20 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-0">
          <button 
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white/20 touch-manipulation min-h-[44px] flex items-center justify-center order-2 sm:order-1"
          >
            Précédent
          </button>
          
          <div className="flex gap-2 order-1 sm:order-2">
            <button 
              onClick={handleSkip}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 touch-manipulation min-h-[44px] flex items-center justify-center"
            >
              Passer
            </button>
            <button 
              onClick={handleNext}
              className="px-5 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 touch-manipulation min-h-[44px]"
            >
              <span>{currentStep === steps.length - 1 ? 'Commencer' : 'Suivant'}</span>
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickStartGuide;

