import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
  color: string;
  isActive: boolean;
}

interface Particle {
  angle: number;
  distance: number;
  speed: number;
  size: number;
  offset: number;
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

const Visualizer: React.FC<VisualizerProps> = ({ analyserRef, color, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  const colorRef = useRef(color);
  const isActiveRef = useRef(isActive);

  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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
    let particles: Particle[] = [];
    let shockWaves: ShockWave[] = [];
    let lastAudioLevel = 0.05;
    
    // Initialiser les particules orbitales
    for (let i = 0; i < 30; i++) {
      particles.push({
        angle: (Math.PI * 2 * i) / 30,
        distance: 1.5 + Math.random() * 0.5,
        speed: 0.01 + Math.random() * 0.02,
        size: 2 + Math.random() * 3,
        offset: Math.random() * Math.PI * 2
      });
    }

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

      // 4. Noyau 3D avec gradients radiaux
      const coreGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, baseRadius * pulsation
      );
      coreGradient.addColorStop(0, `${baseColor}, 0.4)`);
      coreGradient.addColorStop(0.5, `${baseColor}, 0.2)`);
      coreGradient.addColorStop(1, `${baseColor}, 0.05)`);
      
      ctx.save();
      ctx.shadowBlur = 40 * pulsation;
      ctx.shadowColor = `${baseColor}, 0.8)`;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * pulsation, 0, Math.PI * 2);
      ctx.fillStyle = coreGradient;
      ctx.fill();
      ctx.restore();

      // Bordure lumineuse du noyau
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * pulsation, 0, Math.PI * 2);
      ctx.strokeStyle = `${baseColor}, 0.6)`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // 5. Œil central (Iris + Pupille)
      const eyeRadius = baseRadius * (0.25 + audioLevel * 0.3) * pulsation;
      
      // Lueur externe (Sclère éthérée)
      const eyeGlowOuter = ctx.createRadialGradient(
        centerX, centerY, eyeRadius * 0.5,
        centerX, centerY, eyeRadius * 2
      );
      eyeGlowOuter.addColorStop(0, `${baseColor}, 0.4)`);
      eyeGlowOuter.addColorStop(0.5, `${baseColor}, 0.2)`);
      eyeGlowOuter.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.save();
      ctx.shadowBlur = 50 * pulsation;
      ctx.shadowColor = `${baseColor}, 0.8)`;
      ctx.beginPath();
      ctx.arc(centerX, centerY, eyeRadius * 1.8, 0, Math.PI * 2);
      ctx.fillStyle = eyeGlowOuter;
      ctx.fill();
      ctx.restore();

      // Iris (Détaillé)
      const irisRadius = eyeRadius;
      const irisGradient = ctx.createRadialGradient(
        centerX, centerY, irisRadius * 0.2,
        centerX, centerY, irisRadius
      );
      // Centre plus clair, bords plus sombres pour l'iris
      irisGradient.addColorStop(0, `${baseColor}, 0.9)`); 
      irisGradient.addColorStop(0.6, `${baseColor}, 0.7)`);
      irisGradient.addColorStop(0.9, `${baseColor}, 0.9)`); // Anneau limbal
      irisGradient.addColorStop(1, 'rgba(0,0,0,0.5)'); // Bord net
      
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, irisRadius, 0, Math.PI * 2);
      ctx.fillStyle = irisGradient;
      ctx.fill();
      
      // Ajout de détails dans l'iris (lignes radiales simples)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      for(let i=0; i<12; i++) {
         const angle = (Math.PI * 2 * i) / 12 + rotationOffset;
         ctx.beginPath();
         ctx.moveTo(centerX + Math.cos(angle) * irisRadius * 0.3, centerY + Math.sin(angle) * irisRadius * 0.3);
         ctx.lineTo(centerX + Math.cos(angle) * irisRadius * 0.8, centerY + Math.sin(angle) * irisRadius * 0.8);
         ctx.stroke();
      }
      ctx.restore();

      // Pupille (Noire)
      const pupilRadius = irisRadius * 0.4; 
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, pupilRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.fill();
      ctx.restore();

      // Reflet (Specular highlight)
      ctx.beginPath();
      ctx.arc(centerX - pupilRadius * 0.4, centerY - pupilRadius * 0.4, pupilRadius * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.shadowBlur = 5;
      ctx.shadowColor = 'white';
      ctx.fill();
      
      // Second petit reflet
      ctx.beginPath();
      ctx.arc(centerX + pupilRadius * 0.3, centerY + pupilRadius * 0.3, pupilRadius * 0.1, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fill();

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

      // 7. Particules orbitales animées
      particles.forEach(particle => {
        particle.angle += particle.speed * (1 + audioLevel * 2);
        
        const particleRadius = baseRadius * particle.distance * pulsation;
        const px = centerX + Math.cos(particle.angle + particle.offset) * particleRadius;
        const py = centerY + Math.sin(particle.angle + particle.offset) * particleRadius;
        
        // Taille variable selon le niveau audio
        const particleSize = particle.size * (1 + audioLevel * 0.5);
        
        // Particule avec glow
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = `${baseColor}, 0.8)`;
        ctx.beginPath();
        ctx.arc(px, py, particleSize, 0, Math.PI * 2);
        
        const particleGradient = ctx.createRadialGradient(px, py, 0, px, py, particleSize);
        particleGradient.addColorStop(0, `${baseColor}, 0.9)`);
        particleGradient.addColorStop(1, `${baseColor}, 0.3)`);
        ctx.fillStyle = particleGradient;
        ctx.fill();
        ctx.restore();
        
        // Traînée subtile
        ctx.beginPath();
        const trailX = centerX + Math.cos(particle.angle + particle.offset - 0.1) * particleRadius;
        const trailY = centerY + Math.sin(particle.angle + particle.offset - 0.1) * particleRadius;
        ctx.moveTo(px, py);
        ctx.lineTo(trailX, trailY);
        ctx.strokeStyle = `${baseColor}, 0.2)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // 8. Barre de niveau circulaire avec gradient coloré
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

      // 9. Anneau pointillé externe qui réagit
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

      // 10. Effet de pulsation ambiante lors des pics audio
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