# Contributing to NeuroChat Live Pro

First off, thank you for considering contributing to NeuroChat Live Pro! It's people like you who make this tool better for everyone.

## 🚀 Getting Started

1. **Fork the repository** to your own GitHub account.
2. **Clone the project** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/NeuroChat-Live-Pro.git
   cd NeuroChat-Live-Pro
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Set up your environment**: Create a `.env.local` file with your Gemini API Key:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```
5. **Install Playwright Browsers**:
   ```bash
   npx playwright install chromium
   ```

## 🛠 Development Workflow

- **Dev Mode**: Starts both the Vite dev server and Electron.
  ```bash
  npm run electron:dev
  ```
- **Tests**: Run unit tests and E2E tests before submitting changes.
  ```bash
  npm run test:all
  ```
- **Linting**: Ensure your code follows the project's styling (handled by `.cursorrules` if using Cursor).

## 🌿 Branching Strategy

- `main`: Stable production-ready code.
- `feat/your-feature`: For new features.
- `fix/your-bug`: For bug fixes.

## 📝 Pull Request Guidelines

1. **Keep it focused**: Each PR should address a single issue or feature.
2. **Document your changes**: Update `ARCHITECTURE.md` or `API_DOCS.md` if you add new system logic or tools.
3. **Include tests**: Add Vitest or Playwright tests for your new logic.
4. **Be descriptive**: Explain *why* the change is needed and *how* it works.

## 🎨 Code Of Conduct

- Be respectful to other contributors.
- Focus on constructive feedback.
- Help make NeuroChat a safe and welcoming space for everyone.

## ⚖️ License
By contributing, you agree that your contributions will be licensed under the project's **MIT License**.
