import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
  color: string;
  isActive: boolean;
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

      // 1. Fond Ultra-Propre (Pas de flou, pas de traînée)
      ctx.clearRect(0, 0, w, h);
      
      // Fond très sombre unifié
      ctx.fillStyle = '#050508'; // Noir technique (pas noir pur)
      ctx.fillRect(0, 0, w, h);
      
      // Vignette discrète
      const vignette = ctx.createRadialGradient(centerX, centerY, h * 0.3, centerX, centerY, h * 0.9);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.5)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);

      // 2. Analyse Audio (Lissée)
      let audioLevel = 0.05; // Niveau minimum
      if (analyserRef.current && currentIsActive) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        let sum = 0;
        // Moyenne sur tout le spectre
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
        const rawLevel = (sum / bufferLength) / 255;
        // Lissage pour éviter les sauts brusques
        audioLevel = Math.max(0.05, rawLevel);
      } else {
        // Respiration mécanique imperceptible
        const t = Date.now() / 3000;
        audioLevel = 0.05 + Math.sin(t) * 0.01;
      }

      // Vitesse de rotation dépendante de l'activité
      rotationOffset += 0.002 + (audioLevel * 0.02);

      const baseRadius = Math.min(w, h) / 8;
      
      // 3. Noyau Central (Solide, net)
      // Cercle principal
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      ctx.fillStyle = `${baseColor}, 0.1)`; // Fond transparent coloré
      ctx.fill();
      ctx.strokeStyle = `${baseColor}, 0.5)`; // Bordure fine
      ctx.lineWidth = 1;
      ctx.stroke();

      // Point central (L'œil)
      const eyeRadius = baseRadius * (0.3 + audioLevel * 0.2); // Réagit à la voix
      ctx.beginPath();
      ctx.arc(centerX, centerY, eyeRadius, 0, Math.PI * 2);
      ctx.fillStyle = `${baseColor}, 0.9)`; // Quasi opaque
      ctx.fill();

      // 4. Anneaux Techniques (HUD)
      // Anneau 1 : Rotation horaire lente
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotationOffset);
      
      const r1 = baseRadius * 1.4;
      ctx.beginPath();
      // Arc partiel (pas un cercle complet)
      ctx.arc(0, 0, r1, 0, Math.PI * 1.5); 
      ctx.strokeStyle = `${baseColor}, 0.3)`;
      ctx.lineWidth = 2; // Un peu plus épais
      ctx.stroke();
      ctx.restore();

      // Anneau 2 : Rotation anti-horaire rapide (Réagit aux pics audio)
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(-rotationOffset * 1.5);
      
      const r2 = baseRadius * 1.6 + (audioLevel * 20); // S'étend légèrement
      ctx.beginPath();
      ctx.arc(0, 0, r2, 0, Math.PI * 2);
      ctx.setLineDash([2, 10]); // Ligne pointillée technique
      ctx.strokeStyle = `${baseColor}, 0.4)`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // Anneau 3 : Indicateur de niveau (Arc dynamique)
      ctx.save();
      ctx.translate(centerX, centerY);
      // L'arc tourne lentement
      ctx.rotate(Math.PI / 2); 
      
      const r3 = baseRadius * 1.8;
      const arcLength = Math.PI * 2 * audioLevel; // La longueur de l'arc dépend du volume
      
      ctx.beginPath();
      ctx.arc(0, 0, r3, -arcLength/2, arcLength/2);
      ctx.strokeStyle = `${baseColor}, 0.8)`; // Très brillant
      ctx.lineWidth = 3;
      ctx.lineCap = 'round'; // Bords arrondis
      ctx.stroke();
      ctx.restore();

      // 5. Onde de choc subtile (Au lieu de cercles flous)
      if (audioLevel > 0.15) {
         const waveRadius = baseRadius * 2.5 * audioLevel;
         ctx.beginPath();
         ctx.arc(centerX, centerY, waveRadius, 0, Math.PI * 2);
         ctx.strokeStyle = `${baseColor}, ${0.3 - audioLevel * 0.5})`; // Disparait en s'éloignant
         ctx.lineWidth = 1;
         ctx.stroke();
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