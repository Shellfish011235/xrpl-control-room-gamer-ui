/**
 * Prediction Market Quant Formulas
 * Don't trade Polymarket (or other prediction markets) like a biased coin.
 * These 4 formulas are the minimum for assessing edge and calibration.
 *
 * 1. Probability (Monte Carlo): p̂ = (1/N) Σ 1_{A_i}
 * 2. Standard error: SE = √(p(1−p)/N)
 * 3. Brier score: BS = (1/N) Σ (p_i − y_i)²
 * 4. Effective sample size (particle filter): ESS = 1 / Σ w̃_i²
 */

// ==================== 1. MONTE CARLO PROBABILITY ====================

export interface MonteCarloResult {
  /** Estimated probability P(A) */
  probability: number;
  /** Standard error of the estimate */
  standardError: number;
  /** 95% confidence interval [lower, upper] */
  ci95: [number, number];
  /** Number of samples */
  N: number;
}

/**
 * Probability assessment (Monte Carlo).
 * p̂ = (1/N) Σ 1_{A_i}
 * Use when you have N simulated outcomes (1 = event occurred, 0 = not).
 */
export function monteCarloProbability(outcomes: number[]): MonteCarloResult {
  const N = outcomes.length;
  if (N === 0) {
    return { probability: 0, standardError: 0, ci95: [0, 0], N: 0 };
  }
  const p = outcomes.reduce((a, b) => a + b, 0) / N;
  const se = standardError(p, N);
  const z = 1.96;
  return {
    probability: p,
    standardError: se,
    ci95: [Math.max(0, p - z * se), Math.min(1, p + z * se)],
    N,
  };
}

// ==================== 2. STANDARD ERROR ====================

/**
 * Standard error of a probability estimate.
 * SE = √(p(1−p)/N)
 * If your estimate is 0.68 and SE = 0.02, and the market is 0.66,
 * your "edge" is within statistical error — don't trade on noise.
 */
export function standardError(p: number, N: number): number {
  if (N <= 0) return 0;
  const v = (p * (1 - p)) / N;
  return Math.sqrt(v);
}

/**
 * Sample size needed for ±target precision at 95% confidence (worst case p=0.5).
 * N ≈ (1.96 / target)² * 0.25
 */
export function sampleSizeForPrecision(targetPrecision: number): number {
  if (targetPrecision <= 0) return Infinity;
  return Math.ceil((1.96 / targetPrecision) ** 2 * 0.25);
}

// ==================== 3. BRIER SCORE ====================

/**
 * Brier score: calibration of probability predictions.
 * BS = (1/N) Σ (p_i − y_i)²
 * - predictions: your stated probabilities (0–1)
 * - outcomes: actual outcomes (1 = yes, 0 = no)
 * Below 0.20 = good. Below 0.10 = excellent.
 * Worse than ~0.20 → you're not systematically outperforming; filter for illusion of edge.
 */
export function brierScore(predictions: number[], outcomes: number[]): number {
  const n = Math.min(predictions.length, outcomes.length);
  if (n === 0) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const d = predictions[i] - outcomes[i];
    sum += d * d;
  }
  return sum / n;
}

/**
 * Brier score interpretation for UI.
 */
export function brierScoreInterpretation(bs: number): { level: string; color: string } {
  if (bs <= 0.1) return { level: 'Excellent', color: 'cyber-green' };
  if (bs <= 0.2) return { level: 'Good', color: 'cyber-cyan' };
  if (bs <= 0.25) return { level: 'Fair', color: 'cyber-yellow' };
  return { level: 'Poor (no systematic edge)', color: 'cyber-red' };
}

// ==================== 4. EFFECTIVE SAMPLE SIZE (PARTICLE FILTER) ====================

/**
 * Effective sample size: ESS = 1 / Σ w̃_i²
 * Normalized weights w̃_i (sum to 1). When ESS << N, resample.
 * Use when updating probability with new info: don't react to every price tick;
 * change in proportion to signal strength. Protects against emotional overreaction and noise.
 */
export function effectiveSampleSize(normalizedWeights: number[]): number {
  const sumSq = normalizedWeights.reduce((s, w) => s + w * w, 0);
  if (sumSq <= 0) return 0;
  return 1 / sumSq;
}

/**
 * Check if particle filter should resample (ESS < N/2).
 */
export function shouldResample(normalizedWeights: number[], N: number): boolean {
  return effectiveSampleSize(normalizedWeights) < N / 2;
}

// ==================== EDGE CHECK (YOUR ESTIMATE VS MARKET) ====================

export interface EdgeCheck {
  /** Your probability estimate */
  yourEstimate: number;
  /** Market-implied probability (e.g. Polymarket price) */
  marketPrice: number;
  /** Difference (your - market) */
  difference: number;
  /** Standard error of your estimate */
  standardError: number;
  /** True if |difference| > 1.96 * SE (statistically significant at 95%) */
  hasEdge: boolean;
  /** Short message for UI */
  message: string;
}

/**
 * Compare your Monte Carlo estimate to market price.
 * If difference is stable and |diff| > ~2*SE → edge is possible.
 * If within SE → edge is within statistical error; don't trade on noise.
 */
export function edgeCheck(
  yourEstimate: number,
  marketPrice: number,
  N: number
): EdgeCheck {
  const se = standardError(yourEstimate, N);
  const diff = yourEstimate - marketPrice;
  const hasEdge = N > 0 && Math.abs(diff) > 1.96 * se;
  let message: string;
  if (N === 0) message = 'No samples yet';
  else if (hasEdge) message = `Edge possible (|diff| > 2×SE). Consider position.`;
  else message = `Edge within statistical error. Avoid trading on noise.`;
  return {
    yourEstimate,
    marketPrice,
    difference: diff,
    standardError: se,
    hasEdge,
    message,
  };
}

// ==================== BINARY CONTRACT MONTE CARLO (GBM) ====================

export interface BinaryContractMCResult extends MonteCarloResult {
  /** Strike (threshold) used */
  strike: number;
  /** Initial asset price */
  S0: number;
}

/**
 * Monte Carlo for a binary contract: "Will asset exceed K by expiry?"
 * GBM: S_T = S0 * exp((μ - 0.5σ²)T + σ√T Z).
 * Returns probability P(S_T > K) with SE and 95% CI.
 */
export function simulateBinaryContract(
  S0: number,
  strike: number,
  mu: number,
  sigma: number,
  T: number,
  NPaths: number = 100_000,
  rng: () => number = Math.random
): BinaryContractMCResult {
  const outcomes: number[] = [];
  for (let i = 0; i < NPaths; i++) {
    const z = normalFromUniform(rng);
    const logReturn = (mu - 0.5 * sigma * sigma) * T + sigma * Math.sqrt(T) * z;
    const S_T = S0 * Math.exp(logReturn);
    outcomes.push(S_T > strike ? 1 : 0);
  }
  const mc = monteCarloProbability(outcomes);
  return { ...mc, strike, S0 };
}

/** Box-Muller: one normal from two uniforms (cache second for efficiency if needed). */
function normalFromUniform(u: () => number): number {
  const u1 = u();
  const u2 = u();
  if (u1 <= 0) return normalFromUniform(u);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
