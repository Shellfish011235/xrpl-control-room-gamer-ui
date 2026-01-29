// Secure Payment Agent
// AI-powered payment system with full security layers
// - Spending limits
// - Transaction preview (two-step confirmation)
// - Audit logging
// - Xaman wallet integration
// - DEX pathfinding for currency conversion

import { xamanService, SigningRequest, PaymentDetails, TradeDetails } from './xaman';
import { XRPLDex, TradeQuote, Currency, CurrencyAmount, KNOWN_STABLECOINS } from './xrplDex';
import { getAccountInfo, getAccountLines, dropsToXRP } from './xrplService';

// ==================== TYPES ====================

export interface SecurityConfig {
  dailyLimit: number;          // Max XRP equivalent per day
  singleTxLimit: number;       // Max per transaction
  requireConfirmation: boolean; // Always require user confirmation
  whitelistOnly: boolean;      // Only allow whitelisted addresses
  whitelist: string[];         // Whitelisted addresses
  cooldownSeconds: number;     // Time between transactions
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  action: 'payment_requested' | 'payment_confirmed' | 'payment_signed' | 'payment_rejected' | 
          'trade_requested' | 'trade_confirmed' | 'trade_signed' | 'trade_rejected' |
          'limit_exceeded' | 'whitelist_blocked' | 'cooldown_blocked' | 'error';
  details: Record<string, unknown>;
  status: 'success' | 'failed' | 'pending';
  txHash?: string;
}

export interface PaymentPlan {
  id: string;
  type: 'direct_payment' | 'cross_currency_payment' | 'dex_trade';
  status: 'draft' | 'confirmed' | 'signing' | 'completed' | 'failed' | 'cancelled';
  
  // What the user wants
  intent: {
    description: string;     // Natural language: "Pay $50 to Verizon"
    destination?: string;    // Destination address
    destinationName?: string; // Human readable name
    targetAmount: string;    // What they want to pay/receive
    targetCurrency: string;  // Currency they're paying in
  };
  
  // What we'll actually do
  plan: {
    steps: PaymentStep[];
    totalCost: string;       // Total cost in source currency (usually XRP)
    fees: {
      network: string;
      dex: string;
      total: string;
    };
    estimatedTime: string;   // "~5 seconds"
    risks: string[];         // Any warnings
  };
  
  // Execution status
  execution?: {
    startedAt: Date;
    completedAt?: Date;
    signingRequest?: SigningRequest;
    txHash?: string;
    actualCost?: string;
    error?: string;
  };
  
  createdAt: Date;
  expiresAt: Date;
}

export interface PaymentStep {
  order: number;
  type: 'trade' | 'payment' | 'trustset';
  description: string;
  from: { amount: string; currency: string; issuer?: string };
  to: { amount: string; currency: string; issuer?: string; address?: string };
  quote?: TradeQuote;
}

export interface WalletState {
  address: string;
  xrpBalance: number;
  tokens: Array<{ currency: string; issuer: string; balance: number }>;
  canPay: (amount: number, currency: string, issuer?: string) => boolean;
}

// ==================== SECURE PAYMENT AGENT ====================

class SecurePaymentAgent {
  private config: SecurityConfig;
  private auditLog: AuditLogEntry[] = [];
  private dailySpent: number = 0;
  private lastTxTime: Date | null = null;
  private pendingPlans: Map<string, PaymentPlan> = new Map();
  private walletState: WalletState | null = null;
  
  // Known payees for quick lookup
  private knownPayees: Map<string, { address: string; currency: string; issuer?: string; name: string }> = new Map();

  constructor() {
    // Default conservative config
    this.config = {
      dailyLimit: 100,           // 100 XRP/day
      singleTxLimit: 25,         // 25 XRP max per tx
      requireConfirmation: true,
      whitelistOnly: false,
      whitelist: [],
      cooldownSeconds: 5,
    };

    // Load audit log from localStorage
    this.loadAuditLog();
    this.loadDailySpent();
    
    // Initialize known payees (could be loaded from a service)
    this.initializeKnownPayees();
  }

