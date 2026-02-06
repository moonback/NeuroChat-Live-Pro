import { useState, useEffect } from 'react';
import {
    loadPersonalityFiles,
    saveSoulFile,
    saveUserFile,
    saveMemoryFile,
    generateSystemContext,
    loadHistory as loadHistoryService,
    exportData as exportDataService,
    importData as importDataService,
    type PersonalityFiles,
    type SoulData,
    type UserData,
    type MemoryData,
    type HistoryEntry
} from '../utils/personalityFilesService';

/**
 * Hook personnalisé pour gérer les fichiers de personnalité
 */
export function usePersonalityFiles() {
    const [files, setFiles] = useState<PersonalityFiles | null>(null);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [systemContext, setSystemContext] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Charge les fichiers au montage
    useEffect(() => {
        refreshAll();
    }, []);

    // Met à jour le contexte système quand les fichiers changent
    useEffect(() => {
        if (files) {
            const context = generateSystemContext(files);
            setSystemContext(context);
        }
    }, [files]);

    /**
     * Recharge tout (fichiers + historique)
     */
    const refreshAll = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const [loadedFiles, loadedHistory] = await Promise.all([
                loadPersonalityFiles(),
                loadHistoryService()
            ]);
            setFiles(loadedFiles);
            setHistory(loadedHistory);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors du chargement des fichiers');
            console.error('Erreur lors du chargement des fichiers:', err);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Met à jour le fichier SOUL.md
     */
    const updateSoul = async (data: Partial<SoulData>) => {
        if (!files) return false;

        try {
            const updatedSoul = { ...files.soul, ...data };
            const success = await saveSoulFile(updatedSoul);
            if (success) await refreshAll(); // Rafraîchir pour avoir l'historique à jour
            return success;
        } catch (err) {
            console.error('Erreur lors de la mise à jour de SOUL.md:', err);
            return false;
        }
    };

    /**
     * Met à jour le fichier USER.md
     */
    const updateUser = async (data: Partial<UserData>) => {
        if (!files) return false;

        try {
            const updatedUser = {
                ...files.user,
                ...data,
                preferences: {
                    ...files.user.preferences,
                    ...(data.preferences || {})
                }
            };
            const success = await saveUserFile(updatedUser);
            if (success) await refreshAll();
            return success;
        } catch (err) {
            console.error('Erreur lors de la mise à jour de USER.md:', err);
            return false;
        }
    };

    /**
     * Met à jour le fichier MEMORY.md
     */
    const updateMemory = async (data: Partial<MemoryData>) => {
        if (!files) return false;

        try {
            const updatedMemory = { ...files.memory, ...data };
            const success = await saveMemoryFile(updatedMemory);
            if (success) await refreshAll();
            return success;
        } catch (err) {
            console.error('Erreur lors de la mise à jour de MEMORY.md:', err);
            return false;
        }
    };

    /**
     * Helpers pour la mémoire
     */
    const addUserInformation = async (info: string) => {
        if (!files) return false;
        return updateMemory({ userInformation: [...files.memory.userInformation, info] });
    };

    const addPreference = async (preference: string) => {
        if (!files) return false;
        return updateMemory({ preferences: [...files.memory.preferences, preference] });
    };

    const addImportantNote = async (note: string) => {
        if (!files) return false;
        return updateMemory({ importantNotes: [...files.memory.importantNotes, note] });
    };

    const removeUserInformation = async (index: number) => {
        if (!files) return false;
        return updateMemory({ userInformation: files.memory.userInformation.filter((_, i) => i !== index) });
    };

    const removePreference = async (index: number) => {
        if (!files) return false;
        return updateMemory({ preferences: files.memory.preferences.filter((_, i) => i !== index) });
    };

    const removeImportantNote = async (index: number) => {
        if (!files) return false;
        return updateMemory({ importantNotes: files.memory.importantNotes.filter((_, i) => i !== index) });
    };

    /**
     * Import / Export
     */
    const exportData = async () => {
        return exportDataService();
    };

    const importData = async (json: string) => {
        const success = await importDataService(json);
        if (success) await refreshAll();
        return success;
    };

    return {
        files,
        history,
        systemContext,
        isLoading,
        error,
        refreshAll,
        updateSoul,
        updateUser,
        updateMemory,
        addUserInformation,
        addPreference,
        addImportantNote,
        removeUserInformation,
        removePreference,
        removeImportantNote,
        exportData,
        importData
    };
}
