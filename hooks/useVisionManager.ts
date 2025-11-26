import { useCallback, useEffect, useRef, useState } from 'react';
import { ConnectionState } from '../types';
import { VideoContextAnalyzer } from '../utils/videoContextAnalyzer';

interface UseVisionManagerParams {
  connectionState: ConnectionState;
  addToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
  sessionRef: React.MutableRefObject<any>;
}

export const useVisionManager = ({
  connectionState,
  addToast,
  sessionRef,
}: UseVisionManagerParams) => {
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [isScreenShareActive, setIsScreenShareActive] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [isVideoEnlarged, setIsVideoEnlarged] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const frameIntervalRef = useRef<number | NodeJS.Timeout | null>(null);
  const videoContextAnalyzerRef = useRef<VideoContextAnalyzer | null>(null);
  const isScreenShareActiveRef = useRef(false);
  const isVideoActiveRef = useRef(false);
  const availableCamerasRef = useRef<MediaDeviceInfo[]>([]);
  const selectedCameraIdRef = useRef('');

  useEffect(() => {
    isVideoActiveRef.current = isVideoActive;
  }, [isVideoActive]);

  useEffect(() => {
    isScreenShareActiveRef.current = isScreenShareActive;
  }, [isScreenShareActive]);

  useEffect(() => {
    availableCamerasRef.current = availableCameras;
  }, [availableCameras]);

  useEffect(() => {
    selectedCameraIdRef.current = selectedCameraId;
  }, [selectedCameraId]);

  const enumerateCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(videoDevices);

      const savedCameraId = localStorage.getItem('selectedCameraId');
      if (videoDevices.length > 0) {
        if (savedCameraId && videoDevices.some(device => device.deviceId === savedCameraId)) {
          setSelectedCameraId(savedCameraId);
        } else if (!selectedCameraIdRef.current) {
          setSelectedCameraId(videoDevices[0].deviceId);
        }
      }
    } catch (error) {
      console.error('[VisionManager] Échec de l’énumération des caméras', error);
    }
  }, []);

  useEffect(() => {
    enumerateCameras();
  }, [enumerateCameras]);

  const stopFrameScheduling = useCallback(() => {
    if (frameIntervalRef.current) {
      clearTimeout(frameIntervalRef.current as NodeJS.Timeout);
      clearInterval(frameIntervalRef.current as number);
      frameIntervalRef.current = null;
    }
  }, []);

  const resetVisionState = useCallback(() => {
    stopFrameScheduling();

    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(track => track.stop());
      videoStreamRef.current = null;
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.pause();
    }

    setIsScreenShareActive(false);
    isScreenShareActiveRef.current = false;
    setIsVideoActive(false);
    isVideoActiveRef.current = false;
  }, [stopFrameScheduling]);

  const startFrameTransmission = useCallback(() => {
    stopFrameScheduling();

    if (!videoContextAnalyzerRef.current) {
      videoContextAnalyzerRef.current = new VideoContextAnalyzer();
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) return;

    let lastFrameTime = 0;
    const captureAndSend = async () => {
      const targetInterval = isScreenShareActiveRef.current ? 500 : 1000;
      const now = Date.now();

      if (now - lastFrameTime < targetInterval) {
        frameIntervalRef.current = window.setTimeout(captureAndSend, targetInterval - (now - lastFrameTime));
        return;
      }

      lastFrameTime = now;
      const isScreenSharing = isScreenShareActiveRef.current;
      const currentStream = isScreenSharing ? screenStreamRef.current : videoStreamRef.current;

      if (!sessionRef.current || !currentStream || video.readyState !== 4) {
        frameIntervalRef.current = window.setTimeout(captureAndSend, targetInterval);
        return;
      }

      try {
        const sourceWidth = video.videoWidth;
        const sourceHeight = video.videoHeight;
        if (sourceWidth === 0 || sourceHeight === 0) {
          frameIntervalRef.current = window.setTimeout(captureAndSend, targetInterval);
          return;
        }

        const maxWidth = isScreenSharing ? 1280 : 640;
        const scale = Math.min(1, maxWidth / sourceWidth);
        const targetWidth = Math.floor(sourceWidth * scale);
        const targetHeight = Math.floor(sourceHeight * scale);

        if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
          canvas.width = targetWidth;
          canvas.height = targetHeight;
        }

        ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
        const analysis = videoContextAnalyzerRef.current!.analyzeFrame(canvas, isScreenSharing);
        if (!analysis.shouldSend) {
          frameIntervalRef.current = window.setTimeout(captureAndSend, targetInterval);
          return;
        }

        const quality = isScreenSharing ? 0.75 : 0.55;
        setTimeout(() => {
          try {
            const base64 = canvas.toDataURL('image/jpeg', quality).split(',')[1];
            if (sessionRef.current) {
              sessionRef.current.sendRealtimeInput({
                media: {
                  mimeType: 'image/jpeg',
                  data: base64,
                },
              });
            }
          } catch (error) {
            console.warn('[VisionManager] Erreur encodage/envoi frame', error);
          }
        }, 0);
      } catch (error) {
        console.warn('[VisionManager] Erreur capture frame', error);
      }

      frameIntervalRef.current = window.setTimeout(captureAndSend, isScreenShareActiveRef.current ? 500 : 1000);
    };

    captureAndSend();
  }, [sessionRef, stopFrameScheduling]);

  const changeCamera = useCallback(
    async (cameraId: string) => {
      setSelectedCameraId(cameraId);
      localStorage.setItem('selectedCameraId', cameraId);

      if (isVideoActive && videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach(track => track.stop());
        videoStreamRef.current = null;
        stopFrameScheduling();

        if (videoContextAnalyzerRef.current) {
          videoContextAnalyzerRef.current.reset();
        }

        try {
          const constraints: MediaStreamConstraints = { video: { deviceId: { exact: cameraId } } };
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          videoStreamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
          }

          if (connectionState === ConnectionState.CONNECTED) {
            startFrameTransmission();
          }

          addToast('success', 'Caméra changée', 'La nouvelle caméra est maintenant active');
        } catch (error) {
          console.error('[VisionManager] Impossible de changer de caméra', error);
          addToast('error', 'Erreur', 'Impossible de changer de caméra');
        }
      }
    },
    [addToast, connectionState, isVideoActive, startFrameTransmission, stopFrameScheduling],
  );

  const stopScreenShare = useCallback(async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    setIsScreenShareActive(false);
    isScreenShareActiveRef.current = false;

    if (videoContextAnalyzerRef.current) {
      videoContextAnalyzerRef.current.reset();
    }

    if (isVideoActive && videoStreamRef.current && videoRef.current) {
      videoRef.current.srcObject = videoStreamRef.current;
      await videoRef.current.play();
    } else if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [isVideoActive]);

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = stream;
      setIsScreenShareActive(true);
      isScreenShareActiveRef.current = true;

      if (videoContextAnalyzerRef.current) {
        videoContextAnalyzerRef.current.reset();
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      if (connectionState === ConnectionState.CONNECTED) {
        startFrameTransmission();
      }

      addToast('success', 'Partage d’écran', 'Partage d’écran activé');
    } catch (error) {
      console.error('[VisionManager] Erreur lors du partage d’écran', error);
      if ((error as any).name !== 'NotAllowedError') {
        addToast('error', 'Erreur', "Impossible de partager l'écran");
      }
      setIsScreenShareActive(false);
      isScreenShareActiveRef.current = false;
    }
  }, [addToast, connectionState, startFrameTransmission, stopScreenShare]);

  const toggleScreenShare = useCallback(() => {
    if (isScreenShareActive) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  }, [isScreenShareActive, startScreenShare, stopScreenShare]);

  useEffect(() => {
    const startVideo = async () => {
      if (isScreenShareActive) return;

      if (isVideoActive && !videoStreamRef.current) {
        try {
          const constraints: MediaStreamConstraints = {
            video: selectedCameraId ? { deviceId: { exact: selectedCameraId } } : true,
          };
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          videoStreamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
          }

          if (videoContextAnalyzerRef.current) {
            videoContextAnalyzerRef.current.reset();
          }

          if (connectionState === ConnectionState.CONNECTED) {
            startFrameTransmission();
          }
        } catch (error) {
          console.error('[VisionManager] Échec accès caméra', error);
          addToast('error', 'Erreur Caméra', "Impossible d'accéder à la caméra. Vérifiez les permissions.");
          setIsVideoActive(false);
        }
      } else if (!isVideoActive && videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach(track => track.stop());
        videoStreamRef.current = null;
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.pause();
        }
        if (!isScreenShareActive) {
          stopFrameScheduling();
        }
      }
    };

    startVideo();
  }, [
    addToast,
    connectionState,
    isScreenShareActive,
    isVideoActive,
    selectedCameraId,
    startFrameTransmission,
    stopFrameScheduling,
  ]);

  useEffect(() => {
    return () => {
      resetVisionState();
    };
  }, [resetVisionState]);

  return {
    isVideoActive,
    setIsVideoActive,
    isVideoActiveRef,
    isScreenShareActive,
    setIsScreenShareActive,
    toggleScreenShare,
    availableCameras,
    availableCamerasRef,
    selectedCameraId,
    setSelectedCameraId,
    selectedCameraIdRef,
    changeCamera,
    enumerateCameras,
    startScreenShare,
    stopScreenShare,
    startFrameTransmission,
    resetVisionState,
    videoRef,
    canvasRef,
    videoStreamRef,
    screenStreamRef,
    frameIntervalRef,
    videoContextAnalyzerRef,
    isScreenShareActiveRef,
    isVideoEnlarged,
    setIsVideoEnlarged,
  };
};


