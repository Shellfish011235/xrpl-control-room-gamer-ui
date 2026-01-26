// ILP Topology Service
// Manages the Interledger Connector Network topology
// Implements OODA loop for continuous observation and orientation

import type {
  Ledger,
  Connector,
  Corridor,
  Route,
  TopologyState,
  LearInvariant,
  UILens,
  LensConfig,
  Observation,
  CorridorStatus,
  ILPEvent,
  ILPEventHandler,
} from './types';

// ==================== INITIAL LEDGER DATA ====================

export const INITIAL_LEDGERS: Ledger[] = [
  // XRPL - The Settlement Gravity Well
  {
    id: 'xrpl',
    name: 'XRP Ledger',
    symbol: 'XRPL',
    type: 'public',
    domain: 'on-ledger',
    settlement: 'native',
    supports_ilp_adapter: true,
    native_asset: 'XRP',
    consensus: 'Federated Byzantine Agreement',
    finality_seconds: 4,
    tps_estimate: 1500,
    risk_flags: [],
    metadata: {
      website: 'https://xrpl.org',
      explorer: 'https://livenet.xrpl.org',
      documentation: 'https://xrpl.org/docs',
    },
    position: { x: 0, y: 0, z: 0 },
    mass: 100,
  },
  // Ethereum
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    type: 'public',
    domain: 'on-ledger',
    settlement: 'native',
    supports_ilp_adapter: true,
    native_asset: 'ETH',
    consensus: 'Proof of Stake',
    finality_seconds: 900, // ~15 min for economic finality
    tps_estimate: 30,
    risk_flags: ['smart_contract'],
    metadata: {
      website: 'https://ethereum.org',
      explorer: 'https://etherscan.io',
    },
    position: { x: 50, y: 30, z: 0 },
    mass: 80,
  },
  // Bitcoin
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    type: 'public',
    domain: 'on-ledger',
    settlement: 'native',
    supports_ilp_adapter: false, // Requires Lightning
    native_asset: 'BTC',
    consensus: 'Proof of Work',
    finality_seconds: 3600, // ~6 confirmations
    tps_estimate: 7,
    risk_flags: ['liquidity'],
    metadata: {
      website: 'https://bitcoin.org',
      explorer: 'https://blockstream.info',
    },
    position: { x: -60, y: 20, z: 0 },
    mass: 90,
  },
  // Lightning Network
  {
    id: 'lightning',
    name: 'Lightning Network',
    symbol: 'LN',
    type: 'public',
    domain: 'hybrid',
    settlement: 'native',
    supports_ilp_adapter: true,
    native_asset: 'BTC',
    consensus: 'Channel State',
    finality_seconds: 1,
    tps_estimate: 1000000,
    risk_flags: ['liquidity', 'counterparty'],
    position: { x: -40, y: 40, z: 10 },
    mass: 40,
  },
  // Solana
  {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    type: 'public',
    domain: 'on-ledger',
    settlement: 'native',
    supports_ilp_adapter: true,
    native_asset: 'SOL',
    consensus: 'Proof of History + PoS',
    finality_seconds: 0.4,
    tps_estimate: 65000,
    risk_flags: ['centralized'],
    position: { x: 40, y: -40, z: 0 },
    mass: 50,
  },
  // Polygon
  {
    id: 'polygon',
    name: 'Polygon',
    symbol: 'MATIC',
    type: 'public',
    domain: 'on-ledger',
    settlement: 'native',
    supports_ilp_adapter: true,
    native_asset: 'MATIC',
    consensus: 'Proof of Stake',
    finality_seconds: 2,
    tps_estimate: 7000,
    risk_flags: ['smart_contract', 'bridge_risk'],
    position: { x: 60, y: 10, z: 0 },
    mass: 35,
  },
  // Traditional Rails
  {
    id: 'swift',
    name: 'SWIFT Network',
    symbol: 'SWIFT',
    type: 'permissioned',
    domain: 'off-ledger',
    settlement: 'custodial',
    supports_ilp_adapter: false,
    native_asset: 'USD',
    consensus: 'Centralized',
    finality_seconds: 86400, // 1-5 days
    tps_estimate: 50,
    risk_flags: ['custodial', 'regulatory', 'centralized'],
    position: { x: -30, y: -50, z: 0 },
    mass: 70,
  },
  // Fedwire
  {
    id: 'fedwire',
    name: 'Fedwire',
    symbol: 'FED',
    type: 'permissioned',
    domain: 'off-ledger',
    settlement: 'custodial',
    supports_ilp_adapter: false,
    native_asset: 'USD',
    consensus: 'Centralized (Fed)',
    finality_seconds: 1,
    tps_estimate: 100,
    risk_flags: ['custodial', 'regulatory', 'centralized'],
    position: { x: -50, y: -30, z: 0 },
    mass: 60,
  },
  // Ripple Payments (ODL)
  {
    id: 'ripple_odl',
    name: 'Ripple Payments (ODL)',
    symbol: 'ODL',
    type: 'permissioned',
    domain: 'hybrid',
    settlement: 'native',
    supports_ilp_adapter: true,
    native_asset: 'XRP',
    consensus: 'XRPL-backed',
    finality_seconds: 4,
    tps_estimate: 1500,
    risk_flags: ['regulatory'],
    position: { x: 15, y: 15, z: 5 },
    mass: 45,
  },
];

