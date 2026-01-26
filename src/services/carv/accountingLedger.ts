// CARV - Accounting Ledger with Tax Tracking
// Tracks cost basis, FMV, gain/loss, CSV export for Form 8949

import {
  PaymentIntentEnvelope,
  LedgerEntry,
  TaxLot,
  TaxReport,
  Form8949Entry,
  VenueType,
  RouteResult,
} from './types';

// ==================== PRICE FETCHER ====================

interface PriceData {
  price: number;
  timestamp: string;
  source: string;
}

/**
 * Fetch current FMV from CoinGecko or fallback
 */
async function fetchFMV(asset: string): Promise<PriceData> {
  const assetMap: Record<string, string> = {
    'XRP': 'ripple',
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'SOL': 'solana',
    'DOGE': 'dogecoin',
    'USD': 'usd',
  };

  const coinId = assetMap[asset.toUpperCase()];
  
  // USD is always 1
  if (asset.toUpperCase() === 'USD') {
    return { price: 1, timestamp: new Date().toISOString(), source: 'fixed' };
  }

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
    );
    
    if (response.ok) {
      const data = await response.json();
      return {
        price: data[coinId]?.usd || 0,
        timestamp: new Date().toISOString(),
        source: 'coingecko',
      };
    }
  } catch (e) {
    console.warn('[Ledger] CoinGecko fetch failed, using fallback');
  }

  // Fallback prices
  const fallbacks: Record<string, number> = {
    'XRP': 2.45,
    'BTC': 98500,
    'ETH': 3850,
    'SOL': 245,
    'DOGE': 0.42,
  };

  return {
    price: fallbacks[asset.toUpperCase()] || 1,
    timestamp: new Date().toISOString(),
    source: 'fallback',
  };
}

// ==================== ACCOUNTING LEDGER CLASS ====================

export class AccountingLedger {
  private entries: LedgerEntry[] = [];
  private taxLots: TaxLot[] = [];
  private priceCache: Map<string, PriceData> = new Map();
  private priceCacheTTL = 60000; // 1 minute cache

  constructor() {}

  // ==================== LEDGER ENTRIES ====================

  /**
   * Record a settled transaction
   */
  async recordSettlement(
    pie: PaymentIntentEnvelope,
    routeResult: RouteResult
  ): Promise<LedgerEntry> {
    const amount = parseFloat(pie.amount);
    const fee = parseFloat(routeResult.fee_paid || '0');
    
    // Get FMV at time of settlement
    const fmv = await this.getFMV(pie.asset);
    
    // Find or create tax lot
    const lot = this.getOrCreateTaxLot(pie.asset, amount, fmv.price);
    
    // Calculate realized gain/loss (FIFO)
    const { costBasis, gainLoss } = this.calculateGainLoss(pie.asset, amount, fmv.price);

    const entry: LedgerEntry = {
      entry_id: this.generateId(),
      intent_id: pie.intent_id,
      timestamp: new Date().toISOString(),
      type: 'debit', // Payer perspective
      amount,
      asset: pie.asset,
      counterparty: pie.payee,
      fee,
      cost_basis: costBasis,
      fmv_at_time: fmv.price,
      realized_gain_loss: gainLoss,
      tax_lot_id: lot.lot_id,
      venue: routeResult.venue,
      status: 'confirmed',
    };

    this.entries.push(entry);
    
    // Update tax lot
    this.updateTaxLotDisposal(lot.lot_id, amount);

    return entry;
  }

