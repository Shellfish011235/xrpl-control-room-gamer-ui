// Genomic Proof Agent
// AI-powered genomic proof generation with CARV cognitive layer
// Wraps DNA Protocol API in OODA loop with PIE-based micropayments
//
// Flow: Request → OODA Evaluate → PIE Generate → $XDNA Pay → Proof Anchor → Verify

import {
  GenomicProofIntent,
  GenerateProofRequest,
  GenomicProof,
  GenomeType,
  GenomicHashAlgorithm,
  DNAProtocolEvent,
  DNAProtocolEventHandler,
  DNAProtocolConfig,
  DEFAULT_DNA_CONFIG,
  DEFAULT_XDNA_RATES,
} from './types';
import { getDNAService, DNAProtocolService } from './dnaProtocolService';
import { getXDNAMetering, XDNAMeteringService } from './xdnaMetering';

// ==================== TYPES ====================

export interface GenomicProofAgentConfig {
  // Cognitive layer
  require_ooda_approval: boolean;
  max_xdna_per_request: string;
  max_xdna_per_day: string;
  
  // Safety checks
  allowed_genome_types: GenomeType[];
  allowed_algorithms: GenomicHashAlgorithm[];
  min_lab_reputation?: number;
  
  // CARV integration
  carv_regime_hash?: string;
  auto_verify_proofs: boolean;
  
  // Network
  xrpl_network: 'mainnet' | 'testnet' | 'devnet';
}

const DEFAULT_AGENT_CONFIG: GenomicProofAgentConfig = {
  require_ooda_approval: true,
  max_xdna_per_request: '10',
  max_xdna_per_day: '1000',
  allowed_genome_types: ['snp_panel', 'exome', 'whole_genome', 'methylation', 'microbiome', 'mitochondrial'],
  allowed_algorithms: ['SHA-256', 'SHA-3-256', 'SHA-3-512'],
  auto_verify_proofs: true,
  xrpl_network: 'mainnet',
};

export interface OODAEvaluation {
  observe: {
    request_valid: boolean;
    hash_format_valid: boolean;
    genome_type_allowed: boolean;
    lab_reputation: number;
    cost_estimate: string;
    balance_sufficient: boolean;
    daily_limit_ok: boolean;
  };
  orient: {
    compliance_risk: 'low' | 'medium' | 'high';
    privacy_risk: 'low' | 'medium' | 'high';
    data_sensitivity: 'low' | 'medium' | 'high';
    recommendation: string;
  };
  decide: {
    approved: boolean;
    reasoning: string;
    risk_score: number; // 0-100
    max_xdna_spend: string;
    requires_human_review: boolean;
  };
}

export interface GenomicProofResult {
  success: boolean;
  intent: GenomicProofIntent;
  proof?: GenomicProof;
  ooda: OODAEvaluation;
  metering: {
    xdna_charged: string;
    xdna_burned: string;
    tx_hash?: string;
  };
  timing: {
    total_ms: number;
    ooda_ms: number;
    payment_ms: number;
    proof_ms: number;
  };
  error?: string;
}

// ==================== GENOMIC PROOF AGENT ====================

class GenomicProofAgent {
  private config: GenomicProofAgentConfig;
  private dnaService: DNAProtocolService;
  private metering: XDNAMeteringService;
  private intents: Map<string, GenomicProofIntent> = new Map();
  private eventHandlers: Set<DNAProtocolEventHandler> = new Set();
  private walletAddress: string | null = null;

  constructor(config: Partial<GenomicProofAgentConfig> = {}) {
    this.config = { ...DEFAULT_AGENT_CONFIG, ...config };
    this.dnaService = getDNAService();
    this.metering = getXDNAMetering();
  }

  // ==================== CONFIGURATION ====================

  setConfig(config: Partial<GenomicProofAgentConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): GenomicProofAgentConfig {
    return { ...this.config };
  }

  setWallet(address: string): void {
    this.walletAddress = address;
    this.metering.setWalletAddress(address);
  }

  // ==================== MAIN FLOW ====================

