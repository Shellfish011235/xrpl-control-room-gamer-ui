/**
 * Local Task Receipt engine — builds receipts and non-cryptographic display hashes only.
 * `receiptHash` in `hashes` is a deterministic local fingerprint, not a blockchain or HSM attestation.
 */

import type { CompliancePermissionSet } from '../compliance/jurisdictionRules';
import type {
  CreateTaskReceiptInput,
  ReceiptMode,
  ReceiptStatus,
  TaskReceipt,
  TaskReceiptExecution,
  TaskReceiptHashes,
} from './taskReceiptTypes';
export type { CreateTaskReceiptInput } from './taskReceiptTypes';

/** Cryptographic SHA-256 (browser) — preferred for receipt fingerprints when `crypto.subtle` exists. */
export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Local display hash only: not suitable for security-critical verification — use `createTaskReceiptAsync` + SHA-256 when possible. */
export function createSimpleHash(input: unknown): string {
  const s = typeof input === 'string' ? input : JSON.stringify(input, null, 0);
  let h = 5381;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 33) ^ s.charCodeAt(i);
  }
  return `d${(h >>> 0).toString(16).padStart(8, '0')}`;
}

const defaultExecution = (): TaskReceiptExecution => ({
  executionEnabled: false,
  mainnetExecution: false,
  custody: false,
  privateKeyAccess: false,
  transactionSubmitted: false,
});

export function getAllowedActionsFromPermissionSet(permissionSet: CompliancePermissionSet): string[] {
  const out: string[] = [];
  if (permissionSet.canReadLedger) {
    out.push('Observe ledger');
  }
  if (permissionSet.canAnalyzeWallets) {
    out.push('Analyze wallets');
  }
  if (permissionSet.canGenerateReports) {
    out.push('Generate reports');
  }
  if (permissionSet.canPrepareTransactions) {
    out.push('Prepare transactions');
  }
  if (permissionSet.canRequestWalletSignature) {
    out.push('Request wallet signature');
  }
  if (permissionSet.canBroadcastTransactions) {
    out.push('Broadcast transactions');
  }
  return out;
}

export function getBlockedActionsFromPermissionSet(permissionSet: CompliancePermissionSet): string[] {
  const out: string[] = [];
  if (!permissionSet.canBroadcastTransactions) {
    out.push('Broadcast transactions');
  }
  if (!permissionSet.canAutonomouslyTrade) {
    out.push('Autonomous trading');
  }
  if (!permissionSet.canCustodyFunds) {
    out.push('Custody funds');
  }
  if (!permissionSet.canStorePrivateKeys) {
    out.push('Store private keys');
  }
  if (!permissionSet.canRouteThirdPartyPayments) {
    out.push('Route third-party payments');
  }
  if (!permissionSet.canChangeDestinationAddress) {
    out.push('Change destination address');
  }
  return out;
}

function resolveStatus(
  explicit: ReceiptStatus | undefined,
  mode: ReceiptMode,
  compliance: TaskReceipt['compliance'],
  security: TaskReceipt['security']
): ReceiptStatus {
  if (security.promptScanStatus === 'blocked') {
    return 'blocked';
  }
  if (compliance.requiresLegalReview) {
    if (explicit === 'blocked') {
      return 'blocked';
    }
    return 'needs_review';
  }
  if (explicit) {
    return explicit;
  }
  if (mode === 'simulation_only') {
    return 'simulated';
  }
  return 'created';
}

/**
 * Build a full TaskReceipt; computes `receiptHash` from body excluding `hashes.receiptHash`.
 * Does not broadcast transactions or write XRPL memos — that would be a different pipeline.
 */
export function createTaskReceipt(input: CreateTaskReceiptInput): TaskReceipt {
  const execution: TaskReceiptExecution = { ...defaultExecution(), ...input.execution };
  const id = `tr-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const timestamp = Date.now();
  const status = resolveStatus(input.status, input.mode, input.compliance, input.security);
  const baseForHash: Omit<TaskReceipt, 'id' | 'hashes' | 'notes'> & { timestamp: number } = {
    source: input.source,
    title: input.title,
    summary: input.summary,
    mode: input.mode,
    status,
    moduleId: input.moduleId,
    agentId: input.agentId,
    opportunityId: input.opportunityId,
    jurisdiction: input.jurisdiction,
    compliance: input.compliance,
    security: input.security,
    execution,
    timestamp,
  };
  const inputHash = input.hashes?.inputHash ?? createSimpleHash([input.title, input.summary, input.jurisdiction]);
  const outputHash = input.hashes?.outputHash ?? createSimpleHash(input.summary);
  const policyHash = input.hashes?.policyHash ?? createSimpleHash([input.compliance, input.security]);
  const receiptContentHash = createSimpleHash({ ...baseForHash, subHashes: { inputHash, outputHash, policyHash } });
  const hashes: TaskReceiptHashes = {
    inputHash,
    outputHash,
    policyHash,
    receiptHash: receiptContentHash,
  };
  return {
    id,
    timestamp,
    ...baseForHash,
    hashes,
    notes: input.notes,
  };
}

/**
 * Async receipt builder: same as `createTaskReceipt`, but recomputes hashes with SHA-256 when available.
 * Falls back to `createSimpleHash` if `crypto.subtle` is missing (non-secure contexts).
 */
export async function createTaskReceiptAsync(input: CreateTaskReceiptInput): Promise<TaskReceipt> {
  const sync = createTaskReceipt(input);
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    return sync;
  }
  try {
    const inputHash = await sha256Hex(
      JSON.stringify([input.title, input.summary, input.jurisdiction, input.moduleId])
    );
    const outputHash = await sha256Hex(input.summary);
    const policyHash = await sha256Hex(JSON.stringify([input.compliance, input.security]));
    const baseForHash = {
      source: sync.source,
      title: sync.title,
      summary: sync.summary,
      mode: sync.mode,
      status: sync.status,
      moduleId: sync.moduleId,
      agentId: sync.agentId,
      opportunityId: sync.opportunityId,
      jurisdiction: sync.jurisdiction,
      compliance: sync.compliance,
      security: sync.security,
      execution: sync.execution,
      timestamp: sync.timestamp,
    };
    const receiptContentHash = await sha256Hex(
      JSON.stringify({ ...baseForHash, subHashes: { inputHash, outputHash, policyHash } })
    );
    return {
      ...sync,
      hashes: {
        inputHash,
        outputHash,
        policyHash,
        receiptHash: receiptContentHash,
      },
    };
  } catch {
    return sync;
  }
}
