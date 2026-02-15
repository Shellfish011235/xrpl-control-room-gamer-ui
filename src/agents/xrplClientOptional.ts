/**
 * Optional XRPL testnet client. Only import this file if the xrpl package is installed.
 * Use connectOptionalXRPLClient() from a component that needs the client; do not import
 * from Orchestrator.ts so the main app builds without the xrpl dependency.
 */

import type { XRPLClientLike } from './Orchestrator';

let cached: XRPLClientLike | null = null;

/**
 * Create and connect XRPL testnet client. Call this only when xrpl is installed (e.g. after npm install xrpl).
 * Call setOrchestratorClient() with the result to wire it into the Orchestrator.
 */
export async function connectOptionalXRPLClient(): Promise<XRPLClientLike> {
  if (cached) return cached;
  const { Client } = await import('xrpl');
  const client = new Client('wss://s.altnet.rippletest.net:51233');
  await client.connect();
  cached = client as unknown as XRPLClientLike;
  return cached;
}
