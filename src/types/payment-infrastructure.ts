/**
 * Global Payment Infrastructure map – node/edge types and fields.
 * Reuses ObservationClass/confidence from telemetry-truth-model.
 * Do not overclaim: every node/edge has observationClass, confidence, isMock where applicable.
 */

import type { ObservationClass } from './telemetry-truth-model';

// ==================== NODE TYPES ====================

export type PaymentInfraNodeType =
  | 'payment_hub'
  | 'settlement_rail'
  | 'routing_protocol'
  | 'payment_processor'
  | 'national_switch'
  | 'interoperability_gateway'
  | 'asset_network'
  | 'cbdc_rail';

// ==================== EDGE TYPES ====================

export type PaymentInfraEdgeType =
  | 'routing'
  | 'settlement'
  | 'liquidity'
  | 'interoperability'
  | 'corridor'
  | 'bridge';

// ==================== NODE ====================

export interface PaymentInfraNode {
  id: string;
  name: string;
  type: PaymentInfraNodeType;
  region: string;
  status: 'active' | 'pilot' | 'announced' | 'deprecated' | 'unknown';
  description: string;
  /** Monthly transaction count (display string or number) */
  monthlyTransactions?: string | number;
  /** Monthly value/volume in USD (display string or number) */
  monthlyValueUsd?: string | number;
  /** Connected rail/hub IDs or names */
  connectedNetworks?: string[];
  supportedFiatCurrencies?: string[];
  supportedCryptoAssets?: string[];
  supportedStablecoins?: string[];
  supportedCBDCs?: string[];
  /** 0–100 */
  confidence: number;
  /** observed | derived | inferred | synthetic | unknown */
  observationClass: ObservationClass;
  /** e.g. "Public docs", "API", "Mock" */
  provenance?: string;
  isMock: boolean;
  /** Optional trend for monthly activity */
  trend?: 'up' | 'down' | 'stable' | 'unknown';
}

// ==================== EDGE ====================

export interface PaymentInfraEdge {
  id: string;
  source: string;
  target: string;
  type: PaymentInfraEdgeType;
  label?: string;
  confidence: number;
  observationClass: ObservationClass;
  /** 0–1 visual weight */
  volumeWeight?: number;
  health?: 'up' | 'degraded' | 'down' | 'unknown';
  isMock: boolean;
}

// ==================== LAYOUT (from transform) ====================

export interface PaymentInfraNodeLayout extends PaymentInfraNode {
  x: number;
  y: number;
}

export interface PaymentInfraEdgeLayout extends PaymentInfraEdge {
  /** Computed for rendering */
  opacity?: number;
}