// ==================== INITIAL CONNECTOR DATA ====================

export const INITIAL_CONNECTORS: Connector[] = [
  // XRPL <-> Ethereum (via XRPL EVM Sidechain)
  {
    id: 'conn-xrpl-eth',
    name: 'XRPL-Ethereum Bridge',
    from: 'xrpl',
    to: 'ethereum',
    asset_pairs: [
      { from: 'XRP', to: 'WXRP', rate: 1, spread_bps: 10 },
      { from: 'USD', to: 'USDC', rate: 1, spread_bps: 5 },
    ],
    liquidity: 'live',
    liquidity_depth: 5000000,
    trust_score: 0.7,
    latency_ms: 15000,
    settlement: 'bridge',
    risk_flags: ['bridge_risk', 'smart_contract'],
    claims: [
      {
        id: 'claim-001',
        source: 'Peersyst',
        statement: 'EVM Sidechain provides native bridge functionality',
        timestamp: '2024-01-15T00:00:00Z',
        verified: true,
        evidence: 'https://evm-sidechain.xrpl.org',
      },
    ],
    observations: [],
    operator: 'Peersyst / Ripple',
    fee_bps: 10,
    uptime_percent: 99.5,
  },
  // XRPL <-> Ripple ODL
  {
    id: 'conn-xrpl-odl',
    name: 'XRPL Native ODL',
    from: 'xrpl',
    to: 'ripple_odl',
    asset_pairs: [
      { from: 'XRP', to: 'XRP', rate: 1, spread_bps: 0 },
      { from: 'USD', to: 'USD', rate: 1, spread_bps: 2 },
    ],
    liquidity: 'live',
    liquidity_depth: 100000000,
    trust_score: 0.95,
    latency_ms: 4000,
    settlement: 'escrow',
    risk_flags: ['regulatory'],
    claims: [],
    observations: [],
    operator: 'Ripple',
    fee_bps: 2,
    uptime_percent: 99.9,
  },
  // XRPL <-> Solana (experimental)
  {
    id: 'conn-xrpl-sol',
    name: 'XRPL-Solana Connector',
    from: 'xrpl',
    to: 'solana',
    asset_pairs: [
      { from: 'XRP', to: 'XRP-SOL', spread_bps: 50 },
    ],
    liquidity: 'simulated',
    liquidity_depth: 100000,
    trust_score: 0.4,
    latency_ms: 5000,
    settlement: 'htlc',
    risk_flags: ['experimental', 'unverified', 'smart_contract'],
    claims: [
      {
        id: 'claim-002',
        source: 'Community',
        statement: 'Experimental connector via Wormhole',
        timestamp: '2024-06-01T00:00:00Z',
        verified: false,
      },
    ],
    observations: [],
    fee_bps: 50,
    uptime_percent: 85,
  },
  // Lightning <-> Bitcoin
  {
    id: 'conn-ln-btc',
    name: 'Lightning-Bitcoin Channel',
    from: 'lightning',
    to: 'bitcoin',
    asset_pairs: [
      { from: 'BTC', to: 'BTC', rate: 1, spread_bps: 0 },
    ],
    liquidity: 'live',
    liquidity_depth: 50000000,
    trust_score: 0.9,
    latency_ms: 3600000, // On-chain settlement
    settlement: 'htlc',
    risk_flags: ['liquidity'],
    claims: [],
    observations: [],
    operator: 'Network',
    fee_bps: 1,
    uptime_percent: 99.9,
  },
  // Ethereum <-> Polygon
  {
    id: 'conn-eth-polygon',
    name: 'Polygon Bridge',
    from: 'ethereum',
    to: 'polygon',
    asset_pairs: [
      { from: 'ETH', to: 'WETH', rate: 1, spread_bps: 5 },
      { from: 'USDC', to: 'USDC', rate: 1, spread_bps: 2 },
    ],
    liquidity: 'live',
    liquidity_depth: 500000000,
    trust_score: 0.85,
    latency_ms: 30000,
    settlement: 'bridge',
    risk_flags: ['bridge_risk', 'smart_contract'],
    claims: [],
    observations: [],
    operator: 'Polygon Labs',
    fee_bps: 5,
    uptime_percent: 99.8,
  },
  // SWIFT <-> Fedwire
  {
    id: 'conn-swift-fed',
    name: 'SWIFT-Fedwire Settlement',
    from: 'swift',
    to: 'fedwire',
    asset_pairs: [
      { from: 'USD', to: 'USD', rate: 1, spread_bps: 0 },
    ],
    liquidity: 'live',
    liquidity_depth: 10000000000,
    trust_score: 0.99,
    latency_ms: 86400000,
    settlement: 'api',
    risk_flags: ['custodial', 'centralized'],
    claims: [],
    observations: [],
    operator: 'Federal Reserve',
    fee_bps: 25,
    uptime_percent: 99.99,
  },
  // ODL <-> SWIFT (Ripple integration)
  {
    id: 'conn-odl-swift',
    name: 'Ripple-SWIFT Corridor',
    from: 'ripple_odl',
    to: 'swift',
    asset_pairs: [
      { from: 'USD', to: 'USD', rate: 1, spread_bps: 10 },
      { from: 'XRP', to: 'USD', spread_bps: 20 },
    ],
    liquidity: 'live',
    liquidity_depth: 1000000000,
    trust_score: 0.8,
    latency_ms: 3000,
    settlement: 'api',
    risk_flags: ['regulatory', 'custodial'],
    claims: [
      {
        id: 'claim-003',
        source: 'Ripple',
        statement: 'Direct integration with major banks via SWIFT gpi',
        timestamp: '2024-03-01T00:00:00Z',
        verified: true,
        evidence: 'https://ripple.com/solutions',
      },
    ],
    observations: [],
    operator: 'Ripple',
    fee_bps: 10,
    uptime_percent: 99.5,
  },
];

