import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
  color: string;
  isActive: boolean;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  angle: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
}

const Visualizer: React.FC<VisualizerProps> = ({ analyserRef, color, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  
  const colorRef = useRef(color);
  const isActiveRef = useRef(isActive);

  useEffect(() => {
    colorRef.current = color;
  }, [color]);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    // Premium Particles System
    let particles: Particle[] = [];
    const particleCount = 200;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2.5 + 0.5,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        angle: Math.random() * Math.PI * 2,
        opacity: Math.random() * 0.5 + 0.3,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02
      });
    }

    // Helper: Parse hex color to RGB
    const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 99, g: 102, b: 241 };
    };

    const draw = () => {
      if (!ctx || !canvas) return;

      const currentColor = colorRef.current;
      const currentIsActive = isActiveRef.current;
      const rgb = hexToRgb(currentColor);

      // Ultra-smooth fade trail
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let frequencyAvg = 0;
      let lowFreqAvg = 0;
      let midFreqAvg = 0;
      let highFreqAvg = 0;

      if (analyserRef.current && currentIsActive) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Sophisticated frequency analysis
        let sum = 0;
        let lowSum = 0;
        let midSum = 0;
        let highSum = 0;

        const third = Math.floor(bufferLength / 3);
        
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
          if (i < third) lowSum += dataArray[i];
          else if (i < third * 2) midSum += dataArray[i];
          else highSum += dataArray[i];
        }

        frequencyAvg = sum / bufferLength;
        lowFreqAvg = lowSum / third;
        midFreqAvg = midSum / third;
        highFreqAvg = highSum / third;
      } else {
        // Elegant idle breathing
        const time = Date.now() / 1000;
        frequencyAvg = 12 + Math.sin(time * 0.5) * 8;
        lowFreqAvg = 10 + Math.sin(time * 0.3) * 5;
        midFreqAvg = 10 + Math.sin(time * 0.4) * 5;
        highFreqAvg = 10 + Math.sin(time * 0.6) * 5;
      }

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseRadius = Math.min(canvas.width, canvas.height) / 7;

      // Multi-layered Core with Depth
      const coreRadius = baseRadius + (lowFreqAvg * 1.2);

      // Outer Glow Layer
      const outerGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreRadius * 2.5);
      outerGlow.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`);
      outerGlow.addColorStop(0.3, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08)`);
      outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = outerGlow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Main Core Gradient (Premium look)
      const coreGradient = ctx.createRadialGradient(
        centerX, centerY, coreRadius * 0.1,
        centerX, centerY, coreRadius
      );
      coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      coreGradient.addColorStop(0.2, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`);
      coreGradient.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`);
      coreGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Geometric Rings (Futuristic)
      const ringCount = 3;
      for (let r = 0; r < ringCount; r++) {
        const ringRadius = coreRadius + (r * 40) + (midFreqAvg * 0.8);
        const lineWidth = 1.5 - (r * 0.3);
        const opacity = 0.6 - (r * 0.15);

        ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();

        for (let i = 0; i <= 360; i += 3) {
          const angle = (i * Math.PI) / 180;
          const waveOffset = currentIsActive 
            ? Math.sin(i * 0.05 + Date.now() / 500) * (midFreqAvg * 0.3)
            : Math.sin(i * 0.05 + Date.now() / 1000) * 3;
          
          const radius = ringRadius + waveOffset;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      }

      // Premium Particles
      particles.forEach((p, index) => {
        const audioInfluence = currentIsActive ? (1 + frequencyAvg / 50) : 1;
        
        p.x += p.speedX * audioInfluence;
        p.y += p.speedY * audioInfluence;
        p.rotation += p.rotationSpeed;

        // Elegant screen wrap
        if (p.x < -50) p.x = canvas.width + 50;
        if (p.x > canvas.width + 50) p.x = -50;
        if (p.y < -50) p.y = canvas.height + 50;
        if (p.y > canvas.height + 50) p.y = -50;

        const dist = Math.hypot(p.x - centerX, p.y - centerY);
        const maxConnectionDist = coreRadius + 150;

        // Draw elegant connection lines
        if (dist < maxConnectionDist) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(centerX, centerY);
          
          const connectionOpacity = (1 - dist / maxConnectionDist) * p.opacity * 0.4;
          ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${connectionOpacity})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }

        // Connect nearby particles (network effect)
        for (let j = index + 1; j < particles.length; j++) {
          const other = particles[j];
          const particleDist = Math.hypot(p.x - other.x, p.y - other.y);
          
          if (particleDist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(other.x, other.y);
            
            const lineOpacity = (1 - particleDist / 120) * 0.15;
            ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${lineOpacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }

        // Draw sophisticated particles
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        // Particle with glow
        const particleGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 3);
        particleGlow.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${p.opacity})`);
        particleGlow.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${p.opacity * 0.3})`);
        particleGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = particleGlow;
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 3, 0, Math.PI * 2);
        ctx.fill();

        // Core particle
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.8})`;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(draw);
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
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default Visualizer;