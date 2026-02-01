// DNA Protocol - Genomic Proof API Types
// Integration with $XDNA metered micropayments on XRPL
// Based on DNA Protocol's Genomic Proof API (dnaprotocol.org)

// ==================== CORE API TYPES ====================

/**
 * Supported hash algorithms for genomic data
 * Only SHA-256 and SHA-3 supported (no ML/probabilistic)
 */
export type GenomicHashAlgorithm = 'SHA-256' | 'SHA-3-256' | 'SHA-3-512';

/**
 * Genome types supported by the protocol
 */
export type GenomeType = 
  | 'whole_genome'      // Full WGS data
  | 'exome'             // Whole exome sequencing
  | 'snp_panel'         // SNP genotyping array
  | 'methylation'       // Epigenetic methylation data
  | 'microbiome'        // Gut/oral microbiome
  | 'mitochondrial';    // mtDNA sequences

/**
 * Proof status in the system
 */
export type ProofStatus = 
  | 'pending'           // Submitted, awaiting XRPL anchor
  | 'anchored'          // Successfully anchored on XRPL
  | 'verified'          // Verified by third party
  | 'expired'           // Past retention period
  | 'revoked';          // Manually revoked by lab

// ==================== API REQUEST/RESPONSE ====================

/**
 * POST /v1/proofs/generate request body
 */
export interface GenerateProofRequest {
  hash: string;                    // SHA-256/3 hash of genomic data (hex, 64/128 chars)
  genome_type: GenomeType;         // Type of genomic data
  algorithm: GenomicHashAlgorithm; // Hash algorithm used
  lab_id: string;                  // Registered lab identifier
  timestamp: string;               // ISO 8601 timestamp of hashing
  subject_id?: string;             // Optional anonymized subject reference
  metadata?: {
    coverage?: number;             // Sequencing coverage (e.g., 30x)
    quality_score?: number;        // Q-score or similar
    panel_version?: string;        // For SNP panels
    reference_genome?: string;     // e.g., GRCh38, hg38
  };
}

/**
 * Genomic proof object returned by API
 */
export interface GenomicProof {
  proof_id: string;                // Unique proof identifier (UUID)
  commitment_hash: string;         // Commitment hash anchored on XRPL
  verifiable: boolean;             // Whether proof is verifiable
  created_at: string;              // ISO 8601 creation timestamp
  anchored_at?: string;            // When anchored on XRPL (if complete)
  xrpl_tx_hash?: string;           // XRPL transaction hash
  xrpl_ledger_index?: number;      // Ledger index of anchor
  
  // Original request data (hashed, not stored)
  genome_type: GenomeType;
  algorithm: GenomicHashAlgorithm;
  lab_id: string;
  
  // Verification data
  merkle_root?: string;            // If part of batch anchor
  merkle_proof?: string[];         // Path to verify in batch
  
  status: ProofStatus;
  expires_at?: string;             // Proof expiration (if applicable)
}

/**
 * POST /v1/proofs/generate response
 */
export interface GenerateProofResponse {
  success: boolean;
  proof?: GenomicProof;
  error?: {
    code: ProofErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
  metering: {
    xdna_charged: string;          // Amount of $XDNA charged
    xdna_burned: string;           // Amount burned (subset of charged)
    tx_hash?: string;              // $XDNA payment tx hash
  };
}

/**
 * GET /v1/proofs/{proof_id}/verify response
 */
export interface VerifyProofResponse {
  valid: boolean;
  proof?: GenomicProof;
  verification: {
    checked_at: string;
    xrpl_confirmed: boolean;
    merkle_valid?: boolean;
    signature_valid?: boolean;
  };
  error?: {
    code: ProofErrorCode;
    message: string;
  };
}

/**
 * Error codes from API
 */
export type ProofErrorCode = 
  | 'INVALID_HASH'                 // Hash format/length invalid
  | 'INVALID_ALGORITHM'            // Unsupported hash algorithm
  | 'INVALID_LAB_ID'               // Lab not registered
  | 'INVALID_GENOME_TYPE'          // Unknown genome type
  | 'DUPLICATE_HASH'               // Hash already anchored
  | 'INSUFFICIENT_XDNA'            // Not enough $XDNA for metering
  | 'RATE_LIMITED'                 // Too many requests
  | 'XRPL_UNAVAILABLE'             // XRPL network issue
  | 'PROOF_NOT_FOUND'              // Proof ID doesn't exist
  | 'PROOF_EXPIRED'                // Proof past retention
  | 'INTERNAL_ERROR';              // Server error

// ==================== $XDNA TOKEN ====================

/**
 * $XDNA token configuration on XRPL
 */
export interface XDNATokenConfig {
  currency: 'XDNA';
  issuer: string;                  // Token issuer address on XRPL
  decimals: 6;
  
  // Metering rates (in XDNA)
  rates: {
    proof_generation: string;      // Cost per proof generation
    proof_verification: string;    // Cost per verification
    bulk_discount_threshold: number; // Number of proofs for bulk rate
    bulk_discount_percent: number; // Discount percentage for bulk
  };
  
  // Burn mechanism
  burn: {
    rate_percent: number;          // % of each tx burned (e.g., 10%)
    burn_address: string;          // Burn destination (usually issuer)
  };
}

/**
 * $XDNA balance and metering state
 */
export interface XDNAMeteringState {
  balance: string;                 // Current $XDNA balance
  daily_spent: string;             // Spent today
  daily_burned: string;            // Burned today
  proofs_generated: number;        // Count today
  proofs_verified: number;         // Count today
  last_tx_at?: string;             // Last metering tx timestamp
}

// ==================== CARV INTEGRATION ====================

/**
 * Genomic proof request wrapped in CARV cognitive layer
 * Uses OODA loop for decision-making before proof generation
 */
export interface GenomicProofIntent {
  intent_id: string;
  
