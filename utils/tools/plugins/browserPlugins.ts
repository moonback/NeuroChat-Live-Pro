import { ToolPlugin } from '../ToolRegistry';

export const browserNavigatePlugin: ToolPlugin = {
    name: 'browser_navigate',
    declaration: {
        name: 'browser_navigate',
        description: 'Navigue vers une URL spécifique.',
        parameters: {
            type: 'object',
            properties: {
                url: { type: 'string' },
                newTab: { type: 'boolean' }
            },
            required: ['url']
        }
    },
    execute: async (args: { url: string, newTab?: boolean }) => {
        if (!args.url) return { result: 'error', message: 'URL requise' };
        return await window.ipcRenderer?.invoke('browser-navigate', { url: args.url, newTab: args.newTab });
    }
};

export const browserSearchPlugin: ToolPlugin = {
    name: 'browser_search',
    declaration: {
        name: 'browser_search',
        description: 'Effectue une recherche Google.',
        parameters: {
            type: 'object',
            properties: {
                query: { type: 'string' }
            },
            required: ['query']
        }
    },
    execute: async (args: { query: string }) => {
        if (!args.query) return { result: 'error', message: 'Requête requise' };
        return await window.ipcRenderer?.invoke('browser-search', args.query);
    }
};

export const browserClickPlugin: ToolPlugin = {
    name: 'browser_click',
    declaration: {
        name: 'browser_click',
        description: 'Clique sur un élément CSS.',
        parameters: {
            type: 'object',
            properties: {
                selector: { type: 'string' }
            },
            required: ['selector']
        }
    },
    execute: async (args: { selector: string }) => {
        if (!args.selector) return { result: 'error', message: 'Sélecteur requis' };
        return await window.ipcRenderer?.invoke('browser-click', args.selector);
    }
};

export const browserScrollPlugin: ToolPlugin = {
    name: 'browser_scroll',
    declaration: {
        name: 'browser_scroll',
        description: 'Fait défiler la page.',
        parameters: {
            type: 'object',
            properties: {
                direction: { type: 'string', enum: ['up', 'down', 'top', 'bottom'] }
            },
            required: ['direction']
        }
    },
    execute: async (args: { direction: string }) => {
        if (!args.direction) return { result: 'error', message: 'Direction requise' };
        return await window.ipcRenderer?.invoke('browser-scroll', args.direction);
    }
};

export const browserBackPlugin: ToolPlugin = {
    name: 'browser_back',
    declaration: {
        name: 'browser_back',
        description: 'Page précédente.',
        parameters: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    execute: async () => {
        return await window.ipcRenderer?.invoke('browser-back');
    }
};

export const browserForwardPlugin: ToolPlugin = {
    name: 'browser_forward',
    declaration: {
        name: 'browser_forward',
        description: 'Page suivante.',
        parameters: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    execute: async () => {
        return await window.ipcRenderer?.invoke('browser-forward');
    }
};

export const browserTypePlugin: ToolPlugin = {
    name: 'browser_type',
    declaration: {
        name: 'browser_type',
        description: 'Saisit du texte.',
        parameters: {
            type: 'object',
            properties: {
                selector: { type: 'string' },
                text: { type: 'string' }
            },
            required: ['selector', 'text']
        }
    },
    execute: async (args: { selector: string, text: string }) => {
        if (!args.selector || args.text === undefined) return { result: 'error', message: 'Sélecteur et texte requis' };
        return await window.ipcRenderer?.invoke('browser-type', { selector: args.selector, text: args.text });
    }
};

export const browserPressPlugin: ToolPlugin = {
    name: 'browser_press',
    declaration: {
        name: 'browser_press',
        description: 'Appuie sur une touche.',
        parameters: {
            type: 'object',
            properties: {
                key: { type: 'string' }
            },
            required: ['key']
        }
    },
    execute: async (args: { key: string }) => {
        if (!args.key) return { result: 'error', message: 'Touche requise' };
        return await window.ipcRenderer?.invoke('browser-press', args.key);
    }
};

export const browserGetContentPlugin: ToolPlugin = {
    name: 'browser_get_content',
    declaration: {
        name: 'browser_get_content',
        description: 'Récupère le texte de la page.',
        parameters: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    execute: async () => {
        return await window.ipcRenderer?.invoke('browser-get-content');
    }
};

export const browserScreenshotPlugin: ToolPlugin = {
    name: 'browser_screenshot',
    declaration: {
        name: 'browser_screenshot',
        description: 'Prend une capture d\'écran.',
        parameters: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    execute: async () => {
        return await window.ipcRenderer?.invoke('browser-screenshot');
    }
};

export const browserExtractTextPlugin: ToolPlugin = {
    name: 'browser_extract_text',
    declaration: {
        name: 'browser_extract_text',
        description: 'Extrait le texte visible d\'une page web via OCR.',
        parameters: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    execute: async () => {
        try {
            // 1. Prendre une capture d'écran
            const screenshot = await window.ipcRenderer?.invoke('browser-screenshot');
            if (screenshot.result === 'error') return screenshot;

            // 2. Importer l'extracteur d'image (OCR)
            const { extractTextFromFile } = await import('../../documentProcessor');

            // 3. Convertir base64 en File/Blob pour l'OCR
            const base64Data = screenshot.data;
            const res = await fetch(`data:image/jpeg;base64,${base64Data}`);
            const blob = await res.blob();
            const file = new File([blob], 'screenshot.jpg', { type: 'image/jpeg' });

            // 4. Lancer l'OCR
            const text = await extractTextFromFile(file);

            return {
                result: 'success',
                text: text,
                message: 'Texte extrait avec succès via OCR'
            };
        } catch (error) {
            return { result: 'error', message: `Échec de l'OCR : ${error instanceof Error ? error.message : String(error)}` };
        }
    }
};

export const browserPlugins = [
    browserNavigatePlugin,
    browserSearchPlugin,
    browserClickPlugin,
    browserScrollPlugin,
    browserBackPlugin,
    browserForwardPlugin,
    browserTypePlugin,
    browserPressPlugin,
    browserGetContentPlugin,
    browserScreenshotPlugin,
    browserExtractTextPlugin
];
