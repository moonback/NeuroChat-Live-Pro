import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, dialog } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { browserService } from './browserService'

const execPromise = promisify(exec)

// The built directory structure
//
// ├─┬ dist-electron
// │ └── main.js
// └─┬ dist
//   └── index.html

// process.env.DIST est défini par nous ou calculé
const DIST = path.join(__dirname, '../dist')
const VITE_PUBLIC = app.isPackaged ? DIST : path.join(DIST, '../public')

process.env.DIST = DIST
process.env.VITE_PUBLIC = VITE_PUBLIC

let win: BrowserWindow | null
let tray: Tray | null = null
let isQuitting = false

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(VITE_PUBLIC, 'logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    // Le visualizer profite bien d'un fond sombre par défaut
    backgroundColor: '#000000',
  })

  // Gestion de la fermeture pour minimiser dans le tray au lieu de quitter
  win.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      win?.hide()
      return false
    }
    return true
  })

  // Test active push message to Console
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(DIST, 'index.html'))
  }
}

function createTray() {
  const iconPath = path.join(VITE_PUBLIC, 'logo.png')
  // On s'assure que l'image est redimensionnée pour la barre des tâches
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })

  tray = new Tray(icon)
  tray.setToolTip('NeuroChat Live Pro')

  const updateContextMenu = () => {
    const isAlwaysOnTop = win?.isAlwaysOnTop() || false
    const isVisible = win?.isVisible() || false

    const contextMenu = Menu.buildFromTemplate([
      {
        label: isVisible ? 'Masquer NeuroChat' : 'Afficher NeuroChat',
        click: () => {
          if (isVisible) {
            win?.hide()
          } else {
            win?.show()
          }
          updateContextMenu()
        }
      },
      { type: 'separator' },
      {
        label: 'Toujours au-dessus',
        type: 'checkbox',
        checked: isAlwaysOnTop,
        click: () => {
          const newState = !isAlwaysOnTop
          win?.setAlwaysOnTop(newState)
          updateContextMenu()
        }
      },
      { type: 'separator' },
      {
        label: 'Quitter',
        click: () => {
          isQuitting = true
          app.quit()
        }
      }
    ])

    tray?.setContextMenu(contextMenu)
  }

  // Initial menu
  updateContextMenu()

  // Clic simple pour toggle la fenêtre
  tray.on('click', () => {
    if (win?.isVisible()) {
      win.hide()
    } else {
      win?.show()
      win?.focus()
    }
    updateContextMenu()
  })
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Avec le système de Tray, on ne veut PAS quitter l'app quand la fenêtre est fermée
    // On quitte seulement si isQuitting est true (géré par le menu Quitter)
    if (isQuitting) {
      app.quit()
      win = null
    }
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  } else {
    win?.show()
  }
})

