/**
 * Agent Economy – intent and batching types.
 * Used for one-sign-many-actions, netting, and settlement planning.
 * @see docs/AGENT-ECONOMY-UNTIL-BATCH.md
 */

/** Types of agent intents */
export type IntentType =
  | "PAYMENT"
  | "OFFER_MAKE"       // XRPL DEX OfferCreate
  | "OFFER_CANCEL"
  | "AMM_SWAP"
  | "AMM_DEPOSIT"
  | "AMM_WITHDRAW"
  | "TOKEN_ISSUE"
  | "TRUST_SET";

export type Asset =
  | { kind: "XRP" }
  | { kind: "IOU"; currency: string; issuer: string }
  | { kind: "MPT"; issuer: string; mptId: string }; // if used later

export type AgentId = string;
export type IntentId = string;

export interface IntentBase {
  id: IntentId;
  agentId: AgentId;
  type: IntentType;
  createdAt: number;
  expiresAt?: number;
  priority?: number;            // 0..100
  tags?: string[];
  memo?: string;
}

export interface PaymentIntent extends IntentBase {
  type: "PAYMENT";
  from: string;                 // XRPL address
  to: string;                   // XRPL address
  asset: Asset;
  amount: string;               // decimal as string
  maxFeeDrops?: string;
}

export interface OfferMakeIntent extends IntentBase {
  type: "OFFER_MAKE";
  owner: string;
  takerGets: { asset: Asset; amount: string };
  takerPays: { asset: Asset; amount: string };
  flags?: number;
  expiration?: number;
}

export interface OfferCancelIntent extends IntentBase {
  type: "OFFER_CANCEL";
  owner: string;
  offerSequence: number;
}

export interface AMMSwapIntent extends IntentBase {
  type: "AMM_SWAP";
  owner: string;
  in: { asset: Asset; amount: string };
  outMin: { asset: Asset; amount: string };
  pool?: { assetA: Asset; assetB: Asset };
}

export type Intent =
  | PaymentIntent
  | OfferMakeIntent
  | OfferCancelIntent
  | AMMSwapIntent;

export interface ValidationResult {
  ok: boolean;
  reasons?: string[];
  normalized?: Intent; // e.g., rounded amounts, canonical asset IDs
  riskScore?: number;  // 0..1
}

export interface BatchWindow {
  id: string;
  openedAt: number;
  closesAt: number;
  intents: Intent[];
}

export interface NettedObligation {
  from: string;
  to: string;
  asset: Asset;
  amount: string;
}

export interface SettlementPlan {
  id: string;
  windowId: string;
  netting?: NettedObligation[];
  xrplTxs: PlannedTx[];
  summary: {
    intentsIn: number;
    txsOut: number;
    nettingSavings: number; // intentsIn - txsOut approximation
  };
}

export interface PlannedTx {
  kind: "XRPL_TX";
  txType: string;              // Payment, OfferCreate, etc.
  account: string;
  payload: Record<string, unknown>; // xrpl.js format later
  dependsOn?: string[];        // internal ordering dependencies
}
