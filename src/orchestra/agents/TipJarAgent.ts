/**
 * Example agent: emits PAYMENT intents occasionally (demo).
 * Replace from/to with real addresses or read from context in production.
 */

import type { Agent } from '../types';

export class TipJarAgent implements Agent {
  id = 'agent_tipjar';
  name = 'TipJar Agent';
  role = 'Demo tipper';
  goal = 'Emit occasional small XRP payment intents for batching demo';

  async tick(ctx: Parameters<Agent['tick']>[0]): Promise<void> {
    const shouldEmit = Math.random() < 0.05;
    if (!shouldEmit) return;
    ctx.emit({
      id: crypto.randomUUID(),
      agentId: this.id,
      type: 'PAYMENT',
      createdAt: ctx.now(),
      from: 'rFROM000000000000000000000000000000000',
      to: 'rTO0000000000000000000000000000000001',
      asset: { kind: 'XRP' },
      amount: '1.0',
      memo: 'demo-intent',
    });
  }
}