app.whenReady().then(() => {
  createWindow()
  createTray()

  // --- Handlers IPC pour le système de fichiers ---

  // Obtenir le chemin vers le dossier public (ou ressource en prod)
  // En dev, on veut écrire dans le dossier source pour que les changements soient permanents
  const getBasePath = () => {
    return VITE_PUBLIC
  }

  // Lire un fichier
  ipcMain.handle('read-file', async (_, filePath: string) => {
    try {
      // Sécurité basique : empêcher de remonter trop haut
      if (filePath.includes('..')) {
        throw new Error('Access denied: relative paths not allowed')
      }

      const fullPath = path.join(getBasePath(), filePath)

      // Si le fichier n'existe pas, essayer dans userData (pour l'historique par exemple)
      if (!existsSync(fullPath) && !filePath.endsWith('.md')) { // .md sont dans public
        const userDataPath = path.join(app.getPath('userData'), filePath)
        if (existsSync(userDataPath)) {
          return await fs.readFile(userDataPath, 'utf-8')
        }
        // Si c'est un fichier json qui n'existe pas dans userData, retourner null ou vide
        if (filePath.endsWith('.json')) return null;
      }

      return await fs.readFile(fullPath, 'utf-8')
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error)
      throw error
    }
  })

  // Écrire un fichier
  ipcMain.handle('write-file', async (_, { path: filePath, content }: { path: string, content: string }) => {
    try {
      if (filePath.includes('..')) {
        throw new Error('Access denied: relative paths not allowed')
      }

      let fullPath = path.join(getBasePath(), filePath)

      // Pour les fichiers qui ne sont pas dans public (comme history.json), utiliser userData
      if (!filePath.endsWith('.md')) {
        const userDataDir = app.getPath('userData')
        fullPath = path.join(userDataDir, filePath)

        // S'assurer que le dossier existe
        const dir = path.dirname(fullPath)
        if (!existsSync(dir)) {
          await fs.mkdir(dir, { recursive: true })
        }
      }

      await fs.writeFile(fullPath, content, 'utf-8')
      return true
    } catch (error) {
      console.error(`Error writing file ${filePath}:`, error)
      return false
    }
  })

  // Sauvegarder dans le dossier Téléchargements
  ipcMain.handle('save-to-downloads', async (_, { filename, content }: { filename: string, content: string }) => {
    try {
      const downloadsPath = app.getPath('downloads')
      const fullPath = path.join(downloadsPath, filename)

      await fs.writeFile(fullPath, content, 'utf-8')
      return { result: 'success', path: fullPath }
    } catch (error) {
      console.error('Error saving to downloads:', error)
      return { result: 'error', message: String(error) }
    }
  })

  // Exécuter une commande terminal
  ipcMain.handle('execute-command', async (_, command: string) => {
    try {
      if (!command || command.trim() === '') {
        throw new Error('Commande vide')
      }

      console.log(`[Main] Exécution de la commande: ${command}`)
      const { stdout, stderr } = await execPromise(command)
      return { stdout, stderr, result: 'success' }
    } catch (error) {
      console.error(`Error executing command ${command}:`, error)
      return {
        error: error instanceof Error ? error.message : String(error),
        result: 'error'
      }
    }
  })

  // --- Handlers IPC pour le navigateur autonome ---

  ipcMain.handle('browser-navigate', async (_, { url, newTab }: { url: string, newTab?: boolean }) => {
    try {
      return await browserService.navigate(url, !!newTab)
    } catch (error) {
      console.error('[Browser] Navigation error:', error)
      return { error: String(error), result: 'error' }
    }
  })

  ipcMain.handle('browser-search', async (_, query: string) => {
    try {
      return await browserService.search(query)
    } catch (error) {
      console.error('[Browser] Search error:', error)
      return { error: String(error), result: 'error' }
    }
  })

  ipcMain.handle('browser-click', async (_, selector: string) => {
    try {
      return await browserService.click(selector)
    } catch (error) {
      console.error('[Browser] Click error:', error)
      return { error: String(error), result: 'error' }
    }
  })

  ipcMain.handle('browser-scroll', async (_, direction: 'up' | 'down' | 'top' | 'bottom') => {
    try {
      return await browserService.scroll(direction)
    } catch (error) {
      console.error('[Browser] Scroll error:', error)
      return { error: String(error), result: 'error' }
    }
  })

  ipcMain.handle('browser-back', async () => {
    try {
      return await browserService.goBack()
    } catch (error) {
      console.error('[Browser] Back error:', error)
      return { error: String(error), result: 'error' }
    }
  })

  ipcMain.handle('browser-forward', async () => {
    try {
      return await browserService.goForward()
    } catch (error) {
      console.error('[Browser] Forward error:', error)
      return { error: String(error), result: 'error' }
    }
  })

  ipcMain.handle('browser-type', async (_, { selector, text }: { selector: string, text: string }) => {
    try {
      return await browserService.type(selector, text)
    } catch (error) {
      console.error('[Browser] Type error:', error)
      return { error: String(error), result: 'error' }
    }
  })

  ipcMain.handle('browser-press', async (_, key: string) => {
    try {
      return await browserService.press(key)
    } catch (error) {
      console.error('[Browser] Press error:', error)
      return { error: String(error), result: 'error' }
    }
  })

  ipcMain.handle('browser-get-content', async () => {
    try {
      return await browserService.getContent()
    } catch (error) {
      console.error('[Browser] GetContent error:', error)
      return { error: String(error), result: 'error' }
    }
  })

  ipcMain.handle('browser-screenshot', async () => {
    try {
      return await browserService.screenshot()
    } catch (error) {
      console.error('[Browser] Screenshot error:', error)
      return { error: String(error), result: 'error' }
    }
  })

  ipcMain.handle('browser-close', async () => {
    try {
      await browserService.close()
      return { status: 'success' }
    } catch (error) {
      console.error('[Browser] Close error:', error)
      return { error: String(error), result: 'error' }
    }
  })

  // --- Deep OS Integration: Window Management ---

  ipcMain.handle('window-control', async (_, action: 'minimize' | 'maximize' | 'unmaximize' | 'close' | 'show' | 'hide' | 'center' | 'focus') => {
    if (!win) return { result: 'error', message: 'Window not found' }
    try {
      switch (action) {
        case 'minimize': win.minimize(); break
        case 'maximize': win.maximize(); break
        case 'unmaximize': win.unmaximize(); break
        case 'close': win.close(); break
        case 'show': win.show(); break
        case 'hide': win.hide(); break
        case 'center': win.center(); break
        case 'focus': win.focus(); break
      }
      return { result: 'success', action }
    } catch (error) {
      return { result: 'error', message: String(error) }
    }
  })

  ipcMain.handle('window-set-always-on-top', async (_, enabled: boolean) => {
    if (!win) return { result: 'error', message: 'Window not found' }
    try {
      win.setAlwaysOnTop(enabled)
      return { result: 'success', alwaysOnTop: win.isAlwaysOnTop() }
    } catch (error) {
      return { result: 'error', message: String(error) }
    }
  })

  ipcMain.handle('window-get-state', async () => {
    if (!win) return { result: 'error', message: 'Window not found' }
    return {
      isMaximized: win.isMaximized(),
      isMinimized: win.isMinimized(),
      isVisible: win.isVisible(),
      isAlwaysOnTop: win.isAlwaysOnTop(),
      bounds: win.getBounds()
    }
  })

  // --- Deep OS Integration: File Management (Native Dialogs & FS) ---

  ipcMain.handle('file-dialog-open', async (_, options: Electron.OpenDialogOptions) => {
    if (!win) return { result: 'error', message: 'Window not found' }
    try {
      const result = await dialog.showOpenDialog(win, options)
      return { result: 'success', ...result }
    } catch (error) {
      return { result: 'error', message: String(error) }
    }
  })

  ipcMain.handle('file-dialog-save', async (_, options: Electron.SaveDialogOptions) => {
    if (!win) return { result: 'error', message: 'Window not found' }
    try {
      const result = await dialog.showSaveDialog(win, options)
      return { result: 'success', ...result }
    } catch (error) {
      return { result: 'error', message: String(error) }
    }
  })

  ipcMain.handle('file-rename', async (_, { oldPath, newPath }: { oldPath: string, newPath: string }) => {
    try {
      await fs.rename(oldPath, newPath)
      return { result: 'success' }
    } catch (error) {
      return { result: 'error', message: String(error) }
    }
  })

  ipcMain.handle('file-delete', async (_, filePath: string) => {
    try {
      await fs.unlink(filePath)
      return { result: 'success' }
    } catch (error) {
      return { result: 'error', message: String(error) }
    }
  })

  ipcMain.handle('file-get-info', async (_, filePath: string) => {
    try {
      const stats = await fs.stat(filePath)
      return {
        result: 'success',
        size: stats.size,
        atime: stats.atime,
        mtime: stats.mtime,
        ctime: stats.ctime,
        birthtime: stats.birthtime,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile()
      }
    } catch (error) {
      return { result: 'error', message: String(error) }
    }
  })

  ipcMain.handle('file-list-dir', async (_, dirPath: string) => {
    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true })
      return {
        result: 'success',
        files: files.map(f => ({
          name: f.name,
          isDirectory: f.isDirectory(),
          isFile: f.isFile()
        }))
      }
    } catch (error) {
      return { result: 'error', message: String(error) }
    }
  })
})
