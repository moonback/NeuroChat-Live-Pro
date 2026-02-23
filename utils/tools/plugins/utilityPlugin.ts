import { ToolPlugin } from '../ToolRegistry';

/**
 * Plugin utilitaire pour les tâches courantes (Heure, Calculs, Aléatoire).
 */
export const timePlugin: ToolPlugin = {
    name: 'get_current_time',
    declaration: {
        name: 'get_current_time',
        description: "Récupère l'heure actuelle et la date complète.",
        parameters: {
            type: 'object',
            properties: {},
        }
    },
    execute: async () => {
        const now = new Date();
        return {
            result: 'success',
            time: now.toLocaleTimeString('fr-FR'),
            date: now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            iso: now.toISOString()
        };
    }
};

export const calculationPlugin: ToolPlugin = {
    name: 'calculate',
    declaration: {
        name: 'calculate',
        description: "Effectue un calcul mathématique.",
        parameters: {
            type: 'object',
            properties: {
                expression: { type: 'string', description: "L'expression à calculer (ex: '2 + 2', 'sqrt(16)')" }
            },
            required: ['expression']
        }
    },
    execute: async (args: { expression: string }) => {
        try {
            // Utilisation d'une méthode sécurisée simple ou eval précautionneux pour la démo
            // Dans une vraie app, utiliser une lib comme mathjs
            // eslint-disable-next-line no-eval
            const result = eval(args.expression.replace(/[^-()\d/*+.]/g, ''));
            return { result: 'success', expression: args.expression, value: result };
        } catch (e) {
            return { result: 'error', message: "Calcul impossible" };
        }
    }
};

export const randomPlugin: ToolPlugin = {
    name: 'generate_random_number',
    declaration: {
        name: 'generate_random_number',
        description: "Génère un nombre aléatoire entre deux bornes.",
        parameters: {
            type: 'object',
            properties: {
                min: { type: 'number' },
                max: { type: 'number' }
            },
            required: ['min', 'max']
        }
    },
    execute: async (args: { min: number, max: number }) => {
        const val = Math.floor(Math.random() * (args.max - args.min + 1)) + args.min;
        return { result: 'success', value: val };
    }
};

export const utilityPlugins = [
    timePlugin,
    calculationPlugin,
    randomPlugin
];
