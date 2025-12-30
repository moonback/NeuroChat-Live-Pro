# 🧠 NeuroChat Live Pro

> **Assistant IA Professionnel avec Conversations Vocales en Temps Réel**  
> Application web immersive utilisant Gemini Live pour des interactions vocales naturelles, personnalités multiples et analyse vidéo.

---

## 📖 À propos

**NeuroChat Live Pro** est un assistant IA conversationnel avancé conçu pour offrir une expérience utilisateur fluide et immersive grâce à des conversations vocales en temps réel. Propulsé par **Google Gemini Live**, il combine 9 personnalités spécialisées, la reconnaissance vocale, la vision par ordinateur et des outils interactifs pour répondre à des besoins variés : assistance générale, recherche web, accompagnement TDAH/HPI, pédagogie, renseignement géopolitique, analyse visuelle, traduction vocale, méditation et génération d'idées d'applications.

### 🎯 Cas d'usage

- **Assistant généraliste** : NeuroChat pour tous vos besoins quotidiens
- **Recherche web** : WebConsultant pour obtenir des informations actualisées en temps réel
- **Coaching TDAH/HPI** : Coach Neuro spécialisé pour personnes neuroatypiques
- **Aide aux devoirs** : Coach Scolaire pour enfants (10-12 ans) avec difficultés d'apprentissage
- **Renseignement stratégique** : Analyste expert en géopolitique et évaluation de menaces
- **Analyse visuelle** : Vision pour description et explication d'images via caméra/écran
- **Traduction vocale** : Traducteur polyglotte pour répéter et traduire en temps réel
- **Bien-être** : Mindful Sage pour la pleine conscience et la gestion du stress
- **Développement** : App Ideas Guru pour générer des idées d'applications web

---

## ✨ Fonctionnalités Principales

### 🎙️ Conversations Vocales en Temps Réel
- Audio bidirectionnel ultra-réactif (latence < 200ms)
- Synthèse vocale naturelle avec 6 voix disponibles (Puck, Charon, Kore, Fenrir, Zephyr, Aoede)
- Reconnaissance vocale continue avec VAD (Voice Activity Detection)
- Reconnexion automatique en cas de déconnexion
- Indicateur de latence en temps réel

### 🎭 Personnalités Multiples
- **9 personnalités préconçues** : 
  - **NeuroChat** : Assistant généraliste polyvalent
  - **WebConsultant** : Recherche web en temps réel
  - **Coach Neuro** : Spécialisé TDAH/HPI et syndrome de l'imposteur
  - **Coach Scolaire** : Pédagogie pour enfants (10-12 ans)
  - **Analyste** : Renseignement géopolitique et évaluation de menaces
  - **Vision** : Analyse visuelle via caméra/écran
  - **Traducteur** : Traduction vocale polyglotte
  - **Mindful Sage** : Guide zen pour méditation et bien-être
  - **App Ideas Guru** : Génération d'idées d'applications web
- **Éditeur de personnalités** : Créez vos propres assistants personnalisés
- **Changement à chaud** : Basculez entre personnalités sans redémarrer (via fonction `change_personality`)

### 👁️ Vision et Analyse Vidéo
- Capture caméra en direct avec analyse d'images
- Partage d'écran pour assistance technique
- Détection automatique de contexte visuel
- Support multi-caméras
- Analyse contextuelle intelligente (détection de changements, mouvement)
- Suivi des yeux (eye tracking) optionnel : Le visage animé du visualiseur suit le mouvement de la souris pour créer une interaction visuelle immersive

### 🛠️ Outils et Capacités
- **Appels de fonctions** (activable/désactivable) : 
  - **Changement de personnalité** : Changez de personnalité vocalement pendant la conversation (`change_personality`)
 
- **Google Search** : Recherche en temps réel pour informations actualisées (optionnel, activable/désactivable)
- **Upload de documents** : Analysez PDF, TXT, MD avec contexte persistant dans la conversation

