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
  orbitRadius?: number;
  orbitAngle?: number;
  orbitSpeed?: number;
  distance?: number;
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
    const orbitParticleCount = 30; // Particules qui orbitent autour de la sphère
    
    // Calculer baseRadius pour les particules orbitales
    const baseRadiusForParticles = Math.min(canvas.width, canvas.height) / 7;

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

    // Particules orbitales autour de la sphère
    for (let i = 0; i < orbitParticleCount; i++) {
      const orbitRadius = baseRadiusForParticles + 80 + Math.random() * 200;
      const orbitAngle = (Math.PI * 2 / orbitParticleCount) * i;
      particles.push({
        x: 0, // Sera calculé dynamiquement
        y: 0, // Sera calculé dynamiquement
        size: Math.random() * 1.5 + 0.8,
        speedX: 0,
        speedY: 0,
        angle: 0,
        opacity: Math.random() * 0.4 + 0.2,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.03,
        orbitRadius: orbitRadius,
        orbitAngle: orbitAngle,
        orbitSpeed: (Math.random() * 0.01 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
        distance: orbitRadius
      });
    }

    // Variables pour la rotation 3D de la sphère
    let sphereRotationX = 0;
    let sphereRotationY = 0;
    let sphereRotationZ = 0;

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

      // Animation de rotation 3D de la sphère
      const time = Date.now() / 1000;
      sphereRotationX += 0.002;
      sphereRotationY += 0.003;
      sphereRotationZ += 0.0015;
      
      // Influence audio sur la rotation
      if (currentIsActive) {
        sphereRotationX += (midFreqAvg / 1000);
        sphereRotationY += (highFreqAvg / 1200);
      }

      // Outer Glow Layer (amélioré)
      const outerGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreRadius * 3);
      outerGlow.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${currentIsActive ? 0.25 : 0.15})`);
      outerGlow.addColorStop(0.3, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${currentIsActive ? 0.12 : 0.08})`);
      outerGlow.addColorStop(0.6, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05)`);
      outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = outerGlow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Sphère 3D avec effet de profondeur amélioré
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      // Calcul des points 3D pour la grille de la sphère
      const gridDetail = 20;
      const points3D: { x: number; y: number; z: number; brightness: number }[] = [];
      
      for (let lat = 0; lat <= gridDetail; lat++) {
        for (let lon = 0; lon <= gridDetail; lon++) {
          const theta = (lat / gridDetail) * Math.PI;
          const phi = (lon / gridDetail) * Math.PI * 2;
          
          // Rotation 3D
          let x = Math.sin(theta) * Math.cos(phi);
          let y = Math.cos(theta);
          let z = Math.sin(theta) * Math.sin(phi);
          
          // Rotation autour de X
          let y1 = y * Math.cos(sphereRotationX) - z * Math.sin(sphereRotationX);
          let z1 = y * Math.sin(sphereRotationX) + z * Math.cos(sphereRotationX);
          
          // Rotation autour de Y
          let x1 = x * Math.cos(sphereRotationY) + z1 * Math.sin(sphereRotationY);
          z = -x * Math.sin(sphereRotationY) + z1 * Math.cos(sphereRotationY);
          
          // Rotation autour de Z
          x = x1 * Math.cos(sphereRotationZ) - y1 * Math.sin(sphereRotationZ);
          y = x1 * Math.sin(sphereRotationZ) + y1 * Math.cos(sphereRotationZ);
          
          // Calcul de la luminosité basée sur la position Z (profondeur)
          const brightness = (z + 1) / 2; // Normaliser entre 0 et 1
          
          points3D.push({ x, y, z, brightness });
        }
      }

      // Dessiner la grille de la sphère
      ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`;
      ctx.lineWidth = 0.5;
      
      for (let lat = 0; lat < gridDetail; lat++) {
        ctx.beginPath();
        let first = true;
        for (let lon = 0; lon <= gridDetail; lon++) {
          const idx = lat * (gridDetail + 1) + lon;
          const point = points3D[idx];
          const screenX = centerX + point.x * coreRadius;
          const screenY = centerY + point.y * coreRadius;
          
          if (first) {
            ctx.moveTo(screenX, screenY);
            first = false;
          } else {
            ctx.lineTo(screenX, screenY);
          }
        }
        ctx.stroke();
      }
      
      for (let lon = 0; lon < gridDetail; lon++) {
        ctx.beginPath();
        let first = true;
        for (let lat = 0; lat <= gridDetail; lat++) {
          const idx = lat * (gridDetail + 1) + lon;
          const point = points3D[idx];
          const screenX = centerX + point.x * coreRadius;
          const screenY = centerY + point.y * coreRadius;
          
          if (first) {
            ctx.moveTo(screenX, screenY);
            first = false;
          } else {
            ctx.lineTo(screenX, screenY);
          }
        }
        ctx.stroke();
      }

      // Points lumineux sur la sphère
      for (let i = 0; i < points3D.length; i += 2) {
        const point = points3D[i];
        if (point.z > -0.3) { // Seulement les points visibles
          const screenX = centerX + point.x * coreRadius;
          const screenY = centerY + point.y * coreRadius;
          const pointBrightness = point.brightness * 0.8 + 0.2;
          
          const pointGlow = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, 3);
          pointGlow.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${pointBrightness * 0.6})`);
          pointGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          
          ctx.fillStyle = pointGlow;
          ctx.beginPath();
          ctx.arc(screenX, screenY, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Main Core Gradient (Premium look avec effet 3D)
      const coreGradient = ctx.createRadialGradient(
        centerX, centerY, coreRadius * 0.1,
        centerX, centerY, coreRadius * 1.2
      );
      coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      coreGradient.addColorStop(0.15, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.9)`);
      coreGradient.addColorStop(0.4, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`);
      coreGradient.addColorStop(0.7, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`);
      coreGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
      ctx.fill();

      // Highlight (reflet lumineux) pour effet 3D
      const highlightOffset = coreRadius * 0.3;
      const highlightX = centerX - highlightOffset * Math.cos(sphereRotationY);
      const highlightY = centerY - highlightOffset * Math.sin(sphereRotationX);
      const highlightGradient = ctx.createRadialGradient(
        highlightX, highlightY, 0,
        highlightX, highlightY, coreRadius * 0.4
      );
      highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
      highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = highlightGradient;
      ctx.beginPath();
      ctx.arc(highlightX, highlightY, coreRadius * 0.4, 0, Math.PI * 2);
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
        
        // Gérer les particules orbitales
        if (p.orbitRadius !== undefined && p.orbitAngle !== undefined && p.orbitSpeed !== undefined) {
          p.orbitAngle += p.orbitSpeed * audioInfluence;
          const baseOrbitRadius = p.orbitRadius;
          const dynamicRadius = baseOrbitRadius + (midFreqAvg * 0.5);
          p.x = centerX + Math.cos(p.orbitAngle) * dynamicRadius;
          p.y = centerY + Math.sin(p.orbitAngle) * dynamicRadius;
          p.distance = dynamicRadius;
        } else {
          // Particules libres
          p.x += p.speedX * audioInfluence;
          p.y += p.speedY * audioInfluence;
          
          // Elegant screen wrap
          if (p.x < -50) p.x = canvas.width + 50;
          if (p.x > canvas.width + 50) p.x = -50;
          if (p.y < -50) p.y = canvas.height + 50;
          if (p.y > canvas.height + 50) p.y = -50;
        }
        
        p.rotation += p.rotationSpeed;

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

        // Particules orbitales plus brillantes
        const isOrbital = p.orbitRadius !== undefined;
        const particleOpacity = isOrbital ? p.opacity * 1.2 : p.opacity;
        const particleSize = isOrbital ? p.size * 1.3 : p.size;

        // Particle with enhanced glow
        const particleGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, particleSize * 4);
        particleGlow.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${particleOpacity * (isOrbital ? 0.8 : 0.6)})`);
        particleGlow.addColorStop(0.4, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${particleOpacity * 0.4})`);
        particleGlow.addColorStop(0.7, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${particleOpacity * 0.15})`);
        particleGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = particleGlow;
        ctx.beginPath();
        ctx.arc(0, 0, particleSize * 4, 0, Math.PI * 2);
        ctx.fill();

        // Core particle avec effet amélioré
        const coreParticleGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, particleSize * 1.5);
        coreParticleGlow.addColorStop(0, `rgba(255, 255, 255, ${particleOpacity * 0.95})`);
        coreParticleGlow.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${particleOpacity * 0.7})`);
        coreParticleGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = coreParticleGlow;
        ctx.beginPath();
        ctx.arc(0, 0, particleSize * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Core particle
        ctx.fillStyle = `rgba(255, 255, 255, ${particleOpacity * 0.9})`;
        ctx.beginPath();
        ctx.arc(0, 0, particleSize, 0, Math.PI * 2);
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