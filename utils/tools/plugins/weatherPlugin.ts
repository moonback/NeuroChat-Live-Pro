import { ToolPlugin } from '../ToolRegistry';

/**
 * Exemple de Plugin Hyper-Modulaire: Récupère la météo basique.
 */
export const weatherPlugin: ToolPlugin = {
    name: 'get_basic_weather',
    declaration: {
        name: 'get_basic_weather',
        description: "Récupère la météo et l'heure locale actuelle pour une ville donnée.",
        parameters: {
            type: 'object',
            properties: {
                city: { type: 'string', description: 'Le nom de la ville' }
            },
            required: ['city']
        }
    },
    execute: async (args: { city: string }) => {
        // Note: Dans une vraie application, on utiliserait une API externe (OpenWeatherMap, etc.)
        // ou une route IPC dynamique. Ceci est un "Stub" de démonstration pour le SDK.
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    result: 'success',
                    city: args.city,
                    scenario_mocked: true,
                    weather: "Ensoleillé",
                    temperature: "22°C",
                    localTime: new Date().toLocaleTimeString(),
                    message: `Météo simulée récupérée pour ${args.city}`
                });
            }, 500); // Simulation latence réseau
        });
    }
};
