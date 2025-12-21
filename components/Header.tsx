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
}

const StatusPill: React.FC<{ connectionState: ConnectionState }> = ({ connectionState }) => {
  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isConnecting = connectionState === ConnectionState.CONNECTING;
  
  const getStatusConfig = () => {
    if (isConnected) {
      return {
        text: 'Connecté',
        bg: 'bg-emerald-500/20',
        textColor: 'text-emerald-300',
        border: 'border-emerald-400/40',
        dot: 'bg-emerald-400',
        shadow: 'shadow-[0_0_12px_3px_rgba(34,197,94,0.4)]',
        glow: 'shadow-emerald-500/50'
      };
    } else if (isConnecting) {
      return {
        text: 'Connexion...',
        bg: 'bg-amber-500/20',
        textColor: 'text-amber-300',
        border: 'border-amber-400/40',
        dot: 'bg-amber-400',
        shadow: 'shadow-[0_0_12px_3px_rgba(251,191,36,0.4)]',
        glow: 'shadow-amber-500/50'
      };
    } else {
      return {
        text: 'Déconnecté',
        bg: 'bg-slate-700/30',
        textColor: 'text-slate-400',
        border: 'border-slate-400/20',
        dot: 'bg-slate-500',
        shadow: '',
        glow: ''
      };
    }
  };

  const config = getStatusConfig();

  return (
    <span
      className={`
        flex items-center gap-1 px-2 py-0.5 rounded-full
        text-[9px] md:text-[10px] font-semibold tracking-wide
        ${config.bg} ${config.textColor} ${config.border} border backdrop-blur
        transition-all duration-300 shadow-sm
        hover:scale-102 active:scale-98 cursor-default
      `}
      title={config.text}
      role="status"
      aria-live={isConnected ? "polite" : "off"}
      style={{ minHeight: 0, lineHeight: 1.2 }}
    >
      <span className="relative flex items-center">
        <span
          className={`
            inline-block w-1.5 h-1.5 rounded-full
            ${config.dot} ${config.shadow}
            ${isConnected || isConnecting ? 'animate-pulse' : ''}
            transition-all duration-300
          `}
        />
        {(isConnected || isConnecting) && (
          <span
            className={`
              absolute inset-0 w-2 h-2 rounded-full pointer-events-none
              ${config.dot} ${config.glow} animate-ping opacity-70
            `}
            style={{ animationDuration: '1.7s' }}
            aria-hidden="true"
          />
        )}
      </span>
      <span className="ml-1 font-medium">{config.text}</span>
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
      className={`absolute top-0 left-0 w-full p-1 md:p-1.5 lg:p-1.5 xl:p-2 flex justify-between items-center pointer-events-none z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-gradient-to-b from-[#131c24f0] via-[#172233e0] to-transparent backdrop-blur-md border-b border-white/15' 
          : 'bg-gradient-to-b from-[#131c24d0] via-[#17223380] to-transparent backdrop-blur-sm border-b border-white/8'
      }`}
      style={{
        boxShadow: isScrolled ? `0 2px 16px rgba(0, 0, 0, 0.3), 0 0 24px ${currentPersonality.themeColor}08` : undefined
      }}
    >
      {/* Animated background gradient overlay */}
      <div 
        className="absolute inset-0 opacity-0 transition-opacity duration-1000 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${currentPersonality.themeColor}08 0%, transparent 50%, ${currentPersonality.themeColor}08 100%)`,
          opacity: isConnected ? 0.3 : 0
        }}
      />

      {/* Left: Brand & Identity */}
      <div className="flex items-center gap-1.5 lg:gap-1.5 xl:gap-2 pointer-events-auto group select-none relative z-10 animate-slide-in-left">
        <h1
          className="font-display text-xs md:text-sm lg:text-base xl:text-base font-bold tracking-tight text-white leading-none transition-all duration-300 cursor-default flex items-center gap-0.5 hover-scale-sm"
          style={{
            textShadow: `0 1px 2px rgba(0,0,0,0.3)`,
            filter: isConnected ? `drop-shadow(0 0 4px ${currentPersonality.themeColor}20)` : undefined
          }}
        >
          <span className="relative">
            NEUROCHAT
            <span 
              className="absolute inset-0 blur opacity-0 group-hover:opacity-40 transition-opacity duration-400"
              style={{ color: currentPersonality.themeColor }}
              aria-hidden="true"
            >NEUROCHAT</span>
          </span>
          <span
            className="font-extrabold relative ml-0.5 px-1 py-0.5 rounded border border-sky-500/40 bg-sky-500/10 text-sky-300 text-[9px] md:text-[10px] tracking-wider"
            style={{
              letterSpacing: '0.1em'
            }}
            title="Version professionnelle avancée"
          >
            <span 
              className="animate-[gradient-glow_2s_ease-in-out_infinite] inline-block tracking-widest"
              style={{
                animationDelay: '0.05s'
              }}
            >
              PRO
            </span>
          </span>
        </h1>
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
      <div className="flex flex-row items-center gap-1 sm:gap-1.5 md:gap-1.5 lg:gap-2 xl:gap-2 pointer-events-auto relative z-10">
        {/* Status Pill - Moved to right side */}
        <div className="hidden sm:block">
          <StatusPill connectionState={connectionState} />
        </div>

        {/* Separator with enhanced design */}
        <div className="hidden sm:flex flex-col items-center mx-0.5 md:mx-1">
          <div 
            className={`h-5 md:h-6 w-px transition-all duration-500 ${
              isConnected 
                ? 'bg-gradient-to-b from-transparent via-emerald-400/40 to-transparent opacity-100' 
                : isConnecting
                ? 'bg-gradient-to-b from-transparent via-amber-400/40 to-transparent opacity-100'
                : 'bg-gradient-to-b from-transparent via-white/15 to-transparent opacity-40'
            }`}
            style={{
              boxShadow: isConnected 
                ? '0 0 8px rgba(34, 197, 94, 0.3)' 
                : isConnecting
                ? '0 0 8px rgba(251, 191, 36, 0.3)'
                : undefined
            }}
          />
        </div>

        {/* Controls Container with glassmorphism */}
        <div className="flex items-center gap-1 sm:gap-1 md:gap-1.5 px-1 sm:px-1.5 md:px-1.5 py-0.5 sm:py-0.5 md:py-1 rounded-md glass border border-white/8 backdrop-blur-sm transition-all duration-300 hover:border-white/15 glass-hover animate-slide-in-right"
          style={{
            boxShadow: isConnected 
              ? `0 2px 8px rgba(0, 0, 0, 0.2), 0 0 16px ${currentPersonality.themeColor}08`
              : '0 2px 8px rgba(0, 0, 0, 0.15)'
          }}
        >
          {/* Document Uploader with enhanced design */}
          <div className="relative group">
            <Tooltip 
              content={
                uploadedDocuments.length > 0 
                  ? `${uploadedDocuments.length} document(s) chargé(s) - Cliquez pour gérer`
                  : "Ajouter des documents contextuels pour l'IA"
              }
            >
              <div className="relative">
                <div className={`
                  relative p-0.5 sm:p-1 rounded-md transition-all duration-300
                  ${isConnected 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'opacity-100 hover:bg-white/5 active:scale-95 cursor-pointer'
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
                      className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-0.5 bg-indigo-500 rounded-full border border-[#131c24] flex items-center justify-center text-[9px] font-bold text-white"
                    >
                      {uploadedDocuments.length}
                    </span>
                  )}
                  
                  {/* Hover glow effect */}
                  {!isConnected && (
                    <div className="absolute inset-0 rounded-lg bg-indigo-500/0 group-hover:bg-indigo-500/10 transition-colors duration-300 pointer-events-none" />
                  )}
                </div>
              </div>
            </Tooltip>
          </div>

          {/* Mini separator between controls */}
          <div className="h-4 w-px bg-white/10 mx-0.5" />

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
            >
              <div className={`
                relative transition-all duration-300
                ${isConnected 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'opacity-100 hover:scale-105 active:scale-95'
                }
              `}>
                <div className="p-0.5 rounded-md group-hover:bg-white/5 transition-colors duration-300">
                  <VoiceSelector
                    currentVoice={selectedVoice}
                    onVoiceChange={onVoiceChange}
                    disabled={isConnected}
                  />
                </div>
                
                {/* Lock indicator when connected */}
                {isConnected && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <svg 
                      className="w-3 h-3 text-slate-500 opacity-60" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
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
