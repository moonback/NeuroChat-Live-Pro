import { create } from 'zustand';

interface UIState {

    isToolsListOpen: boolean;
    isMobileActionsDrawerOpen: boolean;
    isSystemStatusModalOpen: boolean;
    isConclusionsModalOpen: boolean;
    isHistoryModalOpen: boolean;


    // Actions

    setToolsListOpen: (open: boolean) => void;
    setMobileActionsDrawerOpen: (open: boolean) => void;
    setSystemStatusModalOpen: (open: boolean) => void;
    setConclusionsModalOpen: (open: boolean) => void;
    setHistoryModalOpen: (open: boolean) => void;


    // Convenience togglers

    toggleToolsList: () => void;
    toggleMobileActionsDrawer: () => void;
    toggleSystemStatusModal: () => void;
    toggleConclusionsModal: () => void;
    toggleHistoryModal: () => void;


    // Close all
    closeAllModals: () => void;
}

export const useUIStore = create<UIState>((set) => ({

    isToolsListOpen: false,
    isMobileActionsDrawerOpen: false,
    isSystemStatusModalOpen: false,
    isConclusionsModalOpen: false,
    isHistoryModalOpen: false,



    setToolsListOpen: (open) => set({ isToolsListOpen: open }),
    setMobileActionsDrawerOpen: (open) => set({ isMobileActionsDrawerOpen: open }),
    setSystemStatusModalOpen: (open) => set({ isSystemStatusModalOpen: open }),
    setConclusionsModalOpen: (open) => set({ isConclusionsModalOpen: open }),
    setHistoryModalOpen: (open) => set({ isHistoryModalOpen: open }),



    toggleToolsList: () => set((state) => ({ isToolsListOpen: !state.isToolsListOpen })),
    toggleMobileActionsDrawer: () => set((state) => ({ isMobileActionsDrawerOpen: !state.isMobileActionsDrawerOpen })),
    toggleSystemStatusModal: () => set((state) => ({ isSystemStatusModalOpen: !state.isSystemStatusModalOpen })),
    toggleConclusionsModal: () => set((state) => ({ isConclusionsModalOpen: !state.isConclusionsModalOpen })),
    toggleHistoryModal: () => set((state) => ({ isHistoryModalOpen: !state.isHistoryModalOpen })),


    closeAllModals: () => set({

        isToolsListOpen: false,
        isMobileActionsDrawerOpen: false,
        isSystemStatusModalOpen: false,
        isConclusionsModalOpen: false,
        isHistoryModalOpen: false,

    }),
}));
