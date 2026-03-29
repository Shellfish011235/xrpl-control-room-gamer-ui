/**
 * Live XRPL activity from the shared WebSocket (ledger + transactions).
 * Read-only; does not register onStateChange (global singleton) — polls connection health instead.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  connect,
  subscribe,
  onMessage,
  normalizeTransactionToPayment,
  getConnectionHealth,
  getLastLedgerIndex,
} from '../lib/xrpl/wsClient';
import type { XRPLWsEvent, TransactionStreamEvent } from '../lib/xrpl/types';

const FEED_MAX = 50;
const STATS_WINDOW_MS = 60_000;
const POLL_MS = 2000;
const SUB_RETRY_MS = 2000;

export type LiveActivityKind = 'ledger' | 'payment' | 'dex' | 'tx';

export interface LiveActivityItem {
  id: string;
  ts: number;
  kind: LiveActivityKind;
  summary: string;
  sub?: string;
  txHash?: string;
  from?: string;
  success?: boolean;
}

function shortAddr(a: string): string {
  if (a.length <= 14) return a;
  return `${a.slice(0, 10)}…${a.slice(-4)}`;
}

function pushItem(
  prev: LiveActivityItem[],
  item: LiveActivityItem,
  seenTx: Set<string>
): LiveActivityItem[] {
  if (item.txHash) {
    if (seenTx.has(item.txHash)) return prev;
    seenTx.add(item.txHash);
    if (seenTx.size > 200) {
      const it = seenTx.values();
      seenTx.delete(it.next().value as string);
    }
  }
  const next = [item, ...prev].slice(0, FEED_MAX);
  return next;
}

export function useXRPLLiveActivity() {
  const [feed, setFeed] = useState<LiveActivityItem[]>([]);
  const [connectionState, setConnectionState] = useState(() => getConnectionHealth().state);
  const [lastLedgerIndex, setLastLedgerIndex] = useState<number | null>(() => getLastLedgerIndex());
  const [lastError, setLastError] = useState<string | null>(() => getConnectionHealth().lastError);
  const seenLedgers = useRef<Set<number>>(new Set());
  const seenTxHashes = useRef<Set<string>>(new Set());
  const subscribedRef = useRef(false);

  const refreshHealth = useCallback(() => {
    const h = getConnectionHealth();
    setConnectionState(h.state);
    setLastLedgerIndex(getLastLedgerIndex());
    setLastError(h.lastError);
    if (h.state === 'connected' && !subscribedRef.current) {
      subscribe(['ledger', 'transactions']);
      subscribedRef.current = true;
    }
    if (h.state !== 'connected') subscribedRef.current = false;
  }, []);

  useEffect(() => {
    connect();
    subscribe(['ledger', 'transactions']);
    refreshHealth();

    const poll = setInterval(refreshHealth, POLL_MS);
    const subKick = setInterval(() => {
      if (getConnectionHealth().state === 'connected') subscribe(['ledger', 'transactions']);
    }, SUB_RETRY_MS);

    const unsub = onMessage((ev: XRPLWsEvent | null) => {
      if (!ev || typeof ev !== 'object' || !('type' in ev)) return;

      if (ev.type === 'ledgerClosed' && 'ledger_index' in ev) {
        const idx = (ev as { ledger_index: number }).ledger_index;
        if (seenLedgers.current.has(idx)) return;
        seenLedgers.current.add(idx);
        if (seenLedgers.current.size > 500) {
          const arr = [...seenLedgers.current].sort((a, b) => a - b);
          arr.slice(0, 200).forEach((n) => seenLedgers.current.delete(n));
        }
        setFeed((prev) =>
          pushItem(
            prev,
            {
              id: `ledger-${idx}-${Date.now()}`,
              ts: Date.now(),
              kind: 'ledger',
              summary: `Ledger #${idx.toLocaleString()} validated`,
              sub: 'Consensus close',
            },
            seenTxHashes.current
          )
        );
        setLastLedgerIndex(idx);
        return;
      }

      if (ev.type !== 'transaction') return;
      const txEv = ev as TransactionStreamEvent;
      const payment = normalizeTransactionToPayment(txEv);
      const tx = txEv.transaction;
      const hash = typeof tx.hash === 'string' ? tx.hash : undefined;
      const type = tx.TransactionType;
      const from = typeof tx.Account === 'string' ? tx.Account : undefined;

      if (payment && type === 'Payment') {
        const amt =
          payment.currency && payment.amountValue != null
            ? `${payment.amountValue.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${payment.currency}`
            : payment.amountValue != null
              ? `${payment.amountValue.toLocaleString(undefined, { maximumFractionDigits: 6 })} XRP`
              : 'amount n/a';
        const dest = payment.to ? shortAddr(payment.to) : '—';
        setFeed((prev) =>
          pushItem(
            prev,
            {
              id: hash ?? `pay-${Date.now()}-${Math.random()}`,
              ts: payment.ts,
              kind: 'payment',
              summary: `Payment${payment.success ? '' : ' (failed)'} · ${amt} → ${dest}`,
              sub: from ? `From ${shortAddr(from)}` : undefined,
              txHash: hash,
              from,
              success: payment.success,
            },
            seenTxHashes.current
          )
        );
        return;
      }

      if (payment && (type === 'OfferCreate' || type === 'OfferCancel')) {
        setFeed((prev) =>
          pushItem(
            prev,
            {
              id: hash ?? `dex-${Date.now()}-${Math.random()}`,
              ts: payment.ts,
              kind: 'dex',
              summary: `${type} ${payment.success ? '' : '(failed) '}${from ? shortAddr(from) : ''}`,
              txHash: hash,
              from,
              success: payment.success,
            },
            seenTxHashes.current
          )
        );
        return;
      }

      if (type && from) {
        setFeed((prev) =>
          pushItem(
            prev,
            {
              id: hash ?? `tx-${Date.now()}-${Math.random()}`,
              ts: Date.now(),
              kind: 'tx',
              summary: `${type}`,
              sub: shortAddr(from),
              txHash: hash,
              from,
            },
            seenTxHashes.current
          )
        );
      }
    });

    return () => {
      clearInterval(poll);
      clearInterval(subKick);
      unsub();
    };
  }, [refreshHealth]);

  const stats = useMemo(() => {
    const now = Date.now();
    const windowStart = now - STATS_WINDOW_MS;
    const inWin = feed.filter((f) => f.ts >= windowStart);
    const payments = inWin.filter((f) => f.kind === 'payment').length;
    const dex = inWin.filter((f) => f.kind === 'dex').length;
    const ledgers = inWin.filter((f) => f.kind === 'ledger').length;
    const txOther = inWin.filter((f) => f.kind === 'tx').length;
    const senders = new Set(inWin.map((f) => f.from).filter(Boolean));
    return {
      windowMs: STATS_WINDOW_MS,
      total: inWin.length,
      payments,
      dex,
      ledgers,
      txOther,
      uniqueSenders: senders.size,
    };
  }, [feed]);

  return {
    connectionState,
    lastLedgerIndex,
    lastError,
    feed,
    stats,
    refreshHealth,
  };
}
