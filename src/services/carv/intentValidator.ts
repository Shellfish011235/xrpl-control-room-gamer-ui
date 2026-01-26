// CARV - Intent Validator
// Single + Aggregate validation with safety checks

import {
  PaymentIntentEnvelope,
  ValidationResult,
  ValidationErrorCode,
  AggregateValidationState,
  RejectionLog,
  CARVEvent,
  CARVEventHandler,
} from './types';

// ==================== VALIDATION CONFIG ====================

export interface ValidatorConfig {
  test_mode: boolean;
  daily_volume_cap: number;        // Max daily volume in asset units
  max_single_amount: number;       // Max single transaction
  concentration_limit: number;     // Max % to single payee (0-100)
  divergence_threshold: number;    // Max deviation from recent average
  rejection_streak_threshold: number;  // Alert after N rejections
  allowed_assets: string[];
  self_loop_allowed_in_test: boolean;
}

const DEFAULT_CONFIG: ValidatorConfig = {
  test_mode: true,
  daily_volume_cap: 5.0,           // 5 XRP default cap
  max_single_amount: 1.0,          // 1 XRP max single
  concentration_limit: 50,         // 50% max to one payee
  divergence_threshold: 3.0,       // 3x recent average
  rejection_streak_threshold: 5,   // Alert after 5 rejections
  allowed_assets: ['XRP', 'USD', 'EUR'],
  self_loop_allowed_in_test: true,
};

// ==================== INTENT VALIDATOR CLASS ====================

export class IntentValidator {
  private config: ValidatorConfig;
  private state: AggregateValidationState;
  private eventHandlers: Set<CARVEventHandler> = new Set();

  constructor(config: Partial<ValidatorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = this.initializeState();
  }

  private initializeState(): AggregateValidationState {
    return {
      daily_volume: 0,
      daily_date: new Date().toISOString().split('T')[0],
      recent_pies: [],
      rejections: [],
      concentration: new Map(),
    };
  }

  // ==================== SINGLE VALIDATION ====================

  /**
   * Validate a single PIE
   */
  validateSingle(pie: PaymentIntentEnvelope): ValidationResult {
    const timestamp = new Date().toISOString();

    // Reset daily counters if new day
    this.checkDayRollover();

    // Check 1: Valid amount
    const amount = parseFloat(pie.amount);
    if (isNaN(amount) || amount <= 0) {
      return this.reject(pie, 'INVALID_AMOUNT', 'Amount must be positive number');
    }

    if (amount > this.config.max_single_amount) {
      return this.reject(pie, 'INVALID_AMOUNT', 
        `Amount ${amount} exceeds max ${this.config.max_single_amount}`);
    }

    // Check 2: Regime anchor present
    if (!pie.proofs.regime_summary_hash || pie.proofs.regime_summary_hash === '0xnone') {
      return this.reject(pie, 'MISSING_REGIME_ANCHOR', 
        'Regime summary hash required for salience anchoring');
    }

    // Check 3: Self-loop check
    if (pie.payer === pie.payee) {
      if (this.config.test_mode && this.config.self_loop_allowed_in_test) {
        console.log('[Validator] TEST MODE: Self-loop permitted');
      } else {
        return this.reject(pie, 'SELF_LOOP_FORBIDDEN', 
          'Payer cannot equal payee in live mode');
      }
    }

    // Check 4: Valid asset
    if (!this.config.allowed_assets.includes(pie.asset)) {
      return this.reject(pie, 'INVALID_ASSET', 
        `Asset ${pie.asset} not in allowed list`);
    }

    // Check 5: Not expired
    if (new Date(pie.expiry) < new Date()) {
      return this.reject(pie, 'EXPIRED', 'PIE has expired');
    }

    // Passed single validation
    return {
      valid: true,
      reason: 'Single validation passed',
      code: 'OK',
      timestamp,
    };
  }

  // ==================== AGGREGATE VALIDATION ====================

