import React from 'react';
import { ConnectionState, Personality } from '../types';
import Loader from './Loader';
import Tooltip from './Tooltip';
import LatencyIndicator from './LatencyIndicator';
import AudioInputVisualizer from './AudioInputVisualizer';

interface ControlPanelProps {
  connectionState: ConnectionState;
  currentPersonality: Personality;
  isVideoActive: boolean;
  isScreenShareActive?: boolean;
  latencyMs?: number;
  inputAnalyser?: AnalyserNode | null;
  availableCameras?: MediaDeviceInfo[];
  selectedCameraId?: string;
  onConnect: () => void;
  onDisconnect: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare?: () => void;
  onCameraChange?: (cameraId: string) => void;
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
  onConnect,
  onDisconnect,
  onToggleVideo,
  onToggleScreenShare,
  onCameraChange,
}) => {
  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isConnecting = connectionState === ConnectionState.CONNECTING;

  return (
    <div className="relative z-10 flex flex-col items-center justify-end h-full pb-6 md:pb-16 space-y-4 md:space-y-8 w-full max-w-3xl mx-auto px-4 md:px-6 pointer-events-none">
      
      {/* Premium Status & Personality Panel */}
      <div className="pointer-events-auto glass-intense rounded-3xl p-6 md:p-8 w-full text-center transition-all duration-500 flex flex-col items-center animate-fade-in"
        style={{
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4), 0 0 80px ${currentPersonality.themeColor}15, inset 0 1px 0 rgba(255, 255, 255, 0.1)`
        }}>
        
        {/* Premium Status Badge */}
        <div className="flex items-center justify-center gap-4 mb-4 md:mb-6">
          <div className="flex items-center gap-3">
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
              </div>
              <div className="text-xs font-display font-medium tracking-[0.2em] uppercase" 
                style={{ 
                  color: isConnected ? '#34d399' : isConnecting ? '#fbbf24' : '#94a3b8'
                }}>
                {connectionState === ConnectionState.CONNECTED ? 'Système Actif' : 
                connectionState === ConnectionState.CONNECTING ? 'Initialisation' : 'Mode Veille'}
              </div>
          </div>
          
          {/* Live Latency & Input Viz */}
          {isConnected && (
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                <Tooltip content="Latence de réponse">
                    <LatencyIndicator latencyMs={latencyMs} />
                </Tooltip>
                <Tooltip content="Volume Micro">
                    <div className="bg-black/20 backdrop-blur-sm rounded-md border border-white/5 px-1 pt-1 h-[26px]">
                        <AudioInputVisualizer analyser={inputAnalyser} isActive={isConnected} />
                    </div>
                </Tooltip>
            </div>
          )}
        </div>

        {/* Elegant Assistant Display */}
        <div className="relative mb-6 md:mb-8 w-full">
          <h1 
            className="text-4xl md:text-6xl font-display font-black tracking-tight mb-2 md:mb-3 relative"
            style={{ 
              color: currentPersonality.themeColor,
              textShadow: `0 0 40px ${currentPersonality.themeColor}60, 0 0 80px ${currentPersonality.themeColor}30`
            }}
          >
            {currentPersonality.name}
          </h1>
          <p className="text-slate-300 font-body text-xs md:text-base font-light max-w-md mx-auto leading-relaxed">
            {currentPersonality.description}
          </p>
        </div>

        {/* Premium Controls Row */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6 md:mb-8">
          {/* Camera Toggle (Premium design when connected) */}
          {isConnected && (
            <Tooltip content={isVideoActive ? "Désactiver la caméra" : "Activer la caméra"}>
                <button
                onClick={onToggleVideo}
                className={`group relative flex items-center gap-2 px-5 py-2.5 rounded-xl glass border font-body text-xs font-semibold transition-all duration-300 hover:scale-[1.02] overflow-hidden ${
                    isVideoActive 
                    ? 'border-red-500/50 text-red-200 hover:border-red-500/70' 
                    : 'border-white/10 text-slate-300 hover:border-white/30 hover:text-white'
                }`}
                style={{
                    boxShadow: isVideoActive ? '0 0 30px rgba(239, 68, 68, 0.3)' : undefined
                }}
                >
                {isVideoActive && (
                    <div className="absolute inset-0 bg-red-500/10"></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                {isVideoActive ? (
                    <>
                    <svg className="w-4 h-4 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        <line x1="3" y1="3" x2="21" y2="21" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                    </svg>
                    <span className="relative z-10">Arrêter la vision</span>
                    </>
                ) : (
                    <>
                    <svg className="w-4 h-4 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  className="group relative flex items-center gap-2 px-4 py-2.5 rounded-xl glass border border-white/10 font-body text-xs font-semibold text-slate-300 transition-all duration-300 hover:border-white/30 hover:text-white cursor-pointer appearance-none pr-8 bg-transparent focus:outline-none focus:ring-2 focus:ring-white/20"
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
            <Tooltip content={isScreenShareActive ? "Arrêter le partage" : "Partager l'écran"}>
                <button
                onClick={onToggleScreenShare}
                className={`hidden md:flex group relative items-center gap-2 px-5 py-2.5 rounded-xl glass border font-body text-xs font-semibold transition-all duration-300 hover:scale-[1.02] overflow-hidden ${
                    isScreenShareActive 
                    ? 'border-indigo-500/50 text-indigo-200 hover:border-indigo-500/70' 
                    : 'border-white/10 text-slate-300 hover:border-white/30 hover:text-white'
                }`}
                style={{
                    boxShadow: isScreenShareActive ? '0 0 30px rgba(99, 102, 241, 0.3)' : undefined
                }}
                >
                {isScreenShareActive && (
                    <div className="absolute inset-0 bg-indigo-500/10"></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                {isScreenShareActive ? (
                    <>
                    <svg className="w-4 h-4 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="relative z-10">Arrêter Partage</span>
                    </>
                ) : (
                    <>
                    <svg className="w-4 h-4 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="relative z-10">Partager Écran</span>
                    </>
                )}
                </button>
            </Tooltip>
          )}
        </div>

        {/* Premium Action Button */}
        <div className="w-full flex justify-center">
          {!isConnected ? (
            <button
              onClick={onConnect}
              disabled={isConnecting}
              className="group relative w-full max-w-sm px-6 py-4 md:px-10 md:py-5 rounded-2xl font-display font-black text-base md:text-lg tracking-wide transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden"
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
              
              {/* Content */}
              <span className="relative z-10 flex items-center justify-center gap-3">
                {isConnecting ? (
                  <>
                    <Loader size="sm" color="#4f46e5" />
                    <span>Initialisation...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                    </svg>
                    <span>Activer</span>
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
              className="group relative w-full max-w-sm px-6 py-4 md:px-10 md:py-5 glass-intense rounded-2xl font-display font-bold text-base md:text-lg tracking-wide text-red-400 border-2 border-red-500/40 transition-all duration-300 hover:scale-[1.02] hover:border-red-500/60 active:scale-[0.98] overflow-hidden"
              style={{
                boxShadow: '0 8px 32px rgba(239, 68, 68, 0.2), 0 0 60px rgba(239, 68, 68, 0.15)'
              }}
            >
              {/* Background hover effect */}
              <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/10 transition-colors duration-300"></div>
              
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