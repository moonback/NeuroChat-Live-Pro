# API & Tools Documentation - NeuroChat Live Pro

NeuroChat Live Pro operates on two internal API layers: **Electron IPCs** (System access) and **Assistant Tools** (AI-driven actions).

## 💻 Electron IPC Channels

These channels bridge the React frontend (Renderer) and the Electron Main process.

### File System
- `read-file(path: string)`: Reads a file from the `public` or `userData` folder.
- `write-file({ path: string, content: string })`: Writes content to the local filesystem.

### System Control
- `execute-command(command: string)`: Executes a terminal command (Windows). Used for opening apps or checking system info.

### Autonomous Browser (Playwright)
- `browser-navigate(url: string)`: Navigates to a specific URL.
- `browser-get-content()`: Scrapes the text content of the current page.
- `browser-click(selector: string)`: Clicks an element.
- `browser-type({ selector, text })`: Types text into an input field.
- `browser-press(key: string)`: Simulates a keypress (e.g., 'Enter').
- `browser-screenshot()`: Takes a base64 JPEG screenshot.
- `browser-close()`: Closes the autonomous browser instance.

---

## 🤖 Assistant Tools (Function Calling)

These tools are exposed to the Gemini Live API. The AI decides when to call them.

### System & Local
- `run_terminal_command(command)`: AI can execute shell commands. *Note: Clarified for opening apps like "start notepad".*
- `set_screen_share(enabled)`: Toggles screen sharing visibility for the assistant.

### Web Autonomy
- `browser_navigate(url)`: Assistant visits a website.
- `browser_get_content()`: Assistant reads the page it's currently on.
- `browser_click(selector)`: Assistant interacts with page elements.
- `browser_type(selector, text)`: Assistant fills out web forms.
- `browser_screenshot()`: Assistant takes a snapshot of the current web view.

### Utilities
- `generate_conclusion_markdown(conclusion, title)`: Generates a summary of the session and saves it locally.
- `change_personality(personalityId)`: Voice-commanded personality switching.

---

## 🔄 Data Request Flow
1. **Trigger**: AI receives a user prompt and identifies a tool requirement.
2. **Tool Call**: Gemini sends a `ToolCall` message over WebSocket.
3. **Execution**: Frontend calls `executeFunction` in `utils/tools.ts`.
4. **IPC**: If system access is needed, frontend calls `window.ipcRenderer.invoke`.
5. **Response**: Result is sent back to Gemini via `sendToolResponse`.
