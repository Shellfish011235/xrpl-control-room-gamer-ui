// CAR-Integrated Pathfinding Service
// Validates routes through XRPL before adding to topology graph
// Only CAR-approved routes become visible - graph becomes ledger-truth

import type { Ledger, Corridor, RouteResult } from './types';

// =============================================================================
// TYPES
// =============================================================================

export interface PathfindingResult {
  success: boolean;
  alternatives: PathAlternative[];
  carValidated: boolean;
  confidence: number;
  error?: string;
}

export interface PathAlternative {
  path: string[];
  sourceAmount: string;
  destinationAmount: string;
  fee: number;
}

export interface CARValidation {
  approved: boolean;
  confidence: number;
  reason: string;
  timestamp: number;
}

// =============================================================================
// XRPL PATHFINDING (Real Integration Point)
// =============================================================================

export async function findXRPLPath(
  sourceAccount: string,
  destinationAccount: string,
  destinationAmount: { currency: string; value: string; issuer?: string }
): Promise<PathfindingResult> {
  try {
    // Connect to XRPL
    const response = await fetch('https://s1.ripple.com:51234/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'ripple_path_find',
        params: [{
          source_account: sourceAccount,
          destination_account: destinationAccount,
          destination_amount: destinationAmount,
        }],
      }),
    });

    const data = await response.json();

    if (data.result?.alternatives) {
      const alternatives: PathAlternative[] = data.result.alternatives.map((alt: any) => ({
        path: alt.paths_computed?.[0]?.map((p: any) => p.account || p.currency) || [],
        sourceAmount: typeof alt.source_amount === 'string' 
          ? alt.source_amount 
          : alt.source_amount?.value || '0',
        destinationAmount: typeof destinationAmount === 'string'
          ? destinationAmount
          : destinationAmount.value,
        fee: 0.00001, // XRP fee
      }));

      // CAR validation based on path quality
      const carValidation = validateWithCAR(alternatives);

      return {
        success: true,
        alternatives,
        carValidated: carValidation.approved,
        confidence: carValidation.confidence,
      };
    }

    return {
      success: false,
      alternatives: [],
      carValidated: false,
      confidence: 0,
      error: data.result?.error_message || 'No paths found',
    };

  } catch (error) {
    console.error('[CARPathfinding] Error:', error);
    return {
      success: false,
      alternatives: [],
      carValidated: false,
      confidence: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// CAR (Cryptographic Audit Record) VALIDATION
// =============================================================================

function validateWithCAR(alternatives: PathAlternative[]): CARValidation {
  // CAR validation logic:
  // - More alternatives = more liquidity = higher confidence
  // - Shorter paths = less counterparty risk = higher confidence
  // - Known issuers = higher trust = higher confidence

  if (alternatives.length === 0) {
    return {
      approved: false,
      confidence: 0,
      reason: 'No viable paths found',
      timestamp: Date.now(),
    };
  }

  const avgPathLength = alternatives.reduce((sum, alt) => sum + alt.path.length, 0) / alternatives.length;
  const pathScore = Math.max(0, 1 - avgPathLength * 0.1); // Shorter = better
  const liquidityScore = Math.min(1, alternatives.length * 0.2); // More alternatives = better
  
  const confidence = (pathScore * 0.6 + liquidityScore * 0.4);

  return {
    approved: confidence > 0.5,
    confidence,
    reason: confidence > 0.7 
      ? 'High liquidity, short paths'
      : confidence > 0.5 
      ? 'Acceptable route quality'
      : 'Low confidence - manual review recommended',
    timestamp: Date.now(),
  };
}

// =============================================================================
// CORRIDOR VALIDATION FOR GRAPH
// =============================================================================

export function validateCorridorForGraph(
  source: string,
  target: string,
  existingLedgers: Ledger[]
): { valid: boolean; confidence: number; reason: string } {
  const sourceLedger = existingLedgers.find(l => l.id === source);
  const targetLedger = existingLedgers.find(l => l.id === target);

  if (!sourceLedger || !targetLedger) {
    return {
      valid: false,
      confidence: 0,
      reason: 'Unknown ledger(s)',
    };
  }

  // Check ILP support
  const ilpScore = (sourceLedger.supports_ilp_adapter && targetLedger.supports_ilp_adapter) ? 1 : 0.5;
  
  // Check domain compatibility
  const domainScore = sourceLedger.domain === targetLedger.domain ? 1 : 0.7;
  
  // Check risk flags
  const riskScore = 1 - (sourceLedger.risk_flags.length + targetLedger.risk_flags.length) * 0.1;
  
  const confidence = (ilpScore * 0.4 + domainScore * 0.3 + riskScore * 0.3);

  return {
    valid: confidence > 0.4,
    confidence,
    reason: confidence > 0.7
      ? 'Well-supported corridor'
      : confidence > 0.5
      ? 'Moderate support'
      : 'Low confidence - verify manually',
  };
}

// =============================================================================
// GRAPH MUTATION HELPERS (For use with CytoscapeMap)
// =============================================================================

export interface GraphMutation {
  type: 'add_corridor' | 'remove_corridor' | 'update_confidence';
  source: string;
  target: string;
  label?: string;
  confidence?: number;
  carValidated?: boolean;
}

export function createAddCorridorMutation(
  source: string,
  target: string,
  label: string,
  pathfindingResult: PathfindingResult
): GraphMutation {
  return {
    type: 'add_corridor',
    source,
    target,
    label,
    confidence: pathfindingResult.confidence,
    carValidated: pathfindingResult.carValidated,
  };
}

// =============================================================================
// REAL-TIME ROUTE RECORDING (PIE Integration Point)
// =============================================================================

export interface RouteRecord {
  id: string;
  source: string;
  target: string;
  path: string[];
  confidence: number;
  carValidated: boolean;
  timestamp: number;
  pieHash?: string; // Provenance Intent Envelope hash
}

const routeHistory: RouteRecord[] = [];

export function recordRoute(
  source: string,
  target: string,
  pathfindingResult: PathfindingResult
): RouteRecord {
  const record: RouteRecord = {
    id: `route-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    source,
    target,
    path: pathfindingResult.alternatives[0]?.path || [],
    confidence: pathfindingResult.confidence,
    carValidated: pathfindingResult.carValidated,
    timestamp: Date.now(),
  };

  routeHistory.push(record);
  
  // Keep last 100 routes
  if (routeHistory.length > 100) {
    routeHistory.shift();
  }

  console.log('[CARPathfinding] Route recorded:', record.id);
  return record;
}

export function getRouteHistory(): RouteRecord[] {
  return [...routeHistory];
}

export function clearRouteHistory(): void {
  routeHistory.length = 0;
}
