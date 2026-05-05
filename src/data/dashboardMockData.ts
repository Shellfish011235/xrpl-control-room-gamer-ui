/**
 * Mock data for Dashboard: XRPL metrics, gamification, whale feed, events.
 * Replace with live APIs (xrpl.js, CoinGlass, freeDataFeeds) as needed.
 */

export interface HeroMetricsMock {
  totalValueUsd: number;
  xrpPrice: number;
  ledgerIndex: number;
  tps24h: number;
  recentTxCount: number;
  connectedWalletBalance: number | null;
}

export interface AmendmentSummaryMock {
  id: string;
  name: string;
  status: 'enabled' | 'pending' | 'voting';
  supportPct: number;
  eta?: string;
  impact: 'low' | 'medium' | 'high';
}

export interface MilestoneMock {
  id: string;
  label: string;
  current: number;
  target: number;
  unit: string;
  progressPct: number;
}

export interface WhaleTxMock {
  id: string;
  from: string;
  to: string;
  amountXrp: number;
  timeAgo: string;
  hash: string;
}

export interface EventMock {
  id: string;
  date: string;
  title: string;
  type: string;
  url: string;
  endDate: string;
}

export interface StrategyStatusMock {
  id: string;
  name: string;
  enabled: boolean;
  exposureXrp: number;
  pnl24h: number;
  status: 'idle' | 'running' | 'paused';
}

export interface LedgerSummaryMock {
  ledgerIndex: number;
  closeTime: string;
  txnCount: number;
  feeMin: string;
  feeMax: string;
}

// ——— Hero / Key metrics ———
export const heroMetricsMock: HeroMetricsMock = {
  totalValueUsd: 12450.0,
  xrpPrice: 2.48,
  ledgerIndex: 98_245_102,
  tps24h: 4.2,
  recentTxCount: 362_847,
  connectedWalletBalance: 5020.5,
};

// ——— Amendment summary (top pending / recently enabled) ———
export const amendmentSummaryMock: AmendmentSummaryMock[] = [
  { id: 'fixRemoveNFTokenAutoTrustLine', name: 'fixRemoveNFTokenAutoTrustLine', status: 'enabled', supportPct: 100, impact: 'low' },
  { id: 'fixNonFungibleTokensV1_2', name: 'fixNonFungibleTokensV1_2', status: 'enabled', supportPct: 100, impact: 'medium' },
  { id: 'fixIncludeKeyletFields', name: 'fixIncludeKeyletFields', status: 'pending', supportPct: 97, eta: '2d 4h', impact: 'low' },
  { id: 'featureXLS68d', name: 'XLS-68d (Clawback)', status: 'voting', supportPct: 82, impact: 'high' },
];

// ——— Milestones (accounts / transactions) ———
export const milestonesMock: MilestoneMock[] = [
  { id: 'accounts', label: 'XRPL Accounts', current: 87_200_000, target: 100_000_000, unit: '', progressPct: 87.2 },
  { id: 'transactions', label: 'Total Transactions', current: 920_000_000, target: 1_000_000_000, unit: '', progressPct: 92 },
  { id: 'years', label: '10 Years of XRPL', current: 10, target: 10, unit: 'years', progressPct: 100 },
];

// ——— Whale / large txn feed ———
export const whaleFeedMock: WhaleTxMock[] = [
  { id: '1', from: 'rABC...x7K9', to: 'rXYZ...mN4p', amountXrp: 12_500_000, timeAgo: '5m ago', hash: 'a1b2...' },
  { id: '2', from: 'rDEF...pQ2', to: 'rGHI...kL8', amountXrp: 5_200_000, timeAgo: '12m ago', hash: 'c3d4...' },
  { id: '3', from: 'rJKL...sT6', to: 'rMNO...vW1', amountXrp: 2_100_000, timeAgo: '28m ago', hash: 'e5f6...' },
  { id: '4', from: 'rPQR...yZ3', to: 'rSTU...bC9', amountXrp: 8_700_000, timeAgo: '1h ago', hash: 'g7h8...' },
];

// ——— Upcoming events (subset): Ripple + XRPL.org / Commons / ILF ———
export const eventsMock: EventMock[] = [
  { id: '1', date: 'Feb 10–12, 2026', title: 'EasyA Consensus Hong Kong Hackathon (XRPL partner)', type: 'hackathon', url: 'https://www.easya.io/events/easya-consensus-hong-kong-hackathon', endDate: '2026-02-12' },
  { id: '2', date: 'Apr 11–12, 2026', title: 'Hack The Block — PBW XRPL (Paris)', type: 'hackathon', url: 'https://lu.ma/Hacktheblock2026-PBW-XRPL', endDate: '2026-04-12' },
  { id: '3', date: 'May 5–7, 2026', title: 'Consensus Miami (XRP/XRPL)', type: 'conference', url: 'https://consensus.coindesk.com/', endDate: '2026-05-07' },
  { id: '4', date: 'May 5–7, 2026', title: 'EasyA Consensus Miami Hackathon (XRPL partner)', type: 'hackathon', url: 'https://www.easya.io/events/easya-consensus-miami-hackathon', endDate: '2026-05-07' },
  { id: '5', date: 'May 20–22, 2026', title: 'Chain of Blocks EU26 — Malta', type: 'conference', url: 'https://lu.ma/8xdc6wgg', endDate: '2026-05-22' },
  { id: '6', date: 'Jun 2–4, 2026', title: 'Money20/20 Europe — Amsterdam', type: 'conference', url: 'https://europe.money2020.com/', endDate: '2026-06-04' },
  { id: '7', date: 'Annual', title: 'Interledger Summit (ILP / Open Payments)', type: 'summit', url: 'https://interledger.org/summit', endDate: '2026-12-31' },
  { id: '8', date: 'Oct 27–29, 2026', title: 'Ripple Swell 2026 — NYC', type: 'summit', url: 'https://ripple.com/events/swell/', endDate: '2026-10-29' },
];

// ——— Strategy terminal summary ———
export const strategyStatusMock: StrategyStatusMock[] = [
  { id: 'grid', name: 'Grid', enabled: true, exposureXrp: 1200, pnl24h: 12.5, status: 'running' },
  { id: 'dca', name: 'DCA', enabled: true, exposureXrp: 500, pnl24h: -2.1, status: 'running' },
  { id: 'mm', name: 'Market Maker', enabled: false, exposureXrp: 0, pnl24h: 0, status: 'idle' },
  { id: 'arb', name: 'Arbitrage', enabled: false, exposureXrp: 0, pnl24h: 0, status: 'idle' },
];

// ——— Ledger summary ———
export const ledgerSummaryMock: LedgerSummaryMock = {
  ledgerIndex: 98_245_102,
  closeTime: new Date().toISOString(),
  txnCount: 127,
  feeMin: '0.00001',
  feeMax: '0.001',
};

// ——— Gamification (profile HUD) ———
export interface ProfileHUDMock {
  level: number;
  xp: number;
  xpToNextLevel: number;
  reputation: number;
  skillPoints: number;
  achievementsUnlocked: number;
  recentAchievement: { title: string; icon: string } | null;
}

export const profileHUDMock: ProfileHUDMock = {
  level: 15,
  xp: 7850,
  xpToNextLevel: 10000,
  reputation: 820,
  skillPoints: 42,
  achievementsUnlocked: 12,
  recentAchievement: { title: 'First DEX Trade', icon: '🎯' },
};
