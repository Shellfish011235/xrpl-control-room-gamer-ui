/**
 * Shared Task Receipt (v0.1) — local operator audit shape. Not an on-ledger object.
 */

export type ReceiptSource =
  | 'mission_control'
  | 'private_quant_lab'
  | 'agent_fleet'
  | 'compliance_guard'
  | 'security_ops'
  | 'payment_rails'
  | 'ledger_intel'
  | 'manual';

export type ReceiptMode =
  | 'read_only'
  | 'simulation_only'
  | 'user_approved_signing'
  | 'blocked'
  | 'review_required';

export type ReceiptStatus = 'created' | 'passed' | 'blocked' | 'needs_review' | 'simulated';

export interface TaskReceiptJurisdiction {
  country: string;
  region: string;
  userType: string;
  intendedUse: string;
  botMode: string;
}

export interface TaskReceiptCompliance {
  riskLevel: string;
  requiresHumanApproval: boolean;
  requiresLegalReview: boolean;
  allowedActions: string[];
  blockedActions: string[];
}

export interface TaskReceiptSecurity {
  promptScanStatus?: string;
  promptScanSeverity?: string;
  poisoningFlags: string[];
  mainnetLocked: boolean;
  privateKeyAccessAllowed: boolean;
  autonomousExecutionAllowed: boolean;
  humanApprovalRequired: boolean;
}

export interface TaskReceiptExecution {
  executionEnabled: boolean;
  mainnetExecution: boolean;
  custody: boolean;
  privateKeyAccess: boolean;
  transactionSubmitted: boolean;
}

export interface TaskReceiptHashes {
  inputHash?: string;
  outputHash?: string;
  policyHash?: string;
  receiptHash?: string;
}

export interface TaskReceipt {
  id: string;
  timestamp: number;
  source: ReceiptSource;
  title: string;
  summary: string;
  mode: ReceiptMode;
  status: ReceiptStatus;
  moduleId?: string;
  agentId?: string;
  opportunityId?: string;
  jurisdiction: TaskReceiptJurisdiction;
  compliance: TaskReceiptCompliance;
  security: TaskReceiptSecurity;
  execution: TaskReceiptExecution;
  hashes: TaskReceiptHashes;
  notes?: string[];
}

/** Input to `createTaskReceipt` — id/timestamp/receiptHash in hashes are assigned by the engine. */
export interface CreateTaskReceiptInput {
  source: ReceiptSource;
  title: string;
  summary: string;
  mode: ReceiptMode;
  status?: ReceiptStatus;
  moduleId?: string;
  agentId?: string;
  opportunityId?: string;
  jurisdiction: TaskReceiptJurisdiction;
  compliance: TaskReceiptCompliance;
  security: TaskReceiptSecurity;
  execution?: Partial<TaskReceiptExecution>;
  hashes?: Partial<TaskReceiptHashes>;
  notes?: string[];
}
