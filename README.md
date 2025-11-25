
<div align="center">
  <img width="1200" height="475" alt="GHBanner" src="public/logo2.png" />
</div>

# 🚀 NeuroChat Pro • Interface immersive

**Assistant vocal temps réel propulsé par Gemini Live** : NeuroChat Pro fusionne streaming audio bidirectionnel, vision par ordinateur et visualisations premium pour offrir des conversations naturelles, contextualisées et immersives. Pensé pour les équipes produit et R&D, il fournit une expérience prête à être déployée, personnalisée et instrumentée.

---

## Sommaire

- [🚀 NeuroChat Pro • Interface immersive](#-neurochat-pro--interface-immersive)
  - [Sommaire](#sommaire)
  - [1. Présentation rapide](#1-présentation-rapide)
  - [2. Stack technique](#2-stack-technique)
  - [3. Architecture \& composants](#3-architecture--composants)
  - [4. Fonctionnalités MVP](#4-fonctionnalités-mvp)
    - [🎙️ Audio temps réel](#️-audio-temps-réel)
    - [👁️ Vision \& partage](#️-vision--partage)
    - [🎭 Personnalités \& thèmes](#-personnalités--thèmes)
    - [🛰️ Fiabilité \& observabilité](#️-fiabilité--observabilité)
    - [🎨 Visualisations premium](#-visualisations-premium)
  - [5. Prérequis](#5-prérequis)
  - [6. Installation \& configuration](#6-installation--configuration)
  - [7. Lancement](#7-lancement)
  - [8. Structure du projet](#8-structure-du-projet)
  - [9. Variables d’environnement](#9-variables-denvironnement)
  - [10. Bonnes pratiques de contribution](#10-bonnes-pratiques-de-contribution)
  - [11. Licence \& ressources](#11-licence--ressources)
    - [Licence](#licence)
    - [Ressources utiles](#ressources-utiles)

---

## 1. Présentation rapide

NeuroChat Pro convertit l’API Gemini Live en une expérience utilisateur complète : streaming audio full-duplex, vision en direct, personnalités configurables et interface glassmorphism animée.  
Chaque session couple traitement audio bas niveau et animation haut de gamme pour donner l’illusion d’un assistant présent, réactif et conscient du contexte.

---

## 2. Stack technique

| Couche | Outils & libs | Rôle |
| --- | --- | --- |
| **UI** | React 19, TypeScript 5.8, hooks personnalisés | Composition déclarative de l’interface et gestion d’état locale |
| **Build & DX** | Vite 6, @vitejs/plugin-react, vite-plugin-pwa | Dev server ultra-rapide, bundling ES modules, génération PWA |
| **Stylisation** | Tailwind CSS 3.4, PostCSS, Google Fonts | Design system utility-first et animations sur mesure |
| **Audio/Vision** | Web Audio API, MediaStream API, Canvas API | Capture micro/caméra, analyse fréquentielle, visualisations |
| **IA & Streaming** | @google/genai (Gemini 2.5 Flash) | Sessions WebSocket, envoi PCM 16 kHz, réception 24 kHz |
| **Tooling** | vite-plugin-pwa, tsconfig paths `@/*`, linting TS | PWA installable, alias clairs, typage strict |

---

## 3. Architecture & composants

- **`App.tsx`** : point d’orchestration unique (connexion Gemini, pipelines audio/vidéo, visualisations, notification & reconnection).
- **`components/`** : UI découpée en modules (panneau de contrôle, visualiseur, sélecteurs de voix/personnalités, toasts, loaders...).
- **`hooks/`** : hooks maison pour encapsuler la capture média, la latence, les timers ou la persistance.
- **`utils/audioUtils.ts`** : conversions PCM/Float32, encodage Base64, création de blobs et décodage audio.
- **`systemConfig.ts` & `constants.ts`** : instructions système, thèmes par personnalité, mapping de voix Gemini.
- **`vite.config.ts`** : configuration serveur 0.0.0.0:3000, alias `@`, enregistrement PWA (cache fonts, Gemini API, assets).

Flux principal :
1. Connexion à Gemini Live via @google/genai (session WebSocket).
2. Capture micro + normalisation (`utils/audioUtils`), envoi streaming.
3. Réception audio synthèse → buffer circulaire → restitution Web Audio.
4. Synchronisation UI (latence, statut, visualisations Canvas, toasts).
5. Vision optionnelle (caméra/screen share) pour contexte multi-modal.

---

## 4. Fonctionnalités MVP

### 🎙️ Audio temps réel
- Full-duplex, micro 16 kHz → IA 24 kHz, buffer intelligent, interruption naturelle.
- 6 voix Gemini préconfigurées, sélection instantanée, normalisation automatique.

### 👁️ Vision & partage
- Capture caméra 1 FPS, partage d’écran 0.5 FPS avec indicateurs de confidentialité.
- Mode Picture-in-Picture, vue plein écran, switch dynamique de périphériques.

### 🎭 Personnalités & thèmes
- Éditeur intégré (nom, instructions système, voix, palette).
- Persistance locale (localStorage) + thèmes glassmorphism animés.

### 🛰️ Fiabilité & observabilité
- Reconnexion automatique (backoff exponentiel 5 essais), indicateur de latence, toasts contextuels, nettoyage mémoire des flux.

### 🎨 Visualisations premium
- Visualiseur multi-couches (particules, spectre basses/médiums/aigus, mode veille respirant).

---

## 5. Prérequis

- **Node.js ≥ 18** (LTS recommandé).
- Gestionnaire de paquets : npm 9+, yarn 1.22+ ou pnpm 8+.
- **Clé API Gemini Live** depuis [Google AI Studio](https://aistudio.google.com/apikey).
- Navigateurs supportés : Chrome/Edge 120+, Firefox 121+, Safari 17+ (audio/vision nécessite HTTPS ou `localhost`).

---

## 6. Installation & configuration

```bash
git clone https://github.com/votre-username/neuroChat-Live-Immersive-Pro.git
cd neuroChat-Live-Immersive-Pro
npm install        # ou yarn install / pnpm install
```

Configurer l’environnement :

```bash
cp .env.sample .env   # si disponible, sinon créez .env
```

```env
GEMINI_API_KEY=votre_cle_api
```

> Ne jamais commiter la clé. Utilisez des secrets (Vercel, Netlify, Render...) en production.

---

## 7. Lancement

| Contexte | Commande | Résultat |
| --- | --- | --- |
| Développement | `npm run dev` | Dev server Vite sur `http://localhost:3000` avec HMR |
| Build production | `npm run build` | Bundle optimisé dans `dist/` |
| Prévisualisation | `npm run preview` | Sert le build prod en local (idéal avant déploiement) |

PWA : `vite-plugin-pwa` enregistre un service worker, icônes et manifest pour installation desktop/mobile.

---

## 8. Structure du projet

```
neuroChat-Live-Immersive-Pro/
├─ components/              # UI modulaire (panneau, visualiseurs, toasts…)
├─ hooks/                   # useAudioStream, useLatency, useMediaDevices…
├─ utils/
│  └─ audioUtils.ts         # conversions PCM/Float, encodage base64
├─ public/                  # assets statiques (icônes, logos, manifest)
├─ App.tsx                  # orchestration principale
├─ constants.ts             # personnalités, voix, couleurs
├─ systemConfig.ts          # instructions système Gemini
├─ types.ts                 # types partagés (flux audio, personnalités…)
├─ index.tsx / index.html   # bootstrap React + entry Vite
├─ vite.config.ts           # hôte 0.0.0.0:3000, alias, PWA
├─ tailwind.config.js       # tokens design, animations
├─ tsconfig.json            # paths `@/*`, target ES2022
├─ README.md / ROADMAP.md   # documentation & vision produit
└─ package.json             # scripts, dépendances
```

---

## 9. Variables d’environnement

| Variable | Description | Obligatoire | Exemple |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | Clé Gemini Live (WebSocket streaming) | ✅ | `AIzaSy...` |

Pour récupérer la clé :
1. Aller sur [Google AI Studio](https://aistudio.google.com/apikey).
2. Créer une API key “Server”.
3. Déposer la valeur dans `.env` (ou Secret Manager de votre plateforme).

---

## 10. Bonnes pratiques de contribution

- **Workflow Git** : fork → branche thématique (`feat/`, `fix/`, `docs/`) → commits atomiques → PR détaillée (use cases, screenshots, tests).
- **Style & tooling** : TypeScript strict, composants fonctionnels, hooks pour la logique réutilisable, indentation 2 espaces, respecter Tailwind + variables partagées.
- **Tests & QA** : vérifier `npm run build`, tester audio/vision sur Chrome + Safari, documenter toute nouvelle variable d’environnement.
- **Docs & design** : mettre à jour README/ROADMAP si la fonctionnalité impacte l’UX, ajouter des captures avant/après pour la revue.

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

- [Documentation Gemini Live](https://ai.google.dev/gemini-api/docs)
- [Google AI Studio](https://aistudio.google.com/)
- [React 19](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Web Audio API](https://developer.mozilla.org/docs/Web/API/Web_Audio_API)

---

<div align="center">
  Développé avec ❤️ et Gemini Live API
</div>
