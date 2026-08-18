import { create } from 'zustand';
import { MechanicalPreset, DrawerTabType, PinItem, CommentData } from '../types';
import { MECHANICAL_PRESETS } from '../data/presets';

export interface UserProfile {
  id?: string;
  name: string;
  role: 'student' | 'teacher';
  team_name: string;
}

export interface SavedCardSummary {
  id: string;
  title: string;
  ai_summary?: string;
  created_at: string;
  thumb_url?: string;
  pins_count: number;
}

interface State {
  currentUser: UserProfile;
  activePreset: MechanicalPreset;
  activeTab: DrawerTabType;
  isSimulating: boolean;
  isXray: boolean;
  explodeValue: number;
  selectedPartId: string | null;
  pinMode: boolean;
  pins: PinItem[];
  savedCards: SavedCardSummary[];
  remixCount: number;
  isScanning: boolean;
  scanningThumb: string;
  isPresetModalOpen: boolean;
  isPortfolioModalOpen: boolean;
  isTeacherModalOpen: boolean;
  locale: 'ko' | 'en' | 'ja';

  setLocale: (lang: 'ko' | 'en' | 'ja') => void;
  setActivePreset: (presetId: string) => void;
  setCustomPreset: (preset: MechanicalPreset) => void;
  setActiveTab: (tab: DrawerTabType) => void;
  toggleSimulating: () => void;
  toggleXray: () => void;
  setExplodeValue: (val: number) => void;
  setSelectedPartId: (partId: string | null) => void;
  togglePinMode: () => void;
  addPin: (pin: PinItem) => void;
  setPins: (pins: PinItem[]) => void;
  incrementRemix: () => void;
  triggerScanAnimation: (thumbUrl?: string) => void;
  setPresetModalOpen: (open: boolean) => void;
  setPortfolioModalOpen: (open: boolean) => void;
  setTeacherModalOpen: (open: boolean) => void;
  addComment: (comment: CommentData) => void;

  // DB Persistence Actions
  fetchSavedCards: () => Promise<void>;
  saveCurrentCard: (customTitle?: string) => Promise<string | null>;
  loadSavedCard: (cardId: string) => Promise<boolean>;
}

export const useStore = create<State>((set, get) => ({
  currentUser: {
    name: '김민준',
    role: 'student',
    team_name: '1모둠 (알파팀)',
  },
  activePreset: MECHANICAL_PRESETS[0],
  activeTab: 'tab-inspect',
  isSimulating: false,
  isXray: false,
  explodeValue: 0,
  selectedPartId: null,
  pinMode: false,
  pins: [],
  savedCards: [],
  remixCount: 3,
  isScanning: false,
  scanningThumb: MECHANICAL_PRESETS[0].thumb,
  isPresetModalOpen: false,
  isPortfolioModalOpen: false,
  isTeacherModalOpen: false,
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
        pins: [],
      });
      get().triggerScanAnimation(found.thumb);
    }
  },

  setCustomPreset: (preset) => {
    set({
      activePreset: preset,
      selectedPartId: null,
      explodeValue: 0,
      isSimulating: false,
      scanningThumb: preset.thumb,
      pins: [],
    });
    get().triggerScanAnimation(preset.thumb);
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleSimulating: () => set((state) => ({ isSimulating: !state.isSimulating })),
  toggleXray: () => set((state) => ({ isXray: !state.isXray })),
  setExplodeValue: (val) => set({ explodeValue: val }),
  setSelectedPartId: (partId) => set({ selectedPartId: partId }),
  togglePinMode: () => set((state) => ({ pinMode: !state.pinMode })),
  addPin: (pin) => set((state) => ({ pins: [...state.pins, pin], pinMode: false })),
  setPins: (pins) => set({ pins }),
  incrementRemix: () => set((state) => ({ remixCount: state.remixCount + 1 })),
  triggerScanAnimation: (thumbUrl) => {
    set({ isScanning: true, scanningThumb: thumbUrl || get().activePreset.thumb });
    setTimeout(() => {
      set({ isScanning: false });
    }, 2000);
  },
  setPresetModalOpen: (open) => set({ isPresetModalOpen: open }),
  setPortfolioModalOpen: (open) => {
    set({ isPortfolioModalOpen: open });
    if (open) {
      get().fetchSavedCards();
    }
  },
  setTeacherModalOpen: (open) => set({ isTeacherModalOpen: open }),
  addComment: (comment) =>
    set((state) => ({
      activePreset: {
        ...state.activePreset,
        comments: [comment, ...state.activePreset.comments],
      },
    })),

  // DB Persistence Actions
  fetchSavedCards: async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/api/v1/portfolio/cards`);
      if (res.ok) {
        const cards = await res.json();
        const summaries: SavedCardSummary[] = cards.map((c: any) => ({
          id: c.id,
          title: c.title,
          ai_summary: c.ai_summary,
          created_at: c.created_at,
          thumb_url: c.thumb_url,
          pins_count: c.pins ? c.pins.length : 0,
        }));
        set({ savedCards: summaries });
      }
    } catch (e) {
      console.warn('Failed to fetch saved cards from DB:', e);
    }
  },

  saveCurrentCard: async (customTitle?: string) => {
    const { activePreset, pins, currentUser } = get();
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const payload = {
        id: activePreset.id.startsWith('card_') ? activePreset.id : undefined,
        title: customTitle || activePreset.title,
        category: 'K-12 STEM Mechanical',
        ai_summary: activePreset.aiSummary,
        spec_json: JSON.stringify(activePreset),
        thumb_url: activePreset.thumb,
        pins: pins.map((p) => ({
          id: p.id,
          part_id: p.partId,
          position: p.position,
          content: p.content,
          author_name: p.author || currentUser.name,
        })),
      };

      const res = await fetch(`${apiUrl}/api/v1/portfolio/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const saved = await res.json();
        await get().fetchSavedCards();
        return saved.id;
      }
    } catch (e) {
      console.warn('Failed to save exploration card to DB:', e);
    }
    return null;
  },

  loadSavedCard: async (cardId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/api/v1/portfolio/cards/${cardId}`);
      if (res.ok) {
        const card = await res.json();
        if (card.spec_json) {
          const parsedPreset: MechanicalPreset = JSON.parse(card.spec_json);
          const restoredPins: PinItem[] = (card.pins || []).map((p: any) => ({
            id: p.id,
            partId: p.part_id,
            position: p.position,
            content: p.content,
            author: p.author_name,
            createdAt: p.created_at,
          }));

          set({
            activePreset: parsedPreset,
            pins: restoredPins,
            selectedPartId: null,
            explodeValue: 0,
            isPortfolioModalOpen: false,
          });
          get().triggerScanAnimation(parsedPreset.thumb);
          return true;
        }
      }
    } catch (e) {
      console.warn('Failed to load card from DB:', e);
    }
    return false;
  },
}));
