// DNA Protocol Integration
// Genomic Proof API with $XDNA metered micropayments on XRPL
//
// Architecture:
// ┌─────────────────────────────────────────────────────────────┐
// │                    GenomicProofAgent                        │
// │  (CARV Cognitive Layer - OODA loop + PIE generation)       │
// ├─────────────────────────────────────────────────────────────┤
// │    ┌──────────────────┐    ┌──────────────────────┐        │
// │    │ DNAProtocolService│    │  XDNAMeteringService │        │
// │    │ (API Client)      │    │  (Token Payments)    │        │
// │    └────────┬─────────┘    └──────────┬───────────┘        │
// │             │                          │                    │
// │             ▼                          ▼                    │
// │    ┌──────────────────────────────────────────────┐        │
// │    │              XRPL Network                     │        │
// │    │  (Proof anchoring + $XDNA transfers + burns) │        │
// │    └──────────────────────────────────────────────┘        │
// └─────────────────────────────────────────────────────────────┘
//
// Usage:
//   import { getGenomicProofAgent } from '@/services/dna';
//   
//   const agent = getGenomicProofAgent();
//   agent.setWallet('rYourXRPLAddress...');
//   
//   const result = await agent.generateProofWithCognition({
//     hash: 'SHA256_HASH_OF_GENOMIC_DATA',
//     genome_type: 'snp_panel',
//     algorithm: 'SHA-256',
//     lab_id: 'accredited_lab_001',
//     timestamp: new Date().toISOString(),
//   });

// ==================== TYPES ====================

export type {
  // Core API types
  GenerateProofRequest,
  GenerateProofResponse,
  VerifyProofResponse,
  GenomicProof,
  GenomeType,
  GenomicHashAlgorithm,
  ProofStatus,
  ProofErrorCode,
  
  // Batch operations
  BatchProofRequest,
  BatchProofResponse,
  
  // $XDNA token
  XDNATokenConfig,
  XDNAMeteringState,
  
  // CARV integration
  GenomicProofIntent,
  
  // Labs
  RegisteredLab,
  
  // Events
  DNAProtocolEvent,
  DNAProtocolEventHandler,
  
  // Configuration
  DNAProtocolConfig,
} from './types';

export {
  DEFAULT_DNA_CONFIG,
  DEFAULT_XDNA_RATES,
} from './types';

// ==================== SERVICES ====================

// DNA Protocol API Service
export {
  DNAProtocolService,
  getDNAService,
  resetDNAService,
} from './dnaProtocolService';

// $XDNA Metering Service
export {
  XDNAMeteringService,
  getXDNAMetering,
  resetXDNAMetering,
  XDNA_CONFIG,
} from './xdnaMetering';

export type {
  MeteringTransaction,
  MeteringEvent,
  MeteringEventHandler,
} from './xdnaMetering';

// Genomic Proof Agent (main entry point)
export {
  GenomicProofAgent,
  getGenomicProofAgent,
  resetGenomicProofAgent,
} from './genomicProofAgent';

export type {
  GenomicProofAgentConfig,
  OODAEvaluation,
  GenomicProofResult,
} from './genomicProofAgent';

// ==================== CONVENIENCE FUNCTIONS ====================

import { getGenomicProofAgent } from './genomicProofAgent';
import type { GenerateProofRequest, GenomicProof } from './types';

/**
 * Quick helper to generate a genomic proof
 * Sets up agent, runs OODA evaluation, handles payment, returns proof
 */
export async function generateGenomicProof(
  request: GenerateProofRequest,
  walletAddress?: string
): Promise<{
  success: boolean;
  proof?: GenomicProof;
  xdna_spent?: string;
  error?: string;
}> {
  const agent = getGenomicProofAgent();
  
  if (walletAddress) {
    agent.setWallet(walletAddress);
  }

  const result = await agent.generateProofWithCognition(request);

  return {
    success: result.success,
    proof: result.proof,
    xdna_spent: result.metering.xdna_charged,
    error: result.error,
  };
}

/**
 * Quick helper to verify a proof
 */
export async function verifyGenomicProof(proofId: string): Promise<{
  valid: boolean;
  proof?: GenomicProof;
  error?: string;
}> {
  const agent = getGenomicProofAgent();
  return agent.verifyProof(proofId);
}

/**
 * Hash genomic data locally (never leaves device)
 * Use this before calling generateGenomicProof
 */
export async function hashGenomicData(data: ArrayBuffer | string): Promise<string> {
  const { getDNAService } = await import('./dnaProtocolService');
  return getDNAService().hashGenomicData(data);
}
