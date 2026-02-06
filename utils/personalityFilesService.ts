/**
 * Service pour gérer les fichiers de personnalité de l'assistant
 * - SOUL.md : Personnalité et valeurs de l'assistant
 * - USER.md : Informations sur l'utilisateur
 * - MEMORY.md : Mémoire à long terme
 */

export interface SoulData {
    name: string;
    personality: string[];
    values: string[];
    rawContent: string;
}

export interface UserData {
    preferences: {
        communicationStyle?: string;
        timezone?: string;
        language?: string;
    };
    rawContent: string;
}

export interface MemoryData {
    userInformation: string[];
    preferences: string[];
    importantNotes: string[];
    rawContent: string;
}

export interface PersonalityFiles {
    soul: SoulData;
    user: UserData;
    memory: MemoryData;
}

export interface HistoryEntry {
    id: string;
    timestamp: string;
    file: 'soul' | 'user' | 'memory';
    action: string; // 'update', 'add', 'remove'
    details: string;
}

/**
 * Lit le contenu d'un fichier (via Electron ou fetch/localStorage)
 */
async function readContent(filePath: string): Promise<string | null> {
    // 1. Essayer via Electron IPC
    if (window.ipcRenderer) {
        try {
            return await window.ipcRenderer.invoke('read-file', filePath);
        } catch (error) {
            console.error(`Erreur Electron read-file (${filePath}):`, error);
        }
    }

    // 2. Fallback pour le Web (fetch pour public, localStorage pour autres)
    try {
        if (filePath.endsWith('.md')) { // Contenu statique initial
            // Vérifier si une version modifiée existe dans localStorage
            const storageKey = filePath.replace(/\//g, '_').replace('.', '_');
            const stored = localStorage.getItem(storageKey);
            if (stored) return stored;

            const response = await fetch(filePath);
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            return await response.text();
        } else {
            // Fichiers dynamiques hors public (ex: history.json)
            const storageKey = filePath.replace(/\//g, '_').replace('.', '_');
            return localStorage.getItem(storageKey);
        }
    } catch (error) {
        console.warn(`Lecture web échouée pour ${filePath}:`, error);
        return null;
    }
}

/**
 * Écrit le contenu d'un fichier (via Electron ou localStorage)
 */
async function writeContent(filePath: string, content: string): Promise<boolean> {
    // 1. Essayer via Electron IPC
    if (window.ipcRenderer) {
        try {
            const success = await window.ipcRenderer.invoke('write-file', { path: filePath, content });
            if (success) return true;
        } catch (error) {
            console.error(`Erreur Electron write-file (${filePath}):`, error);
        }
    }

    // 2. Fallback localStorage
    try {
        const storageKey = filePath.replace(/\//g, '_').replace('.', '_');
        localStorage.setItem(storageKey, content);
        return true;
    } catch (error) {
        console.error(`Erreur localStorage write (${filePath}):`, error);
        return false;
    }
}

// --- Historique ---

export async function loadHistory(): Promise<HistoryEntry[]> {
    const content = await readContent('history.json');
    if (!content) return [];
    try {
        return JSON.parse(content);
    } catch {
        return [];
    }
}

async function addToHistory(file: 'soul' | 'user' | 'memory', action: string, details: string) {
    const history = await loadHistory();
    const newEntry: HistoryEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        file,
        action,
        details
    };

    // Garder les 100 dernières entrées
    const updatedHistory = [newEntry, ...history].slice(0, 100);
    await writeContent('history.json', JSON.stringify(updatedHistory, null, 2));
}

// --- Fonctions de chargement ---

export async function loadSoulFile(): Promise<SoulData> {
    // Essayer de charger '/SOUL.md' (chemin relatif root public pour fetch/electron)
    const content = await readContent('/SOUL.md') || '';

    if (!content) {
        return {
            name: 'nanobot',
            personality: ['Helpful'],
            values: ['Accuracy'],
            rawContent: ''
        };
    }

    // Parse
    const lines = content.split('\n');
    const personality: string[] = [];
    const values: string[] = [];
    let name = 'nanobot';
    let currentSection = '';

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('I am ')) {
            name = trimmed.replace('I am ', '').replace(',', '').trim();
        } else if (trimmed === '## Personality') {
            currentSection = 'personality';
        } else if (trimmed === '## Values') {
            currentSection = 'values';
        } else if (trimmed.startsWith('- ') && currentSection === 'personality') {
            personality.push(trimmed.substring(2));
        } else if (trimmed.startsWith('- ') && currentSection === 'values') {
            values.push(trimmed.substring(2));
        }
    }

    return { name, personality, values, rawContent: content };
}

export async function loadUserFile(): Promise<UserData> {
    const content = await readContent('/USER.md') || '';

    // Parse
    const lines = content.split('\n');
    const preferences: UserData['preferences'] = {};

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.includes('Communication style:')) {
            const val = trimmed.split(':')[1]?.trim().replace(/\(|\)/g, '');
            if (val && val !== 'casual/formal') preferences.communicationStyle = val;
        } else if (trimmed.includes('Timezone:')) {
            const val = trimmed.split(':')[1]?.trim().replace(/\(|\)/g, '');
            if (val && val !== 'your timezone') preferences.timezone = val;
        } else if (trimmed.includes('Language:')) {
            const val = trimmed.split(':')[1]?.trim().replace(/\(|\)/g, '');
            if (val && val !== 'your preferred language') preferences.language = val;
        }
    }

    return { preferences, rawContent: content };
}

