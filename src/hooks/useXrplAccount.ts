/**
 * useXrplAccount – XRP balance, trust lines (tokens), real-time updates via account subscribe.
 * Uses singleton xrplClient; dropsToXrp for display. No seeds; read-only.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { getXRPLClient, disconnectXRPL } from '../services/xrplClient';
import { dropsToXrp } from 'xrpl';

export interface XrplTrustLine {
  currency: string;
  balance: string;
  peer: string;
}

export interface UseXrplAccountResult {
  xrpBalance: string | null;
  tokens: XrplTrustLine[];
  error: string | null;
  loading: boolean;
}

export function useXrplAccount(
  address: string | undefined,
  useTestnet = true
): UseXrplAccountResult {
  const [xrpBalance, setXrpBalance] = useState<string | null>(null);
  const [tokens, setTokens] = useState<XrplTrustLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const clientRef = useRef<Awaited<ReturnType<typeof getXRPLClient>> | null>(null);

  const fetchBalances = useCallback(async (client: Awaited<ReturnType<typeof getXRPLClient>>) => {
    if (!address) return;
    try {
      const [infoRes, linesRes] = await Promise.all([
        client.request({
          command: 'account_info',
          account: address,
          ledger_index: 'validated',
        }),
        client.request({
          command: 'account_lines',
          account: address,
          ledger_index: 'validated',
        }),
      ]);

      const accountData = (infoRes.result as { account_data?: { Balance?: string } }).account_data;
      const balanceDrops = accountData?.Balance ?? '0';
      setXrpBalance(dropsToXrp(balanceDrops).toFixed(4));

      const lines = (linesRes.result as { lines?: Array<{ currency: string; balance: string; account: string }> }).lines ?? [];
      setTokens(
        lines.map((line) => ({
          currency: line.currency,
          balance: line.balance,
          peer: line.account,
        }))
      );
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch balances';
      setError(msg);
    }
  }, [address]);

  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!address || !address.trim()) {
      setLoading(false);
      setXrpBalance(null);
      setTokens([]);
      setError(null);
      return;
    }

    cancelledRef.current = false;
    setLoading(true);
    setError(null);

    const setup = async () => {
      try {
        const client = await getXRPLClient(useTestnet);
        if (cancelledRef.current) return;
        clientRef.current = client;
        await fetchBalances(client);
        if (cancelledRef.current) return;

        await client.request({
          command: 'subscribe',
          accounts: [address],
        });

        const onTransaction = () => {
          if (!cancelledRef.current && clientRef.current) fetchBalances(clientRef.current);
        };

        client.on('transaction', onTransaction);
      } catch (err) {
        if (!cancelledRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to connect');
          setXrpBalance(null);
          setTokens([]);
        }
      } finally {
        if (!cancelledRef.current) setLoading(false);
      }
    };

    setup();

    return () => {
      cancelledRef.current = true;
      clientRef.current = null;
      disconnectXRPL();
    };
  }, [address, useTestnet, fetchBalances]);

  return { xrpBalance, tokens, error, loading };
}
