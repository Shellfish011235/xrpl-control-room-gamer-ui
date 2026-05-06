import type { SafetyCapability, SafetyMode } from './safetyTypes';

export interface SafetyModePolicy {
  mode: SafetyMode;
  label: string;
  description: string;
  allowedCapabilities: SafetyCapability[];
  blockedCapabilities: SafetyCapability[];
  requiresHumanApproval: boolean;
  allowsMainnet: boolean;
  allowsPrivateKeys: false;
  allowsCustody: false;
  allowsAutonomousExecution: boolean;
}

export const SAFETY_MODE_POLICIES: Record<SafetyMode, SafetyModePolicy> = {
  disabled: {
    mode: 'disabled',
    label: 'Disabled / Emergency Halt',
    description: 'All active safety-sensitive actions are blocked.',
    allowedCapabilities: [],
    blockedCapabilities: [
      'observe',
      'explain',
      'simulate',
      'create_draft_intent',
      'request_wallet_signature',
      'broadcast_signed_transaction',
      'autonomous_execution',
      'store_private_keys',
      'custody_funds',
      'change_destination_address',
    ],
    requiresHumanApproval: true,
    allowsMainnet: false,
    allowsPrivateKeys: false,
    allowsCustody: false,
    allowsAutonomousExecution: false,
  },

  read_only: {
    mode: 'read_only',
    label: 'Read-only Intelligence',
    description: 'Observe and explain only. No drafts, signing, custody, or execution.',
    allowedCapabilities: ['observe', 'explain'],
    blockedCapabilities: [
      'simulate',
      'create_draft_intent',
      'request_wallet_signature',
      'broadcast_signed_transaction',
      'autonomous_execution',
      'store_private_keys',
      'custody_funds',
      'change_destination_address',
    ],
    requiresHumanApproval: false,
    allowsMainnet: true,
    allowsPrivateKeys: false,
    allowsCustody: false,
    allowsAutonomousExecution: false,
  },

  simulation_only: {
    mode: 'simulation_only',
    label: 'Simulation Only',
    description: 'Observe, explain, and simulate. No wallet signing or real fund movement.',
    allowedCapabilities: ['observe', 'explain', 'simulate'],
    blockedCapabilities: [
      'create_draft_intent',
      'request_wallet_signature',
      'broadcast_signed_transaction',
      'autonomous_execution',
      'store_private_keys',
      'custody_funds',
      'change_destination_address',
    ],
    requiresHumanApproval: false,
    allowsMainnet: true,
    allowsPrivateKeys: false,
    allowsCustody: false,
    allowsAutonomousExecution: false,
  },

  draft_intent: {
    mode: 'draft_intent',
    label: 'Draft Intent',
    description: 'Can create bounded draft intents for review. No signing.',
    allowedCapabilities: ['observe', 'explain', 'simulate', 'create_draft_intent'],
    blockedCapabilities: [
      'request_wallet_signature',
      'broadcast_signed_transaction',
      'autonomous_execution',
      'store_private_keys',
      'custody_funds',
      'change_destination_address',
    ],
    requiresHumanApproval: true,
    allowsMainnet: true,
    allowsPrivateKeys: false,
    allowsCustody: false,
    allowsAutonomousExecution: false,
  },

  user_approved_signing: {
    mode: 'user_approved_signing',
    label: 'User-approved Wallet Signing',
    description: 'Can request external wallet signature after safety checks. No private keys in app.',
    allowedCapabilities: [
      'observe',
      'explain',
      'simulate',
      'create_draft_intent',
      'request_wallet_signature',
    ],
    blockedCapabilities: [
      'broadcast_signed_transaction',
      'autonomous_execution',
      'store_private_keys',
      'custody_funds',
      'change_destination_address',
    ],
    requiresHumanApproval: true,
    allowsMainnet: true,
    allowsPrivateKeys: false,
    allowsCustody: false,
    allowsAutonomousExecution: false,
  },

  restricted_automation: {
    mode: 'restricted_automation',
    label: 'Restricted Automation',
    description: 'Future mode only. Automation must remain capped, logged, approved, and externally signed.',
    allowedCapabilities: [
      'observe',
      'explain',
      'simulate',
      'create_draft_intent',
      'request_wallet_signature',
    ],
    blockedCapabilities: [
      'broadcast_signed_transaction',
      'autonomous_execution',
      'store_private_keys',
      'custody_funds',
      'change_destination_address',
    ],
    requiresHumanApproval: true,
    allowsMainnet: false,
    allowsPrivateKeys: false,
    allowsCustody: false,
    allowsAutonomousExecution: false,
  },
};

export function getSafetyModePolicy(mode: SafetyMode): SafetyModePolicy {
  return SAFETY_MODE_POLICIES[mode];
}

export function canUseCapability(mode: SafetyMode, capability: SafetyCapability): boolean {
  return SAFETY_MODE_POLICIES[mode].allowedCapabilities.includes(capability);
}

export function getBlockedCapabilities(mode: SafetyMode): SafetyCapability[] {
  return SAFETY_MODE_POLICIES[mode].blockedCapabilities;
}
