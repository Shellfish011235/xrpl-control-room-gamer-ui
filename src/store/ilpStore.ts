// ILP Connector Map Zustand Store
// State management for the Interledger topology visualization

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Ledger,
  Connector,
  Corridor,
  Route,
  UILens,
  LensConfig,
  OODAPhase,
  FeynmanSummary,
  LearInvariant,
  ILPEvent,
  RiskFlag,
  CorridorStatus,
  VisualConfig,
} from '../services/ilp/types';
import { DEFAULT_VISUAL_CONFIG } from '../services/ilp/types';
import { getTopology } from '../services/ilp/topology';
import type { TopologyService } from '../services/ilp/topology';

// ==================== TYPES ====================

interface ILPStoreState {
  // Initialization
  initialized: boolean;
  oodaRunning: boolean;
  
  // Core data (derived from topology service)
  ledgers: Ledger[];
  connectors: Connector[];
  corridors: Corridor[];
  
  // UI State
  activeLens: UILens;
  lensConfigs: Record<UILens, LensConfig>;
  selectedLedger: string | null;
  selectedConnector: string | null;
  selectedCorridor: string | null;
  hoveredElement: { type: 'ledger' | 'connector' | 'corridor'; id: string } | null;
  
  // OODA State
  oodaPhase: OODAPhase;
  lastObservation: string;
  lastOrientation: string;
  lastDecision: string;
  lastAction: string;
  
  // Feynman & Invariants
  feynman: FeynmanSummary;
  invariants: LearInvariant[];
  invariantViolations: string[];
  
  // Visual Config
  visualConfig: VisualConfig;
  showLabels: boolean;
  showRiskFog: boolean;
  showFlowParticles: boolean;
  cameraMode: '2d' | '3d' | 'orbital';
  
  // Routing
  activeRoute: Route | null;
  routeHistory: Route[];
  
  // Events
  events: ILPEvent[];
  
  // Filters
  filters: {
    minTrust: number;
    minVolume: number;
    riskFlags: RiskFlag[];
    ledgerTypes: string[];
    corridorStatus: CorridorStatus[];
  };
}

interface ILPStoreActions {
  // Initialization
  initialize: () => void;
  shutdown: () => void;
  
  // OODA Control
  startOODA: () => void;
  stopOODA: () => void;
  
  // Lens Management
  setActiveLens: (lens: UILens) => void;
  updateLensConfig: (lens: UILens, config: Partial<LensConfig>) => void;
  
  // Selection
  selectLedger: (id: string | null) => void;
  selectConnector: (id: string | null) => void;
  selectCorridor: (id: string | null) => void;
  setHoveredElement: (element: { type: 'ledger' | 'connector' | 'corridor'; id: string } | null) => void;
  
  // Visual Config
  updateVisualConfig: (config: Partial<VisualConfig>) => void;
  toggleLabels: () => void;
  toggleRiskFog: () => void;
  toggleFlowParticles: () => void;
  setCameraMode: (mode: '2d' | '3d' | 'orbital') => void;
  
  // Routing
  calculateRoute: (from: string, to: string, amount: number) => Route | null;
  clearRoute: () => void;
  
  // Filters
  updateFilters: (filters: Partial<ILPStoreState['filters']>) => void;
  resetFilters: () => void;
  
  // Events
  clearEvents: () => void;
  
  // Sync
  syncFromTopology: () => void;
}

type ILPStore = ILPStoreState & ILPStoreActions;

// ==================== INITIAL STATE ====================

const initialLensConfigs: Record<UILens, LensConfig> = {
  domain: { lens: 'domain', enabled: true, opacity: 1 },
  trust: { lens: 'trust', enabled: true, opacity: 1 },
  heat: { lens: 'heat', enabled: false, opacity: 0.7 },
  fog: { lens: 'fog', enabled: true, opacity: 0.5 },
  flow: { lens: 'flow', enabled: false, opacity: 0.8 },
};