export async function loadMemoryFile(): Promise<MemoryData> {
    const content = await readContent('/memory/MEMORY.md') || '';

    // Parse
    const lines = content.split('\n');
    const userInformation: string[] = [];
    const preferences: string[] = [];
    const importantNotes: string[] = [];
    let currentSection = '';

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === '## User Information') {
            currentSection = 'userInfo';
        } else if (trimmed === '## Preferences') {
            currentSection = 'preferences';
        } else if (trimmed === '## Important Notes') {
            currentSection = 'notes';
        } else if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('(')) {
            if (currentSection === 'userInfo') userInformation.push(trimmed);
            else if (currentSection === 'preferences') preferences.push(trimmed);
            else if (currentSection === 'notes') importantNotes.push(trimmed);
        }
    }

    return { userInformation, preferences, importantNotes, rawContent: content };
}

export async function loadPersonalityFiles(): Promise<PersonalityFiles> {
    const [soul, user, memory] = await Promise.all([
        loadSoulFile(),
        loadUserFile(),
        loadMemoryFile()
    ]);
    return { soul, user, memory };
}

// --- Fonctions de sauvegarde ---

export async function saveSoulFile(data: SoulData): Promise<boolean> {
    let content = '# Soul\n\n';
    content += `I am ${data.name}, an AI assistant.\n\n`; // Simplifié pour l'exemple, mais pourrait être plus riche
    content += '## Personality\n\n';
    data.personality.forEach(t => content += `- ${t}\n`);
    content += '\n## Values\n\n';
    data.values.forEach(v => content += `- ${v}\n`);

    const success = await writeContent('/SOUL.md', content);
    if (success) await addToHistory('soul', 'update', 'Updated personality/values');
    return success;
}

export async function saveUserFile(data: UserData): Promise<boolean> {
    let content = '# User\n\nInformation about the user goes here.\n\n## Preferences\n\n';
    content += `- Communication style: ${data.preferences.communicationStyle || '(casual/formal)'}\n`;
    content += `- Timezone: ${data.preferences.timezone || '(your timezone)'}\n`;
    content += `- Language: ${data.preferences.language || '(your preferred language)'}\n`;

    const success = await writeContent('/USER.md', content);
    if (success) await addToHistory('user', 'update', 'Updated user preferences');
    return success;
}

export async function saveMemoryFile(data: MemoryData): Promise<boolean> {
    let content = '# Long-term Memory\n\nThis file stores important information that should persist across sessions.\n\n';

    content += '## User Information\n\n';
    if (data.userInformation.length > 0) data.userInformation.forEach(i => content += `${i}\n`);
    else content += '(Important facts about the user)\n';

    content += '\n## Preferences\n\n';
    if (data.preferences.length > 0) data.preferences.forEach(p => content += `${p}\n`);
    else content += '(User preferences learned over time)\n';

    content += '\n## Important Notes\n\n';
    if (data.importantNotes.length > 0) data.importantNotes.forEach(n => content += `${n}\n`);
    else content += '(Things to remember)\n';

    const success = await writeContent('/memory/MEMORY.md', content);
    if (success) await addToHistory('memory', 'update', 'Updated memory items');
    return success;
}

// --- Import / Export ---

export async function exportData(): Promise<string> {
    const files = await loadPersonalityFiles();
    const history = await loadHistory();
    return JSON.stringify({ files, history }, null, 2);
}

export async function importData(jsonData: string): Promise<boolean> {
    try {
        const data = JSON.parse(jsonData);
        if (!data.files) throw new Error('Invalid format');

        const { soul, user, memory } = data.files;

        await saveSoulFile(soul);
        await saveUserFile(user);
        await saveMemoryFile(memory);

        if (data.history && Array.isArray(data.history)) {
            await writeContent('history.json', JSON.stringify(data.history, null, 2));
        }

        return true;
    } catch (e) {
        console.error('Import failed:', e);
        return false;
    }
}

// --- Génération de contexte ---

export function generateSystemContext(files: PersonalityFiles): string {
    let context = '';
    // SOUL
    context += `Tu es ${files.soul.name}.\n\nTa personnalité:\n`;
    files.soul.personality.forEach(t => context += `- ${t}\n`);
    context += '\nTes valeurs:\n';
    files.soul.values.forEach(v => context += `- ${v}\n`);

    // USER
    if (Object.keys(files.user.preferences).length > 0) {
        context += '\n\nPréférences utilisateur:\n';
        if (files.user.preferences.communicationStyle) context += `- Style: ${files.user.preferences.communicationStyle}\n`;
        if (files.user.preferences.timezone) context += `- Timezone: ${files.user.preferences.timezone}\n`;
        if (files.user.preferences.language) context += `- Langue: ${files.user.preferences.language}\n`;
    }

    // MEMORY
    const { userInformation, preferences, importantNotes } = files.memory;
    if (userInformation.length + preferences.length + importantNotes.length > 0) {
        context += '\n\nMémoire à long terme:\n';
        if (userInformation.length) {
            context += '\nInfos utilisateur:\n';
            userInformation.forEach(i => context += `- ${i}\n`);
        }
        if (preferences.length) {
            context += '\nPréférences apprises:\n';
            preferences.forEach(p => context += `- ${p}\n`);
        }
        if (importantNotes.length) {
            context += '\nNotes importantes:\n';
            importantNotes.forEach(n => context += `- ${n}\n`);
        }
    }

    return context;
}
