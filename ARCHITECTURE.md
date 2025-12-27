# 🏗️ Architecture de NeuroChat Live Pro

Documentation technique de l'architecture de l'application.

---

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Architecture Frontend](#architecture-frontend)
- [Flux de données](#flux-de-données)
- [Gestion de l'audio](#gestion-de-laudio)
- [Gestion de la vision](#gestion-de-la-vision)
- [Système de personnalités](#système-de-personnalités)
- [Outils et Function Calling](#outils-et-function-calling)
- [Persistance des données](#persistance-des-données)
- [PWA et Service Workers](#pwa-et-service-workers)
- [Sécurité](#sécurité)

---

## 🎯 Vue d'ensemble

NeuroChat Live Pro est une **application frontend monolithique** construite avec React et TypeScript. L'application communique directement avec l'API Google Gemini Live via WebSocket pour des conversations vocales en temps réel.

### Schéma général

```
┌─────────────────────────────────────────────────────────────┐
│                    Navigateur Web                           │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              React Application (Frontend)            │  │
│  │                                                       │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │  │
│  │  │   App.tsx    │  │  Components  │  │   Hooks   │ │  │
│  │  │  (Main)      │  │              │  │           │ │  │
│  │  └──────┬───────┘  └──────┬──────┘  └─────┬─────┘ │  │
│  │         │                  │                │        │  │
│  │  ┌──────▼──────────────────▼────────────────▼────┐  │  │
│  │  │         State Management (React Hooks)         │  │  │
│  │  │  - useStatusManager                            │  │  │
│  │  │  - useAudioManager                             │  │  │
│  │  │  - useVisionManager                             │  │  │
│  │  │  - useLocalStorageState                        │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │                                                       │  │
│  │  ┌───────────────────────────────────────────────┐   │  │
│  │  │         Web Audio API                         │   │  │
│  │  │  - AudioContext (Input/Output)                │   │  │
│  │  │  - MediaStream (Microphone)                    │   │  │
│  │  │  - AnalyserNode (Visualization)                │   │  │
│  │  └───────────────────────────────────────────────┘   │  │
│  │                                                       │  │
│  │  ┌───────────────────────────────────────────────┐   │  │
│  │  │         MediaStream API                        │   │  │
│  │  │  - Camera                                      │   │  │
│  │  │  - Screen Share                                 │   │  │
│  │  └───────────────────────────────────────────────┘   │  │
│  │                                                       │  │
│  │  ┌───────────────────────────────────────────────┐   │  │
│  │  │         localStorage                            │   │  │
│  │  │  - Notes, Events, Work Hours, etc.             │   │  │
│  │  └───────────────────────────────────────────────┘   │  │
│  └───────────────────────┬───────────────────────────────┘  │
│                          │                                    │
│                          │ WebSocket (Gemini Live API)        │
│                          │                                    │
└──────────────────────────┼────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Google Gemini Live API                           │
│  - Model: gemini-2.5-flash-native-audio-preview-09-2025     │
│  - Real-time audio streaming                                 │
│  - Function calling                                          │
│  - Vision (video frames)                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Architecture Frontend

### Structure modulaire

L'application suit une architecture **modulaire par fonctionnalité** :

```
App.tsx (Root)
├── Header (Navigation & Settings)
├── ControlPanel (Main Controls)
├── Visualizer (Audio Visualization)
├── VideoOverlay (Camera/Screen Share)
├── PersonalityEditor (Personality Management)
├── NotesViewer (Notes Management)
├── TasksViewer (Work Hours Management)
├── AgendaViewer (Events Management)
├── ToolsList (Available Tools)
└── ToastContainer (Notifications)
```

### Composants principaux

#### `App.tsx`
- **Rôle** : Composant racine, orchestration globale
- **Responsabilités** :
  - Gestion de la connexion Gemini Live
  - Coordination des hooks personnalisés
  - Gestion de l'état global (connexion, personnalité, documents)
  - Gestion des événements audio/vidéo

#### `Header.tsx`
- **Rôle** : Barre de navigation et paramètres
- **Fonctionnalités** :
  - Sélection de personnalité
  - Sélection de voix
  - Upload de documents
  - Toggle des outils (Function Calling, Google Search)

#### `ControlPanel.tsx`
- **Rôle** : Panneau de contrôle principal
- **Fonctionnalités** :
  - Boutons Connect/Disconnect
  - Toggle vidéo/caméra
  - Toggle wake word
  - Indicateur de latence
  - Visualisation audio input

---

## 🔄 Flux de données

### Connexion et conversation

```
1. User clicks "Connect"
   ↓
2. App.tsx → connect()
   ↓
3. Initialize AudioContext (Input/Output)
   ↓
4. GetUserMedia (Microphone)
   ↓
5. Create Gemini Live Session
   ├── System Instruction (Personality + Documents)
   ├── Tools Config (Function Calling, Google Search)
   └── Voice Config
   ↓
6. WebSocket Connection Established
   ↓
7. Audio Streaming Loop:
   ├── Input: Microphone → ScriptProcessor → PCM Blob → Gemini API
   └── Output: Gemini API → Base64 Audio → AudioBuffer → Speakers
   ↓
8. Real-time Conversation
   ├── User speaks → Transcription → Response
   ├── Function Calls → Execute → Response
   └── Vision (if enabled) → Frame Analysis → Response
```

### Gestion des états

```
ConnectionState (Enum)
├── DISCONNECTED
├── CONNECTING
├── CONNECTED
└── ERROR

State Flow:
DISCONNECTED → CONNECTING → CONNECTED
                ↓
              ERROR → (Auto-reconnect) → CONNECTING
```

---

## 🎤 Gestion de l'audio

### Architecture audio

```
┌─────────────────────────────────────────────────┐
│           Input Audio Pipeline                   │
│                                                  │
│  Microphone                                     │
│     ↓                                           │
│  MediaStream                                    │
│     ↓                                           │
│  MediaStreamAudioSourceNode                      │
│     ↓                                           │
│  ScriptProcessorNode (2048 samples)             │
│     ├──→ AnalyserNode (Visualization)           │
│     └──→ PCM Blob → Gemini Live API            │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│          Output Audio Pipeline                   │
│                                                  │
│  Gemini Live API (Base64 Audio)                  │
│     ↓                                           │
│  Base64 → ArrayBuffer                            │
│     ↓                                           │
│  decodeAudioData() → AudioBuffer                 │
│     ↓                                           │
│  AudioBufferSourceNode                           │
│     ↓                                           │
│  GainNode (Volume Control)                       │
│     ↓                                           │
│  AnalyserNode (Visualization)                    │
│     ↓                                           │
│  AudioContext.destination (Speakers)             │
└─────────────────────────────────────────────────┘
```

### Configuration audio

```typescript
DEFAULT_AUDIO_CONFIG = {
  inputSampleRate: 16000,   // 16 kHz (optimisé pour la voix)
  outputSampleRate: 24000   // 24 kHz (qualité supérieure)
}
```

### Optimisations

- **Buffer size réduit** (2048 samples) pour latence minimale
- **VAD (Voice Activity Detection)** simple pour tracking de latence
- **Gestion des sources audio** multiples (queue de lecture)
- **Synchronisation temporelle** avec `nextStartTimeRef`

---

## 👁️ Gestion de la vision

### Architecture vision

```
┌─────────────────────────────────────────────────┐
│         Video Input Pipeline                     │
│                                                  │
│  Camera / Screen Share                          │
│     ↓                                           │
│  MediaStream                                    │
│     ↓                                           │
│  <video> Element                                │
│     ↓                                           │
│  <canvas> Element (Frame Capture)               │
│     ↓                                           │
│  Canvas.toDataURL() → Base64 Image              │
│     ↓                                           │
│  Gemini Live API (sendRealtimeInput)            │
└─────────────────────────────────────────────────┘
```

### Hook `useVisionManager`

Gère :
- Énumération des caméras disponibles
- Changement de caméra
- Activation/désactivation de la vidéo
- Partage d'écran
- Transmission des frames (toutes les 2 secondes ou sur changement significatif)

### Détection de changements

- **Analyse de différence** entre frames
- **Seuil de changement** configurable
- **Transmission conditionnelle** (seulement si changement détecté)

---

## 🎭 Système de personnalités

### Structure d'une personnalité

```typescript
interface Personality {
  id: string;                    // Identifiant unique
  name: string;                  // Nom affiché
  description: string;          // Description courte
  systemInstruction: string;     // Instructions système (prompt)
  voiceName: string;             // Voix Gemini (Puck, Charon, etc.)
  themeColor: string;           // Couleur du thème (#hex)
}
```

### Flux de personnalité

```
1. User selects/edits personality
   ↓
2. Save to localStorage (via useLocalStorageState)
   ↓
3. Update currentPersonalityRef
   ↓
4. If connected → Reconnect with new system instruction
   ↓
5. UI updates (theme colors, visual effects)
```

### Instructions système

Les instructions sont combinées dans `systemConfig.ts` :

```
BASE_SYSTEM_RULES (invisible, non modifiable)
  +
PERSONALITY_INSTRUCTION (modifiable par l'utilisateur)
  +
DOCUMENTS_CONTEXT (si documents uploadés)
  =
FINAL_SYSTEM_INSTRUCTION
```

---

## 🔧 Outils et Function Calling

### Architecture des outils

```
┌─────────────────────────────────────────────────┐
│         Function Calling Flow                    │
│                                                  │
│  User Request (Voice/Text)                      │
│     ↓                                           │
│  Gemini API (with tools enabled)                │
│     ↓                                           │
│  Tool Call Detected (message.toolCall)          │
│     ↓                                           │
│  executeFunction(functionCall)                  │
│     ├──→ Switch case → Function Logic           │
│     ├──→ localStorage (if needed)               │
│     └──→ Return Result                          │
│     ↓                                           │
│  sendToolResponse({ functionResponses })        │
│     ↓                                           │
│  Gemini API → Final Response                    │
└─────────────────────────────────────────────────┘
```

### Définition des outils

Les outils sont définis dans `utils/tools.ts` :

```typescript
AVAILABLE_FUNCTIONS = {
  'save_note': {
    name: 'save_note',
    description: '...',
    parameters: { ... }
  },
  // ... 30+ autres outils
}
```

### Configuration des outils

```typescript
buildToolsConfig(
  enableFunctionCalling: boolean,
  enableGoogleSearch: boolean
): ToolConfig[]
```

---

## 💾 Persistance des données

### localStorage

Toutes les données utilisateur sont stockées dans `localStorage` :

| Clé | Type | Description |
|-----|------|-------------|
| `currentPersonality` | `Personality` | Personnalité actuelle |
| `uploadedDocuments` | `ProcessedDocument[]` | Documents uploadés |
| `wakeWordEnabled` | `boolean` | État wake word |
| `functionCallingEnabled` | `boolean` | État function calling |
| `googleSearchEnabled` | `boolean` | État Google Search |
| `neurochat_notes` | `Note[]` | Notes sauvegardées |
| `neurochat_events` | `Event[]` | Événements agenda |
| `neurochat_work_hours` | `WorkHoursEntry[]` | Heures travaillées |

### Hook `useLocalStorageState`

Hook personnalisé pour la persistance automatique :

```typescript
const [value, setValue] = useLocalStorageState<T>(
  key: string,
  defaultValue: T,
  options?: {
    deserialize?: (raw: string) => T;
    serialize?: (value: T) => string;
    validate?: (value: unknown) => value is T;
    onError?: (error: unknown) => void;
  }
);
```

**Fonctionnalités** :
- ✅ Synchronisation automatique avec localStorage
- ✅ Validation optionnelle
- ✅ Gestion d'erreurs
- ✅ Désérialisation personnalisée

---

## 📱 PWA et Service Workers

### Architecture PWA

```
┌─────────────────────────────────────────────────┐
│              Service Worker                      │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │         Cache Strategy                    │  │
│  │                                           │  │
│  │  • Fonts: CacheFirst (1 an)              │  │
│  │  • API: NetworkFirst (5 min)              │  │
│  │  • Assets: CacheFirst (versioning)        │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │         Offline Support                    │  │
│  │                                           │  │
│  │  • Cache des assets statiques             │  │
│  │  • Pas de cache pour API (toujours online)│ │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Manifest

Défini dans `vite.config.ts` :

- **Name** : "NeuroChat Pro • Assistant IA Professionnel"
- **Short Name** : "NeuroChat Pro"
- **Theme Color** : `#6366f1` (Indigo)
- **Background Color** : `#0f172a` (Slate 900)
- **Display** : `standalone`
- **Icons** : 192x192, 512x512

---

## 🔒 Sécurité

### Clé API

- ✅ Stockée dans `.env` (non commitée)
- ✅ Injectée via Vite `define`
- ✅ Accessible uniquement côté client (nécessaire pour Gemini Live)
- ⚠️ **Note** : Les clés API côté client sont exposées. Utiliser des restrictions d'API dans Google Cloud Console.

### Recommandations

1. **Restreindre les domaines** dans Google Cloud Console
2. **Limiter les quotas** d'API
3. **Surveiller l'utilisation** via Google Cloud Console
4. **Ne jamais commiter** `.env` ou clés API

### Données utilisateur

- ✅ Toutes les données stockées localement (localStorage)
- ✅ Pas de transmission vers serveurs tiers (sauf Gemini API)
- ✅ Pas de tracking ou analytics intégrés

---

## 📊 Performance

### Optimisations

1. **Code splitting** : React et Google GenAI en chunks séparés
2. **Lazy loading** : Composants chargés à la demande
3. **Memoization** : `useCallback`, `useMemo` pour éviter re-renders
4. **Audio buffering** : Gestion optimisée des buffers audio
5. **Frame skipping** : Vision ne transmet que les frames significatifs

### Métriques

- **Latence audio** : < 500ms (idéalement < 200ms)
- **Taille bundle** : ~1.2MB (avec code splitting)
- **First Contentful Paint** : < 1s
- **Time to Interactive** : < 2s

---

## 🔄 Reconnection & Error Handling

### Stratégie de reconnexion

```
Connection Lost
  ↓
Exponential Backoff:
  Attempt 1: 1s delay
  Attempt 2: 2s delay
  Attempt 3: 4s delay
  Attempt 4: 8s delay
  Attempt 5: 10s delay (max)
  ↓
Max Attempts Reached → ERROR State
```

### Gestion des erreurs

- ✅ Toast notifications pour erreurs utilisateur
- ✅ Logs console pour debugging
- ✅ États d'erreur visuels dans l'UI
- ✅ Nettoyage automatique des ressources

---

## 🚀 Évolutions futures

Voir [ROADMAP.md](./ROADMAP.md) pour les évolutions prévues.

---

**Dernière mise à jour** : 2025

