/**
 * XRPL JSON-RPC transport. Uses existing lib/xrplClient; exposes typed API for intelligence layer.
 * Node URL from config (VITE_XRPL_RPC_URL / VITE_XRPL_PROXY_URL).
 */

import { xrplRequest } from '../xrplClient';
import type { ServerInfoResult } from './types';

export type { ServerInfoResult };

const DEFAULT_OPTS = { timeoutMs: 15000, retries: 2 };

export async function rpcServerInfo(): Promise<ServerInfoResult> {
  return xrplRequest<ServerInfoResult>('server_info', [{}], DEFAULT_OPTS);
}

export async function rpcLedger(params: { ledger_index?: string | number; ledger_hash?: string; full?: boolean }) {
  return xrplRequest<unknown>('ledger', [params], DEFAULT_OPTS);
}

export async function rpcLedgerClosed() {
  return xrplRequest<{ ledger_index: number; ledger_hash: string }>('ledger_closed', [{}], DEFAULT_OPTS);
}

export async function rpcAccountInfo(params: { account: string; ledger_index?: string | number }) {
  return xrplRequest<{
    account_data: { Balance: string; Sequence: number; OwnerCount?: number; [key: string]: unknown };
    ledger_current_index?: number;
  }>('account_info', [params], DEFAULT_OPTS);
}

export async function rpcAccountTx(params: {
  account: string;
  ledger_index_min?: number;
  ledger_index_max?: number;
  limit?: number;
}) {
  return xrplRequest<{
    account: string;
    ledger_index_min: number;
    ledger_index_max: number;
    limit: number;
    transactions: Array<{
      tx: {
        Account: string;
        Destination?: string;
        Amount?: string | { currency: string; issuer: string; value: string };
        TransactionType: string;
        Fee?: string;
        hash?: string;
        date?: number;
        [key: string]: unknown;
      };
      meta?: {
        TransactionResult?: string;
        delivered_amount?: string | { currency: string; issuer: string; value: string };
      };
      validated: boolean;
    }>;
  }>('account_tx', [params], { ...DEFAULT_OPTS, timeoutMs: 20000 });
}

export async function rpcTx(params: { transaction: string }) {
  return xrplRequest<{
    Account: string;
    Destination?: string;
    Amount?: string | { currency: string; issuer: string; value: string };
    TransactionType: string;
    Fee?: string;
    hash?: string;
    date?: number;
    ledger_index?: number;
    meta?: { TransactionResult?: string; delivered_amount?: unknown };
    [key: string]: unknown;
  }>('tx', [params], DEFAULT_OPTS);
}
