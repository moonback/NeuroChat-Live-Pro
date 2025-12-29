# 💾 Documentation LocalStorage - NeuroChat Live Pro

> Guide complet du stockage local côté client pour la persistance des données utilisateur

---

## 📋 Vue d'Ensemble

**NeuroChat Live Pro** utilise exclusivement le **LocalStorage** du navigateur pour persister les données utilisateur. Il n'y a **pas de backend** ni de base de données serveur. Toutes les données sont stockées localement sur l'appareil de l'utilisateur.

### Pourquoi LocalStorage ?

✅ **Simplicité** : Pas de serveur à gérer  
✅ **Rapidité** : Accès instantané aux données  
✅ **Gratuité** : Pas de coûts d'hébergement  
✅ **Confidentialité** : Données uniquement sur l'appareil utilisateur  
✅ **Offline-first** : Fonctionne sans connexion internet

### Limites du LocalStorage

⚠️ **Quota limité** : ~5-10 MB selon navigateur  
⚠️ **Non chiffré** : Données lisibles en clair  
⚠️ **Par domaine** : Données isolées par origine  
⚠️ **Non partagé** : Pas de synchronisation multi-appareils  
⚠️ **Effaçable** : L'utilisateur peut vider le cache navigateur

---

## 🗂️ Structure des Données

### Clés Principales

| Clé LocalStorage | Type | Taille estimée | Description |
|------------------|------|----------------|-------------|
| `currentPersonality` | `Personality` | ~5-10 KB | Personnalité IA active |
| `uploadedDocuments` | `ProcessedDocument[]` | ~100-500 KB | Documents uploadés (base64) |
| `wakeWordEnabled` | `boolean` | ~10 bytes | Wake word activé/désactivé |
| `functionCallingEnabled` | `boolean` | ~10 bytes | Function calling activé |
| `googleSearchEnabled` | `boolean` | ~10 bytes | Google Search activé |

---

## 📦 Types de Données

### 1. Personality (Personnalité IA)

**Structure :**
```typescript
interface Personality {
  id: string;                  // Identifiant unique (ex: 'neurochat-coldcase')
  name: string;                // Nom affiché (ex: 'Analyste Cold Case')
  description: string;         // Description courte (1 ligne)
  systemInstruction: string;   // Prompt système complet (peut être long)
  voiceName: string;           // Voix TTS ('Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' | 'Aoede')
  themeColor: string;          // Couleur hex (#RRGGBB)
}
```

**Exemple JSON Stocké :**
```json
{
  "id": "general",
  "name": "Assistant TDAH/HPI",
  "description": "Assistant polyvalent expert en synthèse et organisation",
  "systemInstruction": "Tu es un Coach spécialisé en accompagnement...",
  "voiceName": "Zephyr",
  "themeColor": "#4f46e5"
}
```

**Clé LocalStorage :** `currentPersonality`

**Opérations :**
```typescript
// Lecture
const storedPersonality = localStorage.getItem('currentPersonality');
const personality: Personality = JSON.parse(storedPersonality);

// Écriture
localStorage.setItem('currentPersonality', JSON.stringify(personality));

// Suppression
localStorage.removeItem('currentPersonality');
```

**Gestion via Hook :**
```typescript
const [currentPersonality, setCurrentPersonality] = useLocalStorageState<Personality>(
  'currentPersonality',
  DEFAULT_PERSONALITY,  // Valeur par défaut
  {
    validate: isPersonality,  // Fonction de validation
    onError: (e) => console.warn('Erreur chargement personnalité:', e)
  }
);
```

---

### 2. ProcessedDocument[] (Documents Uploadés)

**Structure :**
```typescript
interface ProcessedDocument {
  id: string;                  // UUID généré
  name: string;                // Nom du fichier (ex: 'rapport.pdf')
  type: 'pdf' | 'txt' | 'md';  // Type MIME simplifié
  size: number;                // Taille en bytes
  content: string;             // Contenu texte extrait
  uploadedAt: Date;            // Date d'upload (ISO 8601)
  metadata?: {
    pages?: number;            // Nombre de pages (PDF uniquement)
    language?: string;         // Langue détectée (optionnel)
  };
}
```

