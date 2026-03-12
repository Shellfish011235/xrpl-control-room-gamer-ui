/**
 * XRPL WebSocket transport. Wraps lib/xrplWebsocket; adds event parsing and subscribe/unsubscribe.
 * Reconnect with exponential backoff is handled by the underlying module.
 */

import * as ws from '../xrplWebsocket';
import type { XRPLWsEvent, LedgerClosedEvent, TransactionStreamEvent, NormalizedLedgerClose, NormalizedPayment, ConnectionHealth } from './types';

export type { ConnectionHealth };

export function connect(): void {
  ws.connect();
}

export function disconnect(): void {
  ws.disconnect();
}

export function subscribe(streams: string[]): void {
  ws.subscribe(streams);
}

export function getConnectionState(): 'disconnected' | 'connecting' | 'connected' {
  return ws.getConnectionState();
}

export function getLastLedgerIndex(): number | null {
  return ws.getLastLedgerIndex();
}

export function getLastError(): string | null {
  return ws.getLastError();
}

export function getConnectionUptimeSeconds(): number {
  return ws.getConnectionUptimeSeconds();
}

export function onStateChange(callback: () => void): () => void {
  return ws.onStateChange(callback);
}

/** Parse raw WS message into a typed event or null if not recognized. */
export function parseWsMessage(data: unknown): XRPLWsEvent | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  if (d.type === 'ledgerClosed' && typeof d.ledger_index === 'number') {
    return {
      type: 'ledgerClosed',
      ledger_index: d.ledger_index,
      ledger_hash: typeof d.ledger_hash === 'string' ? d.ledger_hash : undefined,
      ledger_time: typeof d.ledger_time === 'number' ? d.ledger_time : undefined,
    } as LedgerClosedEvent;
  }
  if (d.type === 'transaction' && d.transaction && typeof d.transaction === 'object') {
    return {
      type: 'transaction',
      transaction: d.transaction as TransactionStreamEvent['transaction'],
      meta: typeof d.meta === 'object' && d.meta ? (d.meta as TransactionStreamEvent['meta']) : undefined,
    } as TransactionStreamEvent;
  }
  return d as XRPLWsEvent;
}

/** Convert ledgerClosed event to normalized shape. */
export function normalizeLedgerClose(ev: LedgerClosedEvent): NormalizedLedgerClose {
  return {
    ledgerIndex: ev.ledger_index,
    ledgerHash: ev.ledger_hash,
    closeTime: ev.ledger_time,
    ts: Date.now(),
  };
}

/** Convert transaction stream payload to normalized payment when applicable. */
export function normalizeTransactionToPayment(ev: TransactionStreamEvent): NormalizedPayment | null {
  const tx = ev.transaction;
  const meta = ev.meta;
  const type = tx.TransactionType;
  if (type !== 'Payment' && type !== 'OfferCreate' && type !== 'OfferCancel') return null;
  let from = tx.Account;
  let to = tx.Destination;
  let amountDrops = '0';
  let currency: string | undefined;
  let issuer: string | undefined;
  let amountValue: number | undefined;
  if (type === 'Payment' && tx.Amount !== undefined) {
    if (typeof tx.Amount === 'string') {
      amountDrops = tx.Amount;
      amountValue = parseInt(tx.Amount, 10) / 1_000_000;
    } else if (tx.Amount && typeof tx.Amount === 'object' && 'value' in tx.Amount) {
      amountValue = parseFloat((tx.Amount as { value: string }).value);
      currency = (tx.Amount as { currency: string }).currency;
      issuer = (tx.Amount as { issuer: string }).issuer;
    }
  }
  const success = meta?.TransactionResult === 'tesSUCCESS';
  return {
    from,
    to: to ?? '',
    amountDrops,
    amountValue,
    currency,
    issuer,
    txHash: tx.hash ?? undefined,
    ledgerIndex: 0,
    ts: tx.date ? (tx.date + 946684800) * 1000 : Date.now(),
    success,
  };
}

/** Subscribe to raw messages; callback receives parsed event or raw data. Returns unsubscribe. */
export function onMessage(handler: (event: XRPLWsEvent | null, raw: unknown) => void): () => void {
  return ws.onMessage((raw) => {
    const parsed = parseWsMessage(raw);
    handler(parsed, raw);
  });
}

export function getConnectionHealth(): ConnectionHealth {
  return {
    state: ws.getConnectionState(),
    lastLedgerIndex: ws.getLastLedgerIndex(),
    lastError: ws.getLastError(),
    uptimeSeconds: ws.getConnectionUptimeSeconds(),
  };
}
