# 🧠 NeuroChat Live Pro

**Assistant IA professionnel avec conversations vocales en temps réel** - Une application Progressive Web App (PWA) utilisant Google Gemini Live API pour des interactions vocales fluides et naturelles.

---

## 📋 Table des matières

- [Présentation](#-présentation)
- [Stack technique](#-stack-technique)
- [Fonctionnalités principales](#-fonctionnalités-principales)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Lancement](#-lancement)
- [Structure du projet](#-structure-du-projet)
- [Variables d'environnement](#-variables-denvironnement)
- [Personnalités disponibles](#-personnalités-disponibles)
- [Outils et fonctionnalités](#-outils-et-fonctionnalités)
- [PWA (Progressive Web App)](#-pwa-progressive-web-app)
- [Contribuer](#-contribuer)
- [Licence](#-licence)

---

## 🎯 Présentation

NeuroChat Live Pro est un assistant IA conversationnel avancé qui permet des interactions vocales en temps réel avec Google Gemini Live API. L'application offre une expérience utilisateur premium avec des personnalités configurables, une gestion de documents, des outils intégrés, et une interface moderne optimisée pour desktop et mobile.

**Pitch** : Un assistant IA vocal professionnel qui combine la puissance de Gemini Live avec une interface élégante et des fonctionnalités avancées pour la productivité.

---

## 🛠️ Stack technique

### Frontend
- **React** 19.2.0 - Bibliothèque UI
- **TypeScript** 5.8.2 - Typage statique
- **Tailwind CSS** 3.4.15 - Framework CSS utilitaire
- **Vite** 6.2.0 - Build tool et dev server

### API & Services
- **@google/genai** 1.30.0 - SDK Google Gemini Live API
- **Gemini 2.5 Flash Native Audio** - Modèle de conversation vocale

### PWA & Build
- **vite-plugin-pwa** 1.1.0 - Support PWA avec Workbox
- **PostCSS** & **Autoprefixer** - Traitement CSS

### Audio & Media
- **Web Audio API** - Traitement audio en temps réel
- **MediaStream API** - Capture microphone et caméra
- **Speech Recognition API** - Détection de wake word

---

## ✨ Fonctionnalités principales

### 🎤 Conversations vocales
- **Audio bidirectionnel en temps réel** avec latence optimisée
- **6 voix disponibles** (Puck, Charon, Kore, Fenrir, Zephyr, Aoede)
- **Visualisation audio** avec analyseur de fréquences
- **Détection de wake word** ("Bonjour") pour activation vocale

### 🎭 Personnalités configurables
- **5 personnalités prédéfinies** :
  - Analyste Cold Case
  - Auditeur SEO
  - Hunter E-com
  - Analyste Visuel
  - Manager Social Media
- **Éditeur de personnalité** pour créer des assistants personnalisés
- **Thèmes visuels** adaptés à chaque personnalité

### 👁️ Vision & Partage d'écran
- **Analyse vidéo en temps réel** via caméra
- **Partage d'écran** pour analyse de contenu
- **Détection automatique** des changements de contexte
- **Support multi-caméras**

### 📄 Gestion de documents
- **Upload de documents** (PDF, TXT, etc.)
- **Intégration dans le contexte** de conversation
- **Traitement automatique** et extraction de contenu

### 🔧 Outils intégrés (Function Calling)
- **Gestion de notes** (création, lecture, suppression)
- **Agenda et événements** (création, consultation, filtrage)
- **Suivi des heures travaillées** (logging, résumés, statistiques)
- **Calculatrice et conversions** (unités, devises, pourcentages)
- **Utilitaires** (génération de mots de passe, UUID, etc.)
- **Rappels et timers**

### 🔍 Recherche Google
- **Recherche en temps réel** (optionnelle)
- **Intégration transparente** dans les conversations

### 📱 Progressive Web App
- **Installation sur appareils** (desktop et mobile)
- **Mode hors-ligne** partiel
- **Notifications** et raccourcis

---

## 📦 Prérequis

- **Node.js** >= 18.0.0 (recommandé : LTS)
- **npm** >= 9.0.0 ou **yarn** >= 1.22.0
- **Clé API Google Gemini** ([Obtenir une clé](https://makersuite.google.com/app/apikey))
- **Navigateur moderne** avec support :
  - Web Audio API
  - MediaStream API
  - Speech Recognition API (Chrome/Edge recommandé)
  - Service Workers (pour PWA)

---

## 🚀 Installation

### 1. Cloner le repository

```bash
git clone https://github.com/votre-username/NeuroChat-Live-Pro.git
cd NeuroChat-Live-Pro
```

### 2. Installer les dépendances

```bash
npm install
```

ou avec yarn :

```bash
yarn install
```

### 3. Configurer les variables d'environnement

Créer un fichier `.env` à la racine du projet :

```bash
# .env
GEMINI_API_KEY=votre_cle_api_google_gemini_ici
```

**⚠️ Important** : Ne jamais commiter le fichier `.env` dans le repository. Il est déjà dans `.gitignore`.

---

## ⚙️ Configuration

### Variables d'environnement

| Variable | Description | Requis | Exemple |
|----------|-------------|--------|---------|
| `GEMINI_API_KEY` | Clé API Google Gemini Live | ✅ Oui | `AIzaSy...` |

### Configuration Vite

Le fichier `vite.config.ts` configure :
- **Port de développement** : `3000`
- **Host** : `0.0.0.0` (accessible depuis le réseau local)
- **PWA** : Manifest et Service Worker
- **Alias** : `@` pointe vers la racine du projet

### Configuration Tailwind

Le fichier `tailwind.config.js` définit :
- **Thème personnalisé** avec couleurs et animations
- **Classes utilitaires** pour l'interface premium

---

## 🏃 Lancement

### Mode développement

```bash
npm run dev
```

L'application sera accessible sur : `http://localhost:3000`

### Build de production

```bash
npm run build
```

Les fichiers optimisés seront générés dans le dossier `dist/`.

### Prévisualisation du build

```bash
npm run preview
```

Permet de tester le build de production localement.

---

## 📁 Structure du projet

```
NeuroChat-Live-Pro/
├── components/              # Composants React
│   ├── AgendaViewer.tsx    # Gestionnaire d'agenda
│   ├── AudioInputVisualizer.tsx
│   ├── ControlPanel.tsx   # Panneau de contrôle principal
│   ├── DocumentUploader.tsx
│   ├── Header.tsx          # En-tête avec navigation
│   ├── InstallPWA.tsx      # Installation PWA
│   ├── LatencyIndicator.tsx
│   ├── Loader.tsx
│   ├── NotesViewer.tsx    # Visualiseur de notes
│   ├── PersonalityEditor.tsx
│   ├── PersonalitySelector.tsx
│   ├── QuickStartGuide.tsx
│   ├── TasksViewer.tsx    # Visualiseur de tâches/heures
│   ├── Toast.tsx           # Système de notifications
│   ├── ToolsList.tsx       # Liste des outils disponibles
│   ├── Tooltip.tsx
│   ├── VideoOverlay.tsx    # Overlay vidéo/caméra
│   └── Visualizer.tsx      # Visualiseur audio
│
├── hooks/                  # Hooks React personnalisés
│   ├── useAudioManager.ts
│   ├── useLocalStorageState.ts
│   ├── useStatusManager.ts
│   └── useVisionManager.ts
│
├── utils/                  # Utilitaires
│   ├── audioUtils.ts       # Utilitaires audio
│   ├── documentProcessor.ts
│   ├── tools.ts            # Définitions et exécution des outils
│   ├── videoContextAnalyzer.ts
│   └── wakeWordDetector.ts
│
├── public/                 # Assets statiques
│   ├── bip.mp3
│   ├── bip1.mp3
│   ├── favicon.ico
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── logo.png
│   └── logo2.png
│
├── dist/                   # Build de production (généré)
├── dev-dist/               # Build de développement (généré)
│
├── App.tsx                 # Composant principal
├── index.tsx               # Point d'entrée React
├── index.css              # Styles globaux
├── index.html              # Template HTML
│
├── constants.ts            # Constantes (personnalités, voix)
├── systemConfig.ts         # Configuration système IA
├── types.ts                # Types TypeScript
│
├── package.json
├── package-lock.json
├── tsconfig.json           # Configuration TypeScript
├── tailwind.config.js      # Configuration Tailwind
├── postcss.config.js
├── vite.config.ts          # Configuration Vite
├── LICENSE
└── README.md
```

---

## 🔐 Variables d'environnement

### Fichier `.env`

Créer un fichier `.env` à la racine :

```env
GEMINI_API_KEY=votre_cle_api_ici
```

### Accès dans le code

Les variables sont injectées via Vite :

```typescript
const apiKey = process.env.API_KEY; // ou process.env.GEMINI_API_KEY
```

---

## 🎭 Personnalités disponibles

### 1. Analyste Cold Case
- **ID** : `neurochat-coldcase`
- **Voix** : Kore
- **Couleur** : Sky Blue (#0ea5e9)
- **Description** : Expert en résolution d'affaires non résolues et analyse criminelle

### 2. Auditeur SEO
- **ID** : `seo-auditor`
- **Voix** : Fenrir
- **Couleur** : Emerald (#10b981)
- **Description** : Audit complet, analyse sémantique et optimisation de visibilité

### 3. Hunter E-com
- **ID** : `ecommerce-hunter`
- **Voix** : Kore
- **Couleur** : Amber (#f59e0b)
- **Description** : Expert en recherche de produits gagnants et analyse de niches

### 4. Analyste Visuel
- **ID** : `visual-analyst`
- **Voix** : Kore
- **Couleur** : Emerald (#10b981)
- **Description** : Expert en interprétation d'images et détection de détails

### 5. Manager Social Media
- **ID** : `social-media-manager`
- **Voix** : Kore
- **Couleur** : Amber (#f59e0b)
- **Description** : Expert en gestion de contenu et stratégie de marketing social

---

## 🔧 Outils et fonctionnalités

### Outils disponibles (Function Calling)

L'application expose plus de 30 outils via l'API Gemini Live :

#### 📝 Notes et mémos
- `save_note` - Sauvegarder une note
- `get_notes` - Récupérer toutes les notes
- `delete_note` - Supprimer une note
- `delete_all_notes` - Supprimer toutes les notes

#### 📅 Agenda
- `create_event` - Créer un événement
- `get_events` - Récupérer les événements (avec filtres)
- `get_upcoming_events` - Événements à venir
- `delete_event` - Supprimer un événement

#### ⏱️ Suivi des heures
- `log_work_hours` - Enregistrer des heures travaillées
- `get_work_hours` - Récupérer les heures (avec filtres)
- `get_work_hours_summary` - Résumé par période
- `delete_work_hours` - Supprimer une entrée

#### 🧮 Calculs et conversions
- `calculate` - Calculatrice mathématique
- `convert_units` - Conversion d'unités
- `convert_currency` - Conversion de devises
- `calculate_percentage` - Calcul de pourcentage
- `calculate_tip` - Calcul de pourboire

#### 🕐 Temps et dates
- `get_current_time` - Heure actuelle
- `get_current_date` - Date actuelle
- `set_reminder` - Définir un rappel
- `start_timer` - Démarrer un minuteur
- `calculate_age` - Calculer l'âge
- `days_until` - Jours jusqu'à une date

#### 🛠️ Utilitaires
- `generate_password` - Générer un mot de passe
- `generate_uuid` - Générer un UUID
- `format_text` - Formater un texte
- `count_words` - Compter les mots
- `generate_random_number` - Nombre aléatoire
- `flip_coin` - Lancer une pièce
- `roll_dice` - Lancer des dés

#### 🌍 Informations
- `get_weather_info` - Informations météo (simulation)
- `generate_summary` - Résumer un texte

#### 🏠 Contrôle environnement
- `turn_on_the_lights` - Activer les lumières (simulation)
- `turn_off_the_lights` - Désactiver les lumières (simulation)

### Activation des outils

Les outils sont activés/désactivés via l'interface :
- **Function Calling** : Activé par défaut
- **Google Search** : Désactivé par défaut (nécessite configuration API)

---

## 📱 PWA (Progressive Web App)

### Installation

L'application peut être installée comme une application native :

1. **Desktop** : Cliquer sur l'icône d'installation dans la barre d'adresse
2. **Mobile** : Menu "Ajouter à l'écran d'accueil"

### Fonctionnalités PWA

- ✅ **Mode standalone** (sans barre d'adresse)
- ✅ **Icônes** 192x192 et 512x512
- ✅ **Service Worker** pour cache et offline
- ✅ **Manifest** avec métadonnées
- ✅ **Raccourcis** pour actions rapides

### Cache Strategy

- **Fonts** : CacheFirst (1 an)
- **API Gemini** : NetworkFirst (5 min)
- **Assets** : CacheFirst avec versioning

---

## 🤝 Contribuer

Les contributions sont les bienvenues ! Voici comment contribuer :

### 1. Fork le projet

### 2. Créer une branche

```bash
git checkout -b feature/ma-nouvelle-fonctionnalite
```

### 3. Commit les changements

```bash
git commit -m "feat: ajout de ma nouvelle fonctionnalité"
```

### 4. Push vers la branche

```bash
git push origin feature/ma-nouvelle-fonctionnalite
```

### 5. Ouvrir une Pull Request

### Bonnes pratiques

- ✅ Suivre les conventions de nommage (camelCase pour fonctions, PascalCase pour composants)
- ✅ Ajouter des types TypeScript pour toutes les nouvelles fonctions
- ✅ Documenter les fonctions complexes
- ✅ Tester sur desktop et mobile
- ✅ Vérifier la compatibilité PWA
- ✅ Respecter le format de commit (Conventional Commits)

### Structure des commits

- `feat:` - Nouvelle fonctionnalité
- `fix:` - Correction de bug
- `docs:` - Documentation
- `style:` - Formatage
- `refactor:` - Refactoring
- `test:` - Tests
- `chore:` - Maintenance

---

## 📄 Licence

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 🔗 Ressources

- [Documentation Google Gemini Live](https://ai.google.dev/docs)
- [Documentation React](https://react.dev)
- [Documentation Vite](https://vitejs.dev)
- [Documentation Tailwind CSS](https://tailwindcss.com)

---

## 👤 Auteur

**Maysson**

---

## 🙏 Remerciements

- Google pour l'API Gemini Live
- La communauté React et Vite
- Tous les contributeurs open source

---

**⭐ Si ce projet vous plaît, n'hésitez pas à lui donner une étoile !**