**Exemple JSON Stocké :**
```json
[
  {
    "id": "doc-123e4567-e89b",
    "name": "rapport_enquete.pdf",
    "type": "pdf",
    "size": 524288,
    "content": "Rapport d'enquête\n\nContexte:\nLe 15 janvier 2023...",
    "uploadedAt": "2025-01-15T14:30:00.000Z",
    "metadata": {
      "pages": 12,
      "language": "fr"
    }
  },
  {
    "id": "doc-987f6543-c21a",
    "name": "notes.txt",
    "type": "txt",
    "size": 2048,
    "content": "Notes personnelles:\n- Point 1\n- Point 2",
    "uploadedAt": "2025-01-15T15:00:00.000Z"
  }
]
```

**Clé LocalStorage :** `uploadedDocuments`

**Opérations :**
```typescript
// Lecture avec désérialisation des dates
const storedDocs = localStorage.getItem('uploadedDocuments');
const documents: ProcessedDocument[] = JSON.parse(storedDocs).map(doc => ({
  ...doc,
  uploadedAt: new Date(doc.uploadedAt)
}));

// Ajout d'un document
const newDoc: ProcessedDocument = {
  id: crypto.randomUUID(),
  name: file.name,
  type: getFileType(file),
  size: file.size,
  content: await extractContent(file),
  uploadedAt: new Date()
};
documents.push(newDoc);
localStorage.setItem('uploadedDocuments', JSON.stringify(documents));

// Suppression d'un document
const filtered = documents.filter(doc => doc.id !== idToDelete);
localStorage.setItem('uploadedDocuments', JSON.stringify(filtered));
```

**Gestion via Hook :**
```typescript
const [uploadedDocuments, setUploadedDocuments] = useLocalStorageState<ProcessedDocument[]>(
  'uploadedDocuments',
  [],
  {
    deserialize: (raw) => {
      const parsed = JSON.parse(raw);
      return parsed.map((doc: any) => ({
        ...doc,
        uploadedAt: new Date(doc.uploadedAt)
      }));
    },
    validate: (v) => Array.isArray(v),
    onError: (e) => console.warn('Erreur chargement documents:', e)
  }
);
```

**⚠️ Attention à la Taille :**
- Un PDF de 5 pages ≈ 50-100 KB de texte extrait
- Un PDF de 50 pages ≈ 500 KB - 1 MB
- **Limite recommandée** : Max 10 documents ou 2 MB au total

---

### 3. Préférences Booléennes

#### 3.1 Wake Word Enabled

**Structure :**
```typescript
wakeWordEnabled: boolean
```

**Stockage :**
```typescript
// Sérialisation
localStorage.setItem('wakeWordEnabled', 'true');  // ou 'false'

// Désérialisation
const isEnabled = localStorage.getItem('wakeWordEnabled') === 'true';
```

**Hook :**
```typescript
const [isWakeWordEnabled, setIsWakeWordEnabled] = useLocalStorageState<boolean>(
  'wakeWordEnabled',
  false,  // Désactivé par défaut
  {
    deserialize: (raw) => raw === 'true',
    serialize: (val) => val ? 'true' : 'false'
  }
);
```

**Comportement :**
- `true` : L'application écoute "Bonjour" ou "Neurochat" en arrière-plan
- `false` : Pas de détection automatique, connexion manuelle uniquement

---

#### 3.2 Function Calling Enabled

**Structure :**
```typescript
functionCallingEnabled: boolean
```

**Comportement :**
- `true` : Gemini peut appeler des fonctions (calculatrice, timer, etc.)
- `false` : Mode conversation pure sans outils

**Valeur par défaut :** `true`

---

#### 3.3 Google Search Enabled

**Structure :**
```typescript
googleSearchEnabled: boolean
```

