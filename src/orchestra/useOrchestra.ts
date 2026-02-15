/**
 * React hook: create and run the Orchestra, subscribe to Control Room events.
 * Use in Agent Economy or Control Room to drive ripple/constellation visuals.
 * With includeStrategyAgents: true, registers MarketMaker, DCA, Arbitrage agents and wires strategy store + market.
 */

import { useEffect, useState, useRef } from 'react';
import { Orchestra, TipJarAgent, MemeticSimAgent, subscribeToControlRoom } from './index';
import type { ControlRoomEvent } from './types';
import { MarketMakerAgent, DCAgent, ArbitrageAgent } from '../strategyAgents';
import { useStrategyStore } from '../store/strategyStore';
import { useILPStore } from '../store/ilpStore';

export function useOrchestra(options?: { startImmediately?: boolean; includeStrategyAgents?: boolean }) {
  const [orchestra, setOrchestra] = useState<Orchestra | null>(null);
  const [events, setEvents] = useState<ControlRoomEvent[]>([]);
  const [mode, setMode] = useState<'SIMULATE' | 'MANUAL' | 'LIVE'>('SIMULATE');
  const [killSwitch, setKillSwitch] = useState(false);
  const strategyStore = useStrategyStore.getState();

  useEffect(() => {
    const orch = new Orchestra();
    orch.agents.push(new TipJarAgent());
    const setSimulationResults = useILPStore.getState().setSimulationResults;
    orch.agents.push(new MemeticSimAgent({ onSimulationComplete: setSimulationResults }));
    if (options?.includeStrategyAgents) {
      orch.agents.push(new MarketMakerAgent(), new DCAgent(), new ArbitrageAgent());
      orch.setMarketGetter(() => {
        const snap = useStrategyStore.getState().marketSnapshot;
        return snap ? { mid: snap.mid, spreadBps: snap.spreadBps, volatility: snap.volatility } : undefined;
      });
      orch.setStrategyStateGetter(() => {
        const s = useStrategyStore.getState();
        return {
          'strategy:mm:enabled': s.enabled.mm,
          'strategy:dca:enabled': s.enabled.dca,
          'strategy:arb:enabled': s.enabled.arbitrage,
          'strategy:shared:maxExposureXRP': s.maxExposureXRP,
          'strategy:shared:exposureXRP': s.exposureXRP,
          'wallet:address': s.walletAddress,
          'strategy:arb:clobMid': s.marketSnapshot?.mid,
          'strategy:arb:ammQuote': s.marketSnapshot ? s.marketSnapshot.mid * (1 + (s.marketSnapshot.spreadBps ?? 0) / 10000) : undefined,
        };
      });
    }
    setOrchestra(orch);

    const unsub = subscribeToControlRoom((ev) => {
      setEvents((prev) => [...prev.slice(-99), ev]);
    });

    if (options?.startImmediately !== false) {
      orch.start();
    }

    return () => {
      unsub();
      orch.stop();
      setOrchestra(null);
    };
  }, [options?.startImmediately, options?.includeStrategyAgents]);

  useEffect(() => {
    if (orchestra) {
      orchestra.setMode(mode);
      orchestra.setKillSwitch(killSwitch);
    }
  }, [mode, killSwitch, orchestra]);

  return {
    orchestra,
    events,
    mode,
    setMode,
    killSwitch,
    setKillSwitch,
    clearEvents: () => setEvents([]),
  };
}
