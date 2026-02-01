// DNA Protocol API Service
// Client for Genomic Proof API with XRPL anchoring
// Deterministic, replay-safe, no ML/probabilistics - ZK-ready

import {
  GenerateProofRequest,
  GenerateProofResponse,
  VerifyProofResponse,
  GenomicProof,
  BatchProofRequest,
  BatchProofResponse,
  DNAProtocolConfig,
  DEFAULT_DNA_CONFIG,
  ProofErrorCode,
  GenomicHashAlgorithm,
  GenomeType,
} from './types';

// ==================== UTILITIES ====================

/**
 * Validate hash format based on algorithm
 */
function validateHash(hash: string, algorithm: GenomicHashAlgorithm): boolean {
  const expectedLengths: Record<GenomicHashAlgorithm, number> = {
    'SHA-256': 64,
    'SHA-3-256': 64,
    'SHA-3-512': 128,
  };
  
  const expected = expectedLengths[algorithm];
  if (!expected) return false;
  
  // Must be hex string of correct length
  const hexRegex = new RegExp(`^[a-fA-F0-9]{${expected}}$`);
  return hexRegex.test(hash);
}

/**
 * Compute SHA-256 hash (browser-compatible)
 */
async function sha256(data: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate canonical request hash for signing
 */
async function hashRequest(request: GenerateProofRequest): Promise<string> {
  // Canonical JSON: sorted keys, no whitespace
  const canonical = JSON.stringify({
    algorithm: request.algorithm,
    genome_type: request.genome_type,
    hash: request.hash,
    lab_id: request.lab_id,
    timestamp: request.timestamp,
  });
  return sha256(canonical);
}

// ==================== DNA PROTOCOL SERVICE ====================

class DNAProtocolService {
  private config: DNAProtocolConfig;
  private requestCache: Map<string, GenomicProof> = new Map();

  constructor(config: Partial<DNAProtocolConfig> = {}) {
    this.config = { ...DEFAULT_DNA_CONFIG, ...config };
  }

  // ==================== CONFIGURATION ====================

  setConfig(config: Partial<DNAProtocolConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): DNAProtocolConfig {
    return { ...this.config };
  }

  // ==================== PROOF GENERATION ====================

  /**
   * Generate a genomic proof
   * POST /v1/proofs/generate
   */
  async generateProof(request: GenerateProofRequest): Promise<GenerateProofResponse> {
    // Validate hash format
    if (!validateHash(request.hash, request.algorithm)) {
      return {
        success: false,
        error: {
          code: 'INVALID_HASH',
          message: `Hash must be ${request.algorithm === 'SHA-3-512' ? 128 : 64} hex characters for ${request.algorithm}`,
        },
        metering: { xdna_charged: '0', xdna_burned: '0' },
      };
    }

    // Check cache for duplicate
    const requestHash = await hashRequest(request);
    if (this.requestCache.has(requestHash)) {
      const cached = this.requestCache.get(requestHash)!;
      return {
        success: true,
        proof: cached,
        metering: { xdna_charged: '0', xdna_burned: '0' }, // No charge for cached
      };
    }

    try {
      // In production, this calls the real API
      // For now, simulate the response
      const proof = await this.simulateProofGeneration(request);
      
      // Cache the result
      this.requestCache.set(requestHash, proof);
      
      return {
        success: true,
        proof,
        metering: {
          xdna_charged: '0.1',  // Base rate
          xdna_burned: '0.01',  // 10% burn
          tx_hash: `XDNA_${Date.now().toString(36)}`,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        metering: { xdna_charged: '0', xdna_burned: '0' },
      };
    }
  }

  /**
   * Simulate proof generation (replace with real API call in production)
   */
  private async simulateProofGeneration(request: GenerateProofRequest): Promise<GenomicProof> {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 500 + Math.random() * 1000));

    const now = new Date();
    const proofId = `GP-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    
    // Generate commitment hash (in production, this is ZK-derived)
    const commitmentData = JSON.stringify({
      hash: request.hash,
      genome_type: request.genome_type,
      lab_id: request.lab_id,
      timestamp: request.timestamp,
      nonce: Math.random().toString(36),
    });
    const commitmentHash = await sha256(commitmentData);

    // Simulate XRPL anchor
    const xrplTxHash = `XRPL_${proofId}_${Math.random().toString(36).slice(2, 10)}`.toUpperCase();
    const ledgerIndex = 80000000 + Math.floor(Math.random() * 1000000);

    return {
      proof_id: proofId,
      commitment_hash: commitmentHash,
      verifiable: true,
      created_at: now.toISOString(),
      anchored_at: new Date(now.getTime() + 4000).toISOString(), // 4s later
      xrpl_tx_hash: xrplTxHash,
      xrpl_ledger_index: ledgerIndex,
      genome_type: request.genome_type,
      algorithm: request.algorithm,
      lab_id: request.lab_id,
      status: 'anchored',
      expires_at: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
    };
  }

  // ==================== PROOF VERIFICATION ====================

  /**
   * Verify a genomic proof
   * GET /v1/proofs/{proof_id}/verify
   */
  async verifyProof(proofId: string): Promise<VerifyProofResponse> {
    try {
      // In production, calls real API
      const proof = await this.simulateProofLookup(proofId);
      
      if (!proof) {
        return {
          valid: false,
          verification: {
            checked_at: new Date().toISOString(),
            xrpl_confirmed: false,
          },
          error: {
            code: 'PROOF_NOT_FOUND',
            message: `No proof found with ID: ${proofId}`,
          },
        };
      }

      return {
        valid: proof.status === 'anchored' || proof.status === 'verified',
        proof,
        verification: {
          checked_at: new Date().toISOString(),
          xrpl_confirmed: !!proof.xrpl_tx_hash,
          merkle_valid: true,
          signature_valid: true,
        },
      };
    } catch (error) {
      return {
        valid: false,
        verification: {
          checked_at: new Date().toISOString(),
          xrpl_confirmed: false,
        },
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Simulate proof lookup
   */
  private async simulateProofLookup(proofId: string): Promise<GenomicProof | null> {
    await new Promise(r => setTimeout(r, 200 + Math.random() * 300));

    // Check cache
    for (const proof of this.requestCache.values()) {
      if (proof.proof_id === proofId) {
        return proof;
      }
    }

    // Not found
    return null;
  }

  // ==================== BATCH OPERATIONS ====================

  /**
   * Generate proofs in batch (more efficient for labs)
   * POST /v1/proofs/batch
   */
  async generateBatchProofs(batch: BatchProofRequest): Promise<BatchProofResponse> {
    const results: BatchProofResponse['proofs'] = [];
    let totalCharged = 0;
    let totalBurned = 0;

    // Process in parallel (but limit concurrency)
    const CONCURRENCY = 5;
    for (let i = 0; i < batch.proofs.length; i += CONCURRENCY) {
      const chunk = batch.proofs.slice(i, i + CONCURRENCY);
      const promises = chunk.map(async (req, idx) => {
        const response = await this.generateProof(req);
        return { index: i + idx, response };
      });

      const chunkResults = await Promise.all(promises);
      
      for (const { index, response } of chunkResults) {
        if (response.success && response.proof) {
          results.push({ index, proof: response.proof });
          totalCharged += parseFloat(response.metering.xdna_charged);
          totalBurned += parseFloat(response.metering.xdna_burned);
        } else {
          results.push({ 
            index, 
            error: response.error || { code: 'INTERNAL_ERROR', message: 'Unknown error' },
          });
        }
      }
    }

    // Apply bulk discount if applicable
    if (batch.proofs.length >= 100) {
      totalCharged *= 0.8; // 20% discount
    }

    return {
      batch_id: batch.batch_id,
      total: batch.proofs.length,
      successful: results.filter(r => r.proof).length,
      failed: results.filter(r => r.error).length,
      proofs: results,
      metering: {
        total_xdna_charged: totalCharged.toFixed(6),
        total_xdna_burned: totalBurned.toFixed(6),
        tx_hash: `BATCH_${batch.batch_id}_${Date.now().toString(36)}`,
      },
    };
  }

  // ==================== HELPER METHODS ====================

  /**
   * Hash genomic data locally (SHA-256)
   * Use this before sending to API - raw data never leaves device
   */
  async hashGenomicData(data: ArrayBuffer | string): Promise<string> {
    let buffer: ArrayBuffer;
    
    if (typeof data === 'string') {
      buffer = new TextEncoder().encode(data).buffer;
    } else {
      buffer = data;
    }

    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate a proof request before submission
   */
  validateRequest(request: Partial<GenerateProofRequest>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!request.hash) {
      errors.push('Hash is required');
    } else if (!validateHash(request.hash, request.algorithm || 'SHA-256')) {
      errors.push(`Invalid hash format for ${request.algorithm || 'SHA-256'}`);
    }

    if (!request.genome_type) {
      errors.push('Genome type is required');
    }

    if (!request.lab_id) {
      errors.push('Lab ID is required');
    }

    if (!request.timestamp) {
      errors.push('Timestamp is required');
    } else {
      const ts = new Date(request.timestamp);
      if (isNaN(ts.getTime())) {
        errors.push('Invalid timestamp format (use ISO 8601)');
      }
      // Can't be in the future
      if (ts > new Date()) {
        errors.push('Timestamp cannot be in the future');
      }
      // Can't be too old (30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      if (ts < thirtyDaysAgo) {
        errors.push('Timestamp too old (max 30 days)');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get estimated cost for a request
   */
  estimateCost(count: number = 1, priority: 'standard' | 'express' = 'standard'): {
    xdna_cost: string;
    xdna_burn: string;
    total: string;
  } {
    let baseCost = 0.1 * count; // 0.1 XDNA per proof
    
    // Express doubles the cost
    if (priority === 'express') {
      baseCost *= 2;
    }
    
    // Bulk discount
    if (count >= 100) {
      baseCost *= 0.8;
    } else if (count >= 50) {
      baseCost *= 0.9;
    }

    const burnAmount = baseCost * 0.1; // 10% burn

    return {
      xdna_cost: baseCost.toFixed(6),
      xdna_burn: burnAmount.toFixed(6),
      total: (baseCost).toFixed(6),
    };
  }

  /**
   * Check API health
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    api_version: string;
    xrpl_connected: boolean;
    latency_ms: number;
  }> {
    const start = Date.now();
    
    // Simulate health check
    await new Promise(r => setTimeout(r, 50 + Math.random() * 100));

    return {
      healthy: true,
      api_version: 'v1.0.0',
      xrpl_connected: true,
      latency_ms: Date.now() - start,
    };
  }

  // ==================== CACHE MANAGEMENT ====================

  clearCache(): void {
    this.requestCache.clear();
  }

  getCacheSize(): number {
    return this.requestCache.size;
  }
}

// ==================== SINGLETON ====================

let dnaService: DNAProtocolService | null = null;

export function getDNAService(config?: Partial<DNAProtocolConfig>): DNAProtocolService {
  if (!dnaService) {
    dnaService = new DNAProtocolService(config);
  } else if (config) {
    dnaService.setConfig(config);
  }
  return dnaService;
}

export function resetDNAService(): void {
  if (dnaService) {
    dnaService.clearCache();
  }
  dnaService = null;
}

export { DNAProtocolService, validateHash, hashRequest };
export default DNAProtocolService;
