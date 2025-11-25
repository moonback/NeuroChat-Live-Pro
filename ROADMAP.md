# 🗺️ Roadmap NeuroChat Pro

Document vivant décrivant la trajectoire du produit, des fondations MVP vers une version 1 prête production puis les paris long terme.

---

## Vue d’ensemble

| Phase | Objectif | Statut | Jalons cibles |
| --- | --- | --- | --- |
| **MVP** | Expérience immersif audio/vision + UI premium | ✅ livrée | Déc. 2024 |
| **v0.1 – Hardening** | Stabilité, UX clavier/périphériques, couverture tests | 🔄 en cours | Q1 2025 |
| **v0.2 – Intelligence** | Transcriptions, mémoire, analytics, i18n | 📋 planifiée | Q2 2025 |
| **v1.0 – Production** | Sécurité, architecture modulaire, multi-plateforme | 🎯 futur | Q3 2025 |
| **Futur+** | Extensions visionnaires (offline, XR, multi-agents) | 💡 backlog | Post v1 |

---

## Phase 1 — MVP (déployé)

### Livrables clés
- Session Gemini Live WebSocket fiable (audio downlink 24 kHz, uplink 16 kHz).
- Visualiseur audio premium, design glassmorphism responsive, mode sombre.
- Contrôles vision : caméra/screen share, PiP, vue plein écran, sélection périphériques.
- Système de personnalités (6 voix, thèmes dynamiques, instructions système, persistance locale).
- Résilience : reconnexion automatique, indicateur de latence, toasts et nettoyage mémoire.

### Dette résiduelle
- Tests automatisés minimaux.
- Processus de déploiement/monitoring encore manuels.

---

## Phase 2 — v0.1 Hardening (Q1 2025)

**Objectif : fiabiliser l’existant pour préparer les fonctionnalités avancées.**

### Technique & qualité
- [ ] Séparer la logique métier de `App.tsx` (hooks dédiés audio, vision, statut).
- [ ] Tests unitaires `utils/audioUtils.ts` + snapshots des composants critiques.
- [ ] Tests d’intégration (connexion Gemini mockée, flux audio simulé).
- [ ] Optimisations performance : memoization, lazy loading, cleanup ressources vision.

### Expérience utilisateur
- [ ] Raccourcis clavier (push-to-talk, mute, toggle caméra/écran).
- [ ] Sélection détaillée des périphériques I/O + sauvegarde des préférences.
- [ ] Contrôle volume de sortie + mode silencieux.
- [ ] Accessibilité (ARIA, focus management, navigation clavier complète).
- [ ] Animations de transition entre personnalités.

### Transcriptions & historique
- [ ] Transcriptions bidirectionnelles en temps réel (statut intermediaire/final).
- [ ] Historique persistant (IndexedDB) + recherche.
- [ ] Export conversation (TXT / JSON / Markdown).

### Indicateurs de réussite
- Latence moyenne < 500 ms.
- Crash rate < 1 % session.
- >50 % couverture tests ciblés.

---

## Phase 3 — v0.2 Intelligence augmentée (Q2 2025)

**Objectif : enrichir la valeur métier via mémoire, insights et internationalisation.**

### IA & multimodal
- [ ] Mémoire long terme (stockage conversationnel + rappel contextuel).
- [ ] Tool calling (recherche web, calculs, intégrations internes).
- [ ] Mode multi-modèles (Gemini Flash vs Pro selon usage).
- [ ] RAG simple (documents uploadés ou URL).

### Accessibilité & i18n
- [ ] Interface multilingue (FR/EN en priorité) + réglage dynamique.
- [ ] Sous-titres améliorés, mode transcription-only pour environnement silencieux.
- [ ] Commandes vocales (“Passe en mode sombre”, “Active la caméra”).

### Analytics produit
- [ ] Dashboard : durée moyenne, tokens, latence moyenne, erreurs.
- [ ] Analyse de sentiment & tags automatiques.
- [ ] Export des métriques (CSV/JSON) + Webhooks.

### Personnalisation avancée
- [ ] Import/export de personnalités (JSON) + marketplace interne.
- [ ] Système de plugins UI (cards custom, actions rapides).

### KPIs
- Support 5 langues.
- Dashboard analytics utilisé par 80 % des sessions internes.

---

## Phase 4 — v1.0 Production Ready (Q3 2025)

**Objectif : industrialiser le produit (sécurité, scalabilité, multi-plateforme).**

### Architecture & infra
- [ ] Gestion d’état globale (Zustand / Redux Toolkit) + séparation stricte UI/logic.
- [ ] Pipeline CI/CD (lint, tests, build, qualité).
- [ ] Code splitting avancé, optimisation bundle, monitoring (Sentry/LogRocket).
- [ ] Proxy backend ou functions serverless pour sécuriser la clé Gemini.

### Sécurité & conformité
- [ ] Authentification (OAuth/Firebase/Supabase).
- [ ] Chiffrement des données sensibles, gestion RGPD (opt-in, purge).
- [ ] Rate limiting, audit sécurité, politique de logs.

### Multi-plateforme
- [ ] PWA complète (offline + cache intelligent).
- [ ] Packager desktop (Electron/Tauri) & mobile (React Native/Capacitor).
- [ ] Optimisation tablette & grands écrans.

### Documentation & support
- [ ] Guide de déploiement infra.
- [ ] Documentation API/SDK.
- [ ] Wiki + FAQ + vidéos onboarding.

### KPIs
- Score Lighthouse > 90 (Performance / Accessibilité / Best Practices).
- Couverture tests > 80 %.
- MTTR < 1 h grâce au monitoring.

---

## Backlog stratégique (Post-v1)

| Thématique | Idées |
| --- | --- |
| **Privacy & offline** | Modèles locaux (Ollama), chiffrement E2E, mode offline complet |
| **XR & immersion** | WebXR, avatars 3D, contrôle gestuel, expérience VR |
| **Communauté & écosystème** | Marketplace publique de personnalités/prompts, notation, API entreprise (calendrier, CRM) |
| **Multi-agents & émotion** | Agents spécialisés collaboratifs, détection + réponse émotionnelle, apprentissage continu |
| **Expérience sensorielle** | Thèmes animés dynamiques, haptique mobile, feedback lumineux IoT |

---

## Suivi & collaboration

- Les issues GitHub sont taguées `phase:mvp | phase:v0.1 | phase:v0.2 | phase:v1 | future`.
- Chaque feature majeure doit référencer cette roadmap et proposer critères d’acceptation + métriques.
- Revues de roadmap à chaque fin de sprint (ou mensuellement) pour ajuster priorités.

---

<div align="center">
💡 Cette roadmap évolue selon les retours utilisateurs et les contraintes techniques.  
Partagez vos propositions via les <a href="https://github.com/votre-username/neuroChat-Live-Immersive-Pro/issues">Issues GitHub</a>.
</div>
