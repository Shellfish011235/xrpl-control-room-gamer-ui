// CARV - Verifiable AI Payment Rail Co-Processor
// Main System Orchestrator
// Flow: Compute → Validate → Attest → Route → Account

import {
  PaymentIntentEnvelope,
  SignedPIE,
  AttestationBatch,
  LedgerEntry,
  RouteResult,
  ValidationResult,
  CARVConfig,
  CARVSystemState,
  CARVEvent,
  CARVEventHandler,
} from './types';

import { generatePIE, generatePIESync, signPIE, computeWithLLM, type GeneratePIEParams } from './pieGenerator';
import { IntentValidator, getValidator } from './intentValidator';
import { MerkleTree, BatchAttestor } from './merkleTree';
import { VenueRouter, getRouter } from './venueRouter';
import { AccountingLedger, getLedger } from './accountingLedger';

// Re-export types
export * from './types';
export { generatePIE, generatePIESync, signPIE, computeWithLLM } from './pieGenerator';
export { IntentValidator, getValidator } from './intentValidator';
export { MerkleTree, BatchAttestor } from './merkleTree';
export { VenueRouter, getRouter } from './venueRouter';
export { AccountingLedger, getLedger } from './accountingLedger';

// New Components - Real Infrastructure
export { XRPLConnector, getXRPLConnector, resetXRPLConnector } from './xrplConnector';
export { ILPConnector, getILPConnector, resetILPConnector } from './ilpConnector';
export { LLMAgent, getLLMAgent, resetLLMAgent } from './llmAgent';
export type { PaymentDecision, PaymentRequest, AgentSession, AgentThought } from './llmAgent';
export { RegimeEngine, getRegimeEngine, resetRegimeEngine, PRESET_REGIMES } from './regimeEngine';
export type { RegimeConfig, RegimeRule, RegimeValidation } from './regimeEngine';
export { CARVOrchestrator, getOrchestrator, resetOrchestrator } from './orchestrator';
export type { OrchestratorConfig, AgentPaymentRequest, AgentPaymentResult } from './orchestrator';

// Pathfinder - Smart routing to institutions
export { Pathfinder, getPathfinder, resetPathfinder } from './pathfinder';
export type { Institution, Contact, PaymentMethod, PathfinderResult } from './pathfinder';

// ==================== DEFAULT CONFIG ====================

const DEFAULT_CONFIG: CARVConfig = {
  test_mode: true,
  wallet_address: 'rDemoWalletAddress',
  daily_volume_cap: 5.0,
  max_single_amount: 1.0,
  rejection_streak_threshold: 5,
  auto_batch_size: 10,
  auto_batch_interval_ms: 30000,
  venues: [],
  regime_summary: 'Default regime: Conservative, low-risk trading for learning purposes.',
};

// ==================== CARV SYSTEM CLASS ====================

export class CARVSystem {
  private config: CARVConfig;
  private validator: IntentValidator;
  private attestor: BatchAttestor;
  private router: VenueRouter;
  private ledger: AccountingLedger;
  
  private pendingPIEs: PaymentIntentEnvelope[] = [];
  private eventHandlers: Set<CARVEventHandler> = new Set();
  private batchInterval: number | null = null;
  private initialized: boolean = false;

  constructor(config: Partial<CARVConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize components
    this.validator = getValidator({
      test_mode: this.config.test_mode,
      daily_volume_cap: this.config.daily_volume_cap,
      max_single_amount: this.config.max_single_amount,
      rejection_streak_threshold: this.config.rejection_streak_threshold,
    });
    
    this.attestor = new BatchAttestor(this.config.auto_batch_size);
    this.router = getRouter(this.config.test_mode);
    this.ledger = getLedger();

    // Subscribe to component events
    this.validator.subscribe(e => this.emitEvent(e));
    this.router.subscribe(e => this.emitEvent(e));

    console.log(`[CARV] System initialized in ${this.config.test_mode ? 'TEST' : 'LIVE'} mode`);
  }

  // ==================== LIFECYCLE ====================

  /**
   * Initialize the system
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Initialize ledger with starting balance if in test mode
    if (this.config.test_mode) {
      await this.ledger.initializeBalance('XRP', 10000);
      await this.ledger.initializeBalance('USD', 10000);
    }

    // Start auto-batching
    this.startAutoBatch();

    this.initialized = true;
    console.log('[CARV] System ready');
  }

  /**
   * Shutdown the system
   */
  shutdown(): void {
    this.stopAutoBatch();
    this.initialized = false;
    console.log('[CARV] System shutdown');
  }