// ==================== CORRIDORS ====================

function generateCorridors(connectors: Connector[]): Corridor[] {
  return connectors.map((conn) => {
    const status: CorridorStatus = 
      conn.liquidity === 'live' ? 'active' :
      conn.liquidity === 'simulated' ? 'experimental' :
      conn.liquidity === 'unknown' ? 'fogged' : 'inactive';

    return {
      id: `corr-${conn.id}`,
      connector_id: conn.id,
      from_ledger: conn.from,
      to_ledger: conn.to,
      status,
      thickness: Math.min(1, (conn.liquidity_depth || 0) / 100000000),
      glow: conn.trust_score,
      risk_fog: conn.risk_flags,
      volume_24h: Math.random() * conn.liquidity_depth! * 0.1,
      tx_count_24h: Math.floor(Math.random() * 10000),
      avg_settlement_time_ms: conn.latency_ms,
      success_rate: (conn.uptime_percent || 95) / 100,
      bidirectional: true,
    };
  });
}

// ==================== LEAR INVARIANTS ====================

function createLearInvariants(state: () => TopologyState): LearInvariant[] {
  return [
    {
      id: 'inv-no-custody',
      name: 'No Hidden Custody',
      description: 'All custodial relationships must be explicitly flagged',
      check: () => {
        const s = state();
        for (const [, conn] of s.connectors) {
          if (conn.settlement === 'api' && !conn.risk_flags.includes('custodial')) {
            return false;
          }
        }
        return true;
      },
      violated: false,
      last_checked: new Date().toISOString(),
    },
    {
      id: 'inv-no-fake-bridges',
      name: 'No Fake Bridges',
      description: 'Bridge connectors must have verified claims or observations',
      check: () => {
        const s = state();
        for (const [, conn] of s.connectors) {
          if (conn.settlement === 'bridge') {
            const hasVerification = 
              conn.claims.some(c => c.verified) || 
              conn.observations.length > 0;
            if (!hasVerification && conn.liquidity === 'live') {
              return false;
            }
          }
        }
        return true;
      },
      violated: false,
      last_checked: new Date().toISOString(),
    },
    {
      id: 'inv-falsifiable',
      name: 'Corridors Must Be Falsifiable',
      description: 'Every active corridor must have observable criteria for failure',
      check: () => {
        const s = state();
        for (const [, corr] of s.corridors) {
          if (corr.status === 'active' && corr.success_rate === undefined) {
            return false;
          }
        }
        return true;
      },
      violated: false,
      last_checked: new Date().toISOString(),
    },
    {
      id: 'inv-visible-risk',
      name: 'Risk Must Be Visible',
      description: 'All connectors with non-trivial risk must have risk_flags',
      check: () => {
        const s = state();
        for (const [, conn] of s.connectors) {
          if (conn.trust_score < 0.8 && conn.risk_flags.length === 0) {
            return false;
          }
        }
        return true;
      },
      violated: false,
      last_checked: new Date().toISOString(),
    },
  ];
}

