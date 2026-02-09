# 🧠 NeuroChat Live Pro

> **Assistant IA Professionnel avec Conversations Vocales en Temps Réel**  
> Une application Desktop immersive propulsée par Gemini Live pour des interactions vocales naturelles, l'analyse visuelle et l'exécution d'outils complexes.

---

## 📖 À propos

**NeuroChat Live Pro** est un assistant IA conversationnel de nouvelle génération conçu pour offrir une expérience utilisateur fluide et immersive. En exploitant la puissance de **Google Gemini Live** et une intégration **Electron** profonde, il offre une réactivité sans précédent (conversations vocales fluides) et des capacités d'action directes sur votre système.

L'application se concentre sur une personnalité centrale : **NeuroChat Pro**, optimisée pour la productivité, l'analyse stratégique et l'assistance technique en temps réel.

### 🎯 Points forts
- **Interaction Naturelle** : Parlez à votre IA comme à un humain.
- **Vision Contextuelle** : Partagez votre écran ou votre caméra pour une assistance visuelle.
- **Autonomie Web** : L'assistant peut naviguer sur Internet pour vous.
- **Contrôle Système** : Exécution de commandes terminal et gestion de fichiers locale.
- **Confidentialité** : Approche "Local-First", vos documents et notes restent sur votre machine.

---

## ✨ Fonctionnalités Principales

### 🎙️ Conversations Vocales en Temps Réel
- **Audio Bidirectionnel** : Latence ultra-faible (< 200ms) pour une discussion fluide.
- **Voix Premium** : 6 voix naturelles Google (Puck, Charon, Kore, Fenrir, Zephyr, Aoede).
- **VAD (Voice Activity Detection)** : Détection automatique de la parole et interruptions naturelles.
- **Reconnexion Intelligente** : Gestion robuste des sessions Gemini Live.

### 👁️ Vision et Analyse Vidéo
- **Analyse Caméra** : Description d'objets ou de documents via webcam.
- **Partage d'Écran** : Assistance technique en direct, analyse de code ou de données à l'écran.
- **Suivi des Yeux (Beta)** : Interaction basée sur l'attention visuelle.

### 🛠️ Outils et "Function Calling"
- **Navigation Web Autonome** : L'assistant peut naviguer sur le web via Playwright (recherche, lecture de contenu).
- **Contrôle PC** : Exécution de commandes Shell (ex: ouvrir des apps, gérer des dossiers).
- **Gestion de Documents** : Analyse de fichiers PDF, TXT, MD avec contexte persistant.
- **Utilitaires Intégrés** : Calculs, timers, rappels, gestion de notes et d'agenda.
- **Google Search** : Recherche d'informations en direct sur le web.

---

## 🛠️ Stack Technique

### Frontend & Desktop
- **React 19** : Interface utilisateur moderne et réactive.
- **Electron 39** : Intégration système et capacités Desktop.
- **Tailwind CSS 3** : Design system premium et responsive.
- **Zustand 5** : Gestion d'état fluide avec persistance LocalStorage.

### IA & Services
- **Gemini Live API** : @google/genai pour les sessions vocales multimodales.
- **Playwright** : Automatisation de navigateur pour la navigation web autonome.
- **PostCSS / Vite 6** : Build system optimisé.

### Qualité & Tests
- **Vitest** : Tests unitaires ultra-rapides.
- **Playwright Test** : Tests End-to-End (E2E) pour valider les workflows réels.

---

## 🚀 Installation

### Prérequis
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Clé API Google Gemini** ([Obtenir ici](https://aistudio.google.com/))

### 1. Installation des dépendances
```bash
git clone https://github.com/votre-repo/NeuroChat-Live-Pro.git
cd NeuroChat-Live-Pro
npm install
```

### 2. Configuration
Créez un fichier `.env.local` à la racine :
```env
VITE_GEMINI_API_KEY=votre_cle_api_ici
```

### 3. Lancement
**Mode Développement (Vite + Electron) :**
```bash
npm run electron:dev
```

**Compiler pour Production :**
```bash
npm run electron:build
```

---

## 🗂️ Structure du Projet

```
NeuroChat-Live-Pro/
├── components/         # UI Components (Header, ControlPanel, Visualizer...)
├── electron/           # Code du processus principal Electron (IPC, Browser Service)
├── hooks/              # Logique métier réutilisable (useGeminiLiveSession, useVision...)
├── stores/             # État global (uiStore, appStore)
├── utils/              # Outils système, traitement de documents, function calling
├── constants.ts        # Configuration des voix et de la personnalité par défaut
├── systemConfig.ts     # Règles fondamentales et prompt système
└── App.tsx             # Point d'entrée de l'application
```

---

## 📄 Documentation Additionnelle

- [🏗️ ARCHITECTURE.md](ARCHITECTURE.md) : Détails techniques et flux de données.
- [🔌 API_DOCS.md](API_DOCS.md) : Référence des outils et des canaux IPC.
- [💾 DB_SCHEMA.md](DB_SCHEMA.md) : Organisation du stockage local.
- [🗺️ ROADMAP.md](ROADMAP.md) : Évolutions prévues.
- [🤝 CONTRIBUTING.md](CONTRIBUTING.md) : Comment participer au projet.

---

## 📄 Licence
Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---
<div align="center">
Développé par <b>Maysson</b> | 2025
</div>
