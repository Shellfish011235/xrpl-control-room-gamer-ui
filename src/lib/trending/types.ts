/**
 * Deterministic trending intelligence layer — cognitive + narrative + infra signals.
 * Cards are analytics-shaped; production can hydrate via RAG / retrieval (see trendCards.ts).
 */

export type TrendCategory = 'market' | 'infra' | 'narrative';

export type MomentumLevel = 'low' | 'medium' | 'high';

export type DecisionRiskLevel = 'low' | 'medium' | 'high';

export type SignalQuality = 'coherent' | 'fragmented' | 'chaotic';

export type CapitalFlowLevel = 'low' | 'medium' | 'high';

export type StrategicImpact = 'low' | 'high' | 'critical';

export type InfraTimeline = 'short' | 'medium' | 'long';

export type AttackType =
  | 'perception_shaping'
  | 'emotional_activation'
  | 'polarization'
  | 'confusion_flooding'
  | 'narrative_hijack';

export interface XrplRelevanceBlock {
  liquidity: string;
  payments: string;
  agents: string;
}

export interface ProofPanel {
  evidence: string[];
  sources: string[];
  confidence: number;
  lastUpdated: string;
}

export interface TrendCard {
  id: string;
  topic: string;
  category: TrendCategory;
  trendScore: number;
  momentum: MomentumLevel;
  cognitiveLoad: number;
  decisionRisk: DecisionRiskLevel;
  attackTypes: AttackType[];
  signalQuality: SignalQuality;
  narrativeRisk: number;
  coordinationScore: number;
  dominantFrames: string[];
  capitalFlow?: CapitalFlowLevel;
  strategicImpact?: StrategicImpact;
  timeline?: InfraTimeline;
  xrplRelevance: XrplRelevanceBlock;
  whyItMatters: string;
  proofPanel: ProofPanel;
}

export type IntelViewTab =
  | 'whats_trending'
  | 'narrative_pressure'
  | 'coordination_signals'
  | 'decision_impact'
  | 'infra_signals';