**Comportement :**
- `true` : Gemini peut effectuer des recherches Google en temps réel
- `false` : Limité aux connaissances pré-entraînées du modèle

**Valeur par défaut :** `false` (pour économiser les requêtes API)

---

## 🔧 Hook Personnalisé `useLocalStorageState`

### Signature

```typescript
function useLocalStorageState<T>(
  key: string,
  defaultValue: T,
  options?: {
    deserialize?: (raw: string) => T;
    serialize?: (value: T) => string;
    validate?: (value: unknown) => value is T;
    onError?: (error: Error) => void;
  }
): [T, React.Dispatch<React.SetStateAction<T>>];
```

### Fonctionnement Interne

```typescript
export function useLocalStorageState<T>(
  key: string,
  defaultValue: T,
  options: LocalStorageOptions<T> = {}
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const {
    deserialize = (raw: string) => JSON.parse(raw),
    serialize = (value: T) => JSON.stringify(value),
    validate = () => true,
    onError = (e) => console.error(e),
  } = options;

  // 1. Initialisation : Charger depuis localStorage
  const [state, setState] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      
      const deserialized = deserialize(item);
      
      // Validation des données
      if (!validate(deserialized)) {
        console.warn(`Validation échouée pour ${key}, utilisation valeur par défaut`);
        return defaultValue;
      }
      
      return deserialized;
    } catch (error) {
      onError(error as Error);
      return defaultValue;
    }
  });

  // 2. Synchronisation : Sauvegarder à chaque changement
  useEffect(() => {
    try {
      const serialized = serialize(state);
      localStorage.setItem(key, serialized);
    } catch (error) {
      onError(error as Error);
    }
  }, [key, state, serialize, onError]);

  return [state, setState];
}
```

### Exemples d'Utilisation

#### Cas Simple (String)

```typescript
const [userName, setUserName] = useLocalStorageState('userName', 'Anonyme');

// Usage
setUserName('Alice');  // Sauvegarde automatique
```

#### Cas Complexe (Objet avec Validation)

```typescript
interface Settings {
  theme: 'light' | 'dark';
  volume: number;
}

const isSettings = (value: unknown): value is Settings => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'theme' in value &&
    'volume' in value
  );
};

const [settings, setSettings] = useLocalStorageState<Settings>(
  'appSettings',
  { theme: 'dark', volume: 0.8 },
  {
    validate: isSettings,
    onError: (e) => console.error('Erreur settings:', e)
  }
);
```

---

## 🧹 Gestion du Quota LocalStorage

### Vérifier l'Espace Utilisé

```typescript
function getLocalStorageSize(): number {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      const value = localStorage.getItem(key);
      total += key.length + (value?.length || 0);
    }
  }
  return total;  // En caractères (≈ bytes pour ASCII)
}

// Afficher en KB
console.log(`LocalStorage utilisé: ${(getLocalStorageSize() / 1024).toFixed(2)} KB`);
```

### Nettoyer les Anciennes Données

```typescript
function cleanupOldDocuments(maxAge: number = 30) {
  const docs = JSON.parse(localStorage.getItem('uploadedDocuments') || '[]');
  const now = Date.now();
  const maxAgeMs = maxAge * 24 * 60 * 60 * 1000;  // jours → ms
  
  const filtered = docs.filter((doc: ProcessedDocument) => {
    const uploadedAt = new Date(doc.uploadedAt).getTime();
    return now - uploadedAt < maxAgeMs;
  });
  
  localStorage.setItem('uploadedDocuments', JSON.stringify(filtered));
  console.log(`Nettoyage: ${docs.length - filtered.length} documents supprimés`);
}
```

### Gérer le Quota Plein