  /**
   * Generate a genomic proof with full cognitive evaluation
   * This is the main entry point - equivalent to executeAgentPayment in CARV
   */
  async generateProofWithCognition(
    request: GenerateProofRequest,
    options: {
      skip_ooda?: boolean;
      max_spend?: string;
      callback?: (event: DNAProtocolEvent) => void;
    } = {}
  ): Promise<GenomicProofResult> {
    const startTime = Date.now();
    const timing = {
      total_ms: 0,
      ooda_ms: 0,
      payment_ms: 0,
      proof_ms: 0,
    };

    // Create intent
    const intent = this.createIntent(request);
    this.intents.set(intent.intent_id, intent);
    this.emit({ type: 'PROOF_REQUESTED', intent });

    // ========== PHASE 1: OODA EVALUATION ==========
    const oodaStart = Date.now();
    const ooda = await this.evaluateOODA(request, options.max_spend);
    timing.ooda_ms = Date.now() - oodaStart;

    // Update intent with OODA
    intent.ooda = {
      observe: {
        lab_reputation: ooda.observe.lab_reputation,
        genome_type_risk: ooda.orient.data_sensitivity,
        cost_estimate: ooda.observe.cost_estimate,
      },
      orient: {
        compliance_check: ooda.orient.compliance_risk === 'low',
        privacy_verified: ooda.orient.privacy_risk === 'low',
        hash_validated: ooda.observe.hash_format_valid,
      },
      decide: {
        approved: ooda.decide.approved,
        reasoning: ooda.decide.reasoning,
        max_xdna_spend: ooda.decide.max_xdna_spend,
      },
    };

    // Check if OODA approval required and not skipped
    if (this.config.require_ooda_approval && !options.skip_ooda) {
      if (!ooda.decide.approved) {
        intent.status = 'failed';
        intent.error = ooda.decide.reasoning;
        
        timing.total_ms = Date.now() - startTime;
        return {
          success: false,
          intent,
          ooda,
          metering: { xdna_charged: '0', xdna_burned: '0' },
          timing,
          error: ooda.decide.reasoning,
        };
      }

      if (ooda.decide.requires_human_review) {
        intent.status = 'draft';
        timing.total_ms = Date.now() - startTime;
        return {
          success: false,
          intent,
          ooda,
          metering: { xdna_charged: '0', xdna_burned: '0' },
          timing,
          error: 'Requires human review before proceeding',
        };
      }
    }

    intent.status = 'approved';
    this.emit({ type: 'PROOF_APPROVED', intent });

    // ========== PHASE 2: GENERATE PIE ==========
    intent.pie = this.generatePIE(intent, ooda);

    // ========== PHASE 3: EXECUTE $XDNA PAYMENT ==========
    const paymentStart = Date.now();
    intent.status = 'paying';

    const paymentTx = await this.metering.chargeForProof(
      [intent.intent_id],
      'proof_generation'
    );

    timing.payment_ms = Date.now() - paymentStart;

    if (!paymentTx || paymentTx.status !== 'confirmed') {
      intent.status = 'failed';
      intent.error = 'Payment failed - insufficient $XDNA balance';
      
      timing.total_ms = Date.now() - startTime;
      return {
        success: false,
        intent,
        ooda,
        metering: { xdna_charged: '0', xdna_burned: '0' },
        timing,
        error: 'Payment failed',
      };
    }

    this.emit({ 
      type: 'XDNA_PAYMENT_SENT', 
      intent, 
      tx_hash: paymentTx.xrpl_tx_hash || '' 
    });

    // ========== PHASE 4: GENERATE PROOF ==========
    const proofStart = Date.now();
    intent.status = 'generating';

    const proofResponse = await this.dnaService.generateProof(request);
    timing.proof_ms = Date.now() - proofStart;

    if (!proofResponse.success || !proofResponse.proof) {
      intent.status = 'failed';
      intent.error = proofResponse.error?.message || 'Proof generation failed';
      
      this.emit({ 
        type: 'PROOF_FAILED', 
        intent, 
        error: intent.error 
      });

      timing.total_ms = Date.now() - startTime;
      return {
        success: false,
        intent,
        ooda,
        metering: {
          xdna_charged: paymentTx.amount,
          xdna_burned: paymentTx.burn_amount,
          tx_hash: paymentTx.xrpl_tx_hash,
        },
        timing,
        error: intent.error,
      };
    }

    // ========== PHASE 5: SUCCESS ==========
    intent.status = 'completed';
    intent.result = proofResponse.proof;
    intent.completed_at = new Date().toISOString();
    intent.ooda.act = {
      submitted_at: proofResponse.proof.created_at,
      proof_id: proofResponse.proof.proof_id,
      tx_hash: proofResponse.proof.xrpl_tx_hash,
    };

    this.emit({ 
      type: 'PROOF_GENERATED', 
      intent, 
      proof: proofResponse.proof 
    });

    // Auto-verify if configured
    if (this.config.auto_verify_proofs && proofResponse.proof) {
      const verification = await this.dnaService.verifyProof(proofResponse.proof.proof_id);
      this.emit({ 
        type: 'PROOF_VERIFIED', 
        proof_id: proofResponse.proof.proof_id, 
        valid: verification.valid 
      });
    }

    timing.total_ms = Date.now() - startTime;

    console.log(`[GenomicProofAgent] Proof generated in ${timing.total_ms}ms`);
    console.log(`  - OODA: ${timing.ooda_ms}ms`);
    console.log(`  - Payment: ${timing.payment_ms}ms`);
    console.log(`  - Proof: ${timing.proof_ms}ms`);
    console.log(`  - $XDNA charged: ${paymentTx.amount} (burned: ${paymentTx.burn_amount})`);

    return {
      success: true,
      intent,
      proof: proofResponse.proof,
      ooda,
      metering: {
        xdna_charged: paymentTx.amount,
        xdna_burned: paymentTx.burn_amount,
        tx_hash: paymentTx.xrpl_tx_hash,
      },
      timing,
    };
  }

