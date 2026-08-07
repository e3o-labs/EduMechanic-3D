import { create } from 'zustand';
import { MechanicalPreset, DrawerTabType, PinItem, CommentData } from '../types';
import { MECHANICAL_PRESETS } from '../data/presets';

interface State {
  activePreset: MechanicalPreset;
  activeTab: DrawerTabType;
  isSimulating: boolean;
  isXray: boolean;
  explodeValue: number;
  selectedPartId: string | null;
  pinMode: boolean;
  pins: PinItem[];
  remixCount: number;
  isScanning: boolean;
  scanningThumb: string;
  isPresetModalOpen: boolean;
  isPortfolioModalOpen: boolean;
  locale: 'ko' | 'en' | 'ja';

  setLocale: (lang: 'ko' | 'en' | 'ja') => void;
  setActivePreset: (presetId: string) => void;
  setActiveTab: (tab: DrawerTabType) => void;
  toggleSimulating: () => void;
  toggleXray: () => void;
  setExplodeValue: (val: number) => void;
  setSelectedPartId: (partId: string | null) => void;
  togglePinMode: () => void;
  addPin: (pin: PinItem) => void;
  incrementRemix: () => void;
  triggerScanAnimation: (thumbUrl?: string) => void;
  setPresetModalOpen: (open: boolean) => void;
  setPortfolioModalOpen: (open: boolean) => void;
  addComment: (comment: CommentData) => void;
}

export const useStore = create<State>((set, get) => ({
  activePreset: MECHANICAL_PRESETS[0],
  activeTab: 'tab-inspect',
  isSimulating: false,
  isXray: false,
  explodeValue: 0,
  selectedPartId: null,
  pinMode: false,
  pins: [],
  remixCount: 3,
  isScanning: false,
  scanningThumb: MECHANICAL_PRESETS[0].thumb,
  isPresetModalOpen: false,
  isPortfolioModalOpen: false,
  locale: 'ko',

  setLocale: (lang) => set({ locale: lang }),

  setActivePreset: (presetId) => {
    const found = MECHANICAL_PRESETS.find((p) => p.id === presetId);
    if (found) {
      set({
        activePreset: found,
        selectedPartId: null,
        explodeValue: 0,
        isSimulating: false,
        scanningThumb: found.thumb,
      });
      get().triggerScanAnimation(found.thumb);
    }
  },
  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleSimulating: () => set((state) => ({ isSimulating: !state.isSimulating })),
  toggleXray: () => set((state) => ({ isXray: !state.isXray })),
  setExplodeValue: (val) => set({ explodeValue: val }),
  setSelectedPartId: (partId) => set({ selectedPartId: partId }),
  togglePinMode: () => set((state) => ({ pinMode: !state.pinMode })),
  addPin: (pin) => set((state) => ({ pins: [...state.pins, pin], pinMode: false })),
  incrementRemix: () => set((state) => ({ remixCount: state.remixCount + 1 })),
  triggerScanAnimation: (thumbUrl) => {
    set({ isScanning: true, scanningThumb: thumbUrl || get().activePreset.thumb });
    setTimeout(() => {
      set({ isScanning: false });
    }, 2000);
  },
  setPresetModalOpen: (open) => set({ isPresetModalOpen: open }),
  setPortfolioModalOpen: (open) => set({ isPortfolioModalOpen: open }),
  addComment: (comment) =>
    set((state) => ({
      activePreset: {
        ...state.activePreset,
        comments: [comment, ...state.activePreset.comments],
      },
    })),
}));
