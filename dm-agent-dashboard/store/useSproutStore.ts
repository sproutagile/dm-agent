import { create } from 'zustand';
import { Widget, ChatMessage, KPIData } from '@/types/sprout';

interface SproutStoreState {
    // Widgets state
    widgets: Widget[];
    addWidget: (widget: Widget) => void;
    updateWidget: (id: string, updates: Partial<Widget>) => void;
    removeWidget: (id: string) => void;
    clearWidgets: () => void;

    // Chat messages state
    chatMessages: ChatMessage[];
    addMessage: (message: ChatMessage) => void;
    clearMessages: () => void;

    // KPI data state
    kpiData: KPIData;
    updateKPIs: (data: Partial<KPIData>) => void;

    // Loading state
    isLoading: boolean;
    setLoading: (loading: boolean) => void;
}

export const useSproutStore = create<SproutStoreState>((set) => ({
    // Widgets
    widgets: [],
    addWidget: (widget) =>
        set((state) => ({ widgets: [...state.widgets, widget] })),
    updateWidget: (id, updates) =>
        set((state) => ({
            widgets: state.widgets.map((w) => (w.id === id ? { ...w, ...updates } : w)),
        })),
    removeWidget: (id) =>
        set((state) => ({ widgets: state.widgets.filter((w) => w.id !== id) })),
    clearWidgets: () => set({ widgets: [] }),

    // Chat messages
    chatMessages: [],
    addMessage: (message) =>
        set((state) => ({ chatMessages: [...state.chatMessages, message] })),
    clearMessages: () => set({ chatMessages: [] }),

    // KPI data with initial values
    kpiData: {
        activeTasks: 24,
        throughput: 87,
        blockers: 3,
    },
    updateKPIs: (data) =>
        set((state) => ({ kpiData: { ...state.kpiData, ...data } })),

    // Loading state
    isLoading: false,
    setLoading: (loading) => set({ isLoading: loading }),
}));
