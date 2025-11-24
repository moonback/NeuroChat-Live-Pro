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
  onOpenHistory?: () => void;
}

const StatusPill: React.FC<{ connected: boolean }> = ({ connected }) => (
  <span
    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium
      ${
        connected
          ? "bg-green-600/30 text-green-200 border border-green-400/30"
          : "bg-slate-700/30 text-slate-400 border border-slate-400/20"
      } transition-all duration-300 shadow-sm`}
    title={connected ? "Connecté" : "Déconnecté"}
  >
    <span
      className={`inline-block w-2 h-2 rounded-full ${
        connected
          ? "bg-green-400 animate-pulse shadow-[0_0_6px_2px_rgb(34,197,94,0.3)]"
          : "bg-slate-500"
      }`}
    />
    {connected ? 'Connecté' : 'Déconnecté'}
  </span>
);

const Header: React.FC<HeaderProps> = ({
  connectionState,
  currentPersonality,
  selectedVoice,
  onVoiceChange,
  uploadedDocuments,
  onDocumentsChange,
  onOpenHistory,
}) => {
  const isConnected = connectionState === ConnectionState.CONNECTED;

  return (
    <header className="absolute top-0 left-0 w-full p-4 md:p-6 flex justify-between items-start md:items-center pointer-events-none z-50 transition-all duration-300 bg-gradient-to-b from-[#131c24cc] via-[#1722337a] to-transparent backdrop-blur-lg border-b border-white/10">
      {/* Left: Brand & Identity */}
      <div className="flex items-center gap-4 pointer-events-auto group select-none">
        <div className="flex flex-col justify-center">
          <h1
            className="font-display text-xl md:text-3xl font-bold tracking-tighter text-white leading-none mb-1 transition-all duration-300 group-hover:scale-105 group-hover:tracking-normal"
            style={{
              textShadow: `0 0 36px ${currentPersonality.themeColor}50, 0 1px 0 #000a`
            }}>
            <span className="inline-flex items-center gap-1">
              
              NEUROCHAT{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300 animate-gradient drop-shadow-lg">
                PRO
              </span>
            </span>
          </h1>
          <div className="flex items-center gap-2 mt-0.5 md:mt-1">
            <StatusPill connected={isConnected} />
            <span className="font-body text-[9.3px] md:text-[10.5px] text-slate-400 font-medium tracking-[0.11em] md:tracking-[0.14em] uppercase leading-none px-1">
              Assistant IA Professionnel
            </span>
          </div>
        </div>
      </div>

      {/* Right: Controls & Status */}
      <div className="flex flex-row items-center gap-2 md:gap-4 pointer-events-auto">
        <div className="hidden md:flex flex-col items-center mx-2">
          <div className="h-7 w-px bg-white/10" />
        </div>

        {/* Conversation History */}
        {onOpenHistory && (
          <>
            <div className="relative">
              <Tooltip content="Historique des conversations chiffrées">
                <button
                  onClick={onOpenHistory}
                  className="p-2 rounded-lg glass-intense border border-white/10 hover:border-indigo-500/50 transition-all duration-300 hover:scale-105 active:scale-95 group"
                >
                  <svg className="w-5 h-5 text-white group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </Tooltip>
            </div>

            <div className="hidden md:flex flex-col items-center mx-2">
              <div className="h-7 w-px bg-white/10" />
            </div>
          </>
        )}

        {/* Document Uploader */}
        <div className="relative">
          <Tooltip content="Ajouter des documents contextuels pour l'IA">
            <div>
              <DocumentUploader
                documents={uploadedDocuments}
                onDocumentsChange={onDocumentsChange}
                disabled={isConnected}
              />
            </div>
          </Tooltip>
        </div>

        <div className="hidden md:flex flex-col items-center mx-2">
          <div className="h-7 w-px bg-white/10" />
        </div>

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
