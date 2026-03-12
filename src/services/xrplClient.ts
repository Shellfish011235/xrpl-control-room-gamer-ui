/**
 * Singleton XRPL WebSocket client (xrpl.js Client).
 * Supports network toggle (testnet/mainnet); used by MVP wallet (read-only) and WalletActionsPanel (signing).
 * When VITE_XRPL_WS_URL is set, mainnet uses that URL; otherwise uses public endpoints.
 */

import { Client } from 'xrpl';
import { getWsUrl, isCustomNode } from '../config/xrplNode';

const WS_PUBLIC: Record<string, string> = {
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

function getClientUrl(): string {
  if (currentNetwork === 'mainnet' && isCustomNode()) return getWsUrl();
  return WS_PUBLIC[currentNetwork] ?? WS_PUBLIC.testnet;
}

export async function getXRPLClient(useTestnet?: boolean): Promise<Client> {
  if (useTestnet !== undefined) {
    currentNetwork = useTestnet ? 'testnet' : 'mainnet';
  }
  const url = getClientUrl();

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
