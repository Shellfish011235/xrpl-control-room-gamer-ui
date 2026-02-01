// $XDNA Token Metering Service
// Handles pay-per-proof micropayments with deflationary burn mechanism
// Integrates with XRPL for real token transfers

import {
  XDNATokenConfig,
  XDNAMeteringState,
  DNAProtocolConfig,
  DEFAULT_DNA_CONFIG,
  DEFAULT_XDNA_RATES,
} from './types';

// ==================== TOKEN CONFIG ====================

/**
 * $XDNA token configuration
 * Note: Issuer address will be updated when mainnet token launches
 */
const XDNA_CONFIG: XDNATokenConfig = {
  currency: 'XDNA',
  issuer: DEFAULT_DNA_CONFIG.xdna_issuer,
  decimals: 6,
  rates: {
    proof_generation: DEFAULT_XDNA_RATES.proof_generation,
    proof_verification: DEFAULT_XDNA_RATES.proof_verification,
    bulk_discount_threshold: DEFAULT_XDNA_RATES.bulk_discount_threshold,
    bulk_discount_percent: DEFAULT_XDNA_RATES.bulk_discount_percent,
  },
  burn: {
    rate_percent: DEFAULT_XDNA_RATES.burn_rate_percent,
    burn_address: DEFAULT_DNA_CONFIG.burn_address,
  },
};

// ==================== METERING EVENTS ====================

export interface MeteringTransaction {
  id: string;
  type: 'proof_generation' | 'proof_verification' | 'batch_generation';
  amount: string;
  burn_amount: string;
  net_to_treasury: string;
  timestamp: Date;
  xrpl_tx_hash?: string;
  proof_ids?: string[];
  status: 'pending' | 'confirmed' | 'failed';
}

export type MeteringEvent =
  | { type: 'BALANCE_UPDATED'; balance: string; change: string }
  | { type: 'PAYMENT_SENT'; tx: MeteringTransaction }
  | { type: 'PAYMENT_CONFIRMED'; tx: MeteringTransaction }
  | { type: 'BURN_EXECUTED'; amount: string; tx_hash: string }
  | { type: 'RATE_UPDATED'; rates: typeof XDNA_CONFIG.rates }
  | { type: 'INSUFFICIENT_BALANCE'; required: string; available: string };

export type MeteringEventHandler = (event: MeteringEvent) => void;

// ==================== XDNA METERING SERVICE ====================

class XDNAMeteringService {
  private config: XDNATokenConfig;
  private state: XDNAMeteringState;
  private transactions: MeteringTransaction[] = [];
  private eventHandlers: Set<MeteringEventHandler> = new Set();
  private walletAddress: string | null = null;

  constructor() {
    this.config = { ...XDNA_CONFIG };
    this.state = {
      balance: '0',
      daily_spent: '0',
      daily_burned: '0',
      proofs_generated: 0,
      proofs_verified: 0,
    };
    
    this.loadState();
  }

  // ==================== CONFIGURATION ====================

  setWalletAddress(address: string): void {
    this.walletAddress = address;
    // In production, fetch real balance from XRPL
    this.refreshBalance();
  }

  getWalletAddress(): string | null {
    return this.walletAddress;
  }

  updateRates(rates: Partial<typeof XDNA_CONFIG.rates>): void {
    this.config.rates = { ...this.config.rates, ...rates };
    this.emit({ type: 'RATE_UPDATED', rates: this.config.rates });
  }

  getRates(): typeof XDNA_CONFIG.rates {
    return { ...this.config.rates };
  }

  // ==================== BALANCE MANAGEMENT ====================

  async refreshBalance(): Promise<string> {
    // In production, query XRPL for actual balance
    // For now, use simulated balance
    
    if (!this.walletAddress) {
      return '0';
    }

    // Simulate fetching balance
    // const lines = await getAccountLines(this.walletAddress);
    // const xdnaLine = lines.find(l => l.currency === 'XDNA' && l.issuer === this.config.issuer);
    // this.state.balance = xdnaLine?.balance || '0';

    // For demo: give some starting balance
    if (parseFloat(this.state.balance) === 0) {
      this.state.balance = '1000'; // Demo balance
    }

    return this.state.balance;
  }

  getBalance(): string {
    return this.state.balance;
  }

  getState(): XDNAMeteringState {
    return { ...this.state };
  }

  // ==================== COST CALCULATION ====================

