# 💾 Schéma de Stockage & Données - NeuroChat Live Pro

L'application suit une philosophie **Local-First**. Vos données personnelles, historiques et documents ne quittent pas votre machine, sauf lors des échanges chiffrés avec les APIs de Google (Gemini).

---

## 💻 Stockage LocalStorage (Navigateur)

Utilisé pour les préférences de l'interface et l'état volatil à travers les sessions.

### 1. Store UI / App (`app-storage`)
Géré via **Zustand Persistence**.

| Clé | Type | Description |
|-----|------|-------------|
| `selectedVoice` | `string` | ID de la voix TTS préférée (ex: 'Kore'). |
| `functionCallingEnabled` | `boolean` | État d'activation des outils. |
| `googleSearchEnabled` | `boolean` | État d'activation de la recherche Google. |
| `uploadedDocuments` | `Array` | Métadonnées et contenu texte des fichiers uploadés. |
| `conclusions` | `Array` | Historique des résumés de sessions sauvegardés. |

---

## 📁 Stockage Fichiers (Système de fichiers local)

Accessible via Electron dans le dossier `userData`.

### 1. Dossier `personnalite/`
Fichiers Markdown éditables qui définissent la "conscience" de l'IA.
- **SOUL.md** : Instructions système fondamentales (règles de comportement).
- **USER.md** : Faits et préférences que l'IA a appris sur vous.
- **MEMORY.md** : Contexte persistant des interactions passées (mémoire long terme).

### 2. Dossier `conclusions/`
- Résumés de sessions générés automatiquement par l'IA et sauvegardés en `.md`.

---

## 🤖 Mémoire Session (Volatile)

- **Chat History** : Conservé dans la RAM pendant la durée de la session WebSocket avec Gemini.
- **Audio Context** : Buffers audio PCM gérés par la Web Audio API, détruits à la fermeture de l'onglet/app.

---

## 🔒 Confidentialité & Sécurité
- **Pas de Cloud Intermédiaire** : NeuroChat ne possède pas de serveur de base de données tiers.
- **Chiffrement** : Les fichiers locaux ne sont pas chiffrés par défaut ; il est recommandé d'utiliser le chiffrement de disque natif de l'OS (FileVault, BitLocker).
- **Nettoyage** : Un bouton "Vider la mémoire" est disponible pour effacer instantanément le LocalStorage.
