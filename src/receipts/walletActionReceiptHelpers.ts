/**
 * Task receipts for Wallet Actions + Safety Kernel outcomes (local audit only).
 */

import { getCompliancePermissionSet } from '../compliance/jurisdictionRules';
import { useComplianceStore } from '../store/complianceStore';
import { useSecurityStore } from '../store/securityStore';
import { useTaskReceiptStore } from '../store/taskReceiptStore';
import {
  createTaskReceiptAsync,
  getAllowedActionsFromPermissionSet,
  getBlockedActionsFromPermissionSet,
} from './taskReceiptEngine';
import type { CreateTaskReceiptInput, ReceiptMode, ReceiptStatus } from './taskReceiptTypes';

function baseWalletReceipt(
  overrides: Partial<CreateTaskReceiptInput> & Pick<CreateTaskReceiptInput, 'title' | 'summary'>
): CreateTaskReceiptInput {
  const p = useComplianceStore.getState().profile;
  const perm = getCompliancePermissionSet(p);
  const sec = useSecurityStore.getState();
  return {
    source: 'wallet_actions',
    moduleId: 'wallet_actions',
    mode: 'read_only',
    jurisdiction: {
      country: p.country,
      region: p.region,
      userType: p.userType,
      intendedUse: p.intendedUse,
      botMode: p.botMode,
    },
    compliance: {
      riskLevel: perm.riskLevel,
      requiresHumanApproval: perm.requiresHumanApproval,
      requiresLegalReview: perm.requiresLegalReview,
      allowedActions: getAllowedActionsFromPermissionSet(perm),
      blockedActions: getBlockedActionsFromPermissionSet(perm),
    },
    security: {
      poisoningFlags: [],
      mainnetLocked: sec.mainnetLocked,
      privateKeyAccessAllowed: false,
      autonomousExecutionAllowed: false,
      humanApprovalRequired: true,
    },
    execution: {
      executionEnabled: false,
      mainnetExecution: false,
      custody: false,
      privateKeyAccess: false,
      transactionSubmitted: false,
    },
    ...overrides,
  };
}

export async function recordWalletSafetyReceipt(params: {
  title: string;
  summary: string;
  mode: ReceiptMode;
  status: ReceiptStatus;
  promptScanStatus?: string;
  promptScanSeverity?: string;
}): Promise<void> {
  const input = baseWalletReceipt({
    title: params.title,
    summary: params.summary,
    mode: params.mode,
    status: params.status,
    security: {
      poisoningFlags: [],
      mainnetLocked: useSecurityStore.getState().mainnetLocked,
      privateKeyAccessAllowed: false,
      autonomousExecutionAllowed: false,
      humanApprovalRequired: true,
      promptScanStatus: params.promptScanStatus,
      promptScanSeverity: params.promptScanSeverity,
    },
  });
  const r = await createTaskReceiptAsync(input);
  useTaskReceiptStore.getState().addReceipt(r);
}
