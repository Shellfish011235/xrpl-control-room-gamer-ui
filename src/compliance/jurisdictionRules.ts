/**
 * Jurisdiction-style compliance *policy* evaluation for UI. Not legal advice; technical guardrails v0.1.
 * Does not submit transactions or enable in-app execution — consumers (e.g. Task Receipts) only record policy state.
 */

export type UserType = 'individual' | 'developer' | 'business' | 'institution';
export type IntendedUse =
  | 'education'
  | 'research'
  | 'wallet_monitoring'
  | 'payment_routing'
  | 'trading'
  | 'commercial_service';
export type BotMode = 'read_only' | 'simulation' | 'user_approved_signing' | 'restricted_professional';

export interface ComplianceProfile {
  country: string;
  region: string;
  userType: UserType;
  intendedUse: IntendedUse;
  botMode: BotMode;
}

export interface CompliancePermissionSet {
  canReadLedger: boolean;
  canAnalyzeWallets: boolean;
  canGenerateReports: boolean;
  canPrepareTransactions: boolean;
  canRequestWalletSignature: boolean;
  canBroadcastTransactions: boolean;
  canAutonomouslyTrade: boolean;
  canCustodyFunds: boolean;
  canStorePrivateKeys: boolean;
  canRouteThirdPartyPayments: boolean;
  canChangeDestinationAddress: boolean;
  requiresHumanApproval: boolean;
  requiresLegalReview: boolean;
  riskLevel: 'green' | 'yellow' | 'red';
  warnings: string[];
}

const BASE_WARNINGS: readonly string[] = [
  'This dashboard is educational and non-custodial.',
  'Do not enter private keys or seed phrases.',
  'The app does not receive, hold, transmit, or custody user funds.',
  'Mainnet transactions must be signed externally by the user.',
  'Commercial payment routing, autonomous trading, custody, pooled funds, or investment-advisory behavior may require licensing or legal review.',
] as const;

const LEGAL_REVIEW_INTENDED: ReadonlySet<IntendedUse> = new Set(['commercial_service', 'payment_routing', 'trading']);

export const DEFAULT_FLORIDA_PROFILE: ComplianceProfile = {
  country: 'United States',
  region: 'Florida',
  userType: 'individual',
  intendedUse: 'education',
  botMode: 'read_only',
};

/**
 * Map profile to allowed/blocked capabilities. v0.1: no custody, no broadcast, no store keys, no ILP third-party route change.
 */
export function getCompliancePermissionSet(profile: ComplianceProfile): CompliancePermissionSet {
  const { botMode, intendedUse, country, region, userType } = profile;
  const c = country.trim().toLowerCase();
  const us = c.includes('united state') || c === 'u.s.' || c === 'usa' || c === 'us';

  const requiresHumanApproval = botMode !== 'read_only';
  const requiresLegalReview = LEGAL_REVIEW_INTENDED.has(intendedUse) || botMode === 'restricted_professional';

  const riskLevel: 'green' | 'yellow' | 'red' =
    botMode === 'restricted_professional' ? 'red' : botMode === 'user_approved_signing' ? 'yellow' : 'green';

  const canReadLedger = true;
  const canAnalyzeWallets = true;
  const canGenerateReports = true;
  const canPrepareTransactions = botMode !== 'read_only';
  const canRequestWalletSignature = botMode === 'user_approved_signing';
  const canBroadcastTransactions = false;
  const canAutonomouslyTrade = false;
  const canCustodyFunds = false;
  const canStorePrivateKeys = false;
  const canRouteThirdPartyPayments = false;
  const canChangeDestinationAddress = false;

  const warnings = [...BASE_WARNINGS];
  if (requiresLegalReview) {
    warnings.push(
      'Your selected use case and/or mode may require legal and compliance review before any production or client-facing use.'
    );
  }
  if (botMode === 'restricted_professional' || userType === 'institution' || userType === 'business') {
    warnings.push(
      'Institutional, business, or “restricted professional” contexts are higher-risk — use counsel to scope duties and marketing.'
    );
  }
  if (!us && country.trim().length > 0) {
    const loc = [region, country].filter(Boolean).join(', ');
    warnings.push(`Jurisdiction: ${loc} — outside the U.S. default; local rules and licensing may differ.`);
  }

  return {
    canReadLedger,
    canAnalyzeWallets,
    canGenerateReports,
    canPrepareTransactions,
    canRequestWalletSignature,
    canBroadcastTransactions,
    canAutonomouslyTrade,
    canCustodyFunds,
    canStorePrivateKeys,
    canRouteThirdPartyPayments,
    canChangeDestinationAddress,
    requiresHumanApproval,
    requiresLegalReview,
    riskLevel,
    warnings,
  };
}
