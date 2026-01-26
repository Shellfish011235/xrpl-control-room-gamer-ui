// CARV - Verifiable AI Payment Rail Co-Processor
// Type Definitions

// ==================== CORE TYPES ====================

export interface PaymentIntentEnvelope {
  intent_id: string;
  payer: string;
  payee: string;
  amount: string;
  asset: string;
  expiry: string;
  created_at: string;
  constraints: PIEConstraints;
  proofs: PIEProofs;
  status: PIEStatus;
  metadata?: Record<string, any>;
}

export interface PIEConstraints {
  max_fee: string;
  slippage_bps: number;
  venue: VenueType;
  min_fill_percent?: number;
  time_in_force?: 'GTC' | 'IOC' | 'FOK';
}

export interface PIEProofs {
  market_snapshot_hash: string;
  model_version: string;
  features_hash: string;
  regime_summary_hash: string;
  compute_timestamp: string;
  prompt_hash?: string;
}

export type PIEStatus = 
  | 'pending' 
  | 'validated' 
  | 'attested' 
  | 'routing' 
  | 'settled' 
  | 'failed' 
  | 'rejected'
  | 'expired';

export type VenueType = 
  | 'xrpl' 
  | 'polymarket' 
  | 'ilp' 
  | 'open_payments'
  | 'simulation';

// ==================== VALIDATION ====================

export interface ValidationResult {
  valid: boolean;
  reason: string;
  code: ValidationErrorCode;
  timestamp: string;
}

export type ValidationErrorCode = 
  | 'OK'
  | 'INVALID_AMOUNT'
  | 'MISSING_REGIME_ANCHOR'
  | 'SELF_LOOP_FORBIDDEN'
  | 'DAILY_VOLUME_CAP'
  | 'CONCENTRATION_LIMIT'
  | 'DIVERGENCE_ALERT'
  | 'REJECTION_STREAK'
  | 'EXPIRED'
  | 'INVALID_ASSET'
  | 'VENUE_UNAVAILABLE';

export interface AggregateValidationState {
  daily_volume: number;
  daily_date: string;
  recent_pies: PaymentIntentEnvelope[];
  rejections: RejectionLog[];
  concentration: Map<string, number>;
}

export interface RejectionLog {
  timestamp: string;
  intent_id: string;
  reason: string;
  code: ValidationErrorCode;
}

// ==================== ATTESTATION ====================

export interface SignedPIE {
  pie: PaymentIntentEnvelope;
  signature: string;
  signer: string;
  algorithm: 'ECDSA-secp256k1' | 'Ed25519';
}

export interface MerkleProof {
  root: string;
  leaf_hash: string;
  proof_path: string[];
  leaf_index: number;
  tree_size: number;
}

export interface AttestationBatch {
  batch_id: string;
  merkle_root: string;
  pies: SignedPIE[];
  created_at: string;
  attested_at?: string;
  anchor_tx?: string; // Optional on-chain anchor
}

// ==================== ROUTING ====================

export interface RouteResult {
  success: boolean;
  venue: VenueType;
  tx_hash?: string;
  fee_paid?: string;
  fill_percent?: number;
  settlement_time?: string;
  error?: string;
  fallback_used?: boolean;
}

export interface VenueConfig {
  venue: VenueType;
  enabled: boolean;
  priority: number;
  max_amount: number;
  fee_estimate: number;
  latency_ms: number;
}

export interface RoutingDecision {
  selected_venue: VenueType;
  reason: string;
  alternatives: VenueType[];
  estimated_fee: number;
  estimated_latency: number;
}

// ==================== ACCOUNTING ====================

export interface LedgerEntry {
  entry_id: string;
  intent_id: string;
  timestamp: string;
  type: 'debit' | 'credit';
  amount: number;
  asset: string;
  counterparty: string;
  fee: number;
  cost_basis: number;
  fmv_at_time: number;
  realized_gain_loss: number;
  tax_lot_id: string;
  venue: VenueType;
  status: 'pending' | 'confirmed' | 'reversed';
}

export interface TaxLot {
  lot_id: string;
  asset: string;
  quantity: number;
  cost_basis: number;
  acquired_at: string;
  acquisition_type: 'purchase' | 'transfer' | 'reward';
  disposed_quantity: number;
  disposed_at?: string;
}

export interface TaxReport {
  period_start: string;
  period_end: string;
  short_term_gains: number;
  long_term_gains: number;
  short_term_losses: number;
  long_term_losses: number;
  total_proceeds: number;
  total_cost_basis: number;
  transactions: Form8949Entry[];
}

export interface Form8949Entry {
  description: string;
  date_acquired: string;
  date_sold: string;
  proceeds: number;
  cost_basis: number;
  gain_or_loss: number;
  holding_period: 'short' | 'long';
  wash_sale_adjustment?: number;
}

// ==================== SYSTEM STATE ====================

export interface CARVSystemState {
  mode: 'test' | 'live';
  initialized: boolean;
  wallet_address: string;
  daily_volume_cap: number;
  regime_summary: string;
  venues: VenueConfig[];
  pending_pies: PaymentIntentEnvelope[];
  batches: AttestationBatch[];
  ledger_entries: LedgerEntry[];
  tax_lots: TaxLot[];
  validation_state: AggregateValidationState;
}

export interface CARVConfig {
  test_mode: boolean;
  wallet_address: string;
  daily_volume_cap: number;
  max_single_amount: number;
  rejection_streak_threshold: number;
  auto_batch_size: number;
  auto_batch_interval_ms: number;
  venues: VenueConfig[];
  regime_summary: string;
}

// ==================== EVENTS ====================

export type CARVEvent = 
  | { type: 'PIE_CREATED'; pie: PaymentIntentEnvelope }
  | { type: 'PIE_VALIDATED'; pie: PaymentIntentEnvelope; result: ValidationResult }
  | { type: 'PIE_REJECTED'; pie: PaymentIntentEnvelope; result: ValidationResult }
  | { type: 'BATCH_CREATED'; batch: AttestationBatch }
  | { type: 'BATCH_ATTESTED'; batch: AttestationBatch }
  | { type: 'PIE_ROUTED'; pie: PaymentIntentEnvelope; result: RouteResult }
  | { type: 'PIE_SETTLED'; pie: PaymentIntentEnvelope; entry: LedgerEntry }
  | { type: 'ESCALATION_ALERT'; reason: string; data: any }
  | { type: 'MODE_CHANGED'; mode: 'test' | 'live' }
  | { type: 'REGIME_UPDATED'; summary: string; hash: string };

export type CARVEventHandler = (event: CARVEvent) => void;
