import React, { useState, useEffect } from 'react';
import { ConnectionState, Personality } from '../types';
import VoiceSelector from './VoiceSelector';
import Tooltip from './Tooltip';
import DocumentUploader from './DocumentUploader';
import { ProcessedDocument } from '../utils/documentProcessor';

interface HeaderProps {
  connectionState: ConnectionState;
  currentPersonality: Personality;
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
  uploadedDocuments: ProcessedDocument[];
  onDocumentsChange: (documents: ProcessedDocument[]) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  isFunctionCallingEnabled: boolean;
  onToggleFunctionCalling: (enabled: boolean) => void;
  isGoogleSearchEnabled: boolean;
  onToggleGoogleSearch: (enabled: boolean) => void;
  onOpenToolsList: () => void;
}

const StatusPill: React.FC<{ connectionState: ConnectionState }> = ({ connectionState }) => {
  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isConnecting = connectionState === ConnectionState.CONNECTING;
  
  const getStatusConfig = () => {
    if (isConnected) {
      return {
        text: 'Connecté',
        bg: 'bg-emerald-500/15',
        textColor: 'text-emerald-300',
        border: 'border-emerald-400/50',
        dot: 'bg-emerald-400',
        shadow: 'shadow-[0_0_16px_4px_rgba(34,197,94,0.5)]',
        glow: 'shadow-emerald-500/60',
        ring: 'ring-emerald-500/20'
      };
    } else if (isConnecting) {
      return {
        text: 'Connexion...',
        bg: 'bg-amber-500/15',
        textColor: 'text-amber-300',
        border: 'border-amber-400/50',
        dot: 'bg-amber-400',
        shadow: 'shadow-[0_0_16px_4px_rgba(251,191,36,0.5)]',
        glow: 'shadow-amber-500/60',
        ring: 'ring-amber-500/20'
      };
    } else {
      return {
        text: 'Déconnecté',
        bg: 'bg-slate-700/20',
        textColor: 'text-slate-400',
        border: 'border-slate-500/30',
        dot: 'bg-slate-500',
        shadow: '',
        glow: '',
        ring: ''
      };
    }
  };

  const config = getStatusConfig();

  return (
    <span
      className={`
        relative flex items-center gap-1.5 px-2.5 py-1 rounded-full
        text-[10px] md:text-[11px] font-semibold tracking-wider
        ${config.bg} ${config.textColor} ${config.border} border backdrop-blur-md
        transition-all duration-500 shadow-lg
        hover:scale-105 active:scale-95 cursor-default
        ${config.ring ? `ring-2 ${config.ring}` : ''}
      `}
      title={config.text}
      role="status"
      aria-live={isConnected ? "polite" : "off"}
      style={{ 
        minHeight: 0, 
        lineHeight: 1.2,
        boxShadow: config.shadow || undefined
      }}
    >
      <span className="relative flex items-center justify-center w-2 h-2">
        <span
          className={`
            absolute inline-block w-2 h-2 rounded-full
            ${config.dot} ${config.shadow}
            ${isConnected || isConnecting ? 'animate-pulse' : ''}
            transition-all duration-500
          `}
        />
        {(isConnected || isConnecting) && (
          <>
            <span
              className={`
                absolute inset-0 w-2.5 h-2.5 rounded-full pointer-events-none
                ${config.dot} ${config.glow} animate-ping opacity-75
              `}
              style={{ animationDuration: '2s' }}
              aria-hidden="true"
            />
            <span
              className={`
                absolute inset-0 w-3 h-3 rounded-full pointer-events-none
                ${config.dot} opacity-20 animate-ping
              `}
              style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}
              aria-hidden="true"
            />
          </>
        )}
      </span>
      <span className="ml-0.5 font-semibold">{config.text}</span>
    </span>
  );
};

