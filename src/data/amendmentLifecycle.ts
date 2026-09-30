export type AmendmentLifecycleStatus =
  | 'development'
  | 'released'
  | 'voting'
  | 'majority'
  | 'enabled'
  | 'retired'
  | 'unsupported';

export interface AmendmentLifecycleEvent {
  name: string;
  status: AmendmentLifecycleStatus;
  releasedInVersion?: string;
  votingStatus?: string;
  majorityStart?: string;
  expectedActivation?: string;
  activatedAt?: string;
  replaces?: string[];
  retiredAt?: string;
  lastVerified: string;
  sourceUrls: string[];
  notes?: string;
}

export const amendmentLifecycleEvents: AmendmentLifecycleEvent[] = [
  {
    name: 'fixBatchV1_2',
    status: 'majority',
    releasedInVersion: '3.4.1',
    expectedActivation: '2026-10-09',
    lastVerified: '2026-09-30',
    sourceUrls: ['https://xrpl.org/blog/2026/xrpld-3.4.1'],
    notes: 'Security-sensitive Batch hardening. Treat expected activation as conditional until Mainnet activation is independently verified.',
  },
  {
    name: 'LendingProtocolV1_1',
    status: 'released',
    releasedInVersion: '3.4.0',
    lastVerified: '2026-09-30',
    sourceUrls: ['https://xrpl.org/blog/2026/xrpld-3.4.0'],
  },
  {
    name: 'fixCleanup3_4_0',
    status: 'released',
    releasedInVersion: '3.4.0',
    lastVerified: '2026-09-30',
    sourceUrls: ['https://xrpl.org/blog/2026/xrpld-3.4.0'],
  },
  {
    name: 'fixAMMOverflowOffer',
    status: 'retired',
    retiredAt: '2026-09-16',
    releasedInVersion: '3.4.0',
    lastVerified: '2026-09-30',
    sourceUrls: ['https://xrpl.org/blog/2026/xrpld-3.4.0'],
  },
  {
    name: 'PermissionDelegationV1_1',
    status: 'released',
    releasedInVersion: '3.3.0',
    replaces: ['PermissionDelegation'],
    lastVerified: '2026-09-30',
    sourceUrls: ['https://xrpl.org/blog/2026/xrpld-3.3.0'],
  },
  {
    name: 'BatchV1_1',
    status: 'released',
    releasedInVersion: '3.3.0',
    replaces: ['Batch', 'fixBatchInnerSigs'],
    lastVerified: '2026-09-30',
    sourceUrls: [
      'https://xrpl.org/blog/2026/xrpld-3.3.0',
      'https://xrpl.org/blog/2026/vulnerabilitydisclosurereport-bug-feb2026',
    ],
  },
  {
    name: 'InvariantsV1_1',
    status: 'development',
    lastVerified: '2026-09-30',
    sourceUrls: ['https://xrpl.org/resources/known-amendments'],
  },
  {
    name: 'MPTokensV2',
    status: 'development',
    lastVerified: '2026-09-30',
    sourceUrls: ['https://xrpl.org/resources/known-amendments'],
  },
  {
    name: 'SmartEscrow',
    status: 'development',
    lastVerified: '2026-09-30',
    sourceUrls: ['https://xrpl.org/resources/known-amendments'],
  },
];

export function getAmendmentLifecycle(name: string): AmendmentLifecycleEvent | undefined {
  return amendmentLifecycleEvents.find((event) => event.name === name);
}

export function isActivated(event: AmendmentLifecycleEvent): boolean {
  return event.status === 'enabled' && Boolean(event.activatedAt);
}
