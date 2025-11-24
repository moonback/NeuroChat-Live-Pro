import React, { useState, useRef, useCallback } from 'react';
import Tooltip from './Tooltip';

interface PhotoCaptureProps {
  onPhotoCapture: (imageData: string) => void;
  disabled?: boolean;
  isConnected: boolean;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  onPhotoCapture,
  disabled = false,
  isConnected
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Caméra arrière sur mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCapturing(true);
      }
    } catch (error) {
      console.error('Erreur lors du démarrage de la caméra:', error);
      alert('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Définir la taille du canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Dessiner l'image de la vidéo sur le canvas
    ctx.drawImage(video, 0, 0);

    // Convertir en base64
    const imageData = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedPhoto(imageData);
    setIsPreviewOpen(true);
    stopCamera();
  }, [stopCamera]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      setCapturedPhoto(imageData);
      setIsPreviewOpen(true);
    };
    reader.readAsDataURL(file);
  }, []);

  const sendPhoto = useCallback(() => {
    if (capturedPhoto) {
      // Extraire le base64 sans le préfixe data:image/jpeg;base64,
      const base64Data = capturedPhoto.split(',')[1];
      onPhotoCapture(base64Data);
      setCapturedPhoto(null);
      setIsPreviewOpen(false);
    }
  }, [capturedPhoto, onPhotoCapture]);

  const cancelCapture = useCallback(() => {
    setCapturedPhoto(null);
    setIsPreviewOpen(false);
    stopCamera();
  }, [stopCamera]);

  // Nettoyer le stream au démontage
  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <>
      {/* Bouton de capture photo */}
      <Tooltip content={isConnected ? "Prendre une photo à envoyer au chatbot" : "Connectez-vous d'abord pour envoyer des photos"}>
        <div className="relative">
          <button
            onClick={() => {
              if (!isCapturing && !isPreviewOpen) {
                startCamera();
              }
            }}
            disabled={disabled || !isConnected}
            className="group relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl glass border border-white/10 font-body text-[10px] sm:text-xs font-semibold transition-all duration-300 hover:scale-[1.05] active:scale-[0.98] overflow-hidden focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
            aria-label="Prendre une photo"
          >
            <svg className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="hidden sm:inline relative z-10">Photo</span>
          </button>

          {/* Input file caché pour sélectionner depuis la galerie */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || !isConnected}
          />
        </div>
      </Tooltip>

      {/* Interface de capture */}
      {isCapturing && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center">
          {/* Vidéo de prévisualisation */}
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain"
            />
            
            {/* Overlay avec instructions */}
            <div className="absolute top-4 left-4 right-4 text-center">
              <p className="text-white font-body text-sm bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm">
                Positionnez votre photo et appuyez sur capturer
              </p>
            </div>

            {/* Boutons de contrôle */}
            <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-4">
              <button
                onClick={cancelCapture}
                className="px-6 py-3 rounded-full glass-intense border border-white/20 text-white font-semibold hover:bg-white/10 transition-all"
              >
                Annuler
              </button>
              
              <button
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full bg-white border-4 border-white/30 shadow-2xl hover:scale-110 transition-transform active:scale-95"
                aria-label="Capturer la photo"
              >
                <div className="w-full h-full rounded-full bg-white"></div>
              </button>

              <button
                onClick={() => {
                  stopCamera();
                  fileInputRef.current?.click();
                }}
                className="px-6 py-3 rounded-full glass-intense border border-white/20 text-white font-semibold hover:bg-white/10 transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Galerie
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prévisualisation de la photo capturée */}
      {isPreviewOpen && capturedPhoto && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-2xl">
            <img
              src={capturedPhoto}
              alt="Photo capturée"
              className="w-full h-auto rounded-2xl shadow-2xl"
            />
            
            {/* Boutons d'action */}
            <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4">
              <button
                onClick={cancelCapture}
                className="px-6 py-3 rounded-full glass-intense border border-white/20 text-white font-semibold hover:bg-white/10 transition-all"
              >
                Annuler
              </button>
              
              <button
                onClick={sendPhoto}
                className="px-6 py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Canvas caché pour la capture */}
      <canvas ref={canvasRef} className="hidden" />
    </>
  );
};

export default PhotoCapture;