const initialState: ILPStoreState = {
  initialized: false,
  oodaRunning: false,
  ledgers: [],
  connectors: [],
  corridors: [],
  activeLens: 'trust',
  lensConfigs: initialLensConfigs,
  selectedLedger: null,
  selectedConnector: null,
  selectedCorridor: null,
  hoveredElement: null,
  oodaPhase: 'observe',
  lastObservation: '',
  lastOrientation: '',
  lastDecision: '',
  lastAction: '',
  feynman: {
    summary: '',
    complexity: 'simple',
    timestamp: new Date().toISOString(),
  },
  invariants: [],
  invariantViolations: [],
  visualConfig: DEFAULT_VISUAL_CONFIG,
  showLabels: true,
  showRiskFog: true,
  showFlowParticles: false,
  cameraMode: '2d',
  activeRoute: null,
  routeHistory: [],
  events: [],
  filters: {
    minTrust: 0,
    minVolume: 0,
    riskFlags: [],
    ledgerTypes: [],
    corridorStatus: [],
  },
};

// ==================== STORE ====================

export const useILPStore = create<ILPStore>()(
  persist(
    (set, get) => {
      let topology: TopologyService | null = null;
      let unsubscribe: (() => void) | null = null;

      return {
        ...initialState,

        // ==================== INITIALIZATION ====================

        initialize: () => {
          // Always reinitialize if ledgers are empty (persist may have corrupted state)
          const state = get();
          console.log('[ILP Store] initialize() called. Current state:', {
            initialized: state.initialized,
            ledgersCount: state.ledgers.length,
          });
          
          if (state.initialized && state.ledgers.length > 0) {
            console.log('[ILP Store] Already initialized with data, skipping');
            return;
          }

          console.log('[ILP Store] Creating topology service...');
          topology = getTopology();
          
          // Debug: Check topology data immediately
          const topologyLedgers = topology.getLedgers();
          console.log('[ILP Store] Topology ledgers:', topologyLedgers.length, topologyLedgers.map(l => l.name));

          // Subscribe to topology events
          unsubscribe = topology.subscribe((event) => {
            get().syncFromTopology();
            set(state => ({
              events: [...state.events.slice(-99), event],
            }));

            // Handle specific events
            if (event.type === 'OODA_PHASE_CHANGED') {
              const s = topology!.getState();
              set({
                oodaPhase: event.phase,
                lastObservation: s.ooda.last_observation,
                lastOrientation: s.ooda.last_orientation,
                lastDecision: s.ooda.last_decision,
                lastAction: s.ooda.last_action,
              });
            }

            if (event.type === 'INVARIANT_VIOLATED') {
              set(state => ({
                invariantViolations: [...state.invariantViolations, event.invariant.name],
              }));
            }
          });

          // Initial sync
          console.log('[ILP Store] Running syncFromTopology...');
          get().syncFromTopology();
          
          // Verify sync worked
          const afterSync = get();
          console.log('[ILP Store] After sync:', {
            ledgersCount: afterSync.ledgers.length,
            connectorsCount: afterSync.connectors.length,
            corridorsCount: afterSync.corridors.length,
          });

          set({ initialized: true });
          console.log('[ILP Store] Initialized successfully');
        },

        shutdown: () => {
          if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
          }
          if (topology) {
            topology.stopOODALoop();
            topology = null;
          }
          set({ initialized: false, oodaRunning: false });
        },

        // ==================== OODA CONTROL ====================

        startOODA: () => {
          if (topology && !get().oodaRunning) {
            topology.startOODALoop(10000);
            set({ oodaRunning: true });
          }
        },

        stopOODA: () => {
          if (topology && get().oodaRunning) {
            topology.stopOODALoop();
            set({ oodaRunning: false });
          }
        },

        // ==================== LENS MANAGEMENT ====================

        setActiveLens: (lens) => {
          if (topology) {
            topology.setActiveLens(lens);
          }
          set({ activeLens: lens });
        },

        updateLensConfig: (lens, config) => {
          set(state => ({
            lensConfigs: {
              ...state.lensConfigs,
              [lens]: { ...state.lensConfigs[lens], ...config },
            },
          }));
        },

        // ==================== SELECTION ====================

        selectLedger: (id) => {
          set({ selectedLedger: id, selectedConnector: null, selectedCorridor: null });
        },

        selectConnector: (id) => {
          set({ selectedConnector: id, selectedLedger: null, selectedCorridor: null });
        },

        selectCorridor: (id) => {
          set({ selectedCorridor: id, selectedLedger: null, selectedConnector: null });
        },

        setHoveredElement: (element) => {
          set({ hoveredElement: element });
        },

        // ==================== VISUAL CONFIG ====================

        updateVisualConfig: (config) => {
          set(state => ({
            visualConfig: { ...state.visualConfig, ...config },
          }));
        },

        toggleLabels: () => {
          set(state => ({ showLabels: !state.showLabels }));
        },

        toggleRiskFog: () => {
          set(state => ({ showRiskFog: !state.showRiskFog }));
        },

        toggleFlowParticles: () => {
          set(state => ({ showFlowParticles: !state.showFlowParticles }));
        },

        setCameraMode: (mode) => {
          set({ cameraMode: mode });
        },

        // ==================== ROUTING ====================

        calculateRoute: (from, to, amount) => {
          if (!topology) return null;
          const route = topology.calculateRoute(from, to, amount);
          if (route) {
            set(state => ({
              activeRoute: route,
              routeHistory: [...state.routeHistory.slice(-19), route],
            }));
          }
          return route;
        },

        clearRoute: () => {
          set({ activeRoute: null });
        },

        // ==================== FILTERS ====================

        updateFilters: (filters) => {
          set(state => ({
            filters: { ...state.filters, ...filters },
          }));
        },

        resetFilters: () => {
          set({
            filters: {
              minTrust: 0,
              minVolume: 0,
              riskFlags: [],
              ledgerTypes: [],
              corridorStatus: [],
            },
          });
        },

        // ==================== EVENTS ====================

        clearEvents: () => {
          set({ events: [], invariantViolations: [] });
        },

        // ==================== SYNC ====================

        syncFromTopology: () => {
          if (!topology) {
            console.warn('[ILP Store] syncFromTopology called but topology is null');
            return;
          }

          const ledgers = topology.getLedgers();
          const connectors = topology.getConnectors();
          const corridors = topology.getCorridors();
          const state = topology.getState();
          
          console.log('[ILP Store] syncFromTopology - data from topology:', {
            ledgers: ledgers.length,
            connectors: connectors.length,
            corridors: corridors.length,
          });

          set({
            ledgers,
            connectors,
            corridors,
            feynman: state.feynman,
            invariants: state.invariants,
            oodaPhase: state.ooda.current_phase,
            lastObservation: state.ooda.last_observation,
            lastOrientation: state.ooda.last_orientation,
            lastDecision: state.ooda.last_decision,
            lastAction: state.ooda.last_action,
          });
        },
      };
    },
    {
      name: 'ilp-store',
      partialize: (state) => ({
        activeLens: state.activeLens,
        lensConfigs: state.lensConfigs,
        visualConfig: state.visualConfig,
        showLabels: state.showLabels,
        showRiskFog: state.showRiskFog,
        showFlowParticles: state.showFlowParticles,
        cameraMode: state.cameraMode,
        filters: state.filters,
      }),
    }
  )
);