  // ==================== MAIN FLOW ====================

  /**
   * Execute full CARV flow: Compute → Validate → Attest → Route → Account
   */
  async executeFlow(params: GeneratePIEParams): Promise<{
    pie: PaymentIntentEnvelope;
    validation: ValidationResult;
    signed?: SignedPIE;
    batch?: AttestationBatch;
    route?: RouteResult;
    ledgerEntry?: LedgerEntry;
  }> {
    // Step 1: Compute (Generate PIE)
    const pie = await generatePIE({
      ...params,
      regime_summary: params.regime_summary || this.config.regime_summary,
    });

    this.emitEvent({ type: 'PIE_CREATED', pie });

    // Step 2: Validate
    const validation = this.validator.validateFull([pie]);
    
    if (!validation.valid) {
      pie.status = 'rejected';
      return { pie, validation };
    }

    pie.status = 'validated';
    this.emitEvent({ type: 'PIE_VALIDATED', pie, result: validation });

    // Step 3: Attest (Sign)
    const signed = await signPIE(pie);
    pie.status = 'attested';

    // Add to batch
    this.attestor.addToBatch(signed);

    // Check if batch is ready
    let batch: AttestationBatch | null | undefined;
    if (this.attestor.isBatchReady()) {
      batch = await this.attestor.createBatch();
      if (batch) {
        batch = await this.attestor.attestBatch(batch);
        this.emitEvent({ type: 'BATCH_ATTESTED', batch });
      }
    }

    // Step 4: Route
    pie.status = 'routing';
    const route = await this.router.route(signed);

    if (!route.success) {
      pie.status = 'failed';
      return { pie, validation, signed, batch: batch ?? undefined, route };
    }

    pie.status = 'settled';

    // Step 5: Account
    const ledgerEntry = await this.ledger.recordSettlement(pie, route);
    this.emitEvent({ type: 'PIE_SETTLED', pie, entry: ledgerEntry });

    return { pie, validation, signed, batch: batch ?? undefined, route, ledgerEntry };
  }

