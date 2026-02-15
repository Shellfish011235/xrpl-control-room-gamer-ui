/**
 * Multi-Agent Prisoner's Dilemma Simulator (CrewAI-inspired)
 * Lightweight JS agents: PlayerAgent, OpponentAgent, AnalystAgent.
 * Uses XRPL price volatility from live prices; runs 10 rounds and computes Nash payoff matrix.
 * Modular for future OpenClaw micropayment hooks (e.g., reward agents via XRPL tx).
 */

import { fetchLivePrices } from './livePrices';

// ==================== TYPES ====================

export type PrisonerAction = 'cooperate' | 'defect';

export interface AgentDecision {
  action: PrisonerAction;
  confidence: number; // 0–1
}

export interface RoundResult {
  round: number;
  playerAction: PrisonerAction;
  opponentAction: PrisonerAction;
  playerPayoff: number;
  opponentPayoff: number;
  /** Nash equilibrium suggestion from AnalystAgent for next round */
  suggestedStrategy?: string;
  /** Payoff matrix used this round (2x2: rows = player C/D, cols = opponent C/D) */
  payoffMatrix: number[][];
}

export interface SimulationResult {
  rounds: RoundResult[];
  totalPlayerPayoff: number;
  totalOpponentPayoff: number;
  /** Final Nash equilibrium recommendation */
  finalNashSuggestion: string;
  /** Volatility used (from XRP or default) */
  volatilityUsed: number;
  /** XRP price at run time (if available) */
  xrpPriceAtRun?: number;
  error?: string;
}

/** Default Prisoner's Dilemma payoffs: rows = player (C, D), cols = opponent (C, D). */
const DEFAULT_PAYOFF_MATRIX: number[][] = [
  [3, 0], // player Cooperate: (C,C)=3, (C,D)=0
  [5, 1], // player Defect:    (D,C)=5, (D,D)=1
];

// ==================== PLAYER AGENT ====================

/**
 * Simulates user decisions (cooperate/defect) based on random strategy
 * with XRPL price volatility input: higher volatility → more randomness.
 */
export class PlayerAgent {
  /** Volatility 0–1: higher = more random choices. */
  private volatility: number = 0.2;

  setVolatility(v: number) {
    this.volatility = Math.max(0, Math.min(1, v));
  }

  act(): AgentDecision {
    const noise = this.volatility * (Math.random() - 0.5);
    const cooperateBias = 0.5 + noise;
    const cooperate = Math.random() < cooperateBias;
    const action: PrisonerAction = cooperate ? 'cooperate' : 'defect';
    const confidence = Math.abs(cooperateBias - 0.5) * 2; // 0 when 50/50, 1 when extreme
    return { action, confidence: Math.min(1, Math.max(0, confidence)) };
  }
}

// ==================== OPPONENT AGENT ====================

/**
 * Mirrors player tendency but with "whale" bias: defects more when XRP price > threshold.
 */
export class OpponentAgent {
  private xrpPrice: number = 1;
  private whaleThreshold: number;
  /** Last known player action for mirroring. */
  private lastPlayerAction: PrisonerAction | null = null;

  constructor(whaleThreshold: number = 2.0) {
    this.whaleThreshold = whaleThreshold;
  }

  setXrpPrice(price: number) {
    this.xrpPrice = price;
  }

  setLastPlayerAction(action: PrisonerAction) {
    this.lastPlayerAction = action;
  }

  act(): AgentDecision {
    const isWhaleRegime = this.xrpPrice > this.whaleThreshold;
    const defectBias = isWhaleRegime ? 0.6 : 0.4;
    const mirrorBias = this.lastPlayerAction === 'defect' ? 0.7 : 0.3;
    const pDefect = defectBias * 0.6 + (this.lastPlayerAction === 'defect' ? mirrorBias : 1 - mirrorBias) * 0.4;
    const defect = Math.random() < pDefect;
    const action: PrisonerAction = defect ? 'defect' : 'cooperate';
    const confidence = Math.abs(pDefect - 0.5) * 2;
    return { action, confidence: Math.min(1, Math.max(0, confidence)) };
  }
}

// ==================== ANALYST AGENT ====================

/**
 * Computes Nash equilibrium payoff matrix after each round using simple matrix math (no external libs).
 * Suggests optimal strategy (cooperate/defect) based on current payoff matrix.
 */
