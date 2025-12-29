/**
 * Détecteur de mot-clé d'activation "Neurochat"
 * Utilise l'API Web Speech Recognition pour détecter le wake word
 */

export interface WakeWordDetectorOptions {
  onWakeWordDetected: () => void;
  wakeWord?: string;
  aliases?: string[];
  matchPosition?: 'start' | 'any';
  minConfidence?: number; // 0..1, ignoré si confiance indisponible (0)
  cooldownMs?: number;
  onListeningChange?: (isListening: boolean) => void;
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
  private lastDetectionAt: number = 0;

  constructor(options: WakeWordDetectorOptions) {
    this.options = {
      wakeWord: 'Bonjour',
      aliases: [],
      matchPosition: 'start',
      minConfidence: 0.55,
      cooldownMs: 1500,
      onListeningChange: () => {},
      continuous: true,
      lang: 'fr-FR',
      ...options,
    };

    this.initializeRecognition();
  }

  private setListeningState(next: boolean): void {
    if (this.isListening === next) return;
    this.isListening = next;
    try {
      this.options.onListeningChange(next);
    } catch {
      // ignore
    }
  }

  private normalizeText(input: string): string {
    // Lowercase + remove diacritics + trim + collapse spaces
    return input
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  private tokenize(input: string): string[] {
    const norm = this.normalizeText(input);
    if (!norm) return [];
    return norm.split(' ');
  }

  private matchWakePhrase(transcript: string, phrase: string): boolean {
    const t = this.tokenize(transcript);
    const p = this.tokenize(phrase);
    if (t.length === 0 || p.length === 0) return false;

    const maxStart = t.length - p.length;
    for (let start = 0; start <= maxStart; start++) {
      let ok = true;
      for (let j = 0; j < p.length; j++) {
        if (t[start + j] !== p[j]) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      if (this.options.matchPosition === 'start') return start === 0;
      return true;
    }
    return false;
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
          const confidence = typeof result[0].confidence === 'number' ? result[0].confidence : 0;
          
          // Log de débogage pour voir ce qui est détecté
          if (isFinal || transcript.length > 0) {
            console.log(`[Wake Word] Transcription détectée: "${transcript}" (final: ${isFinal}, conf: ${confidence})`);
          }
          
          // Réduire les faux positifs: on déclenche uniquement sur résultat final
          if (!isFinal) continue;

          // Cooldown: éviter les triggers en rafale
          const now = Date.now();
          if (now - this.lastDetectionAt < this.options.cooldownMs) continue;

          // Seuil de confiance (si disponible)
          if (confidence > 0 && confidence < this.options.minConfidence) continue;

          const phrases = [this.options.wakeWord, ...(this.options.aliases || [])].filter(Boolean);
          const detected = phrases.some((phrase) => this.matchWakePhrase(transcript, phrase));
          
          if (detected) {
            console.log(`✅ Wake word détecté! Transcription: "${transcript}"`);
            this.lastDetectionAt = now;
            this.options.onWakeWordDetected();
            // Arrêter pour éviter les détections multiples
            // Le redémarrage sera géré par le composant parent selon l'état de connexion
            this.stop();
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
      this.setListeningState(true);
      console.log(`✅ [Wake Word] Écoute du wake word "${this.options.wakeWord}" activée`);
    } catch (error: any) {
      // Ignorer les erreurs "already started"
      if (error.name === 'InvalidStateError' || error.message?.includes('already')) {
        this.setListeningState(true);
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
        this.setListeningState(false);
        console.log('[Wake Word] Écoute du wake word désactivée');
      } catch (error: any) {
        // Ignorer les erreurs si la reconnaissance n'est pas en cours
        if (error.name !== 'InvalidStateError') {
          console.warn('[Wake Word] Erreur lors de l\'arrêt de la reconnaissance:', error);
        }
        this.setListeningState(false);
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

