// CARV - Payment Intent Envelope Generator
// Creates and signs PIEs with salience anchoring

import { 
  PaymentIntentEnvelope, 
  PIEConstraints, 
  PIEProofs,
  SignedPIE,
  VenueType 
} from './types';

// ==================== UTILITIES ====================

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * SHA-256 hash (browser-compatible)
 */
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Sync hash for quick hashing (non-cryptographic, for display only)
 */
function quickHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

// ==================== PIE GENERATOR ====================

export interface PIEGeneratorConfig {
  model_version: string;
  default_venue: VenueType;
  default_max_fee: string;
  default_slippage_bps: number;
}

const DEFAULT_CONFIG: PIEGeneratorConfig = {
  model_version: 'grok-4',
  default_venue: 'xrpl',
  default_max_fee: '0.00001',
  default_slippage_bps: 20,
};

export interface GeneratePIEParams {
  prompt: string;
  payer: string;
  payee: string;
  amount: number;
  asset: string;
  regime_summary: string;
  venue?: VenueType;
  constraints?: Partial<PIEConstraints>;
  metadata?: Record<string, any>;
}

/**
 * Generate a Payment Intent Envelope with salience anchoring
 */
export async function generatePIE(
  params: GeneratePIEParams,
  config: PIEGeneratorConfig = DEFAULT_CONFIG
): Promise<PaymentIntentEnvelope> {
  const {
    prompt,
    payer,
    payee,
    amount,
    asset,
    regime_summary,
    venue = config.default_venue,
    constraints = {},
    metadata = {},
  } = params;

  const now = new Date();
  const expiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Generate hashes for proofs
  const market_snapshot_hash = await sha256(prompt);
  const regime_summary_hash = regime_summary 
    ? await sha256(regime_summary) 
    : '0xnone';
  const features_hash = await sha256(JSON.stringify({ amount, asset, venue }));

  const pie: PaymentIntentEnvelope = {
    intent_id: generateUUID(),
    payer,
    payee,
    amount: amount.toString(),
    asset: asset.toUpperCase(),
    expiry: expiry.toISOString(),
    created_at: now.toISOString(),
    status: 'pending',
    constraints: {
      max_fee: constraints.max_fee || config.default_max_fee,
      slippage_bps: constraints.slippage_bps || config.default_slippage_bps,
      venue: venue,
      min_fill_percent: constraints.min_fill_percent,
      time_in_force: constraints.time_in_force,
    },
    proofs: {
      market_snapshot_hash: market_snapshot_hash.slice(0, 16),
      model_version: config.model_version,
      features_hash: features_hash.slice(0, 16),
      regime_summary_hash: regime_summary_hash.slice(0, 16),
      compute_timestamp: now.toISOString(),
      prompt_hash: quickHash(prompt),
    },
    metadata,
  };

  return pie;
}

/**
 * Generate PIE synchronously (uses quick hash, for UI responsiveness)
 */
export function generatePIESync(
  params: GeneratePIEParams,
  config: PIEGeneratorConfig = DEFAULT_CONFIG
): PaymentIntentEnvelope {
  const {
    prompt,
    payer,
    payee,
    amount,
    asset,
    regime_summary,
    venue = config.default_venue,
    constraints = {},
    metadata = {},
  } = params;

  const now = new Date();
  const expiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const pie: PaymentIntentEnvelope = {
    intent_id: generateUUID(),
    payer,
    payee,
    amount: amount.toString(),
    asset: asset.toUpperCase(),
    expiry: expiry.toISOString(),
    created_at: now.toISOString(),
    status: 'pending',
    constraints: {
      max_fee: constraints.max_fee || config.default_max_fee,
      slippage_bps: constraints.slippage_bps || config.default_slippage_bps,
      venue: venue,
      min_fill_percent: constraints.min_fill_percent,
      time_in_force: constraints.time_in_force,
    },
    proofs: {
      market_snapshot_hash: quickHash(prompt + Date.now()),
      model_version: config.model_version,
      features_hash: quickHash(JSON.stringify({ amount, asset, venue })),
      regime_summary_hash: regime_summary ? quickHash(regime_summary) : '0xnone',
      compute_timestamp: now.toISOString(),
      prompt_hash: quickHash(prompt),
    },
    metadata,
  };

  return pie;
}

// ==================== SIGNING ====================

/**
 * Sign a PIE (simulated - in production use WebCrypto or hardware wallet)
 * For XRPL integration, this would connect to the wallet
 */
export async function signPIE(
  pie: PaymentIntentEnvelope,
  privateKeyHex?: string
): Promise<SignedPIE> {
  // In production, this would use actual cryptographic signing
  // For now, we create a simulated signature
  const pieJson = JSON.stringify(pie);
  const signatureHash = await sha256(pieJson + (privateKeyHex || 'demo-key'));
  
  return {
    pie,
    signature: signatureHash,
    signer: pie.payer,
    algorithm: 'ECDSA-secp256k1',
  };
}

/**
 * Verify a signed PIE
 */
export async function verifySignedPIE(signedPie: SignedPIE): Promise<boolean> {
  // In production, verify against public key
  // For now, just check signature exists and is valid format
  return (
    signedPie.signature.length === 64 &&
    signedPie.signer === signedPie.pie.payer
  );
}

// ==================== LLM COMPUTE WRAPPER ====================

export interface ComputeParams {
  task: string;
  regime_summary: string;
  payer: string;
  payee: string;
  suggested_amount: number;
  asset: string;
  venue?: VenueType;
}

/**
 * Mock LLM compute - wraps task in PIE
 * In production, this would call actual LLM API with anchored prompt
 */
export async function computeWithLLM(params: ComputeParams): Promise<PaymentIntentEnvelope> {
  const anchoredPrompt = `
Regime Context: ${params.regime_summary}
Task: ${params.task}
→ Generate strict PIE JSON for payment intent
  `.trim();

  return generatePIE({
    prompt: anchoredPrompt,
    payer: params.payer,
    payee: params.payee,
    amount: params.suggested_amount,
    asset: params.asset,
    regime_summary: params.regime_summary,
    venue: params.venue,
  });
}

/**
 * Batch generate PIEs
 */
export async function generatePIEBatch(
  paramsList: GeneratePIEParams[],
  config?: PIEGeneratorConfig
): Promise<PaymentIntentEnvelope[]> {
  return Promise.all(paramsList.map(params => generatePIE(params, config)));
}

export default {
  generatePIE,
  generatePIESync,
  signPIE,
  verifySignedPIE,
  computeWithLLM,
  generatePIEBatch,
};
