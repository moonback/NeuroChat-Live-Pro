/**
 * Module d'analyse contextuelle vidéo
 * Fournit une analyse fine du contexte des frames vidéo pour améliorer la compréhension
 */

export interface VideoContext {
  hasSignificantChange: boolean;
  changePercentage: number;
  brightness: number;
  contrast: number;
  motionZones: { x: number; y: number; width: number; height: number }[];
  dominantColors: string[];
  textRegions: number; // Nombre estimé de régions contenant du texte
  sceneType: 'static' | 'dynamic' | 'transition';
  timestamp: number;
}

export interface FrameAnalysis {
  shouldSend: boolean;
  context: VideoContext;
  contextPrompt?: string; // Prompt contextuel à ajouter si nécessaire
}

/**
 * Calcule la différence entre deux images en analysant les pixels
 */
function calculateFrameDifference(
  imageData1: ImageData,
  imageData2: ImageData,
  threshold: number = 30
): { difference: number; changedPixels: number } {
  if (
    imageData1.width !== imageData2.width ||
    imageData1.height !== imageData2.height
  ) {
    return { difference: 1, changedPixels: imageData1.data.length / 4 };
  }

  let changedPixels = 0;
  const totalPixels = imageData1.width * imageData1.height;

  for (let i = 0; i < imageData1.data.length; i += 4) {
    const r1 = imageData1.data[i];
    const g1 = imageData1.data[i + 1];
    const b1 = imageData1.data[i + 2];

    const r2 = imageData2.data[i];
    const g2 = imageData2.data[i + 1];
    const b2 = imageData2.data[i + 2];

    // Calcul de la distance euclidienne en RGB
    const diff = Math.sqrt(
      Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)
    );

    if (diff > threshold) {
      changedPixels++;
    }
  }

  return {
    difference: changedPixels / totalPixels,
    changedPixels,
  };
}

/**
 * Calcule la luminosité moyenne d'une image
 */
function calculateBrightness(imageData: ImageData): number {
  let sum = 0;
  const pixelCount = imageData.width * imageData.height;

  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    // Formule de luminosité perceptuelle
    sum += 0.299 * r + 0.587 * g + 0.114 * b;
  }

  return sum / pixelCount / 255; // Normalisé entre 0 et 1
}

/**
 * Calcule le contraste d'une image (écart-type des valeurs de luminosité)
 */
function calculateContrast(imageData: ImageData): number {
  const brightnesses: number[] = [];
  const pixelCount = imageData.width * imageData.height;

  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    brightnesses.push(brightness);
  }

  const mean = brightnesses.reduce((a, b) => a + b, 0) / brightnesses.length;
  const variance =
    brightnesses.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    brightnesses.length;
  const stdDev = Math.sqrt(variance);

  return stdDev / 255; // Normalisé entre 0 et 1
}

/**
 * Détecte les zones de mouvement dans une image en comparant avec la précédente
 */
function detectMotionZones(
  imageData1: ImageData,
  imageData2: ImageData,
  gridSize: number = 16
): { x: number; y: number; width: number; height: number }[] {
  if (
    imageData1.width !== imageData2.width ||
    imageData1.height !== imageData2.height
  ) {
    return [];
  }

  const motionZones: { x: number; y: number; width: number; height: number }[] =
    [];
  const threshold = 30;

  for (let y = 0; y < imageData1.height; y += gridSize) {
    for (let x = 0; x < imageData1.width; x += gridSize) {
      let hasMotion = false;
      let motionPixels = 0;
      let totalPixels = 0;

      for (let dy = 0; dy < gridSize && y + dy < imageData1.height; dy++) {
        for (let dx = 0; dx < gridSize && x + dx < imageData1.width; dx++) {
          const idx = ((y + dy) * imageData1.width + (x + dx)) * 4;

          const r1 = imageData1.data[idx];
          const g1 = imageData1.data[idx + 1];
          const b1 = imageData1.data[idx + 2];

          const r2 = imageData2.data[idx];
          const g2 = imageData2.data[idx + 1];
          const b2 = imageData2.data[idx + 2];

          const diff = Math.sqrt(
            Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)
          );

          totalPixels++;
          if (diff > threshold) {
            motionPixels++;
            hasMotion = true;
          }
        }
      }

      // Si plus de 20% des pixels ont changé, c'est une zone de mouvement
      if (hasMotion && motionPixels / totalPixels > 0.2) {
        motionZones.push({
          x,
          y,
          width: Math.min(gridSize, imageData1.width - x),
          height: Math.min(gridSize, imageData1.height - y),
        });
      }
    }
  }

  return motionZones;
}