  // Request details
  request: GenerateProofRequest;
  
  // Cognitive evaluation (OODA)
  ooda: {
    observe: {
      lab_reputation?: number;     // Lab trust score
      genome_type_risk?: string;   // Risk level of data type
      cost_estimate: string;       // Estimated $XDNA cost
    };
    orient: {
      compliance_check?: boolean;  // Regulatory compliance
      privacy_verified?: boolean;  // No PII in metadata
      hash_validated?: boolean;    // Hash format correct
    };
    decide: {
      approved: boolean;
      reasoning: string;
      max_xdna_spend: string;      // Budget cap
    };
    act?: {
      submitted_at?: string;
      proof_id?: string;
      tx_hash?: string;
    };
  };
  
  // PIE for payment
  pie?: {
    intent_id: string;
    payer: string;
    payee: string;                 // DNA Protocol treasury
    amount: string;
    asset: 'XDNA';
    burn_amount: string;           // Amount to burn
    expiry: string;
    proofs: {
      request_hash: string;        // Hash of proof request
      ooda_hash: string;           // Hash of OODA state
      regime_hash: string;         // CARV regime hash
    };
  };
  
  // Result
  result?: GenomicProof;
  error?: string;
  
  status: 'draft' | 'approved' | 'paying' | 'generating' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
}

/**
 * Lab registration for API access
 */
export interface RegisteredLab {
  lab_id: string;
  name: string;
  country: string;
  accreditation?: string[];        // e.g., CAP, CLIA, ISO 15189
  xdna_address: string;            // Lab's $XDNA wallet
  api_key_hash: string;            // Hashed API key
  created_at: string;
  status: 'active' | 'suspended' | 'pending';
}

// ==================== BULK OPERATIONS ====================

/**
 * Batch proof generation request
 */
export interface BatchProofRequest {
  batch_id: string;
  lab_id: string;
  proofs: GenerateProofRequest[];
  priority: 'standard' | 'express';
  callback_url?: string;           // Webhook for completion
}

/**
 * Batch proof response
 */
export interface BatchProofResponse {
  batch_id: string;
  total: number;
  successful: number;
  failed: number;
  proofs: Array<{
    index: number;
    proof?: GenomicProof;
    error?: { code: ProofErrorCode; message: string };
  }>;
  metering: {
    total_xdna_charged: string;
    total_xdna_burned: string;
    tx_hash: string;
  };
}

// ==================== EVENTS ====================

export type DNAProtocolEvent =
  | { type: 'PROOF_REQUESTED'; intent: GenomicProofIntent }
  | { type: 'PROOF_APPROVED'; intent: GenomicProofIntent }
  | { type: 'XDNA_PAYMENT_SENT'; intent: GenomicProofIntent; tx_hash: string }
  | { type: 'PROOF_GENERATED'; intent: GenomicProofIntent; proof: GenomicProof }
  | { type: 'PROOF_FAILED'; intent: GenomicProofIntent; error: string }
  | { type: 'PROOF_VERIFIED'; proof_id: string; valid: boolean }
  | { type: 'XDNA_BURNED'; amount: string; tx_hash: string }
  | { type: 'BALANCE_UPDATED'; balance: string };

export type DNAProtocolEventHandler = (event: DNAProtocolEvent) => void;

// ==================== CONFIGURATION ====================

export interface DNAProtocolConfig {
  api_base_url: string;            // e.g., https://api.dnaprotocol.org/v1
  api_key?: string;                // Lab API key (if acting as lab)
  xdna_issuer: string;             // $XDNA issuer address
  treasury_address: string;        // DNA Protocol treasury for payments
  burn_address: string;            // Burn destination
  
  // Defaults
  default_genome_type: GenomeType;
  default_algorithm: GenomicHashAlgorithm;
  
  // Safety
  max_xdna_per_request: string;    // Cap per single request
  max_xdna_per_day: string;        // Daily cap
  require_ooda_approval: boolean;  // Require cognitive approval
  
  // Network
  xrpl_network: 'mainnet' | 'testnet' | 'devnet';
  timeout_ms: number;
}

export const DEFAULT_DNA_CONFIG: DNAProtocolConfig = {
  api_base_url: 'https://api.dnaprotocol.org/v1',
  xdna_issuer: 'rXDNAissuerAddressPlaceholder', // Real issuer TBD
  treasury_address: 'rDNATreasuryAddressPlaceholder',
  burn_address: 'rXDNABurnAddressPlaceholder',
  default_genome_type: 'snp_panel',
  default_algorithm: 'SHA-256',
  max_xdna_per_request: '10',      // 10 XDNA max per request
  max_xdna_per_day: '1000',        // 1000 XDNA daily cap
  require_ooda_approval: true,
  xrpl_network: 'mainnet',
  timeout_ms: 30000,
};

// Default metering rates (will be fetched from API)
export const DEFAULT_XDNA_RATES = {
  proof_generation: '0.1',         // 0.1 XDNA per proof
  proof_verification: '0.01',      // 0.01 XDNA per verification
  bulk_discount_threshold: 100,
  bulk_discount_percent: 20,
  burn_rate_percent: 10,           // 10% burned on each tx
};
