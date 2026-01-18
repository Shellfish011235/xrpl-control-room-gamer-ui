// XRPL Control Room Type Definitions

export type TabId = 
  | 'overworld'
  | 'contributors'
  | 'technical'
  | 'regulations'
  | 'stablecoins'
  | 'resources';

export interface Tab {
  id: TabId;
  label: string;
  shortcut: string;
  icon: string;
}

// Panel Dock Types
export interface PinnedPanel {
  id: string;
  type: 'contributor' | 'repo' | 'regulation' | 'resource' | 'etf' | 'alert';
  title: string;
  data: Record<string, unknown>;
  pinnedAt: string;
}

// Contributor Types
export interface Contributor {
  id: string;
  handle: string;
  name: string;
  role: string;
  organization?: string;
  contributions: string[];
  twitter?: string;
  github?: string;
  avatar?: string;
}

export interface Repository {
  id: string;
  name: string;
  fullName: string;
  description: string;
  url: string;
  stars: number;
  forks: number;
  contributors: number;
  license: string;
  language: string;
  lastCommit: string;
  topics: string[];
}

// Regulation Types
export interface Regulation {
  id: string;
  title: string;
  jurisdiction: 'US' | 'EU' | 'UK' | 'GLOBAL' | 'ASIA';
  type: 'executive_order' | 'legislation' | 'guidance' | 'ruling' | 'framework';
  status: 'active' | 'pending' | 'revoked' | 'proposed';
  date: string;
  summary: string;
  impact: 'positive' | 'negative' | 'neutral';
  impactDescription: string;
  source: string;
  sourceUrl: string;
}

export interface RegulatoryAlert {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  timestamp: string;
  summary: string;
  regulation?: Regulation;
}

// Technical Types
export interface NetworkStats {
  id: string;
  network: 'xrpl_mainnet' | 'evm_sidechain';
  tps: number;
  avgFee: string;
  blockTime: string;
  validators: number;
  totalAccounts: number;
  totalTransactions: number;
  lastUpdated: string;
}

export interface EVMToken {
  symbol: string;
  name: string;
  address: string;
  totalSupply: string;
  holders: number;
}

// Stablecoin Types
export interface Stablecoin {
  id: string;
  symbol: string;
  name: string;
  issuer: string;
  marketCap: number;
  chains: string[];
  peg: string;
  reserves: string;
  auditUrl?: string;
}

export interface ETF {
  id: string;
  ticker: string;
  name: string;
  issuer: string;
  approvalDate: string;
  aum: number;
  dailyVolume: number;
  expense: number;
  price: number;
  change24h: number;
}

export interface ETFInflow {
  date: string;
  amount: number;
  cumulative: number;
}

// Resource Types
export interface Resource {
  id: string;
  type: 'github' | 'reddit' | 'youtube' | 'document' | 'tool';
  title: string;
  url: string;
  description: string;
  category: string;
  lastUpdated?: string;
}

// Feed Types
export interface Tweet {
  id: string;
  author: string;
  handle: string;
  content: string;
  timestamp: string;
  likes: number;
  retweets: number;
  avatar?: string;
}

export interface GitHubEvent {
  id: string;
  type: 'commit' | 'release' | 'issue' | 'pr';
  repo: string;
  title: string;
  author: string;
  timestamp: string;
  url: string;
}

// Timeline Types
export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  category: 'technical' | 'regulatory' | 'community' | 'market';
  significance: 'major' | 'minor';
}

// Guided Path Types
export interface GuidedStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export interface GuidedPath {
  id: string;
  title: string;
  description: string;
  steps: GuidedStep[];
  category: TabId;
}

// UI State Types
export interface ScannerState {
  active: boolean;
  focusedSection: string | null;
}

export interface UIState {
  activeTab: TabId;
  scanner: ScannerState;
  pinnedPanels: PinnedPanel[];
  dockExpanded: boolean;
  guidedPaths: Record<string, boolean[]>; // path id -> step completion status
  lastVisited: Record<TabId, string>;
}
