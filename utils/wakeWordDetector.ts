/**
 * Détecteur de mot-clé d'activation "Neurochat"
 * Utilise l'API Web Speech Recognition pour détecter le wake word
 */

export interface WakeWordDetectorOptions {
  onWakeWordDetected: () => void;
  wakeWord?: string;
  continuous?: boolean;
  lang?: string;
}

export class WakeWordDetector {
  private recognition: SpeechRecognition | null = null;
  private isListening: boolean = false;
  private isIntentionallyStopped: boolean = false;
  private restartTimeout: NodeJS.Timeout | null = null;
  private errorCount: number = 0;
  private maxErrors: number = 5;
  private options: Required<WakeWordDetectorOptions>;

  constructor(options: WakeWordDetectorOptions) {
    this.options = {
      wakeWord: 'Bonjour',
      continuous: true,
      lang: 'fr-FR',
      ...options,
    };

    this.initializeRecognition();
  }

  private initializeRecognition(): void {
    // Vérifier si l'API est disponible
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('[Wake Word] ❌ Web Speech Recognition API non disponible dans ce navigateur');
      console.warn('[Wake Word] Cette fonctionnalité nécessite Chrome, Edge, ou Safari');
      return;
    }

    try {
      console.log('[Wake Word] Initialisation de la reconnaissance vocale...');
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = this.options.continuous;
      this.recognition.interimResults = true;
      this.recognition.lang = this.options.lang;
      console.log(`[Wake Word] ✅ Reconnaissance vocale initialisée (lang: ${this.options.lang}, wake word: "${this.options.wakeWord}")`);

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript.toLowerCase().trim();
          const isFinal = result.isFinal;
          
          // Log de débogage pour voir ce qui est détecté
          if (isFinal || transcript.length > 0) {
            console.log(`[Wake Word] Transcription détectée: "${transcript}" (final: ${isFinal})`);
          }
          
          // Normaliser le wake word pour la comparaison
          const wakeWordLower = this.options.wakeWord.toLowerCase();
          
          // Vérifier si le wake word est présent dans la transcription
          // Supporte aussi les variantes comme "bonjour neurochat" ou juste "neurochat"
          const wakeWords = [
            wakeWordLower,
            'salut', // Toujours supporter "neurochat" même si le wake word est différent
            'bonjour',
          ];
          
          const detected = wakeWords.some(word => {
            // Vérifier si le mot est présent dans la transcription
            const found = transcript.includes(word);
            if (found) {
              console.log(`[Wake Word] Match trouvé: "${word}" dans "${transcript}"`);
            }
            return found;
          });
          
          if (detected) {
            console.log(`✅ Wake word détecté! Transcription: "${transcript}"`);
            this.options.onWakeWordDetected();
            // Arrêter temporairement pour éviter les détections multiples
            this.stop();
            // Redémarrer après un court délai
            setTimeout(() => {
              if (!this.isListening) {
                this.start();
              }
            }, 2000); // Augmenter le délai pour éviter les détections multiples
            break;
          }
        }
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        // Ignorer les erreurs normales qui ne nécessitent pas d'action
        const ignorableErrors = ['aborted', 'no-speech'];
        
        if (ignorableErrors.includes(event.error)) {
          // Ces erreurs sont normales, ne pas les logger comme erreurs
          return;
        }

        // Logger uniquement les vraies erreurs
        console.warn('Erreur de reconnaissance vocale:', event.error);
        this.errorCount++;

        // Si trop d'erreurs, arrêter temporairement
        if (this.errorCount >= this.maxErrors) {
          console.warn('Trop d\'erreurs de reconnaissance vocale, arrêt temporaire');
          this.isListening = false;
          this.errorCount = 0;
          // Réessayer après un délai plus long
          this.scheduleRestart(5000);
          return;
        }

        // Redémarrer automatiquement en cas d'erreur non fatale
        if (!this.isIntentionallyStopped) {
          this.scheduleRestart(2000);
        }
      };

      this.recognition.onend = () => {
        // Redémarrer automatiquement si on était en train d'écouter et que ce n'était pas intentionnel
        if (this.isListening && !this.isIntentionallyStopped) {
          this.scheduleRestart(500);
        } else if (this.isIntentionallyStopped) {
          // Réinitialiser le flag si on a intentionnellement arrêté
          this.isIntentionallyStopped = false;
        }
      };
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la reconnaissance vocale:', error);
    }
  }

  private scheduleRestart(delay: number): void {
    // Annuler tout redémarrage précédent
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
    }

    this.restartTimeout = setTimeout(() => {
      if (this.isListening && !this.isIntentionallyStopped && this.recognition) {
        try {
          this.recognition.start();
          this.errorCount = 0; // Réinitialiser le compteur d'erreurs en cas de succès
        } catch (e: any) {
          // Ignorer les erreurs "already started" ou similaires
          if (e.name !== 'InvalidStateError' && e.message?.includes('already')) {
            // C'est OK, la reconnaissance est déjà en cours
            this.isListening = true;
          } else {
            // Autre erreur, réessayer plus tard
            this.scheduleRestart(delay * 2);
          }
        }
      }
      this.restartTimeout = null;
    }, delay);
  }

  public start(): void {
    if (!this.recognition) {
      console.warn('[Wake Word] Reconnaissance vocale non disponible');
      return;
    }

    if (this.isListening) {
      console.log('[Wake Word] Déjà en écoute, démarrage ignoré');
      return;
    }

    this.isIntentionallyStopped = false;
    this.errorCount = 0;

    try {
      console.log(`[Wake Word] Démarrage de l'écoute pour "${this.options.wakeWord}" (lang: ${this.options.lang})`);
      this.recognition.start();
      this.isListening = true;
      console.log(`✅ [Wake Word] Écoute du wake word "${this.options.wakeWord}" activée`);
    } catch (error: any) {
      // Ignorer les erreurs "already started"
      if (error.name === 'InvalidStateError' || error.message?.includes('already')) {
        this.isListening = true;
        console.log('[Wake Word] Reconnaissance déjà en cours');
        return;
      }
      
      console.warn('[Wake Word] Erreur lors du démarrage de la reconnaissance:', error);
      // Réessayer après un délai
      this.scheduleRestart(2000);
    }
  }

  public stop(): void {
    // Annuler tout redémarrage prévu
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }

    this.isIntentionallyStopped = true;

    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
        this.isListening = false;
        console.log('[Wake Word] Écoute du wake word désactivée');
      } catch (error: any) {
        // Ignorer les erreurs si la reconnaissance n'est pas en cours
        if (error.name !== 'InvalidStateError') {
          console.warn('[Wake Word] Erreur lors de l\'arrêt de la reconnaissance:', error);
        }
        this.isListening = false;
      }
    }
  }

  public isActive(): boolean {
    return this.isListening;
  }

  public destroy(): void {
    // Annuler tout redémarrage prévu
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }

    this.stop();
    this.recognition = null;
    this.errorCount = 0;
  }
}

// Types pour TypeScript
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

