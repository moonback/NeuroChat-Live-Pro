# 🔌 Documentation API & Outils - NeuroChat Live Pro

L'application utilise deux types d'APIs internes : les **Canaux IPC Electron** (accès système) et les **Outils Assistant** (Function Calling IA).

---

## 🤖 Outils de l'Assistant (Function Calling)

Ces fonctions sont directement accessibles par l'IA via le SDK Gemini Live.

### 🌐 Navigation Web & Recherche
- `google_search(query)` : Effectue une recherche Google en temps réel.
- `browser_navigate(url)` : Dirige l'assistant vers une page web spécifique.
- `browser_get_content()` : Extrait le texte de la page web actuellement ouverte.
- `browser_click(selector)` : Interagit avec un élément de la page (bouton, lien).
- `browser_type(selector, text)` : Remplit un formulaire ou un champ de recherche.
- `browser_screenshot()` : Prend une capture d'écran du navigateur autonome.

### 💻 Contrôle Système & Local
- `run_terminal_command(command)` : Exécute une commande PowerShell/CMD sur la machine.
- `set_screen_share(enabled)` : Active ou désactive la visibilité de l'écran pour l'IA.
- `generate_conclusion_markdown(conclusion, title)` : Sauvegarde un résumé de la session au format Markdown.

### 🛠️ Utilitaires & Gestion
- `manage_notes(action, content, id)` : Crée, lit ou supprime des notes locales.
- `manage_timer(action, duration)` : Gère des compte à rebours.
- `calculate(expression)` : Effectue des calculs mathématiques complexes.
- `change_personality(personalityId)` : Permet de réinitialiser le contexte vers la personnalité par défaut (NeuroChat Pro).

---

## 💻 Canaux IPC Electron (Inter-Process Communication)

Ces canaux permettent au Renderer (React) de demander des actions au Main Process (Node.js).

### Gestion de Fichiers (`ipcMain.handle`)
- `file:read` : Lit le contenu d'un fichier local.
- `file:write` : Écrit des données dans un fichier (ex: stockage des personnalités).
- `file:delete` : Supprime un fichier spécifique.

### Automatisation (`ipcMain.handle`)
- `browser:navigate` : Pilotage de Playwright pour charger une URL.
- `browser:action` : Clic, Type, ou Scroll via Playwright.
- `system:exec` : Exécution de commandes shell via `child_process`.

---

## 🔄 Flux de Requête (Data Flow)

1. **Gemini** identifie un besoin d'outil dans le flux audio/texte.
2. Un message `tool_call` est envoyé via WebSocket.
3. Le hook `useGeminiLiveSession` intercepte l'appel et appelle `executeFunction` (`utils/tools.ts`).
4. Si l'outil nécessite un accès système, `window.electron.invoke` est appelé.
5. Le résultat est retourné à Gemini via `tool_response`.

---

## 🔒 Sécurité & Limitations
- **Whitelisting** : Seules les commandes terminal jugées sûres sont autorisées (configuré dans `electron/main.ts`).
- **Sandboxing** : Le navigateur autonome (Playwright) tourne dans un processus séparé.
- **Isolation** : La clé API Gemini ne transite jamais dans les logs utilisateur.
