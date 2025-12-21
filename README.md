
<div align="center">
  <img width="1200" height="475" alt="GHBanner" src="public/logo2.png" />
</div>

# 🚀 NeuroChat Pro • Interface immersive

**Assistant vocal temps réel propulsé par Gemini Live** : NeuroChat Pro fusionne streaming audio bidirectionnel, vision par ordinateur et visualisations premium pour offrir des conversations naturelles, contextualisées et immersives. Pensé pour les équipes produit et R&D, il fournit une expérience prête à être déployée, personnalisée et instrumentée.

---

## 📋 Sommaire

- [Présentation rapide](#1-présentation-rapide)
- [Stack technique](#2-stack-technique)
- [Architecture & composants](#3-architecture--composants)
- [Fonctionnalités MVP](#4-fonctionnalités-mvp)
- [Prérequis](#5-prérequis)
- [Installation & configuration](#6-installation--configuration)
- [Lancement](#7-lancement)
- [Structure du projet](#8-structure-du-projet)
- [Variables d'environnement](#9-variables-denvironnement)
- [Bonnes pratiques de contribution](#10-bonnes-pratiques-de-contribution)
- [Licence & ressources](#11-licence--ressources)

---

## 1. Présentation rapide

NeuroChat Pro convertit l'API Gemini Live en une expérience utilisateur complète : streaming audio full-duplex, vision en direct, personnalités configurables et interface glassmorphism animée.  
Chaque session couple traitement audio bas niveau et animation haut de gamme pour donner l'illusion d'un assistant présent, réactif et conscient du contexte.

**En quelques mots** : Une interface web moderne et immersive pour interagir avec Gemini Live via la voix, avec support de la vision, des outils intégrés (notes, agenda, calculatrice, etc.) et une personnalisation avancée.

---

## 2. Stack technique

| Couche | Outils & libs | Rôle |
| --- | --- | --- |
| **UI** | React 19, TypeScript 5.8, hooks personnalisés | Composition déclarative de l'interface et gestion d'état locale |
| **Build & DX** | Vite 6, @vitejs/plugin-react, vite-plugin-pwa | Dev server ultra-rapide, bundling ES modules, génération PWA |
| **Stylisation** | Tailwind CSS 3.4, PostCSS, Google Fonts | Design system utility-first et animations sur mesure |
| **Audio/Vision** | Web Audio API, MediaStream API, Canvas API | Capture micro/caméra, analyse fréquentielle, visualisations |
| **IA & Streaming** | @google/genai (Gemini 2.5 Flash) | Sessions WebSocket, envoi PCM 16 kHz, réception 24 kHz |
| **Tooling** | vite-plugin-pwa, tsconfig paths `@/*`, linting TS | PWA installable, alias clairs, typage strict |

### Versions recommandées

- **Node.js** : ≥ 18.0.0 (LTS recommandé)
- **npm** : ≥ 9.0.0
- **TypeScript** : ~5.8.2

---

## 3. Architecture & composants

### Structure principale

- **`App.tsx`** : Point d'orchestration unique (connexion Gemini, pipelines audio/vidéo, visualisations, notification & reconnection).
- **`components/`** : UI découpée en modules réutilisables :
  - `ControlPanel.tsx` : Contrôles principaux (connexion, audio, vision)
  - `Visualizer.tsx` : Visualisations audio premium (particules, spectre)
  - `PersonalityEditor.tsx` & `PersonalitySelector.tsx` : Gestion des personnalités
  - `VoiceSelector.tsx` : Sélection des voix Gemini
  - `DocumentUploader.tsx` : Upload et traitement de documents
  - `NotesViewer.tsx`, `TasksViewer.tsx`, `AgendaViewer.tsx` : Vues des outils intégrés
  - `ToolsList.tsx` : Liste des outils disponibles
  - `Toast.tsx`, `Loader.tsx`, `Tooltip.tsx` : Composants UI utilitaires
- **`hooks/`** : Hooks personnalisés pour encapsuler la logique métier :
  - `useAudioManager.ts` : Gestion du contexte audio et des sons système
  - `useStatusManager.ts` : Gestion de l'état de connexion et des notifications
  - `useVisionManager.ts` : Gestion de la capture vidéo et du partage d'écran
- **`utils/`** : Utilitaires métier :
  - `audioUtils.ts` : Conversions PCM/Float32, encodage Base64, création de blobs et décodage audio
  - `documentProcessor.ts` : Traitement et extraction de contenu depuis les documents uploadés
  - `tools.ts` : Définitions et exécution des fonctions disponibles pour Gemini
  - `videoContextAnalyzer.ts` : Analyse contextuelle des flux vidéo
  - `wakeWordDetector.ts` : Détection de mots-clés d'activation
- **`systemConfig.ts` & `constants.ts`** : Instructions système, thèmes par personnalité, mapping de voix Gemini
- **`vite.config.ts`** : Configuration serveur 0.0.0.0:3000, alias `@`, enregistrement PWA (cache fonts, Gemini API, assets)

### Flux principal

1. **Connexion** : Connexion à Gemini Live via @google/genai (session WebSocket)
2. **Capture audio** : Capture micro + normalisation (`utils/audioUtils`), envoi streaming
3. **Réception audio** : Réception audio synthèse → buffer circulaire → restitution Web Audio
4. **Synchronisation UI** : Latence, statut, visualisations Canvas, toasts
5. **Vision optionnelle** : Caméra/screen share pour contexte multi-modal
6. **Outils intégrés** : Exécution de fonctions via Function Calling (notes, agenda, calculatrice, etc.)

---

## 4. Fonctionnalités MVP

### 🎙️ Audio temps réel

- **Full-duplex** : Communication bidirectionnelle en temps réel
- **Qualité optimisée** : Micro 16 kHz → IA 24 kHz, buffer intelligent, interruption naturelle
- **6 voix Gemini** : Puck, Charon, Kore, Fenrir, Zephyr, Aoede - sélection instantanée
- **Normalisation automatique** : Ajustement du volume et de la qualité audio

### 👁️ Vision & partage

- **Capture caméra** : 1 FPS avec analyse contextuelle
- **Partage d'écran** : 0.5 FPS avec indicateurs de confidentialité
- **Modes d'affichage** : Picture-in-Picture, vue plein écran
- **Switch dynamique** : Changement de périphériques à la volée

### 🎭 Personnalités & thèmes

- **Éditeur intégré** : Création et modification de personnalités (nom, instructions système, voix, palette)
- **Persistance locale** : Sauvegarde dans localStorage
- **Thèmes glassmorphism** : Interface animée avec effets de verre et couleurs dynamiques
- **Instructions système** : Personnalisation complète du comportement de l'assistant

### 🛠️ Outils intégrés (Function Calling)

NeuroChat Pro intègre plus de 30 outils disponibles via Function Calling :

#### 📝 Gestion de contenu
- **Notes** : Création, lecture, suppression de notes (`save_note`, `get_notes`, `delete_note`)
- **Résumés** : Génération de résumés de texte (`generate_summary`)

#### 📅 Agenda & productivité
- **Événements** : Création, consultation, suppression d'événements (`create_event`, `get_events`, `get_upcoming_events`)
- **Suivi des heures** : Enregistrement et consultation des heures de travail (`log_work_hours`, `get_work_hours_summary`)

#### 🧮 Calculs & conversions
- **Calculatrice** : Calculs mathématiques avancés (`calculate`)
- **Conversions** : Unités (température, longueur, poids, volume) et devises (`convert_units`, `convert_currency`)
- **Pourcentages** : Calculs de pourcentages et pourboires (`calculate_percentage`, `calculate_tip`)

#### ⏰ Temps & rappels
- **Heure & date** : Récupération de l'heure actuelle et de la date (`get_current_time`, `get_current_date`)
- **Rappels** : Définition de rappels personnalisés (`set_reminder`)
- **Minuteurs** : Chronomètres et minuteurs (`start_timer`)

#### 🎲 Utilitaires
- **Génération** : Mots de passe sécurisés, UUID (`generate_password`, `generate_uuid`)
- **Aléatoire** : Nombres aléatoires, pile ou face, dés (`generate_random_number`, `flip_coin`, `roll_dice`)
- **Formatage** : Formatage de texte (majuscules, minuscules, etc.) (`format_text`, `count_words`)
- **Dates** : Calcul d'âge, jours jusqu'à une date (`calculate_age`, `days_until`)

#### 🌐 Informations externes
- **Météo** : Informations météorologiques (`get_weather_info`)
- **Recherche Google** : Recherche web en temps réel (si activée)

#### 🏠 Contrôle environnement
- **Lumières** : Contrôle de l'éclairage (`turn_on_the_lights`, `turn_off_the_lights`)

### 🛰️ Fiabilité & observabilité

- **Reconnexion automatique** : Backoff exponentiel avec 5 essais maximum
- **Indicateur de latence** : Affichage en temps réel de la latence réseau
- **Toasts contextuels** : Notifications pour les événements importants
- **Nettoyage mémoire** : Gestion automatique des ressources audio/vidéo

### 🎨 Visualisations premium

- **Visualiseur multi-couches** : Particules animées, spectre audio (basses/médiums/aigus)
- **Mode veille** : Animation respirante lorsque l'assistant est inactif
- **Réactivité audio** : Visualisations synchronisées avec l'audio en temps réel

### 📱 Progressive Web App (PWA)

- **Installation** : Installable sur desktop et mobile
- **Mode hors ligne** : Cache intelligent des ressources
- **Service Worker** : Mise en cache des assets et de l'API Gemini
- **Manifest** : Configuration complète pour une expérience native

---

## 5. Prérequis

### Système

- **Node.js** : ≥ 18.0.0 (LTS recommandé)
- **Gestionnaire de paquets** : npm 9+, yarn 1.22+ ou pnpm 8+
- **Git** : Pour cloner le dépôt

### API & Services

- **Clé API Gemini Live** : Obtenez-la depuis [Google AI Studio](https://aistudio.google.com/apikey)
  - Créez un compte Google si nécessaire
  - Générez une clé API de type "Server"
  - Notez-la pour la configuration

### Navigateurs supportés

- **Chrome/Edge** : 120+ (recommandé)
- **Firefox** : 121+
- **Safari** : 17+

> ⚠️ **Important** : L'audio et la vision nécessitent HTTPS ou `localhost` pour fonctionner correctement.

---

## 6. Installation & configuration

### Étape 1 : Cloner le dépôt

```bash
git clone https://github.com/votre-username/NeuroChat-Live-Pro.git
cd NeuroChat-Live-Pro
```

### Étape 2 : Installer les dépendances

```bash
npm install
# ou
yarn install
# ou
pnpm install
```

### Étape 3 : Configurer les variables d'environnement

Créez un fichier `.env` à la racine du projet :

```bash
# Windows (PowerShell)
New-Item -Path .env -ItemType File

# Linux/Mac
touch .env
```

Ajoutez votre clé API dans le fichier `.env` :

```env
GEMINI_API_KEY=votre_cle_api_ici
```

> 🔒 **Sécurité** : Ne jamais commiter le fichier `.env` ou votre clé API. Utilisez des secrets (Vercel, Netlify, Render...) en production.

### Étape 4 : Vérifier la configuration

Assurez-vous que les fichiers suivants existent :
- ✅ `package.json`
- ✅ `vite.config.ts`
- ✅ `.env` (avec votre clé API)

---

## 7. Lancement

### Mode développement

```bash
npm run dev
```

Le serveur de développement Vite démarre sur `http://localhost:3000` avec :
- 🔥 Hot Module Replacement (HMR)
- ⚡ Rechargement automatique
- 🐛 Source maps pour le débogage

### Build production

```bash
npm run build
```

Génère un bundle optimisé dans le dossier `dist/` avec :
- 📦 Code minifié et optimisé
- 🎨 Assets optimisés
- 🔧 Service Worker pour PWA

### Prévisualisation du build

```bash
npm run preview
```

Sert le build de production en local (idéal pour tester avant déploiement).

### Déploiement

#### Vercel

```bash
npm i -g vercel
vercel
```

#### Netlify

```bash
npm i -g netlify-cli
netlify deploy --prod
```

#### Autres plateformes

Le projet peut être déployé sur n'importe quelle plateforme supportant les applications Node.js/Vite :
- Render
- Railway
- Cloudflare Pages
- GitHub Pages (avec configuration adaptée)

> 💡 **PWA** : Après le déploiement, les utilisateurs pourront installer l'application comme une PWA sur leur appareil.

---

## 8. Structure du projet

```
NeuroChat-Live-Pro/
├── components/                    # Composants React réutilisables
│   ├── AgendaViewer.tsx          # Affichage de l'agenda
│   ├── AudioInputVisualizer.tsx  # Visualisation de l'input audio
│   ├── ControlPanel.tsx          # Panneau de contrôle principal
│   ├── DocumentUploader.tsx     # Upload de documents
│   ├── Header.tsx                # En-tête de l'application
│   ├── InstallPWA.tsx            # Composant d'installation PWA
│   ├── LatencyIndicator.tsx      # Indicateur de latence
│   ├── Loader.tsx                # Composant de chargement
│   ├── NotesViewer.tsx           # Affichage des notes
│   ├── PersonalityEditor.tsx     # Éditeur de personnalités
│   ├── PersonalitySelector.tsx  # Sélecteur de personnalités
│   ├── QuickStartGuide.tsx       # Guide de démarrage rapide
│   ├── TasksViewer.tsx           # Affichage des tâches
│   ├── Toast.tsx                 # Système de notifications
│   ├── ToolsList.tsx             # Liste des outils disponibles
│   ├── Tooltip.tsx               # Tooltips
│   ├── Visualizer.tsx            # Visualisations audio premium
│   └── VoiceSelector.tsx         # Sélecteur de voix
│
├── hooks/                         # Hooks React personnalisés
│   ├── useAudioManager.ts        # Gestion du contexte audio
│   ├── useStatusManager.ts        # Gestion de l'état de connexion
│   └── useVisionManager.ts        # Gestion de la vision
│
├── utils/                         # Utilitaires métier
│   ├── audioUtils.ts              # Conversions audio PCM/Float32
│   ├── documentProcessor.ts      # Traitement de documents
│   ├── tools.ts                   # Définitions et exécution des outils
│   ├── videoContextAnalyzer.ts   # Analyse contextuelle vidéo
│   └── wakeWordDetector.ts       # Détection de mots-clés
│
├── public/                        # Assets statiques
│   ├── bip.mp3                   # Son système
│   ├── bip1.mp3                  # Son système alternatif
│   ├── favicon.ico               # Favicon
│   ├── icon-192.png              # Icône PWA 192x192
│   ├── icon-512.png              # Icône PWA 512x512
│   ├── logo.png                  # Logo principal
│   └── logo2.png                 # Logo alternatif
│
├── dev-dist/                     # Build de développement (généré)
│
├── App.tsx                        # Composant principal (orchestration)
├── constants.ts                   # Constantes (personnalités, voix)
├── systemConfig.ts                # Instructions système Gemini
├── types.ts                       # Types TypeScript partagés
├── index.tsx                      # Point d'entrée React
├── index.html                     # Template HTML
├── index.css                      # Styles globaux
│
├── vite.config.ts                 # Configuration Vite
├── tailwind.config.js             # Configuration Tailwind CSS
├── postcss.config.js              # Configuration PostCSS
├── tsconfig.json                   # Configuration TypeScript
├── package.json                    # Dépendances et scripts
│
├── README.md                       # Documentation principale
└── ROADMAP.md                     # Roadmap du projet
```

---

## 9. Variables d'environnement

| Variable | Description | Obligatoire | Exemple |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | Clé API Gemini Live (WebSocket streaming) | ✅ | `AIzaSy...` |

### Comment obtenir votre clé API

1. **Accédez à Google AI Studio** : [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. **Connectez-vous** avec votre compte Google
3. **Créez une clé API** :
   - Cliquez sur "Create API Key"
   - Sélectionnez "Server" comme type de clé
   - Copiez la clé générée
4. **Configurez votre projet** :
   - Ajoutez la clé dans le fichier `.env`
   - Ou configurez-la comme variable d'environnement sur votre plateforme de déploiement

### Sécurité

- ❌ **Ne jamais** commiter le fichier `.env` dans Git
- ❌ **Ne jamais** exposer votre clé API publiquement
- ✅ Utilisez des **secrets** sur les plateformes de déploiement
- ✅ Limitez les **restrictions** de votre clé API dans Google Cloud Console
- ✅ Surveillez l'**utilisation** de votre clé via Google Cloud Console

---

## 10. Bonnes pratiques de contribution

### Workflow Git

1. **Fork** le dépôt
2. **Créez une branche** thématique :
   ```bash
   git checkout -b feat/ma-nouvelle-fonctionnalite
   # ou
   git checkout -b fix/correction-bug
   # ou
   git checkout -b docs/amelioration-documentation
   ```
3. **Faites des commits atomiques** avec des messages clairs :
   ```bash
   git commit -m "feat: ajout de la fonctionnalité X"
   git commit -m "fix: correction du bug Y"
   ```
4. **Poussez** votre branche :
   ```bash
   git push origin feat/ma-nouvelle-fonctionnalite
   ```
5. **Ouvrez une Pull Request** avec :
   - Description détaillée des changements
   - Use cases et exemples
   - Screenshots si applicable
   - Tests effectués

### Style de code

- **TypeScript strict** : Utilisez le typage strict
- **Composants fonctionnels** : Préférez les fonctions aux classes
- **Hooks personnalisés** : Encapsulez la logique réutilisable
- **Indentation** : 2 espaces (pas de tabs)
- **Tailwind CSS** : Respectez les conventions et utilisez les variables partagées
- **Nommage** : 
  - Composants : PascalCase (`MyComponent.tsx`)
  - Hooks : camelCase avec préfixe `use` (`useMyHook.ts`)
  - Utilitaires : camelCase (`myUtility.ts`)

### Tests & QA

Avant de soumettre une PR :

- ✅ Vérifiez que `npm run build` fonctionne sans erreurs
- ✅ Testez l'audio et la vision sur Chrome et Safari
- ✅ Vérifiez la responsivité sur mobile et desktop
- ✅ Documentez toute nouvelle variable d'environnement
- ✅ Testez les fonctionnalités PWA si applicable

### Documentation

- 📝 Mettez à jour le `README.md` si la fonctionnalité impacte l'UX
- 📝 Mettez à jour le `ROADMAP.md` si c'est une feature majeure
- 📝 Ajoutez des commentaires JSDoc pour les fonctions complexes
- 📝 Incluez des captures d'écran avant/après pour la revue

### Conventions de commit

Utilisez le format [Conventional Commits](https://www.conventionalcommits.org/) :

- `feat:` : Nouvelle fonctionnalité
- `fix:` : Correction de bug
- `docs:` : Documentation
- `style:` : Formatage, point-virgule manquant, etc.
- `refactor:` : Refactoring du code
- `test:` : Ajout de tests
- `chore:` : Maintenance (dépendances, build, etc.)

---

## 11. Licence & ressources

### Licence

Projet diffusé sous licence **MIT**. Voir ci-dessous pour le texte complet.

```
MIT License

Copyright (c) 2025 NeuroChat Pro

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Ressources utiles

#### Documentation officielle

- [Documentation Gemini Live API](https://ai.google.dev/gemini-api/docs)
- [Google AI Studio](https://aistudio.google.com/)
- [React 19 Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

#### APIs & Technologies

- [Web Audio API](https://developer.mozilla.org/docs/Web/API/Web_Audio_API)
- [MediaStream API](https://developer.mozilla.org/docs/Web/API/MediaStream_API)
- [Canvas API](https://developer.mozilla.org/docs/Web/API/Canvas_API)
- [Progressive Web Apps](https://web.dev/progressive-web-apps/)

#### Communauté

- [Issues GitHub](https://github.com/votre-username/NeuroChat-Live-Pro/issues) : Signaler un bug ou proposer une fonctionnalité
- [Discussions](https://github.com/votre-username/NeuroChat-Live-Pro/discussions) : Poser des questions et partager des idées

---

<div align="center">
  <strong>Développé avec ❤️ et Gemini Live API</strong><br/>
  <sub>NeuroChat Pro • Assistant IA Professionnel</sub>
</div>
