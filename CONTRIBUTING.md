# 🤝 Contribuer à NeuroChat Live Pro

Merci de vouloir participer au développement de **NeuroChat Live Pro** ! Ce projet est un effort communautaire pour créer l'assistant IA le plus puissant et le plus libre possible.

---

## 🚀 Démarrage Rapide

1. **Fork** le repo.
2. **Clone** ton fork :
   ```bash
   git clone https://github.com/votre-user/NeuroChat-Live-Pro.git
   cd NeuroChat-Live-Pro
   ```
3. **Installation** :
   ```bash
   npm install
   ```
4. **Configuration** : Ajoute ta clé Gemini dans `.env.local`.
   ```env
   VITE_GEMINI_API_KEY=votre_cle
   ```
5. **Browsers** : Installe les navigateurs pour les outils d'autonomie web :
   ```bash
   npx playwright install chromium
   ```

---

## 🛠 Workflow de Développement

- **Lancer en Dev** : `npm run electron:dev` (Lance Vite + Electron).
- **Tests** : `npm run test:all` (Unitaires + E2E).
- **Lint** : Respectez les conventions définies dans `.cursorrules`.

---

## 🌿 Règles de Branchement & Commits

- **Branche** : `feat/nom-fonctionnalite` ou `fix/nom-bug`.
- **Commits** : Suivre la convention [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) (ex: `feat: add web scraping tool`).

---

## 📝 Directives pour les Pull Requests

1. **Focus** : Une PR par fonctionnalité ou correction.
2. **Tests** : Toute nouvelle logique doit être accompagnée d'un test (Vitest ou Playwright).
3. **Documentation** : Si vous modifiez un outil ou un canal IPC, mettez à jour `API_DOCS.md`.
4. **Screenshots** : Pour les changements d'UI, incluez des captures d'écran avant/après.

---

## 📜 Code de Conduite

- Soyez bienveillant et professionnel.
- Privilégiez l'accessibilité et la simplicité dans le code.
- La sécurité des données utilisateur est une priorité absolue.

---

## ⚖️ Licence
En contribuant, vous acceptez que votre code soit placé sous licence **MIT**.
