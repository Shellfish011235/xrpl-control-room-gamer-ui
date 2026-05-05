import type { AgentBlockedAction, AgentCapability, AgentDefinition } from './types';

/** Universal blocks for every agent. */
export const UNIVERSAL_BLOCKED: AgentBlockedAction[] = [
  'request_private_key',
  'export_secret',
  'bypass_policy',
];

/** Additional blocks for liquidity / payment–surface agents. */
export const FINANCIAL_BLOCKED: AgentBlockedAction[] = [
  'sign_transaction',
  'send_payment',
  'place_order',
  'bridge_assets',
  'swap_assets',
  'custody_assets',
];

function blocks(...extra: AgentBlockedAction[]): AgentBlockedAction[] {
  return [...UNIVERSAL_BLOCKED, ...extra];
}

export const AGENT_REGISTRY: AgentDefinition[] = [
  {
    id: 'network-sentinel',
    name: 'Network Sentinel',
    shortName: 'NetSent',
    description: 'Observes XRPL connectivity, ledger cadence, and public validator signals — no execution.',
    role: 'XRPL network observability',
    status: 'idle',
    riskLevel: 'green',
    capabilities: ['read_xrpl_network', 'read_validator_data', 'simulate_route'],
    blockedActions: blocks(),
    dataSources: ['xrpl WebSocket client', 'xrplcluster / altnet endpoints', 'XRPScan-style public feeds (when wired)'],
  },
  {
    id: 'wallet-intel',
    name: 'Wallet Intelligence',
    shortName: 'WalletIntel',
    description: 'Read-only wallet posture: balances, trust lines context — never moves funds.',
    role: 'Read-only wallet intelligence',
    status: 'idle',
    riskLevel: 'yellow',
    capabilities: ['read_xrpl_wallet', 'create_receipt', 'prepare_user_action'],
    blockedActions: blocks(...FINANCIAL_BLOCKED),
    dataSources: ['account_info (read)', 'walletStore active address', 'XRPL JSON-RPC'],
  },
  {
    id: 'liquidity-scout',
    name: 'Liquidity Scout',
    shortName: 'LiqScout',
    description: 'Scans AMM / CLOB context for analysis and simulation labels only.',
    role: 'Liquidity observation & simulation',
    status: 'idle',
    riskLevel: 'yellow',
    capabilities: ['read_xrpl_liquidity', 'simulate_route', 'simulate_trade', 'create_receipt'],
    blockedActions: blocks(...FINANCIAL_BLOCKED),
    dataSources: ['book_offers / path_find adapters', 'AMM hooks (when wired)', 'DEX mock or live read-only'],
  },
  {
    id: 'ilp-corridor-analyst',
    name: 'ILP Corridor Analyst',
    shortName: 'ILPAnalyst',
    description: 'ILP / Open Payments endpoint health and corridor exposure — analysis only.',
    role: 'ILP corridor analysis',
    status: 'idle',
    riskLevel: 'yellow',
    capabilities: ['read_ilp_endpoint_health', 'read_rafiki_telemetry', 'simulate_route', 'create_receipt'],
    blockedActions: blocks(...FINANCIAL_BLOCKED),
    dataSources: ['ilpOperatorRealtimeConfig', 'openPaymentsHealthAdapter', 'rafikiTelemetryAdapter', 'snapshot JSON'],
  },
  {
    id: 'compliance-guard',
    name: 'Compliance Guard',
    shortName: 'Compliance',
    description: 'Jurisdiction and policy posture reviews — flags review_required, never executes.',
    role: 'Compliance analysis',
    status: 'idle',
    riskLevel: 'yellow',
    capabilities: ['analyze_compliance', 'create_receipt', 'prepare_user_action'],
    blockedActions: blocks(...FINANCIAL_BLOCKED),
    dataSources: ['complianceStore', 'jurisdictionRules', 'platform mode (sim vs live display)'],
  },
  {
    id: 'prompt-firewall',
    name: 'Prompt Firewall',
    shortName: 'PromptFW',
    description: 'Classifies prompt risk; recommends manual review — no signing or key access.',
    role: 'Prompt & intent safety',
    status: 'idle',
    riskLevel: 'red',
    capabilities: ['analyze_security', 'create_receipt'],
    blockedActions: blocks(...FINANCIAL_BLOCKED),
    dataSources: ['promptFirewall patterns', 'securityStore', 'task receipt fingerprints'],
  },
  {
    id: 'receipt-auditor',
    name: 'Receipt Auditor',
    shortName: 'RcptAudit',
    description: 'Traces agent task receipts and local audit hashes — no ledger writes.',
    role: 'Receipt integrity',
    status: 'idle',
    riskLevel: 'green',
    capabilities: ['create_receipt'],
    blockedActions: blocks(),
    dataSources: ['taskReceiptStore', 'agentReceiptEngine output hashes'],
  },
  {
    id: 'small-business-ops',
    name: 'Small Business Ops',
    shortName: 'SMBOps',
    description: 'Operational checklists: invoices, exports, records-before-funds guidance.',
    role: 'SMB operations intelligence',
    status: 'idle',
    riskLevel: 'yellow',
    capabilities: ['prepare_user_action', 'create_receipt', 'analyze_compliance'],
    blockedActions: blocks(...FINANCIAL_BLOCKED),
    dataSources: ['Agent Economy caps/requests (UI state)', 'receipt exports (local)'],
  },
  {
    id: 'grant-scout',
    name: 'Grant Scout',
    shortName: 'GrantScout',
    description: 'Grant / nomination readiness: repo, README, safety boundaries — drafts only.',
    role: 'Grant readiness',
    status: 'idle',
    riskLevel: 'green',
    capabilities: ['prepare_user_action', 'create_receipt'],
    blockedActions: blocks(...FINANCIAL_BLOCKED),
    dataSources: ['repo metadata (manual)', 'README excerpts (user-provided)', 'AGENT_ACTIVATION.md policy surface'],
  },
];

export function getAgentById(id: string): AgentDefinition | undefined {
  return AGENT_REGISTRY.find((a) => a.id === id);
}

export function getAgentsByCapability(capability: AgentCapability): AgentDefinition[] {
  return AGENT_REGISTRY.filter((a) => a.capabilities.includes(capability));
}

/** Default roster activated in the runtime store (observe / analyze / simulate only). */
export function getDefaultActiveAgents(): AgentDefinition[] {
  return AGENT_REGISTRY.map((a) => ({ ...a, status: 'idle' as const }));
}
