# 🗺️ Roadmap NeuroChat Pro

Document vivant décrivant la trajectoire du produit, des fondations MVP vers une version 1 prête production puis les paris long terme.

---

## 📊 Vue d'ensemble

| Phase | Objectif | Statut | Jalons cibles |
| --- | --- | --- | --- |
| **MVP** | Expérience immersive audio/vision + UI premium | ✅ livrée | Déc. 2024 |
| **v0.1 – Hardening** | Stabilité, UX clavier/périphériques, couverture tests | 🔄 en cours | Q1 2025 |
| **v0.2 – Intelligence** | Transcriptions, mémoire, analytics, i18n | 📋 planifiée | Q2 2025 |
| **v1.0 – Production** | Sécurité, architecture modulaire, multi-plateforme | 🎯 futur | Q3 2025 |
| **Futur+** | Extensions visionnaires (offline, XR, multi-agents) | 💡 backlog | Post v1 |

---

## ✅ Phase 1 — MVP (déployé)

### Livrables clés

- ✅ **Session Gemini Live WebSocket** : Connexion fiable avec audio downlink 24 kHz, uplink 16 kHz
- ✅ **Visualiseur audio premium** : Design glassmorphism responsive, mode sombre, animations fluides
- ✅ **Contrôles vision** : Caméra/screen share, PiP, vue plein écran, sélection périphériques
- ✅ **Système de personnalités** : 6 voix Gemini, thèmes dynamiques, instructions système, persistance locale
- ✅ **Outils intégrés** : Plus de 30 fonctions disponibles (notes, agenda, calculatrice, conversions, etc.)
- ✅ **Résilience** : Reconnexion automatique, indicateur de latence, toasts contextuels, nettoyage mémoire
- ✅ **PWA** : Installation desktop/mobile, service worker, cache intelligent

### Dette résiduelle

- ⚠️ Tests automatisés minimaux
- ⚠️ Processus de déploiement/monitoring encore manuels
- ⚠️ Documentation API/SDK à compléter

---

## 🔧 Phase 2 — v0.1 Hardening (Q1 2025)

**Objectif** : Fiabiliser l'existant pour préparer les fonctionnalités avancées.

### Technique & qualité

- [ ] **Refactoring architecture** : Séparer la logique métier de `App.tsx` (hooks dédiés audio, vision, statut)
- [ ] **Tests unitaires** : 
  - `utils/audioUtils.ts` (conversions PCM/Float32)
  - `utils/tools.ts` (exécution des fonctions)
  - Snapshots des composants critiques (`Visualizer`, `ControlPanel`)
- [ ] **Tests d'intégration** : 
  - Connexion Gemini mockée
  - Flux audio simulé
  - Tests end-to-end avec Playwright/Cypress
- [ ] **Optimisations performance** : 
  - Memoization des composants lourds
  - Lazy loading des composants non critiques
  - Cleanup ressources vision (mémoire, CPU)
  - Code splitting avancé

### Expérience utilisateur

- [ ] **Raccourcis clavier** :
  - Push-to-talk (espace)
  - Mute/unmute (M)
  - Toggle caméra/écran (V)
  - Nouvelle conversation (N)
- [ ] **Sélection périphériques** :
  - Liste détaillée des périphériques I/O
  - Sauvegarde des préférences dans localStorage
  - Test de périphériques avant utilisation
- [ ] **Contrôle audio** :
  - Contrôle volume de sortie
  - Mode silencieux
  - Égaliseur audio (optionnel)
- [ ] **Accessibilité** :
  - ARIA labels complets
  - Focus management
  - Navigation clavier complète
  - Support lecteurs d'écran
- [ ] **Animations** : Transitions fluides entre personnalités

### Transcriptions & historique

- [ ] **Transcriptions bidirectionnelles** :
  - Statut intermédiaire (en temps réel)
  - Statut final (corrigé)
  - Affichage dans l'interface
- [ ] **Historique persistant** :
  - Stockage IndexedDB
  - Recherche dans l'historique
  - Filtres par date/personnalité