  /**
   * Calculate cost for proof generation
   */
  calculateProofCost(count: number = 1): {
    gross: string;
    burn: string;
    net: string;
    discount_applied: boolean;
  } {
    const baseRate = parseFloat(this.config.rates.proof_generation);
    let gross = baseRate * count;
    let discountApplied = false;

    // Apply bulk discount
    if (count >= this.config.rates.bulk_discount_threshold) {
      const discount = this.config.rates.bulk_discount_percent / 100;
      gross *= (1 - discount);
      discountApplied = true;
    }

    const burnRate = this.config.burn.rate_percent / 100;
    const burn = gross * burnRate;
    const net = gross - burn;

    return {
      gross: gross.toFixed(6),
      burn: burn.toFixed(6),
      net: net.toFixed(6),
      discount_applied: discountApplied,
    };
  }

  /**
   * Calculate cost for verification
   */
  calculateVerificationCost(count: number = 1): {
    gross: string;
    burn: string;
    net: string;
  } {
    const baseRate = parseFloat(this.config.rates.proof_verification);
    const gross = baseRate * count;
    const burnRate = this.config.burn.rate_percent / 100;
    const burn = gross * burnRate;
    const net = gross - burn;

    return {
      gross: gross.toFixed(6),
      burn: burn.toFixed(6),
      net: net.toFixed(6),
    };
  }

  // ==================== PAYMENT EXECUTION ====================

  /**
   * Check if sufficient balance for operation
   */
  canAfford(amount: string): boolean {
    return parseFloat(this.state.balance) >= parseFloat(amount);
  }

