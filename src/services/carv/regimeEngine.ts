// CARV - Regime Engine
// Parses, enforces, and manages trading/payment rules

import { PaymentIntentEnvelope, ValidationResult, ValidationErrorCode } from './types';

// ==================== TYPES ====================

export interface RegimeRule {
  id: string;
  name: string;
  type: RuleType;
  enabled: boolean;
  priority: number; // Lower = checked first
  condition: RuleCondition;
  action: RuleAction;
  metadata?: Record<string, any>;
}

export type RuleType = 
  | 'limit'        // Amount limits
  | 'allowlist'    // Allowed recipients/assets
  | 'blocklist'    // Blocked recipients/assets
  | 'time'         // Time-based restrictions
  | 'frequency'    // Rate limiting
  | 'risk'         // Risk-based rules
  | 'custom';      // Custom logic

export interface RuleCondition {
  field: string;           // What to check (amount, payee, asset, time, etc.)
  operator: ConditionOperator;
  value: any;              // Value to compare against
  context?: string;        // Additional context field
}

export type ConditionOperator = 
  | 'eq' | 'neq'           // Equal / Not equal
  | 'gt' | 'gte'           // Greater than
  | 'lt' | 'lte'           // Less than
  | 'in' | 'not_in'        // In array
  | 'contains'             // String contains
  | 'matches'              // Regex match
  | 'between';             // Range

export interface RuleAction {
  type: 'block' | 'warn' | 'flag' | 'modify' | 'allow';
  message: string;
  data?: Record<string, any>;
}

export interface RegimeConfig {
  name: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  rules: RegimeRule[];
  defaults: {
    dailyLimit: number;
    perTransactionLimit: number;
    allowedAssets: string[];
    allowedVenues: string[];
  };
}

export interface RegimeValidation {
  passed: boolean;
  ruleResults: Array<{
    rule: RegimeRule;
    passed: boolean;
    message?: string;
  }>;
  warnings: string[];
  blockedBy?: RegimeRule;
  riskScore: number; // 0-100
}

export interface RegimeState {
  currentRegime: RegimeConfig;
  history: Array<{
    timestamp: string;
    action: string;
    details: any;
  }>;
  statistics: {
    totalChecks: number;
    passed: number;
    blocked: number;
    warned: number;
  };
}

// ==================== PRESET REGIMES ====================