export class AnalystAgent {
  /**
   * For 2x2 symmetric PD: check for dominant strategy and pure Nash.
   * Returns suggested action and short reasoning.
   */
  act(payoffMatrix: number[][]): { action: PrisonerAction; confidence: number; suggestion: string } {
    const [r0, r1] = payoffMatrix;
    if (!r0 || !r1 || r0.length < 2 || r1.length < 2) {
      return { action: 'cooperate', confidence: 0, suggestion: 'Invalid matrix' };
    }
    // Player payoffs: row 0 = cooperate, row 1 = defect (vs opponent C, D)
    const cc = r0[0], cd = r0[1], dc = r1[0], dd = r1[1];
    const defectDominates = dc >= cc && dd >= cd && (dc > cc || dd > cd);
    const cooperateDominates = cc >= dc && cd >= dd && (cc > dc || cd > dd);
    let action: PrisonerAction = 'cooperate';
    let suggestion: string;
    let confidence: number;
    if (defectDominates) {
      action = 'defect';
      suggestion = 'Defect is dominant (Nash: both defect)';
      confidence = 0.9;
    } else if (cooperateDominates) {
      action = 'cooperate';
      suggestion = 'Cooperate is dominant (Nash: both cooperate)';
      confidence = 0.9;
    } else {
      // Mixed or (C,C) Pareto better
      const mutualCoop = cc;
      const mutualDefect = dd;
      if (mutualCoop >= mutualDefect) {
        action = 'cooperate';
        suggestion = 'Pareto-superior outcome favors cooperate (if opponent cooperates)';
        confidence = 0.6;
      } else {
        action = 'defect';
        suggestion = 'Nash equilibrium favors defect (suboptimal collectively)';
        confidence = 0.7;
      }
    }
    return { action, confidence, suggestion };
  }

  /** Build 2x2 payoff matrix from standard PD numbers. */
  static getPayoffMatrix(): number[][] {
    return DEFAULT_PAYOFF_MATRIX.map(row => [...row]);
  }
}

// ==================== SIMULATION ====================

const NUM_ROUNDS = 10;

/**
 * Fetches XRP price and volatility (using 24h change % as proxy), then runs simulation.
 * Logs payoffs to console and returns results for UI/store.
 */
export async function runSimulation(
  payoffMatrix: number[][] = AnalystAgent.getPayoffMatrix()
): Promise<SimulationResult> {
  let volatilityUsed = 0.15;
  let xrpPriceAtRun: number | undefined;

  try {
    const update = await fetchLivePrices(['XRP']);
    const xrp = update.prices?.XRP;
    if (typeof xrp === 'number' && xrp > 0) {
      xrpPriceAtRun = xrp;
      const change = update.changes?.XRP;
      volatilityUsed = typeof change === 'number' ? Math.min(1, Math.abs(change) / 100) : 0.15;
    }
  } catch (e) {
    console.warn('[MultiAgentSim] fetchLivePrices failed, using default volatility', e);
  }

  const playerAgent = new PlayerAgent();
  const opponentAgent = new OpponentAgent(2.0);
  const analystAgent = new AnalystAgent();

  playerAgent.setVolatility(volatilityUsed);
  if (xrpPriceAtRun != null) opponentAgent.setXrpPrice(xrpPriceAtRun);

  const rounds: RoundResult[] = [];
  let totalPlayer = 0;
  let totalOpponent = 0;
  const matrix = payoffMatrix.map(row => row.map(x => x));

  for (let r = 1; r <= NUM_ROUNDS; r++) {
    const playerDec = playerAgent.act();
    opponentAgent.setLastPlayerAction(playerDec.action);
    const opponentDec = opponentAgent.act();

    const rowIdx = playerDec.action === 'cooperate' ? 0 : 1;
    const colIdx = opponentDec.action === 'cooperate' ? 0 : 1;
    const playerPayoff = matrix[rowIdx][colIdx];
    const opponentPayoff = matrix[colIdx][rowIdx];

    const analyst = analystAgent.act(matrix);
    totalPlayer += playerPayoff;
    totalOpponent += opponentPayoff;

    const roundResult: RoundResult = {
      round: r,
      playerAction: playerDec.action,
      opponentAction: opponentDec.action,
      playerPayoff,
      opponentPayoff,
      suggestedStrategy: analyst.suggestion,
      payoffMatrix: matrix.map(row => [...row]),
    };
    rounds.push(roundResult);

    console.log(
      `[MultiAgentSim] Round ${r}: P=${playerDec.action} O=${opponentDec.action} → payoffs P=${playerPayoff} O=${opponentPayoff} | ${analyst.suggestion}`
    );
  }

  const finalAnalyst = analystAgent.act(matrix);
  console.log(`[MultiAgentSim] Total payoffs: Player=${totalPlayer} Opponent=${totalOpponent}`);

  return {
    rounds,
    totalPlayerPayoff: totalPlayer,
    totalOpponentPayoff: totalOpponent,
    finalNashSuggestion: finalAnalyst.suggestion,
    volatilityUsed,
    xrpPriceAtRun,
  };
}

export { DEFAULT_PAYOFF_MATRIX };