// ==================== TOPOLOGY SERVICE ====================

export class TopologyService {
  private state: TopologyState;
  private eventHandlers: Set<ILPEventHandler> = new Set();
  private oodaInterval: number | null = null;

  constructor() {
    this.state = this.initializeState();
  }

  private initializeState(): TopologyState {
    const ledgers = new Map(INITIAL_LEDGERS.map(l => [l.id, l]));
    const connectors = new Map(INITIAL_CONNECTORS.map(c => [c.id, c]));
    const corridors = new Map(
      generateCorridors(INITIAL_CONNECTORS).map(c => [c.id, c])
    );

    const state: TopologyState = {
      ledgers,
      connectors,
      corridors,
      routes: new Map(),
      ooda: {
        current_phase: 'observe',
        last_observation: 'Initial topology loaded',
        last_orientation: 'XRPL positioned as settlement gravity well',
        last_decision: 'All corridors classified',
        last_action: 'Map initialized',
        timestamp: new Date().toISOString(),
      },
      feynman: {
        summary: 'The Interledger network routes value between blockchains through connectors. XRPL serves as a fast settlement hub, while bridges and corridors enable cross-chain transfers with varying levels of trust and risk.',
        complexity: 'simple',
        timestamp: new Date().toISOString(),
      },
      invariants: [],
      active_lens: 'trust',
      lens_configs: new Map([
        ['domain', { lens: 'domain', enabled: true, opacity: 1 }],
        ['trust', { lens: 'trust', enabled: true, opacity: 1 }],
        ['heat', { lens: 'heat', enabled: false, opacity: 0.7 }],
        ['fog', { lens: 'fog', enabled: true, opacity: 0.5 }],
        ['flow', { lens: 'flow', enabled: false, opacity: 0.8 }],
      ]),
      last_updated: new Date().toISOString(),
      data_freshness: 'live',
    };

    // Initialize invariants with state accessor
    state.invariants = createLearInvariants(() => this.state);

    return state;
  }

