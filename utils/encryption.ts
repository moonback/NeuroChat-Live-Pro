/**
 * Système de chiffrement bout-en-bout pour les conversations privées
 * Utilise Web Crypto API pour un chiffrement AES-GCM sécurisé
 */

// Configuration du chiffrement
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256; // bits
const IV_LENGTH = 12; // bytes pour GCM
const TAG_LENGTH = 128; // bits
const KEY_DERIVATION_ITERATIONS = 100000; // PBKDF2 iterations

/**
 * Génère une clé de chiffrement aléatoire
 */
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Dérive une clé de chiffrement à partir d'un mot de passe
 */
export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: KEY_DERIVATION_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Exporte une clé de chiffrement en format base64
 */
export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey('raw', key);
  const exportedArrayBuffer = new Uint8Array(exported);
  return arrayBufferToBase64(exportedArrayBuffer);
}

/**
 * Importe une clé de chiffrement depuis un format base64
 */
export async function importKey(keyData: string): Promise<CryptoKey> {
  const keyBuffer = base64ToArrayBuffer(keyData);
  return await window.crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Chiffre un texte en utilisant une clé
 */
export async function encryptText(
  text: string,
  key: CryptoKey
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  // Générer un IV aléatoire
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Chiffrer les données
  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv: iv,
      tagLength: TAG_LENGTH,
    },
    key,
    data
  );

  // Combiner IV + données chiffrées
  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedData), iv.length);

  // Convertir en base64 pour stockage
  return arrayBufferToBase64(combined);
}

/**
 * Déchiffre un texte chiffré
 */
export async function decryptText(
  encryptedData: string,
  key: CryptoKey
): Promise<string> {
  // Convertir depuis base64
  const combined = base64ToArrayBuffer(encryptedData);
  const combinedArray = new Uint8Array(combined);

  // Extraire IV et données chiffrées
  const iv = combinedArray.slice(0, IV_LENGTH);
  const ciphertext = combinedArray.slice(IV_LENGTH);

  // Déchiffrer
  const decryptedData = await window.crypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv: iv,
      tagLength: TAG_LENGTH,
    },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedData);
}

/**
 * Chiffre un objet JSON
 */
export async function encryptObject<T>(
  obj: T,
  key: CryptoKey
): Promise<string> {
  const jsonString = JSON.stringify(obj);
  return await encryptText(jsonString, key);
}

/**
 * Déchiffre un objet JSON
 */
export async function decryptObject<T>(
  encryptedData: string,
  key: CryptoKey
): Promise<T> {
  const decryptedText = await decryptText(encryptedData, key);
  return JSON.parse(decryptedText);
}

/**
 * Génère un salt aléatoire pour la dérivation de clé
 */
export function generateSalt(): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Convertit un ArrayBuffer en base64
 */
function arrayBufferToBase64(buffer: Uint8Array): string {
  const binary = Array.from(buffer, (byte) => String.fromCharCode(byte)).join('');
  return btoa(binary);
}

/**
 * Convertit base64 en ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Gestionnaire de clé de chiffrement pour l'application
 * Stocke la clé de manière sécurisée dans le navigateur
 */
export class EncryptionKeyManager {
  private static readonly STORAGE_KEY = 'neurochat_encryption_key';
  private static readonly STORAGE_SALT = 'neurochat_encryption_salt';
  private static keyCache: CryptoKey | null = null;

  /**
   * Initialise ou récupère la clé de chiffrement de l'application
   */
  static async getOrCreateKey(): Promise<CryptoKey> {
    if (this.keyCache) {
      return this.keyCache;
    }

    try {
      // Vérifier si une clé existe déjà
      const storedKey = localStorage.getItem(this.STORAGE_KEY);
      const storedSalt = localStorage.getItem(this.STORAGE_SALT);

      if (storedKey && storedSalt) {
        // Importer la clé existante
        this.keyCache = await importKey(storedKey);
        return this.keyCache;
      }

      // Créer une nouvelle clé
      const newKey = await generateEncryptionKey();
      const exportedKey = await exportKey(newKey);
      localStorage.setItem(this.STORAGE_KEY, exportedKey);

      // Générer et stocker un salt (pour dérivation future si besoin)
      const salt = generateSalt();
      localStorage.setItem(this.STORAGE_SALT, arrayBufferToBase64(salt));

      this.keyCache = newKey;
      return newKey;
    } catch (error) {
      console.error('[Encryption] Erreur lors de la gestion de la clé:', error);
      throw new Error('Impossible d\'initialiser le chiffrement');
    }
  }

  /**
   * Réinitialise la clé de chiffrement (à utiliser avec précaution)
   */
  static async resetKey(): Promise<CryptoKey> {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.STORAGE_SALT);
    this.keyCache = null;
    return await this.getOrCreateKey();
  }

  /**
   * Vérifie si une clé existe
   */
  static hasKey(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }
}

