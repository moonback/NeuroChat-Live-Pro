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