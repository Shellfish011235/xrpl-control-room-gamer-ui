// ILP Multi-Ledger Connector Map Engine
// Type Definitions
// 
// PHILOSOPHY: ILP does not connect blockchains. Connectors do.
// Trust is a topology, not a claim.

// ==================== LEDGER ====================

export type LedgerType = 'public' | 'permissioned' | 'private';
export type LedgerDomain = 'on-ledger' | 'off-ledger' | 'hybrid';
export type SettlementType = 'native' | 'wrapped' | 'synthetic' | 'custodial';

export type RiskFlag = 
  | 'regulatory'
  | 'liquidity'
  | 'custodial'
  | 'unverified'
  | 'experimental'
  | 'counterparty'
  | 'centralized'
  | 'bridge_risk'
  | 'smart_contract'
  | 'governance'
  | 'oracle_dependency';

export interface Ledger {
  id: string;
  name: string;
  symbol?: string;
  type: LedgerType;
  domain: LedgerDomain;
  settlement: SettlementType;
  supports_ilp_adapter: boolean;
  native_asset: string;
  consensus: string;
  finality_seconds: number;
  tps_estimate: number;
  risk_flags: RiskFlag[];
  metadata?: {
    website?: string;
    explorer?: string;
    documentation?: string;
    logo_url?: string;
  };
  // Visual positioning
  position?: { x: number; y: number; z?: number };
  orbital_radius?: number;
  mass?: number; // Visual "gravity" - larger = more connections
}

// ==================== CONNECTOR ====================

export type LiquidityStatus = 'live' | 'simulated' | 'unknown' | 'depleted';
export type SettlementMechanism = 'escrow' | 'htlc' | 'atomic_swap' | 'api' | 'bridge' | 'multisig';

export interface AssetPair {
  from: string;
  to: string;
  rate?: number;
  spread_bps?: number;
}

export interface Claim {
  id: string;
  source: string;
  statement: string;
  timestamp: string;
  verified: boolean;
  evidence?: string;
}

export interface Observation {
  id: string;
  type: 'transaction' | 'liquidity' | 'uptime' | 'latency' | 'failure';
  timestamp: string;
  data: Record<string, any>;
  confidence: number; // 0-1
}

export interface Connector {
  id: string;
  name: string;
  from: string; // Ledger ID
  to: string;   // Ledger ID
  asset_pairs: AssetPair[];
  liquidity: LiquidityStatus;
  liquidity_depth?: number; // USD equivalent
  trust_score: number; // 0-1
  latency_ms: number;
  settlement: SettlementMechanism;
  risk_flags: RiskFlag[];
  claims: Claim[];
  observations: Observation[];
  operator?: string;
  fee_bps?: number;
  min_amount?: number;
  max_amount?: number;
  uptime_percent?: number;
  last_active?: string;
  // Computed
  health_score?: number;
}

// ==================== CORRIDOR ====================

export type CorridorStatus = 'active' | 'experimental' | 'fogged' | 'inactive' | 'deprecated';

export interface Corridor {
  id: string;
  connector_id: string;
  from_ledger: string;
  to_ledger: string;
  status: CorridorStatus;
  thickness: number; // 0-1, visual weight based on volume
  glow: number;      // 0-1, visual intensity based on activity
  risk_fog: RiskFlag[];
  volume_24h?: number;
  tx_count_24h?: number;
  avg_settlement_time_ms?: number;
  success_rate?: number;
  bidirectional: boolean;
  // Routing
  is_preferred_route?: boolean;
  alternative_corridors?: string[];
}

// ==================== ROUTE ====================

export interface RouteHop {
  corridor_id: string;
  connector_id: string;
  from_ledger: string;
  to_ledger: string;
  estimated_fee_bps: number;
  estimated_latency_ms: number;
}

export interface Route {
  id: string;
  from_ledger: string;
  to_ledger: string;
  hops: RouteHop[];
  total_fee_bps: number;
  total_latency_ms: number;
  risk_score: number;
  liquidity_available: number;
  expires_at?: string;
}

// ==================== UI LENSES ====================

export type UILens = 
  | 'domain'      // Ledger Domain View - on/off/hybrid classification
  | 'trust'       // Connector Trust View - trust scores and verification
  | 'heat'        // Corridor Heat View - volume and activity
  | 'fog'         // Risk Fog View - uncertainty and risk visualization
  | 'flow';       // Asset Flow View - directional value movement

export interface LensConfig {
  lens: UILens;
  enabled: boolean;
  opacity: number;
  filters?: {
    min_trust?: number;
    min_volume?: number;
    risk_flags?: RiskFlag[];
    ledger_types?: LedgerType[];
    status?: CorridorStatus[];
  };
}