export const PRESET_REGIMES: Record<string, RegimeConfig> = {
  conservative: {
    name: 'Conservative',
    description: 'Low-risk, small amounts, strict controls. Best for learning.',
    riskLevel: 'low',
    defaults: {
      dailyLimit: 10,
      perTransactionLimit: 1,
      allowedAssets: ['XRP'],
      allowedVenues: ['simulation', 'xrpl'],
    },
    rules: [
      {
        id: 'max-single',
        name: 'Per-Transaction Limit',
        type: 'limit',
        enabled: true,
        priority: 1,
        condition: { field: 'amount', operator: 'gt', value: 1 },
        action: { type: 'block', message: 'Transaction exceeds conservative limit of 1 XRP' },
      },
      {
        id: 'daily-limit',
        name: 'Daily Volume Limit',
        type: 'limit',
        enabled: true,
        priority: 2,
        condition: { field: 'daily_total', operator: 'gt', value: 10 },
        action: { type: 'block', message: 'Daily limit of 10 XRP exceeded' },
      },
      {
        id: 'xrp-only',
        name: 'XRP Only',
        type: 'allowlist',
        enabled: true,
        priority: 3,
        condition: { field: 'asset', operator: 'not_in', value: ['XRP'] },
        action: { type: 'block', message: 'Only XRP is allowed in conservative mode' },
      },
      {
        id: 'no-unknown-recipients',
        name: 'Known Recipients Only',
        type: 'blocklist',
        enabled: false, // Disabled by default
        priority: 4,
        condition: { field: 'payee', operator: 'not_in', value: [], context: 'known_recipients' },
        action: { type: 'warn', message: 'Recipient not in known list' },
      },
    ],
  },

  moderate: {
    name: 'Moderate',
    description: 'Balanced risk/reward. Good for regular use.',
    riskLevel: 'medium',
    defaults: {
      dailyLimit: 100,
      perTransactionLimit: 25,
      allowedAssets: ['XRP', 'USD', 'EUR'],
      allowedVenues: ['xrpl', 'ilp', 'simulation'],
    },
    rules: [
      {
        id: 'max-single',
        name: 'Per-Transaction Limit',
        type: 'limit',
        enabled: true,
        priority: 1,
        condition: { field: 'amount', operator: 'gt', value: 25 },
        action: { type: 'block', message: 'Transaction exceeds moderate limit of 25 XRP' },
      },
      {
        id: 'daily-limit',
        name: 'Daily Volume Limit',
        type: 'limit',
        enabled: true,
        priority: 2,
        condition: { field: 'daily_total', operator: 'gt', value: 100 },
        action: { type: 'block', message: 'Daily limit of 100 XRP exceeded' },
      },
      {
        id: 'allowed-assets',
        name: 'Allowed Assets',
        type: 'allowlist',
        enabled: true,
        priority: 3,
        condition: { field: 'asset', operator: 'not_in', value: ['XRP', 'USD', 'EUR'] },
        action: { type: 'block', message: 'Asset not in allowed list' },
      },
      {
        id: 'large-tx-warning',
        name: 'Large Transaction Warning',
        type: 'risk',
        enabled: true,
        priority: 10,
        condition: { field: 'amount', operator: 'gt', value: 10 },
        action: { type: 'warn', message: 'Large transaction - please confirm' },
      },
    ],
  },

  aggressive: {
    name: 'Aggressive',
    description: 'Higher limits, more flexibility. For experienced users.',
    riskLevel: 'high',
    defaults: {
      dailyLimit: 1000,
      perTransactionLimit: 500,
      allowedAssets: ['XRP', 'USD', 'EUR', 'BTC', 'ETH'],
      allowedVenues: ['xrpl', 'ilp', 'open_payments', 'simulation'],
    },
    rules: [
      {
        id: 'max-single',
        name: 'Per-Transaction Limit',
        type: 'limit',
        enabled: true,
        priority: 1,
        condition: { field: 'amount', operator: 'gt', value: 500 },
        action: { type: 'block', message: 'Transaction exceeds aggressive limit of 500' },
      },
      {
        id: 'daily-limit',
        name: 'Daily Volume Limit',
        type: 'limit',
        enabled: true,
        priority: 2,
        condition: { field: 'daily_total', operator: 'gt', value: 1000 },
        action: { type: 'block', message: 'Daily limit of 1000 exceeded' },
      },
      {
        id: 'extreme-warning',
        name: 'Extreme Amount Warning',
        type: 'risk',
        enabled: true,
        priority: 10,
        condition: { field: 'amount', operator: 'gt', value: 100 },
        action: { type: 'warn', message: 'High-value transaction - double-check before proceeding' },
      },
    ],
  },

  custom: {
    name: 'Custom',
    description: 'Define your own rules',
    riskLevel: 'medium',
    defaults: {
      dailyLimit: 50,
      perTransactionLimit: 10,
      allowedAssets: ['XRP'],
      allowedVenues: ['xrpl', 'simulation'],
    },
    rules: [],
  },
};

// ==================== REGIME ENGINE CLASS ====================

export class RegimeEngine {
  private config: RegimeConfig;
  private state: RegimeState;
  private dailyVolume: Map<string, number> = new Map(); // date -> total
  private transactionCount: Map<string, number> = new Map(); // date -> count
  private knownRecipients: Set<string> = new Set();

  constructor(preset: keyof typeof PRESET_REGIMES = 'conservative') {
    this.config = { ...PRESET_REGIMES[preset] };
    this.state = {
      currentRegime: this.config,
      history: [],
      statistics: {
        totalChecks: 0,
        passed: 0,
        blocked: 0,
        warned: 0,
      },
    };
  }

  // ==================== CONFIGURATION ====================

  /**
   * Load a preset regime
   */
  loadPreset(preset: keyof typeof PRESET_REGIMES): void {
    this.config = { ...PRESET_REGIMES[preset] };
    this.state.currentRegime = this.config;
    this.logAction('regime_changed', { preset });
  }

  /**
   * Load custom regime configuration
   */
  loadCustomConfig(config: Partial<RegimeConfig>): void {
    this.config = { ...this.config, ...config };
    this.state.currentRegime = this.config;
    this.logAction('regime_customized', config);
  }

  /**
   * Add a custom rule
   */
  addRule(rule: RegimeRule): void {
    // Check for duplicate ID
    const existingIndex = this.config.rules.findIndex(r => r.id === rule.id);
    if (existingIndex >= 0) {
      this.config.rules[existingIndex] = rule;
    } else {
      this.config.rules.push(rule);
    }
    this.config.rules.sort((a, b) => a.priority - b.priority);
    this.logAction('rule_added', rule);
  }

  /**
   * Remove a rule
   */
  removeRule(ruleId: string): void {
    this.config.rules = this.config.rules.filter(r => r.id !== ruleId);
    this.logAction('rule_removed', { ruleId });
  }