- [ ] **Export conversation** :
  - Format TXT
  - Format JSON
  - Format Markdown

### Indicateurs de réussite

- ✅ Latence moyenne < 500 ms
- ✅ Crash rate < 1% session
- ✅ >50% couverture tests ciblés
- ✅ Score Lighthouse > 85 (Performance)

---

## 🧠 Phase 3 — v0.2 Intelligence augmentée (Q2 2025)

**Objectif** : Enrichir la valeur métier via mémoire, insights et internationalisation.

### IA & multimodal

- [ ] **Mémoire long terme** :
  - Stockage conversationnel structuré
  - Rappel contextuel automatique
  - Résumé des conversations précédentes
- [ ] **Tool calling avancé** :
  - Recherche web améliorée
  - Intégrations externes (calendrier, CRM, etc.)
  - Plugins système personnalisables
- [ ] **Mode multi-modèles** :
  - Gemini Flash vs Pro selon usage
  - Sélection automatique du modèle optimal
  - Fallback intelligent
- [ ] **RAG simple** :
  - Documents uploadés (PDF, DOCX, TXT)
  - URLs pour contexte web
  - Indexation et recherche sémantique

### Accessibilité & i18n

- [ ] **Interface multilingue** :
  - FR/EN en priorité
  - Réglage dynamique de la langue
  - Traduction de l'interface complète
- [ ] **Sous-titres améliorés** :
  - Affichage en temps réel
  - Personnalisation (taille, couleur, position)
  - Mode transcription-only pour environnement silencieux
- [ ] **Commandes vocales** :
  - "Passe en mode sombre"
  - "Active la caméra"
  - "Change de personnalité"
  - "Ouvre les notes"

### Analytics produit

- [ ] **Dashboard analytics** :
  - Durée moyenne des sessions
  - Tokens consommés
  - Latence moyenne
  - Taux d'erreurs
  - Utilisation des outils
- [ ] **Analyse de sentiment** :
  - Détection automatique
  - Tags automatiques
  - Suggestions d'amélioration
- [ ] **Export des métriques** :
  - CSV/JSON
  - Webhooks pour intégrations
  - Rapports périodiques

### Personnalisation avancée

- [ ] **Import/export personnalités** :
  - Format JSON standardisé
  - Marketplace interne
  - Partage communautaire
- [ ] **Système de plugins UI** :
  - Cards custom
  - Actions rapides
  - Widgets personnalisables

### KPIs

- ✅ Support 5 langues minimum
- ✅ Dashboard analytics utilisé par 80% des sessions internes
- ✅ Temps de réponse moyen < 300 ms

---

## 🚀 Phase 4 — v1.0 Production Ready (Q3 2025)

**Objectif** : Industrialiser le produit (sécurité, scalabilité, multi-plateforme).

### Architecture & infra

- [ ] **Gestion d'état globale** :
  - Zustand / Redux Toolkit
  - Séparation stricte UI/logic
  - State management centralisé
- [ ] **Pipeline CI/CD** :
  - Lint automatique (ESLint, Prettier)
  - Tests automatisés (unitaires, intégration, E2E)
  - Build et déploiement automatiques
  - Qualité de code (SonarQube)
- [ ] **Optimisations avancées** :
  - Code splitting par route
  - Optimisation bundle (tree-shaking)
  - Monitoring (Sentry/LogRocket)
  - Performance tracking
- [ ] **Sécurité backend** :
  - Proxy backend ou functions serverless
  - Sécurisation de la clé Gemini
  - Rate limiting
  - Validation des entrées

### Sécurité & conformité

- [ ] **Authentification** :
  - OAuth (Google, GitHub)
  - Firebase Auth / Supabase Auth
  - Gestion des sessions
- [ ] **Chiffrement** :
  - Chiffrement des données sensibles
  - HTTPS obligatoire
  - Gestion RGPD (opt-in, purge)