```typescript
async function uploadDocumentWithQuotaCheck(file: File) {
  try {
    const processedDoc = await processDocument(file);
    const currentDocs = JSON.parse(localStorage.getItem('uploadedDocuments') || '[]');
    
    // Estimation de la taille
    const estimatedSize = JSON.stringify(processedDoc).length;
    const currentSize = getLocalStorageSize();
    const QUOTA_LIMIT = 4 * 1024 * 1024;  // 4 MB (conservateur)
    
    if (currentSize + estimatedSize > QUOTA_LIMIT) {
      // Option 1: Supprimer le plus ancien document
      if (currentDocs.length > 0) {
        currentDocs.shift();  // Retirer le premier (plus ancien)
        localStorage.setItem('uploadedDocuments', JSON.stringify(currentDocs));
        console.warn('Document le plus ancien supprimé pour libérer de l\'espace');
      } else {
        throw new Error('Quota LocalStorage atteint, impossible d\'ajouter le document');
      }
    }
    
    // Ajouter le nouveau document
    currentDocs.push(processedDoc);
    localStorage.setItem('uploadedDocuments', JSON.stringify(currentDocs));
    
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      alert('Espace de stockage insuffisant. Veuillez supprimer des documents.');
    }
    throw error;
  }
}
```

---

## 🔒 Sécurité et Confidentialité

### Ce qui EST stocké

✅ Préférences utilisateur (wake word, outils)  
✅ Personnalités personnalisées  
✅ Documents uploadés (contenu texte extrait)  
✅ État UI (thème, sidebar ouverte)

### Ce qui N'EST PAS stocké

❌ Clé API Gemini (uniquement dans `.env`, jamais dans localStorage)  
❌ Historique des conversations  
❌ Audio enregistré  
❌ Images/vidéos capturées  
❌ Tokens d'authentification

### Bonnes Pratiques

1. **Ne jamais stocker de données sensibles** :
   - Pas de mots de passe
   - Pas de tokens API
   - Pas d'informations bancaires

2. **Validation systématique** :
   ```typescript
   // Toujours valider avant désérialisation
   const validate = (data: unknown): data is ValidType => {
     // Vérifications strictes
     return typeof data === 'object' && 'requiredField' in data;
   };
   ```

3. **Gestion d'erreurs** :
   ```typescript
   try {
     const data = JSON.parse(localStorage.getItem('key'));
   } catch (error) {
     // Données corrompues → Utiliser valeur par défaut
     return defaultValue;
   }
   ```

4. **Informer l'utilisateur** :
   - Afficher un message si le quota est atteint
   - Permettre de supprimer manuellement des documents
   - Expliquer que les données sont locales (non synchronisées)

---

## 🧪 Debugging LocalStorage

### DevTools - Onglet Application

**Chrome/Edge :**
1. Ouvrir DevTools (F12)
2. Onglet **Application**
3. Sidebar → **Storage** → **Local Storage**
4. Sélectionner `http://localhost:3000` (ou domaine de prod)

**Firefox :**
1. Ouvrir DevTools (F12)
2. Onglet **Stockage**
3. **Stockage local** → Sélectionner domaine

### Console JavaScript

```javascript
// Lister toutes les clés
Object.keys(localStorage);

// Lire une valeur
localStorage.getItem('currentPersonality');

// Modifier une valeur
localStorage.setItem('wakeWordEnabled', 'false');

// Supprimer une clé
localStorage.removeItem('uploadedDocuments');

// Tout effacer
localStorage.clear();

// Taille totale utilisée
Object.keys(localStorage).reduce((total, key) => {
  return total + localStorage.getItem(key).length;
}, 0) / 1024;  // En KB
```

### Forcer un Reset

```typescript
// Bouton "Reset" dans l'interface (à ajouter si besoin)
function resetAllData() {
  if (confirm('Êtes-vous sûr de vouloir effacer toutes les données locales ?')) {
    localStorage.clear();
    window.location.reload();
  }
}
```

---

## 📊 Monitoring et Analytics

### Tracker l'Usage du LocalStorage

```typescript
// Middleware pour logger les écritures
const originalSetItem = localStorage.setItem.bind(localStorage);
localStorage.setItem = function(key: string, value: string) {
  console.log(`[LocalStorage] SET ${key} (${value.length} chars)`);
  originalSetItem(key, value);
};
```

