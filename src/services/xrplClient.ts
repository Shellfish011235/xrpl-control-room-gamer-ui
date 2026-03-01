/**
 * Singleton XRPL WebSocket client for MVP wallet: balance + trust lines + real-time subscribe.
 * No seeds; read-only. Testnet by default.
 */

import { Client } from 'xrpl';

let clientInstance: Client | null = null;

export async function getXRPLClient(useTestnet = true): Promise<Client> {
  if (clientInstance?.isConnected()) return clientInstance;

  const url = useTestnet
    ? 'wss://s.altnet.rippletest.net:51233'
    : 'wss://s2.ripple.com';

  clientInstance = new Client(url);
  await clientInstance.connect();
  return clientInstance;
}

export async function disconnectXRPL(): Promise<void> {
  if (clientInstance) {
    try {
      await clientInstance.disconnect();
    } catch (_) {
      // ignore
    }
    clientInstance = null;
  }
}
