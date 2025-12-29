import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
  color: string;
  isActive: boolean;
  isEyeTrackingEnabled?: boolean;
}

interface ShockWave {
  radius: number;
  opacity: number;
  speed: number;
}

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  if (!hex) return { r: 99, g: 102, b: 241 };
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((s) => s + s).join('');
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
};

const Visualizer: React.FC<VisualizerProps> = ({ analyserRef, color, isActive, isEyeTrackingEnabled = true }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  const colorRef = useRef(color);
  const isActiveRef = useRef(isActive);
  const isEyeTrackingEnabledRef = useRef(isEyeTrackingEnabled);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);
  useEffect(() => { isEyeTrackingEnabledRef.current = isEyeTrackingEnabled; }, [isEyeTrackingEnabled]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initial mouse position
    mouseRef.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    const ctx = canvas.getContext('2d', { 
      alpha: true,
      desynchronized: true
    });
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    let rotationOffset = 0;
    let shockWaves: ShockWave[] = [];
    let lastAudioLevel = 0.05;

    // Gaze tracking (Suivi du regard)
    let currentLookX = 0;
    let currentLookY = 0;

    // Variables pour le clignement des yeux (Blink)
    let nextBlinkTime = Date.now() + Math.random() * 2000 + 2000;
    let isBlinking = false;
    let eyeOpenAmount = 0; // 1 = ouvert, 0 = fermé
    let blinkSpeed = 0.15;

    const draw = () => {
      if (!ctx || !canvas) return;
      animationRef.current = requestAnimationFrame(draw);

      const w = canvas.width;
      const h = canvas.height;
      const centerX = w / 2;
      const centerY = h / 2;
      const currentColor = colorRef.current;
      const currentIsActive = isActiveRef.current;
      const rgb = hexToRgb(currentColor);
      const baseColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}`;

      // 1. Fond avec vignette améliorée
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, w, h);
      
      const vignette = ctx.createRadialGradient(centerX, centerY, h * 0.2, centerX, centerY, h * 0.9);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.7)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);

      // 2. Analyse Audio avec lissage progressif
      let audioLevel = 0.05;
      if (analyserRef.current && currentIsActive) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
        const rawLevel = (sum / bufferLength) / 255;
        audioLevel = Math.max(0.05, rawLevel);
        
        // Lissage progressif
        audioLevel = lastAudioLevel * 0.7 + audioLevel * 0.3;
        lastAudioLevel = audioLevel;
      } else {
        const t = Date.now() / 3000;
        audioLevel = 0.05 + Math.sin(t) * 0.01;
        lastAudioLevel = audioLevel;
      }

      // Détecter les pics audio pour créer des ondes de choc
      if (audioLevel > 0.25 && shockWaves.length < 3) {
        shockWaves.push({ radius: 0, opacity: 1, speed: 3 + audioLevel * 5 });
      }

      rotationOffset += 0.002 + (audioLevel * 0.02);
      const baseRadius = Math.min(w, h) / 8;
      const pulsation = 1 + (audioLevel > 0.3 ? (audioLevel - 0.3) * 0.3 : 0);

      // Logique de clignement (Blink logic)
      const now = Date.now();
      if (!isBlinking && now > nextBlinkTime) {
        isBlinking = true;
        blinkSpeed = 0.2; // Vitesse de fermeture
      }

      if (isBlinking) {
        eyeOpenAmount -= blinkSpeed;
        if (eyeOpenAmount <= 0) {
          eyeOpenAmount = 0;
          blinkSpeed = -0.2; // Vitesse d'ouverture
        } else if (eyeOpenAmount >= 1) {
          eyeOpenAmount = 1;
          isBlinking = false;
          nextBlinkTime = now + Math.random() * 3000 + 1000;
        }
      }

      // Calcul du regard (Gaze Calculation)
      let targetLookX = 0;
      let targetLookY = 0;

      if (isEyeTrackingEnabledRef.current) {
        const dx = mouseRef.current.x - centerX;
        const dy = mouseRef.current.y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxGazeDistance = baseRadius * 0.6; // Rayon max de mouvement de l'iris
        
        targetLookX = dx;
        targetLookY = dy;
        
        if (dist > maxGazeDistance) {
          const angle = Math.atan2(dy, dx);
          targetLookX = Math.cos(angle) * maxGazeDistance;
          targetLookY = Math.sin(angle) * maxGazeDistance;
        }
      } else {
        // Mode Idle : Mouvement très subtil aléatoire (respiration)
        const time = Date.now() / 2000;
        targetLookX = Math.sin(time) * baseRadius * 0.05;
        targetLookY = Math.cos(time * 0.7) * baseRadius * 0.05;
      }
      
      // Lissage du mouvement (Lerp)
      currentLookX += (targetLookX - currentLookX) * 0.1;
      currentLookY += (targetLookY - currentLookY) * 0.1;

      // 3. Ondes de choc multiples
      shockWaves = shockWaves.filter(wave => {
        wave.radius += wave.speed;
        wave.opacity -= 0.01;
        
        if (wave.opacity > 0) {
          ctx.beginPath();
          ctx.arc(centerX, centerY, baseRadius * 2 + wave.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `${baseColor}, ${wave.opacity * 0.4})`;
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Onde secondaire décalée
          ctx.beginPath();
          ctx.arc(centerX, centerY, baseRadius * 2 + wave.radius - 20, 0, Math.PI * 2);
          ctx.strokeStyle = `${baseColor}, ${wave.opacity * 0.2})`;
          ctx.lineWidth = 1;
          ctx.stroke();
          
          return true;
        }
        return false;
      });

      // Appliquer l'effet de clignement au groupe central (Noyau + Oeil)
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(1, eyeOpenAmount);
      ctx.translate(-centerX, -centerY);

      // 4. Noyau 3D (Fond de l'œil) - Bouge légèrement (Parallaxe inverse ou faible)
      const coreX = centerX + currentLookX * 0.15;
      const coreY = centerY + currentLookY * 0.15;

      const coreGradient = ctx.createRadialGradient(
        coreX, coreY, 0,
        coreX, coreY, baseRadius * pulsation
      );
      coreGradient.addColorStop(0, `${baseColor}, 0.4)`);
      coreGradient.addColorStop(0.5, `${baseColor}, 0.2)`);
      coreGradient.addColorStop(1, `${baseColor}, 0.05)`);
      
      ctx.save();
      ctx.shadowBlur = 40 * pulsation;
      ctx.shadowColor = `${baseColor}, 0.8)`;
      ctx.beginPath();
      ctx.arc(coreX, coreY, baseRadius * pulsation, 0, Math.PI * 2);
      ctx.fillStyle = coreGradient;
      ctx.fill();
      ctx.restore();

      // Bordure lumineuse du noyau
      ctx.beginPath();
      ctx.arc(coreX, coreY, baseRadius * pulsation, 0, Math.PI * 2);
      ctx.strokeStyle = `${baseColor}, 0.6)`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // 5. Œil central (Iris + Pupille) - Suit le regard
      const eyeRadius = baseRadius * (0.55 + audioLevel * 0.3) * pulsation;
      
      // Position de l'iris (Suit le regard)
      const irisX = centerX + currentLookX;
      const irisY = centerY + currentLookY;

      // Lueur externe (Sclère éthérée) - Suit le noyau
      const eyeGlowOuter = ctx.createRadialGradient(
        coreX, coreY, eyeRadius * 0.5,
        coreX, coreY, eyeRadius * 2
      );
      eyeGlowOuter.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      eyeGlowOuter.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
      eyeGlowOuter.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.save();
      ctx.shadowBlur = 50 * pulsation;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(coreX, coreY, eyeRadius * 1.8, 0, Math.PI * 2);
      ctx.fillStyle = eyeGlowOuter;
      ctx.fill();
      ctx.restore();

      // Iris (Détaillé) - Blanc
      const irisRadius = eyeRadius;
      const irisGradient = ctx.createRadialGradient(
        irisX, irisY, irisRadius * 0.2,
        irisX, irisY, irisRadius
      );
      // Centre plus clair, bords plus sombres pour l'iris
      irisGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)'); 
      irisGradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.7)');
      irisGradient.addColorStop(0.9, 'rgba(255, 255, 255, 0.9)'); // Anneau limbal
      irisGradient.addColorStop(1, 'rgba(0,0,0,0.5)'); // Bord net
      
      ctx.save();
      ctx.beginPath();
      ctx.arc(irisX, irisY, irisRadius, 0, Math.PI * 2);
      ctx.fillStyle = irisGradient;
      ctx.fill();
      
      // Ajout de détails dans l'iris (lignes radiales simples)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      for(let i=0; i<12; i++) {
         const angle = (Math.PI * 2 * i) / 12 + rotationOffset;
         ctx.beginPath();
         ctx.moveTo(irisX + Math.cos(angle) * irisRadius * 0.3, irisY + Math.sin(angle) * irisRadius * 0.3);
         ctx.lineTo(irisX + Math.cos(angle) * irisRadius * 0.8, irisY + Math.sin(angle) * irisRadius * 0.8);
         ctx.stroke();
      }
      ctx.restore();

      // Pupille (Noire)
      const pupilRadius = irisRadius * 0.4; 
      ctx.save();
      ctx.beginPath();
      ctx.arc(irisX, irisY, pupilRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.fill();
      ctx.restore();

      // Reflet (Specular highlight) - Décalage inverse pour effet 3D (bombé)
      // Le reflet "glisse" un peu sur la surface courbe
      const glintOffsetFactor = 0.2;
      const glintX = irisX - currentLookX * glintOffsetFactor;
      const glintY = irisY - currentLookY * glintOffsetFactor;

      ctx.beginPath();
      ctx.arc(glintX - pupilRadius * 0.4, glintY - pupilRadius * 0.4, pupilRadius * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.shadowBlur = 5;
      ctx.shadowColor = 'white';
      ctx.fill();
      
      // Second petit reflet
      ctx.beginPath();
      ctx.arc(glintX + pupilRadius * 0.3, glintY + pupilRadius * 0.3, pupilRadius * 0.1, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fill();

      // Fin de l'effet de clignement
      ctx.restore();

      // 6. Anneaux orbitaux doubles avec effets néon
      ctx.setLineDash([]);
      
      // Anneau orbital 1 (externe) avec glow
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotationOffset);
      
      const orbit1Radius = baseRadius * 1.7 * pulsation;
      ctx.shadowBlur = 20;
      ctx.shadowColor = `${baseColor}, 0.8)`;
      ctx.beginPath();
      ctx.arc(0, 0, orbit1Radius, 0, Math.PI * 1.6);
      ctx.strokeStyle = `${baseColor}, 0.7)`;
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Effet néon supplémentaire
      ctx.shadowBlur = 40;
      ctx.beginPath();
      ctx.arc(0, 0, orbit1Radius, 0, Math.PI * 1.6);
      ctx.strokeStyle = `${baseColor}, 0.3)`;
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.restore();

      // Anneau orbital 2 (interne) avec glow
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(-rotationOffset * 1.8);
      
      const orbit2Radius = baseRadius * 1.4 * pulsation;
      ctx.shadowBlur = 15;
      ctx.shadowColor = `${baseColor}, 0.8)`;
      ctx.beginPath();
      ctx.arc(0, 0, orbit2Radius, 0, Math.PI * 1.3);
      ctx.strokeStyle = `${baseColor}, 0.6)`;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Effet néon
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.arc(0, 0, orbit2Radius, 0, Math.PI * 1.3);
      ctx.strokeStyle = `${baseColor}, 0.2)`;
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.restore();

      // 7. Barre de niveau circulaire avec gradient coloré
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(-Math.PI / 2); // Commencer en haut
      
      const levelRadius = baseRadius * 2.1 * pulsation;
      const levelArcLength = Math.PI * 2 * Math.min(audioLevel * 2, 1);
      
      // Créer un gradient le long de l'arc
      const levelGradient = ctx.createLinearGradient(-levelRadius, 0, levelRadius, 0);
      levelGradient.addColorStop(0, `${baseColor}, 0.3)`);
      levelGradient.addColorStop(0.5, `${baseColor}, 0.9)`);
      levelGradient.addColorStop(1, `${baseColor}, 0.3)`);
      
      ctx.shadowBlur = 25;
      ctx.shadowColor = `${baseColor}, 1)`;
      ctx.beginPath();
      ctx.arc(0, 0, levelRadius, 0, levelArcLength);
      ctx.strokeStyle = levelGradient;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.stroke();
      
      // Effet de glow supplémentaire
      ctx.shadowBlur = 40;
      ctx.beginPath();
      ctx.arc(0, 0, levelRadius, 0, levelArcLength);
      ctx.strokeStyle = `${baseColor}, 0.3)`;
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.restore();

      // 8. Anneau pointillé externe qui réagit
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(-rotationOffset * 0.5);
      
      const dottedRadius = baseRadius * (2.3 + audioLevel * 0.3) * pulsation;
      ctx.setLineDash([3, 15]);
      ctx.beginPath();
      ctx.arc(0, 0, dottedRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `${baseColor}, 0.4)`;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // 9. Effet de pulsation ambiante lors des pics audio
      if (audioLevel > 0.35) {
        const pulseIntensity = (audioLevel - 0.35) * 2;
        const pulseGradient = ctx.createRadialGradient(
          centerX, centerY, baseRadius * 2,
          centerX, centerY, baseRadius * 4
        );
        pulseGradient.addColorStop(0, `${baseColor}, ${pulseIntensity * 0.2})`);
        pulseGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = pulseGradient;
        ctx.fillRect(0, 0, w, h);
      }
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [analyserRef]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none"
      style={{ background: '#050508' }}
    />
  );
};

export default Visualizer;