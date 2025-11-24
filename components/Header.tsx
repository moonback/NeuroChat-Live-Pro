import React from 'react';
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

const Header: React.FC<HeaderProps> = ({
  connectionState,
  currentPersonality,
  selectedVoice,
  onVoiceChange,
  uploadedDocuments,
  onDocumentsChange,
}) => {
  const isConnected = connectionState === ConnectionState.CONNECTED;

  return (
    <header className="absolute top-0 left-0 w-full p-4 md:p-8 flex justify-between items-start md:items-center pointer-events-none z-50 transition-all duration-300">
      
      {/* Left: Brand & Identity */}
      <div className="flex items-center gap-3 md:gap-4 pointer-events-auto group">
        <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-2xl glass-intense border border-white/10 flex items-center justify-center shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:border-white/20 group-hover:shadow-[0_0_40px_rgba(99,102,241,0.3)] animate-float"
          style={{
            boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px ${currentPersonality.themeColor}10, inset 0 1px 0 rgba(255, 255, 255, 0.1)`
          }}>
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: `radial-gradient(circle at center, ${currentPersonality.themeColor}30, transparent 70%)`
              }}></div>
            
            {/* Animated glow ring */}
            <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-white/20 transition-all duration-500"></div>
            
            <svg className="w-5 h-5 md:w-7 md:h-7 text-white relative z-10 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        </div>
        
        <div className="flex flex-col">
            <h1 className="font-display text-lg md:text-2xl font-bold tracking-tight text-white leading-none mb-0.5 md:mb-1 transition-all duration-300 group-hover:tracking-normal group-hover:scale-105"
              style={{
                textShadow: `0 0 30px ${currentPersonality.themeColor}40`
              }}>
              NEUROCHAT <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300 animate-gradient">PRO</span>
            </h1>
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-sky-500 animate-pulse relative">
                <span className="absolute inset-0 rounded-full bg-sky-500 animate-ping opacity-75"></span>
              </span>
              <p className="font-body text-[9px] md:text-[10px] text-slate-400 font-medium tracking-[0.1em] md:tracking-[0.15em] uppercase leading-none transition-colors duration-300 group-hover:text-slate-300">
                Professional AI Interface
              </p>
            </div>
        </div>
      </div>

      {/* Right: Controls & Status */}
      <div className="flex flex-col md:flex-row items-end md:items-center gap-2 md:gap-3 pointer-events-auto">
        
        

        <div className="h-6 w-px bg-white/10 hidden md:block mx-1"></div>

        {/* Document Uploader */}
        <div className="relative">
          <DocumentUploader
            documents={uploadedDocuments}
            onDocumentsChange={onDocumentsChange}
            disabled={isConnected}
          />
        </div>

        <div className="h-6 w-px bg-white/10 hidden md:block mx-1"></div>

        {/* Voice Selector */}
        <div className="relative">
            <Tooltip content={isConnected ? "Voix verrouillée pendant la session" : "Changer la voix de l'IA"}>
                <div>
                    <VoiceSelector
                        currentVoice={selectedVoice}
                        onVoiceChange={onVoiceChange}
                        disabled={isConnected}
                    />
                </div>
            </Tooltip>
        </div>

      </div>
    </header>
  );
};

export default Header;
