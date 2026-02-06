# Système de Fichiers de Personnalité

Ce système permet à l'assistant de prendre en compte et de modifier les fichiers de personnalité pour adapter son comportement.

## Fichiers de Personnalité

### 📄 SOUL.md (`public/SOUL.md`)
Définit l'identité, la personnalité et les valeurs de l'assistant.

**Structure:**
```markdown
# Soul

I am [nom], a lightweight AI assistant.

## Personality

- Trait de personnalité 1
- Trait de personnalité 2
- Trait de personnalité 3

## Values

- Valeur 1
- Valeur 2
- Valeur 3
```

### 👤 USER.md (`public/USER.md`)
Contient les informations et préférences de l'utilisateur.

**Structure:**
```markdown
# User

Information about the user goes here.

## Preferences

- Communication style: (casual/formal)
- Timezone: (your timezone)
- Language: (your preferred language)
```

### 🧠 MEMORY.md (`public/memory/MEMORY.md`)
Stocke la mémoire à long terme de l'assistant.

**Structure:**
```markdown
# Long-term Memory

This file stores important information that should persist across sessions.

## User Information

(Important facts about the user)

## Preferences

(User preferences learned over time)

## Important Notes

(Things to remember)
```

## Fonctionnalités

### 1. Chargement Automatique
Les fichiers sont chargés automatiquement au démarrage de l'application via le hook `usePersonalityFiles`.

### 2. Contexte Système
Le contenu des fichiers est automatiquement intégré dans le contexte système de l'assistant, lui permettant de :
- Adapter sa personnalité selon SOUL.md
- Respecter les préférences de l'utilisateur définies dans USER.md
- Se souvenir des informations importantes stockées dans MEMORY.md

### 3. Interface d'Édition
Un composant `PersonalityFilesEditor` permet de :
- Visualiser le contenu des trois fichiers
- Modifier MEMORY.md directement depuis l'interface
- Ajouter/supprimer des informations utilisateur, préférences et notes

### 4. Sauvegarde
Les modifications sont sauvegardées dans `localStorage` comme fallback. Pour une sauvegarde persistante sur le serveur, il faudra implémenter un backend.

## Utilisation

### Dans le Code

```typescript
import { usePersonalityFiles } from './hooks/usePersonalityFiles';

function MyComponent() {
  const {
    files,                    // Contenu des fichiers
    systemContext,            // Contexte formaté pour l'assistant
    isLoading,                // État de chargement
    error,                    // Erreurs éventuelles
    updateSoul,               // Mettre à jour SOUL.md
    updateUser,               // Mettre à jour USER.md
    updateMemory,             // Mettre à jour MEMORY.md
    addUserInformation,       // Ajouter une info utilisateur
    addPreference,            // Ajouter une préférence
    addImportantNote,         // Ajouter une note
    removeUserInformation,    // Supprimer une info
    removePreference,         // Supprimer une préférence
    removeImportantNote       // Supprimer une note
  } = usePersonalityFiles();

  // Utiliser systemContext dans buildSystemInstruction
}
```

### Ouvrir l'Éditeur

Pour ouvrir l'éditeur de fichiers de personnalité, appelez la fonction `openPersonalityFilesEditor()` depuis `App.tsx`.

## Architecture

```
utils/
  └── personalityFilesService.ts    # Service de chargement/sauvegarde
hooks/
  └── usePersonalityFiles.ts        # Hook React pour gérer les fichiers
components/
  └── PersonalityFilesEditor.tsx    # Interface d'édition
systemConfig.ts                     # Intégration dans le système
```

## Flux de Données

1. **Chargement** : `loadPersonalityFiles()` charge les 3 fichiers depuis `/public`
2. **Parsing** : Le contenu est parsé et structuré
3. **Contexte** : `generateSystemContext()` crée un contexte formaté
4. **Transmission** : Le contexte est passé à `buildSystemInstruction()`
5. **Assistant** : L'assistant utilise ce contexte pour adapter son comportement

## Exemple de Contexte Généré

```
Tu es nanobot.

Ta personnalité:
- Helpful and friendly
- Concise and to the point
- Curious and eager to learn

Tes valeurs:
- Accuracy over speed
- User privacy and safety
- Transparency in actions

Préférences de l'utilisateur:
- Style de communication: casual
- Fuseau horaire: Europe/Paris
- Langue préférée: Français

Mémoire à long terme:

Informations sur l'utilisateur:
- Développeur passionné par l'IA
- Préfère les explications techniques détaillées

Préférences apprises:
- Aime les exemples de code concrets
- Préfère les réponses structurées

Notes importantes:
- Projet en cours: NeuroChat-Live-Pro
- Utilise TypeScript et React
```

## Limitations Actuelles

1. **Sauvegarde** : Les modifications sont sauvegardées uniquement dans `localStorage`
2. **Édition SOUL/USER** : L'interface ne permet pas encore de modifier SOUL.md et USER.md (édition manuelle requise)
3. **Synchronisation** : Pas de synchronisation multi-appareils

## Améliorations Futures

- [ ] Backend pour sauvegarde persistante
- [ ] Édition complète de SOUL.md et USER.md depuis l'interface
- [ ] Synchronisation cloud
- [ ] Historique des modifications
- [ ] Import/Export des fichiers
- [ ] Validation des modifications
- [ ] Suggestions automatiques basées sur les conversations
