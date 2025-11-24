import React, { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Vérifier si l'app est déjà installée
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    
    if (isStandalone || isInWebAppiOS) {
      setIsInstalled(true);
      return;
    }

    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Écouter l'événement appinstalled (l'app a été installée)
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallButton(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Vérifier périodiquement si l'app est installée
    const checkInstalled = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches;
      const webAppiOS = (window.navigator as any).standalone === true;
      if (standalone || webAppiOS) {
        setIsInstalled(true);
        setShowInstallButton(false);
      }
    };

    const interval = setInterval(checkInstalled, 1000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearInterval(interval);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Pour iOS, afficher les instructions
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        alert(
          'Pour installer cette application sur iOS:\n\n' +
          '1. Appuyez sur le bouton de partage (□↑)\n' +
          '2. Sélectionnez "Sur l\'écran d\'accueil"\n' +
          '3. L\'application sera ajoutée à votre écran d\'accueil'
        );
      }
      return;
    }

    // Afficher la bannière d'installation
    deferredPrompt.prompt();

    // Attendre la réponse de l'utilisateur
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('L\'utilisateur a accepté l\'installation de l\'application');
    } else {
      console.log('L\'utilisateur a refusé l\'installation de l\'application');
    }

    // Réinitialiser le prompt
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  // Ne pas afficher si déjà installé ou si le bouton ne doit pas être affiché
  if (isInstalled || !showInstallButton) {
    return null;
  }

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl shadow-2xl p-4 max-w-sm border border-white/20 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">
              Installer NeuroChat Pro
            </h3>
            <p className="text-xs text-white/90 mb-3">
              {isIOS 
                ? 'Installez l\'app pour une meilleure expérience'
                : isAndroid
                ? 'Ajoutez l\'application à votre écran d\'accueil'
                : 'Installez l\'application sur votre appareil'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstallClick}
                className="flex-1 bg-white text-indigo-600 font-medium text-xs px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors shadow-sm"
              >
                {isIOS ? 'Instructions' : 'Installer'}
              </button>
              <button
                onClick={() => setShowInstallButton(false)}
                className="px-3 py-2 text-white/80 hover:text-white transition-colors"
                aria-label="Fermer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPWA;

