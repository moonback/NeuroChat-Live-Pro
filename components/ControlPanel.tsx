import React, { useMemo } from 'react';
import { ConnectionState, Personality } from '../types';
import { AVAILABLE_PERSONALITIES } from '../constants';
import Loader from './Loader';
import Tooltip from './Tooltip';
import LatencyIndicator from './LatencyIndicator';
import AudioInputVisualizer from './AudioInputVisualizer';

interface ControlPanelProps {
  connectionState: ConnectionState;
  currentPersonality: Personality;
  isVideoActive: boolean;
  isScreenShareActive?: boolean;
  isMicMuted?: boolean;
  latencyMs?: number;
  inputAnalyser?: AnalyserNode | null;
  availableCameras?: MediaDeviceInfo[];
  selectedCameraId?: string;
  isFunctionCallingEnabled?: boolean; // Géré par le Header maintenant, mais gardé pour compatibilité prop
  isGoogleSearchEnabled?: boolean;    // Idem
  onConnect: () => void;
  onDisconnect: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare?: () => void;
  onToggleMic?: () => void;
  onCameraChange?: (cameraId: string) => void;
  onEditPersonality?: () => void;
  onSelectPersonality?: (personality: Personality) => void;
  onToggleFunctionCalling?: (enabled: boolean) => void;
  onToggleGoogleSearch?: (enabled: boolean) => void;
  onOpenMobileActions?: () => void;
}

// --- Icons --- Mode Kiosque: Ajustées
const Icons = {
  Camera: () => (
    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
    </svg>
  ),
  CameraOff: () => (
    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  ),
  ScreenShare: () => (
    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
    </svg>
  ),
  Mic: () => (
    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
    </svg>
  ),
  MicOff: () => (
    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.343 6.343l-1.414 1.414m15.142 15.142l-1.414-1.414M12 18.75v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
    </svg>
  ),
  ChevronUp: () => (
    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
  ),
  Power: () => (
    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
    </svg>
  )
};

