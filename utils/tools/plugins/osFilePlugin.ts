import { ToolPlugin } from '../ToolRegistry';

export const osFilePlugin: ToolPlugin = {
    name: 'os_file_operation',
    declaration: {
        name: 'os_file_operation',
        description: 'Opérations natives sur les fichiers (lire, écrire, etc.).',
        parameters: {
            type: 'object',
            properties: {
                operation: { type: 'string', enum: ['read', 'write', 'delete', 'rename', 'list_dir', 'get_info', 'open_dialog', 'save_dialog'] },
                path: { type: 'string' },
                content: { type: 'string' },
                newPath: { type: 'string' },
                dialogOptions: { type: 'object' }
            },
            required: ['operation']
        }
    },
    execute: async (args: { operation: string, path?: string, content?: string, newPath?: string, dialogOptions?: any }) => {
        const { operation, path: filePath, content, newPath, dialogOptions } = args || {};

        try {
            switch (operation) {
                case 'read':
                    return await window.ipcRenderer?.invoke('read-file', filePath);
                case 'write':
                    return await window.ipcRenderer?.invoke('write-file', { path: filePath, content });
                case 'delete':
                    return await window.ipcRenderer?.invoke('file-delete', filePath);
                case 'rename':
                    return await window.ipcRenderer?.invoke('file-rename', { oldPath: filePath, newPath });
                case 'list_dir':
                    return await window.ipcRenderer?.invoke('file-list-dir', filePath);
                case 'get_info':
                    return await window.ipcRenderer?.invoke('file-get-info', filePath);
                case 'open_dialog':
                    return await window.ipcRenderer?.invoke('file-dialog-open', dialogOptions);
                case 'save_dialog':
                    return await window.ipcRenderer?.invoke('file-dialog-save', dialogOptions);
                default:
                    return { result: 'error', message: `Opération inconnue: ${operation}` };
            }
        } catch (error) {
            return { result: 'error', message: String(error) };
        }
    }
};