  /**
   * Quick flow for paper trading (simplified)
   */
  async quickTrade(
    payee: string,
    amount: number,
    asset: string,
    task: string = 'Paper trade execution'
  ): Promise<{
    success: boolean;
    pie?: PaymentIntentEnvelope;
    error?: string;
    txHash?: string;
  }> {
    try {
      const result = await this.executeFlow({
        prompt: task,
        payer: this.config.wallet_address,
        payee,
        amount,
        asset,
        regime_summary: this.config.regime_summary,
      });

      if (!result.validation.valid) {
        return { success: false, pie: result.pie, error: result.validation.reason };
      }

      if (!result.route?.success) {
        return { success: false, pie: result.pie, error: result.route?.error || 'Route failed' };
      }

      return {
        success: true,
        pie: result.pie,
        txHash: result.route.tx_hash,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ==================== BATCHING ====================

  /**
   * Start auto-batching
   */
  private startAutoBatch(): void {
    if (this.batchInterval) return;

    this.batchInterval = window.setInterval(async () => {
      if (this.attestor.getPendingCount() > 0) {
        const batch = await this.attestor.createBatch(true);
        if (batch) {
          const attested = await this.attestor.attestBatch(batch);
          this.emitEvent({ type: 'BATCH_ATTESTED', batch: attested });
        }
      }
    }, this.config.auto_batch_interval_ms);
  }

  /**
   * Stop auto-batching
   */
  private stopAutoBatch(): void {
    if (this.batchInterval) {
      clearInterval(this.batchInterval);
      this.batchInterval = null;
    }
  }

  /**
   * Force batch now
   */
  async forceBatch(): Promise<AttestationBatch | null> {
    const batch = await this.attestor.createBatch(true);
    if (batch) {
      return this.attestor.attestBatch(batch);
    }
    return null;
  }

  // ==================== CONFIGURATION ====================

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<CARVConfig>): void {
    this.config = { ...this.config, ...updates };

    if (updates.test_mode !== undefined) {
      this.validator.updateConfig({ test_mode: updates.test_mode });
      this.router.setTestMode(updates.test_mode);
      this.emitEvent({ type: 'MODE_CHANGED', mode: updates.test_mode ? 'test' : 'live' });
    }

    if (updates.daily_volume_cap !== undefined) {
      this.validator.updateConfig({ daily_volume_cap: updates.daily_volume_cap });
    }

    if (updates.regime_summary !== undefined) {
      const hash = this.quickHash(updates.regime_summary);
      this.emitEvent({ type: 'REGIME_UPDATED', summary: updates.regime_summary, hash });
    }
  }

  /**
   * Set test mode
   */
  setTestMode(testMode: boolean): void {
    this.updateConfig({ test_mode: testMode });
  }

  /**
   * Update regime summary
   */
  setRegimeSummary(summary: string): void {
    this.updateConfig({ regime_summary: summary });
  }

  // ==================== STATE ====================

  /**
   * Get system state
   */
  getState(): CARVSystemState {
    return {
      mode: this.config.test_mode ? 'test' : 'live',
      initialized: this.initialized,
      wallet_address: this.config.wallet_address,
      daily_volume_cap: this.config.daily_volume_cap,
      regime_summary: this.config.regime_summary,
      venues: this.router.getVenues(),
      pending_pies: this.attestor.getPendingPIEs().map(s => s.pie),
      batches: this.attestor.getBatches(),
      ledger_entries: this.ledger.getEntries(),
      tax_lots: this.ledger.getTaxLots(),
      validation_state: this.validator.getState(),
    };
  }

  /**
   * Get config
   */
  getConfig(): CARVConfig {
    return { ...this.config };
  }

  /**
   * Get components for direct access
   */
  getComponents(): {
    validator: IntentValidator;
    attestor: BatchAttestor;
    router: VenueRouter;
    ledger: AccountingLedger;
  } {
    return {
      validator: this.validator,
      attestor: this.attestor,
      router: this.router,
      ledger: this.ledger,
    };
  }

  // ==================== EVENTS ====================

  /**
   * Subscribe to CARV events
   */
  subscribe(handler: CARVEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  private emitEvent(event: CARVEvent): void {
    this.eventHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (e) {
        console.error('[CARV] Event handler error:', e);
      }
    });
  }

  // ==================== HELPERS ====================

  private quickHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }
}

// ==================== SINGLETON ====================

let carvInstance: CARVSystem | null = null;

export function getCARV(config?: Partial<CARVConfig>): CARVSystem {
  if (!carvInstance) {
    carvInstance = new CARVSystem(config);
  } else if (config) {
    carvInstance.updateConfig(config);
  }
  return carvInstance;
}

export function resetCARV(): void {
  if (carvInstance) {
    carvInstance.shutdown();
    carvInstance = null;
  }
}

// ==================== REACT HOOK ====================

import { useState, useEffect, useCallback } from 'react';

export function useCARV(config?: Partial<CARVConfig>): {
  carv: CARVSystem;
  state: CARVSystemState;
  events: CARVEvent[];
  isTestMode: boolean;
  executeFlow: (params: GeneratePIEParams) => Promise<any>;
  quickTrade: (payee: string, amount: number, asset: string, task?: string) => Promise<any>;
  setTestMode: (testMode: boolean) => void;
  setRegime: (summary: string) => void;
} {
  const [carv] = useState(() => getCARV(config));
  const [state, setState] = useState<CARVSystemState>(carv.getState());
  const [events, setEvents] = useState<CARVEvent[]>([]);

  useEffect(() => {
    carv.initialize();

    const unsubscribe = carv.subscribe((event) => {
      setEvents(prev => [...prev.slice(-99), event]);
      setState(carv.getState());
    });

    return () => {
      unsubscribe();
    };
  }, [carv]);

  const executeFlow = useCallback(
    (params: GeneratePIEParams) => carv.executeFlow(params),
    [carv]
  );

  const quickTrade = useCallback(
    (payee: string, amount: number, asset: string, task?: string) =>
      carv.quickTrade(payee, amount, asset, task),
    [carv]
  );

  const setTestMode = useCallback(
    (testMode: boolean) => carv.setTestMode(testMode),
    [carv]
  );

  const setRegime = useCallback(
    (summary: string) => carv.setRegimeSummary(summary),
    [carv]
  );

  return {
    carv,
    state,
    events,
    isTestMode: state.mode === 'test',
    executeFlow,
    quickTrade,
    setTestMode,
    setRegime,
  };
}

export default CARVSystem;
