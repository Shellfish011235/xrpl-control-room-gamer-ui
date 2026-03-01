/**
 * Singleton XRPL WebSocket client.
 * Supports network toggle (testnet/mainnet); used by MVP wallet (read-only) and WalletActionsPanel (signing).
 */

import { Client } from 'xrpl';

const WS: Record<string, string> = {
  testnet: 'wss://s.altnet.rippletest.net:51233',
  mainnet: 'wss://xrplcluster.com',
};

let clientInstance: Client | null = null;
let connectedUrl: string | null = null;
let currentNetwork: 'testnet' | 'mainnet' = 'testnet';
let connecting: Promise<Client> | null = null;

export function getNetwork(): 'testnet' | 'mainnet' {
  return currentNetwork;
}

export function setNetwork(next: string): void {
  currentNetwork = next === 'mainnet' ? 'mainnet' : 'testnet';
}

export async function getXRPLClient(useTestnet?: boolean): Promise<Client> {
  if (useTestnet !== undefined) {
    currentNetwork = useTestnet ? 'testnet' : 'mainnet';
  }
  const url = WS[currentNetwork] ?? WS.testnet;

  if (clientInstance?.isConnected() && connectedUrl === url) return clientInstance;
  if (clientInstance) {
    try {
      await clientInstance.disconnect();
    } catch (_) {}
    clientInstance = null;
    connectedUrl = null;
    connecting = null;
  }

  if (connecting) return connecting;

  connecting = (async () => {
    const c = new Client(url);
    await c.connect();
    clientInstance = c;
    connectedUrl = url;
    connecting = null;
    return c;
  })();

  return connecting;
}

export async function disconnectXRPL(): Promise<void> {
  try {
    if (clientInstance) await clientInstance.disconnect();
  } finally {
    clientInstance = null;
    connectedUrl = null;
    connecting = null;
  }
}
