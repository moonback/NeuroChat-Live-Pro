import { ToolPlugin } from '../ToolRegistry';
import { useAppStore } from '../../../stores/appStore';

export const whiteboardWritePlugin: ToolPlugin = {
    name: 'whiteboard_write',
    declaration: {
        name: 'whiteboard_write',
        description: 'Écrit du texte ou du contenu sur le tableau blanc partagé pour que l\'utilisateur puisse le voir.',
        parameters: {
            type: 'object',
            properties: {
                content: {
                    type: 'string',
                    description: 'Le texte ou contenu markdown à afficher sur le tableau blanc.'
                },
                mode: {
                    type: 'string',
                    enum: ['replace', 'append'],
                    description: 'Indique s\'il faut remplacer le contenu actuel ou l\'ajouter à la suite.'
                }
            },
            required: ['content']
        }
    },
    execute: async (args: any) => {
        const { content, mode = 'append' } = args;
        const store = useAppStore.getState();

        if (mode === 'replace') {
            store.setWhiteboardContent(content);
        } else {
            // S'il n'y a pas de contenu, on initialise, sinon on ajoute un saut de ligne
            if (store.whiteboardContent && !store.whiteboardContent.endsWith('\n')) {
                store.appendToWhiteboard('\n\n' + content);
            } else {
                store.appendToWhiteboard(content);
            }
        }

        // Ouvrir automatiquement le tableau blanc si l'assistant écrit dessus
        if (!store.isWhiteboardOpen) {
            store.setWhiteboardOpen(true);
        }

        return {
            result: 'success',
            message: 'Contenu mis à jour sur le tableau blanc.'
        };
    }
};

export const whiteboardClearPlugin: ToolPlugin = {
    name: 'whiteboard_clear',
    declaration: {
        name: 'whiteboard_clear',
        description: 'Efface tout le contenu du tableau blanc.',
        parameters: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    execute: async () => {
        useAppStore.getState().clearWhiteboard();
        return {
            result: 'success',
            message: 'Tableau blanc effacé.'
        };
    }
};