  // ==================== OODA LOOP ====================

  startOODALoop(intervalMs: number = 10000): void {
    if (this.oodaInterval) return;

    this.oodaInterval = window.setInterval(() => {
      this.executeOODAIteration();
    }, intervalMs);

    console.log('[ILP Topology] OODA loop started');
  }

  stopOODALoop(): void {
    if (this.oodaInterval) {
      clearInterval(this.oodaInterval);
      this.oodaInterval = null;
    }
  }

  private executeOODAIteration(): void {
    // OBSERVE
    this.observe();
    
    // ORIENT
    this.orient();
    
    // DECIDE
    this.decide();
    
    // ACT
    this.act();

    // Check invariants
    this.checkInvariants();

    // Update Feynman summary
    this.updateFeynman();
  }

  private observe(): void {
    const observations: string[] = [];
    
    // Observe connector health
    for (const [, conn] of this.state.connectors) {
      // Simulate observation (in production, fetch real data)
      if (Math.random() > 0.95) {
        const obs: Observation = {
          id: `obs-${Date.now()}`,
          type: 'latency',
          timestamp: new Date().toISOString(),
          data: { latency_ms: conn.latency_ms * (0.8 + Math.random() * 0.4) },
          confidence: 0.8,
        };
        conn.observations.push(obs);
        observations.push(`Latency observation on ${conn.name}`);
      }
    }

    this.state.ooda.current_phase = 'observe';
    this.state.ooda.last_observation = observations.length > 0 
      ? observations.join('; ') 
      : 'No new observations';
    this.state.ooda.timestamp = new Date().toISOString();

    this.emitEvent({ type: 'OODA_PHASE_CHANGED', phase: 'observe' });
  }

  private orient(): void {
    const orientations: string[] = [];

    // Classify ledgers by domain
    const byDomain = {
      'on-ledger': 0,
      'off-ledger': 0,
      'hybrid': 0,
    };
    for (const [, ledger] of this.state.ledgers) {
      byDomain[ledger.domain]++;
    }
    orientations.push(`Domain split: ${byDomain['on-ledger']} on-ledger, ${byDomain['off-ledger']} off-ledger, ${byDomain['hybrid']} hybrid`);

    // Classify connector health
    let healthyConnectors = 0;
    let riskyConnectors = 0;
    for (const [, conn] of this.state.connectors) {
      if (conn.trust_score >= 0.7 && conn.risk_flags.length <= 1) {
        healthyConnectors++;
      } else {
        riskyConnectors++;
      }
    }
    orientations.push(`Connector health: ${healthyConnectors} healthy, ${riskyConnectors} risky`);

    this.state.ooda.current_phase = 'orient';
    this.state.ooda.last_orientation = orientations.join('; ');

    this.emitEvent({ type: 'OODA_PHASE_CHANGED', phase: 'orient' });
  }

