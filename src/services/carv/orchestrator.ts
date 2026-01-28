// CARV - Unified Orchestrator
// Coordinates LLM Agent → Regime Engine → PIE → Router → Settlement
// This is the "brain" that makes AI-powered payments possible

import {
  PaymentIntentEnvelope,
  SignedPIE,
  RouteResult,
  ValidationResult,
  CARVEvent,
  CARVEventHandler,
  VenueType,
} from './types';

import { generatePIE, signPIE, GeneratePIEParams } from './pieGenerator';
import { getXRPLConnector, XRPLConnector } from './xrplConnector';
import { getILPConnector, ILPConnector } from './ilpConnector';
import { getLLMAgent, LLMAgent, PaymentDecision, PaymentRequest } from './llmAgent';
import { getRegimeEngine, RegimeEngine, PRESET_REGIMES } from './regimeEngine';
import { BatchAttestor } from './merkleTree';
import { getLedger, AccountingLedger } from './accountingLedger';

// ==================== TYPES ====================

export interface OrchestratorConfig {
  mode: 'test' | 'live';
  network: 'testnet' | 'mainnet' | 'devnet';
  regimePreset: keyof typeof PRESET_REGIMES;
  llmProvider: 'openai' | 'anthropic' | 'mock';
  llmApiKey?: string;
  walletSeed?: string;
  requireLLMApproval: boolean; // If true, LLM must approve before execution
  autoBatchInterval: number; // ms, 0 to disable
}

export interface AgentPaymentRequest {
  task: string; // Natural language: "Send 5 XRP to rABC123 for coffee"
  context?: Record<string, any>;
  forceApprove?: boolean; // Skip LLM check (dangerous!)
}

export interface AgentPaymentResult {
  success: boolean;
  
  // LLM Phase
  llmDecision?: PaymentDecision;
  llmSkipped?: boolean;
  
  // Regime Phase
  regimeValidation?: ReturnType<RegimeEngine['validate']>;
  
  // PIE Phase
  pie?: PaymentIntentEnvelope;
  signedPie?: SignedPIE;
  
  // Routing Phase
  route?: RouteResult;
  
  // Error
  error?: string;
  failedAt?: 'llm' | 'regime' | 'pie' | 'route' | 'settlement';
  
  // Timing
  timing: {
    total: number;
    llm?: number;
    regime?: number;
    pie?: number;
    route?: number;
  };
}

export interface OrchestratorState {
  mode: 'test' | 'live';
  network: string;
  walletAddress?: string;
  walletBalance?: number;
  regimeName: string;
  llmProvider: string;
  connected: boolean;
  initialized: boolean;
}

// ==================== ORCHESTRATOR CLASS ====================

export class CARVOrchestrator {
  private config: OrchestratorConfig;
  private xrpl: XRPLConnector;
  private ilp: ILPConnector;
  private llm: LLMAgent;
  private regime: RegimeEngine;
  private attestor: BatchAttestor;
  private ledger: AccountingLedger;
  
  private eventHandlers: Set<CARVEventHandler> = new Set();
  private batchTimer: number | null = null;
  private initialized: boolean = false;

  constructor(config: Partial<OrchestratorConfig> = {}) {
    this.config = {
      mode: config.mode || 'test',
      network: config.network || 'testnet',
      regimePreset: config.regimePreset || 'conservative',
      llmProvider: config.llmProvider || 'mock',
      llmApiKey: config.llmApiKey,
      walletSeed: config.walletSeed,
      requireLLMApproval: config.requireLLMApproval ?? true,
      autoBatchInterval: config.autoBatchInterval ?? 30000,
    };

    // Initialize components
    this.xrpl = getXRPLConnector({ network: this.config.network });
    this.ilp = getILPConnector({ mode: this.config.mode });
    this.llm = getLLMAgent({ 
      provider: this.config.llmProvider,
      apiKey: this.config.llmApiKey,
    });
    this.regime = getRegimeEngine(this.config.regimePreset);
    this.attestor = new BatchAttestor(10);
    this.ledger = getLedger();

    console.log(`[Orchestrator] Created in ${this.config.mode} mode on ${this.config.network}`);
  }

  // ==================== LIFECYCLE ====================

