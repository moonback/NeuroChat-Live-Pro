import { ToolPlugin } from '../ToolRegistry';

export const manageWindowPlugin: ToolPlugin = {
    name: 'manage_window',
    declaration: {
        name: 'manage_window',
        description: 'Contrôle les fenêtres nativement (minimiser, etc.).',
        parameters: {
            type: 'object',
            properties: {
                action: { type: 'string', enum: ['minimize', 'maximize', 'unmaximize', 'close', 'show', 'hide', 'center', 'focus'] },
                alwaysOnTop: { type: 'boolean' },
                getState: { type: 'boolean' }
            },
            required: []
        }
    },
    execute: async (args: { action?: string, alwaysOnTop?: boolean, getState?: boolean }) => {
        const { action, alwaysOnTop, getState } = args || {};

        try {
            if (getState) {
                return await window.ipcRenderer?.invoke('window-get-state');
            }

            if (alwaysOnTop !== undefined) {
                return await window.ipcRenderer?.invoke('window-set-always-on-top', alwaysOnTop);
            }

            if (action) {
                return await window.ipcRenderer?.invoke('window-control', action);
            }

            return { result: 'error', message: 'Aucune action spécifiée pour manage_window' };
        } catch (error) {
            return { result: 'error', message: String(error) };
        }
    }
};
