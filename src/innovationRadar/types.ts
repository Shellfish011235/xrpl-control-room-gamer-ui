/**
 * Innovation Radar – event and signal types for RSS, GitHub, and trends.
 */

export type RadarEventSource = 'rss' | 'github' | 'hackathon' | 'announcement';

export interface RadarFeedItem {
  id: string;
  source: RadarEventSource;
  sourceLabel: string;
  title: string;
  link?: string;
  description?: string;
  publishedAt: number;
  raw?: Record<string, unknown>;
}

export interface TrendSignal {
  id: string;
  type: 'keyword_spike' | 'relevance_score' | 'activity_spike' | 'new_headline';
  title: string;
  description: string;
  relevanceScore: number;
  payload: {
    feedItem?: RadarFeedItem;
    keywords?: string[];
    zScore?: number;
    count?: number;
  };
  at: number;
}

export type InnovationRadarEvent =
  | { type: 'RADAR_HEADLINE'; item: RadarFeedItem; relevanceScore: number }
  | { type: 'RADAR_TREND'; signal: TrendSignal }
  | { type: 'RADAR_GITHUB_ACTIVITY'; repo: string; activity: string; count: number }
  | { type: 'RADAR_TICK'; feedsPolled: number; newItems: number };

export const TRENDING_KEYWORDS = [
  'XLS-56', 'AMM', 'RWA', 'hooks', 'xrpl', 'ripple', 'batch', 'sidechain',
  'evm', 'nft', 'defi', 'tokenization', 'cross-chain', 'hackathon', 'apex',
] as const;
