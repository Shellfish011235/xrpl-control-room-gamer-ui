/**
 * Streams & OpenClaw tab: real payment channels, real stream (repeated Payments), OpenClaw revenue.
 * Uses topology: agent economy hub (use on XRPL now + chains that support fewer signs).
 */

import React from 'react';
import { RealStreamsPanel } from './micropayments/RealStreamsPanel';
import { OpenClawDashboard } from './micropayments/OpenClawDashboard';
import { AgentEconomyHub } from './AgentEconomyHub';

export function StreamsDrawerContent() {
  return (
    <div className="flex flex-col gap-4 p-3 h-full overflow-auto">
      <section>
        <h3 className="font-cyber text-cyber-cyan text-xs mb-2">Use on XRPL now</h3>
        <AgentEconomyHub compact />
      </section>
      <section>
        <h3 className="font-cyber text-cyber-cyan text-xs mb-2">Payment channels & stream</h3>
        <RealStreamsPanel />
      </section>
      <section>
        <h3 className="font-cyber text-cyber-purple text-xs mb-2">OpenClaw revenue</h3>
        <OpenClawDashboard />
      </section>
    </div>
  );
}

export default StreamsDrawerContent;
