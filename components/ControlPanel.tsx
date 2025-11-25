import React, { useMemo } from 'react';
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
  isWakeWordEnabled?: boolean;
  isFunctionCallingEnabled?: boolean;
  isGoogleSearchEnabled?: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare?: () => void;
  onCameraChange?: (cameraId: string) => void;
  onToggleWakeWord?: () => void;
  onEditPersonality?: () => void;
  onToggleFunctionCalling?: (enabled: boolean) => void;
  onToggleGoogleSearch?: (enabled: boolean) => void;
  onOpenMobileActions?: () => void;
}

const STATUS_COLOR = {
  connected: {
    color: '#34d399',
    class: 'bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.8)]',
    pulse: 'bg-emerald-400',
    textShadow: '0 0 10px rgba(52, 211, 153, 0.5)',
    text: 'Système Actif'
  },
  connecting: {
    color: '#fbbf24',
    class: 'bg-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.8)] animate-pulse',
    pulse: 'bg-amber-400',
    textShadow: '0 0 10px rgba(251, 191, 36, 0.5)',
    text: 'Initialisation'
  },
  idle: {
    color: '#94a3b8',
    class: 'bg-slate-500',
    pulse: '',
    textShadow: 'none',
    text: 'Mode Veille'
  }
};

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
  isFunctionCallingEnabled = true,
  isGoogleSearchEnabled = false,
  onConnect,
  onDisconnect,
  onToggleVideo,
  onToggleScreenShare,
  onCameraChange,
  onToggleWakeWord,
  onEditPersonality,
  onToggleFunctionCalling,
  onToggleGoogleSearch,
  onOpenMobileActions,
}) => {
  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isConnecting = connectionState === ConnectionState.CONNECTING;

  // For memoizing classes/labels that depend on state
  const status = useMemo(() => {
    if (isConnected) return STATUS_COLOR.connected;
    if (isConnecting) return STATUS_COLOR.connecting;
    return STATUS_COLOR.idle;
  }, [isConnected, isConnecting]);

  // Accessibility: aria-live for status
  const ariaLiveStatus = useMemo(() => {
    return status.text;
  }, [status]);

  // Button base classes for DRY (improvements)
  const baseBtn =
    "group relative flex items-center gap-1.5 sm:gap-2 lg:gap-2.5 xl:gap-3 px-3 sm:px-4 md:px-5 lg:px-6 xl:px-7 py-2 sm:py-2.5 lg:py-3 xl:py-3.5 rounded-lg sm:rounded-xl glass border font-body text-[10px] sm:text-xs lg:text-sm xl:text-base font-semibold transition-all duration-300 hover:scale-[1.05] active:scale-[0.98] overflow-hidden focus:outline-none focus:ring-2 focus:ring-white/30 touch-manipulation select-none";

  // Render camera selector only when at least 2 cameras and video is on
  const renderCameraSelector = isConnected && isVideoActive && availableCameras.length > 1;

  // Utils for label
  const getCameraButtonLabel = () => (isVideoActive ? "Désactiver la caméra" : "Activer la caméra");
  const getCameraTooltip = () => (isVideoActive
      ? "Désactiver la caméra - L'IA ne verra plus votre environnement"
      : "Activer la caméra - Permet à l'IA de voir votre environnement"
    );
  const getScreenShareTooltip = () => (isScreenShareActive
      ? "Arrêter le partage d'écran"
      : "Partager votre écran - L'IA pourra voir ce que vous affichez"
    );

  // Main render
  return (
    <div className="relative z-10 flex flex-col items-center justify-end h-full pb-8 sm:pb-6 md:pb-16 lg:pb-8 xl:pb-12 space-y-2 sm:space-y-3 md:space-y-8 lg:space-y-6 xl:space-y-8 w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto px-3 sm:px-4 md:px-6 lg:px-0 pointer-events-none safe-area-bottom">
      {/* Main Panel */}
      <div
        className="pointer-events-auto glass-intense rounded-2xl sm:rounded-3xl p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10 w-full text-center transition-all duration-500 flex flex-col items-center animate-fade-in relative group max-h-[85vh] sm:max-h-none overflow-y-auto"
        style={{
          boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 80px ${currentPersonality.themeColor}15, inset 0 1px 0 rgba(255,255,255,0.1)`,
        }}
      >
        {/* Background & Shimmer */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
        >
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${currentPersonality.themeColor}08, transparent 70%)`,
            }}
          ></div>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 animate-shimmer"></div>
        </div>

        {/* Status, latency, input */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-4 mb-2 sm:mb-3 md:mb-4 lg:mb-6 relative z-10">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative" aria-label={status.text}>
              <span
                className={`block w-3 h-3 rounded-full transition-all duration-300 ${status.class}`}
                aria-live="assertive"
              ></span>
              {(isConnected || isConnecting) && (
                <>
                  <span className={`absolute inset-0 rounded-full animate-ping ${status.pulse}`}></span>
                  <span
                    className={`absolute inset-0 rounded-full ${status.pulse} opacity-20 animate-ping`}
                    style={{ animationDelay: "0.5s" }}
                  ></span>
                </>
              )}
            </div>
            <div
              className="text-xs font-display font-medium tracking-[0.2em] uppercase transition-all duration-300"
              style={{
                color: status.color,
                textShadow: status.textShadow,
              }}
              aria-live="polite"
            >
              {status.text}
            </div>
          </div>
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

        {/* Assistant personality */}
        <div className="relative mb-1.5 sm:mb-2 md:mb-3 lg:mb-4 xl:mb-6 w-full z-10">
          <h1
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-display font-black tracking-tight mb-0.5 sm:mb-1 md:mb-1.5 lg:mb-2 xl:mb-3 relative transition-all duration-500 group-hover:scale-105 px-2"
            style={{
              color: currentPersonality.themeColor,
              textShadow: `0 0 40px ${currentPersonality.themeColor}60, 0 0 80px ${currentPersonality.themeColor}30`,
              filter: "drop-shadow(0 0 20px rgba(99, 102, 241, 0.3))",
            }}
          >
            {currentPersonality.name}
            <span
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 transition-all duration-700 group-hover:w-16 sm:group-hover:w-20 md:group-hover:w-24"
              style={{
                background: `linear-gradient(90deg, transparent, ${currentPersonality.themeColor}, transparent)`,
                boxShadow: `0 0 10px ${currentPersonality.themeColor}`,
              }}
            ></span>
          </h1>
          <p className="text-slate-300 font-body text-[9px] sm:text-[10px] md:text-xs lg:text-sm xl:text-base 2xl:text-lg font-light max-w-md lg:max-w-lg xl:max-w-xl mx-auto leading-relaxed transition-all duration-300 group-hover:text-slate-200 px-2">
            {currentPersonality.description}
          </p>
        </div>

        {/* Controls Row */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 xl:gap-5 mb-1.5 sm:mb-2 md:mb-3 lg:mb-4 xl:mb-6 relative z-10 px-2">

          {/* CAMERA TOGGLE */}
          {isConnected && (
            <Tooltip content={getCameraTooltip()}>
              <button
                onClick={onToggleVideo}
                aria-label={getCameraButtonLabel()}
                className={`${baseBtn} ${
                  isVideoActive
                    ? 'border-red-500/50 text-red-200 hover:border-red-500/70'
                    : 'border-white/10 text-slate-300 hover:border-white/30 hover:text-white'
                }`}
                style={{
                  boxShadow: isVideoActive
                    ? '0 0 30px rgba(239, 68, 68, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2)'
                    : '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
              >
                {isVideoActive && (
                  <div className="absolute inset-0 bg-red-500/10 animate-pulse"></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <span className="absolute inset-0 rounded-xl bg-white/20 scale-0 group-active:scale-100 opacity-0 group-active:opacity-100 transition-all duration-300"></span>
                {isVideoActive ? (
                  <>
                    <svg className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" tabIndex={-1}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      <line x1="3" y1="3" x2="21" y2="21" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                    </svg>
                    <span className="relative z-10">Arrêter la vision</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" tabIndex={-1}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="relative z-10">Activer la vision</span>
                  </>
                )}
              </button>
            </Tooltip>
          )}

          {/* CAMERA SELECTOR */}
          {renderCameraSelector && (
            <Tooltip content="Changer de caméra">
              <div className="relative min-w-[120px]">
                <select
                  value={selectedCameraId}
                  onChange={(e) => onCameraChange && onCameraChange(e.target.value)}
                  className={`${baseBtn} min-h-[44px] appearance-none pr-6 sm:pr-8 bg-transparent border-white/10 text-slate-300 hover:border-white/30 hover:text-white cursor-pointer`}
                  style={{ paddingRight: 40 }}
                  aria-label="Changer de caméra"
                >
                  {availableCameras.map((camera, idx) => (
                    <option
                      key={camera.deviceId}
                      value={camera.deviceId}
                      className="bg-slate-900 text-white"
                    >
                      {camera.label || `Caméra ${idx + 1}`}
                    </option>
                  ))}
                </select>
                <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </Tooltip>
          )}

          {/* SCREEN SHARE */}
          {isConnected && onToggleScreenShare && (
            <Tooltip content={getScreenShareTooltip()}>
              <button
                onClick={onToggleScreenShare}
                aria-label={isScreenShareActive ? "Arrêter le partage d'écran" : "Partager l'écran"}
                className={`hidden sm:flex ${baseBtn} ${
                  isScreenShareActive
                    ? 'border-indigo-500/50 text-indigo-200 hover:border-indigo-500/70'
                    : 'border-white/10 text-slate-300 hover:border-white/30 hover:text-white'
                }`}
                style={{
                  boxShadow: isScreenShareActive
                    ? '0 0 30px rgba(99, 102, 241, 0.3), 0 4px 12px rgba(0,0,0,0.2)'
                    : '0 4px 12px rgba(0,0,0,0.1)'
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

          {/* Wake Word Toggle */}
          {!isConnected && onToggleWakeWord && (
            <Tooltip content={
              isWakeWordEnabled
                ? "Désactiver la détection vocale - Dites 'Bonjour' pour démarrer automatiquement"
                : "Activer la détection vocale - Dites 'Bonjour' pour démarrer automatiquement"
            }>
              <button
                onClick={onToggleWakeWord}
                aria-label={isWakeWordEnabled ? "Désactiver la détection vocale" : "Activer la détection vocale"}
                className={`${baseBtn} ${
                  isWakeWordEnabled
                    ? 'border-emerald-500/50 text-emerald-200 hover:border-emerald-500/70'
                    : 'border-white/10 text-slate-300 hover:border-white/30 hover:text-white'
                }`}
                style={{
                  boxShadow: isWakeWordEnabled
                    ? '0 0 30px rgba(16,185,129,0.3), 0 4px 12px rgba(0,0,0,0.2)'
                    : '0 4px 12px rgba(0,0,0,0.1)'
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

          {/* Edit Personality Button */}
          {!isConnected && onEditPersonality && (
            <Tooltip content="Modifier la personnalité de l'assistant">
              <button
                onClick={onEditPersonality}
                aria-label="Modifier la personnalité"
                className={`${baseBtn} border-white/10 text-slate-300 hover:border-white/30 hover:text-white`}
                style={{
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <span className="absolute inset-0 rounded-xl bg-white/20 scale-0 group-active:scale-100 opacity-0 group-active:opacity-100 transition-all duration-300"></span>
                <svg className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="relative z-10 hidden sm:inline">Modifier</span>
              </button>
            </Tooltip>
          )}

          {/* Mobile Actions */}
          {!isConnected && onOpenMobileActions && (
            <Tooltip content="Ouvrir les actions rapides">
              <button
                onClick={onOpenMobileActions}
                aria-label="Ouvrir les actions rapides"
                className={`lg:hidden ${baseBtn} border-white/10 text-slate-300 hover:border-white/30 hover:text-white`}
                style={{
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <span className="absolute inset-0 rounded-xl bg-white/20 scale-0 group-active:scale-100 opacity-0 group-active:opacity-100 transition-all duration-300"></span>
                <svg className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span className="relative z-10 hidden sm:inline">Actions</span>
              </button>
            </Tooltip>
          )}

          {/* Extra Tools toggles */}
          {!isConnected && (
            <>
              {onToggleFunctionCalling && (
                <Tooltip content={
                  isFunctionCallingEnabled
                    ? "Désactiver l'appel de fonction - L'IA pourra appeler des fonctions personnalisées"
                    : "Activer l'appel de fonction - L'IA pourra appeler des fonctions personnalisées"
                }>
                  <button
                    onClick={() => onToggleFunctionCalling(!isFunctionCallingEnabled)}
                    aria-label={isFunctionCallingEnabled ? "Désactiver l'appel de fonction" : "Activer l'appel de fonction"}
                    className={`${baseBtn} ${
                      isFunctionCallingEnabled
                        ? "border-blue-500/50 text-blue-200 hover:border-blue-500/70"
                        : "border-white/10 text-slate-300 hover:border-white/30 hover:text-white"
                    }`}
                    style={{
                      boxShadow: isFunctionCallingEnabled
                        ? '0 0 30px rgba(59,130,246,0.3), 0 4px 12px rgba(0,0,0,0.2)'
                        : '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  >
                    {isFunctionCallingEnabled && (
                      <div className="absolute inset-0 bg-blue-500/10 animate-pulse"></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <span className="absolute inset-0 rounded-xl bg-white/20 scale-0 group-active:scale-100 opacity-0 group-active:opacity-100 transition-all duration-300"></span>
                    <svg className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    <span className="relative z-10 hidden sm:inline">Fonctions</span>
                  </button>
                </Tooltip>
              )}
              {onToggleGoogleSearch && (
                <Tooltip content={
                  isGoogleSearchEnabled
                    ? "Désactiver Google Search - L'IA pourra rechercher des informations en temps réel"
                    : "Activer Google Search - L'IA pourra rechercher des informations en temps réel"
                }>
                  <button
                    onClick={() => onToggleGoogleSearch(!isGoogleSearchEnabled)}
                    aria-label={isGoogleSearchEnabled ? "Désactiver Google Search" : "Activer Google Search"}
                    className={`${baseBtn} ${
                      isGoogleSearchEnabled
                        ? "border-green-500/50 text-green-200 hover:border-green-500/70"
                        : "border-white/10 text-slate-300 hover:border-white/30 hover:text-white"
                    }`}
                    style={{
                      boxShadow: isGoogleSearchEnabled
                        ? '0 0 30px rgba(34,197,94,0.3), 0 4px 12px rgba(0,0,0,0.2)'
                        : '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  >
                    {isGoogleSearchEnabled && (
                      <div className="absolute inset-0 bg-green-500/10 animate-pulse"></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <span className="absolute inset-0 rounded-xl bg-white/20 scale-0 group-active:scale-100 opacity-0 group-active:opacity-100 transition-all duration-300"></span>
                    <svg className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="relative z-10 hidden sm:inline">Search</span>
                  </button>
                </Tooltip>
              )}
            </>
          )}
        </div>

        {/* Main Action Button */}
        <div className="w-full flex justify-center relative z-10 mt-1 sm:mt-0">
          {!isConnected ? (
            <button
              onClick={onConnect}
              disabled={isConnecting}
              aria-label={isConnecting ? "Connexion en cours..." : "Activer NeuroChat"}
              className="group relative w-full max-w-sm lg:max-w-md xl:max-w-lg px-4 sm:px-6 md:px-10 lg:px-12 xl:px-16 py-2.5 sm:py-3 md:py-3.5 lg:py-4 xl:py-5 rounded-xl sm:rounded-2xl font-display font-black text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl tracking-wide transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden focus:outline-none focus:ring-4 focus:ring-white/30 touch-manipulation min-h-[44px] sm:min-h-[48px] md:min-h-[52px] lg:min-h-[56px] xl:min-h-[64px]"
              style={{
                background: isConnecting
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.8), rgba(226,232,240,0.8))'
                  : 'linear-gradient(135deg,#fff,#f1f5f9)',
                color: '#0f0f19',
                boxShadow: isConnecting
                  ? '0 8px 32px rgba(255,255,255,0.2), 0 0 60px rgba(255,255,255,0.15)'
                  : '0 8px 32px rgba(255,255,255,0.3), 0 0 80px rgba(255,255,255,0.2)',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              <span className="absolute inset-0 rounded-2xl bg-white/30 scale-0 group-active:scale-100 opacity-0 group-active:opacity-100 transition-all duration-500"></span>
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
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-xl -z-10"
                style={{
                  background: 'radial-gradient(circle, rgba(255,255,255,0.6), transparent)'
                }}
              ></div>
            </button>
          ) : (
            <button
              onClick={onDisconnect}
              aria-label="Terminer la session"
              className="group relative w-full max-w-sm lg:max-w-md xl:max-w-lg px-4 sm:px-6 md:px-10 lg:px-12 xl:px-16 py-2.5 sm:py-3 md:py-3.5 lg:py-4 xl:py-5 glass-intense rounded-xl sm:rounded-2xl font-display font-bold text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl tracking-wide text-red-400 border-2 border-red-500/40 transition-all duration-300 hover:scale-[1.03] hover:border-red-500/60 active:scale-[0.97] overflow-hidden focus:outline-none focus:ring-4 focus:ring-red-500/30 touch-manipulation min-h-[44px] sm:min-h-[48px] md:min-h-[52px] lg:min-h-[56px] xl:min-h-[64px]"
              style={{
                boxShadow: '0 8px 32px rgba(239,68,68,0.2), 0 0 60px rgba(239,68,68,0.15)'
              }}
            >
              <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/10 transition-colors duration-300"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              <span className="absolute inset-0 rounded-2xl bg-red-500/20 scale-0 group-active:scale-100 opacity-0 group-active:opacity-100 transition-all duration-500"></span>
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