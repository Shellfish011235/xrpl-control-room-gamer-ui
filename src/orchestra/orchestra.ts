/**
 * XRPL Agent Orchestra: collect intents, validate, net, plan, execute by mode.
 * Non-custodial: SIMULATE / MANUAL / LIVE; LIVE requires UI to sign.
 */

import type { Intent, SettlementPlan } from '../types/agentIntents';
import type { Agent, AgentContext, OrchestraMode } from './types';
import { publishToControlRoom } from './events';
import { validateIntent } from './validate';
import { netPayments } from './netting';
import { buildPlan } from './plan';
import { simulate, requestApproval, executeOnXRPL } from './execution';
import { ValidatorAgent, NettingAgent, SettlementAgent } from './agents';
import { appendAudit } from './audit';

export class Orchestra {
  agents: Agent[] = [];
  intentQueue: Intent[] = [];
  mode: OrchestraMode = 'SIMULATE';

  windowMs = 8000;
  maxIntentsPerWindow = 200;
  maxTxPerWindow = 25;
  maxNotionalPerDayUsd = 50;
  killSwitch = false;

  private agentState = new Map<string, unknown>();
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private windowTimer: ReturnType<typeof setInterval> | null = null;
  /** Optional: market data for strategy agents (mid, spreadBps, volatility) */
  private marketGetter: (() => AgentContext['market']) | null = null;
  /** Optional: strategy toggles + exposure + wallet for DCA/MM/Arb agents */
  private strategyStateGetter: (() => Record<string, unknown>) | null = null;

  setMarketGetter(getter: (() => AgentContext['market']) | null): void {
    this.marketGetter = getter;
  }

  setStrategyStateGetter(getter: (() => Record<string, unknown>) | null): void {
    this.strategyStateGetter = getter;
  }

  start(): void {
    if (this.tickTimer) return;
    appendAudit({ type: 'MODE_CHANGE', payload: { mode: this.mode } });
    this.tickTimer = setInterval(() => this.tickAgents(), 1000);
    this.windowTimer = setInterval(() => this.closeAndPlanWindow(), this.windowMs);
  }

  stop(): void {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    if (this.windowTimer) {
      clearInterval(this.windowTimer);
      this.windowTimer = null;
    }
  }

  setMode(mode: OrchestraMode): void {
    this.mode = mode;
    publishToControlRoom({ type: 'MODE_CHANGED', mode });
    appendAudit({ type: 'MODE_CHANGE', payload: { mode } });
  }

  setKillSwitch(active: boolean): void {
    this.killSwitch = active;
    publishToControlRoom({ type: 'KILL_SWITCH', active });
    appendAudit({ type: 'KILL_SWITCH', payload: { active } });
  }

  emit(intent: Intent): void {
    this.intentQueue.push(intent);
    appendAudit({ type: 'INTENT_EMIT', payload: { intentId: intent.id, type: intent.type } });
  }

  private buildContext(): AgentContext {
    const strategyState = this.strategyStateGetter?.() ?? {};
    return {
      now: () => Date.now(),
      emit: (i) => this.emit(i),
      readState: (k) => this.agentState.get(k) ?? strategyState[k],
      writeState: (k, v) => { this.agentState.set(k, v); },
      market: this.marketGetter?.() ?? undefined,
    };
  }

  async tickAgents(): Promise<void> {
    if (this.killSwitch) return;
    const ctx = this.buildContext();
    for (const agent of this.agents) {
      try {
        await agent.tick(ctx);
      } catch (e) {
        console.error(`[Orchestra] agent ${agent.id} tick error:`, e);
      }
    }
  }

  closeAndPlanWindow(): void {
    if (this.killSwitch) return;

    const intents = this.intentQueue.splice(0, this.maxIntentsPerWindow);
    if (intents.length === 0) return;

    appendAudit({ type: 'WINDOW_OPEN', payload: { count: intents.length } });

    // 1) Validate + normalize (SOP: ValidatorAgent)
    const { valid, rejected } = ValidatorAgent.validateBatch(intents);
    for (const { intent, reasons } of rejected) {
      publishToControlRoom({ type: 'INTENT_REJECTED', intent, reasons });
      appendAudit({ type: 'INTENT_REJECT', payload: { intentId: intent.id, reasons } });
    }

    // 2) Net payments (SOP: NettingAgent)
    const netResult = NettingAgent.netBatch(valid);

    // 3) Build settlement plan (SOP: SettlementAgent)
    const plan = SettlementAgent.buildSettlementPlan(netResult, this.maxTxPerWindow);
    appendAudit({ type: 'PLAN_BUILT', payload: { planId: plan.id, txsOut: plan.xrplTxs.length } });

    // 4) Execute per mode
    if (this.mode === 'SIMULATE') {
      simulate(plan);
      appendAudit({ type: 'EXEC_SIMULATE', payload: { planId: plan.id } });
    } else if (this.mode === 'MANUAL') {
      requestApproval(plan);
      appendAudit({ type: 'EXEC_MANUAL', payload: { planId: plan.id } });
    } else if (this.mode === 'LIVE') {
      executeOnXRPL(plan);
      appendAudit({ type: 'EXEC_LIVE', payload: { planId: plan.id } });
    }

    publishToControlRoom({ type: 'WINDOW_CLOSED', plan, windowId: plan.windowId });
    appendAudit({ type: 'WINDOW_CLOSE', payload: { windowId: plan.windowId } });
  }
}
