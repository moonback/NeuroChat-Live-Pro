import { useCallback, useEffect, useRef } from 'react';

interface UseAudioManagerResult {
  activateAudioContext: () => void;
  playBeep: () => void;
  audioContextActivatedRef: React.MutableRefObject<boolean>;
  beepAudioRef: React.MutableRefObject<HTMLAudioElement | null>;
}

export const useAudioManager = (): UseAudioManagerResult => {
  const audioContextActivatedRef = useRef(false);
  const beepAudioRef = useRef<HTMLAudioElement | null>(null);

  const activateAudioContext = useCallback(async () => {
    if (audioContextActivatedRef.current) return;

    try {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
      const ctx = new Ctx();
      
      // Résoudre l'AudioContext s'il est suspendu (nécessaire après un geste utilisateur)
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      gainNode.gain.value = 0;
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.001);

      audioContextActivatedRef.current = true;

      if (!beepAudioRef.current) {
        const audio = new Audio('/bip.mp3');
        audio.volume = 0.7;
        audio.preload = 'auto';
        audio.load();
        beepAudioRef.current = audio;
      }
    } catch (error) {
      console.warn('[AudioManager] Impossible d\'activer le contexte audio:', error);
    }
  }, []);

  useEffect(() => {
    const audio = new Audio('/bip.mp3');
    audio.volume = 0.7;
    audio.preload = 'auto';
    audio.load();
    beepAudioRef.current = audio;

    return () => {
      if (beepAudioRef.current) {
        beepAudioRef.current.pause();
        beepAudioRef.current = null;
      }
    };
  }, []);

  const playBeep = useCallback(() => {
    try {
      if (beepAudioRef.current) {
        beepAudioRef.current.currentTime = 0;

        const playPromise = beepAudioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            if (error.name !== 'NotAllowedError') {
              console.warn('[AudioManager] Erreur lors de la lecture du bip:', error);
            }
          });
        }
      } else {
        const audio = new Audio('/bip.mp3');
        audio.volume = 0.7;
        audio.play().catch(error => {
          if (error.name !== 'NotAllowedError') {
            console.warn('[AudioManager] Impossible de jouer le bip:', error);
          }
        });
      }
    } catch (error) {
      if ((error as any).name !== 'NotAllowedError') {
        console.warn('[AudioManager] Erreur lors de la création du bip:', error);
      }
    }
  }, []);

  return {
    activateAudioContext,
    playBeep,
    audioContextActivatedRef,
    beepAudioRef,
  };
};