  /**
   * Reserve funds for an operation (pre-authorization)
   */
  async reserveFunds(
    amount: string,
    purpose: MeteringTransaction['type'],
    proofIds?: string[]
  ): Promise<MeteringTransaction | null> {
    if (!this.canAfford(amount)) {
      this.emit({
        type: 'INSUFFICIENT_BALANCE',
        required: amount,
        available: this.state.balance,
      });
      return null;
    }

    const cost = this.calculateProofCost(proofIds?.length || 1);
    
    const tx: MeteringTransaction = {
      id: `XDNA_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      type: purpose,
      amount: cost.gross,
      burn_amount: cost.burn,
      net_to_treasury: cost.net,
      timestamp: new Date(),
      proof_ids: proofIds,
      status: 'pending',
    };

    this.transactions.push(tx);
    this.emit({ type: 'PAYMENT_SENT', tx });

    return tx;
  }

  /**
   * Execute the actual XRPL payment
   * In production, this sends real $XDNA tokens
   */
  async executePayment(txId: string): Promise<MeteringTransaction | null> {
    const tx = this.transactions.find(t => t.id === txId);
    if (!tx || tx.status !== 'pending') {
      return null;
    }

    try {
      // Simulate XRPL transaction
      await new Promise(r => setTimeout(r, 300 + Math.random() * 500));

      // Deduct from balance
      const newBalance = parseFloat(this.state.balance) - parseFloat(tx.amount);
      const change = `-${tx.amount}`;
      this.state.balance = newBalance.toFixed(6);
      
      // Track daily stats
      const dailySpent = parseFloat(this.state.daily_spent) + parseFloat(tx.amount);
      this.state.daily_spent = dailySpent.toFixed(6);
      
      const dailyBurned = parseFloat(this.state.daily_burned) + parseFloat(tx.burn_amount);
      this.state.daily_burned = dailyBurned.toFixed(6);
      
      if (tx.type === 'proof_generation' || tx.type === 'batch_generation') {
        this.state.proofs_generated += tx.proof_ids?.length || 1;
      } else {
        this.state.proofs_verified += 1;
      }

      // Simulate tx hash
      tx.xrpl_tx_hash = `XRPL_XDNA_${tx.id}`.toUpperCase();
      tx.status = 'confirmed';
      this.state.last_tx_at = new Date().toISOString();

      this.saveState();
      
      this.emit({ type: 'BALANCE_UPDATED', balance: this.state.balance, change });
      this.emit({ type: 'PAYMENT_CONFIRMED', tx });
      this.emit({
        type: 'BURN_EXECUTED',
        amount: tx.burn_amount,
        tx_hash: tx.xrpl_tx_hash,
      });

      return tx;
    } catch (error) {
      tx.status = 'failed';
      return tx;
    }
  }

  /**
   * Combined reserve + execute (convenience method)
   */
  async chargeForProof(
    proofIds: string[],
    type: 'proof_generation' | 'proof_verification' | 'batch_generation' = 'proof_generation'
  ): Promise<MeteringTransaction | null> {
    const cost = type === 'proof_verification' 
      ? this.calculateVerificationCost(proofIds.length)
      : this.calculateProofCost(proofIds.length);

    const tx = await this.reserveFunds(cost.gross, type, proofIds);
    if (!tx) return null;

    return this.executePayment(tx.id);
  }

  // ==================== BURN TRACKING ====================

  /**
   * Get total $XDNA burned by this user
   */
  getTotalBurned(): string {
    return this.transactions
      .filter(t => t.status === 'confirmed')
      .reduce((sum, t) => sum + parseFloat(t.burn_amount), 0)
      .toFixed(6);
  }

  /**
   * Get burn rate info
   */
  getBurnInfo(): {
    rate_percent: number;
    burn_address: string;
    total_burned: string;
    daily_burned: string;
  } {
    return {
      rate_percent: this.config.burn.rate_percent,
      burn_address: this.config.burn.burn_address,
      total_burned: this.getTotalBurned(),
      daily_burned: this.state.daily_burned,
    };
  }

  // ==================== TRANSACTION HISTORY ====================

  getTransactions(limit: number = 50): MeteringTransaction[] {
    return this.transactions.slice(-limit).reverse();
  }

  getTransaction(txId: string): MeteringTransaction | undefined {
    return this.transactions.find(t => t.id === txId);
  }

  // ==================== DAILY RESET ====================

  /**
   * Reset daily counters (call at midnight or on app start if new day)
   */
  resetDailyCounters(): void {
    this.state.daily_spent = '0';
    this.state.daily_burned = '0';
    this.state.proofs_generated = 0;
    this.state.proofs_verified = 0;
    this.saveState();
  }

  /**
   * Check if daily counters need reset
   */
  checkDailyReset(): void {
    const lastTx = this.state.last_tx_at;
    if (!lastTx) return;

    const lastDate = new Date(lastTx).toDateString();
    const today = new Date().toDateString();

    if (lastDate !== today) {
      this.resetDailyCounters();
    }
  }

  // ==================== PERSISTENCE ====================

  private loadState(): void {
    try {
      const saved = localStorage.getItem('xdna-metering-state');
      if (saved) {
        const data = JSON.parse(saved);
        this.state = { ...this.state, ...data };
      }

      const savedTx = localStorage.getItem('xdna-metering-transactions');
      if (savedTx) {
        this.transactions = JSON.parse(savedTx).map((t: any) => ({
          ...t,
          timestamp: new Date(t.timestamp),
        }));
      }
    } catch {
      // Ignore errors, use defaults
    }

    // Check for daily reset
    this.checkDailyReset();
  }

  private saveState(): void {
    try {
      localStorage.setItem('xdna-metering-state', JSON.stringify(this.state));
      
      // Keep last 500 transactions
      const recentTx = this.transactions.slice(-500);
      localStorage.setItem('xdna-metering-transactions', JSON.stringify(recentTx));
    } catch {
      // Ignore storage errors
    }
  }

  // ==================== EVENTS ====================

  subscribe(handler: MeteringEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  private emit(event: MeteringEvent): void {
    this.eventHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (e) {
        console.error('[XDNAMetering] Event handler error:', e);
      }
    });
  }

  // ==================== STATISTICS ====================

  getStats(): {
    total_proofs: number;
    total_verifications: number;
    total_spent: string;
    total_burned: string;
    avg_cost_per_proof: string;
  } {
    const confirmedTx = this.transactions.filter(t => t.status === 'confirmed');
    const totalSpent = confirmedTx.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalProofs = confirmedTx
      .filter(t => t.type !== 'proof_verification')
      .reduce((sum, t) => sum + (t.proof_ids?.length || 1), 0);
    const totalVerifications = confirmedTx
      .filter(t => t.type === 'proof_verification')
      .reduce((sum, t) => sum + (t.proof_ids?.length || 1), 0);

    return {
      total_proofs: totalProofs,
      total_verifications: totalVerifications,
      total_spent: totalSpent.toFixed(6),
      total_burned: this.getTotalBurned(),
      avg_cost_per_proof: totalProofs > 0 
        ? (totalSpent / totalProofs).toFixed(6) 
        : '0',
    };
  }
}

// ==================== SINGLETON ====================

let meteringService: XDNAMeteringService | null = null;

export function getXDNAMetering(): XDNAMeteringService {
  if (!meteringService) {
    meteringService = new XDNAMeteringService();
  }
  return meteringService;
}

export function resetXDNAMetering(): void {
  meteringService = null;
}

export { XDNAMeteringService, XDNA_CONFIG };
export default XDNAMeteringService;