  private decide(): void {
    const decisions: string[] = [];

    // Update corridor statuses based on connector state
    for (const [, corr] of this.state.corridors) {
      const conn = this.state.connectors.get(corr.connector_id);
      if (!conn) continue;

      const oldStatus = corr.status;
      let newStatus: CorridorStatus = corr.status;

      // Decision logic
      if (conn.trust_score < 0.3) {
        newStatus = 'fogged';
        decisions.push(`Fogging ${conn.name} due to low trust`);
      } else if (conn.liquidity === 'depleted') {
        newStatus = 'inactive';
        decisions.push(`Deactivating ${conn.name} due to depleted liquidity`);
      } else if (conn.risk_flags.includes('experimental')) {
        newStatus = 'experimental';
      } else if (conn.trust_score >= 0.7 && conn.liquidity === 'live') {
        newStatus = 'active';
      }

      if (newStatus !== oldStatus) {
        corr.status = newStatus;
        this.emitEvent({ type: 'CORRIDOR_STATUS_CHANGED', corridor: corr, old_status: oldStatus });
      }
    }

    this.state.ooda.current_phase = 'decide';
    this.state.ooda.last_decision = decisions.length > 0 
      ? decisions.join('; ') 
      : 'No status changes';

    this.emitEvent({ type: 'OODA_PHASE_CHANGED', phase: 'decide' });
  }

  private act(): void {
    const actions: string[] = [];

    // Update visual properties based on state
    for (const [, corr] of this.state.corridors) {
      const conn = this.state.connectors.get(corr.connector_id);
      if (!conn) continue;

      // Update thickness based on recent volume (simulated)
      corr.thickness = Math.min(1, (conn.liquidity_depth || 0) / 100000000);
      
      // Update glow based on activity
      corr.glow = conn.trust_score * (corr.success_rate || 0.9);
    }

    // Update ledger masses based on connections
    for (const [id, ledger] of this.state.ledgers) {
      const connectionCount = Array.from(this.state.connectors.values())
        .filter(c => c.from === id || c.to === id).length;
      ledger.mass = 30 + connectionCount * 15;
    }

    actions.push('Visual properties updated');
    
    this.state.ooda.current_phase = 'act';
    this.state.ooda.last_action = actions.join('; ');
    this.state.last_updated = new Date().toISOString();

    this.emitEvent({ type: 'OODA_PHASE_CHANGED', phase: 'act' });
  }

  private checkInvariants(): void {
    for (const inv of this.state.invariants) {
      const wasViolated = inv.violated;
      inv.violated = !inv.check();
      inv.last_checked = new Date().toISOString();

      if (inv.violated && !wasViolated) {
        console.warn(`[ILP] Invariant violated: ${inv.name}`);
        this.emitEvent({ type: 'INVARIANT_VIOLATED', invariant: inv });
      }
    }
  }

  private updateFeynman(): void {
    const activeCorridors = Array.from(this.state.corridors.values())
      .filter(c => c.status === 'active').length;
    const totalCorridors = this.state.corridors.size;
    const avgTrust = Array.from(this.state.connectors.values())
      .reduce((sum, c) => sum + c.trust_score, 0) / this.state.connectors.size;

    this.state.feynman = {
      summary: `The network has ${activeCorridors}/${totalCorridors} active corridors with average trust of ${(avgTrust * 100).toFixed(0)}%. XRPL remains the central settlement hub, routing value to ${this.state.ledgers.size - 1} other ledgers.`,
      complexity: avgTrust > 0.7 ? 'simple' : avgTrust > 0.5 ? 'moderate' : 'complex',
      timestamp: new Date().toISOString(),
    };
  }

  // ==================== ROUTING ====================

