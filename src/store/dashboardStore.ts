import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WidgetId =
  | 'hero'
  | 'amendment'
  | 'portfolio'
  | 'milestones'
  | 'whale'
  | 'events'
  | 'strategies'
  | 'ledger';

export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

interface DashboardState {
  /** When true, full HUD: neon glows, enlarged profile, quests, gamified styling */
  gamerMode: boolean;
  /** Sidebar collapsed (icon-only) */
  sidebarCollapsed: boolean;
  /** Which widgets are visible (all shown by default). Stored as array for persist. */
  visibleWidgets: WidgetId[];
  /** react-grid-layout layout array; keyed by breakpoint */
  layouts: { lg: LayoutItem[]; md: LayoutItem[]; sm: LayoutItem[] };
  /** Last selected nav section for scroll/highlight */
  activeSection: string;

  setGamerMode: (on: boolean) => void;
  toggleGamerMode: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setWidgetVisible: (id: WidgetId, visible: boolean) => void;
  setLayouts: (layouts: DashboardState['layouts']) => void;
  setActiveSection: (section: string) => void;
  resetLayout: () => void;
}

const DEFAULT_LAYOUT_LG: LayoutItem[] = [
  { i: 'hero', x: 0, y: 0, w: 12, h: 2, minW: 6, minH: 1 },
  { i: 'amendment', x: 0, y: 2, w: 6, h: 4, minW: 4, minH: 3 },
  { i: 'portfolio', x: 6, y: 2, w: 6, h: 4, minW: 4, minH: 3 },
  { i: 'milestones', x: 0, y: 6, w: 4, h: 3, minW: 3, minH: 2 },
  { i: 'whale', x: 4, y: 6, w: 4, h: 3, minW: 3, minH: 2 },
  { i: 'events', x: 8, y: 6, w: 4, h: 3, minW: 3, minH: 2 },
  { i: 'strategies', x: 0, y: 9, w: 6, h: 3, minW: 4, minH: 2 },
  { i: 'ledger', x: 6, y: 9, w: 6, h: 3, minW: 4, minH: 2 },
];

const DEFAULT_LAYOUT_MD: LayoutItem[] = [
  { i: 'hero', x: 0, y: 0, w: 8, h: 2 },
  { i: 'amendment', x: 0, y: 2, w: 8, h: 4 },
  { i: 'portfolio', x: 0, y: 6, w: 8, h: 4 },
  { i: 'milestones', x: 0, y: 10, w: 4, h: 3 },
  { i: 'whale', x: 4, y: 10, w: 4, h: 3 },
  { i: 'events', x: 0, y: 13, w: 8, h: 3 },
  { i: 'strategies', x: 0, y: 16, w: 8, h: 3 },
  { i: 'ledger', x: 0, y: 19, w: 8, h: 3 },
];

const DEFAULT_LAYOUT_SM: LayoutItem[] = [
  { i: 'hero', x: 0, y: 0, w: 6, h: 2 },
  { i: 'amendment', x: 0, y: 2, w: 6, h: 4 },
  { i: 'portfolio', x: 0, y: 6, w: 6, h: 4 },
  { i: 'milestones', x: 0, y: 10, w: 6, h: 2 },
  { i: 'whale', x: 0, y: 12, w: 6, h: 3 },
  { i: 'events', x: 0, y: 15, w: 6, h: 3 },
  { i: 'strategies', x: 0, y: 18, w: 6, h: 2 },
  { i: 'ledger', x: 0, y: 20, w: 6, h: 3 },
];

const ALL_WIDGET_IDS: WidgetId[] = [
  'hero',
  'amendment',
  'portfolio',
  'milestones',
  'whale',
  'events',
  'strategies',
  'ledger',
];

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      gamerMode: false,
      sidebarCollapsed: false,
      visibleWidgets: [...ALL_WIDGET_IDS],
      layouts: {
        lg: DEFAULT_LAYOUT_LG,
        md: DEFAULT_LAYOUT_MD,
        sm: DEFAULT_LAYOUT_SM,
      },
      activeSection: 'overview',

      setGamerMode: (on) => set({ gamerMode: on }),
      toggleGamerMode: () => set((s) => ({ gamerMode: !s.gamerMode })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setWidgetVisible: (id, visible) =>
        set((s) => {
          const has = s.visibleWidgets.includes(id);
          if (visible && !has) return { visibleWidgets: [...s.visibleWidgets, id] };
          if (!visible && has) return { visibleWidgets: s.visibleWidgets.filter((w) => w !== id) };
          return {};
        }),
      setLayouts: (layouts) => set({ layouts }),
      setActiveSection: (section) => set({ activeSection: section }),
      resetLayout: () =>
        set({
          layouts: {
            lg: DEFAULT_LAYOUT_LG,
            md: DEFAULT_LAYOUT_MD,
            sm: DEFAULT_LAYOUT_SM,
          },
        }),
    }),
    {
      name: 'xrpl-dashboard-state',
      partialize: (s) => ({
        gamerMode: s.gamerMode,
        sidebarCollapsed: s.sidebarCollapsed,
        visibleWidgets: s.visibleWidgets,
        layouts: s.layouts,
        activeSection: s.activeSection,
      }),
    }
  )
);
