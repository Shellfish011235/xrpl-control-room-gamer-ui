/**
 * CAR – Compute → Validate → Attest → Route.
 * Phase 2: ZK attestation, anomaly detection, circuit breakers.
 */

import type { PaymentIntentEnvelope } from '../../services/carv/types';

export interface ComputeInput {
  pie: PaymentIntentEnvelope;
  ledgerStateSnapshot?: string;
}

export interface ComputeOutput {
  route: string[];
  costEstimate: string;
  proofPayload?: string; // For zkVM: prove optimal route without exposing full logic
}

export interface AnomalySignal {
  type: 'fee_spike' | 'route_failure_streak' | 'volume_anomaly' | 'latency_spike';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
}

export interface CircuitBreakerState {
  paused: boolean;
  reason?: string;
  pausedAt?: string;
  lastAnomaly?: AnomalySignal;
}

export interface AttestationProof {
  proofType: 'zk-snark' | 'merkle' | 'signature';
  payload: string;
  publicInputs?: Record<string, string>;
  verified?: boolean;
}
