export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

export interface Personality {
  id: string;
  name: string;
  description: string;
  systemInstruction: string;
  voiceName: string; // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
  themeColor: string;
}

export interface AudioConfig {
  inputSampleRate: number;
  outputSampleRate: number;
}

export const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  inputSampleRate: 16000,
  outputSampleRate: 24000,
};

// Types pour les outils de l'API Live
export interface FunctionDeclaration {
  name: string;
  description?: string;
  parameters?: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
  };
}

export interface ToolConfig {
  functionDeclarations?: FunctionDeclaration[];
  googleSearch?: {};
}

export interface FunctionCall {
  id: string;
  name: string;
  args?: Record<string, any>;
}

export interface FunctionResponse {
  id: string;
  name: string;
  response: any;
}

export interface ToolCall {
  functionCalls: FunctionCall[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  personalityId: string;
}

// Extension globale de l'objet Window pour Electron
declare global {
  interface Window {
    ipcRenderer?: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      send: (channel: string, ...args: any[]) => void;
      on: (channel: string, func: (...args: any[]) => void) => void;
      off: (channel: string, func: (...args: any[]) => void) => void;
    };
  }
}