  // ==================== OODA EVALUATION ====================

  /**
   * OODA loop evaluation for genomic proof request
   * Observe → Orient → Decide → Act
   */
  private async evaluateOODA(
    request: GenerateProofRequest,
    maxSpend?: string
  ): Promise<OODAEvaluation> {
    // ===== OBSERVE =====
    const validation = this.dnaService.validateRequest(request);
    const costEstimate = this.metering.calculateProofCost(1);
    const balance = this.metering.getBalance();
    const state = this.metering.getState();
    
    const dailyRemaining = parseFloat(this.config.max_xdna_per_day) - parseFloat(state.daily_spent);

    const observe = {
      request_valid: validation.valid,
      hash_format_valid: validation.errors.filter(e => e.includes('hash')).length === 0,
      genome_type_allowed: this.config.allowed_genome_types.includes(request.genome_type),
      lab_reputation: this.getLabReputation(request.lab_id),
      cost_estimate: costEstimate.gross,
      balance_sufficient: parseFloat(balance) >= parseFloat(costEstimate.gross),
      daily_limit_ok: dailyRemaining >= parseFloat(costEstimate.gross),
    };

    // ===== ORIENT =====
    const complianceRisk = this.assessComplianceRisk(request);
    const privacyRisk = this.assessPrivacyRisk(request);
    const dataSensitivity = this.assessDataSensitivity(request.genome_type);

    const orient = {
      compliance_risk: complianceRisk,
      privacy_risk: privacyRisk,
      data_sensitivity: dataSensitivity,
      recommendation: this.generateRecommendation(observe, complianceRisk, privacyRisk),
    };

    // ===== DECIDE =====
    const riskScore = this.calculateRiskScore(observe, orient);
    const approved = this.shouldApprove(observe, orient, riskScore, maxSpend);
    
    const decide = {
      approved,
      reasoning: this.generateReasoning(observe, orient, approved),
      risk_score: riskScore,
      max_xdna_spend: maxSpend || this.config.max_xdna_per_request,
      requires_human_review: riskScore > 70 || dataSensitivity === 'high',
    };

    return { observe, orient, decide };
  }

  // ==================== OODA HELPERS ====================

  private getLabReputation(labId: string): number {
    // In production, query reputation service
    // For now, return default good reputation
    if (labId.startsWith('accredited_')) return 95;
    if (labId.startsWith('verified_')) return 85;
    return 70; // Unknown labs get baseline
  }

  private assessComplianceRisk(request: GenerateProofRequest): 'low' | 'medium' | 'high' {
    // Check for compliance red flags
    if (!request.lab_id) return 'high';
    if (request.genome_type === 'whole_genome' && !request.metadata?.coverage) return 'medium';
    return 'low';
  }

