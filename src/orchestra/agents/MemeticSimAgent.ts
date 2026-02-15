/**
 * MemeticSimAgent – Prisoner's Dilemma multi-agent simulator in the Orchestra.
 * Periodically runs the 10-round PD simulation (PlayerAgent, OpponentAgent, AnalystAgent)
 * and pushes results to the ILP store so Memetic Lab UI can display payoff-over-rounds.
 * Does not emit payment intents; for future OpenClaw hooks (e.g. reward agents via XRPL) extend here.
 */

import type { Agent, AgentContext } from '../types';
import { runSimulation } from '../../services/multiAgentSimulator';
import type { SimulationResult } from '../../services/multiAgentSimulator';

const AGENT_ID = 'agent_memetic_sim';
const RUN_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export interface MemeticSimAgentOptions {
  /** Called when a simulation completes; e.g. setSimulationResults from ilpStore */
  onSimulationComplete?: (result: SimulationResult) => void;
}

export class MemeticSimAgent implements Agent {
  id = AGENT_ID;
  name = 'Memetic Lab (Prisoner\'s Dilemma)';
  role = 'Run multi-agent PD simulator; feed results to Memetic Lab UI';
  goal = 'Periodic 10-round sim with XRP volatility; no payment intents';

  constructor(private options: MemeticSimAgentOptions = {}) {}

  async tick(ctx: AgentContext): Promise<void> {
    const lastRun = (ctx.readState('memetic:lastRun') as number | undefined) ?? 0;
    if (ctx.now() - lastRun < RUN_INTERVAL_MS) return;

    try {
      const result = await runSimulation();
      ctx.writeState('memetic:lastRun', ctx.now());
      ctx.writeState('memetic:lastResult', result);
      this.options.onSimulationComplete?.(result);
    } catch (err) {
      console.warn('[MemeticSimAgent] runSimulation failed:', err);
      ctx.writeState('memetic:lastRun', ctx.now()); // avoid tight retry loop
    }
  }
}
