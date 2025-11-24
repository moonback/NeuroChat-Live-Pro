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

/**
 * Type de message dans une conversation
 */
export enum MessageType {
  USER = 'user',
  ASSISTANT = 'assistant',
}

/**
 * État de transcription d'un message
 */
export enum TranscriptionState {
  INTERMEDIATE = 'intermediate',
  FINAL = 'final',
}

/**
 * Message dans une conversation
 */
export interface ConversationMessage {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  transcriptionState?: TranscriptionState;
  sessionId?: string;
}

/**
 * Session de conversation
 */
export interface ConversationSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  personalityId?: string;
  personalityName?: string;
  isEncrypted: boolean;
  messageCount: number;
}

/**
 * Conversation complète avec messages chiffrés
 */
export interface EncryptedConversation {
  sessionId: string;
  encryptedData: string; // Données chiffrées (JSON de ConversationMessage[])
  metadata: ConversationSession; // Métadonnées non chiffrées
  createdAt: Date;
  updatedAt: Date;
}