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
    const lastMouseMoveAtRef = { current: Date.now() };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      lastMouseMoveAtRef.current = Date.now();
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
    let currentLookLeftX = 0;
    let currentLookLeftY = 0;
    let currentLookRightX = 0;
    let currentLookRightY = 0;

    // Variables pour le clignement des yeux (Blink)
    let nextBlinkTime = Date.now() + Math.random() * 2000 + 2000;
    let isBlinking = false;
    let eyeOpenAmount = 1; // 1 = ouvert, 0 = fermé
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

      // Calcul du regard (Gaze Calculation) - 2 yeux (Synchronisé / Parallèle)
      const maxGazeDistance = baseRadius * 0.6; // Rayon max de mouvement de l'iris
      const mouseIdleMs = 2500;
      const shouldAutoScan =
        !isEyeTrackingEnabledRef.current || (Date.now() - lastMouseMoveAtRef.current > mouseIdleMs);

      const interOcular = baseRadius * 3.2; // distance entre les 2 yeux
      const leftEyeCenterX = centerX - interOcular / 2;
      const rightEyeCenterX = centerX + interOcular / 2;
      const eyeCenterY = centerY;

      // Calculer un vecteur unique depuis le CENTRE de l'écran (et non depuis chaque œil)
      // pour que les yeux regardent en parallèle (sans loucher)
      let targetCommonX = 0;
      let targetCommonY = 0;

      if (!shouldAutoScan) {
        // Vecteur depuis le centre global
        const dx = mouseRef.current.x - centerX;
        const dy = mouseRef.current.y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        targetCommonX = dx;
        targetCommonY = dy;

        // Limiter la distance max
        if (dist > maxGazeDistance) {
          const angle = Math.atan2(dy, dx);
          targetCommonX = Math.cos(angle) * maxGazeDistance;
          targetCommonY = Math.sin(angle) * maxGazeDistance;
        }
      } else {
        // Auto-scan (droite ↔ gauche)
        const t = Date.now() / 1000;
        const scanAmpX = maxGazeDistance * 0.85;
        targetCommonX =
          Math.sin(t * 0.75) * scanAmpX + // balayage principal
          Math.sin(t * 2.1) * scanAmpX * 0.06; // micro-variation subtile
        targetCommonY =
          Math.sin(t * 0.35) * maxGazeDistance * 0.12; // léger vertical
      }

      // Lissage du mouvement (Lerp) unique
      // On utilise currentLookLeftX/Y comme "currentLookCommon" pour simplifier ou on synchronise tout
      // Ici on applique la même cible aux deux
      const lerpFactor = 0.1;
      
      // Mise à jour identique pour les deux yeux (sauf s'ils avaient divergé avant, ils vont converger vers la même valeur)
      currentLookLeftX += (targetCommonX - currentLookLeftX) * lerpFactor;
      currentLookLeftY += (targetCommonY - currentLookLeftY) * lerpFactor;
      
      // On force la synchro parfaite droite = gauche
      currentLookRightX = currentLookLeftX;
      currentLookRightY = currentLookLeftY;

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

      // 3.5 Détails du Visage (Structure, Nez, Sourcils)
      const drawFaceDetails = () => {
        if (!ctx) return;
        ctx.save();
        
        // Les sourcils réagissent légèrement à l'intensité audio
        const browOffset = audioLevel * baseRadius * 0.2;
        const browY = eyeCenterY - baseRadius * 1.4 - browOffset;
        const browW = baseRadius * 1.6;
        const noseTopY = eyeCenterY - baseRadius * 0.2;
        const noseTipY = eyeCenterY + baseRadius * 1.0;
        
        ctx.lineCap = 'round';

        // 1. Sourcils (Eyebrows) - Expressifs
        ctx.strokeStyle = `${baseColor}, 0.7)`;
        ctx.lineWidth = 3;

        // Sourcil Gauche
        ctx.beginPath();
        ctx.moveTo(leftEyeCenterX - browW * 0.6, browY + baseRadius * 0.3); // Extérieur
        ctx.lineTo(leftEyeCenterX - browW * 0.1, browY); // Intérieur (Arche)
        ctx.lineTo(leftEyeCenterX + browW * 0.4, browY + baseRadius * 0.15); // Vers le nez
        ctx.stroke();

        // Sourcil Droit
        ctx.beginPath();
        ctx.moveTo(rightEyeCenterX + browW * 0.6, browY + baseRadius * 0.3); // Extérieur
        ctx.lineTo(rightEyeCenterX + browW * 0.1, browY); // Intérieur (Arche)
        ctx.lineTo(rightEyeCenterX - browW * 0.4, browY + baseRadius * 0.15); // Vers le nez
        ctx.stroke();

        // 2. Nez (Nose) - Style Cyber Tech
        ctx.strokeStyle = `${baseColor}, 0.5)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        // Arête du nez (lignes verticales brisées)
        const noseBridgeW = baseRadius * 0.3;
        ctx.moveTo(centerX - noseBridgeW, noseTopY);
        ctx.lineTo(centerX - noseBridgeW * 0.6, noseTipY - baseRadius * 0.4);
        ctx.lineTo(centerX - noseBridgeW * 0.8, noseTipY);
        
        ctx.moveTo(centerX + noseBridgeW, noseTopY);
        ctx.lineTo(centerX + noseBridgeW * 0.6, noseTipY - baseRadius * 0.4);
        ctx.lineTo(centerX + noseBridgeW * 0.8, noseTipY);
        
        // Bout du nez (petit triangle ou ligne)
        ctx.moveTo(centerX - noseBridgeW * 0.5, noseTipY + baseRadius * 0.1);
        ctx.lineTo(centerX, noseTipY + baseRadius * 0.25);
        ctx.lineTo(centerX + noseBridgeW * 0.5, noseTipY + baseRadius * 0.1);
        ctx.stroke();

        // 3. Contour du Visage (Jawline/Face Shape) - Subtil
        ctx.strokeStyle = `${baseColor}, 0.25)`;
        ctx.lineWidth = 1.5;
        const faceW = baseRadius * 4.0; // Largeur du visage
        const chinY = centerY + baseRadius * 3.5; // Menton bas
        const jawY = centerY + baseRadius * 1.2; // Hauteur mâchoire

        ctx.beginPath();
        // Côté Gauche
        ctx.moveTo(centerX - faceW, centerY - baseRadius * 1.5); // Temple haut
        ctx.lineTo(centerX - faceW * 0.9, jawY); // Angle mâchoire
        ctx.lineTo(centerX - baseRadius * 0.8, chinY); // Vers le menton
        
        // Côté Droit
        ctx.moveTo(centerX + faceW, centerY - baseRadius * 1.5); // Temple haut
        ctx.lineTo(centerX + faceW * 0.9, jawY); // Angle mâchoire
        ctx.lineTo(centerX + baseRadius * 0.8, chinY); // Vers le menton

        ctx.stroke();

        // 4. Marques Tech sur les Joues (Cyber Cheeks)
        const cheekY = eyeCenterY + baseRadius * 0.8;
        const cheekW = baseRadius * 0.5;
        const cheekH = baseRadius * 0.2;
        
        ctx.lineWidth = 1;
        ctx.strokeStyle = `${baseColor}, 0.3)`;
        
        // Joue Gauche (Circuit simple)
        ctx.beginPath();
        ctx.moveTo(leftEyeCenterX - cheekW, cheekY);
        ctx.lineTo(leftEyeCenterX - cheekW * 0.5, cheekY + cheekH);
        ctx.lineTo(leftEyeCenterX + cheekW * 0.2, cheekY + cheekH);
        ctx.stroke();
        
        // Petite LED Joue Gauche
        ctx.fillStyle = `${baseColor}, ${0.4 + audioLevel})`;
        ctx.beginPath();
        ctx.arc(leftEyeCenterX - cheekW, cheekY, 2, 0, Math.PI * 2);
        ctx.fill();

        // Joue Droite (Symétrique)
        ctx.beginPath();
        ctx.moveTo(rightEyeCenterX + cheekW, cheekY);
        ctx.lineTo(rightEyeCenterX + cheekW * 0.5, cheekY + cheekH);
        ctx.lineTo(rightEyeCenterX - cheekW * 0.2, cheekY + cheekH);
        ctx.stroke();
        
         // Petite LED Joue Droite
        ctx.fillStyle = `${baseColor}, ${0.4 + audioLevel})`;
        ctx.beginPath();
        ctx.arc(rightEyeCenterX + cheekW, cheekY, 2, 0, Math.PI * 2);
        ctx.fill();

        // 5. Capteur Frontal (Mind's Eye / Forehead Sensor)
        const foreheadY = eyeCenterY - baseRadius * 0.6;
        ctx.beginPath();
        ctx.moveTo(centerX - baseRadius * 0.1, foreheadY);
        ctx.lineTo(centerX, foreheadY - baseRadius * 0.15); // Pointe haut
        ctx.lineTo(centerX + baseRadius * 0.1, foreheadY);
        ctx.lineTo(centerX, foreheadY + baseRadius * 0.15); // Pointe bas
        ctx.closePath();
        
        ctx.strokeStyle = `${baseColor}, 0.6)`;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Glow central front
        if (audioLevel > 0.1) {
            ctx.fillStyle = `${baseColor}, ${audioLevel * 0.5})`;
            ctx.fill();
        }

        // 6. Lignes de Connexion (Wireframe feel)
        ctx.strokeStyle = `${baseColor}, 0.1)`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        
        // Lignes Yeux -> Nez
        ctx.moveTo(leftEyeCenterX + baseRadius * 0.5, eyeCenterY + baseRadius * 0.2);
        ctx.lineTo(centerX - noseBridgeW, noseTopY);
        
        ctx.moveTo(rightEyeCenterX - baseRadius * 0.5, eyeCenterY + baseRadius * 0.2);
        ctx.lineTo(centerX + noseBridgeW, noseTopY);

        // Lignes Nez -> Bouche (Philtrum tech)
        const mouthTopY = centerY + baseRadius * 1.8 - (baseRadius * 0.4); // Approx haut bouche
        ctx.moveTo(centerX, noseTipY + baseRadius * 0.25);
        ctx.lineTo(centerX, mouthTopY);

        ctx.stroke();

        ctx.restore();
      };
      
      drawFaceDetails();

      const drawEye = (
        eyeCx: number,
        eyeCy: number,
        lookX: number,
        lookY: number
      ) => {
        // Appliquer l'effet de clignement à cet œil
        ctx.save();
        ctx.translate(eyeCx, eyeCy);
        ctx.scale(1, eyeOpenAmount);
        ctx.translate(-eyeCx, -eyeCy);

        // Noyau 3D (Fond de l'œil) - Parallaxe légère
        const coreX = eyeCx + lookX * 0.15;
        const coreY = eyeCy + lookY * 0.15;

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

        // Œil (Iris + Pupille) - Suit le regard
        const eyeRadius = baseRadius * (0.55 + audioLevel * 0.3) * pulsation;

        // Position de l'iris (Suit le regard)
        const irisX = eyeCx + lookX;
        const irisY = eyeCy + lookY;

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
        irisGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        irisGradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.7)');
        irisGradient.addColorStop(0.9, 'rgba(255, 255, 255, 0.9)'); // Anneau limbal
        irisGradient.addColorStop(1, 'rgba(0,0,0,0.5)'); // Bord net

        ctx.save();
        ctx.beginPath();
        ctx.arc(irisX, irisY, irisRadius, 0, Math.PI * 2);
        ctx.fillStyle = irisGradient;
        ctx.fill();

        // Détails dans l'iris (lignes radiales simples)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 12; i++) {
          const angle = (Math.PI * 2 * i) / 12 + rotationOffset;
          ctx.beginPath();
          ctx.moveTo(
            irisX + Math.cos(angle) * irisRadius * 0.3,
            irisY + Math.sin(angle) * irisRadius * 0.3
          );
          ctx.lineTo(
            irisX + Math.cos(angle) * irisRadius * 0.8,
            irisY + Math.sin(angle) * irisRadius * 0.8
          );
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

        // Reflet (Specular highlight)
        const glintOffsetFactor = 0.2;
        const glintX = irisX - lookX * glintOffsetFactor;
        const glintY = irisY - lookY * glintOffsetFactor;

        ctx.beginPath();
        ctx.arc(
          glintX - pupilRadius * 0.4,
          glintY - pupilRadius * 0.4,
          pupilRadius * 0.25,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.shadowBlur = 5;
        ctx.shadowColor = 'white';
        ctx.fill();

        // Second petit reflet
        ctx.beginPath();
        ctx.arc(
          glintX + pupilRadius * 0.3,
          glintY + pupilRadius * 0.3,
          pupilRadius * 0.1,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();

        ctx.restore(); // fin clignement œil
      };

      // 4-5. Deux yeux (gauche + droite)
      drawEye(leftEyeCenterX, eyeCenterY, currentLookLeftX, currentLookLeftY);
      drawEye(rightEyeCenterX, eyeCenterY, currentLookRightX, currentLookRightY);

      const drawOrbitsForEye = (eyeCx: number, eyeCy: number, rotationPhase: number) => {
        // 6. Anneaux orbitaux doubles avec effets néon (centrés sur chaque œil)
        ctx.setLineDash([]);

        // Légère réduction pour éviter que les anneaux se chevauchent entre les 2 yeux
        const orbitScale = 0.92;

        // Anneau orbital 1 (externe) avec glow
        ctx.save();
        ctx.translate(eyeCx, eyeCy);
        ctx.rotate(rotationOffset + rotationPhase);

        const orbit1Radius = baseRadius * 1.7 * pulsation * orbitScale;
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
        ctx.translate(eyeCx, eyeCy);
        ctx.rotate(-rotationOffset * 1.8 + rotationPhase * 0.7);

        const orbit2Radius = baseRadius * 1.4 * pulsation * orbitScale;
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

        // 7. Barre de niveau circulaire avec gradient coloré (autour de chaque œil)
        ctx.save();
        ctx.translate(eyeCx, eyeCy);
        ctx.rotate(-Math.PI / 2);

        const levelRadius = baseRadius * 2.1 * pulsation * orbitScale;
        const levelArcLength = Math.PI * 2 * Math.min(audioLevel * 2, 1);

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
        ctx.translate(eyeCx, eyeCy);
        ctx.rotate(-rotationOffset * 0.5 + rotationPhase * 0.4);

        const dottedRadius = baseRadius * (2.3 + audioLevel * 0.3) * pulsation * orbitScale;
        ctx.setLineDash([3, 15]);
        ctx.beginPath();
        ctx.arc(0, 0, dottedRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `${baseColor}, 0.4)`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      };

      // Orbits sur chaque œil (phase identique pour synchro parfaite)
      drawOrbitsForEye(leftEyeCenterX, eyeCenterY, 0);
      drawOrbitsForEye(rightEyeCenterX, eyeCenterY, 0);

      // 10. Bouche Audio (Digital Mouth) - Version Améliorée
      ctx.save();
      const mouthY = centerY + baseRadius * 1.8;
      ctx.translate(centerX, mouthY);

      // Calcul de l'ouverture avec un seuil et une sensibilité ajustée
      const mouthSignal = Math.max(0, audioLevel - 0.02);
      // Lissage exponentiel pour une réactivité plus organique
      const mouthOpenness = Math.pow(Math.min(mouthSignal * 4, 1.2), 1.2); 
      const mouthWidth = baseRadius * 1.6;
      const mouthHeightMax = baseRadius * 0.8;

      // Couleur dynamique : devient plus blanche/brillante quand c'est fort
      const mouthGlowIntensity = 0.5 + mouthOpenness * 0.5;
      
      ctx.shadowBlur = 15 + mouthOpenness * 25;
      ctx.shadowColor = `${baseColor}, ${mouthGlowIntensity})`;
      ctx.lineWidth = 2 + mouthOpenness * 1;
      ctx.strokeStyle = `${baseColor}, ${0.7 + mouthOpenness * 0.3})`;
      
      // Fond de la bouche (sombre mais avec une teinte)
      ctx.fillStyle = `rgba(0, 0, 0, 0.6)`;

      ctx.beginPath();
      // Point gauche (coin)
      ctx.moveTo(-mouthWidth / 2, 0);
      
      // Lèvre supérieure : courbe complexe (style "arc de cupidon" technologique)
      ctx.bezierCurveTo(
        -mouthWidth / 4, -mouthOpenness * mouthHeightMax * 0.6, 
         mouthWidth / 4, -mouthOpenness * mouthHeightMax * 0.6, 
         mouthWidth / 2, 0
      );

      // Lèvre inférieure : courbe plus arrondie
      ctx.bezierCurveTo(
         mouthWidth / 3, mouthOpenness * mouthHeightMax, 
        -mouthWidth / 3, mouthOpenness * mouthHeightMax, 
        -mouthWidth / 2, 0
      );
      
      ctx.fill(); // Fond noir/teinté pour masquer ce qu'il y a derrière
      ctx.stroke(); // Contour néon

      // --- Détails Tech ---
      
      // 1. Coins de bouche (petits marqueurs verticaux)
      ctx.beginPath();
      const cornerSize = mouthWidth * 0.05;
      // Coin gauche
      ctx.moveTo(-mouthWidth / 2, -cornerSize);
      ctx.lineTo(-mouthWidth / 2, cornerSize);
      // Coin droit
      ctx.moveTo(mouthWidth / 2, -cornerSize);
      ctx.lineTo(mouthWidth / 2, cornerSize);
      ctx.lineWidth = 2;
      ctx.stroke();

      // 2. Onde vocale interne (visualiseur dans la bouche)
      if (mouthOpenness > 0.1) {
        ctx.beginPath();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'; // Onde blanche/claire
        
        const waveWidth = mouthWidth * 0.6;
        const wavePoints = 20;
        
        for (let i = 0; i <= wavePoints; i++) {
          const x = (i / wavePoints) * waveWidth - (waveWidth / 2);
          // Onde sinusoïdale modulée par le volume et le temps
          // L'amplitude est contrainte par la hauteur de la bouche ouverte
          const wavePhase = (Date.now() / 100) + (i * 0.5);
          const normalizedX = Math.abs(x) / (waveWidth / 2); // 0 au centre, 1 aux bords
          const envelope = 1 - normalizedX; // Plus grand au centre
          
          const waveY = Math.sin(wavePhase) * mouthOpenness * mouthHeightMax * 0.4 * envelope;
          
          // Décalage vertical pour centrer dans l'ouverture (légèrement plus bas que 0)
          const centerYOffset = mouthOpenness * mouthHeightMax * 0.2; 
          
          if (i === 0) ctx.moveTo(x, waveY + centerYOffset);
          else ctx.lineTo(x, waveY + centerYOffset);
        }
        ctx.stroke();
      }

      // 3. Petite barre "led" en bas au centre (menton tech)
      if (mouthOpenness < 0.2) {
          ctx.beginPath();
          ctx.moveTo(-mouthWidth * 0.1, mouthWidth * 0.15);
          ctx.lineTo(mouthWidth * 0.1, mouthWidth * 0.15);
          ctx.strokeStyle = `${baseColor}, 0.3)`;
          ctx.lineWidth = 2;
          ctx.stroke();
      }

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
      window.removeEventListener('mousemove', handleMouseMove);
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