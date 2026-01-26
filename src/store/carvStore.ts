// CARV Zustand Store
// State management for the Verifiable AI Payment Rail Co-Processor

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  CARVSystem,
  getCARV,
  PaymentIntentEnvelope,
  AttestationBatch,
  LedgerEntry,
  TaxLot,
  CARVEvent,
  CARVConfig,
  ValidationResult,
  RouteResult,
  VenueConfig,
  AggregateValidationState,
  TaxReport,
} from '../services/carv';

// ==================== TYPES ====================

interface CARVStoreState {
  // System state
  initialized: boolean;
  testMode: boolean;
  walletAddress: string;
  regimeSummary: string;
  
  // Volume & limits
  dailyVolumeCap: number;
  maxSingleAmount: number;
  currentDailyVolume: number;
  
  // PIEs
  pendingPIEs: PaymentIntentEnvelope[];
  recentPIEs: PaymentIntentEnvelope[];
  
  // Batches
  batches: AttestationBatch[];
  
  // Ledger
  ledgerEntries: LedgerEntry[];
  taxLots: TaxLot[];
  
  // Venues
  venues: VenueConfig[];
  
  // Validation
  validationState: AggregateValidationState | null;
  
  // Events
  events: CARVEvent[];
  
  // Stats
  stats: {
    totalPIEs: number;
    successfulRoutes: number;
    failedRoutes: number;
    totalGainLoss: number;
    totalFees: number;
  };
}

interface CARVStoreActions {
  // Initialization
  initialize: () => Promise<void>;
  reset: () => void;
  
  // Configuration
  setTestMode: (testMode: boolean) => void;
  setRegimeSummary: (summary: string) => void;
  setDailyVolumeCap: (cap: number) => void;
  setMaxSingleAmount: (max: number) => void;
  setWalletAddress: (address: string) => void;
  
  // PIE Operations
  createPIE: (params: {
    payee: string;
    amount: number;
    asset: string;
    task?: string;
  }) => Promise<{
    success: boolean;
    pie?: PaymentIntentEnvelope;
    validation?: ValidationResult;
    route?: RouteResult;
    error?: string;
  }>;
  
  // Batch Operations
  forceBatch: () => Promise<AttestationBatch | null>;
  
  // Tax Operations
  generateTaxReport: (startDate: string, endDate: string) => TaxReport | null;
  downloadTaxCSV: (startDate: string, endDate: string) => void;
  
  // Event handling
  addEvent: (event: CARVEvent) => void;
  clearEvents: () => void;
  
  // State sync
  syncState: () => void;
}

type CARVStore = CARVStoreState & CARVStoreActions;

// ==================== INITIAL STATE ====================

const initialState: CARVStoreState = {
  initialized: false,
  testMode: true,
  walletAddress: 'rDemoWalletAddress',
  regimeSummary: 'Default regime: Conservative, low-risk trading for learning purposes.',
  dailyVolumeCap: 5.0,
  maxSingleAmount: 1.0,
  currentDailyVolume: 0,
  pendingPIEs: [],
  recentPIEs: [],
  batches: [],
  ledgerEntries: [],
  taxLots: [],
  venues: [],
  validationState: null,
  events: [],
  stats: {
    totalPIEs: 0,
    successfulRoutes: 0,
    failedRoutes: 0,
    totalGainLoss: 0,
    totalFees: 0,
  },
};

// ==================== STORE ====================

