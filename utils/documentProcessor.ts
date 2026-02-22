/**
 * Utilitaire pour traiter les documents uploadés
 * Extrait le texte de différents formats de fichiers
 */

export interface ProcessedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
  uploadedAt: Date;
}

/**
 * Extrait le texte d'un fichier selon son type
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  try {
    // Fichier texte
    if (fileType.startsWith('text/') || fileName.endsWith('.txt')) {
      return await file.text();
    }

    // Images
    if (fileType.startsWith('image/')) {
      return await extractTextFromImage(file);
    }

    // PDF
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return await extractTextFromPDF(file);
    }

    // Markdown
    if (fileType === 'text/markdown' || fileName.endsWith('.md')) {
      return await file.text();
    }

    // JSON
    if (fileType === 'application/json' || fileName.endsWith('.json')) {
      const text = await file.text();
      try {
        const json = JSON.parse(text);
        return JSON.stringify(json, null, 2);
      } catch {
        return text;
      }
    }

    // CSV
    if (fileType === 'text/csv' || fileName.endsWith('.csv')) {
      return await file.text();
    }

    // Code source (various)
    if (
      fileName.endsWith('.js') ||
      fileName.endsWith('.ts') ||
      fileName.endsWith('.jsx') ||
      fileName.endsWith('.tsx') ||
      fileName.endsWith('.py') ||
      fileName.endsWith('.java') ||
      fileName.endsWith('.cpp') ||
      fileName.endsWith('.c') ||
      fileName.endsWith('.html') ||
      fileName.endsWith('.css') ||
      fileName.endsWith('.xml')
    ) {
      return await file.text();
    }

    // Par défaut, essayer de lire comme texte
    return await file.text();
  } catch (error) {
    console.error('Erreur lors de l\'extraction du texte:', error);
    throw new Error(`Impossible d'extraire le texte du fichier: ${file.name}`);
  }
}

/**
 * Charge Tesseract.js depuis CDN
 */
async function loadTesseract(): Promise<any> {
  return new Promise<void>((resolve, reject) => {
    if ((window as any).Tesseract) {
      resolve((window as any).Tesseract);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    script.onload = () => resolve((window as any).Tesseract);
    script.onerror = () => reject(new Error('Impossible de charger Tesseract.js'));
    document.head.appendChild(script);
  });
}

/**
 * Extrait le texte d'une image avec OCR
 */
async function extractTextFromImage(file: File | string | HTMLCanvasElement): Promise<string> {
  try {
    const Tesseract = await loadTesseract();
    const worker = await Tesseract.createWorker('fra+eng'); // Français et Anglais

    let source = file;
    if (file instanceof File) {
      source = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    const { data: { text } } = await worker.recognize(source);
    await worker.terminate();

    return text;
  } catch (error) {
    console.error('Erreur OCR Image:', error);
    return '[Erreur OCR : Impossible de lire le texte de l\'image]';
  }
}

/**
 * Extrait le texte d'un PDF en utilisant l'API PDF.js avec fallback OCR
 */
async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Charger PDF.js depuis CDN
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';

    // Attendre que PDF.js soit chargé
    await new Promise<void>((resolve, reject) => {
      if ((window as any).pdfjsLib) {
        resolve();
        return;
      }

      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Impossible de charger PDF.js'));
      document.head.appendChild(script);
    });

    const pdfjsLib = (window as any).pdfjsLib;
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';
    let totalTextLength = 0;

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');

      totalTextLength += pageText.trim().length;
      fullText += `\n\n--- Page ${i} ---\n\n${pageText}`;
    }

    // SI le texte extrait est très court (ex: < 50 caractères par page en moyenne), 
    // c'est probablement un PDF scanné. On tente l'OCR.
    const averageCharPerPage = totalTextLength / pdf.numPages;
    if (averageCharPerPage < 50) {
      console.log(`[OCR] PDF scanné détecté (moyenne ${averageCharPerPage.toFixed(1)} chars/page). Lancement de l'OCR...`);
      fullText = ''; // On recommence avec l'OCR

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // Upscale pour meilleure précision OCR

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport }).promise;
          const ocrText = await extractTextFromImage(canvas);
          fullText += `\n\n--- Page ${i} (OCR) ---\n\n${ocrText}`;
        }
      }
    }

    return fullText.trim();
  } catch (error) {
    console.error('Erreur lors de l\'extraction du PDF:', error);
    throw new Error('Impossible d\'extraire le texte du PDF. Assurez-vous que le fichier n\'est pas corrompu et que vous avez une connexion internet.');
  }
}

/**
 * Formate le contenu du document pour l'inclure dans le contexte
 */
export function formatDocumentForContext(documents: ProcessedDocument[]): string {
  if (documents.length === 0) {
    return '';
  }

  let context = '\n\n=== DOCUMENTS FOURNIS PAR L\'UTILISATEUR ===\n\n';
  context += 'L\'utilisateur a fourni les documents suivants. Utilise ces informations pour répondre à ses questions.\n\n';

  documents.forEach((doc, index) => {
    context += `--- Document ${index + 1}: ${doc.name} (${doc.type}, ${formatFileSize(doc.size)}) ---\n\n`;
    context += `${doc.content}\n\n`;
  });

  context += '=== FIN DES DOCUMENTS ===\n\n';
  context += 'Lorsque l\'utilisateur pose des questions, réponds en te basant sur le contenu de ces documents. ';
  context += 'Si l\'information n\'est pas dans les documents, dis-le clairement. ';
  context += 'Cite le nom du document lorsque tu fais référence à son contenu.\n\n';

  return context;
}

/**
 * Formate la taille du fichier
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Valide le type de fichier
 */
export function isValidFileType(file: File): boolean {
  const validTypes = [
    'text/plain',
    'text/markdown',
    'application/pdf',
    'application/json',
    'text/csv',
    'text/html',
    'text/css',
    'application/javascript',
    'text/javascript',
    'application/xml',
    'text/xml',
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  const validExtensions = [
    '.txt', '.md', '.pdf', '.json', '.csv',
    '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c',
    '.html', '.css', '.xml', '.yml', '.yaml',
    '.jpg', '.jpeg', '.png', '.webp'
  ];

  if (validTypes.includes(file.type)) {
    return true;
  }

  const fileName = file.name.toLowerCase();
  return validExtensions.some(ext => fileName.endsWith(ext));
}

/**
 * Valide la taille du fichier (max 10MB par défaut)
 */
export function isValidFileSize(file: File, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