  /**
   * Enable/disable a rule
   */
  setRuleEnabled(ruleId: string, enabled: boolean): void {
    const rule = this.config.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
      this.logAction('rule_toggled', { ruleId, enabled });
    }
  }

  /**
   * Add known recipient
   */
  addKnownRecipient(address: string): void {
    this.knownRecipients.add(address);
  }

  // ==================== VALIDATION ====================

  /**
   * Validate a PIE against current regime
   */
  validate(pie: PaymentIntentEnvelope): RegimeValidation {
    this.state.statistics.totalChecks++;
    
    const amount = parseFloat(pie.amount);
    const today = new Date().toISOString().split('T')[0];
    const currentDailyTotal = this.dailyVolume.get(today) || 0;

    // Build context for evaluation
    const context = {
      amount,
      asset: pie.asset,
      payee: pie.payee,
      payer: pie.payer,
      daily_total: currentDailyTotal + amount,
      transaction_count: this.transactionCount.get(today) || 0,
      hour: new Date().getHours(),
      day_of_week: new Date().getDay(),
      known_recipients: this.knownRecipients,
    };

    // Evaluate all enabled rules
    const ruleResults: RegimeValidation['ruleResults'] = [];
    const warnings: string[] = [];
    let blockedBy: RegimeRule | undefined;
    let riskScore = 0;

    for (const rule of this.config.rules) {
      if (!rule.enabled) continue;

      const result = this.evaluateRule(rule, context);
      ruleResults.push({
        rule,
        passed: result.passed,
        message: result.message,
      });

      if (!result.passed) {
        if (rule.action.type === 'block') {
          blockedBy = rule;
          this.state.statistics.blocked++;
          break; // Stop on first block
        } else if (rule.action.type === 'warn') {
          warnings.push(result.message || rule.action.message);
          this.state.statistics.warned++;
        } else if (rule.action.type === 'flag') {
          riskScore += 20; // Flags increase risk score
        }
      }
    }

    // Calculate risk score based on amount relative to limits
    riskScore += Math.min(50, (amount / this.config.defaults.perTransactionLimit) * 30);
    riskScore += Math.min(30, ((currentDailyTotal + amount) / this.config.defaults.dailyLimit) * 20);

    const passed = !blockedBy;
    if (passed) {
      this.state.statistics.passed++;
    }

    const validation: RegimeValidation = {
      passed,
      ruleResults,
      warnings,
      blockedBy,
      riskScore: Math.min(100, Math.round(riskScore)),
    };

    this.logAction('validation', { pie: pie.intent_id, result: validation });

    return validation;
  }

  /**
   * Record a successful transaction (updates daily totals)
   */
  recordTransaction(pie: PaymentIntentEnvelope): void {
    const amount = parseFloat(pie.amount);
    const today = new Date().toISOString().split('T')[0];
    
    this.dailyVolume.set(today, (this.dailyVolume.get(today) || 0) + amount);
    this.transactionCount.set(today, (this.transactionCount.get(today) || 0) + 1);
    
    this.logAction('transaction_recorded', { intent_id: pie.intent_id, amount });
  }

  /**
   * Convert regime validation to CARV ValidationResult
   */
  toValidationResult(regimeValidation: RegimeValidation): ValidationResult {
    if (regimeValidation.passed) {
      return {
        valid: true,
        reason: regimeValidation.warnings.length > 0
          ? `Approved with warnings: ${regimeValidation.warnings.join('; ')}`
          : 'Approved by regime engine',
        code: 'OK',
        timestamp: new Date().toISOString(),
      };
    }

    // Map to validation error code
    let code: ValidationErrorCode = 'DIVERGENCE_ALERT';
    
    if (regimeValidation.blockedBy) {
      switch (regimeValidation.blockedBy.type) {
        case 'limit':
          code = regimeValidation.blockedBy.condition.field === 'daily_total'
            ? 'DAILY_VOLUME_CAP'
            : 'INVALID_AMOUNT';
          break;
        case 'allowlist':
        case 'blocklist':
          code = 'CONCENTRATION_LIMIT';
          break;
        default:
          code = 'DIVERGENCE_ALERT';
      }
    }

    return {
      valid: false,
      reason: regimeValidation.blockedBy?.action.message || 'Blocked by regime rules',
      code,
      timestamp: new Date().toISOString(),
    };
  }

  // ==================== RULE EVALUATION ====================

  private evaluateRule(
    rule: RegimeRule, 
    context: Record<string, any>
  ): { passed: boolean; message?: string } {
    const { condition, action } = rule;
    const fieldValue = context[condition.field];
    
    let conditionMet = false;

    switch (condition.operator) {
      case 'eq':
        conditionMet = fieldValue === condition.value;
        break;
      case 'neq':
        conditionMet = fieldValue !== condition.value;
        break;
      case 'gt':
        conditionMet = fieldValue > condition.value;
        break;
      case 'gte':
        conditionMet = fieldValue >= condition.value;
        break;
      case 'lt':
        conditionMet = fieldValue < condition.value;
        break;
      case 'lte':
        conditionMet = fieldValue <= condition.value;
        break;
      case 'in':
        conditionMet = Array.isArray(condition.value) && condition.value.includes(fieldValue);
        break;
      case 'not_in':
        conditionMet = Array.isArray(condition.value) && !condition.value.includes(fieldValue);
        break;
      case 'contains':
        conditionMet = String(fieldValue).includes(String(condition.value));
        break;
      case 'matches':
        conditionMet = new RegExp(condition.value).test(String(fieldValue));
        break;
      case 'between':
        if (Array.isArray(condition.value) && condition.value.length === 2) {
          conditionMet = fieldValue >= condition.value[0] && fieldValue <= condition.value[1];
        }
        break;
    }

    // For 'block' rules, condition being met = rule violation = not passed
    // For 'allow' rules, condition being met = passed
    if (action.type === 'allow') {
      return { 
        passed: conditionMet, 
        message: conditionMet ? undefined : action.message 
      };
    }

    return { 
      passed: !conditionMet, 
      message: conditionMet ? action.message : undefined 
    };
  }

  // ==================== STATE MANAGEMENT ====================

  /**
   * Get current configuration
   */
  getConfig(): RegimeConfig {
    return { ...this.config };
  }

  /**
   * Get current state
   */
  getState(): RegimeState {
    return { ...this.state };
  }

  /**
   * Get daily statistics
   */
  getDailyStats(date?: string): { volume: number; count: number; remaining: number } {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const volume = this.dailyVolume.get(targetDate) || 0;
    const count = this.transactionCount.get(targetDate) || 0;
    
    return {
      volume,
      count,
      remaining: Math.max(0, this.config.defaults.dailyLimit - volume),
    };
  }

  /**
   * Generate regime summary for LLM context
   */
  generateSummary(): string {
    const stats = this.getDailyStats();
    
    return `
REGIME: ${this.config.name} (${this.config.riskLevel} risk)
${this.config.description}

LIMITS:
- Daily limit: ${this.config.defaults.dailyLimit} (${stats.remaining.toFixed(2)} remaining today)
- Per-transaction limit: ${this.config.defaults.perTransactionLimit}
- Allowed assets: ${this.config.defaults.allowedAssets.join(', ')}
- Allowed venues: ${this.config.defaults.allowedVenues.join(', ')}

ACTIVE RULES:
${this.config.rules
  .filter(r => r.enabled)
  .map(r => `- ${r.name}: ${r.action.message}`)
  .join('\n')}

TODAY'S ACTIVITY:
- Transactions: ${stats.count}
- Volume: ${stats.volume.toFixed(4)}
    `.trim();
  }

  /**
   * Generate hash of current regime for PIE
   */
  generateRegimeHash(): string {
    const content = JSON.stringify({
      name: this.config.name,
      riskLevel: this.config.riskLevel,
      rules: this.config.rules.map(r => r.id),
      defaults: this.config.defaults,
    });

    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
  }

  // ==================== HELPERS ====================

  private logAction(action: string, details: any): void {
    this.state.history.push({
      timestamp: new Date().toISOString(),
      action,
      details,
    });

    // Keep history limited
    if (this.state.history.length > 1000) {
      this.state.history = this.state.history.slice(-500);
    }
  }

  /**
   * Reset daily counters (call at midnight)
   */
  resetDailyCounters(): void {
    const today = new Date().toISOString().split('T')[0];
    // Keep only today's data
    const todayVolume = this.dailyVolume.get(today);
    const todayCount = this.transactionCount.get(today);
    
    this.dailyVolume.clear();
    this.transactionCount.clear();
    
    if (todayVolume) this.dailyVolume.set(today, todayVolume);
    if (todayCount) this.transactionCount.set(today, todayCount);
  }
}

// ==================== SINGLETON ====================

let regimeEngine: RegimeEngine | null = null;

export function getRegimeEngine(preset?: keyof typeof PRESET_REGIMES): RegimeEngine {
  if (!regimeEngine) {
    regimeEngine = new RegimeEngine(preset);
  }
  return regimeEngine;
}

export function resetRegimeEngine(): void {
  regimeEngine = null;
}

export default RegimeEngine;
