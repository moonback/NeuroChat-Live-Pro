# ROADMAP — NeuroChat Pro

Document vivant décrivant la trajectoire produit/tech de NeuroChat Pro, du MVP actuel vers une version “production-ready”.

---

## Vue d’ensemble

| Phase | Objectif | Statut |
|---|---|---|
| **MVP (actuel)** | Audio Live + Vision + UI premium + Tool calling local | ✅ |
| **v0.1 Hardening** | Fiabilité, QA, perf, accessibilité, dette technique | 🔄 |
| **v0.2 Intelligence** | Transcriptions, mémoire, analytics, i18n | 📋 |
| **v1.0 Production** | Sécurité (proxy), auth, storage durable, CI/CD | 🎯 |

---

## Phase 1 — MVP (déjà livré)

### Livrables

- **Gemini Live**: session streaming audio bidirectionnel
- **Pipeline audio**: capture micro → PCM → envoi → lecture bufferisée
- **Vision**: caméra + partage écran + overlay (PiP / plein écran)
- **Tool calling**: fonctions locales (notes, agenda, heures, utilitaires)
- **PWA**: manifest + service worker (cache assets)
- **Persistance locale**: personnalité, documents, préférences (localStorage)

### Dette / limites connues

- Clé API injectée côté frontend (⚠️ pas adapté production publique)
- Pas de tests automatisés
- `localStorage` comme stockage principal (capacité limitée / pas de sync)

---

## Phase 2 — v0.1 Hardening (court terme)

### Architecture / refactor

- [x] Extraire des briques pour réduire `App.tsx` (ex: `useLocalStorageState`, `VideoOverlay`, layout desktop)
- [ ] Extraire la **session Gemini Live** dans un hook dédié (ex: `hooks/useGeminiLiveSession.ts`)
- [ ] Normaliser les “stores” (option: Zustand) si l’app grossit

### Qualité & DX

- [ ] Ajouter ESLint + Prettier + scripts CI
- [ ] Tests unitaires (priorité):
  - `utils/audioUtils.ts`
  - `utils/tools.ts`
  - `hooks/useVisionManager.ts` (tests de logique pure)
- [ ] Tests E2E (Playwright) pour les flows:
  - démarrer/terminer session
  - toggle vision/screen share
  - exécution tool calling (mock)

### UX / accessibilité

- [ ] Gestion focus/clavier (dock, overlays, modals)
- [ ] États d’erreur plus explicites (permissions micro/caméra)
- [ ] Mode “privacy”/consentement plus clair pour la vision

---

## Phase 3 — v0.2 Intelligence (moyen terme)

- [ ] Transcriptions bidirectionnelles (affichage + export)
- [ ] Historique de conversation (IndexedDB)
- [ ] Mémoire long terme (résumés + préférences utilisateur)
- [ ] i18n (FR/EN minimum)
- [ ] RAG “simple” sur documents uploadés (indexation + recherche)

---

## Phase 4 — v1.0 Production Ready (long terme)

### Sécurité (priorité)

- [ ] **Backend proxy** (serverless/edge) pour Gemini Live (clé jamais exposée)
- [ ] Rate limiting + validation des entrées
- [ ] Observabilité (Sentry + logs + métriques)

### Auth & données

- [ ] Auth (OAuth / Firebase / Supabase)
- [ ] Stockage durable:
  - notes/agenda/heures en DB
  - documents en object storage
- [ ] Sync multi-device + politique RGPD (export/purge)

### Livraison

- [ ] CI/CD (build + tests + deploy)
- [ ] Monitoring perf (Lighthouse, Web Vitals)
- [ ] Packaging desktop (Tauri/Electron) si besoin

---

## Backlog (idées)

- Mode offline “réel” (IndexedDB + fallback UX)
- Multi-agents / rôles (assistant spécialisé)
- Plugins/outils configurables (marketplace)
- Intégrations externes (Google Calendar, Notion, Slack…)


