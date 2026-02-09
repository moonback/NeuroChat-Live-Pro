# Database & Storage Schema - NeuroChat Live Pro

The application follows a **Local-First** approach. There is no centralized backend; all data is stored on the user's machine using **LocalStorage** (for user preferences and lightweight state) and the **Local File System** (for personality files and history).

## 💾 LocalStorage Schema

The application uses `zustand/middleware/persist` for most of the state.

### 1. `neurochat-settings`
Stores the global app settings.
| Key | Type | Description |
|-----|------|-------------|
| `currentPersonalityId` | `string` | ID of the active assistant personality. |
| `isFunctionCallingEnabled` | `boolean` | Whether the assistant can call tools. |
| `isGoogleSearchEnabled` | `boolean` | Whether real-time web search is enabled. |
| `preferredVoice` | `string` | Selected TTS voice (e.g., 'Kore'). |
| `themeColor` | `string` | Accent color for the UI. |

### 2. `neurochat-documents`
Stores metadata and content of processed documents.
| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique identifier (UUID). |
| `name` | `string` | Filename. |
| `content` | `string` | Extracted text content. |
| `type` | `string` | MIME type (pdf, txt, md). |
| `size` | `number` | File size in bytes. |

### 3. `neurochat-conclusions` (Zustand: `SavedConclusion[]`)
Stores the history of generated conclusions.
| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique identifier. |
| `title` | `string` | Conclusion title. |
| `content` | `string` | Raw conclusion text. |
| `markdown` | `string` | Formatted markdown document. |
| `createdAt` | `string` | ISO timestamp. |

## 📁 File System Schema (Electron `userData`)

Files are stored in the application's private data folder (e.g., `%APPDATA%/NeuroChat-Live-Pro`).

### 1. `personality-files/`
Editable markdown files that define the AI's memory and knowledge.
- `SOUL.md`: Core personality and directives.
- `USER.md`: Information the AI knows about the user.
- `MEMORY.md`: Long-term memory and past context.

### 2. `history.json`
Stores the recent chat history (not yet fully implemented in MVP but reserved).

## 🔒 Security Note
- **No Encryption**: Data in LocalStorage and the file system is currently not encrypted.
- **Privacy**: No data leaves the local machine except for requests to the Google Gemini API.
