/**
 * useXRPLClient – optional XRPL testnet client for ledger subscription.
 * Lazy-connects via XRPLAgentOrchestrator; handles offline/retry.
 */

import { useState, useEffect, useCallback } from 'react';
import { getDefaultOrchestrator, type XRPLClientLike } from '../agents/Orchestrator';

export interface XRPLClientState {
  client: XRPLClientLike | null;
  connected: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export function useXRPLClient(): XRPLClientState {
  const [client, setClient] = useState<XRPLClientLike | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setError(null);
    try {
      const orch = getDefaultOrchestrator();
      const c = await orch.getClient();
      setClient(c);
      setConnected(c.isConnected());
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'XRPL connection failed';
      setError(msg);
      setConnected(false);
      setClient(null);
    }
  }, []);

  const disconnect = useCallback(async () => {
    const orch = getDefaultOrchestrator();
    await orch.disconnect();
    setClient(null);
    setConnected(false);
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      getDefaultOrchestrator().disconnect();
    };
  }, []);

  return { client, connected, error, connect, disconnect };
}
