// CARV - Multi-Venue Router
// Routes PIEs to appropriate settlement venues with fallback

import {
  PaymentIntentEnvelope,
  SignedPIE,
  VenueType,
  VenueConfig,
  RouteResult,
  RoutingDecision,
  CARVEvent,
  CARVEventHandler,
} from './types';

// ==================== DEFAULT VENUE CONFIGS ====================

const DEFAULT_VENUES: VenueConfig[] = [
  {
    venue: 'xrpl',
    enabled: true,
    priority: 1,
    max_amount: 10000,
    fee_estimate: 0.00001,
    latency_ms: 3000,
  },
  {
    venue: 'polymarket',
    enabled: true,
    priority: 2,
    max_amount: 1000,
    fee_estimate: 0.001,
    latency_ms: 5000,
  },
  {
    venue: 'ilp',
    enabled: true,
    priority: 3,
    max_amount: 5000,
    fee_estimate: 0.0001,
    latency_ms: 2000,
  },
  {
    venue: 'open_payments',
    enabled: false,
    priority: 4,
    max_amount: 1000,
    fee_estimate: 0.0005,
    latency_ms: 4000,
  },
  {
    venue: 'simulation',
    enabled: true,
    priority: 99,
    max_amount: Infinity,
    fee_estimate: 0,
    latency_ms: 100,
  },
];

// ==================== VENUE ROUTER CLASS ====================

export class VenueRouter {
  private venues: VenueConfig[];
  private testMode: boolean;
  private routeHistory: Array<{ pie: PaymentIntentEnvelope; result: RouteResult; timestamp: string }> = [];
  private eventHandlers: Set<CARVEventHandler> = new Set();

  constructor(venues: VenueConfig[] = DEFAULT_VENUES, testMode: boolean = true) {
    this.venues = venues;
    this.testMode = testMode;
  }

  // ==================== ROUTING DECISION ====================

  /**
   * Decide which venue to use for a PIE
   */
  decideRoute(pie: PaymentIntentEnvelope): RoutingDecision {
    const amount = parseFloat(pie.amount);
    const requestedVenue = pie.constraints.venue;

    // In test mode, always use simulation
    if (this.testMode) {
      return {
        selected_venue: 'simulation',
        reason: 'Test mode active - using simulation',
        alternatives: [],
        estimated_fee: 0,
        estimated_latency: 100,
      };
    }

    // Filter enabled venues that can handle the amount
    const eligibleVenues = this.venues
      .filter(v => v.enabled && amount <= v.max_amount)
      .sort((a, b) => a.priority - b.priority);

    if (eligibleVenues.length === 0) {
      return {
        selected_venue: 'simulation',
        reason: 'No eligible venues - falling back to simulation',
        alternatives: [],
        estimated_fee: 0,
        estimated_latency: 100,
      };
    }

    // Check if requested venue is available
    const requestedConfig = eligibleVenues.find(v => v.venue === requestedVenue);
    
    if (requestedConfig) {
      return {
        selected_venue: requestedConfig.venue,
        reason: `Requested venue ${requestedVenue} available`,
        alternatives: eligibleVenues.filter(v => v.venue !== requestedVenue).map(v => v.venue),
        estimated_fee: requestedConfig.fee_estimate,
        estimated_latency: requestedConfig.latency_ms,
      };
    }

    // Use highest priority eligible venue
    const selected = eligibleVenues[0];
    return {
      selected_venue: selected.venue,
      reason: `Using highest priority venue (requested ${requestedVenue} unavailable)`,
      alternatives: eligibleVenues.slice(1).map(v => v.venue),
      estimated_fee: selected.fee_estimate,
      estimated_latency: selected.latency_ms,
    };
  }

  // ==================== ROUTE EXECUTION ====================