  /**
   * Initialize all components
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('[Orchestrator] Initializing...');

    // Connect to XRPL if not in simulation-only mode
    if (this.config.mode === 'live' || this.config.network !== 'testnet') {
      try {
        await this.xrpl.connect();
        
        // Fund wallet from faucet if on testnet and no seed provided
        if (this.config.network === 'testnet' && !this.config.walletSeed) {
          console.log('[Orchestrator] Funding wallet from testnet faucet...');
          await this.xrpl.fundFromFaucet();
        } else if (this.config.walletSeed) {
          this.xrpl.setWallet(this.config.walletSeed);
        }
      } catch (e) {
        console.warn('[Orchestrator] XRPL connection failed, will use simulation:', e);
      }
    }

    // Initialize LLM session
    this.llm.startSession(this.regime.generateSummary());

    // Initialize ledger with test balances
    if (this.config.mode === 'test') {
      await this.ledger.initializeBalance('XRP', 10000);
      await this.ledger.initializeBalance('USD', 10000);
    }

    // Start auto-batching
    if (this.config.autoBatchInterval > 0) {
      this.startAutoBatch();
    }

    this.initialized = true;
    console.log('[Orchestrator] Initialized successfully');
    
    this.emitEvent({
      type: 'MODE_CHANGED',
      mode: this.config.mode,
    });
  }

  /**
   * Shutdown
   */
  shutdown(): void {
    this.stopAutoBatch();
    this.xrpl.disconnect();
    this.initialized = false;
    console.log('[Orchestrator] Shutdown');
  }

  // ==================== MAIN FLOW ====================

  /**
   * Execute an AI-assisted payment
   * This is the main entry point for the product
   */
  async executeAgentPayment(request: AgentPaymentRequest): Promise<AgentPaymentResult> {
    const startTime = Date.now();
    const timing: AgentPaymentResult['timing'] = { total: 0 };

    console.log(`[Orchestrator] Processing: "${request.task}"`);

    // ========== PHASE 1: LLM EVALUATION ==========
    let llmDecision: PaymentDecision | undefined;
    
    if (this.config.requireLLMApproval && !request.forceApprove) {
      const llmStart = Date.now();
      
      try {
        llmDecision = await this.llm.evaluatePayment({
          task: request.task,
          context: {
            ...request.context,
            regime: this.regime.generateSummary(),
            dailyStats: this.regime.getDailyStats(),
            walletBalance: await this.getWalletBalance(),
          },
        });
        
        timing.llm = Date.now() - llmStart;
        
        this.emitEvent({
          type: 'ESCALATION_ALERT',
          reason: 'LLM_EVALUATION',
          data: { decision: llmDecision },
        });

        if (!llmDecision.approved) {
          timing.total = Date.now() - startTime;
          return {
            success: false,
            llmDecision,
            error: llmDecision.reasoning,
            failedAt: 'llm',
            timing,
          };
        }
      } catch (e) {
        timing.total = Date.now() - startTime;
        return {
          success: false,
          error: `LLM evaluation failed: ${e instanceof Error ? e.message : 'Unknown error'}`,
          failedAt: 'llm',
          timing,
        };
      }
    }

    // ========== PHASE 2: EXTRACT PAYMENT PARAMS ==========
    const paymentParams = this.extractPaymentParams(request, llmDecision);
    
    if (!paymentParams.payee || !paymentParams.amount) {
      timing.total = Date.now() - startTime;
      return {
        success: false,
        llmDecision,
        error: 'Could not extract payment parameters from request',
        failedAt: 'pie',
        timing,
      };
    }

    // ========== PHASE 3: GENERATE PIE ==========
    const pieStart = Date.now();
    
    const pie = await generatePIE({
      prompt: request.task,
      payer: this.xrpl.getWallet()?.address || 'rDemoWallet',
      payee: paymentParams.payee,
      amount: paymentParams.amount,
      asset: paymentParams.asset || 'XRP',
      regime_summary: this.regime.generateSummary(),
    });

    // Add LLM reasoning hash to PIE proofs
    if (llmDecision) {
      pie.proofs.prompt_hash = this.llm.generateReasoningHash(llmDecision);
    }

    timing.pie = Date.now() - pieStart;

    this.emitEvent({ type: 'PIE_CREATED', pie });

    // ========== PHASE 4: REGIME VALIDATION ==========
    const regimeStart = Date.now();
    
    const regimeValidation = this.regime.validate(pie);
    timing.regime = Date.now() - regimeStart;

    if (!regimeValidation.passed) {
      this.emitEvent({
        type: 'PIE_REJECTED',
        pie,
        result: this.regime.toValidationResult(regimeValidation),
      });

      timing.total = Date.now() - startTime;
      return {
        success: false,
        llmDecision,
        llmSkipped: !this.config.requireLLMApproval || request.forceApprove,
        regimeValidation,
        pie,
        error: regimeValidation.blockedBy?.action.message || 'Blocked by regime',
        failedAt: 'regime',
        timing,
      };
    }

    pie.status = 'validated';
    this.emitEvent({
      type: 'PIE_VALIDATED',
      pie,
      result: this.regime.toValidationResult(regimeValidation),
    });

    // ========== PHASE 5: SIGN & ATTEST ==========
    const signedPie = await signPIE(pie);
    pie.status = 'attested';
    
    this.attestor.addToBatch(signedPie);

    // ========== PHASE 6: ROUTE & EXECUTE ==========
    const routeStart = Date.now();
    
    const route = await this.routePayment(signedPie);
    timing.route = Date.now() - routeStart;

    this.emitEvent({ type: 'PIE_ROUTED', pie, result: route });

    if (!route.success) {
      pie.status = 'failed';
      timing.total = Date.now() - startTime;
      return {
        success: false,
        llmDecision,
        llmSkipped: !this.config.requireLLMApproval || request.forceApprove,
        regimeValidation,
        pie,
        signedPie,
        route,
        error: route.error || 'Route execution failed',
        failedAt: 'route',
        timing,
      };
    }

    pie.status = 'settled';

    // ========== PHASE 7: RECORD IN LEDGER ==========
    const ledgerEntry = await this.ledger.recordSettlement(pie, route);
    this.regime.recordTransaction(pie);

    this.emitEvent({ type: 'PIE_SETTLED', pie, entry: ledgerEntry });

    timing.total = Date.now() - startTime;

    console.log(`[Orchestrator] Payment complete in ${timing.total}ms`);

    return {
      success: true,
      llmDecision,
      llmSkipped: !this.config.requireLLMApproval || request.forceApprove,
      regimeValidation,
      pie,
      signedPie,
      route,
      timing,
    };
  }

