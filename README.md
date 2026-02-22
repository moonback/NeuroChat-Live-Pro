# 🧠 NeuroChat Live Pro

> **Votre Assistant IA Multimodal & Autonome sur Bureau**  
> Une application Desktop propulsée par Gemini Live permettant des conversations vocales ultra-rapides, l'analyse visuelle en temps réel (écran/caméra) et l'exécution d'actions complexes sur votre système et le web.

---

## 💻 Stack Technique

L'application repose sur des technologies modernes pour allier performance, interface réactive et contrôle du système hôte :

- **Frontend** : **React 19** avec **TypeScript**
- **Styling** : **Tailwind CSS 3** pour un design premium et adaptatif, **Lucide React** pour l'iconographie
- **Desktop & Système** : **Electron 39**, communication IPC sécurisée
- **IA & Multimodalité** : API **Google Gemini Live** (`@google/genai`)
- **Gestion d'État** : **Zustand 5** pour un state management fluide et persistant
- **Automatisation & Web** : **Playwright** pour la navigation autonome de l'IA
- **Build & Tests** : **Vite 6**, **Vitest** (Unit tests) & **Playwright** (E2E)

---

## ✨ Fonctionnalités Principales (MVP)

- 🎙️ **Audio Bidirectionnel Temps Réel** : Discutez vocalement avec l'IA avec une latence quasi-nulle (<200ms) grâce à Gemini Live.
- 👁️ **Vision Contextuelle** : Partage d'écran et flux webcam analysés en direct pour une aide visuelle précise (ex: aide au code, analyse de documents).
- 🛠️ **Function Calling Avancé** : L'IA agit pour vous (gestion de fichiers locaux, opérations système).
- 🌐 **Navigation Web Autonome** : L'assistant pilote un navigateur (Playwright) pour chercher, lire et résumer des contenus invisibles au préalable.
- ⚡ **Expérience "Local-First"** : Vos documents, notes et contextes locaux restent sur votre machine.

---

## ⚙️ Prérequis

Avant de commencer, assurez-vous de disposer de l'environnement suivant :

- **Node.js** : Version `18.x` ou supérieure
- **npm** : Version `9.x` ou supérieure
- **Clé API Google Gemini** : Utilisable sur [Google AI Studio](https://aistudio.google.com/)

---

## 🚀 Installation & Configuration

Suivez ces étapes pour configurer le projet localement :

1. **Cloner le projet**
   ```bash
   git clone https://github.com/votre-user/NeuroChat-Live-Pro.git
   cd NeuroChat-Live-Pro
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Variables d'environnement**
   Créez un fichier `.env.local` à la racine du projet et insérez votre clé API :
   ```env
   VITE_GEMINI_API_KEY=votre_cle_api_gemini_ici
   ```

---

## 🏁 Lancement du Projet

### Mode Développement
Idéal pour travailler sur le code. Il lance simultanément le serveur Vite et la fenêtre Electron via un script concurrent :
```bash
npm run electron:dev
```

### Build pour la Production
Cette commande compile l'application React et package l'exécutable final via `electron-builder` :
```bash
npm run electron:build
```
Les exécutables générés se trouveront dans le dossier `release/`.

---

## 🗂️ Structure du Projet

L'arborescence est organisée de manière à séparer la logique UI (React) des privilèges système (Electron) et des outils de l'IA.

```
NeuroChat-Live-Pro/
├── components/       # UI React (Boutons, Modals, Panneaux de contrôle, ...)
├── electron/         # Code Main process Electron (IPC, intégration OS)
├── hooks/            # Hooks métier (connexion Gemini, WebRTC, flux audio)
├── public/           # Assets statiques (logos, audios)
├── stores/           # Stores Zustand (état global, UI, configurations)
├── test-results/     # Dossiers générés relatifs aux logs de test E2E
├── tests/            # Fichiers de test (unitaires et composants)
├── utils/            # Utilitaires IA, outils Function Calling, parseurs text/audio
├── App.tsx           # Composant racine de l'application React
├── index.html        # Point d'entrée web
├── systemConfig.ts   # Configuration du persona et des contraintes système
├── package.json      # Scripts, dépendances, configuration de build
└── vite.config.ts    # Options de bundle (Vite)
```

---

## 🤝 Bonnes pratiques pour contribuer

Développeurs, vous êtes les bienvenus pour améliorer NeuroChat ! 

1. **Branche par Fonctionnalité** : Créez toujours une branche spécifique `feature/nom-feature` ou `fix/nom-bug` depuis `main`.
2. **Qualité du code** : Assurez-vous que le projet compile avec Typescript strict.
3. **Tests Systematiques** : Ajoutez des tests unitaires (`npm run test:ui`) ou E2E Playwright (`npm run test:e2e`) avant toute PR importante.
4. **Commits Sélectifs** : Privilégiez les conventions *Conventional Commits* (ex: `feat: ajout de la vision`, `fix: correction audio`).

---

## 📄 Licence

Ce projet est distribué sous la licence **MIT**. Vous êtes libres de le modifier et de le distribuer. Pour plus d'informations, consultez le fichier [LICENSE](LICENSE).
