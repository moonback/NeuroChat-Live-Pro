import { create } from 'zustand';

interface UIState {
    isPersonalityEditorOpen: boolean;
    isToolsListOpen: boolean;
    isMobileActionsDrawerOpen: boolean;
    isSystemStatusModalOpen: boolean;
    isConclusionsModalOpen: boolean;
    isHistoryModalOpen: boolean;
    isPersonalityFilesEditorOpen: boolean;

    // Actions
    setPersonalityEditorOpen: (open: boolean) => void;
    setToolsListOpen: (open: boolean) => void;
    setMobileActionsDrawerOpen: (open: boolean) => void;
    setSystemStatusModalOpen: (open: boolean) => void;
    setConclusionsModalOpen: (open: boolean) => void;
    setHistoryModalOpen: (open: boolean) => void;
    setPersonalityFilesEditorOpen: (open: boolean) => void;

    // Convenience togglers
    togglePersonalityEditor: () => void;
    toggleToolsList: () => void;
    toggleMobileActionsDrawer: () => void;
    toggleSystemStatusModal: () => void;
    toggleConclusionsModal: () => void;
    toggleHistoryModal: () => void;
    togglePersonalityFilesEditor: () => void;

    // Close all
    closeAllModals: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    isPersonalityEditorOpen: false,
    isToolsListOpen: false,
    isMobileActionsDrawerOpen: false,
    isSystemStatusModalOpen: false,
    isConclusionsModalOpen: false,
    isHistoryModalOpen: false,
    isPersonalityFilesEditorOpen: false,

    setPersonalityEditorOpen: (open) => set({ isPersonalityEditorOpen: open }),
    setToolsListOpen: (open) => set({ isToolsListOpen: open }),
    setMobileActionsDrawerOpen: (open) => set({ isMobileActionsDrawerOpen: open }),
    setSystemStatusModalOpen: (open) => set({ isSystemStatusModalOpen: open }),
    setConclusionsModalOpen: (open) => set({ isConclusionsModalOpen: open }),
    setHistoryModalOpen: (open) => set({ isHistoryModalOpen: open }),
    setPersonalityFilesEditorOpen: (open) => set({ isPersonalityFilesEditorOpen: open }),

    togglePersonalityEditor: () => set((state) => ({ isPersonalityEditorOpen: !state.isPersonalityEditorOpen })),
    toggleToolsList: () => set((state) => ({ isToolsListOpen: !state.isToolsListOpen })),
    toggleMobileActionsDrawer: () => set((state) => ({ isMobileActionsDrawerOpen: !state.isMobileActionsDrawerOpen })),
    toggleSystemStatusModal: () => set((state) => ({ isSystemStatusModalOpen: !state.isSystemStatusModalOpen })),
    toggleConclusionsModal: () => set((state) => ({ isConclusionsModalOpen: !state.isConclusionsModalOpen })),
    toggleHistoryModal: () => set((state) => ({ isHistoryModalOpen: !state.isHistoryModalOpen })),
    togglePersonalityFilesEditor: () => set((state) => ({ isPersonalityFilesEditorOpen: !state.isPersonalityFilesEditorOpen })),

    closeAllModals: () => set({
        isPersonalityEditorOpen: false,
        isToolsListOpen: false,
        isMobileActionsDrawerOpen: false,
        isSystemStatusModalOpen: false,
        isConclusionsModalOpen: false,
        isHistoryModalOpen: false,
        isPersonalityFilesEditorOpen: false,
    }),
}));
