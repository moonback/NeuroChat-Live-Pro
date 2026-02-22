import { toolRegistry } from './ToolRegistry';
import { weatherPlugin } from './plugins/weatherPlugin';
import { browserPlugins } from './plugins/browserPlugins';

// Liste de tous les plugins "Core" à injecter au démarrage de l'app.
// Si un développeur veut ajouter son outil, il n'a qu'à l'ajouter dans ce tableau.
const corePlugins = [
    weatherPlugin,
    ...browserPlugins,
];

/**
 * Fonction appelée au lancement de l'application (ou dans l'initialisation du store/GeminiSession).
 * Permet d'insérer à la volée tous les plugins activables dans le ToolRegistry.
 */
export function initializeCorePlugins() {
    console.log(`[PluginSystem] Initialisation de ${corePlugins.length} plugins...`);

    corePlugins.forEach(plugin => {
        toolRegistry.register(plugin);
        console.log(`[PluginSystem] Plugin monté : ${plugin.name}`);
    });
}
