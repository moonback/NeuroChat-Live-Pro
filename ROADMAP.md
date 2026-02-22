# 🗺️ ROADMAP - NeuroChat Live Pro

Ce document détaille la trajectoire du projet, de l'état actuel (MVP) à la première version stable (V1), jusqu'aux futures évolutions de l'assistant de bureau autonome.

---

## 🟢 Objectif Actuel : MVP (Minimum Viable Product)
Le MVP pose les bases de la communication multimodale avec le système.
*Statut : Presque complété*

- [x] **Audio Temps Réel** : Communication bidirectionnelle via WebRTC et Gemini Live.
- [x] **Partage de l'écran & Caméra** : Les utilisateurs peuvent partager visuellement des éléments avec l'IA.
- [x] **Interface État/Status (VAD)** : Détection vocale pour permettre aux utilisateurs d'interrompre l'IA.
- [x] **Function Calling Basique** : Capacité à manipuler des fichiers et rechercher des informations locaux (`SOUL.md`, `MEMORY`).
- [x] **Navigation Web Autonome** : L'IA peut piloter Playwright pour récupérer des informations dynamiques invisibles en simple requête.
- [ ] **Tests UI et E2E complets** : Sécurisation de 90% des modules avec Vitest/Playwright.
- [ ] **Release Beta de l'Exécutable** : Mise à disposition des installateurs Windows/Mac.

---

## 🟡 V1 (Version Stable & Production Ready)
La version V1 visera un système autonome très robuste, dépourvu de latence, et parfaitement intégré aux environnements de développement et de bureautique standards.

- [ ] **Plugin System pour Tools** : Créer un SDK simple permettant d'ajouter ou de désactiver des outils de Function Calling (IDE hooks, Git Manager).
- [ ] **Reconnexion "Seamless"** : Amélioration drastique de la logique de reconnexion en cas de perte de session réseau avec Gemini.
- [ ] **Monitoring / Logs Utilisateur** : Historique visible des commandes système et des navigations web que l'IA exécute.
- [ ] **Personnalisation Avancée UI** : Choix des thèmes, configuration fine des panneaux d'outils et du synthétiseur de voix depuis le Dashboard.
- [ ] **Analyse des Performances** : Optimiser l'usage du CPU/RAM pour l'Agent de Bureau et l'instance Playwright cachée.
- [ ] **Support Multi-langues** : Internationalisation (i18n) complète du frontend.

---

## 🟣 Fonctionnalités Futures (Roadmap Étendue)
Une fois la base installée, l'objectif est d'aller vers la vraie "Intelligence Agente", avec des fonctionnalités contextuelles proactives.

- [ ] **Support Local LLM (Fallback)** : Intégration de modèles légers via Ollama/Llama.cpp en cas de coupure de réseau ou d'informations ultra-sensibles.
- [ ] **Agents Spécialisés** : Possibilité de passer d'un personnage "Pro/Tech" à un "Assistant Créatif" dynamiquement avec des rôles, invites et accès système distincts.
- [ ] **Intégration OS Transparente (Widgets)** : Barre flottante sur le Bureau ou raccourcis clavier globaux pour invoquer des fonctions (ex: Capture d'écran annotée directement sur macOS/Windows).
- [ ] **Mémoire Sémantique Vectorisée** : Migration d'une mémoire "fichier texte" vers une base RAG locale intégrée (SQLite/Chroma) pour des rappels d'interactions très anciens.
- [ ] **Automatisations Planifiées (Cron Tasks AI)** : Permettre à l'IA d'exécuter des actions conditionnelles de fond (ex: "Chaque matin, lis mes mails locaux et compile-les en audio").
- [ ] **Suivi des Yeux Actif (Eyetracking integration)** : Intégrer les APIs Desktop pour que l'assistance vocale comprenne la zone d'écran ciblée par l'utilisateur.

---

> Ce roadmap est sujet à modifications selon les retours des utilisateurs et les éventuelles montées de versions de l'API Google Gemini.
