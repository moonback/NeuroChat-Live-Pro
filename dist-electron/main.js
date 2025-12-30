"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const node_path_1 = __importDefault(require("node:path"));
// The built directory structure
//
// ├─┬ dist-electron
// │ └── main.js
// └─┬ dist
//   └── index.html
// process.env.DIST est défini par nous ou calculé
const DIST = node_path_1.default.join(__dirname, '../dist');
const VITE_PUBLIC = electron_1.app.isPackaged ? DIST : node_path_1.default.join(DIST, '../public');
process.env.DIST = DIST;
process.env.VITE_PUBLIC = VITE_PUBLIC;
let win;
let tray = null;
let isQuitting = false;
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
function createWindow() {
    win = new electron_1.BrowserWindow({
        icon: node_path_1.default.join(VITE_PUBLIC, 'logo.png'),
        webPreferences: {
            preload: node_path_1.default.join(__dirname, 'preload.js'),
        },
        // Le visualizer profite bien d'un fond sombre par défaut
        backgroundColor: '#000000',
    });
    // Gestion de la fermeture pour minimiser dans le tray au lieu de quitter
    win.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            win?.hide();
            return false;
        }
        return true;
    });
    // Test active push message to Console
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', (new Date).toLocaleString());
    });
    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL);
    }
    else {
        // win.loadFile('dist/index.html')
        win.loadFile(node_path_1.default.join(DIST, 'index.html'));
    }
}
function createTray() {
    const iconPath = node_path_1.default.join(VITE_PUBLIC, 'logo.png');
    // On s'assure que l'image est redimensionnée pour la barre des tâches
    const icon = electron_1.nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
    tray = new electron_1.Tray(icon);
    tray.setToolTip('NeuroChat Live Pro');
    const updateContextMenu = () => {
        const isAlwaysOnTop = win?.isAlwaysOnTop() || false;
        const isVisible = win?.isVisible() || false;
        const contextMenu = electron_1.Menu.buildFromTemplate([
            {
                label: isVisible ? 'Masquer NeuroChat' : 'Afficher NeuroChat',
                click: () => {
                    if (isVisible) {
                        win?.hide();
                    }
                    else {
                        win?.show();
                    }
                    updateContextMenu();
                }
            },
            { type: 'separator' },
            {
                label: 'Toujours au-dessus',
                type: 'checkbox',
                checked: isAlwaysOnTop,
                click: () => {
                    const newState = !isAlwaysOnTop;
                    win?.setAlwaysOnTop(newState);
                    updateContextMenu();
                }
            },
            { type: 'separator' },
            {
                label: 'Quitter',
                click: () => {
                    isQuitting = true;
                    electron_1.app.quit();
                }
            }
        ]);
        tray?.setContextMenu(contextMenu);
    };
    // Initial menu
    updateContextMenu();
    // Clic simple pour toggle la fenêtre
    tray.on('click', () => {
        if (win?.isVisible()) {
            win.hide();
        }
        else {
            win?.show();
            win?.focus();
        }
        updateContextMenu();
    });
}
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        // Avec le système de Tray, on ne veut PAS quitter l'app quand la fenêtre est fermée
        // On quitte seulement si isQuitting est true (géré par le menu Quitter)
        if (isQuitting) {
            electron_1.app.quit();
            win = null;
        }
    }
});
electron_1.app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
    else {
        win?.show();
    }
});
electron_1.app.whenReady().then(() => {
    createWindow();
    createTray();
});
//# sourceMappingURL=main.js.map