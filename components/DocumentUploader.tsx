import React, { useState, useRef } from 'react';
import { ProcessedDocument } from '../utils/documentProcessor';
import Tooltip from './Tooltip';

interface DocumentUploaderProps {
  documents: ProcessedDocument[];
  onDocumentsChange: (documents: ProcessedDocument[]) => void;
  disabled?: boolean;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  documents,
  onDocumentsChange,
  disabled = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const { extractTextFromFile, isValidFileType, isValidFileSize } = await import('../utils/documentProcessor');

    try {
      const newDocuments: ProcessedDocument[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validation
        if (!isValidFileType(file)) {
          alert(`Le fichier "${file.name}" n'est pas dans un format supporté. Formats acceptés: TXT, PDF, MD, JSON, CSV, et fichiers de code.`);
          continue;
        }

        if (!isValidFileSize(file, 10)) {
          alert(`Le fichier "${file.name}" est trop volumineux. Taille maximale: 10MB.`);
          continue;
        }

        try {
          const content = await extractTextFromFile(file);
          
          const processedDoc = {
            id: `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            type: file.type || 'application/octet-stream',
            size: file.size,
            content: content.substring(0, 50000), // Limiter à 50k caractères pour éviter les problèmes de contexte
            uploadedAt: new Date()
          };

          newDocuments.push(processedDoc);
        } catch (error: any) {
          console.error(`Erreur lors du traitement de ${file.name}:`, error);
          alert(`Erreur lors du traitement de "${file.name}": ${error.message}`);
        }
      }

      if (newDocuments.length > 0) {
        onDocumentsChange([...documents, ...newDocuments]);
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      alert('Une erreur est survenue lors de l\'upload des documents.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeDocument = (id: string) => {
    onDocumentsChange(documents.filter(doc => doc.id !== id));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="relative">
      {/* Bouton d'ouverture */}
      <Tooltip content={documents.length > 0 ? `${documents.length} document(s) chargé(s)` : "Uploader un document pour que l'IA puisse répondre à vos questions"}>
        <button
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="group relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-2 sm:py-2 md:py-2.5 rounded-lg sm:rounded-xl glass-intense border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-white/20 touch-manipulation min-h-[44px]"
          style={{
            boxShadow: documents.length > 0 
              ? '0 8px 24px rgba(0, 0, 0, 0.3), 0 0 20px rgba(99, 102, 241, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              : '0 8px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}
          aria-label="Gérer les documents"
        >
          <svg className="w-4 h-4 md:w-5 md:h-5 text-slate-300 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {documents.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
              {documents.length}
            </span>
          )}
          <span className="hidden sm:inline font-display text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">
            Documents
          </span>
        </button>
      </Tooltip>

      {/* Panel de gestion des documents */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div 
            className="absolute top-full mt-2 right-0 w-[calc(100vw-2rem)] sm:w-80 md:w-96 max-w-[calc(100vw-2rem)] sm:max-w-none glass-intense rounded-2xl border border-white/10 overflow-hidden z-50 animate-scale-in"
            style={{
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(99, 102, 241, 0.2)'
            }}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
              <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Documents ({documents.length})
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                aria-label="Fermer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drop Zone */}
            <div
              ref={dropZoneRef}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`m-4 p-6 border-2 border-dashed rounded-xl transition-all duration-300 cursor-pointer ${
                isDragging 
                  ? 'border-indigo-500 bg-indigo-500/10' 
                  : 'border-white/20 hover:border-white/30 hover:bg-white/5'
              }`}
              onClick={() => !disabled && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileInputChange}
                className="hidden"
                accept=".txt,.pdf,.md,.json,.csv,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.html,.css,.xml,.yml,.yaml"
                disabled={disabled || isUploading}
              />
              
              <div className="text-center">
                {isUploading ? (
                  <>
                    <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-xs text-slate-400">Traitement en cours...</p>
                  </>
                ) : (
                  <>
                    <svg className="w-8 h-8 text-slate-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-xs text-slate-300 font-medium mb-1">
                      Glissez-déposez ou cliquez pour uploader
                    </p>
                    <p className="text-[10px] text-slate-500">
                      TXT, PDF, MD, JSON, CSV, Code (max 10MB)
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Liste des documents */}
            {documents.length > 0 && (
              <div className="px-4 pb-4 max-h-64 overflow-y-auto space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="group flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{doc.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {formatFileSize(doc.size)} • {doc.content.length.toLocaleString()} caractères
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeDocument(doc.id);
                      }}
                      className="flex-shrink-0 p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                      aria-label={`Supprimer ${doc.name}`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="px-4 py-3 bg-white/5 border-t border-white/10">
              <p className="text-[10px] text-slate-400 text-center">
                💡 L'IA utilisera ces documents pour répondre à vos questions
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DocumentUploader;

