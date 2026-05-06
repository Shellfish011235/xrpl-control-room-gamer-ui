export type SafetyMode =
  | 'disabled'
  | 'read_only'
  | 'simulation_only'
  | 'draft_intent'
  | 'user_approved_signing'
  | 'restricted_automation';

export type SafetyCapability =
  | 'observe'
  | 'explain'
  | 'simulate'
  | 'create_draft_intent'
  | 'request_wallet_signature'
  | 'broadcast_signed_transaction'
  | 'autonomous_execution'
  | 'store_private_keys'
  | 'custody_funds'
  | 'change_destination_address';

export type SafetyDecisionStatus = 'allowed' | 'blocked' | 'needs_review';

export interface SafetyIntent {
  id: string;
  source:
    | 'wallet_actions'
    | 'agent_orchestrator'
    | 'control_room'
    | 'search'
    | 'security_ops'
    | 'compliance_guard'
    | 'task_receipts'
    | 'unknown';
  action:
    | 'scan_prompt'
    | 'invoke_agent'
    | 'send_xrp'
    | 'place_offer'
    | 'cancel_offer'
    | 'create_payment_draft'
    | 'create_trade_draft'
    | 'toggle_mainnet'
    | 'read_wallet'
    | 'simulate'
    | 'unknown';
  capability: SafetyCapability;
  mode?: SafetyMode;
  network?: 'testnet' | 'mainnet';
  amountXrp?: number;
  destination?: string;
  destinationTag?: number;
  issuer?: string;
  currency?: string;
  transactionType?: string;
  promptText?: string;
  untrustedText?: string;
  metadata?: Record<string, unknown>;
}

export interface SafetyDecision {
  status: SafetyDecisionStatus;
  allowed: boolean;
  reasons: string[];
  warnings: string[];
  requiredActions: string[];
  mode: SafetyMode;
  capability: SafetyCapability;
  intent: SafetyIntent;
  timestamp: number;
}
