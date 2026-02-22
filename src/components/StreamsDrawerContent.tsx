/**
 * Streams & OpenClaw tab: real payment channels, real stream (repeated Payments), OpenClaw dashboard.
 * This project does not collect any platform fees or royalties.
 */

import React from 'react';
import { RealStreamsPanel } from './micropayments/RealStreamsPanel';
import { OpenClawDashboard } from './micropayments/OpenClawDashboard';
import { AgentEconomyHub } from './AgentEconomyHub';

export function StreamsDrawerContent() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-5 h-full overflow-auto">
      <section className="space-y-3">
        <h3 className="font-cyber text-cyber-cyan text-xs uppercase tracking-wider text-cyber-muted">Use on XRPL now</h3>
        <AgentEconomyHub compact />
      </section>
      <section className="space-y-3">
        <h3 className="font-cyber text-cyber-cyan text-xs uppercase tracking-wider text-cyber-muted">Payment channels & stream</h3>
        <RealStreamsPanel />
      </section>
      <section className="space-y-3">
        <h3 className="font-cyber text-cyber-purple text-xs uppercase tracking-wider text-cyber-muted">OpenClaw</h3>
        <OpenClawDashboard />
      </section>
    </div>
  );
}

export default StreamsDrawerContent;