### Exporter les Données

```typescript
function exportLocalStorageData(): string {
  const data: Record<string, any> = {};
  
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      try {
        data[key] = JSON.parse(localStorage.getItem(key)!);
      } catch {
        data[key] = localStorage.getItem(key);  // Si pas JSON
      }
    }
  }
  
  return JSON.stringify(data, null, 2);
}

// Télécharger en fichier
function downloadBackup() {
  const json = exportLocalStorageData();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `neurochat-backup-${Date.now()}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
}
```

### Importer des Données

```typescript
function importLocalStorageData(json: string) {
  try {
    const data = JSON.parse(json);
    
    for (let key in data) {
      localStorage.setItem(key, JSON.stringify(data[key]));
    }
    
    alert('Données importées avec succès !');
    window.location.reload();
  } catch (error) {
    alert('Erreur lors de l\'import: ' + error.message);
  }
}
```

---

## 🚀 Migration et Versioning

### Gérer les Changements de Structure

**Problème :** Si la structure de `Personality` change, les anciennes données deviennent incompatibles.

**Solution : Versioning**

```typescript
interface VersionedData<T> {
  version: number;
  data: T;
}

// Sauvegarde avec version
function setVersionedItem<T>(key: string, data: T, version: number = 1) {
  const versionedData: VersionedData<T> = { version, data };
  localStorage.setItem(key, JSON.stringify(versionedData));
}

// Lecture avec migration
function getVersionedItem<T>(
  key: string,
  migrations: Record<number, (old: any) => T>
): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  
  const versioned: VersionedData<any> = JSON.parse(raw);
  let data = versioned.data;
  
  // Appliquer les migrations nécessaires
  for (let v = versioned.version + 1; v <= Object.keys(migrations).length; v++) {
    if (migrations[v]) {
      data = migrations[v](data);
    }
  }
  
  return data;
}

// Exemple d'utilisation
const migrations = {
  1: (old: any) => old,  // Version initiale
  2: (old: any) => ({
    ...old,
    newField: 'defaultValue'  // Ajout d'un champ
  }),
  3: (old: any) => {
    const { deprecatedField, ...rest } = old;
    return rest;  // Suppression d'un champ
  }
};

const personality = getVersionedItem<Personality>('currentPersonality', migrations);
```

---

## 📚 Résumé des Commandes

### Lecture

```typescript
// Simple
const value = localStorage.getItem('key');

// Avec parsing JSON
const obj = JSON.parse(localStorage.getItem('key') || '{}');

// Avec hook
const [value, setValue] = useLocalStorageState('key', defaultValue);
```

### Écriture

```typescript
// Simple
localStorage.setItem('key', 'value');

// Avec stringify JSON
localStorage.setItem('key', JSON.stringify({ foo: 'bar' }));

// Avec hook
setValue(newValue);  // Sauvegarde automatique
```

### Suppression

```typescript
// Une clé
localStorage.removeItem('key');

// Toutes les clés
localStorage.clear();
```

### Vérification

```typescript
// Clé existe ?
if (localStorage.getItem('key') !== null) { /* ... */ }

// Nombre de clés
const count = Object.keys(localStorage).length;
```

---

## 🔗 Références

### Documentation MDN

- [LocalStorage API](https://developer.mozilla.org/fr/docs/Web/API/Window/localStorage)
- [Storage API](https://developer.mozilla.org/fr/docs/Web/API/Storage)
- [Web Storage quotas](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)

### Limites par Navigateur

| Navigateur | Quota LocalStorage |
|------------|-------------------|
| Chrome/Edge | ~10 MB |
| Firefox | ~10 MB |
| Safari | ~5 MB |
| Mobile Safari | ~5 MB |
| Chrome Mobile | ~10 MB |

---

<div align="center">

[⬅️ Retour au README](README.md) | [🏗️ Architecture](ARCHITECTURE.md) | [🗺️ Roadmap](ROADMAP.md)

</div>