  private assessPrivacyRisk(request: GenerateProofRequest): 'low' | 'medium' | 'high' {
    // Check metadata for PII leaks
    const metaStr = JSON.stringify(request.metadata || {}).toLowerCase();
    
    // Red flags for PII
    const piiPatterns = ['name', 'email', 'phone', 'address', 'ssn', 'dob', 'birth'];
    for (const pattern of piiPatterns) {
      if (metaStr.includes(pattern)) return 'high';
    }

    // Subject ID should be anonymized
    if (request.subject_id && request.subject_id.length < 10) return 'medium';

    return 'low';
  }

  private assessDataSensitivity(genomeType: GenomeType): 'low' | 'medium' | 'high' {
    const sensitivity: Record<GenomeType, 'low' | 'medium' | 'high'> = {
      'snp_panel': 'medium',
      'exome': 'high',
      'whole_genome': 'high',
      'methylation': 'medium',
      'microbiome': 'low',
      'mitochondrial': 'medium',
    };
    return sensitivity[genomeType] || 'medium';
  }

  private generateRecommendation(
    observe: OODAEvaluation['observe'],
    complianceRisk: string,
    privacyRisk: string
  ): string {
    if (!observe.request_valid) {
      return 'REJECT: Request validation failed';
    }
    if (!observe.balance_sufficient) {
      return 'REJECT: Insufficient $XDNA balance';
    }
    if (privacyRisk === 'high') {
      return 'REVIEW: Potential PII detected in metadata';
    }
    if (observe.lab_reputation < 60) {
      return 'REVIEW: Lab reputation below threshold';
    }
    if (complianceRisk === 'high') {
      return 'REVIEW: Compliance concerns detected';
    }
    return 'APPROVE: Request passes all checks';
  }

  private calculateRiskScore(
    observe: OODAEvaluation['observe'],
    orient: OODAEvaluation['orient']
  ): number {
    let score = 0;

    // Validation issues
    if (!observe.request_valid) score += 40;
    if (!observe.hash_format_valid) score += 20;
    if (!observe.genome_type_allowed) score += 30;

    // Lab reputation (inverse)
    score += Math.max(0, 100 - observe.lab_reputation) * 0.3;

    // Risk factors
    if (orient.compliance_risk === 'high') score += 25;
    else if (orient.compliance_risk === 'medium') score += 10;

    if (orient.privacy_risk === 'high') score += 30;
    else if (orient.privacy_risk === 'medium') score += 15;

    if (orient.data_sensitivity === 'high') score += 15;
    else if (orient.data_sensitivity === 'medium') score += 5;

    return Math.min(100, Math.round(score));
  }

  private shouldApprove(
    observe: OODAEvaluation['observe'],
    orient: OODAEvaluation['orient'],
    riskScore: number,
    maxSpend?: string
  ): boolean {
    // Hard rejections
    if (!observe.request_valid) return false;
    if (!observe.balance_sufficient) return false;
    if (!observe.daily_limit_ok) return false;
    if (!observe.genome_type_allowed) return false;
    if (orient.privacy_risk === 'high') return false;

    // Cost check
    if (maxSpend && parseFloat(observe.cost_estimate) > parseFloat(maxSpend)) {
      return false;
    }

    // Risk threshold
    return riskScore < 50;
  }

  private generateReasoning(
    observe: OODAEvaluation['observe'],
    orient: OODAEvaluation['orient'],
    approved: boolean
  ): string {
    const reasons: string[] = [];

    if (!approved) {
      if (!observe.request_valid) reasons.push('Invalid request format');
      if (!observe.balance_sufficient) reasons.push('Insufficient $XDNA balance');
      if (!observe.daily_limit_ok) reasons.push('Daily spending limit reached');
      if (!observe.genome_type_allowed) reasons.push('Genome type not allowed');
      if (orient.privacy_risk === 'high') reasons.push('Privacy risk too high');
      if (observe.lab_reputation < 60) reasons.push('Lab reputation below threshold');
      
      return `REJECTED: ${reasons.join('; ')}`;
    }

    reasons.push(`Lab reputation: ${observe.lab_reputation}/100`);
    reasons.push(`Cost: ${observe.cost_estimate} XDNA`);
    reasons.push(`Data sensitivity: ${orient.data_sensitivity}`);
    
    return `APPROVED: ${reasons.join(', ')}`;
  }

