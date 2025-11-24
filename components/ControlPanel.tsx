import React from 'react';
import { ConnectionState, Personality } from '../types';
import Loader from './Loader';
import Tooltip from './Tooltip';
import LatencyIndicator from './LatencyIndicator';
import AudioInputVisualizer from './AudioInputVisualizer';
import PhotoCapture from './PhotoCapture';

interface ControlPanelProps {
  connectionState: ConnectionState;
  currentPersonality: Personality;
  isVideoActive: boolean;
  isScreenShareActive?: boolean;
  latencyMs?: number;
  inputAnalyser?: AnalyserNode | null;
  availableCameras?: MediaDeviceInfo[];
  selectedCameraId?: string;
  isWakeWordEnabled?: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare?: () => void;
  onCameraChange?: (cameraId: string) => void;
  onToggleWakeWord?: () => void;
  onPhotoCapture?: (imageData: string) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  connectionState,
  currentPersonality,
  isVideoActive,
  isScreenShareActive = false,
  latencyMs = 0,
  inputAnalyser = null,
  availableCameras = [],
  selectedCameraId = '',
  isWakeWordEnabled = true,
  onConnect,
  onDisconnect,
  onToggleVideo,
  onToggleScreenShare,
  onCameraChange,
  onToggleWakeWord,
  onPhotoCapture,
}) => {
  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isConnecting = connectionState === ConnectionState.CONNECTING;

  return (
    <div className="relative z-10 flex flex-col items-center justify-end h-full pb-4 sm:pb-6 md:pb-16 space-y-3 sm:space-y-4 md:space-y-8 w-full max-w-3xl mx-auto px-3 sm:px-4 md:px-6 pointer-events-none">
      
      {/* Premium Status & Personality Panel */}
      <div className="pointer-events-auto glass-intense rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 w-full text-center transition-all duration-500 flex flex-col items-center animate-fade-in relative overflow-hidden group"
        style={{
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4), 0 0 80px ${currentPersonality.themeColor}15, inset 0 1px 0 rgba(255, 255, 255, 0.1)`
        }}>
        
        {/* Animated background gradient overlay */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${currentPersonality.themeColor}08, transparent 70%)`
          }}
        ></div>
        
        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none animate-shimmer"></div>
        
        {/* Premium Status Badge */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-3 sm:mb-4 md:mb-6 relative z-10">
          <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative">
                <span className={`block w-3 h-3 rounded-full transition-all duration-300 ${
                  isConnected ? 'bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.8)]' : 
                  isConnecting ? 'bg-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.8)] animate-pulse' : 
                  'bg-slate-500'
                }`}></span>
                {(isConnected || isConnecting) && (
                  <span className={`absolute inset-0 rounded-full animate-ping ${
                    isConnected ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}></span>
                )}
                {/* Additional glow rings */}
                {(isConnected || isConnecting) && (
                  <span className={`absolute inset-0 rounded-full ${
                    isConnected ? 'bg-emerald-400' : 'bg-amber-400'
                  } opacity-20 animate-ping`} style={{ animationDelay: '0.5s' }}></span>
                )}
              </div>
              <div className="text-xs font-display font-medium tracking-[0.2em] uppercase transition-all duration-300" 
                style={{ 
                  color: isConnected ? '#34d399' : isConnecting ? '#fbbf24' : '#94a3b8',
                  textShadow: isConnected ? '0 0 10px rgba(52, 211, 153, 0.5)' : isConnecting ? '0 0 10px rgba(251, 191, 36, 0.5)' : 'none'
                }}>
                {connectionState === ConnectionState.CONNECTED ? 'Système Actif' : 
                connectionState === ConnectionState.CONNECTING ? 'Initialisation' : 'Mode Veille'}
              </div>
          </div>
          
          {/* Live Latency & Input Viz */}
          {isConnected && (
            <div className="flex items-center gap-2 sm:gap-3 sm:pl-4 sm:border-l border-white/10 animate-slide-in-right pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10 sm:border-l">
                <Tooltip content="Latence de réponse">
                    <LatencyIndicator latencyMs={latencyMs} />
                </Tooltip>
                <Tooltip content="Volume Micro">
                    <div className="bg-black/20 backdrop-blur-sm rounded-md border border-white/5 px-1 pt-1 h-[26px] transition-all duration-300 hover:border-white/20">
                        <AudioInputVisualizer analyser={inputAnalyser} isActive={isConnected} />
                    </div>
                </Tooltip>
            </div>
          )}
        </div>

        {/* Elegant Assistant Display */}
        <div className="relative mb-4 sm:mb-6 md:mb-8 w-full relative z-10">
          <h1 
            className="text-3xl sm:text-4xl md:text-6xl font-display font-black tracking-tight mb-1.5 sm:mb-2 md:mb-3 relative transition-all duration-500 group-hover:scale-105"
            style={{ 
              color: currentPersonality.themeColor,
              textShadow: `0 0 40px ${currentPersonality.themeColor}60, 0 0 80px ${currentPersonality.themeColor}30`,
              filter: 'drop-shadow(0 0 20px rgba(99, 102, 241, 0.3))'
            }}
          >
            {currentPersonality.name}
            {/* Animated underline */}
            <span 
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 transition-all duration-700 group-hover:w-24"
              style={{ 
                background: `linear-gradient(90deg, transparent, ${currentPersonality.themeColor}, transparent)`,
                boxShadow: `0 0 10px ${currentPersonality.themeColor}`
              }}
            ></span>
          </h1>
          <p className="text-slate-300 font-body text-xs md:text-base font-light max-w-md mx-auto leading-relaxed transition-all duration-300 group-hover:text-slate-200">
            {currentPersonality.description}
          </p>
        </div>

        {/* Premium Controls Row */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6 md:mb-8 relative z-10">
          {/* Camera Toggle (Premium design when connected) */}
          {isConnected && (
            <Tooltip content={isVideoActive ? "Désactiver la caméra - L'IA ne verra plus votre environnement" : "Activer la caméra - Permet à l'IA de voir votre environnement"}>
                <button
                onClick={onToggleVideo}
                aria-label={isVideoActive ? "Désactiver la caméra" : "Activer la caméra"}
                className={`group relative flex items-center gap-2 px-5 py-2.5 rounded-xl glass border font-body text-xs font-semibold transition-all duration-300 hover:scale-[1.05] active:scale-[0.98] overflow-hidden focus:outline-none focus:ring-2 focus:ring-white/30 ${
                    isVideoActive 
                    ? 'border-red-500/50 text-red-200 hover:border-red-500/70' 
                    : 'border-white/10 text-slate-300 hover:border-white/30 hover:text-white'
                }`}
                style={{
                    boxShadow: isVideoActive ? '0 0 30px rgba(239, 68, 68, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2)' : '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
                >
                {isVideoActive && (
                    <div className="absolute inset-0 bg-red-500/10 animate-pulse"></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                {/* Ripple effect on click */}
                <span className="absolute inset-0 rounded-xl bg-white/20 scale-0 group-active:scale-100 opacity-0 group-active:opacity-100 transition-all duration-300"></span>
                {isVideoActive ? (
                    <>
                    <svg className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        <line x1="3" y1="3" x2="21" y2="21" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                    </svg>
                    <span className="relative z-10">Arrêter la vision</span>
                    </>
                ) : (
                    <>
                    <svg className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="relative z-10">Activer la vision</span>
                    </>
                )}
                </button>
            </Tooltip>
          )}
          
          {/* Camera Selector */}
          {isConnected && isVideoActive && availableCameras.length > 1 && (
            <Tooltip content="Changer de caméra">
              <div className="relative">
                <select
                  value={selectedCameraId}
                  onChange={(e) => onCameraChange && onCameraChange(e.target.value)}
                  className="group relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl glass border border-white/10 font-body text-[10px] sm:text-xs font-semibold text-slate-300 transition-all duration-300 hover:border-white/30 hover:text-white cursor-pointer appearance-none pr-6 sm:pr-8 bg-transparent focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  {availableCameras.map((camera, index) => (
                    <option key={camera.deviceId} value={camera.deviceId} className="bg-slate-900 text-white">
                      {camera.label || `Caméra ${index + 1}`}
                    </option>
                  ))}
                </select>
                <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </Tooltip>
          )}

          {/* Screen Share Toggle */}
          {isConnected && onToggleScreenShare && (
            <Tooltip content={isScreenShareActive ? "Arrêter le partage d'écran" : "Partager votre écran - L'IA pourra voir ce que vous affichez"}>
                <button
                onClick={onToggleScreenShare}
                aria-label={isScreenShareActive ? "Arrêter le partage d'écran" : "Partager l'écran"}
                className={`hidden sm:flex group relative items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl glass border font-body text-[10px] sm:text-xs font-semibold transition-all duration-300 hover:scale-[1.05] active:scale-[0.98] overflow-hidden focus:outline-none focus:ring-2 focus:ring-white/30 ${
                    isScreenShareActive 
                    ? 'border-indigo-500/50 text-indigo-200 hover:border-indigo-500/70' 
                    : 'border-white/10 text-slate-300 hover:border-white/30 hover:text-white'
                }`}
                style={{
                    boxShadow: isScreenShareActive ? '0 0 30px rgba(99, 102, 241, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2)' : '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
                >
                {isScreenShareActive && (
                    <div className="absolute inset-0 bg-indigo-500/10 animate-pulse"></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <span className="absolute inset-0 rounded-xl bg-white/20 scale-0 group-active:scale-100 opacity-0 group-active:opacity-100 transition-all duration-300"></span>
                {isScreenShareActive ? (
                    <>
                    <svg className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="relative z-10">Arrêter Partage</span>
                    </>
                ) : (
                    <>
                    <svg className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="relative z-10">Partager Écran</span>
                    </>
                )}
                </button>
            </Tooltip>
          )}

          {/* Photo Capture - Visible seulement quand connecté */}
          {isConnected && onPhotoCapture && (
            <PhotoCapture
              onPhotoCapture={onPhotoCapture}
              disabled={false}
              isConnected={isConnected}
            />
          )}

          {/* Wake Word Toggle - Visible seulement quand déconnecté */}
          {!isConnected && onToggleWakeWord && (
            <Tooltip content={
              isWakeWordEnabled 
                ? "Désactiver la détection vocale - Dites 'Bonjour' pour démarrer automatiquement" 
                : "Activer la détection vocale - Dites 'Bonjour' pour démarrer automatiquement"
            }>
                <button
                onClick={onToggleWakeWord}
                aria-label={isWakeWordEnabled ? "Désactiver la détection vocale" : "Activer la détection vocale"}
                className={`group relative flex items-center gap-2 px-5 py-2.5 rounded-xl glass border font-body text-xs font-semibold transition-all duration-300 hover:scale-[1.05] active:scale-[0.98] overflow-hidden focus:outline-none focus:ring-2 focus:ring-white/30 ${
                    isWakeWordEnabled 
                    ? 'border-emerald-500/50 text-emerald-200 hover:border-emerald-500/70' 
                    : 'border-white/10 text-slate-300 hover:border-white/30 hover:text-white'
                }`}
                style={{
                    boxShadow: isWakeWordEnabled ? '0 0 30px rgba(16, 185, 129, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2)' : '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
                >
                {isWakeWordEnabled && (
                    <div className="absolute inset-0 bg-emerald-500/10 animate-pulse"></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <span className="absolute inset-0 rounded-xl bg-white/20 scale-0 group-active:scale-100 opacity-0 group-active:opacity-100 transition-all duration-300"></span>
                {isWakeWordEnabled ? (
                    <>
                    <svg className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    <span className="relative z-10">Désactiver 'Bonjour'</span>
                    </>
                ) : (
                    <>
                    <svg className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                    <span className="relative z-10">Activer 'Bonjour'</span>
                    </>
                )}
                </button>
            </Tooltip>
          )}
        </div>

        {/* Premium Action Button */}
        <div className="w-full flex justify-center relative z-10">
          {!isConnected ? (
            <button
              onClick={onConnect}
              disabled={isConnecting}
              aria-label={isConnecting ? "Connexion en cours..." : "Activer NeuroChat"}
              className="group relative w-full max-w-sm px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl font-display font-black text-sm sm:text-base md:text-lg tracking-wide transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden focus:outline-none focus:ring-4 focus:ring-white/30"
              style={{
                background: isConnecting 
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(226, 232, 240, 0.8))'
                  : 'linear-gradient(135deg, #ffffff, #f1f5f9)',
                color: '#0f0f19',
                boxShadow: isConnecting
                  ? '0 8px 32px rgba(255, 255, 255, 0.2), 0 0 60px rgba(255, 255, 255, 0.15)'
                  : '0 8px 32px rgba(255, 255, 255, 0.3), 0 0 80px rgba(255, 255, 255, 0.2)',
              }}
            >
              {/* Animated background layer */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              
              {/* Ripple effect */}
              <span className="absolute inset-0 rounded-2xl bg-white/30 scale-0 group-active:scale-100 opacity-0 group-active:opacity-100 transition-all duration-500"></span>
              
              {/* Content */}
              <span className="relative z-10 flex items-center justify-center gap-3">
                {isConnecting ? (
                  <>
                    <Loader size="sm" color="#4f46e5" />
                    <span>Initialisation...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                    </svg>
                    <span className="relative">
                      Activer
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-current group-hover:w-full transition-all duration-500"></span>
                    </span>
                  </>
                )}
              </span>

              {/* Glow effect on hover */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-xl -z-10"
                style={{ 
                  background: 'radial-gradient(circle, rgba(255, 255, 255, 0.6), transparent)',
                }}
              ></div>
            </button>
          ) : (
            <button
              onClick={onDisconnect}
              aria-label="Terminer la session"
              className="group relative w-full max-w-sm px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 glass-intense rounded-xl sm:rounded-2xl font-display font-bold text-sm sm:text-base md:text-lg tracking-wide text-red-400 border-2 border-red-500/40 transition-all duration-300 hover:scale-[1.03] hover:border-red-500/60 active:scale-[0.97] overflow-hidden focus:outline-none focus:ring-4 focus:ring-red-500/30"
              style={{
                boxShadow: '0 8px 32px rgba(239, 68, 68, 0.2), 0 0 60px rgba(239, 68, 68, 0.15)'
              }}
            >
              {/* Background hover effect */}
              <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/10 transition-colors duration-300"></div>
              
              {/* Animated shimmer */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              
              {/* Ripple effect */}
              <span className="absolute inset-0 rounded-2xl bg-red-500/20 scale-0 group-active:scale-100 opacity-0 group-active:opacity-100 transition-all duration-500"></span>
              
              {/* Content */}
              <span className="relative z-10 flex items-center justify-center gap-3">
                <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                <span>Terminer la session</span>
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;