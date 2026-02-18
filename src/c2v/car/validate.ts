/**
 * CAR validate – validation + anomaly detection + circuit breaker.
 * If fees spike or routes fail repeatedly, trigger auto-pause with human alert.
 * Phase 2: Evolve from simple thresholds to ML thresholds on tx patterns.
 */

import type { PaymentIntentEnvelope } from '../../services/carv/types';
import type { AnomalySignal, CircuitBreakerState } from './types';

let circuitBreaker: CircuitBreakerState = { paused: false };
const failureStreakWindow: number[] = [];
const FAILURE_STREAK_THRESHOLD = 5;
const FEE_SPIKE_MULTIPLIER = 3;

export function getCircuitBreakerState(): CircuitBreakerState {
  return { ...circuitBreaker };
}

export function setCircuitBreakerPaused(paused: boolean, reason?: string): void {
  circuitBreaker = {
    paused,
    reason,
    pausedAt: paused ? new Date().toISOString() : undefined,
    lastAnomaly: circuitBreaker.lastAnomaly,
  };
}

/**
 * Record a route failure; may trigger circuit breaker.
 */
export function recordRouteFailure(): AnomalySignal | null {
  const now = Date.now();
  failureStreakWindow.push(now);
  const recent = failureStreakWindow.filter((t) => now - t < 60_000);
  // Keep window bounded (mutate in place for next call)
  failureStreakWindow.length = 0;
  failureStreakWindow.push(...recent);
  if (recent.length >= FAILURE_STREAK_THRESHOLD) {
    const signal: AnomalySignal = {
      type: 'route_failure_streak',
      severity: 'high',
      message: `${recent.length} route failures in last 60s`,
      timestamp: new Date().toISOString(),
    };
    setCircuitBreakerPaused(true, signal.message);
    return signal;
  }
  return null;
}

/**
 * Check fee against baseline; return anomaly if spike detected.
 */
export function checkFeeAnomaly(
  pie: PaymentIntentEnvelope,
  baselineFee: string
): AnomalySignal | null {
  const maxFee = parseFloat(pie.constraints?.max_fee ?? '0');
  const baseline = parseFloat(baselineFee);
  if (baseline > 0 && maxFee > baseline * FEE_SPIKE_MULTIPLIER) {
    return {
      type: 'fee_spike',
      severity: 'medium',
      message: `Fee ${maxFee} exceeds ${FEE_SPIKE_MULTIPLIER}x baseline ${baseline}`,
      timestamp: new Date().toISOString(),
    };
  }
  return null;
}

/**
 * Run validation + anomaly checks. Escalate only high-risk; reduce UI fatigue.
 */
export function validateWithAnomalyDetection(
  pie: PaymentIntentEnvelope,
  options?: { baselineFee?: string }
): { valid: boolean; anomaly?: AnomalySignal } {
  if (circuitBreaker.paused) {
    return {
      valid: false,
      anomaly: circuitBreaker.lastAnomaly ?? {
        type: 'route_failure_streak',
        severity: 'high',
        message: circuitBreaker.reason ?? 'Circuit breaker paused',
        timestamp: circuitBreaker.pausedAt ?? new Date().toISOString(),
      },
    };
  }

  const feeAnomaly = options?.baselineFee ? checkFeeAnomaly(pie, options.baselineFee) : null;
  if (feeAnomaly && feeAnomaly.severity === 'critical') {
    setCircuitBreakerPaused(true, feeAnomaly.message);
    return { valid: false, anomaly: feeAnomaly };
  }

  return { valid: true, anomaly: feeAnomaly ?? undefined };
}