  // ==================== PIE GENERATION ====================

  private createIntent(request: GenerateProofRequest): GenomicProofIntent {
    const now = new Date().toISOString();
    return {
      intent_id: `GPI-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      request,
      ooda: {
        observe: { cost_estimate: '0' },
        orient: {},
        decide: { approved: false, reasoning: '', max_xdna_spend: '0' },
      },
      status: 'draft',
      created_at: now,
    };
  }

  private generatePIE(intent: GenomicProofIntent, ooda: OODAEvaluation): GenomicProofIntent['pie'] {
    const now = new Date();
    const expiry = new Date(now.getTime() + 5 * 60 * 1000); // 5 min expiry

    return {
      intent_id: `PIE-${intent.intent_id}`,
      payer: this.walletAddress || 'unknown',
      payee: DEFAULT_DNA_CONFIG.treasury_address,
      amount: ooda.observe.cost_estimate,
      asset: 'XDNA',
      burn_amount: this.metering.calculateProofCost(1).burn,
      expiry: expiry.toISOString(),
      proofs: {
        request_hash: this.quickHash(JSON.stringify(intent.request)),
        ooda_hash: this.quickHash(JSON.stringify(ooda)),
        regime_hash: this.config.carv_regime_hash || 'default',
      },
    };
  }

  private quickHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  // ==================== QUICK METHODS ====================

  /**
   * Quick proof generation without OODA (use with caution)
   */
  async quickProof(
    hash: string,
    genomeType: GenomeType = 'snp_panel',
    labId: string = 'unknown_lab'
  ): Promise<GenomicProofResult> {
    const request: GenerateProofRequest = {
      hash,
      genome_type: genomeType,
      algorithm: 'SHA-256',
      lab_id: labId,
      timestamp: new Date().toISOString(),
    };

    return this.generateProofWithCognition(request, { skip_ooda: true });
  }

  /**
   * Verify an existing proof
   */
  async verifyProof(proofId: string): Promise<{
    valid: boolean;
    proof?: GenomicProof;
    error?: string;
  }> {
    const response = await this.dnaService.verifyProof(proofId);
    
    this.emit({ 
      type: 'PROOF_VERIFIED', 
      proof_id: proofId, 
      valid: response.valid 
    });

    return {
      valid: response.valid,
      proof: response.proof,
      error: response.error?.message,
    };
  }

  // ==================== STATE ====================

  getIntent(intentId: string): GenomicProofIntent | undefined {
    return this.intents.get(intentId);
  }

  getAllIntents(): GenomicProofIntent[] {
    return Array.from(this.intents.values());
  }

  getRecentIntents(limit: number = 20): GenomicProofIntent[] {
    return Array.from(this.intents.values())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  // ==================== EVENTS ====================

  subscribe(handler: DNAProtocolEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  private emit(event: DNAProtocolEvent): void {
    this.eventHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (e) {
        console.error('[GenomicProofAgent] Event handler error:', e);
      }
    });
  }

  // ==================== STATISTICS ====================

  getStats(): {
    total_intents: number;
    successful: number;
    failed: number;
    pending: number;
    total_xdna_spent: string;
    avg_ooda_time_ms: number;
  } {
    const intents = Array.from(this.intents.values());
    const meteringStats = this.metering.getStats();

    return {
      total_intents: intents.length,
      successful: intents.filter(i => i.status === 'completed').length,
      failed: intents.filter(i => i.status === 'failed').length,
      pending: intents.filter(i => ['draft', 'approved', 'paying', 'generating'].includes(i.status)).length,
      total_xdna_spent: meteringStats.total_spent,
      avg_ooda_time_ms: 50, // Placeholder
    };
  }
}

// ==================== SINGLETON ====================

let proofAgent: GenomicProofAgent | null = null;

export function getGenomicProofAgent(config?: Partial<GenomicProofAgentConfig>): GenomicProofAgent {
  if (!proofAgent) {
    proofAgent = new GenomicProofAgent(config);
  } else if (config) {
    proofAgent.setConfig(config);
  }
  return proofAgent;
}

export function resetGenomicProofAgent(): void {
  proofAgent = null;
}

export { GenomicProofAgent };
export default GenomicProofAgent;
