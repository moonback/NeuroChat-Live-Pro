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
    // Images PNG et JPG
    if (
      fileType === 'image/png' || 
      fileType === 'image/jpeg' || 
      fileType === 'image/jpg' ||
      fileName.endsWith('.png') ||
      fileName.endsWith('.jpg') ||
      fileName.endsWith('.jpeg')
    ) {
      return await extractTextFromImage(file);
    }

    // Fichier texte
    if (fileType.startsWith('text/') || fileName.endsWith('.txt')) {
      return await file.text();
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
 * Convertit une image en base64 pour l'inclure dans le contexte
 */
async function extractTextFromImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const base64String = reader.result as string;
      // Format: data:image/png;base64,...
      resolve(base64String);
    };
    
    reader.onerror = () => {
      reject(new Error('Impossible de lire le fichier image'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Extrait le texte d'un PDF en utilisant l'API PDF.js via CDN
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
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += `\n\n--- Page ${i} ---\n\n${pageText}`;
    }

    return fullText.trim();
  } catch (error) {
    console.error('Erreur lors de l\'extraction du PDF:', error);
    // Fallback: retourner un message d'erreur
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
    const isImage = doc.type.startsWith('image/') || doc.content.startsWith('data:image/');
    
    if (isImage) {
      context += `--- Image ${index + 1}: ${doc.name} (${doc.type}, ${formatFileSize(doc.size)}) ---\n\n`;
      context += `L'utilisateur a fourni une image. Voici les données de l'image en base64:\n${doc.content}\n\n`;
      context += 'Tu peux analyser cette image et répondre aux questions de l\'utilisateur en te basant sur son contenu visuel.\n\n';
    } else {
      context += `--- Document ${index + 1}: ${doc.name} (${doc.type}, ${formatFileSize(doc.size)}) ---\n\n`;
      context += `${doc.content}\n\n`;
    }
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
    'image/png',
    'image/jpeg',
    'image/jpg',
  ];

  const validExtensions = [
    '.txt', '.md', '.pdf', '.json', '.csv',
    '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c',
    '.html', '.css', '.xml', '.yml', '.yaml',
    '.png', '.jpg', '.jpeg'
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

