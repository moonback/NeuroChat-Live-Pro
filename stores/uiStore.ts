import { create } from 'zustand';
import { SavedConclusion } from '../utils/tools';

interface UIState {
    isToolsListOpen: boolean;
    isMobileActionsDrawerOpen: boolean;
    isSystemStatusModalOpen: boolean;
    isConclusionsModalOpen: boolean;
    isHistoryModalOpen: boolean;
    isCommandPaletteOpen: boolean;
    activeDocument: SavedConclusion | null;

    // Actions
    setToolsListOpen: (open: boolean) => void;
    setMobileActionsDrawerOpen: (open: boolean) => void;
    setSystemStatusModalOpen: (open: boolean) => void;
    setConclusionsModalOpen: (open: boolean) => void;
    setHistoryModalOpen: (open: boolean) => void;
    setCommandPaletteOpen: (open: boolean) => void;
    setActiveDocument: (doc: SavedConclusion | null) => void;

    // Convenience togglers
    toggleToolsList: () => void;
    toggleMobileActionsDrawer: () => void;
    toggleSystemStatusModal: () => void;
    toggleConclusionsModal: () => void;
    toggleHistoryModal: () => void;
    toggleCommandPalette: () => void;

    // Close all
    closeAllModals: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    isToolsListOpen: false,
    isMobileActionsDrawerOpen: false,
    isSystemStatusModalOpen: false,
    isConclusionsModalOpen: false,
    isHistoryModalOpen: false,
    isCommandPaletteOpen: false,
    activeDocument: null,

    setToolsListOpen: (open) => set({ isToolsListOpen: open }),
    setMobileActionsDrawerOpen: (open) => set({ isMobileActionsDrawerOpen: open }),
    setSystemStatusModalOpen: (open) => set({ isSystemStatusModalOpen: open }),
    setConclusionsModalOpen: (open) => set({ isConclusionsModalOpen: open }),
    setHistoryModalOpen: (open) => set({ isHistoryModalOpen: open }),
    setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
    setActiveDocument: (doc) => set({ activeDocument: doc, isConclusionsModalOpen: doc !== null }),

    toggleToolsList: () => set((state) => ({ isToolsListOpen: !state.isToolsListOpen })),
    toggleMobileActionsDrawer: () => set((state) => ({ isMobileActionsDrawerOpen: !state.isMobileActionsDrawerOpen })),
    toggleSystemStatusModal: () => set((state) => ({ isSystemStatusModalOpen: !state.isSystemStatusModalOpen })),
    toggleConclusionsModal: () => set((state) => ({ isConclusionsModalOpen: !state.isConclusionsModalOpen })),
    toggleHistoryModal: () => set((state) => ({ isHistoryModalOpen: !state.isHistoryModalOpen })),
    toggleCommandPalette: () => set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),

    closeAllModals: () => set({
        isToolsListOpen: false,
        isMobileActionsDrawerOpen: false,
        isSystemStatusModalOpen: false,
        isConclusionsModalOpen: false,
        isHistoryModalOpen: false,
        isCommandPaletteOpen: false,
        activeDocument: null,
    }),
}));
