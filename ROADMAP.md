# 🗺️ Roadmap - Gemini Live Immersive

Ce document détaille l'évolution prévue du projet **NeuroChat**, des fonctionnalités actuelles (MVP) aux versions futures.

---

## 📊 Vue d'ensemble

| Version | Statut | Date cible | Description |
|:---:|:---:|:---:|:---|
| **MVP** | ✅ **Actuel** | Déc 2024 | Version fonctionnelle de base (Audio/Vision/UI) |
| **v0.1.0** | 🔄 **En cours** | Q1 2025 | Améliorations UX, Stabilité et Performance |
| **v0.2.0** | 📋 **Planifié** | Q2 2025 | Intelligence avancée et nouvelles Features |
| **v1.0.0** | 🎯 **Futur** | Q3 2025 | Version Stable "Production-Ready" |

---

## ✅ MVP (Version actuelle)

La base solide du projet est déjà en place :

*   **Core** : Connexion Gemini Live API, conversation bidirectionnelle temps réel.
*   **Audio** : Traitement PCM 16kHz/24kHz, gestion de l'interruption, buffer intelligent.
*   **Vision** : Analyse flux caméra (1 FPS), PiP preview.
*   **UI/UX** : Design Glassmorphism, Visualiseur audio particules, Thèmes sombres.
*   **Personnalisation** : 4 personnalités, sélecteur de voix, persistance locale.

---

## 🔄 v0.1.0 - Améliorations UX et Stabilité (Q1 2025)

*Objectif : Consolider l'existant et rendre l'expérience utilisateur irréprochable.*

### 🛠️ Technique & Stabilité
- [x] Gestion d'erreurs robuste (Retry automatique, reconnexion WS).
- [x] Optimisation latence audio.
- [ ] Tests unitaires sur les utilitaires audio (`utils/audioUtils.ts`).
- [ ] Refactoring du composant `App.tsx` (séparation de la logique).

### 🎨 Expérience Utilisateur
- [x] Indicateur de latence (ping) en temps réel.
- [x] Feedback visuel d'état (connexion, écoute, parole).
- [ ] Raccourcis clavier (ex: Espace pour Push-to-Talk).
- [ ] Sélection des périphériques d'entrée/sortie (Micro/Casque).

### 📝 Fonctionnalités Transcriptions
- [ ] Export des conversations (TXT/JSON).
- [ ] Historique persistant (IndexedDB).
- [ ] Recherche textuelle dans l'historique.

---

## 📋 v0.2.0 - Intelligence & Features Avancées (Q2 2025)

*Objectif : Étendre les capacités cognitives et interactives.*

### 🧠 Intelligence Artificielle
- [ ] **Mémoire Long Terme** : Capacité à se souvenir des conversations passées.
- [ ] **Context Awareness** : Analyse plus fine du contexte vidéo.
- [ ] **Multi-modèles** : Possibilité de switcher (Gemini Pro vs Flash).

### 🌐 Internationalisation & Accessibilité
- [ ] Support multilingue complet (Interface + IA).
- [ ] Mode "Sous-titres" temps réel amélioré.
- [ ] Contrôle vocal de l'interface ("Neuro, passe en mode sombre").

### 📊 Analytics
- [ ] Dashboard d'utilisation (durée sessions, tokens utilisés).
- [ ] Analyse de sentiment des conversations.

---

## 🎯 v1.0.0 - Production Ready (Q3 2025)

*Objectif : Une application robuste, sécurisée et déployable à grande échelle.*

### 🏗️ Architecture
- [ ] Migration vers une architecture modulaire stricte.
- [ ] State Management global (Zustand ou Redux Toolkit).
- [ ] **PWA (Progressive Web App)** pour installation sur mobile/desktop.

### 🔐 Sécurité
- [ ] Gestion sécurisée des clés API (Proxy Backend ou Serverless Functions).
- [ ] Authentification utilisateur (Firebase/Supabase).
- [ ] Conformité RGPD (gestion des données personnelles).

### 📱 Multi-plateforme
- [ ] Adaptation mobile responsive parfaite.
- [ ] Version Desktop (via Electron ou Tauri).

---

## 🔮 Futur (Post-v1.0)

*   **Support Modèles Locaux** : Intégration d'Ollama pour tourner en local (privacy first).
*   **Réalité Augmentée** : Projection de l'assistant dans l'espace (WebXR).
*   **Marketplace** : Partage de personnalités et de prompts système par la communauté.
*   **API Entreprise** : Connecteurs pour calendriers, emails et outils pro.
