import { ToastMessage } from '../components/Toast';
import { useStatusManager } from '../hooks/useStatusManager';

// Type pour la fonction addToast
export type AddToastFn = (type: ToastMessage['type'], title: string, message: string) => void;

// ============================================
// Helpers de connexion
// ============================================

export const showConnectionSuccess = (addToast: AddToastFn) => {
  addToast('success', 'Connecté', 'Session NeuroChat active');
};

export const showConnectionError = (addToast: AddToastFn, error: string) => {
  addToast('error', 'Échec de connexion', error);
};

export const showConnectionFailure = (addToast: AddToastFn, errorMessage: string) => {
  addToast('error', 'Échec Connexion', errorMessage);
};

export const showSessionError = (addToast: AddToastFn, errorMessage: string) => {
  addToast('error', 'Erreur Session', errorMessage);
};

export const showSessionCreationError = (addToast: AddToastFn) => {
  addToast('error', 'Erreur Session', 'Impossible de créer la session. Vérifiez votre clé API.');
};

export const showReconnectionFailure = (addToast: AddToastFn) => {
  addToast('error', 'Échec de connexion', 'Impossible de se reconnecter après 5 tentatives. Veuillez réessayer manuellement.');
};

export const showDisconnection = (addToast: AddToastFn) => {
  addToast('info', 'Déconnexion', 'Redémarrage en cours...');
};

export const showSessionEnd = (addToast: AddToastFn) => {
  addToast('info', 'Fin de session', 'Redémarrage complet de l\'application...');
};

// ============================================
// Helpers de fonctionnalités
// ============================================

export const showFunctionCallingToggle = (addToast: AddToastFn, enabled: boolean) => {
  addToast('success', 'Appel de fonction', enabled ? 'Appel de fonction activé' : 'Appel de fonction désactivé');
};

export const showGoogleSearchToggle = (addToast: AddToastFn, enabled: boolean) => {
  addToast('success', 'Google Search', enabled ? 'Google Search activé' : 'Google Search désactivé');
};

export const showFunctionExecuted = (addToast: AddToastFn, functionName: string) => {
  addToast('info', 'Fonction exécutée', `Fonction ${functionName} exécutée avec succès`);
};

export const showFunctionError = (addToast: AddToastFn, functionName: string) => {
  addToast('error', 'Erreur', `Erreur lors de l'exécution de ${functionName}`);
};

// ============================================
// Helpers de documents
// ============================================

export const showDocumentsUpdated = (addToast: AddToastFn) => {
  addToast('info', 'Documents Mis à Jour', 'Reconnexion pour appliquer les changements...');
};

export const showDocumentsLoaded = (addToast: AddToastFn, count: number) => {
  addToast('success', 'Documents Chargés', `${count} document(s) prêt(s) à être utilisés`);
};

// ============================================
// Helpers de vision/caméra
// ============================================

export const showCameraChanged = (addToast: AddToastFn) => {
  addToast('success', 'Caméra changée', 'La nouvelle caméra est maintenant active');
};

export const showCameraError = (addToast: AddToastFn) => {
  addToast('error', 'Erreur Caméra', "Impossible d'accéder à la caméra. Vérifiez les permissions.");
};

export const showCameraChangeError = (addToast: AddToastFn) => {
  addToast('error', 'Erreur', 'Impossible de changer de caméra');
};

export const showScreenShareSuccess = (addToast: AddToastFn) => {
  addToast('success', "Partage d'écran", "Partage d'écran activé");
};

export const showScreenShareError = (addToast: AddToastFn) => {
  addToast('error', 'Erreur', "Impossible de partager l'écran");
};

// ============================================
// Helpers généraux
// ============================================


export const showError = (addToast: AddToastFn, title: string, message: string) => {
  addToast('error', title, message);
};

export const showSuccess = (addToast: AddToastFn, title: string, message: string) => {
  addToast('success', title, message);
};

export const showInfo = (addToast: AddToastFn, title: string, message: string) => {
  addToast('info', title, message);
};

export const showWarning = (addToast: AddToastFn, title: string, message: string) => {
  addToast('warning', title, message);
};

// ============================================
// Custom Hook
// ============================================

export const useToastNotifications = () => {
  const { addToast } = useStatusManager();

  return {
    // Connexion
    notifyConnectionSuccess: () => showConnectionSuccess(addToast),
    notifyConnectionError: (error: string) => showConnectionError(addToast, error),
    notifyConnectionFailure: (errorMessage: string) => showConnectionFailure(addToast, errorMessage),
    notifySessionError: (errorMessage: string) => showSessionError(addToast, errorMessage),
    notifySessionCreationError: () => showSessionCreationError(addToast),
    notifyReconnectionFailure: () => showReconnectionFailure(addToast),
    notifyDisconnection: () => showDisconnection(addToast),
    notifySessionEnd: () => showSessionEnd(addToast),

    // Fonctionnalités
    notifyFunctionCallingToggle: (enabled: boolean) => showFunctionCallingToggle(addToast, enabled),
    notifyGoogleSearchToggle: (enabled: boolean) => showGoogleSearchToggle(addToast, enabled),
    notifyFunctionExecuted: (functionName: string) => showFunctionExecuted(addToast, functionName),
    notifyFunctionError: (functionName: string) => showFunctionError(addToast, functionName),

    // Documents
    notifyDocumentsUpdated: () => showDocumentsUpdated(addToast),
    notifyDocumentsLoaded: (count: number) => showDocumentsLoaded(addToast, count),

    // Vision/Caméra
    notifyCameraChanged: () => showCameraChanged(addToast),
    notifyCameraError: () => showCameraError(addToast),
    notifyCameraChangeError: () => showCameraChangeError(addToast),
    notifyScreenShareSuccess: () => showScreenShareSuccess(addToast),
    notifyScreenShareError: () => showScreenShareError(addToast),

    // Généraux
    notifyError: (title: string, message: string) => showError(addToast, title, message),
    notifySuccess: (title: string, message: string) => showSuccess(addToast, title, message),
    notifyInfo: (title: string, message: string) => showInfo(addToast, title, message),
    notifyWarning: (title: string, message: string) => showWarning(addToast, title, message),
  };
};