/**
 * Extrait les couleurs dominantes d'une image (simplifié)
 */
function extractDominantColors(
  imageData: ImageData,
  maxColors: number = 3
): string[] {
  const colorMap = new Map<string, number>();
  const sampleSize = 10; // Échantillonnage pour performance

  for (let i = 0; i < imageData.data.length; i += sampleSize * 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];

    // Quantification des couleurs (groupes de 32)
    const qr = Math.floor(r / 32) * 32;
    const qg = Math.floor(g / 32) * 32;
    const qb = Math.floor(b / 32) * 32;
    const key = `${qr},${qg},${qb}`;

    colorMap.set(key, (colorMap.get(key) || 0) + 1);
  }

  // Trier par fréquence et prendre les plus fréquentes
  const sortedColors = Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxColors)
    .map(([color]) => {
      const [r, g, b] = color.split(',').map(Number);
      return `rgb(${r},${g},${b})`;
    });

  return sortedColors;
}

/**
 * Estime le nombre de régions contenant du texte (détection simplifiée)
 * Basé sur les zones à fort contraste et formes rectangulaires
 */
function estimateTextRegions(imageData: ImageData): number {
  // Détection simplifiée : zones avec contraste élevé et formes régulières
  const gridSize = 32;
  let textRegions = 0;
  const contrastThreshold = 0.3;

  for (let y = 0; y < imageData.height - gridSize; y += gridSize) {
    for (let x = 0; x < imageData.width - gridSize; x += gridSize) {
      // Extraire une région carrée de gridSize x gridSize
      const regionData = new Uint8ClampedArray(gridSize * gridSize * 4);
      let regionIndex = 0;
      
      for (let ry = 0; ry < gridSize; ry++) {
        const sourceY = y + ry;
        if (sourceY >= imageData.height) break;
        
        for (let rx = 0; rx < gridSize; rx++) {
          const sourceX = x + rx;
          if (sourceX >= imageData.width) break;
          
          const sourceIndex = (sourceY * imageData.width + sourceX) * 4;
          regionData[regionIndex++] = imageData.data[sourceIndex];     // R
          regionData[regionIndex++] = imageData.data[sourceIndex + 1]; // G
          regionData[regionIndex++] = imageData.data[sourceIndex + 2]; // B
          regionData[regionIndex++] = imageData.data[sourceIndex + 3]; // A
        }
      }
      
      // Calculer le contraste local
      const localRegion = new ImageData(regionData, gridSize, gridSize);

      const localContrast = calculateContrast(localRegion);
      if (localContrast > contrastThreshold) {
        textRegions++;
      }
    }
  }

  return Math.floor(textRegions / 4); // Normalisation
}

/**
 * Détermine le type de scène basé sur l'analyse
 */
function determineSceneType(context: VideoContext): 'static' | 'dynamic' | 'transition' {
  if (context.changePercentage > 0.15) {
    return 'dynamic';
  } else if (context.changePercentage > 0.05) {
    return 'transition';
  } else {
    return 'static';
  }
}

/**
 * Génère un prompt contextuel basé sur l'analyse
 */
function generateContextPrompt(context: VideoContext, isScreenShare: boolean): string {
  const prompts: string[] = [];

  if (isScreenShare) {
    prompts.push('Analyse du contenu de l\'écran partagé.');
  } else {
    prompts.push('Analyse du flux vidéo de la caméra.');
  }

  if (context.sceneType === 'dynamic') {
    prompts.push('Scène dynamique avec mouvement significatif détecté.');
  } else if (context.sceneType === 'transition') {
    prompts.push('Transition ou changement modéré dans la scène.');
  } else {
    prompts.push('Scène relativement statique.');
  }

  if (context.motionZones.length > 0) {
    prompts.push(
      `${context.motionZones.length} zone(s) de mouvement détectée(s).`
    );
  }

  if (context.textRegions > 0) {
    prompts.push(
      `Présence probable de texte dans ${context.textRegions} région(s).`
    );
  }

  if (context.brightness < 0.3) {
    prompts.push('Éclairage faible - scène sombre.');
  } else if (context.brightness > 0.7) {
    prompts.push('Éclairage fort - scène très lumineuse.');
  }

  if (context.contrast > 0.5) {
    prompts.push('Contraste élevé - détails bien définis.');
  } else if (context.contrast < 0.2) {
    prompts.push('Contraste faible - image peut être floue ou uniforme.');
  }

  return prompts.join(' ');
}

