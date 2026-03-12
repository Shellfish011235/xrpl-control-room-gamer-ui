/**
 * Shared types for XRPL transport and intelligence layer.
 * Normalized structures for ledger, transactions, and node state.
 */

// --- RPC / Node ---

export interface ServerInfoResult {
  info: {
    build_version: string;
    complete_ledgers: string;
    hostid?: string;
    load_factor?: number;
    peers: number;
    pubkey_node?: string;
    server_state: string;
    server_state_duration_us?: string;
    validated_ledger: {
      age: number;
      base_fee_xrp: number;
      hash: string;
      reserve_base_xrp: number;
      reserve_inc_xrp: number;
      seq: number;
    };
    validation_quorum?: number;
    uptime?: number;
  };
}

export interface LedgerClosedEvent {
  type: 'ledgerClosed';
  ledger_index: number;
  ledger_hash?: string;
  ledger_time?: number;
}

export interface TransactionStreamTx {
  transaction: {
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
    [key: string]: unknown;
  };
}

export interface TransactionStreamEvent {
  type: 'transaction';
  transaction: TransactionStreamTx['transaction'];
  meta?: TransactionStreamTx['meta'];
}

export type XRPLWsEvent = LedgerClosedEvent | TransactionStreamEvent | { type: string; [key: string]: unknown };

// --- Normalized for intelligence ---

export interface NormalizedLedgerClose {
  ledgerIndex: number;
  ledgerHash?: string;
  closeTime?: number;
  ts: number;
}

export interface NormalizedPayment {
  from: string;
  to: string;
  amountDrops: string;
  amountValue?: number;
  currency?: string;
  issuer?: string;
  txHash?: string;
  ledgerIndex: number;
  ts: number;
  success: boolean;
}

export interface ConnectionHealth {
  state: 'disconnected' | 'connecting' | 'connected';
  lastLedgerIndex: number | null;
  lastError: string | null;
  uptimeSeconds: number;
}