  /**
   * Record an incoming transfer (credit)
   */
  async recordCredit(
    asset: string,
    amount: number,
    counterparty: string,
    acquisitionType: 'purchase' | 'transfer' | 'reward' = 'transfer'
  ): Promise<LedgerEntry> {
    const fmv = await this.getFMV(asset);
    
    // Create new tax lot
    const lot = this.createTaxLot(asset, amount, fmv.price, acquisitionType);

    const entry: LedgerEntry = {
      entry_id: this.generateId(),
      intent_id: `credit_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'credit',
      amount,
      asset,
      counterparty,
      fee: 0,
      cost_basis: fmv.price * amount,
      fmv_at_time: fmv.price,
      realized_gain_loss: 0, // No gain/loss on acquisition
      tax_lot_id: lot.lot_id,
      venue: 'simulation',
      status: 'confirmed',
    };

    this.entries.push(entry);
    return entry;
  }

  // ==================== TAX LOTS (FIFO) ====================

  /**
   * Create a new tax lot
   */
  private createTaxLot(
    asset: string,
    quantity: number,
    costBasisPerUnit: number,
    acquisitionType: 'purchase' | 'transfer' | 'reward'
  ): TaxLot {
    const lot: TaxLot = {
      lot_id: this.generateId(),
      asset,
      quantity,
      cost_basis: costBasisPerUnit * quantity,
      acquired_at: new Date().toISOString(),
      acquisition_type: acquisitionType,
      disposed_quantity: 0,
    };

    this.taxLots.push(lot);
    return lot;
  }

  /**
   * Get or create tax lot
   */
  private getOrCreateTaxLot(asset: string, quantity: number, fmv: number): TaxLot {
    // Find existing lot with remaining quantity (FIFO)
    const existingLot = this.taxLots.find(
      lot => lot.asset === asset && lot.quantity - lot.disposed_quantity > 0
    );

    if (existingLot) {
      return existingLot;
    }

    // Create new lot (e.g., for paper trading initial balance)
    return this.createTaxLot(asset, quantity, fmv, 'transfer');
  }

  /**
   * Update tax lot after disposal
   */
  private updateTaxLotDisposal(lotId: string, quantity: number): void {
    const lot = this.taxLots.find(l => l.lot_id === lotId);
    if (lot) {
      lot.disposed_quantity += quantity;
      if (lot.disposed_quantity >= lot.quantity) {
        lot.disposed_at = new Date().toISOString();
      }
    }
  }

  /**
   * Calculate gain/loss using FIFO
   */
  private calculateGainLoss(
    asset: string,
    quantity: number,
    currentFMV: number
  ): { costBasis: number; gainLoss: number } {
    let remainingQty = quantity;
    let totalCostBasis = 0;

    // Get lots in FIFO order
    const lots = this.taxLots
      .filter(l => l.asset === asset && l.quantity - l.disposed_quantity > 0)
      .sort((a, b) => new Date(a.acquired_at).getTime() - new Date(b.acquired_at).getTime());

    for (const lot of lots) {
      if (remainingQty <= 0) break;

      const availableQty = lot.quantity - lot.disposed_quantity;
      const usedQty = Math.min(availableQty, remainingQty);
      const costBasisPerUnit = lot.cost_basis / lot.quantity;

      totalCostBasis += costBasisPerUnit * usedQty;
      remainingQty -= usedQty;
    }

    // If not enough lots, assume cost basis = current FMV (no gain/loss)
    if (remainingQty > 0) {
      totalCostBasis += currentFMV * remainingQty;
    }

    const proceeds = currentFMV * quantity;
    const gainLoss = proceeds - totalCostBasis;

    return { costBasis: totalCostBasis, gainLoss };
  }

  // ==================== PRICE / FMV ====================

  /**
   * Get FMV with caching
   */
  async getFMV(asset: string): Promise<PriceData> {
    const cacheKey = asset.toUpperCase();
    const cached = this.priceCache.get(cacheKey);

    if (cached && Date.now() - new Date(cached.timestamp).getTime() < this.priceCacheTTL) {
      return cached;
    }

    const fresh = await fetchFMV(asset);
    this.priceCache.set(cacheKey, fresh);
    return fresh;
  }

  // ==================== TAX REPORTING ====================

  /**
   * Generate tax report for a period
   */
  generateTaxReport(startDate: string, endDate: string): TaxReport {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const relevantEntries = this.entries.filter(e => {
      const entryDate = new Date(e.timestamp);
      return entryDate >= start && entryDate <= end && e.type === 'debit';
    });

    let shortTermGains = 0;
    let shortTermLosses = 0;
    let longTermGains = 0;
    let longTermLosses = 0;
    let totalProceeds = 0;
    let totalCostBasis = 0;

    const transactions: Form8949Entry[] = [];

    for (const entry of relevantEntries) {
      const lot = this.taxLots.find(l => l.lot_id === entry.tax_lot_id);
      if (!lot) continue;

      const acquiredDate = new Date(lot.acquired_at);
      const soldDate = new Date(entry.timestamp);
      const holdingDays = (soldDate.getTime() - acquiredDate.getTime()) / (1000 * 60 * 60 * 24);
      const isLongTerm = holdingDays > 365;

      const proceeds = entry.fmv_at_time * entry.amount;
      totalProceeds += proceeds;
      totalCostBasis += entry.cost_basis;

      const gainLoss = entry.realized_gain_loss;

      if (isLongTerm) {
        if (gainLoss >= 0) longTermGains += gainLoss;
        else longTermLosses += Math.abs(gainLoss);
      } else {
        if (gainLoss >= 0) shortTermGains += gainLoss;
        else shortTermLosses += Math.abs(gainLoss);
      }

      transactions.push({
        description: `${entry.amount} ${entry.asset} via ${entry.venue}`,
        date_acquired: lot.acquired_at.split('T')[0],
        date_sold: entry.timestamp.split('T')[0],
        proceeds,
        cost_basis: entry.cost_basis,
        gain_or_loss: gainLoss,
        holding_period: isLongTerm ? 'long' : 'short',
      });
    }

    return {
      period_start: startDate,
      period_end: endDate,
      short_term_gains: shortTermGains,
      long_term_gains: longTermGains,
      short_term_losses: shortTermLosses,
      long_term_losses: longTermLosses,
      total_proceeds: totalProceeds,
      total_cost_basis: totalCostBasis,
      transactions,
    };
  }

  /**
   * Export to CSV for Form 8949
   */
  exportForm8949CSV(report: TaxReport): string {
    const headers = [
      'Description',
      'Date Acquired',
      'Date Sold',
      'Proceeds',
      'Cost Basis',
      'Gain or Loss',
      'Holding Period',
    ];

    const rows = report.transactions.map(t => [
      t.description,
      t.date_acquired,
      t.date_sold,
      t.proceeds.toFixed(2),
      t.cost_basis.toFixed(2),
      t.gain_or_loss.toFixed(2),
      t.holding_period,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(r => r.join(',')),
      '',
      `Total Proceeds,${report.total_proceeds.toFixed(2)}`,
      `Total Cost Basis,${report.total_cost_basis.toFixed(2)}`,
      `Short-Term Gains,${report.short_term_gains.toFixed(2)}`,
      `Short-Term Losses,${report.short_term_losses.toFixed(2)}`,
      `Long-Term Gains,${report.long_term_gains.toFixed(2)}`,
      `Long-Term Losses,${report.long_term_losses.toFixed(2)}`,
    ].join('\n');

    return csv;
  }

  /**
   * Download CSV file
   */
  downloadCSV(report: TaxReport, filename?: string): void {
    const csv = this.exportForm8949CSV(report);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `form8949_${report.period_start}_${report.period_end}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ==================== QUERIES ====================

  /**
   * Get all entries
   */
  getEntries(): LedgerEntry[] {
    return [...this.entries];
  }

  /**
   * Get entries by asset
   */
  getEntriesByAsset(asset: string): LedgerEntry[] {
    return this.entries.filter(e => e.asset === asset);
  }

  /**
   * Get tax lots
   */
  getTaxLots(): TaxLot[] {
    return [...this.taxLots];
  }

  /**
   * Get open tax lots (with remaining quantity)
   */
  getOpenTaxLots(): TaxLot[] {
    return this.taxLots.filter(l => l.quantity - l.disposed_quantity > 0);
  }

  /**
   * Get total realized gain/loss
   */
  getTotalGainLoss(): number {
    return this.entries.reduce((sum, e) => sum + e.realized_gain_loss, 0);
  }

  /**
   * Get total fees paid
   */
  getTotalFees(): number {
    return this.entries.reduce((sum, e) => sum + e.fee, 0);
  }

  /**
   * Get summary stats
   */
  getSummary(): {
    totalEntries: number;
    totalDebits: number;
    totalCredits: number;
    totalGainLoss: number;
    totalFees: number;
    openLots: number;
  } {
    return {
      totalEntries: this.entries.length,
      totalDebits: this.entries.filter(e => e.type === 'debit').length,
      totalCredits: this.entries.filter(e => e.type === 'credit').length,
      totalGainLoss: this.getTotalGainLoss(),
      totalFees: this.getTotalFees(),
      openLots: this.getOpenTaxLots().length,
    };
  }

  // ==================== HELPERS ====================

  private generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.entries = [];
    this.taxLots = [];
    this.priceCache.clear();
  }

  /**
   * Initialize with starting balance (for paper trading)
   */
  async initializeBalance(asset: string, quantity: number): Promise<TaxLot> {
    const fmv = await this.getFMV(asset);
    return this.createTaxLot(asset, quantity, fmv.price, 'transfer');
  }
}

// ==================== SINGLETON ====================

let ledgerInstance: AccountingLedger | null = null;

export function getLedger(): AccountingLedger {
  if (!ledgerInstance) {
    ledgerInstance = new AccountingLedger();
  }
  return ledgerInstance;
}

export function resetLedger(): void {
  ledgerInstance = null;
}

export default AccountingLedger;