  /**
   * Quick payment without LLM (use with caution)
   */
  async quickPayment(
    payee: string,
    amount: number,
    asset: string = 'XRP',
    memo?: string
  ): Promise<AgentPaymentResult> {
    return this.executeAgentPayment({
      task: memo || `Send ${amount} ${asset} to ${payee}`,
      forceApprove: true,
      context: { payee, amount, asset },
    });
  }

  // ==================== ROUTING ====================

  private async routePayment(signedPie: SignedPIE): Promise<RouteResult> {
    const venue = this.selectVenue(signedPie.pie);

    // Test mode always uses simulation
    if (this.config.mode === 'test') {
      return this.simulatePayment(signedPie);
    }

    switch (venue) {
      case 'xrpl':
        return this.xrpl.executeFromPIE(signedPie);
      case 'ilp':
        return this.ilp.executeFromPIE(signedPie);
      default:
        return this.simulatePayment(signedPie);
    }
  }

  private selectVenue(pie: PaymentIntentEnvelope): VenueType {
    const payee = pie.payee;

    // Payment pointer → ILP
    if (payee.startsWith('$') || payee.includes('.')) {
      return 'ilp';
    }

    // XRPL address
    if (payee.startsWith('r') && payee.length >= 25) {
      return 'xrpl';
    }

    // Default to simulation
    return 'simulation';
  }

