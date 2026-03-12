/**
 * Hook for XRPL Intelligence dashboard: ensures WS connected and subscribed to ledger + transactions.
 * Returns connection health and last ledger for the unified view.
 */

import { useState, useEffect, useCallback } from 'react';
import { connect, subscribe, getConnectionHealth, getLastLedgerIndex, onStateChange } from '../lib/xrpl/wsClient';
import { fetchValidatorSnapshot, computeNetworkHealth, type NetworkHealthSummary } from '../lib/intelligence/validators';

const POLL_VALIDATORS_MS = 15000;

export function useXRPLIntelligence() {
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected'>(getConnectionHealth().state);
  const [lastLedgerIndex, setLastLedgerIndex] = useState<number | null>(getLastLedgerIndex());
  const [validatorSummary, setValidatorSummary] = useState<NetworkHealthSummary | null>(null);
  const [lastUpdated, setLastUpdated] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    const health = getConnectionHealth();
    setConnectionState(health.state);
    setLastLedgerIndex(getLastLedgerIndex());
    setError(health.lastError);
  }, []);

  useEffect(() => {
    connect();
    subscribe(['ledger', 'transactions']);
    const unsub = onStateChange(refresh);
    const id = setInterval(refresh, 2000);
    return () => {
      unsub();
      clearInterval(id);
    };
  }, [refresh]);

  useEffect(() => {
    if (connectionState !== 'connected') return;
    let cancelled = false;
    const run = async () => {
      const node = await fetchValidatorSnapshot();
      if (!cancelled) {
        setValidatorSummary(computeNetworkHealth(node, getConnectionHealth()));
        setLastUpdated(Date.now());
      }
    };
    run();
    const tid = setInterval(run, POLL_VALIDATORS_MS);
    return () => {
      cancelled = true;
      clearInterval(tid);
    };
  }, [connectionState]);

  return {
    connectionState,
    lastLedgerIndex,
    validatorSummary,
    lastUpdated,
    error,
    refresh,
  };
}
