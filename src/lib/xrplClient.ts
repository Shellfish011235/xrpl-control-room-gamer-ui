/**
 * XRPL HTTP JSON-RPC client. Uses configurable RPC URL (private node or proxy).
 * Safe method allowlist; no admin commands exposed.
 */

import { getPickedRpcUrl } from './xrplUrlBridge';
import { advanceOnRpcFailure } from '../services/xrplEndpointManager';

const ALLOWED_METHODS = new Set([
  'server_info',
  'ledger',
  'ledger_closed',
  'ledger_current',
  'tx',
  'account_info',
  'account_lines',
  'account_objects',
  'account_nfts',
  'account_tx',
  'book_offers',
  'ripple_path_find',
  'fee',
  'amm_info',
  'channel_authorize',
  'channel_verify',
  'submit',
  'submit_multisigned',
]);

/**
 * Send a JSON-RPC request to the XRPL node. Params are sent as a single object in params[0].
 */
export async function xrplRequest<T = unknown>(
  method: string,
  params: object[] = [{}],
  options?: { timeoutMs?: number; retries?: number }
): Promise<T> {
  if (!ALLOWED_METHODS.has(method)) {
    throw new Error(`XRPL: method "${method}" is not allowed (admin/safe allowlist)`);
  }

  const timeoutMs = options?.timeoutMs ?? 15000;
  const maxRetries = options?.retries ?? 2;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const url = getPickedRpcUrl();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, params }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`XRPL ${method}: ${res.status} ${res.statusText}`);

      const data = await res.json();
      const result = data.result ?? data;
      if (result.error || data.error) {
        const msg = result.error_message ?? result.error ?? data.error_message ?? data.error;
        throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
      }
      if (result.status === 'error') {
        throw new Error(result.error_message ?? 'XRPL error');
      }
      return result as T;
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err;
      if (attempt < maxRetries) {
        advanceOnRpcFailure();
      }
    }
  }
  throw lastError;
}

// --- Typed helpers (same params as rippled API) ---

export interface ServerInfoResult {
  info: {
    build_version: string;
    complete_ledgers: string;
    hostid?: string;
    load_factor?: number;
    peers: number;
    pubkey_node?: string;
    server_state: string;
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

export async function serverInfo(): Promise<ServerInfoResult> {
  return xrplRequest<ServerInfoResult>('server_info', [{}]);
}

export async function ledger(params: { ledger_index?: string | number; ledger_hash?: string; full?: boolean }) {
  return xrplRequest('ledger', [params]);
}

export async function tx(params: { transaction: string; binary?: boolean }) {
  return xrplRequest('tx', [params]);
}

export async function accountInfo(params: { account: string; ledger_index?: string | number }) {
  return xrplRequest('account_info', [params]);
}

export async function bookOffers(params: {
  taker_gets: object;
  taker_pays: object;
  limit?: number;
  ledger_index?: string | number;
}) {
  return xrplRequest('book_offers', [params]);
}