const ControlPanel: React.FC<ControlPanelProps> = ({
  connectionState,
  currentPersonality,
  isVideoActive,
  isScreenShareActive = false,
  isMicMuted = false,
  latencyMs = 0,
  inputAnalyser = null,
  availableCameras = [],
  selectedCameraId = '',
  onConnect,
  onDisconnect,
  onToggleVideo,
  onToggleScreenShare,
  onToggleMic,
  onCameraChange,
  onSelectPersonality,
  onOpenMobileActions,
}) => {
  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isConnecting = connectionState === ConnectionState.CONNECTING;

  // --- Components ---

  const RoundButton = ({ 
    onClick, 
    active, 
    activeColor = 'bg-white', 
    icon, 
    tooltip,
    indicator,
  }: { 
    onClick: () => void; 
    active: boolean; 
    activeColor?: string; 
    icon: React.ReactNode; 
    tooltip: string;
    indicator?: React.ReactNode;
  }) => (
    <Tooltip content={tooltip}>
      <button
        onClick={onClick}
        className={`
          relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full
          transition-all duration-300 ease-out
          border
          touch-manipulation min-w-[44px] min-h-[44px]
          ${active 
            ? `${activeColor} text-white border-transparent shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-105` 
            : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white hover:border-white/20 active:scale-95'
          }
        `}
      >
        <span className="relative">
          {icon}
          {indicator}
        </span>
      </button>
    </Tooltip>
  );

  return (
    <div className="relative z-40 flex flex-col items-center justify-end h-full pb-4 sm:pb-6 md:pb-8 lg:pb-10 w-full pointer-events-none safe-area-bottom">
      
      {/* 1. STATUS ISLAND (Connected State Only) - Déplacé en haut à gauche pour ne pas gêner le visage */}
      <div 
        className={`
          fixed top-16 sm:top-20 md:top-24 left-3 sm:left-4 md:left-6 z-50 pointer-events-auto transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) origin-top-left
          ${isConnected ? 'opacity-100 scale-100 translate-x-0' : 'opacity-0 scale-90 -translate-x-4 pointer-events-none'}
        `}
      >
        <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-full bg-[#050508]/60 backdrop-blur-md border border-white/5 shadow-lg">
          {/* Audio Visualizer - Compact */}
          <div className="flex items-center gap-1.5 sm:gap-2">
             <div className="flex items-center gap-1 sm:gap-1.5">
               <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
               <span className="text-[8px] sm:text-[9px] font-bold tracking-widest text-emerald-400">LIVE</span>
             </div>
             <div className="w-[1px] h-2 sm:h-3 bg-white/10" />
             <div className="w-8 sm:w-10 md:w-12 h-2 sm:h-3 flex items-center opacity-80">
                <AudioInputVisualizer analyser={inputAnalyser} isActive={isConnected} />
             </div>
          </div>

          <div className="w-[1px] h-2 sm:h-3 bg-white/10" />
          
          {/* Latency - Compact */}
          <div className="scale-75 sm:scale-90 origin-left">
            <LatencyIndicator latencyMs={latencyMs} />
          </div>
        </div>
      </div>

      {/* 2. PERSONALITY CARD (Disconnected State Only) - Flottant à droite au milieu */}
      {!isConnected && (
         <div className="hidden md:block fixed top-1/2 right-4 md:right-6 -translate-y-1/2 pointer-events-auto w-64 md:w-72 lg:w-80 max-w-sm animate-in fade-in slide-in-from-right-4 duration-700 z-20">
            <div 
                className="group relative overflow-hidden rounded-xl md:rounded-2xl border border-white/5 bg-[#050508]/60 backdrop-blur-xl shadow-2xl transition-all duration-500 hover:border-white/10 hover:bg-[#050508]/80"
            >
                {/* Select Overlay */}
                {onSelectPersonality && (
                  <button
                    aria-label="Changer de personnalité"
                    className="absolute inset-0 w-full h-full z-30 cursor-pointer transition-all group/overlay bg-transparent hover:bg-white/5 focus:outline-none"
                    type="button"
                    tabIndex={0}
                    onClick={() => {
                      // Suggestion UX : ouvrir une modal ou panneau sélecteur dédié
                      // Ici, fallback rapide : next option cyclique pour démo UX
                      const currentIndex = AVAILABLE_PERSONALITIES.findIndex(p => p.id === currentPersonality.id);
                      const next =
                        AVAILABLE_PERSONALITIES[(currentIndex + 1) % AVAILABLE_PERSONALITIES.length];
                      if (next && next.id !== currentPersonality.id) onSelectPersonality(next);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        const currentIndex = AVAILABLE_PERSONALITIES.findIndex(p => p.id === currentPersonality.id);
                        const next =
                          AVAILABLE_PERSONALITIES[(currentIndex + 1) % AVAILABLE_PERSONALITIES.length];
                        if (next && next.id !== currentPersonality.id) onSelectPersonality(next);
                      }
                    }}
                    title="Changer de personnalité"
                  >
                    <span className="sr-only">Changer la personnalité utilisée</span>
                  </button>
                )}

                <div className="relative z-10 flex items-center justify-between p-3 md:p-4">
                   {/* Left Icon/Color - Mode Kiosque: Ajusté */}
                   <div 
                     className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-white/5 border border-white/5 shadow-inner"
                     style={{ color: currentPersonality.themeColor }}
                   >
                     <div 
                       className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full shadow-[0_0_15px_currentColor]"
                       style={{ backgroundColor: currentPersonality.themeColor }} 
                     />
                   </div>

                   {/* Text Info - Mode Kiosque: Ajusté */}
                   <div className="flex-1 px-3 md:px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 md:gap-2 text-zinc-500 mb-0.5 md:mb-1">
                         <Icons.ChevronUp />
                      </div>
                      <h2 className="text-base md:text-lg font-bold text-white tracking-tight leading-none">
                        {currentPersonality.name}
                      </h2>
                      <p className="text-[9px] md:text-[10px] text-zinc-400 mt-0.5 md:mt-1 uppercase tracking-wider font-medium">
                        {currentPersonality.id === 'sara' ? 'Standard Model' : 'Custom Model'}
                      </p>
                   </div>
                   
                   {/* Right: Hint - Mode Kiosque: Ajusté */}
                   <div className="flex flex-col items-center justify-center w-10 h-10 md:w-12 md:h-12">
                      <div className="w-1 h-1 rounded-full bg-white/20 mb-0.5 md:mb-1" />
                      <div className="w-1 h-1 rounded-full bg-white/20 mb-0.5 md:mb-1" />
                      <div className="w-1 h-1 rounded-full bg-white/20" />
                   </div>
                </div>

                {/* Bottom Progress/Deco Line */}
                <div 
                  className="absolute bottom-0 left-0 h-[2px] w-full opacity-50 transition-all duration-500 group-hover:opacity-100"
                  style={{ 
                    background: `linear-gradient(90deg, transparent, ${currentPersonality.themeColor}, transparent)` 
                  }}
                />
            </div>
         </div>
      )}

      {/* 2.5. MOBILE FLOATING PERSONALITY BUTTON (Disconnected State Only) - Bas à droite sur mobile */}
      {!isConnected && onSelectPersonality && (
        <div className="md:hidden fixed bottom-20 right-4 z-50 pointer-events-auto safe-area-bottom">
          <Tooltip content={`${currentPersonality.name} - Appuyez pour changer`} position="left">
            <button
              onClick={() => {
                const currentIndex = AVAILABLE_PERSONALITIES.findIndex(p => p.id === currentPersonality.id);
                const next = AVAILABLE_PERSONALITIES[(currentIndex + 1) % AVAILABLE_PERSONALITIES.length];
                if (next && next.id !== currentPersonality.id) onSelectPersonality(next);
              }}
              className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-[#050508]/80 backdrop-blur-xl border-2 border-white/10 shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 touch-manipulation"
              style={{
                borderColor: `${currentPersonality.themeColor}40`,
                boxShadow: `0 8px 32px rgba(0, 0, 0, 0.6), 0 0 20px ${currentPersonality.themeColor}30, inset 0 1px 0 rgba(255, 255, 255, 0.1)`
              }}
              aria-label="Changer de personnalité"
            >
              {/* Glow effect */}
              <div 
                className="absolute inset-0 rounded-full opacity-50 blur-md transition-opacity duration-300 group-hover:opacity-75"
                style={{ backgroundColor: currentPersonality.themeColor }}
              />
              
              {/* Icon/Color indicator */}
              <div 
                className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full"
                style={{ 
                  backgroundColor: `${currentPersonality.themeColor}20`,
                  border: `1px solid ${currentPersonality.themeColor}40`
                }}
              >
                <div 
                  className="w-4 h-4 rounded-full shadow-[0_0_12px_currentColor]"
                  style={{ backgroundColor: currentPersonality.themeColor }}
                />
              </div>
              
              {/* Pulse animation */}
              <div 
                className="absolute inset-0 rounded-full animate-ping opacity-20"
                style={{ backgroundColor: currentPersonality.themeColor }}
              />
            </button>
          </Tooltip>
        </div>
      )}

      {/* 3. MAIN DOCK - Mode Kiosque: Ajusté */}
      <div className="pointer-events-auto w-full px-3 sm:px-4 md:px-0">
        <div 
          className="flex items-center gap-2 sm:gap-3 md:gap-4 p-1.5 sm:p-2 pl-2 sm:pl-3 pr-1.5 sm:pr-2 rounded-full border border-white/10 bg-[#08080a]/90 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all duration-500"
          style={{
             boxShadow: isConnected ? `0 0 60px -20px ${currentPersonality.themeColor}30` : ''
          }}
        >
          
          {/* Secondary Controls (Camera, Screen) - Mode Kiosque: Ajusté */}
          <div className="flex items-center gap-1.5 sm:gap-2">
             {/* Microphone Toggle (Only when Connected) */}
             {isConnected && onToggleMic && (
               <RoundButton
                 onClick={onToggleMic}
                 active={!isMicMuted}
                 activeColor="bg-white/10"
                 icon={isMicMuted ? <Icons.MicOff /> : <Icons.Mic />}
                 tooltip={isMicMuted ? "Activer Microphone" : "Couper Microphone"}
               />
             )}

             {/* Camera Toggle */}
             {isConnected && (
               <RoundButton
                 onClick={onToggleVideo}
                 active={isVideoActive}
                 activeColor="bg-white/10"
                 icon={isVideoActive ? <Icons.Camera /> : <Icons.CameraOff />}
                 tooltip={isVideoActive ? "Désactiver Caméra" : "Activer Caméra"}
               />
             )}

             {/* Screen Share */}
             {isConnected && onToggleScreenShare && (
               <RoundButton
                 onClick={onToggleScreenShare}
                 active={isScreenShareActive || false}
                 activeColor="bg-indigo-500"
                 icon={<Icons.ScreenShare />}
                 tooltip="Partage d'écran"
               />
             )}
          </div>

          <div className="w-[1px] h-6 sm:h-8 bg-white/10 mx-0.5 sm:mx-1" />

          {/* MAIN CONNECT BUTTON - Mode Kiosque: Ajusté */}
          {!isConnected ? (
             <button
               onClick={onConnect}
               disabled={isConnecting}
               className="group relative flex items-center gap-2 sm:gap-3 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-full bg-white text-black font-bold text-sm sm:text-base transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden touch-manipulation flex-shrink-0"
             >
                {/* Button Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                
                {isConnecting ? (
                   <>
                     <Loader size="sm" color="#000000" />
                     <span className="relative z-10 text-xs sm:text-sm md:text-base">Connexion...</span>
                   </>
                ) : (
                   <>
                     <span className="relative z-10 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-20"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-black"></span>
                     </span>
                     <span className="relative z-10 text-xs sm:text-sm md:text-base">COMMENCER</span>
                   </>
                )}
             </button>
          ) : (
             <button
               onClick={onDisconnect}
               className="group flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 transition-all duration-300 hover:bg-red-500 hover:text-white hover:border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)] hover:shadow-[0_0_30px_rgba(239,68,68,0.4)] active:scale-90 touch-manipulation flex-shrink-0"
             >
                <Icons.Power />
             </button>
          )}

           {/* Mobile Menu Trigger (Only when Disconnected to access settings) - Mode Kiosque: Ajusté */}
           {!isConnected && onOpenMobileActions && (
              <div className="md:hidden flex items-center pl-1.5 sm:pl-2 border-l border-white/10">
                 <button
                    onClick={onOpenMobileActions}
                    className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                 >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                 </button>
              </div>
           )}

        </div>
      </div>
    </div>
  );
};

export default ControlPanel;