// ==================== SELECTORS ====================

export const useILPLedgers = () => useILPStore(state => state.ledgers);
export const useILPConnectors = () => useILPStore(state => state.connectors);
export const useILPCorridors = () => useILPStore(state => state.corridors);
export const useILPActiveLens = () => useILPStore(state => state.activeLens);
export const useILPSelectedLedger = () => useILPStore(state => {
  const id = state.selectedLedger;
  return id ? state.ledgers.find(l => l.id === id) : null;
});
export const useILPSelectedConnector = () => useILPStore(state => {
  const id = state.selectedConnector;
  return id ? state.connectors.find(c => c.id === id) : null;
});
export const useILPFeynman = () => useILPStore(state => state.feynman);
export const useILPOODA = () => useILPStore(state => ({
  phase: state.oodaPhase,
  running: state.oodaRunning,
  observation: state.lastObservation,
  orientation: state.lastOrientation,
  decision: state.lastDecision,
  action: state.lastAction,
}));
export const useILPInvariants = () => useILPStore(state => ({
  invariants: state.invariants,
  violations: state.invariantViolations,
}));

// Filtered data selectors
export const useFilteredConnectors = () => useILPStore(state => {
  const { minTrust, riskFlags } = state.filters;
  return state.connectors.filter(c => {
    if (c.trust_score < minTrust) return false;
    if (riskFlags.length > 0 && !c.risk_flags.some(f => riskFlags.includes(f))) return false;
    return true;
  });
});

export const useFilteredCorridors = () => useILPStore(state => {
  const { corridorStatus, minVolume } = state.filters;
  return state.corridors.filter(c => {
    if (corridorStatus.length > 0 && !corridorStatus.includes(c.status)) return false;
    if ((c.volume_24h || 0) < minVolume) return false;
    return true;
  });
});

export default useILPStore;
