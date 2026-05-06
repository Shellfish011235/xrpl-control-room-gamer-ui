/**
 * Safety Kernel v0.2 — pure evaluation only. Callers enforce decisions (UI, wallet, orchestrator).
 * No state mutation, no network I/O, no signing.
 */

import { isValidClassicAddress } from 'xrpl';
import { scanPrompt } from '../security/promptFirewall';
import { canUseCapability, getSafetyModePolicy } from './safetyPolicy';
import type { SafetyCapability, SafetyDecision, SafetyDecisionStatus, SafetyIntent, SafetyMode } from './safetyTypes';

const MAINNET_CONFIRM_MAX_AGE_MS = 8 * 60 * 60 * 1000;

const ALWAYS_BLOCK: SafetyCapability[] = [
  'store_private_keys',
  'custody_funds',
  'autonomous_execution',
  'broadcast_signed_transaction',
  'change_destination_address',
];

function isMainnetConfirmationFresh(at: unknown): boolean {
  return typeof at === 'number' && Number.isFinite(at) && Date.now() - at >= 0 && Date.now() - at <= MAINNET_CONFIRM_MAX_AGE_MS;
}

/**
 * Evaluate a single safety intent. Pure function.
 */
export function evaluateSafetyIntent(intent: SafetyIntent, fallbackMode: SafetyMode = 'read_only'): SafetyDecision {
  const mode = intent.mode ?? fallbackMode;
  const capability = intent.capability;
  const reasons: string[] = [];
  const warnings: string[] = [];
  const requiredActions: string[] = [];
  let status: SafetyDecisionStatus = 'allowed';
  let allowed = true;

  if (ALWAYS_BLOCK.includes(capability)) {
    return {
      status: 'blocked',
      allowed: false,
      reasons: ['Capability is never permitted in this application.'],
      warnings: [],
      requiredActions: [],
      mode,
      capability,
      intent,
      timestamp: Date.now(),
    };
  }

  if (mode === 'disabled') {
    return {
      status: 'blocked',
      allowed: false,
      reasons: ['Safety mode is disabled / emergency halt — all safety-sensitive actions are blocked.'],
      warnings: [],
      requiredActions: ['Re-enable a non-disabled safety mode in Compliance / settings.'],
      mode,
      capability,
      intent,
      timestamp: Date.now(),
    };
  }

  if (!canUseCapability(mode, capability)) {
    const policy = getSafetyModePolicy(mode);
    return {
      status: 'blocked',
      allowed: false,
      reasons: [
        `Capability "${capability}" is not allowed in "${policy.label}" mode.`,
        'Switch Safety Mode to User-approved Wallet Signing to create Xaman signing requests.',
      ],
      warnings: [],
      requiredActions: ['Set safety mode to User-approved Wallet Signing for external signing.'],
      mode,
      capability,
      intent,
      timestamp: Date.now(),
    };
  }

  const textParts = [intent.promptText, intent.untrustedText].filter(Boolean).join('\n');
  if (textParts.trim()) {
    const scan = scanPrompt(textParts);
    if (scan.status === 'blocked') {
      reasons.push('Prompt Firewall blocked unsafe input');
      reasons.push(scan.explanation);
      allowed = false;
      status = 'blocked';
    } else if (scan.status === 'suspicious') {
      warnings.push(`Prompt scan: ${scan.flags.join(', ')} — ${scan.explanation}`);
      if (capability === 'request_wallet_signature' || capability === 'create_draft_intent') {
        requiredActions.push('Review flagged content before proceeding');
        status = 'needs_review';
      }
    }
  }

  const signingActions = ['send_xrp', 'place_offer', 'cancel_offer'] as const;
  const isSigningAction = signingActions.includes(intent.action as (typeof signingActions)[number]);
  const network = intent.network ?? 'testnet';
  const mainnetConfirmedAt = intent.metadata?.mainnetConfirmedAt;

  if (
    network === 'mainnet' &&
    isSigningAction &&
    intent.capability === 'request_wallet_signature'
  ) {
    warnings.push('Mainnet uses real funds. External wallet approval required.');
    if (mode !== 'user_approved_signing') {
      allowed = false;
      status = 'blocked';
      reasons.push('Mainnet signing requires Safety Mode: User-approved Wallet Signing.');
    } else if (!isMainnetConfirmationFresh(mainnetConfirmedAt)) {
      allowed = false;
      status = 'blocked';
      reasons.push(
        'Mainnet signing requires an explicit mainnet acknowledgment. Confirm mainnet in the platform bar (or Control Room).'
      );
      requiredActions.push('Select Mainnet and accept the confirmation dialog.');
    }
  }

  if (intent.action === 'send_xrp') {
    const dest = intent.destination?.trim();
    if (!dest) {
      allowed = false;
      status = 'blocked';
      reasons.push('Payment requires a destination address.');
    } else if (!isValidClassicAddress(dest)) {
      allowed = false;
      status = 'blocked';
      reasons.push('Destination is not a valid classic XRPL address.');
    }
    const amt = intent.amountXrp;
    if (amt == null || !Number.isFinite(amt) || amt <= 0) {
      allowed = false;
      status = 'blocked';
      reasons.push('Amount must be a positive number (XRP).');
    }
    if (intent.destinationTag === undefined) {
      warnings.push('Destination tag may be required for exchanges/custodians.');
    }
  }

  if (intent.action === 'place_offer') {
    if (!intent.issuer?.trim() || !isValidClassicAddress(intent.issuer.trim())) {
      allowed = false;
      status = 'blocked';
      reasons.push('DEX offer requires a valid issuer address.');
    }
    if (!intent.currency?.trim()) {
      allowed = false;
      status = 'blocked';
      reasons.push('DEX offer requires a currency code.');
    }
    warnings.push('DEX offers and issued assets carry issuer, liquidity, and trustline risk.');
  }

  if (intent.transactionType === 'TrustSet') {
    status = status === 'blocked' ? 'blocked' : 'needs_review';
    warnings.push('TrustSet creates token/issuer exposure.');
    requiredActions.push('Review issuer and limit before signing in Xaman.');
  }

  if (!allowed && status !== 'blocked') {
    status = 'blocked';
  }

  return {
    status,
    allowed,
    reasons,
    warnings,
    requiredActions,
    mode,
    capability,
    intent,
    timestamp: Date.now(),
  };
}

export function assertSafetyAllowed(decision: SafetyDecision): void {
  if (!decision.allowed || decision.status === 'blocked') {
    const msg = decision.reasons.length ? decision.reasons.join(' ') : 'Action blocked by Safety Kernel.';
    throw new Error(msg);
  }
}

export function summarizeSafetyDecision(decision: SafetyDecision): string {
  const parts = [
    `[${decision.status.toUpperCase()}] ${decision.mode} / ${decision.capability}`,
    ...decision.reasons,
    ...decision.warnings.map((w) => `⚠ ${w}`),
    ...decision.requiredActions.map((r) => `→ ${r}`),
  ];
  return parts.filter(Boolean).join('\n');
}