- [ ] **Audit sécurité** :
  - Rate limiting avancé
  - Audit sécurité régulier
  - Politique de logs
  - Gestion des vulnérabilités

### Multi-plateforme

- [ ] **PWA complète** :
  - Mode offline fonctionnel
  - Cache intelligent
  - Synchronisation en arrière-plan
- [ ] **Packager desktop** :
  - Electron ou Tauri
  - Build Windows/Mac/Linux
  - Auto-update
- [ ] **Packager mobile** :
  - React Native ou Capacitor
  - Build iOS/Android
  - Intégration native (notifications, etc.)
- [ ] **Optimisation responsive** :
  - Tablette optimisée
  - Grands écrans (4K+)
  - Mode paysage/portrait

### Documentation & support

- [ ] **Guide de déploiement infra** :
  - Instructions détaillées
  - Exemples de configuration
  - Troubleshooting
- [ ] **Documentation API/SDK** :
  - Documentation complète
  - Exemples de code
  - Playground interactif
- [ ] **Wiki & support** :
  - Wiki complet
  - FAQ exhaustive
  - Vidéos onboarding
  - Support communautaire

### KPIs

- ✅ Score Lighthouse > 90 (Performance / Accessibilité / Best Practices)
- ✅ Couverture tests > 80%
- ✅ MTTR < 1h grâce au monitoring
- ✅ Disponibilité > 99.9%

---

## 💡 Backlog stratégique (Post-v1)

### Privacy & offline

- **Modèles locaux** : Intégration Ollama pour mode offline complet
- **Chiffrement E2E** : Conversations chiffrées de bout en bout
- **Mode offline** : Fonctionnement complet sans connexion internet
- **Données locales** : Stockage entièrement local avec option cloud

### XR & immersion

- **WebXR** : Support réalité virtuelle/augmentée
- **Avatars 3D** : Représentation visuelle de l'assistant
- **Contrôle gestuel** : Interactions par gestes
- **Expérience VR** : Mode réalité virtuelle complet

### Communauté & écosystème

- **Marketplace publique** : Partage de personnalités/prompts
- **Système de notation** : Évaluation des personnalités
- **API entreprise** : Intégrations calendrier, CRM, etc.
- **Plugins tiers** : Système d'extensions ouvert

### Multi-agents & émotion

- **Agents spécialisés** : Agents collaboratifs par domaine
- **Détection émotionnelle** : Analyse et réponse aux émotions
- **Apprentissage continu** : Amélioration basée sur les interactions
- **Personnalisation adaptative** : Ajustement automatique du comportement

### Expérience sensorielle

- **Thèmes animés dynamiques** : Thèmes réactifs au contexte
- **Haptique mobile** : Retour haptique sur mobile
- **Feedback lumineux IoT** : Intégration avec appareils IoT
- **Expérience multi-sensorielle** : Stimulation visuelle, auditive, tactile

---

## 📈 Suivi & collaboration

### Gestion des issues

- Les issues GitHub sont taguées selon les phases : `phase:mvp | phase:v0.1 | phase:v0.2 | phase:v1 | future`
- Chaque feature majeure doit référencer cette roadmap
- Critères d'acceptation et métriques requis pour chaque feature

### Processus de revue

- **Revues de roadmap** : Mensuelles ou à chaque fin de sprint
- **Ajustement des priorités** : Basé sur les retours utilisateurs et contraintes techniques
- **Feedback communautaire** : Intégration des suggestions via Issues/Discussions

### Contribution

- Les contributions sont les bienvenues ! Consultez le [README.md](README.md) pour les guidelines
- Proposez vos idées via les [Issues GitHub](https://github.com/votre-username/NeuroChat-Live-Pro/issues)
- Participez aux discussions pour partager vos retours

---

<div align="center">
  💡 <strong>Cette roadmap évolue selon les retours utilisateurs et les contraintes techniques.</strong><br/>
  Partagez vos propositions via les <a href="https://github.com/votre-username/NeuroChat-Live-Pro/issues">Issues GitHub</a>.
</div>