  // ==================== CONFIGURATION ====================

  setConfig(config: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...config };
    this.log('config_updated', { config: this.config }, 'success');
  }

  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  // ==================== WALLET INTEGRATION ====================

  async connectWallet(address: string): Promise<WalletState> {
    try {
      // Connect to Xaman service
      await xamanService.connect(address);
      
      // Fetch wallet data
      const [accountInfo, trustlines] = await Promise.all([
        getAccountInfo(address),
        getAccountLines(address),
      ]);

      this.walletState = {
        address,
        xrpBalance: accountInfo.balance,
        tokens: trustlines.map(t => ({
          currency: t.currency,
          issuer: t.issuer,
          balance: t.balance,
        })),
        canPay: (amount: number, currency: string, issuer?: string) => {
          if (currency === 'XRP') {
            // Keep 10 XRP reserve
            return this.walletState!.xrpBalance - 10 >= amount;
          }
          const token = this.walletState!.tokens.find(
            t => t.currency === currency && t.issuer === issuer
          );
          return token ? token.balance >= amount : false;
        },
      };

      this.log('wallet_connected', { address, balance: accountInfo.balance }, 'success');
      return this.walletState;
    } catch (error) {
      this.log('wallet_connect_failed', { address, error: String(error) }, 'failed');
      throw error;
    }
  }

  getWalletState(): WalletState | null {
    return this.walletState;
  }

  async refreshWallet(): Promise<WalletState | null> {
    if (!this.walletState) return null;
    return this.connectWallet(this.walletState.address);
  }

  // ==================== PAYMENT PLAN CREATION ====================

  /**
   * Create a payment plan from natural language
   * Example: "Pay $50 to Verizon" or "Send 100 XRP to rABC123"
   */
  async createPaymentPlan(intent: string): Promise<PaymentPlan> {
    if (!this.walletState) {
      throw new Error('Wallet not connected. Please connect your Xaman wallet first.');
    }

    // Parse the intent
    const parsed = this.parsePaymentIntent(intent);
    
    // Security checks
    await this.performSecurityChecks(parsed);

    // Build the payment plan
    const plan = await this.buildPaymentPlan(parsed);
    
    // Store and return
    this.pendingPlans.set(plan.id, plan);
    this.log('payment_requested', { planId: plan.id, intent }, 'pending');
    
    return plan;
  }

  /**
   * Parse natural language payment intent
   */
  private parsePaymentIntent(intent: string): {
    destination?: string;
    destinationName?: string;
    amount: number;
    currency: string;
    issuer?: string;
    memo?: string;
  } {
    const lower = intent.toLowerCase();
    
    // Extract amount and currency
    // Patterns: "$50", "50 USD", "100 XRP", "€25", "25 EUR"
    let amount = 0;
    let currency = 'XRP';
    let issuer: string | undefined;

    // Check for USD amounts ($50, 50 USD, 50 dollars)
    const usdMatch = intent.match(/\$\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:USD|dollars?)/i);
    if (usdMatch) {
      amount = parseFloat(usdMatch[1] || usdMatch[2]);
      currency = 'USD';
      issuer = KNOWN_STABLECOINS.USD_GATEHUB.issuer;
    }

    // Check for EUR amounts (€25, 25 EUR, 25 euros)
    const eurMatch = intent.match(/€\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:EUR|euros?)/i);
    if (eurMatch) {
      amount = parseFloat(eurMatch[1] || eurMatch[2]);
      currency = 'EUR';
      issuer = KNOWN_STABLECOINS.EUR_GATEHUB.issuer;
    }

    // Check for XRP amounts
    const xrpMatch = intent.match(/(\d+(?:\.\d+)?)\s*XRP/i);
    if (xrpMatch) {
      amount = parseFloat(xrpMatch[1]);
      currency = 'XRP';
      issuer = undefined;
    }

    // Extract destination
    let destination: string | undefined;
    let destinationName: string | undefined;

    // Check for XRPL address (r...)
    const addressMatch = intent.match(/r[1-9A-HJ-NP-Za-km-z]{24,34}/);
    if (addressMatch) {
      destination = addressMatch[0];
    }

    // Check for known payee names
    for (const [name, payee] of this.knownPayees) {
      if (lower.includes(name.toLowerCase())) {
        destination = payee.address;
        destinationName = payee.name;
        // Override currency if payee has specific requirements
        if (payee.currency !== 'XRP') {
          currency = payee.currency;
          issuer = payee.issuer;
        }
        break;
      }
    }

    // Extract memo if present
    const memoMatch = intent.match(/(?:for|memo|note)[:\s]+["']?([^"']+)["']?/i);
    const memo = memoMatch ? memoMatch[1].trim() : undefined;

    if (amount <= 0) {
      throw new Error('Could not parse payment amount. Try: "Send 50 XRP to rABC..." or "Pay $25 to..."');
    }

    return {
      destination,
      destinationName,
      amount,
      currency,
      issuer,
      memo,
    };
  }

  /**
   * Build a complete payment plan
   */
  private async buildPaymentPlan(parsed: {
    destination?: string;
    destinationName?: string;
    amount: number;
    currency: string;
    issuer?: string;
    memo?: string;
  }): Promise<PaymentPlan> {
    const id = `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    if (!parsed.destination) {
      throw new Error('No destination address found. Please specify who to pay.');
    }

    const steps: PaymentStep[] = [];
    let totalCostXRP = 0;
    let networkFee = 0.000012; // ~12 drops
    let dexFee = 0;
    const risks: string[] = [];

    // Determine if we need to trade first
    const needsTrade = parsed.currency !== 'XRP' && 
      !this.walletState!.canPay(parsed.amount, parsed.currency, parsed.issuer);

    if (needsTrade) {
      // Get a quote from DEX
      try {
        const quote = await XRPLDex.getTradeQuote(
          { currency: 'XRP' },
          { currency: parsed.currency, issuer: parsed.issuer },
          parsed.amount.toString(),
          'buy'
        );

        // Check if we have enough XRP
        const xrpNeeded = parseFloat(quote.fromAmount);
        if (!this.walletState!.canPay(xrpNeeded, 'XRP')) {
          throw new Error(`Insufficient XRP. Need ${xrpNeeded.toFixed(2)} XRP but only have ${(this.walletState!.xrpBalance - 10).toFixed(2)} available.`);
        }

        steps.push({
          order: 1,
          type: 'trade',
          description: `Trade ${quote.fromAmount} XRP for ${quote.toAmount} ${parsed.currency}`,
          from: { amount: quote.fromAmount, currency: 'XRP' },
          to: { amount: quote.toAmount, currency: parsed.currency, issuer: parsed.issuer },
          quote,
        });

        totalCostXRP += xrpNeeded;
        dexFee = parseFloat(quote.fees.spread);

        if (quote.slippage > 1) {
          risks.push(`DEX slippage is ${quote.slippage.toFixed(2)}% - price may vary`);
        }
        if (quote.isPartialFill) {
          risks.push('Order may only partially fill due to limited liquidity');
        }
      } catch (error) {
        throw new Error(`Cannot find DEX path: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Add the payment step
    if (parsed.currency === 'XRP') {
      steps.push({
        order: steps.length + 1,
        type: 'payment',
        description: `Send ${parsed.amount} XRP to ${parsed.destinationName || parsed.destination}`,
        from: { amount: parsed.amount.toString(), currency: 'XRP' },
        to: { 
          amount: parsed.amount.toString(), 
          currency: 'XRP', 
          address: parsed.destination 
        },
      });
      totalCostXRP += parsed.amount;
    } else {
      steps.push({
        order: steps.length + 1,
        type: 'payment',
        description: `Send ${parsed.amount} ${parsed.currency} to ${parsed.destinationName || parsed.destination}`,
        from: { amount: parsed.amount.toString(), currency: parsed.currency, issuer: parsed.issuer },
        to: { 
          amount: parsed.amount.toString(), 
          currency: parsed.currency, 
          issuer: parsed.issuer,
          address: parsed.destination 
        },
      });
    }

    // Check spending limits
    if (totalCostXRP > this.config.singleTxLimit) {
      risks.push(`Exceeds single transaction limit (${this.config.singleTxLimit} XRP)`);
    }
    if (this.dailySpent + totalCostXRP > this.config.dailyLimit) {
      risks.push(`Would exceed daily limit (${this.config.dailyLimit} XRP)`);
    }

    return {
      id,
      type: needsTrade ? 'cross_currency_payment' : 'direct_payment',
      status: 'draft',
      intent: {
        description: `Pay ${parsed.amount} ${parsed.currency} to ${parsed.destinationName || parsed.destination}`,
        destination: parsed.destination,
        destinationName: parsed.destinationName,
        targetAmount: parsed.amount.toString(),
        targetCurrency: parsed.currency,
      },
      plan: {
        steps,
        totalCost: totalCostXRP.toFixed(6),
        fees: {
          network: networkFee.toFixed(6),
          dex: dexFee.toFixed(6),
          total: (networkFee + dexFee).toFixed(6),
        },
        estimatedTime: steps.length > 1 ? '~10 seconds' : '~5 seconds',
        risks,
      },
      createdAt: now,
      expiresAt: new Date(now.getTime() + 5 * 60 * 1000), // 5 minute expiry
    };
  }

  // ==================== PAYMENT EXECUTION ====================

  /**
   * Start the signing process - returns immediately with signing request
   * UI should call this, then wait for events or call waitForSigning
   */
  async startSigning(planId: string): Promise<PaymentPlan> {
    const plan = this.pendingPlans.get(planId);
    if (!plan) {
      throw new Error('Payment plan not found');
    }

    if (plan.status !== 'draft') {
      throw new Error(`Plan is already ${plan.status}`);
    }

    if (new Date() > plan.expiresAt) {
      plan.status = 'failed';
      plan.execution = { startedAt: new Date(), error: 'Plan expired' };
      throw new Error('Payment plan has expired. Please create a new one.');
    }

    // Final security checks
    await this.performSecurityChecks({
      amount: parseFloat(plan.plan.totalCost),
      currency: 'XRP',
      destination: plan.intent.destination,
    });

    // Update status
    plan.status = 'confirmed';
    this.log('payment_confirmed', { planId }, 'pending');

    // Create the signing request
    try {
      plan.status = 'signing';
      plan.execution = { startedAt: new Date() };

      const step = plan.plan.steps[plan.plan.steps.length - 1];
      
      let signingRequest: SigningRequest;

      if (step.type === 'payment') {
        signingRequest = await xamanService.requestPaymentSignature({
          destination: step.to.address!,
          amount: step.to.amount,
          currency: step.to.currency,
          issuer: step.to.issuer,
        });
      } else if (step.type === 'trade') {
        signingRequest = await xamanService.requestTradeSignature({
          sell: {
            currency: step.from.currency,
            issuer: step.from.issuer,
            amount: step.from.amount,
          },
          buy: {
            currency: step.to.currency,
            issuer: step.to.issuer,
            amount: step.to.amount,
          },
        });
      } else {
        throw new Error(`Unknown step type: ${step.type}`);
      }

      plan.execution.signingRequest = signingRequest;
      
      // Return immediately so UI can show signing instructions
      return plan;
    } catch (error) {
      plan.status = 'failed';
      plan.execution = {
        ...plan.execution,
        startedAt: plan.execution?.startedAt || new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      this.log('error', { planId, error: String(error) }, 'failed');
      throw error;
    }
  }

  /**
   * Wait for signing to complete - call after startSigning
   */
  async waitForSigning(planId: string): Promise<PaymentPlan> {
    const plan = this.pendingPlans.get(planId);
    if (!plan) {
      throw new Error('Payment plan not found');
    }

    if (!plan.execution?.signingRequest) {
      throw new Error('No signing request found. Call startSigning first.');
    }

    try {
      const signed = await this.waitForSignature(plan.execution.signingRequest);
      
      if (signed.status === 'signed') {
        plan.status = 'completed';
        plan.execution.completedAt = new Date();
        plan.execution.txHash = signed.txHash;
        plan.execution.actualCost = plan.plan.totalCost;

        this.dailySpent += parseFloat(plan.plan.totalCost);
        this.saveDailySpent();
        this.lastTxTime = new Date();

        this.log('payment_signed', { planId, txHash: signed.txHash }, 'success');
      } else {
        plan.status = 'failed';
        plan.execution.error = `Signing ${signed.status}`;
        this.log('payment_rejected', { planId, status: signed.status }, 'failed');
      }

      return plan;
    } catch (error) {
      plan.status = 'failed';
      plan.execution.error = error instanceof Error ? error.message : 'Unknown error';
      this.log('error', { planId, error: String(error) }, 'failed');
      throw error;
    }
  }

  /**
   * Confirm and execute a payment plan (legacy - calls both steps)
   * This sends the signing request to Xaman
   */
  async confirmAndExecute(planId: string): Promise<PaymentPlan> {
    await this.startSigning(planId);
    return this.waitForSigning(planId);
  }

  /**
   * Cancel a pending payment plan
   */
  cancelPlan(planId: string): void {
    const plan = this.pendingPlans.get(planId);
    if (plan && plan.status === 'draft') {
      plan.status = 'cancelled';
      this.log('payment_cancelled', { planId }, 'success');
    }
  }

  /**
   * Wait for a signing request to be completed
   */
  private waitForSignature(request: SigningRequest): Promise<SigningRequest> {
    return new Promise((resolve) => {
      const checkStatus = () => {
        if (request.status !== 'pending') {
          resolve(request);
          return;
        }
        setTimeout(checkStatus, 1000);
      };

      // Listen for events
      const onSigned = (data: SigningRequest) => {
        if (data.id === request.id) {
          xamanService.off('signingSigned', onSigned);
          xamanService.off('signingRejected', onRejected);
          xamanService.off('signingExpired', onExpired);
          resolve(data);
        }
      };
      const onRejected = (data: SigningRequest) => {
        if (data.id === request.id) {
          xamanService.off('signingSigned', onSigned);
          xamanService.off('signingRejected', onRejected);
          xamanService.off('signingExpired', onExpired);
          resolve(data);
        }
      };
      const onExpired = (data: SigningRequest) => {
        if (data.id === request.id) {
          xamanService.off('signingSigned', onSigned);
          xamanService.off('signingRejected', onRejected);
          xamanService.off('signingExpired', onExpired);
          resolve(data);
        }
      };

      xamanService.on('signingSigned', onSigned);
      xamanService.on('signingRejected', onRejected);
      xamanService.on('signingExpired', onExpired);

      checkStatus();
    });
  }

  // ==================== SECURITY ====================

  private async performSecurityChecks(params: {
    amount?: number;
    currency?: string;
    destination?: string;
  }): Promise<void> {
    // Check daily limit
    const xrpAmount = params.currency === 'XRP' ? (params.amount || 0) : 0;
    if (this.dailySpent + xrpAmount > this.config.dailyLimit) {
      this.log('limit_exceeded', { type: 'daily', current: this.dailySpent, limit: this.config.dailyLimit }, 'failed');
      throw new Error(`Daily spending limit exceeded. Limit: ${this.config.dailyLimit} XRP, Already spent: ${this.dailySpent.toFixed(2)} XRP`);
    }

    // Check single transaction limit
    if (xrpAmount > this.config.singleTxLimit) {
      this.log('limit_exceeded', { type: 'single', amount: xrpAmount, limit: this.config.singleTxLimit }, 'failed');
      throw new Error(`Transaction exceeds single transaction limit of ${this.config.singleTxLimit} XRP`);
    }

    // Check cooldown
    if (this.lastTxTime && this.config.cooldownSeconds > 0) {
      const elapsed = (Date.now() - this.lastTxTime.getTime()) / 1000;
      if (elapsed < this.config.cooldownSeconds) {
        this.log('cooldown_blocked', { elapsed, required: this.config.cooldownSeconds }, 'failed');
        throw new Error(`Please wait ${Math.ceil(this.config.cooldownSeconds - elapsed)} seconds before next transaction`);
      }
    }

    // Check whitelist
    if (this.config.whitelistOnly && params.destination) {
      if (!this.config.whitelist.includes(params.destination)) {
        this.log('whitelist_blocked', { destination: params.destination }, 'failed');
        throw new Error('Destination not in whitelist');
      }
    }
  }

  // ==================== AUDIT LOG ====================

  private log(action: AuditLogEntry['action'], details: Record<string, unknown>, status: AuditLogEntry['status']): void {
    const entry: AuditLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date(),
      action,
      details,
      status,
    };
    
    this.auditLog.push(entry);
    
    // Keep last 1000 entries
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }
    
    this.saveAuditLog();
    console.log(`[SecureAgent] ${action}:`, details);
  }

  getAuditLog(limit: number = 50): AuditLogEntry[] {
    return this.auditLog.slice(-limit).reverse();
  }

  private loadAuditLog(): void {
    try {
      const saved = localStorage.getItem('secure-agent-audit-log');
      if (saved) {
        this.auditLog = JSON.parse(saved).map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp),
        }));
      }
    } catch {
      this.auditLog = [];
    }
  }

  private saveAuditLog(): void {
    try {
      localStorage.setItem('secure-agent-audit-log', JSON.stringify(this.auditLog));
    } catch {
      // Ignore storage errors
    }
  }

  // ==================== DAILY TRACKING ====================

  private loadDailySpent(): void {
    try {
      const saved = localStorage.getItem('secure-agent-daily-spent');
      if (saved) {
        const data = JSON.parse(saved);
        const savedDate = new Date(data.date).toDateString();
        const today = new Date().toDateString();
        
        if (savedDate === today) {
          this.dailySpent = data.amount;
        } else {
          this.dailySpent = 0;
        }
      }
    } catch {
      this.dailySpent = 0;
    }
  }

  private saveDailySpent(): void {
    try {
      localStorage.setItem('secure-agent-daily-spent', JSON.stringify({
        date: new Date().toISOString(),
        amount: this.dailySpent,
      }));
    } catch {
      // Ignore storage errors
    }
  }

  getDailySpent(): number {
    return this.dailySpent;
  }

  getRemainingDailyLimit(): number {
    return Math.max(0, this.config.dailyLimit - this.dailySpent);
  }

  // ==================== KNOWN PAYEES ====================

  private initializeKnownPayees(): void {
    // Example known payees - in production, this would be loaded from a service
    this.knownPayees.set('demo_merchant', {
      address: 'rDemoMerchant1234567890abcdefg',
      currency: 'XRP',
      name: 'Demo Merchant',
    });
  }

  addKnownPayee(name: string, address: string, currency: string = 'XRP', issuer?: string): void {
    this.knownPayees.set(name.toLowerCase(), {
      address,
      currency,
      issuer,
      name,
    });
  }

  getKnownPayees(): Array<{ name: string; address: string; currency: string; issuer?: string }> {
    return Array.from(this.knownPayees.values());
  }
}

// ==================== SINGLETON INSTANCE ====================

export const securePaymentAgent = new SecurePaymentAgent();

// ==================== EXPORTS ====================

export default securePaymentAgent;