  /**
   * Route and execute a PIE
   */
  async route(signedPie: SignedPIE): Promise<RouteResult> {
    const decision = this.decideRoute(signedPie.pie);
    
    try {
      const result = await this.executeRoute(signedPie, decision.selected_venue);
      
      // Log to history
      this.routeHistory.push({
        pie: signedPie.pie,
        result,
        timestamp: new Date().toISOString(),
      });

      // Emit event
      this.emitEvent({
        type: 'PIE_ROUTED',
        pie: signedPie.pie,
        result,
      });

      return result;
    } catch (error) {
      // Try fallback
      if (decision.alternatives.length > 0) {
        console.log(`[Router] Primary venue failed, trying fallback: ${decision.alternatives[0]}`);
        return this.executeFallback(signedPie, decision.alternatives);
      }

      return {
        success: false,
        venue: decision.selected_venue,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Execute route to specific venue
   */
  private async executeRoute(signedPie: SignedPIE, venue: VenueType): Promise<RouteResult> {
    switch (venue) {
      case 'xrpl':
        return this.routeToXRPL(signedPie);
      case 'polymarket':
        return this.routeToPolymarket(signedPie);
      case 'ilp':
        return this.routeToILP(signedPie);
      case 'open_payments':
        return this.routeToOpenPayments(signedPie);
      case 'simulation':
      default:
        return this.routeToSimulation(signedPie);
    }
  }

  /**
   * Execute fallback routing
   */
  private async executeFallback(
    signedPie: SignedPIE, 
    alternatives: VenueType[]
  ): Promise<RouteResult> {
    for (const venue of alternatives) {
      try {
        const result = await this.executeRoute(signedPie, venue);
        if (result.success) {
          return { ...result, fallback_used: true };
        }
      } catch (e) {
        continue;
      }
    }

    // All fallbacks failed
    return {
      success: false,
      venue: alternatives[alternatives.length - 1] || 'simulation',
      error: 'All venues failed',
      fallback_used: true,
    };
  }

  // ==================== VENUE IMPLEMENTATIONS ====================

  /**
   * Route to XRPL (stub - integrate with xrplService)
   */
  private async routeToXRPL(signedPie: SignedPIE): Promise<RouteResult> {
    // In production, this would:
    // 1. Connect to XRPL
    // 2. Create Payment transaction
    // 3. Sign and submit
    // 4. Wait for validation

    const pie = signedPie.pie;
    
    console.log(`[Router/XRPL] Routing ${pie.amount} ${pie.asset} from ${pie.payer} to ${pie.payee}`);

    // Simulate network delay
    await this.delay(2000 + Math.random() * 1000);

    // Simulate success (90% success rate in stub)
    if (Math.random() > 0.1) {
      return {
        success: true,
        venue: 'xrpl',
        tx_hash: `XRPL_${Date.now().toString(16).toUpperCase()}`,
        fee_paid: '0.00001',
        fill_percent: 100,
        settlement_time: new Date().toISOString(),
      };
    }

    throw new Error('XRPL transaction failed (simulated)');
  }

  /**
   * Route to Polymarket CLOB (stub)
   */
  private async routeToPolymarket(signedPie: SignedPIE): Promise<RouteResult> {
    const pie = signedPie.pie;
    
    console.log(`[Router/Polymarket] Routing ${pie.amount} ${pie.asset} to CLOB`);

    await this.delay(3000 + Math.random() * 2000);

    // Polymarket would handle prediction market orders
    if (Math.random() > 0.15) {
      return {
        success: true,
        venue: 'polymarket',
        tx_hash: `PM_${Date.now().toString(16).toUpperCase()}`,
        fee_paid: '0.001',
        fill_percent: 95 + Math.random() * 5,
        settlement_time: new Date().toISOString(),
      };
    }

    throw new Error('Polymarket order failed (simulated)');
  }

  /**
   * Route to ILP (stub)
   */
  private async routeToILP(signedPie: SignedPIE): Promise<RouteResult> {
    const pie = signedPie.pie;
    
    console.log(`[Router/ILP] Routing ${pie.amount} ${pie.asset} via Interledger`);

    await this.delay(1500 + Math.random() * 1000);

    if (Math.random() > 0.1) {
      return {
        success: true,
        venue: 'ilp',
        tx_hash: `ILP_${Date.now().toString(16).toUpperCase()}`,
        fee_paid: '0.0001',
        fill_percent: 100,
        settlement_time: new Date().toISOString(),
      };
    }

    throw new Error('ILP transfer failed (simulated)');
  }

  /**
   * Route to Open Payments (stub)
   */
  private async routeToOpenPayments(signedPie: SignedPIE): Promise<RouteResult> {
    const pie = signedPie.pie;
    
    console.log(`[Router/OpenPayments] Routing ${pie.amount} ${pie.asset} via Open Payments`);

    await this.delay(2500 + Math.random() * 1500);

    if (Math.random() > 0.2) {
      return {
        success: true,
        venue: 'open_payments',
        tx_hash: `OP_${Date.now().toString(16).toUpperCase()}`,
        fee_paid: '0.0005',
        fill_percent: 100,
        settlement_time: new Date().toISOString(),
      };
    }

    throw new Error('Open Payments transfer failed (simulated)');
  }

  /**
   * Route to Simulation (always succeeds)
   */
  private async routeToSimulation(signedPie: SignedPIE): Promise<RouteResult> {
    const pie = signedPie.pie;
    
    console.log(`[Router/Simulation] Simulating ${pie.amount} ${pie.asset} transfer`);

    await this.delay(100);

    return {
      success: true,
      venue: 'simulation',
      tx_hash: `SIM_${Date.now().toString(16).toUpperCase()}`,
      fee_paid: '0',
      fill_percent: 100,
      settlement_time: new Date().toISOString(),
    };
  }

  // ==================== CONFIGURATION ====================

  /**
   * Update venue configuration
   */
  updateVenue(venue: VenueType, updates: Partial<VenueConfig>): void {
    const idx = this.venues.findIndex(v => v.venue === venue);
    if (idx >= 0) {
      this.venues[idx] = { ...this.venues[idx], ...updates };
    }
  }

  /**
   * Enable/disable venue
   */
  setVenueEnabled(venue: VenueType, enabled: boolean): void {
    this.updateVenue(venue, { enabled });
  }

  /**
   * Set test mode
   */
  setTestMode(testMode: boolean): void {
    this.testMode = testMode;
    this.emitEvent({
      type: 'MODE_CHANGED',
      mode: testMode ? 'test' : 'live',
    });
  }

  /**
   * Get venue configs
   */
  getVenues(): VenueConfig[] {
    return [...this.venues];
  }

  /**
   * Get route history
   */
  getHistory(): Array<{ pie: PaymentIntentEnvelope; result: RouteResult; timestamp: string }> {
    return [...this.routeHistory];
  }

  /**
   * Get stats
   */
  getStats(): { total: number; success: number; failed: number; byVenue: Record<VenueType, number> } {
    const stats = {
      total: this.routeHistory.length,
      success: this.routeHistory.filter(r => r.result.success).length,
      failed: this.routeHistory.filter(r => !r.result.success).length,
      byVenue: {} as Record<VenueType, number>,
    };

    for (const entry of this.routeHistory) {
      if (entry.result.success) {
        const venue = entry.result.venue;
        stats.byVenue[venue] = (stats.byVenue[venue] || 0) + 1;
      }
    }

    return stats;
  }

  // ==================== HELPERS ====================

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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
        console.error('[Router] Event handler error:', e);
      }
    });
  }
}

// ==================== SINGLETON ====================

let routerInstance: VenueRouter | null = null;

export function getRouter(testMode?: boolean): VenueRouter {
  if (!routerInstance) {
    routerInstance = new VenueRouter(DEFAULT_VENUES, testMode ?? true);
  } else if (testMode !== undefined) {
    routerInstance.setTestMode(testMode);
  }
  return routerInstance;
}

export function resetRouter(): void {
  routerInstance = null;
}

export default VenueRouter;
