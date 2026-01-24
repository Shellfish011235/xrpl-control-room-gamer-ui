import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  GlobeLens, 
  GlobeSelection, 
  GlobeState, 
  PinnedItemRef, 
  GuidedStepCompletion,
  LiveValidatorMarker,
  LiveNodeMarker,
  LiveNetworkStats
} from '../types/globe';

interface GlobeStore extends GlobeState {
  // Lens and selection
  setActiveLens: (lens: GlobeLens) => void;
  setSelection: (selection: GlobeSelection) => void;
  clearSelection: () => void;
  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
  
  // Pinned items
  pinnedItems: PinnedItemRef[];
  pinItem: (item: PinnedItemRef) => void;
  unpinItem: (id: string) => void;
  moveItemUp: (id: string) => void;
  moveItemDown: (id: string) => void;
  isPinned: (type: PinnedItemRef['type'], id: string) => boolean;
  
  // Guided steps completion
  stepCompletions: Record<string, GuidedStepCompletion>;
  toggleStepComplete: (stepId: string) => void;
  setTeachBackResponse: (stepId: string, response: string) => void;
  getStepCompletion: (stepId: string) => GuidedStepCompletion | undefined;
  getCompletedStepsCount: (lens: GlobeLens, stepIds: string[]) => number;
  
  // Live network data (from XRPScan)
  liveValidators: LiveValidatorMarker[];
  liveNodes: LiveNodeMarker[];
  liveNetworkStats: LiveNetworkStats | null;
  isLoadingLiveData: boolean;
  liveDataError: string | null;
  showLiveData: boolean;
  setLiveValidators: (validators: LiveValidatorMarker[]) => void;
  setLiveNodes: (nodes: LiveNodeMarker[]) => void;
  setLiveNetworkStats: (stats: LiveNetworkStats) => void;
  setIsLoadingLiveData: (loading: boolean) => void;
  setLiveDataError: (error: string | null) => void;
  toggleShowLiveData: () => void;
}

// Valid lens values (keep in sync with GlobeLens type)
const validLenses: GlobeLens[] = ['validators', 'ilp', 'corridors', 'community', 'regulation'];

const initialState: GlobeState = {
  activeLens: 'validators',
  selection: {
    type: 'none',
    id: null
  },
  sidebarExpanded: true
};

export const useGlobeStore = create<GlobeStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Lens and selection actions
      setActiveLens: (lens) => set({ 
        activeLens: lens,
        selection: { type: 'none', id: null }
      }),
      
      setSelection: (selection) => set({ selection }),
      
      clearSelection: () => set({ 
        selection: { type: 'none', id: null } 
      }),
      
      toggleSidebar: () => set((state) => ({ 
        sidebarExpanded: !state.sidebarExpanded 
      })),
      
      setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),
      
      // Live network data
      liveValidators: [],
      liveNodes: [],
      liveNetworkStats: null,
      isLoadingLiveData: false,
      liveDataError: null,
      showLiveData: true,
      
      setLiveValidators: (validators) => set({ liveValidators: validators }),
      setLiveNodes: (nodes) => set({ liveNodes: nodes }),
      setLiveNetworkStats: (stats) => set({ liveNetworkStats: stats }),
      setIsLoadingLiveData: (loading) => set({ isLoadingLiveData: loading }),
      setLiveDataError: (error) => set({ liveDataError: error }),
      toggleShowLiveData: () => set((state) => ({ showLiveData: !state.showLiveData })),
      
      // Pinned items
      pinnedItems: [],
      
      pinItem: (item) => set((state) => {
        if (state.pinnedItems.some(p => p.type === item.type && p.id === item.id)) {
          return state;
        }
        return {
          pinnedItems: [...state.pinnedItems, { ...item, pinnedAt: new Date().toISOString() }]
        };
      }),
      
      unpinItem: (id) => set((state) => ({
        pinnedItems: state.pinnedItems.filter(p => p.id !== id)
      })),
      
      moveItemUp: (id) => set((state) => {
        const index = state.pinnedItems.findIndex(p => p.id === id);
        if (index <= 0) return state;
        
        const newItems = [...state.pinnedItems];
        [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
        return { pinnedItems: newItems };
      }),
      
      moveItemDown: (id) => set((state) => {
        const index = state.pinnedItems.findIndex(p => p.id === id);
        if (index < 0 || index >= state.pinnedItems.length - 1) return state;
        
        const newItems = [...state.pinnedItems];
        [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
        return { pinnedItems: newItems };
      }),
      
      isPinned: (type, id) => {
        return get().pinnedItems.some(p => p.type === type && p.id === id);
      },
      
      // Guided steps completion
      stepCompletions: {},
      
      toggleStepComplete: (stepId) => set((state) => {
        const existing = state.stepCompletions[stepId];
        const isNowComplete = !existing?.completed;
        
        return {
          stepCompletions: {
            ...state.stepCompletions,
            [stepId]: {
              stepId,
              completed: isNowComplete,
              completedAt: isNowComplete ? new Date().toISOString() : undefined,
              teachBackResponse: existing?.teachBackResponse
            }
          }
        };
      }),
      
      setTeachBackResponse: (stepId, response) => set((state) => ({
        stepCompletions: {
          ...state.stepCompletions,
          [stepId]: {
            ...state.stepCompletions[stepId],
            stepId,
            completed: state.stepCompletions[stepId]?.completed ?? false,
            teachBackResponse: response
          }
        }
      })),
      
      getStepCompletion: (stepId) => {
        return get().stepCompletions[stepId];
      },
      
      getCompletedStepsCount: (_lens, stepIds) => {
        const completions = get().stepCompletions;
        return stepIds.filter(id => completions[id]?.completed).length;
      }
    }),
    {
      name: 'xrpl-globe-state-gamer',
      partialize: (state) => ({
        activeLens: state.activeLens,
        sidebarExpanded: state.sidebarExpanded,
        pinnedItems: state.pinnedItems,
        stepCompletions: state.stepCompletions,
        showLiveData: state.showLiveData
      }),
      // Handle migration from old lens values (e.g., 'projects' -> 'community')
      onRehydrateStorage: () => (state) => {
        if (state && !validLenses.includes(state.activeLens)) {
          state.activeLens = 'community'; // Migrate invalid lens to community
        }
      }
    }
  )
);
