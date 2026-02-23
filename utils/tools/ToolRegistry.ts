import { FunctionDeclaration, FunctionCall } from '../../types';

/**
 * Interface de base pour un plugin d'outil.
 * Chaque outil doit fournir sa déclaration (pour Gemini) et sa fonction d'exécution.
 */
export interface ToolPlugin {
    /**
     * Identifiant unique et nom de la fonction tel qu'utilisé par l'IA (ex: 'generate_conclusion_markdown', 'browser_search')
     */
    name: string;

    /**
     * Typage et description de l'outil qui sera envoyé à l'API Gemini Live.
     */
    declaration: FunctionDeclaration;

    /**
     * La logique de l'outil.
     * Doit retourner une Promise contenant un objet stringifiable ou un JSON en cas de succès ou d'erreur.
     */
    execute: (args: any, context?: any) => Promise<any>;
}

/**
 * Centre d'enregistrement pour les outils modulaires.
 */
class ToolRegistry {
    private tools: Map<string, ToolPlugin> = new Map();

    /**
     * Enregistre un nouveau plugin dans le registre.
     */
    register(plugin: ToolPlugin) {
        if (this.tools.has(plugin.name)) {
            console.warn(`[ToolRegistry] Le plugin '${plugin.name}' est déjà enregistré et a été écrasé.`);
        }
        this.tools.set(plugin.name, plugin);
    }

    /**
     * Récupère toutes les déclarations de fonctions à envoyer à Gemini.
     */
    getDeclarations(): Record<string, FunctionDeclaration> {
        const declarations: Record<string, FunctionDeclaration> = {};
        this.tools.forEach((plugin, name) => {
            declarations[name] = plugin.declaration;
        });
        return declarations;
    }

    /**
     * Exécute un outil spécifique par son nom.
     */
    async executeTool(name: string, args: any = {}, context?: any): Promise<any> {
        const tool = this.tools.get(name);
        if (!tool) {
            throw new Error(`ToolRegistry: Outil non trouvé - ${name}`);
        }
        return await tool.execute(args, context);
    }

    /**
     * Vérifie si un outil existe.
     */
    hasTool(name: string): boolean {
        return this.tools.has(name);
    }
}

// Instance globale du registre.
export const toolRegistry = new ToolRegistry();
