# localStorage — NeuroChat Pro (référence)

Ce document recense **toutes les clés `localStorage`** utilisées par l’application et leur rôle (préférences, données utilisateur locales, outils “function calling”).

> ✅ Dans l’état actuel, il n’y a **pas** de backend.  
> Les “endpoints” auxquels l’IA a accès sont des **fonctions locales** (tool calling) définies dans `utils/tools.ts`, certaines persistant leurs données dans `localStorage`.

---

## 1) Résumé (table)

| Clé | Type | Propriétaire | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | env (pas localStorage) | build | Variable d’environnement lue par Vite et injectée en `process.env.API_KEY` |
| `currentPersonality` | `Personality` | `App.tsx` | Personnalité active (instructions système, thème, voix) |
| `uploadedDocuments` | `ProcessedDocument[]` | `App.tsx` | Documents uploadés (métadonnées + contenu pré-traité) |
| `wakeWordEnabled` | `boolean` | `App.tsx` | Activation du wake word (“bonjour”) |
| `functionCallingEnabled` | `boolean` | `App.tsx` | Active/désactive les tool calls |
| `googleSearchEnabled` | `boolean` | `App.tsx` | Active/désactive l’outil Google Search (Gemini) |
| `selectedCameraId` | `string` | `useVisionManager.ts` | Caméra sélectionnée (deviceId) |
| `hasSeenQuickStart` | `boolean` | `QuickStartGuide.tsx` | Flag onboarding |
| `neurochat_notes` | `Note[]` | `utils/tools.ts`, `NotesViewer.tsx` | Notes (créées via tool calling ou UI) |
| `neurochat_events` | `Event[]` | `utils/tools.ts`, `AgendaViewer.tsx` | Agenda/événements (créés via tool calling ou UI) |
| `neurochat_work_hours` | `WorkHoursEntry[]` | `utils/tools.ts`, `TasksViewer.tsx` | Heures travaillées (log via tool calling ou UI) |

---

## 2) Schémas (Types)

### 2.1 `Personality` (clé: `currentPersonality`)

```ts
export interface Personality {
  id: string;
  name: string;
  description: string;
  systemInstruction: string;
  voiceName: string;
  themeColor: string;
}
```

### 2.2 `uploadedDocuments` (clé: `uploadedDocuments`)

Type: `ProcessedDocument[]` (défini dans `utils/documentProcessor.ts`).  
La date `uploadedAt` est re-hydratée en `Date` dans `App.tsx`.

> ⚠️ En pratique, ce tableau peut devenir volumineux : `localStorage` a une capacité limitée. Pour la V1, préférer `IndexedDB` ou un stockage backend.

### 2.3 Notes (clé: `neurochat_notes`)

Source: `utils/tools.ts` + `components/NotesViewer.tsx`

```ts
interface Note {
  id: string;          // Date.now().toString()
  title: string;
  content: string;
  createdAt: string;   // ISO string
}
```

### 2.4 Agenda (clé: `neurochat_events`)

Source: `utils/tools.ts` + `components/AgendaViewer.tsx`

```ts
interface Event {
  id: string;          // Date.now().toString()
  title: string;
  date: string;        // YYYY-MM-DD
  time: string;        // HH:MM
  endTime: string;     // HH:MM (calculé si absent)
  description: string;
  location: string;
  type: string;        // work | meeting | personal | ...
  createdAt: string;   // ISO string
}
```

### 2.5 Heures travaillées (clé: `neurochat_work_hours`)

Source: `utils/tools.ts` + `components/TasksViewer.tsx`

```ts
interface WorkHoursEntry {
  id: string;          // Date.now().toString()
  date: string;        // YYYY-MM-DD
  hours: number;
  project: string;
  description: string;
  createdAt: string;   // ISO string
}
```

---

## 3) “Endpoints” disponibles (tool calling)

Les outils disponibles côté modèle sont déclarés dans `utils/tools.ts` (`AVAILABLE_FUNCTIONS`).  
Ci-dessous, on liste les principaux “endpoints” qui **touchent `localStorage`** (les utilitaires purs ne persistent rien).

### 3.1 Notes

| Fonction | Effet | Clé |
|---|---|---|
| `save_note({title, content})` | Ajoute une note | `neurochat_notes` |
| `get_notes()` | Lit toutes les notes | `neurochat_notes` |
| `delete_note({noteId? , title?})` | Supprime une note | `neurochat_notes` |
| `delete_all_notes()` | Purge toutes les notes | `neurochat_notes` |

### 3.2 Agenda / événements

| Fonction | Effet | Clé |
|---|---|---|
| `create_event({...})` | Ajoute un événement (calcule `endTime` si besoin) | `neurochat_events` |
| `get_events({startDate?, endDate?, date?, type?})` | Liste filtrée/triée | `neurochat_events` |
| `get_upcoming_events({days?})` | Liste les prochains événements | `neurochat_events` |
| `delete_event({eventId})` | Supprime un événement | `neurochat_events` |

### 3.3 Heures travaillées

| Fonction | Effet | Clé |
|---|---|---|
| `log_work_hours({date?, hours, project, description?})` | Ajoute une entrée | `neurochat_work_hours` |
| `get_work_hours({startDate?, endDate?, project?})` | Liste filtrée + total | `neurochat_work_hours` |
| `get_work_hours_summary({period?})` | Résumé (par jour/projet) | `neurochat_work_hours` |
| `delete_work_hours({entryId})` | Supprime une entrée | `neurochat_work_hours` |

---

## 4) Préférences / UX

### 4.1 `selectedCameraId`

- **Défini par**: `hooks/useVisionManager.ts`
- **Rôle**: mémoriser la caméra préférée (deviceId)

### 4.2 `hasSeenQuickStart`

- **Défini par**: `components/QuickStartGuide.tsx`
- **Rôle**: ne pas réafficher l’onboarding

---

## 5) Bonnes pratiques & migrations

### Recommandations

- **Versionner** le schéma (ex: `neurochat_storage_version: number`)
- Prévoir un **plan de migration** (ex: renommer clé, normaliser `type`, etc.)
- Éviter d’y stocker des blobs ou textes énormes (préférer `IndexedDB`)

### Proposition (optionnelle)

Ajouter:
- `neurochat_storage_version`
- `neurochat_user_profile` (si un jour auth)
- `neurochat_conversations` (si historique/transcriptions)


