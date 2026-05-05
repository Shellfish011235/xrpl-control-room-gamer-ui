export type AgentStatus =
  | 'idle'
  | 'observing'
  | 'analyzing'
  | 'recommending'
  | 'simulating'
  | 'blocked'
  | 'error';

export type AgentRiskLevel = 'green' | 'yellow' | 'red';

export type AgentCapability =
  | 'read_xrpl_network'
  | 'read_xrpl_wallet'
  | 'read_xrpl_liquidity'
  | 'read_validator_data'
  | 'read_ilp_endpoint_health'
  | 'read_rafiki_telemetry'
  | 'analyze_compliance'
  | 'analyze_security'
  | 'simulate_route'
  | 'simulate_trade'
  | 'create_receipt'
  | 'prepare_user_action';

export type AgentBlockedAction =
  | 'sign_transaction'
  | 'send_payment'
  | 'place_order'
  | 'bridge_assets'
  | 'swap_assets'
  | 'custody_assets'
  | 'request_private_key'
  | 'export_secret'
  | 'bypass_policy';

export interface AgentDefinition {
  id: string;
  name: string;
  shortName: string;
  description: string;
  role: string;
  status: AgentStatus;
  riskLevel: AgentRiskLevel;
  capabilities: AgentCapability[];
  blockedActions: AgentBlockedAction[];
  dataSources: string[];
  lastRunAt?: string;
  currentTaskId?: string;
}

export type AgentTaskType =
  | 'network_health_check'
  | 'wallet_intelligence_scan'
  | 'liquidity_scan'
  | 'ilp_endpoint_check'
  | 'route_simulation'
  | 'compliance_review'
  | 'security_review'
  | 'receipt_audit'
  | 'grant_readiness_review'
  | 'small_business_ops_review';

export interface AgentTask {
  id: string;
  type: AgentTaskType;
  title: string;
  description: string;
  createdAt: string;
  requestedBy: 'user' | 'system';
  target?: string;
  payload?: Record<string, unknown>;
  status: 'queued' | 'running' | 'completed' | 'blocked' | 'error';
  assignedAgentIds: string[];
}

export interface AgentFinding {
  id: string;
  agentId: string;
  taskId: string;
  severity: 'info' | 'low' | 'medium' | 'high';
  title: string;
  summary: string;
  evidence?: string[];
  confidencePct: number;
  createdAt: string;
}

export interface AgentRecommendation {
  id: string;
  agentId: string;
  taskId: string;
  title: string;
  recommendation: string;
  actionType: 'observe' | 'analyze' | 'simulate' | 'prepare' | 'manual_review';
  riskLevel: AgentRiskLevel;
  requiresHumanApproval: boolean;
  confidencePct: number;
  createdAt: string;
}

export interface AgentReceipt {
  id: string;
  taskId: string;
  agentIds: string[];
  createdAt: string;
  inputHash: string;
  outputHash: string;
  policyResult: 'allowed' | 'blocked' | 'review_required';
  securityResult: 'clear' | 'warning' | 'blocked';
  summary: string;
}