// ==================== OODA STATE ====================

export type OODAPhase = 'observe' | 'orient' | 'decide' | 'act';

export interface OODAState {
  current_phase: OODAPhase;
  last_observation: string;
  last_orientation: string;
  last_decision: string;
  last_action: string;
  timestamp: string;
}

export interface FeynmanSummary {
  summary: string;
  complexity: 'simple' | 'moderate' | 'complex';
  timestamp: string;
}

export interface LearInvariant {
  id: string;
  name: string;
  description: string;
  check: () => boolean;
  violated: boolean;
  last_checked: string;
}

// ==================== TOPOLOGY STATE ====================

export interface TopologyState {
  ledgers: Map<string, Ledger>;
  connectors: Map<string, Connector>;
  corridors: Map<string, Corridor>;
  routes: Map<string, Route>;
  ooda: OODAState;
  feynman: FeynmanSummary;
  invariants: LearInvariant[];
  active_lens: UILens;
  lens_configs: Map<UILens, LensConfig>;
  last_updated: string;
  data_freshness: 'live' | 'stale' | 'historical';
}

// ==================== EVENTS ====================

export type ILPEvent = 
  | { type: 'LEDGER_ADDED'; ledger: Ledger }
  | { type: 'LEDGER_UPDATED'; ledger: Ledger }
  | { type: 'CONNECTOR_ADDED'; connector: Connector }
  | { type: 'CONNECTOR_UPDATED'; connector: Connector }
  | { type: 'CORRIDOR_STATUS_CHANGED'; corridor: Corridor; old_status: CorridorStatus }
  | { type: 'ROUTE_CALCULATED'; route: Route }
  | { type: 'OBSERVATION_RECORDED'; connector_id: string; observation: Observation }
  | { type: 'CLAIM_VERIFIED'; connector_id: string; claim: Claim }
  | { type: 'INVARIANT_VIOLATED'; invariant: LearInvariant }
  | { type: 'LENS_CHANGED'; lens: UILens }
  | { type: 'OODA_PHASE_CHANGED'; phase: OODAPhase };

export type ILPEventHandler = (event: ILPEvent) => void;

// ==================== VISUAL GRAMMAR ====================

/**
 * Visual Grammar for the Connector Map:
 * 
 * Ledgers = Planets
 * - Size based on transaction volume / importance
 * - Color based on domain (on-ledger=blue, off-ledger=orange, hybrid=purple)
 * - Glow based on activity
 * - Rings for risk flags
 * 
 * Connectors = Wormholes
 * - Aperture size based on liquidity depth
 * - Color based on trust score (green=high, yellow=medium, red=low)
 * - Pulsing based on activity
 * - Distortion based on latency
 * 
 * Corridors = Light Streams
 * - Thickness based on volume
 * - Brightness based on activity (glow)
 * - Color based on status (active=cyan, experimental=yellow, fogged=gray)
 * - Particle flow direction shows value movement
 * 
 * Risk = Gravitational Fog
 * - Density based on risk severity
 * - Color: red for regulatory, orange for counterparty, purple for smart contract
 * - Obscures visibility of underlying elements
 * 
 * Trust = Orbital Stability
 * - Stable orbits for high trust
 * - Eccentric/wobbly orbits for low trust
 * - Decay animation for decreasing trust
 */

export interface VisualConfig {
  // Planet (Ledger) settings
  ledger_base_size: number;
  ledger_glow_intensity: number;
  ledger_ring_width: number;
  
  // Wormhole (Connector) settings
  connector_aperture_scale: number;
  connector_pulse_speed: number;
  connector_distortion_factor: number;
  
  // Light Stream (Corridor) settings
  corridor_thickness_scale: number;
  corridor_particle_count: number;
  corridor_flow_speed: number;
  
  // Fog (Risk) settings
  fog_density_scale: number;
  fog_opacity: number;
  fog_animation_speed: number;
  
  // General
  camera_distance: number;
  rotation_speed: number;
  ambient_light: number;
}

export const DEFAULT_VISUAL_CONFIG: VisualConfig = {
  ledger_base_size: 1,
  ledger_glow_intensity: 0.5,
  ledger_ring_width: 0.1,
  connector_aperture_scale: 1,
  connector_pulse_speed: 1,
  connector_distortion_factor: 0.5,
  corridor_thickness_scale: 1,
  corridor_particle_count: 100,
  corridor_flow_speed: 1,
  fog_density_scale: 1,
  fog_opacity: 0.3,
  fog_animation_speed: 0.5,
  camera_distance: 100,
  rotation_speed: 0.1,
  ambient_light: 0.3,
};