### 🔊 Activation Vocale
- Mode mains libres automatique
- Détection de fin de session vocale

### 📱 Progressive Web App (PWA)
- Installation sur mobile et desktop
- Fonctionne hors ligne (cache intelligent avec Workbox)
- Responsive design adaptatif (mobile-first)
- Safe Area Insets pour notch/barre navigation
- Guide de démarrage rapide intégré
- Modal d'état du système avec informations détaillées (connexion, latence, vision, toggles)
- Drawer d'actions mobiles pour accès rapide aux fonctionnalités

### 💻 Application Desktop (Electron)
- Application native Windows, macOS et Linux
- Minimisation dans la barre système (tray)
- Mode "Toujours au-dessus" (always on top)
- Builds disponibles via `npm run electron:build`

---

## 🛠️ Stack Technique

### Frontend
- **React 19.2** avec TypeScript 5.8
- **Vite 6.2** (bundler ultra-rapide, port 3000)
- **Tailwind CSS 3.4** (design system personnalisé)
- **Zustand 5.0** (gestion d'état globale)

### IA & Audio
- **Google Gemini 2.5 Flash** (modèle multimodal)
- **@google/genai SDK 1.30** (API Live)
- **Web Audio API** (traitement audio natif, encodage/décodage)

### Gestion d'État & Stockage
- **Zustand 5.0** (gestion d'état globale avec persistance)
- **LocalStorage** (persistance documents, personnalités, préférences via Zustand persist)
- **Context Audio** (gestion audio optimisée)
- **Reconnection Hook** (reconnexion automatique en cas d'erreur)

### Tests & Qualité
- **Vitest 4.0** (tests unitaires avec UI)
- **Playwright 1.57** (tests E2E)
- **Coverage V8** (couverture de code)
- **Testing Library** (React, Jest DOM, User Event)

### Build & Déploiement
- **vite-plugin-pwa 1.1.0** (génération service worker)
- **Workbox** (stratégies de cache, runtime caching)
- **Electron 39.2** (application desktop)
- **electron-builder 26.0** (packaging multi-plateforme)

---

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir :

- **Node.js** >= 18.0.0 (recommandé : 20.x LTS)
- **npm** >= 9.0.0 ou **pnpm** >= 8.0.0
- **Navigateur moderne** : Chrome/Edge 90+, Firefox 88+, Safari 15+
- **Microphone** fonctionnel
- **Clé API Google Gemini** ([Obtenir une clé](https://makersuite.google.com/app/apikey))

---

## 🚀 Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/votre-username/NeuroChat-Live-Pro.git
cd NeuroChat-Live-Pro
```

### 2. Installer les dépendances

```bash
npm install
# ou
pnpm install
```

### 3. Configuration des variables d'environnement

Créez un fichier `.env` à la racine du projet :

```env
GEMINI_API_KEY=votre_cle_api_gemini_ici
```

> **⚠️ Sécurité** : Ne commitez jamais votre clé API ! Le fichier `.env` est déjà dans `.gitignore`.

### 4. Lancer l'application en développement

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000` (configuré dans `vite.config.ts`)

---

## 📦 Scripts Disponibles

### Développement

```bash
npm run dev          # Démarre le serveur de développement (port 3000)
npm run build        # Build de production (dossier dist/)
npm run preview      # Preview du build de production
```

### Tests

```bash
npm run test         # Lance les tests unitaires (Vitest)
npm run test:watch   # Mode watch pour les tests
npm run test:ui      # Interface graphique pour les tests
npm run test:coverage # Rapport de couverture de code

npm run test:e2e     # Tests End-to-End (Playwright)
npm run test:e2e:ui  # Interface Playwright

npm run test:all     # Lance tous les tests (unit + E2E)
```

### Electron (Application Desktop)

```bash
npm run electron:dev      # Démarre l'app Electron en mode développement
npm run electron:build    # Build de l'application desktop (Windows, macOS, Linux)
npm run compile:electron # Compile uniquement les fichiers Electron TypeScript
```

---

## 🗂️ Structure du Projet

```
NeuroChat-Live-Pro/
│
├── components/               # Composants React réutilisables
│   ├── AudioInputVisualizer.tsx   # Visualisation niveau micro
│   ├── ControlPanel.tsx           # Panneau de contrôle principal
│   ├── DocumentUploader.tsx       # Upload de fichiers
│   ├── Header.tsx                 # Barre de navigation
│   ├── InstallPWA.tsx             # Composant d'installation PWA
│   ├── LatencyIndicator.tsx       # Indicateur de latence
│   ├── Loader.tsx                 # Composant de chargement
│   ├── PersonalityEditor.tsx      # Éditeur de personnalités
│   ├── QuickStartGuide.tsx        # Guide de démarrage rapide
│   ├── Toast.tsx                  # Système de notifications
│   ├── ToolsList.tsx              # Liste des outils disponibles
│   ├── Tooltip.tsx                # Infobulles
│   ├── VideoOverlay.tsx           # Overlay caméra/écran
│   ├── Visualizer.tsx             # Visualiseur audio principal
│   └── VoiceSelector.tsx          # Sélecteur de voix
│
├── hooks/                    # Custom React Hooks
│   ├── useAudioManager.ts         # Gestion audio (beep, contexte)
│   ├── useGeminiLiveSession.ts    # Hook principal session Gemini Live
│   ├── useLocalStorageState.ts    # Hook persistance localStorage
│   ├── useReconnection.ts          # Gestion reconnexion automatique
│   ├── useStatusManager.ts        # Gestion état connexion/toasts
│   └── useVisionManager.ts        # Gestion caméra/écran
│
├── stores/                  # Gestion d'état globale (Zustand)
│   └── appStore.ts                # Store principal avec persistance
│
├── utils/                    # Utilitaires
│   ├── audioUtils.ts              # Encodage/décodage audio
│   ├── documentProcessor.ts       # Traitement documents (PDF, TXT)
│   ├── toastHelpers.ts            # Helpers pour notifications
│   ├── tools.ts                   # Fonction calling (change_personality, accès fichiers)
│   ├── videoContextAnalyzer.ts    # Analyse de contexte vidéo
│
├── electron/                 # Application Electron (Desktop)
│   ├── main.ts                    # Processus principal Electron
│   └── preload.ts                 # Script de préchargement (IPC)
│
├── public/                   # Assets statiques
│   ├── icon-192.png               # Icônes PWA
│   ├── icon-512.png
│   ├── bip.mp3                    # Son de notification
│   └── manifest.webmanifest       # Manifeste PWA
│
├── e2e/                      # Tests End-to-End (Playwright)
├── tests/                    # Tests unitaires (Vitest)
│
├── App.tsx                   # Composant racine
├── index.tsx                 # Point d'entrée React
├── constants.ts              # Personnalités et voix disponibles (9 personnalités, 6 voix)
├── types.ts                  # Types TypeScript globaux
├── systemConfig.ts           # Instructions système de base (règles fondamentales)
│
├── vite.config.ts            # Configuration Vite
├── tailwind.config.js        # Configuration Tailwind CSS
├── tsconfig.json             # Configuration TypeScript
├── vitest.config.ts          # Configuration Vitest
├── playwright.config.ts      # Configuration Playwright
│
└── README.md                 # Ce fichier
```

---

## ⚙️ Configuration

### Variables d'Environnement

| Variable | Description | Requis |
|----------|-------------|--------|
| `GEMINI_API_KEY` | Clé API Google Gemini | ✅ Oui |

### Personnalisation

#### Ajouter une Personnalité

Modifiez `constants.ts` :

```typescript
export const AVAILABLE_PERSONALITIES: Personality[] = [
  // ... personnalités existantes (NeuroChat, WebConsultant, Coach Neuro, Coach Scolaire, Analyste, Vision, Traducteur, Mindful Sage, App Ideas Guru)
  {
    id: 'ma-personnalite',
    name: 'Mon Assistant',
    description: 'Description courte',
    systemInstruction: `Instructions système détaillées...`,
    voiceName: 'Kore', // Puck, Charon, Kore, Fenrir, Zephyr, Aoede
    themeColor: '#3b82f6' // Couleur hex
  }
];
```

**Note** : Les personnalités peuvent être changées à chaud pendant une conversation via la fonction `change_personality`.

#### Modifier les Outils Disponibles

Éditez `utils/tools.ts` pour ajouter des fonctions :

```typescript
export const AVAILABLE_FUNCTIONS: Record<string, FunctionDeclaration> = {
  // Fonctions existantes
  change_personality: { /* ... */ },
 
  
  // Ajouter votre fonction
  ma_fonction: {
    name: 'ma_fonction',
    description: 'Description de la fonction',
    parameters: {
      type: 'object',
      properties: {
        param1: { type: 'string', description: 'Paramètre 1' }
      },
      required: ['param1']
    }
  }
};

// Implémenter l'exécution dans executeFunction()
export async function executeFunction(functionCall: FunctionCall, options?: {...}): Promise<any> {
  const { name, args } = functionCall;
  
  if (name === 'ma_fonction') {
    // Votre logique ici
    return { result: 'success', data: /* ... */ };
  }
  
  // ... autres fonctions
}
```



**Note** : Les fonctions doivent être déclarées dans `AVAILABLE_FUNCTIONS` et leur exécution doit être implémentée dans `executeFunction()`. La configuration des outils est construite via `buildToolsConfig()`.

---

## 🎨 Personnalisation du Design

### Modifier le Thème

Éditez `tailwind.config.js` :

```javascript
theme: {
  extend: {
    colors: {
      brand: {
        50: '#f0f9ff',
        // ... autres nuances
        900: '#0c4a6e',
      }
    }
  }
}
```

### Animations Personnalisées

Ajoutez dans `index.css` :

```css
@keyframes mon-animation {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
```

---

## 📱 Installation

### Progressive Web App (PWA)

#### Desktop (Chrome/Edge)

1. Ouvrez l'application dans le navigateur
2. Cliquez sur l'icône d'installation dans la barre d'adresse
3. Confirmez l'installation

#### Mobile (iOS)

1. Ouvrez dans Safari
2. Tapez le bouton "Partager"
3. Sélectionnez "Sur l'écran d'accueil"

#### Mobile (Android)

1. Ouvrez dans Chrome
2. Menu → "Installer l'application"
3. Confirmez

### Application Desktop (Electron)

#### Windows

1. Téléchargez le fichier `.exe` depuis les releases GitHub
2. Exécutez l'installateur
3. L'application sera disponible dans le menu Démarrer

#### macOS

1. Téléchargez le fichier `.dmg` depuis les releases GitHub
2. Ouvrez le fichier `.dmg`
3. Glissez l'application dans le dossier Applications

#### Linux

1. Téléchargez le fichier `.AppImage` depuis les releases GitHub
2. Rendez-le exécutable : `chmod +x NeuroChat-Pro-*.AppImage`
3. Double-cliquez pour lancer l'application

**Note** : L'application Electron offre des fonctionnalités supplémentaires comme l'accès au système de fichiers local.

---

## 🧪 Tests

### Tests Unitaires

```bash
# Lancer tous les tests
npm run test

# Mode watch (relance automatique)
npm run test:watch

# Interface graphique
npm run test:ui

# Couverture de code
npm run test:coverage
```

### Tests E2E

```bash
# Lancer les tests Playwright
npm run test:e2e

# Mode interactif
npm run test:e2e:ui
```

---

## 🚢 Déploiement

### Build de Production

```bash
npm run build
```

Le dossier `dist/` contiendra l'application optimisée.

### Déploiement sur Vercel

1. Connectez votre dépôt GitHub à Vercel
2. Ajoutez la variable d'environnement `GEMINI_API_KEY`
3. Configurez le build :
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`

### Déploiement sur Netlify

1. Connectez votre dépôt
2. Ajoutez `GEMINI_API_KEY` dans "Site settings → Environment variables"
3. Build settings :
   - **Build command** : `npm run build`
   - **Publish directory** : `dist`

### Déploiement sur GitHub Pages

```bash
# Installer gh-pages
npm install --save-dev gh-pages

# Ajouter dans package.json
"scripts": {
  "deploy": "npm run build && gh-pages -d dist"
}

# Déployer
npm run deploy
```

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment participer :

### 1. Fork le projet

```bash
gh repo fork votre-username/NeuroChat-Live-Pro
```

### 2. Créez une branche

```bash
git checkout -b feature/ma-fonctionnalite
```

### 3. Committez vos changements

```bash
git commit -m "feat: ajout de ma fonctionnalité"
```

**Convention de commits** :
- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `docs:` Documentation
- `style:` Formatage
- `refactor:` Refactoring
- `test:` Tests
- `chore:` Tâches de maintenance

### 4. Push et ouvrez une Pull Request

```bash
git push origin feature/ma-fonctionnalite
```

### Bonnes Pratiques

- ✅ Testez votre code (`npm run test`)
- ✅ Respectez la convention de commits
- ✅ Documentez les nouvelles fonctionnalités
- ✅ Assurez-vous que le build passe (`npm run build`)

---

## 🐛 Signaler un Bug

1. Ouvrez une **Issue** sur GitHub
2. Décrivez le problème avec :
   - Version du navigateur
   - Système d'exploitation
   - Étapes pour reproduire
   - Captures d'écran si applicable

---

## 📄 Licence

Ce projet est sous licence **MIT** - voir le fichier [LICENSE](LICENSE) pour plus de détails.

### Résumé de la Licence MIT

✅ Usage commercial autorisé  
✅ Modification autorisée  
✅ Distribution autorisée  
✅ Usage privé autorisé  
⚠️ Aucune garantie fournie

---

## 🙏 Crédits

### Technologies Utilisées

- [Google Gemini](https://ai.google.dev/) - Modèle IA multimodal
- [React](https://react.dev/) - Bibliothèque UI
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Vitest](https://vitest.dev/) - Framework de tests
- [Playwright](https://playwright.dev/) - Tests E2E

### Auteur

Développé avec ❤️ par **Maysson**

**Version** : 0.0.0 (développement actif)

---

## 📞 Support

- 📧 Email : support@neurochat.exemple (remplacez par le vôtre)
- 🐦 Twitter : [@votre_handle](https://twitter.com/votre_handle)
- 💬 Discord : [Rejoindre le serveur](https://discord.gg/votre-invite)

---

## 🗺️ Roadmap

Voir [ROADMAP.md](ROADMAP.md) pour la feuille de route détaillée.

### Prochaines Fonctionnalités

- [ ] Export des conversations en PDF/JSON
- [ ] Historique des sessions avec recherche
- [ ] Mode multi-utilisateurs (rooms)
- [ ] Intégration Telegram/WhatsApp
- [ ] Support des langues (EN, ES, DE)
- [ ] Implémentation de fonctions supplémentaires (calculatrice, timers, notes, agenda, etc.)
- [ ] Plus de fonctions disponibles via function calling

---

## 📚 Documentation Additionnelle

- [ARCHITECTURE.md](ARCHITECTURE.md) - Architecture technique détaillée
- [LOCALSTORAGE_DOCS.md](LOCALSTORAGE_DOCS.md) - Documentation du stockage local
- [ROADMAP.md](ROADMAP.md) - Feuille de route et vision produit

---

<div align="center">

**⭐ Si ce projet vous plaît, n'hésitez pas à lui donner une étoile sur GitHub !**

[⬆ Retour en haut](#-neurochat-live-pro)

</div>