  private async simulatePayment(signedPie: SignedPIE): Promise<RouteResult> {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 100 + Math.random() * 200));

    return {
      success: true,
      venue: 'simulation',
      tx_hash: `SIM_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      fee_paid: '0',
      fill_percent: 100,
      settlement_time: new Date().toISOString(),
    };
  }

  // ==================== HELPERS ====================

  private extractPaymentParams(
    request: AgentPaymentRequest,
    llmDecision?: PaymentDecision
  ): { payee?: string; amount?: number; asset?: string } {
    // If LLM provided structured payment, use that
    if (llmDecision?.suggestedPayment) {
      return {
        payee: llmDecision.suggestedPayment.payee,
        amount: llmDecision.suggestedPayment.amount,
        asset: llmDecision.suggestedPayment.asset,
      };
    }

    // If context has explicit values, use those
    if (request.context?.payee && request.context?.amount) {
      return {
        payee: request.context.payee,
        amount: request.context.amount,
        asset: request.context.asset || 'XRP',
      };
    }

    // Try to parse from task string
    const task = request.task;
    
    // Extract amount: "5 XRP", "10.5 USD", etc.
    const amountMatch = task.match(/(\d+\.?\d*)\s*(XRP|USD|EUR)?/i);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : undefined;
    const asset = amountMatch?.[2]?.toUpperCase() || 'XRP';

    // Extract payee: "to rABC123", "to $wallet.example.com"
    const payeeMatch = task.match(/to\s+(\$?[a-zA-Z0-9._]+)/i) || 
                       task.match(/(r[a-zA-Z0-9]{24,34})/);
    const payee = payeeMatch?.[1];

    return { payee, amount, asset };
  }

  private async getWalletBalance(): Promise<number> {
    try {
      if (this.config.mode === 'test') {
        return 10000; // Mock balance for test mode
      }
      return await this.xrpl.getBalance();
    } catch {
      return 0;
    }
  }

  // ==================== BATCHING ====================

  private startAutoBatch(): void {
    if (this.batchTimer) return;

    this.batchTimer = window.setInterval(async () => {
      if (this.attestor.getPendingCount() > 0) {
        const batch = await this.attestor.createBatch(true);
        if (batch) {
          const attested = await this.attestor.attestBatch(batch);
          this.emitEvent({ type: 'BATCH_ATTESTED', batch: attested });
        }
      }
    }, this.config.autoBatchInterval);
  }

  private stopAutoBatch(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
  }

  async forceBatch(): Promise<void> {
    const batch = await this.attestor.createBatch(true);
    if (batch) {
      const attested = await this.attestor.attestBatch(batch);
      this.emitEvent({ type: 'BATCH_ATTESTED', batch: attested });
    }
  }

  // ==================== CONFIGURATION ====================

  setMode(mode: 'test' | 'live'): void {
    this.config.mode = mode;
    this.ilp.setMode(mode);
    this.emitEvent({ type: 'MODE_CHANGED', mode });
  }

  setRegime(preset: keyof typeof PRESET_REGIMES): void {
    this.regime.loadPreset(preset);
    this.config.regimePreset = preset;
    this.llm.setRegime(this.regime.generateSummary());
    this.emitEvent({
      type: 'REGIME_UPDATED',
      summary: this.regime.generateSummary(),
      hash: this.regime.generateRegimeHash(),
    });
  }

  setLLMRequired(required: boolean): void {
    this.config.requireLLMApproval = required;
  }

  // ==================== STATE ====================

  getState(): OrchestratorState {
    const wallet = this.xrpl.getWallet();
    return {
      mode: this.config.mode,
      network: this.config.network,
      walletAddress: wallet?.address,
      walletBalance: undefined, // Would need async call
      regimeName: this.regime.getConfig().name,
      llmProvider: this.config.llmProvider,
      connected: this.xrpl.isConnected(),
      initialized: this.initialized,
    };
  }

  getComponents(): {
    xrpl: XRPLConnector;
    ilp: ILPConnector;
    llm: LLMAgent;
    regime: RegimeEngine;
    ledger: AccountingLedger;
    attestor: BatchAttestor;
  } {
    return {
      xrpl: this.xrpl,
      ilp: this.ilp,
      llm: this.llm,
      regime: this.regime,
      ledger: this.ledger,
      attestor: this.attestor,
    };
  }

  // ==================== EVENTS ====================

  subscribe(handler: CARVEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  private emitEvent(event: CARVEvent): void {
    this.eventHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (e) {
        console.error('[Orchestrator] Event handler error:', e);
      }
    });
  }
}

// ==================== SINGLETON ====================

let orchestrator: CARVOrchestrator | null = null;

export function getOrchestrator(config?: Partial<OrchestratorConfig>): CARVOrchestrator {
  if (!orchestrator) {
    orchestrator = new CARVOrchestrator(config);
  }
  return orchestrator;
}

export function resetOrchestrator(): void {
  if (orchestrator) {
    orchestrator.shutdown();
    orchestrator = null;
  }
}

export default CARVOrchestrator;
