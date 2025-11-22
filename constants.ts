import { Personality } from './types';

// Configuration unique de l'assistant NeuroChat
export const DEFAULT_PERSONALITY: Personality = {
  id: 'neurochat',
  name: 'NeuroChat AI',
  description: 'Assistant Intelligent Professionnel',
  systemInstruction: "Tu es NeuroChat Pro, un assistant IA avancé pour les professionnels. Tu es précis, concis et utile. Ce projet est développé par Maysson.",
  voiceName: 'Zephyr',
  themeColor: '#0ea5e9', // Sky Blue 500 (matches brand)
};

// Pour compatibilité avec le code existant
export const PERSONALITIES: Personality[] = [DEFAULT_PERSONALITY];

// Voix disponibles pour Gemini Live
export interface VoiceOption {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const AVAILABLE_VOICES: VoiceOption[] = [
  {
    id: 'Puck',
    name: 'Puck',
    description: 'Voix enjouée et énergique',
    icon: '🎭'
  },
  {
    id: 'Charon',
    name: 'Charon',
    description: 'Voix grave et posée',
    icon: '🌊'
  },
  {
    id: 'Kore',
    name: 'Kore',
    description: 'Voix douce et chaleureuse',
    icon: '🌸'
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    description: 'Voix puissante et assurée',
    icon: '🐺'
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    description: 'Voix légère et apaisante',
    icon: '🌬️'
  },
  {
    id: 'Aoede',
    name: 'Aoede',
    description: 'Voix sophistiquée et articulée',
    icon: '🎼'
  },
   
];