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

    const ctx = canvas.getContext('2d', { 
      alpha: true,
      desynchronized: true, // Optimisation pour meilleure performance
      willReadFrequently: false
    });
    if (!ctx) return;
    
    // Optimisations du contexte
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Système de frame skipping pour maintenir 60fps
    let lastFrameTime = performance.now();
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    // Premium Particles System - Simplifié
    let particles: Particle[] = [];
    const particleCount = 40; // Réduit pour simplification
    const orbitParticleCount = 8; // Réduit pour simplification
    
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

    // Cache pour éviter les recalculs
    let lastTime = 0;
    let cachedSin = 0;
    let cachedCos = 0;
    let frameCount = 0;
    
    const draw = () => {
      if (!ctx || !canvas) return;

      // Frame skipping pour maintenir 60fps
      const now = performance.now();
      const elapsed = now - lastFrameTime;
      if (elapsed < frameInterval) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }
      lastFrameTime = now - (elapsed % frameInterval);

      const currentColor = colorRef.current;
      const currentIsActive = isActiveRef.current;
      const rgb = hexToRgb(currentColor);
      const time = Date.now() / 1000;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Optimisation: calculer les valeurs sin/cos une seule fois par frame
      frameCount++;
      if (frameCount % 2 === 0 || Math.abs(time - lastTime) > 0.016) { // ~60fps
        cachedSin = Math.sin(time * 0.3);
        cachedCos = Math.cos(time * 0.2);
        lastTime = time;
      }

      // Enhanced fade trail with gradient
      const fadeGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      fadeGradient.addColorStop(0, `rgba(0, 0, 0, ${currentIsActive ? 0.12 : 0.08})`);
      fadeGradient.addColorStop(0.5, `rgba(0, 0, 0, ${currentIsActive ? 0.10 : 0.06})`);
      fadeGradient.addColorStop(1, `rgba(0, 0, 0, ${currentIsActive ? 0.08 : 0.04})`);
      ctx.fillStyle = fadeGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Animated background gradient overlay - Utilise les valeurs mises en cache
      const bgGradient = ctx.createRadialGradient(
        centerX + cachedSin * 100,
        centerY + cachedCos * 100,
        0,
        centerX, centerY, Math.max(canvas.width, canvas.height) * 0.8
      );
      bgGradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${currentIsActive ? 0.08 : 0.03})`);
      bgGradient.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${currentIsActive ? 0.04 : 0.015})`);
      bgGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bgGradient;
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

      const baseRadius = Math.min(canvas.width, canvas.height) / 7;

      // Multi-layered Core with Depth
      const coreRadius = baseRadius + (lowFreqAvg * 1.2);

      // Animation de rotation 3D de la sphère
      sphereRotationX += 0.002;
      sphereRotationY += 0.003;
      sphereRotationZ += 0.0015;
      
      // Influence audio sur la rotation
      if (currentIsActive) {
        sphereRotationX += (midFreqAvg / 1000);
        sphereRotationY += (highFreqAvg / 1200);
      }

      // Multi-layered Outer Glow with pulse effect
      const glowIntensity = currentIsActive ? 1 + Math.sin(time * 2) * 0.2 : 1;
      const glowRadius = coreRadius * (3 + Math.sin(time * 0.5) * 0.5);
      
      // Primary glow layer
      const outerGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);
      outerGlow.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(currentIsActive ? 0.3 : 0.18) * glowIntensity})`);
      outerGlow.addColorStop(0.2, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(currentIsActive ? 0.2 : 0.12) * glowIntensity})`);
      outerGlow.addColorStop(0.4, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(currentIsActive ? 0.12 : 0.08) * glowIntensity})`);
      outerGlow.addColorStop(0.6, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05)`);
      outerGlow.addColorStop(0.8, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.02)`);
      outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = outerGlow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      

      // Sphère 3D avec effet de profondeur amélioré
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      // Calcul des points 3D pour la grille de la sphère - Simplifié
      const gridDetail = 6; // Réduit pour simplification
      const points3D: { x: number; y: number; z: number; brightness: number }[] = [];
      
      // Pré-calculer les valeurs trigonométriques pour la rotation (optimisation majeure)
      const cosX = Math.cos(sphereRotationX);
      const sinX = Math.sin(sphereRotationX);
      const cosY = Math.cos(sphereRotationY);
      const sinY = Math.sin(sphereRotationY);
      const cosZ = Math.cos(sphereRotationZ);
      const sinZ = Math.sin(sphereRotationZ);
      
      for (let lat = 0; lat <= gridDetail; lat++) {
        for (let lon = 0; lon <= gridDetail; lon++) {
          const theta = (lat / gridDetail) * Math.PI;
          const phi = (lon / gridDetail) * Math.PI * 2;
          
          // Rotation 3D - valeurs trigonométriques pré-calculées
          let x = Math.sin(theta) * Math.cos(phi);
          let y = Math.cos(theta);
          let z = Math.sin(theta) * Math.sin(phi);
          
          // Rotation autour de X (optimisé avec valeurs pré-calculées)
          let y1 = y * cosX - z * sinX;
          let z1 = y * sinX + z * cosX;
          
          // Rotation autour de Y
          let x1 = x * cosY + z1 * sinY;
          z = -x * sinY + z1 * cosY;
          
          // Rotation autour de Z
          x = x1 * cosZ - y1 * sinZ;
          y = x1 * sinZ + y1 * cosZ;
          
          // Calcul de la luminosité basée sur la position Z (profondeur)
          const brightness = (z + 1) * 0.5; // Normaliser entre 0 et 1 (optimisé: *0.5 au lieu de /2)
          
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

      // Enhanced points lumineux - Optimisé (moins de points, shadow réduit)
      const pointSizeMultiplier = currentIsActive ? 1 + (frequencyAvg / 80) : 1;
      // Filtrer les points visibles une seule fois pour éviter les recalculs
      const visiblePoints = points3D.filter(p => p.z > -0.3);
      for (let i = 0; i < visiblePoints.length; i += 2) { // Augmenté de 3 à 2 pour meilleur rendu mais optimisé
        const point = visiblePoints[i];
        const screenX = centerX + point.x * coreRadius;
        const screenY = centerY + point.y * coreRadius;
        const pointBrightness = point.brightness * 0.8 + 0.2;
        const dynamicSize = (2 + pointBrightness) * pointSizeMultiplier;
        
        // Optimisé: gradient simplifié avec moins de color stops
        const pointGlow = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, dynamicSize * 2);
        pointGlow.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${pointBrightness * 0.7})`);
        pointGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.save();
        // Shadow seulement pour les points les plus brillants (réduit)
        if (pointBrightness > 0.7) {
          ctx.shadowBlur = 4;
          ctx.shadowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${pointBrightness * 0.3})`;
        }
        ctx.fillStyle = pointGlow;
        ctx.beginPath();
        ctx.arc(screenX, screenY, dynamicSize * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Core point
        ctx.fillStyle = `rgba(255, 255, 255, ${pointBrightness * 0.9})`;
        ctx.beginPath();
        ctx.arc(screenX, screenY, dynamicSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Enhanced Main Core Gradient with pulse effect
      const corePulse = currentIsActive ? 1 + Math.sin(time * 1.5) * 0.15 : 1;
      const dynamicCoreRadius = coreRadius * corePulse;
      
      const coreGradient = ctx.createRadialGradient(
        centerX, centerY, dynamicCoreRadius * 0.1,
        centerX, centerY, dynamicCoreRadius * 1.3
      );
      coreGradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
      coreGradient.addColorStop(0.1, `rgba(255, 255, 255, 0.98)`);
      coreGradient.addColorStop(0.2, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.95)`);
      coreGradient.addColorStop(0.4, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.7)`);
      coreGradient.addColorStop(0.6, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`);
      coreGradient.addColorStop(0.8, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`);
      coreGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.save();
      // Shadow réduit pour meilleure performance
      ctx.shadowBlur = 20;
      ctx.shadowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`;
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, dynamicCoreRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      

      ctx.restore();

      // Enhanced Geometric Rings - Simplifié
      const ringCount = 2; // Réduit pour simplification
      // Pré-calculer les valeurs sin/cos pour les anneaux
      const sinTime = Math.sin(time * 0.3);
      const sinTime2 = Math.sin(time * 2);
      
      for (let r = 0; r < ringCount; r++) {
        const ringRadius = coreRadius + (r * 35) + (midFreqAvg * 0.8) + sinTime * 5;
        const lineWidth = 2 - (r * 0.25);
        const baseOpacity = 0.7 - (r * 0.12);
        const pulseOpacity = currentIsActive ? baseOpacity + sinTime2 * 0.15 : baseOpacity;

        // Main ring with wave distortion - Optimisé (shadow réduit)
        ctx.save();
        ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${pulseOpacity})`;
        ctx.lineWidth = lineWidth;
        // Shadow réduit pour meilleure performance (seulement pour le premier anneau)
        if (r < 1) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${pulseOpacity * 0.4})`;
        }
        ctx.beginPath();

        // Optimisé: moins de points pour meilleure performance (4 degrés au lieu de 3)
        for (let i = 0; i <= 360; i += 4) {
          const angle = (i * Math.PI) / 180;
          // Pré-calculer cos/sin de l'angle
          const cosAngle = Math.cos(angle);
          const sinAngle = Math.sin(angle);
          
          const waveOffset = currentIsActive 
            ? Math.sin(i * 0.08 + time * 2 + r * 0.5) * (midFreqAvg * 0.4) + 
              Math.sin(i * 0.15 + time * 3) * (highFreqAvg * 0.2)
            : Math.sin(i * 0.05 + time + r * 0.3) * 4;
          
          const radius = ringRadius + waveOffset;
          const x = centerX + cosAngle * radius;
          const y = centerY + sinAngle * radius;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
        
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


        // Draw sophisticated particles
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        // Particules orbitales plus brillantes
        const isOrbital = p.orbitRadius !== undefined;
        const particleOpacity = isOrbital ? p.opacity * 1.2 : p.opacity;
        const particleSize = isOrbital ? p.size * 1.3 : p.size;

        // Particule simplifiée
        const pulseEffect = currentIsActive ? 1 + Math.sin(time * 3 + p.rotation) * 0.1 : 1;
        const dynamicSize = particleSize * (1.5 + (currentIsActive ? frequencyAvg / 100 : 0)) * pulseEffect;
        
        const particleGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, dynamicSize * 2);
        particleGlow.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${particleOpacity * 0.6})`);
        particleGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = particleGlow;
        ctx.beginPath();
        ctx.arc(0, 0, dynamicSize * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Core particle
        ctx.fillStyle = `rgba(255, 255, 255, ${particleOpacity * 0.8})`;
        ctx.beginPath();
        ctx.arc(0, 0, dynamicSize, 0, Math.PI * 2);
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