/**
 * Classe principale pour l'analyse contextuelle vidéo
 */
export class VideoContextAnalyzer {
  private previousFrameData: ImageData | null = null;
  private frameHistory: VideoContext[] = [];
  private readonly maxHistorySize = 10;
  private readonly changeThreshold = 0.05; // 5% de changement minimum pour envoyer

  /**
   * Analyse une frame et détermine si elle doit être envoyée
   */
  analyzeFrame(
    canvas: HTMLCanvasElement,
    isScreenShare: boolean = false
  ): FrameAnalysis {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      return {
        shouldSend: false,
        context: this.createEmptyContext(),
      };
    }

    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const timestamp = Date.now();

      // Calculer les métriques de base
      const brightness = calculateBrightness(imageData);
      const contrast = calculateContrast(imageData);
      const dominantColors = extractDominantColors(imageData);
      const textRegions = estimateTextRegions(imageData);

      // Comparer avec la frame précédente
      let changePercentage = 1.0; // Par défaut, considérer comme nouveau si pas de frame précédente
      let motionZones: { x: number; y: number; width: number; height: number }[] =
        [];

      if (this.previousFrameData) {
        const diff = calculateFrameDifference(
          this.previousFrameData,
          imageData
        );
        changePercentage = diff.difference;
        motionZones = detectMotionZones(this.previousFrameData, imageData);
      }

      const hasSignificantChange = changePercentage > this.changeThreshold;

      // Créer le contexte
      const context: VideoContext = {
        hasSignificantChange,
        changePercentage,
        brightness,
        contrast,
        motionZones,
        dominantColors,
        textRegions,
        sceneType: 'static', // Sera déterminé après
        timestamp,
      };

      context.sceneType = determineSceneType(context);

      // Générer le prompt contextuel
      const contextPrompt = generateContextPrompt(context, isScreenShare);

      // Déterminer si on doit envoyer la frame
      // Envoyer si :
      // - Changement significatif détecté
      // - Première frame (pas de frame précédente)
      // - Scène dynamique avec mouvement
      // - Intervalle de temps depuis la dernière frame envoyée > seuil
      const shouldSend =
        !this.previousFrameData ||
        hasSignificantChange ||
        context.sceneType === 'dynamic' ||
        context.motionZones.length > 5;

      // Mettre à jour l'historique
      this.frameHistory.push(context);
      if (this.frameHistory.length > this.maxHistorySize) {
        this.frameHistory.shift();
      }

      // Sauvegarder la frame actuelle
      this.previousFrameData = imageData;

      return {
        shouldSend,
        context,
        contextPrompt: shouldSend ? contextPrompt : undefined,
      };
    } catch (error) {
      console.warn('Erreur lors de l\'analyse contextuelle:', error);
      return {
        shouldSend: true, // En cas d'erreur, envoyer quand même
        context: this.createEmptyContext(),
      };
    }
  }

  /**
   * Réinitialise l'analyseur (utile lors du changement de source vidéo)
   */
  reset(): void {
    this.previousFrameData = null;
    this.frameHistory = [];
  }

  /**
   * Obtient les statistiques de l'historique récent
   */
  getRecentStats(): {
    avgChange: number;
    avgBrightness: number;
    avgContrast: number;
    sceneTypes: { [key: string]: number };
  } {
    if (this.frameHistory.length === 0) {
      return {
        avgChange: 0,
        avgBrightness: 0.5,
        avgContrast: 0.3,
        sceneTypes: {},
      };
    }

    const avgChange =
      this.frameHistory.reduce((sum, ctx) => sum + ctx.changePercentage, 0) /
      this.frameHistory.length;
    const avgBrightness =
      this.frameHistory.reduce((sum, ctx) => sum + ctx.brightness, 0) /
      this.frameHistory.length;
    const avgContrast =
      this.frameHistory.reduce((sum, ctx) => sum + ctx.contrast, 0) /
      this.frameHistory.length;

    const sceneTypes: { [key: string]: number } = {};
    this.frameHistory.forEach((ctx) => {
      sceneTypes[ctx.sceneType] = (sceneTypes[ctx.sceneType] || 0) + 1;
    });

    return {
      avgChange,
      avgBrightness,
      avgContrast,
      sceneTypes,
    };
  }

  private createEmptyContext(): VideoContext {
    return {
      hasSignificantChange: false,
      changePercentage: 0,
      brightness: 0.5,
      contrast: 0.3,
      motionZones: [],
      dominantColors: [],
      textRegions: 0,
      sceneType: 'static',
      timestamp: Date.now(),
    };
  }
}