  calculateRoute(fromLedger: string, toLedger: string, _amount: number): Route | null {
    // Simple pathfinding - find direct or 1-hop routes through XRPL
    const directCorridor = Array.from(this.state.corridors.values())
      .find(c => c.from_ledger === fromLedger && c.to_ledger === toLedger && c.status === 'active');

    if (directCorridor) {
      const conn = this.state.connectors.get(directCorridor.connector_id)!;
      const route: Route = {
        id: `route-${Date.now()}`,
        from_ledger: fromLedger,
        to_ledger: toLedger,
        hops: [{
          corridor_id: directCorridor.id,
          connector_id: conn.id,
          from_ledger: fromLedger,
          to_ledger: toLedger,
          estimated_fee_bps: conn.fee_bps || 0,
          estimated_latency_ms: conn.latency_ms,
        }],
        total_fee_bps: conn.fee_bps || 0,
        total_latency_ms: conn.latency_ms,
        risk_score: 1 - conn.trust_score,
        liquidity_available: conn.liquidity_depth || 0,
      };

      this.state.routes.set(route.id, route);
      this.emitEvent({ type: 'ROUTE_CALCULATED', route });
      return route;
    }

    // Try routing through XRPL
    const toXRPL = Array.from(this.state.corridors.values())
      .find(c => c.from_ledger === fromLedger && c.to_ledger === 'xrpl' && c.status === 'active');
    const fromXRPL = Array.from(this.state.corridors.values())
      .find(c => c.from_ledger === 'xrpl' && c.to_ledger === toLedger && c.status === 'active');

    if (toXRPL && fromXRPL) {
      const conn1 = this.state.connectors.get(toXRPL.connector_id)!;
      const conn2 = this.state.connectors.get(fromXRPL.connector_id)!;

      const route: Route = {
        id: `route-${Date.now()}`,
        from_ledger: fromLedger,
        to_ledger: toLedger,
        hops: [
          {
            corridor_id: toXRPL.id,
            connector_id: conn1.id,
            from_ledger: fromLedger,
            to_ledger: 'xrpl',
            estimated_fee_bps: conn1.fee_bps || 0,
            estimated_latency_ms: conn1.latency_ms,
          },
          {
            corridor_id: fromXRPL.id,
            connector_id: conn2.id,
            from_ledger: 'xrpl',
            to_ledger: toLedger,
            estimated_fee_bps: conn2.fee_bps || 0,
            estimated_latency_ms: conn2.latency_ms,
          },
        ],
        total_fee_bps: (conn1.fee_bps || 0) + (conn2.fee_bps || 0),
        total_latency_ms: conn1.latency_ms + conn2.latency_ms,
        risk_score: 1 - (conn1.trust_score * conn2.trust_score),
        liquidity_available: Math.min(conn1.liquidity_depth || 0, conn2.liquidity_depth || 0),
      };

      this.state.routes.set(route.id, route);
      this.emitEvent({ type: 'ROUTE_CALCULATED', route });
      return route;
    }

    return null;
  }

  // ==================== LENS MANAGEMENT ====================

  setActiveLens(lens: UILens): void {
    this.state.active_lens = lens;
    this.emitEvent({ type: 'LENS_CHANGED', lens });
  }

  updateLensConfig(lens: UILens, config: Partial<LensConfig>): void {
    const existing = this.state.lens_configs.get(lens);
    if (existing) {
      this.state.lens_configs.set(lens, { ...existing, ...config });
    }
  }

  // ==================== STATE ACCESS ====================

  getState(): TopologyState {
    return this.state;
  }

  getLedgers(): Ledger[] {
    return Array.from(this.state.ledgers.values());
  }

  getConnectors(): Connector[] {
    return Array.from(this.state.connectors.values());
  }

  getCorridors(): Corridor[] {
    return Array.from(this.state.corridors.values());
  }

  getLedger(id: string): Ledger | undefined {
    return this.state.ledgers.get(id);
  }

  getConnector(id: string): Connector | undefined {
    return this.state.connectors.get(id);
  }

  getCorridor(id: string): Corridor | undefined {
    return this.state.corridors.get(id);
  }

  // ==================== EVENTS ====================

  subscribe(handler: ILPEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  private emitEvent(event: ILPEvent): void {
    this.eventHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (e) {
        console.error('[ILP Topology] Event handler error:', e);
      }
    });
  }
}

// ==================== SINGLETON ====================

let topologyInstance: TopologyService | null = null;

export function getTopology(): TopologyService {
  if (!topologyInstance) {
    topologyInstance = new TopologyService();
  }
  return topologyInstance;
}

export function resetTopology(): void {
  if (topologyInstance) {
    topologyInstance.stopOODALoop();
    topologyInstance = null;
  }
}

export default TopologyService;
