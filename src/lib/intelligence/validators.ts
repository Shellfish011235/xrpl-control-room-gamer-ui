/**
 * Validator and network intelligence: server_info, quorum, peer count, ledger timing.
 * Read-only; no admin commands.
 */

import { rpcServerInfo } from '../xrpl/rpcClient';
import { getConnectionHealth } from '../xrpl/wsClient';
import type { ConnectionHealth } from '../xrpl/types';

export interface ValidatorNodeSnapshot {
  serverState: string;
  serverStateDurationUs: number;
  validatedLedgerSeq: number;
  validatedLedgerAge: number;
  peers: number;
  loadFactor?: number;
  quorum?: number;
  buildVersion: string;
  completeLedgers: string;
  ts: number;
}

export interface NetworkHealthSummary {
  node: ValidatorNodeSnapshot | null;
  connection: ConnectionHealth;
  ledgerCloseIntervalSeconds: number | null;
  warning: string | null;
  ok: boolean;
  lastUpdated: number;
}

const STATE_OK = ['full', 'proposing', 'validating'];
const STATE_SYNCING = 'syncing';
const STATE_DEGRADED = ['connected', 'disconnected'];

export async function fetchValidatorSnapshot(): Promise<ValidatorNodeSnapshot | null> {
  try {
    const res = await rpcServerInfo();
    const info = res?.info;
    if (!info?.validated_ledger) return null;
    const vl = info.validated_ledger;
    const durationUs = typeof info.server_state_duration_us === 'string'
      ? parseInt(info.server_state_duration_us, 10) || 0
      : 0;
    return {
      serverState: info.server_state ?? 'unknown',
      serverStateDurationUs: durationUs,
      validatedLedgerSeq: vl.seq,
      validatedLedgerAge: vl.age ?? 0,
      peers: info.peers ?? 0,
      loadFactor: info.load_factor,
      quorum: info.validation_quorum,
      buildVersion: info.build_version ?? '',
      completeLedgers: info.complete_ledgers ?? '',
      ts: Date.now(),
    };
  } catch {
    return null;
  }
}

/** Compute network health from node snapshot + connection. */
export function computeNetworkHealth(
  node: ValidatorNodeSnapshot | null,
  connection: ConnectionHealth,
  previousLedgerTs?: number
): NetworkHealthSummary {
  const lastUpdated = Date.now();
  let warning: string | null = null;
  let ledgerCloseIntervalSeconds: number | null = null;

  if (previousLedgerTs && node) {
    const intervalMs = (node.ts - previousLedgerTs) / 1;
    ledgerCloseIntervalSeconds = intervalMs / 1000;
  }

  if (connection.state !== 'connected') {
    warning = 'Not connected to node';
  } else if (!node) {
    warning = 'Could not fetch server_info';
  } else {
    if (!STATE_OK.includes(node.serverState) && node.serverState !== STATE_SYNCING) {
      if (STATE_DEGRADED.includes(node.serverState)) {
        warning = `Node state: ${node.serverState}`;
      }
    }
    if (node.peers < 5) warning = warning ?? `Low peer count: ${node.peers}`;
    if (node.validatedLedgerAge > 30) warning = warning ?? `Ledger age high: ${node.validatedLedgerAge}s`;
  }

  const ok = !warning && connection.state === 'connected' && node !== null;
  return {
    node,
    connection,
    ledgerCloseIntervalSeconds,
    warning,
    ok,
    lastUpdated,
  };
}