  /**
   * Validate against aggregate state (volume caps, concentration, etc.)
   */
  validateAggregate(pies: PaymentIntentEnvelope[]): ValidationResult {
    const timestamp = new Date().toISOString();
    this.checkDayRollover();

    // Calculate batch volume
    const batchVolume = pies.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    // Check 1: Daily volume cap
    if (this.state.daily_volume + batchVolume > this.config.daily_volume_cap) {
      return this.reject(pies[0], 'DAILY_VOLUME_CAP', 
        `Batch volume ${batchVolume.toFixed(4)} would exceed daily cap. ` +
        `Current: ${this.state.daily_volume.toFixed(4)}, Cap: ${this.config.daily_volume_cap}`);
    }

    // Check 2: Concentration limit
    const payeeVolumes = new Map<string, number>();
    for (const pie of pies) {
      const current = payeeVolumes.get(pie.payee) || 0;
      payeeVolumes.set(pie.payee, current + parseFloat(pie.amount));
    }

    for (const [payee, volume] of payeeVolumes) {
      const existingConcentration = this.state.concentration.get(payee) || 0;
      const totalToPayee = existingConcentration + volume;
      const totalVolume = this.state.daily_volume + batchVolume;
      const concentrationPercent = totalVolume > 0 
        ? (totalToPayee / totalVolume) * 100 
        : 0;

      if (concentrationPercent > this.config.concentration_limit) {
        return this.reject(pies[0], 'CONCENTRATION_LIMIT', 
          `Concentration to ${payee} (${concentrationPercent.toFixed(1)}%) exceeds limit`);
      }
    }

    // Check 3: Divergence from recent average
    if (this.state.recent_pies.length >= 5) {
      const recentAvg = this.state.recent_pies
        .slice(-10)
        .reduce((sum, p) => sum + parseFloat(p.amount), 0) / Math.min(10, this.state.recent_pies.length);
      
      const avgBatchAmount = batchVolume / pies.length;
      
      if (recentAvg > 0 && avgBatchAmount > recentAvg * this.config.divergence_threshold) {
        return this.reject(pies[0], 'DIVERGENCE_ALERT', 
          `Batch average ${avgBatchAmount.toFixed(4)} diverges ${this.config.divergence_threshold}x from recent ${recentAvg.toFixed(4)}`);
      }
    }

    // Check 4: Rejection streak
    const recentRejections = this.state.rejections.filter(r => {
      const rejTime = new Date(r.timestamp).getTime();
      const hourAgo = Date.now() - 60 * 60 * 1000;
      return rejTime > hourAgo;
    });

    if (recentRejections.length >= this.config.rejection_streak_threshold) {
      this.emitEvent({
        type: 'ESCALATION_ALERT',
        reason: 'Rejection streak threshold exceeded',
        data: { count: recentRejections.length, threshold: this.config.rejection_streak_threshold },
      });
    }

    // Passed aggregate validation - update state
    this.state.daily_volume += batchVolume;
    for (const pie of pies) {
      this.state.recent_pies.push(pie);
      const existing = this.state.concentration.get(pie.payee) || 0;
      this.state.concentration.set(pie.payee, existing + parseFloat(pie.amount));
    }

    // Trim recent PIEs to last 100
    if (this.state.recent_pies.length > 100) {
      this.state.recent_pies = this.state.recent_pies.slice(-100);
    }

    return {
      valid: true,
      reason: 'Aggregate validation passed',
      code: 'OK',
      timestamp,
    };
  }

  /**
   * Full validation: single + aggregate
   */
  validateFull(pies: PaymentIntentEnvelope[]): ValidationResult {
    // First validate each PIE individually
    for (const pie of pies) {
      const singleResult = this.validateSingle(pie);
      if (!singleResult.valid) {
        return singleResult;
      }
    }

    // Then validate aggregate
    return this.validateAggregate(pies);
  }

  // ==================== HELPERS ====================

  private reject(
    pie: PaymentIntentEnvelope, 
    code: ValidationErrorCode, 
    reason: string
  ): ValidationResult {
    const timestamp = new Date().toISOString();
    
    const rejection: RejectionLog = {
      timestamp,
      intent_id: pie.intent_id,
      reason,
      code,
    };
    
    this.state.rejections.push(rejection);
    
    // Trim rejections to last 100
    if (this.state.rejections.length > 100) {
      this.state.rejections = this.state.rejections.slice(-100);
    }

    this.emitEvent({
      type: 'PIE_REJECTED',
      pie,
      result: { valid: false, reason, code, timestamp },
    });

    return { valid: false, reason, code, timestamp };
  }

  private checkDayRollover(): void {
    const today = new Date().toISOString().split('T')[0];
    if (this.state.daily_date !== today) {
      console.log('[Validator] Day rollover - resetting daily counters');
      this.state.daily_volume = 0;
      this.state.daily_date = today;
      this.state.concentration.clear();
    }
  }

  // ==================== STATE MANAGEMENT ====================

  getState(): AggregateValidationState {
    return { ...this.state };
  }

  getConfig(): ValidatorConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<ValidatorConfig>): void {
    this.config = { ...this.config, ...updates };
    
    if (updates.test_mode !== undefined) {
      this.emitEvent({
        type: 'MODE_CHANGED',
        mode: updates.test_mode ? 'test' : 'live',
      });
    }
  }

  resetState(): void {
    this.state = this.initializeState();
  }

  getRejections(): RejectionLog[] {
    return [...this.state.rejections];
  }

  getDailyStats(): { volume: number; cap: number; remaining: number; utilization: number } {
    return {
      volume: this.state.daily_volume,
      cap: this.config.daily_volume_cap,
      remaining: this.config.daily_volume_cap - this.state.daily_volume,
      utilization: (this.state.daily_volume / this.config.daily_volume_cap) * 100,
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
        console.error('[Validator] Event handler error:', e);
      }
    });
  }
}

// ==================== SINGLETON INSTANCE ====================

let validatorInstance: IntentValidator | null = null;

export function getValidator(config?: Partial<ValidatorConfig>): IntentValidator {
  if (!validatorInstance) {
    validatorInstance = new IntentValidator(config);
  } else if (config) {
    validatorInstance.updateConfig(config);
  }
  return validatorInstance;
}

export function resetValidator(): void {
  validatorInstance = null;
}

export default IntentValidator;