export const useCARVStore = create<CARVStore>()(
  persist(
    (set, get) => {
      let carv: CARVSystem | null = null;

      return {
        ...initialState,

        // ==================== INITIALIZATION ====================

        initialize: async () => {
          if (get().initialized) return;

          carv = getCARV({
            test_mode: get().testMode,
            wallet_address: get().walletAddress,
            daily_volume_cap: get().dailyVolumeCap,
            max_single_amount: get().maxSingleAmount,
            regime_summary: get().regimeSummary,
          });

          // Subscribe to events
          carv.subscribe((event) => {
            get().addEvent(event);
            get().syncState();
          });

          await carv.initialize();
          get().syncState();
          
          set({ initialized: true });
          console.log('[CARVStore] Initialized');
        },

        reset: () => {
          if (carv) {
            carv.shutdown();
            carv = null;
          }
          set(initialState);
        },

        // ==================== CONFIGURATION ====================

        setTestMode: (testMode: boolean) => {
          set({ testMode });
          if (carv) {
            carv.setTestMode(testMode);
          }
        },

        setRegimeSummary: (summary: string) => {
          set({ regimeSummary: summary });
          if (carv) {
            carv.setRegimeSummary(summary);
          }
        },

        setDailyVolumeCap: (cap: number) => {
          set({ dailyVolumeCap: cap });
          if (carv) {
            carv.updateConfig({ daily_volume_cap: cap });
          }
        },

        setMaxSingleAmount: (max: number) => {
          set({ maxSingleAmount: max });
          if (carv) {
            carv.updateConfig({ max_single_amount: max });
          }
        },

        setWalletAddress: (address: string) => {
          set({ walletAddress: address });
          if (carv) {
            carv.updateConfig({ wallet_address: address });
          }
        },

        // ==================== PIE OPERATIONS ====================

        createPIE: async (params) => {
          if (!carv) {
            await get().initialize();
            carv = getCARV();
          }

          const result = await carv.executeFlow({
            prompt: params.task || 'User-initiated trade',
            payer: get().walletAddress,
            payee: params.payee,
            amount: params.amount,
            asset: params.asset,
            regime_summary: get().regimeSummary,
          });

          // Update stats
          const stats = get().stats;
          set({
            stats: {
              ...stats,
              totalPIEs: stats.totalPIEs + 1,
              successfulRoutes: result.route?.success 
                ? stats.successfulRoutes + 1 
                : stats.successfulRoutes,
              failedRoutes: result.route && !result.route.success 
                ? stats.failedRoutes + 1 
                : stats.failedRoutes,
            },
          });

          // Sync state
          get().syncState();

          return {
            success: result.validation.valid && (result.route?.success || false),
            pie: result.pie,
            validation: result.validation,
            route: result.route,
            error: !result.validation.valid 
              ? result.validation.reason 
              : result.route?.error,
          };
        },

        // ==================== BATCH OPERATIONS ====================

        forceBatch: async () => {
          if (!carv) return null;
          const batch = await carv.forceBatch();
          get().syncState();
          return batch;
        },

        // ==================== TAX OPERATIONS ====================

        generateTaxReport: (startDate: string, endDate: string) => {
          if (!carv) return null;
          const { ledger } = carv.getComponents();
          return ledger.generateTaxReport(startDate, endDate);
        },

        downloadTaxCSV: (startDate: string, endDate: string) => {
          if (!carv) return;
          const { ledger } = carv.getComponents();
          const report = ledger.generateTaxReport(startDate, endDate);
          if (report) {
            ledger.downloadCSV(report);
          }
        },

        // ==================== EVENTS ====================

        addEvent: (event: CARVEvent) => {
          set((state) => ({
            events: [...state.events.slice(-99), event],
          }));
        },

        clearEvents: () => {
          set({ events: [] });
        },

        // ==================== STATE SYNC ====================

        syncState: () => {
          if (!carv) return;

          const state = carv.getState();
          const { ledger, validator } = carv.getComponents();

          set({
            testMode: state.mode === 'test',
            walletAddress: state.wallet_address,
            regimeSummary: state.regime_summary,
            dailyVolumeCap: state.daily_volume_cap,
            currentDailyVolume: state.validation_state.daily_volume,
            pendingPIEs: state.pending_pies,
            batches: state.batches,
            ledgerEntries: state.ledger_entries,
            taxLots: state.tax_lots,
            venues: state.venues,
            validationState: state.validation_state,
            stats: {
              ...get().stats,
              totalGainLoss: ledger.getTotalGainLoss(),
              totalFees: ledger.getTotalFees(),
            },
          });

          // Update recent PIEs
          const recentPIEs = state.batches
            .flatMap(b => b.pies.map(sp => sp.pie))
            .slice(-50);
          set({ recentPIEs });
        },
      };
    },
    {
      name: 'carv-store',
      partialize: (state) => ({
        testMode: state.testMode,
        walletAddress: state.walletAddress,
        regimeSummary: state.regimeSummary,
        dailyVolumeCap: state.dailyVolumeCap,
        maxSingleAmount: state.maxSingleAmount,
      }),
    }
  )
);

// ==================== SELECTORS ====================

export const useCARVTestMode = () => useCARVStore((state) => state.testMode);
export const useCARVEvents = () => useCARVStore((state) => state.events);
export const useCARVStats = () => useCARVStore((state) => state.stats);
export const useCARVPendingPIEs = () => useCARVStore((state) => state.pendingPIEs);
export const useCARVBatches = () => useCARVStore((state) => state.batches);
export const useCARVLedger = () => useCARVStore((state) => state.ledgerEntries);
export const useCARVTaxLots = () => useCARVStore((state) => state.taxLots);
export const useCARVVenues = () => useCARVStore((state) => state.venues);
export const useCARVDailyVolume = () => useCARVStore((state) => ({
  current: state.currentDailyVolume,
  cap: state.dailyVolumeCap,
  remaining: state.dailyVolumeCap - state.currentDailyVolume,
  utilization: (state.currentDailyVolume / state.dailyVolumeCap) * 100,
}));

export default useCARVStore;