const Header: React.FC<HeaderProps> = ({
  connectionState,
  currentPersonality,
  selectedVoice,
  onVoiceChange,
  uploadedDocuments,
  onDocumentsChange,
  onConnect,
  onDisconnect,
  isFunctionCallingEnabled,
  onToggleFunctionCalling,
  isGoogleSearchEnabled,
  onToggleGoogleSearch,
  onOpenToolsList,
}) => {
  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isConnecting = connectionState === ConnectionState.CONNECTING;
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`absolute top-0 left-0 w-full px-4 py-2.5 md:px-8 md:py-4 flex justify-between items-center pointer-events-none z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-[#000000]/90 backdrop-blur-2xl border-b border-white/10 shadow-2xl' 
          : 'bg-gradient-to-b from-black/90 via-black/50 to-transparent backdrop-blur-xl'
      }`}
      style={{
        boxShadow: isScrolled 
          ? `0 8px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)` 
          : undefined
      }}
    >
      {/* Enhanced animated background gradient overlay */}
      <div 
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{
          opacity: isConnected ? 1 : 0,
          transition: 'opacity 1s ease-in-out'
        }}
      >
        {/* Animated gradient wave */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(
              135deg,
              ${currentPersonality.themeColor}15 0%,
              transparent 30%,
              transparent 70%,
              ${currentPersonality.themeColor}15 100%
            )`,
            animation: 'gradientWave 8s ease-in-out infinite',
            backgroundSize: '200% 200%'
          }}
        />
        
        {/* Secondary animated layer for depth */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(
              ellipse at top right,
              ${currentPersonality.themeColor}20 0%,
              transparent 50%
            )`,
            animation: 'pulseGlow 4s ease-in-out infinite',
            animationDelay: '1s'
          }}
        />
        
        {/* Third layer for shimmer effect */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(
              90deg,
              transparent 0%,
              ${currentPersonality.themeColor}10 25%,
              ${currentPersonality.themeColor}15 50%,
              ${currentPersonality.themeColor}10 75%,
              transparent 100%
            )`,
            animation: 'shimmer 6s linear infinite',
            backgroundSize: '200% 100%'
          }}
        />
      </div>
      
      {/* Enhanced animated border glow when connected */}
      {isConnected && (
        <>
          <div 
            className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
            style={{
              background: `linear-gradient(
                90deg,
                transparent 0%,
                ${currentPersonality.themeColor}60 20%,
                ${currentPersonality.themeColor}80 50%,
                ${currentPersonality.themeColor}60 80%,
                transparent 100%
              )`,
              boxShadow: `0 0 20px ${currentPersonality.themeColor}60, 0 0 40px ${currentPersonality.themeColor}30`,
              animation: 'borderPulse 3s ease-in-out infinite'
            }}
          />
          {/* Animated scanning line */}
          <div 
            className="absolute bottom-0 left-0 h-px pointer-events-none"
            style={{
              width: '30%',
              background: `linear-gradient(90deg, transparent, ${currentPersonality.themeColor}80, transparent)`,
              boxShadow: `0 0 15px ${currentPersonality.themeColor}80`,
              animation: 'scanLine 4s linear infinite'
            }}
          />
        </>
      )}
      
      {/* CSS Animations */}
      <style>{`
        @keyframes gradientWave {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        @keyframes pulseGlow {
          0%, 100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        
        @keyframes borderPulse {
          0%, 100% {
            opacity: 0.6;
            box-shadow: 0 0 20px ${currentPersonality.themeColor}60, 0 0 40px ${currentPersonality.themeColor}30;
          }
          50% {
            opacity: 1;
            box-shadow: 0 0 30px ${currentPersonality.themeColor}80, 0 0 60px ${currentPersonality.themeColor}50;
          }
        }
        
        @keyframes scanLine {
          0% {
            left: -30%;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            left: 100%;
            opacity: 0;
          }
        }
      `}</style>

      {/* Left: Brand & Identity */}
      <div className="flex items-center gap-2 lg:gap-2.5 pointer-events-auto group select-none relative z-10">
        <div className="relative">
          <h1
            className="font-display text-sm md:text-base lg:text-lg xl:text-xl font-extrabold tracking-tight text-white leading-none transition-all duration-500 cursor-default flex items-center gap-1.5 group-hover:scale-105"
            style={{
              textShadow: `0 2px 8px rgba(0,0,0,0.5), 0 0 20px ${currentPersonality.themeColor}30`,
              filter: isConnected ? `drop-shadow(0 0 8px ${currentPersonality.themeColor}40)` : undefined
            }}
          >
            <span className="relative inline-flex items-center">
              <span className="relative z-10">NEUROCHAT</span>
              <span 
                className="absolute inset-0 blur-md opacity-0 group-hover:opacity-60 transition-opacity duration-500"
                style={{ 
                  color: currentPersonality.themeColor,
                  textShadow: `0 0 20px ${currentPersonality.themeColor}`
                }}
                aria-hidden="true"
              >
                NEUROCHAT
              </span>
            </span>
            <span
              className="relative font-black ml-1 px-2 py-0.5 rounded-md border border-sky-400/50 bg-gradient-to-br from-sky-500/20 to-blue-500/20 text-sky-300 text-[10px] md:text-[11px] tracking-widest backdrop-blur-sm transition-all duration-500 group-hover:border-sky-400/70 group-hover:from-sky-500/30 group-hover:to-blue-500/30"
              style={{
                letterSpacing: '0.15em',
                boxShadow: `0 0 15px rgba(56, 189, 248, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)`
              }}
              title="Version professionnelle avancée"
            >
              <span 
                className="relative z-10 inline-block"
                style={{
                  textShadow: '0 0 10px rgba(56, 189, 248, 0.5)'
                }}
              >
                PRO
              </span>
              <span 
                className="absolute inset-0 rounded-md bg-sky-400/20 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500"
                aria-hidden="true"
              />
            </span>
          </h1>
        </div>
        {/* <div className="flex items-center gap-2 lg:gap-2 mt-0.5 md:mt-1 flex-wrap">
          <StatusPill connectionState={connectionState} />
          {uploadedDocuments.length > 0 && (
            <span 
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 transition-all duration-200"
              title={`${uploadedDocuments.length} document(s) chargé(s)`}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {uploadedDocuments.length}
            </span>
          )}
        </div> */}
      </div>

      {/* Right: Controls & Status */}
      <div className="flex flex-row items-center gap-2 sm:gap-2.5 md:gap-3 pointer-events-auto relative z-10">
        {/* Status Pill - Moved to right side */}
        <div className="hidden sm:block">
          <StatusPill connectionState={connectionState} />
        </div>

        {/* Separator with enhanced design */}
        <div className="hidden sm:flex flex-col items-center mx-1 md:mx-1.5">
          <div 
            className={`h-6 md:h-7 w-[1.5px] rounded-full transition-all duration-700 ${
              isConnected 
                ? 'bg-gradient-to-b from-transparent via-emerald-400/60 to-transparent opacity-100' 
                : isConnecting
                ? 'bg-gradient-to-b from-transparent via-amber-400/60 to-transparent opacity-100'
                : 'bg-gradient-to-b from-transparent via-white/20 to-transparent opacity-50'
            }`}
            style={{
              boxShadow: isConnected 
                ? '0 0 12px rgba(34, 197, 94, 0.5), 0 0 6px rgba(34, 197, 94, 0.3)' 
                : isConnecting
                ? '0 0 12px rgba(251, 191, 36, 0.5), 0 0 6px rgba(251, 191, 36, 0.3)'
                : undefined
            }}
          />
        </div>

        {/* Controls Container with enhanced glassmorphism */}
        <div 
          className="flex items-center gap-1.5 sm:gap-2 md:gap-2 px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 rounded-xl glass-intense border border-white/10 backdrop-blur-xl transition-all duration-500 hover:border-white/20 hover:shadow-xl"
          style={{
            boxShadow: isConnected 
              ? `0 4px 20px rgba(0, 0, 0, 0.4), 0 0 30px ${currentPersonality.themeColor}15, inset 0 1px 0 rgba(255, 255, 255, 0.1)`
              : '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)'
          }}
        >
          {/* Action Toggles (Only when disconnected) */}
          {!isConnected && (
            <>
              {/* Function Calling */}
              <Tooltip content={isFunctionCallingEnabled ? "Désactiver Fonctions" : "Activer Fonctions"} position="bottom">
                 <button
                    onClick={() => onToggleFunctionCalling(!isFunctionCallingEnabled)}
                    className={`
                      relative p-2 rounded-lg transition-all duration-500 group/btn
                      ${isFunctionCallingEnabled 
                        ? 'bg-blue-500/25 text-blue-300 hover:bg-blue-500/35 border border-blue-400/40 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                        : 'text-slate-400 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/20'
                      }
                      hover:scale-110 active:scale-95
                    `}
                 >
                    <svg className="w-4 h-4 md:w-4.5 md:h-4.5 transition-transform duration-300 group-hover/btn:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    {isFunctionCallingEnabled && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                    )}
                 </button>
              </Tooltip>

              {/* Google Search */}
              <Tooltip content={isGoogleSearchEnabled ? "Désactiver Recherche" : "Activer Recherche"} position="bottom">
                 <button
                    onClick={() => onToggleGoogleSearch(!isGoogleSearchEnabled)}
                    className={`
                      relative p-2 rounded-lg transition-all duration-500 group/btn
                      ${isGoogleSearchEnabled 
                        ? 'bg-green-500/25 text-green-300 hover:bg-green-500/35 border border-green-400/40 shadow-[0_0_15px_rgba(34,197,94,0.3)]' 
                        : 'text-slate-400 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/20'
                      }
                      hover:scale-110 active:scale-95
                    `}
                 >
                    <svg className="w-4 h-4 md:w-4.5 md:h-4.5 transition-transform duration-300 group-hover/btn:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {isGoogleSearchEnabled && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                    )}
                 </button>
              </Tooltip>

              <div className="h-5 w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent mx-1" />
            </>
          )}

          {/* View Functions List - Only visible when function calling is enabled */}
          {isFunctionCallingEnabled && (
            <>
              <div className="h-5 w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent mx-1" />
              <Tooltip content="Voir la liste des fonctions disponibles" position="bottom">
                 <button
                    onClick={onOpenToolsList}
                    className="relative p-2 rounded-lg transition-all duration-500 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 border border-transparent hover:border-blue-400/30 hover:scale-110 active:scale-95 group/btn"
                    title="Voir toutes les fonctions disponibles"
                 >
                    <svg className="w-4 h-4 md:w-4.5 md:h-4.5 transition-transform duration-300 group-hover/btn:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                 </button>
              </Tooltip>
            </>
          )}

          {/* Document Uploader with enhanced design */}
          <div className="relative group">
            <Tooltip 
              content={
                uploadedDocuments.length > 0 
                  ? `${uploadedDocuments.length} document(s) chargé(s) - Cliquez pour gérer`
                  : "Ajouter des documents contextuels pour l'IA"
              }
              position="bottom"
            >
              <div className="relative">
                <div className={`
                  relative p-1 sm:p-1.5 rounded-lg transition-all duration-500
                  ${isConnected 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'opacity-100 hover:bg-indigo-500/10 active:scale-95 cursor-pointer border border-transparent hover:border-indigo-400/30'
                  }
                `}>
                  <DocumentUploader
                    documents={uploadedDocuments}
                    onDocumentsChange={onDocumentsChange}
                    disabled={isConnected}
                  />
                  
                  {/* Enhanced notification badge */}
                  {uploadedDocuments.length > 0 && (
                    <span 
                      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full border-2 border-black/50 flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-indigo-500/50 animate-pulse"
                      style={{
                        boxShadow: '0 0 12px rgba(99, 102, 241, 0.6)'
                      }}
                    >
                      {uploadedDocuments.length}
                    </span>
                  )}
                  
                  {/* Hover glow effect */}
                  {!isConnected && (
                    <div className="absolute inset-0 rounded-lg bg-indigo-500/0 group-hover:bg-indigo-500/15 transition-all duration-500 pointer-events-none blur-sm" />
                  )}
                </div>
              </div>
            </Tooltip>
          </div>

          {/* Mini separator between controls */}
          <div className="h-5 w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent mx-1" />

          {/* Voice Selector with enhanced design */}
          <div className="relative group">
            <Tooltip 
              content={
                isConnected 
                  ? "Voix verrouillée pendant la session active" 
                  : isConnecting
                  ? "Connexion en cours..."
                  : `Voix actuelle: ${selectedVoice} - Cliquez pour changer`
              }
              position="bottom"
            >
              <div className={`
                relative transition-all duration-500
                ${isConnected 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'opacity-100 hover:scale-110 active:scale-95'
                }
              `}>
                <div className="p-1 rounded-lg group-hover:bg-white/10 border border-transparent group-hover:border-white/20 transition-all duration-500">
                  <VoiceSelector
                    currentVoice={selectedVoice}
                    onVoiceChange={onVoiceChange}
                    disabled={isConnected}
                  />
                </div>
                
                {/* Lock indicator when connected */}
                {isConnected && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="p-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-slate-600/50">
                      <svg 
                        className="w-3 h-3 text-slate-400" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </Tooltip>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
