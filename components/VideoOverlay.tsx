import React from 'react';

interface VideoOverlayProps {
  isVideoActive: boolean;
  isScreenShareActive: boolean;
  isVideoEnlarged: boolean;
  setIsVideoEnlarged: (value: boolean) => void;
  availableCameras: MediaDeviceInfo[];
  selectedCameraId: string;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  videoStreamRef: React.MutableRefObject<MediaStream | null>;
  screenStreamRef: React.MutableRefObject<MediaStream | null>;
}

const VideoOverlay: React.FC<VideoOverlayProps> = ({
  isVideoActive,
  isScreenShareActive,
  isVideoEnlarged,
  setIsVideoEnlarged,
  availableCameras,
  selectedCameraId,
  videoRef,
  canvasRef,
  videoStreamRef,
  screenStreamRef,
}) => {
  const cameraLabel =
    availableCameras.find(cam => cam.deviceId === selectedCameraId)?.label || 'Caméra';

  const hasAnyVideo = isVideoActive || isScreenShareActive;

  return (
    <>
      {/* Hidden Video & Canvas for Computer Vision */}
      <video ref={videoRef} className="hidden" muted playsInline autoPlay />
      <canvas ref={canvasRef} className="hidden" />

      {/* Premium Camera Preview (Picture-in-Picture) */}
      {hasAnyVideo && !isVideoEnlarged && (
        <div
          onClick={() => setIsVideoEnlarged(true)}
          className="absolute top-16 sm:top-20 right-3 sm:right-4 md:top-8 md:right-8 lg:top-24 lg:right-8 xl:top-28 xl:right-12 z-40 w-48 sm:w-32 md:w-56 lg:w-72 xl:w-80 aspect-video rounded-xl sm:rounded-2xl overflow-hidden glass-intense border border-white/20 shadow-2xl animate-in cursor-pointer group hover:scale-105 active:scale-95 transition-transform duration-300 touch-manipulation"
          style={{
            boxShadow:
              '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(99, 102, 241, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          }}
        >
          <div
            ref={(ref) => {
              if (ref && videoRef.current) {
                const stream = isScreenShareActive ? screenStreamRef.current : videoStreamRef.current;
                if (stream) {
                  ref.innerHTML = '';
                  const previewVideo = document.createElement('video');
                  previewVideo.srcObject = stream;
                  previewVideo.muted = true;
                  previewVideo.play().catch(() => {});
                  previewVideo.className = 'w-full h-full object-cover';
                  ref.appendChild(previewVideo);
                }
              }
            }}
            className="w-full h-full bg-black/80"
          />

          {/* Premium Live Indicator */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Top gradient fade */}
            <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/60 to-transparent"></div>
            {/* Bottom gradient fade */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent"></div>
          </div>

          <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg glass-intense">
            <div className="relative">
              <span
                className={`block w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full ${
                  isScreenShareActive ? 'bg-indigo-500' : 'bg-red-500'
                }`}
                style={{
                  boxShadow: isScreenShareActive
                    ? '0 0 10px rgba(99, 102, 241, 0.8)'
                    : '0 0 10px rgba(239, 68, 68, 0.8)',
                }}
              ></span>
              <span
                className={`absolute inset-0 w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full animate-ping ${
                  isScreenShareActive ? 'bg-indigo-500' : 'bg-red-500'
                }`}
              ></span>
            </div>
            <span className="font-display text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.1em] sm:tracking-[0.15em] text-white">
              {isScreenShareActive ? 'Partage' : 'Vision'}
            </span>
          </div>

          {/* Expand Icon Hint */}
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="p-1.5 sm:p-2 rounded-md sm:rounded-lg glass-intense">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Enlarged Camera View */}
      {hasAnyVideo && isVideoEnlarged && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in safe-area-inset"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsVideoEnlarged(false);
            }
          }}
        >
          <div className="relative w-full h-full max-w-6xl max-h-[90vh] m-2 sm:m-4 md:m-8">
            {/* Enlarged Video Container */}
            <div
              className="relative w-full h-full rounded-3xl overflow-hidden glass-intense border-2 border-white/20 shadow-2xl"
              style={{
                boxShadow:
                  '0 25px 80px rgba(0, 0, 0, 0.8), 0 0 60px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              }}
            >
              <div
                ref={(ref) => {
                  if (ref && videoRef.current) {
                    const stream = isScreenShareActive ? screenStreamRef.current : videoStreamRef.current;
                    if (stream) {
                      ref.innerHTML = '';
                      const enlargedVideo = document.createElement('video');
                      enlargedVideo.srcObject = stream;
                      enlargedVideo.muted = true;
                      enlargedVideo.play().catch(() => {});
                      enlargedVideo.className = 'w-full h-full object-contain';
                      ref.appendChild(enlargedVideo);
                    }
                  }
                }}
                className="w-full h-full bg-black"
              />

              {/* Gradient overlays */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent"></div>
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent"></div>
              </div>

              {/* Live Indicator */}
              <div className="absolute top-3 sm:top-4 md:top-6 left-3 sm:left-4 md:left-6 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-lg sm:rounded-xl glass-intense">
                <div className="relative">
                  <span
                    className={`block w-2 sm:w-2.5 md:w-3 h-2 sm:h-2.5 md:h-3 rounded-full ${
                      isScreenShareActive ? 'bg-indigo-500' : 'bg-red-500'
                    }`}
                    style={{
                      boxShadow: isScreenShareActive
                        ? '0 0 15px rgba(99, 102, 241, 0.9)'
                        : '0 0 15px rgba(239, 68, 68, 0.9)',
                    }}
                  ></span>
                  <span
                    className={`absolute inset-0 w-2 sm:w-2.5 md:w-3 h-2 sm:h-2.5 md:h-3 rounded-full animate-ping ${
                      isScreenShareActive ? 'bg-indigo-500' : 'bg-red-500'
                    }`}
                  ></span>
                </div>
                <span className="font-display text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-white">
                  {isScreenShareActive ? 'Partage Écran' : 'Vision Active'}
                </span>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsVideoEnlarged(false)}
                className="absolute top-3 sm:top-4 md:top-6 right-3 sm:right-4 md:right-6 group p-2.5 sm:p-3 rounded-lg sm:rounded-xl glass-intense border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105 active:scale-95 touch-manipulation min-w-[44px] min-h-[44px]"
                style={{
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                }}
              >
                <svg className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Camera Info */}
              <div className="absolute bottom-3 sm:bottom-4 md:bottom-6 left-3 sm:left-4 md:left-6 right-3 sm:right-4 md:right-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                <div className="px-3 sm:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-lg sm:rounded-xl glass-intense">
                  <span className="font-body text-xs sm:text-sm text-slate-300">
                    {isScreenShareActive ? "Partage d'écran en cours" : cameraLabel}
                  </span>
                </div>

                <div className="px-3 sm:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-lg sm:rounded-xl glass-intense">
                  <span className="font-body text-[10px] sm:text-xs text-slate-400">
                    Cliquez à l&apos;extérieur pour réduire
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VideoOverlay;


