import type {
  AgentFinding,
  AgentRecommendation,
  AgentTask,
  AgentTaskType,
} from './types';
import { createAgentReceipt } from './agentReceiptEngine';
import { assertAgentActionNotBlocked } from './policy';
import { isValidXRPLAddress } from '../services/xrplService';

export interface RunAgentTaskResult {
  task: AgentTask;
  findings: AgentFinding[];
  recommendations: AgentRecommendation[];
  receipt: ReturnType<typeof createAgentReceipt>;
}

export const PRIMARY_AGENT_FOR_TASK: Record<AgentTaskType, string> = {
  network_health_check: 'network-sentinel',
  wallet_intelligence_scan: 'wallet-intel',
  liquidity_scan: 'liquidity-scout',
  ilp_endpoint_check: 'ilp-corridor-analyst',
  route_simulation: 'liquidity-scout',
  compliance_review: 'compliance-guard',
  security_review: 'prompt-firewall',
  receipt_audit: 'receipt-auditor',
  grant_readiness_review: 'grant-scout',
  small_business_ops_review: 'small-business-ops',
};

function fid(prefix: string, taskId: string, n: number) {
  return `${prefix}-${taskId}-${n}`;
}

function nowIso() {
  return new Date().toISOString();
}

/**
 * Local in-browser task runner: deterministic findings + recommendations + receipt.
 * Does not call external networks for side effects; labels outputs as analysis/simulation only.
 */
export function getPrimaryAgentIdForTaskType(type: AgentTaskType): string {
  return PRIMARY_AGENT_FOR_TASK[type] ?? 'receipt-auditor';
}

export async function runAgentTask(task: AgentTask): Promise<RunAgentTaskResult> {
  const rawRequested = task.payload?.requestedAgentAction;
  if (typeof rawRequested === 'string' && rawRequested.trim()) {
    assertAgentActionNotBlocked(rawRequested.trim());
  }

  const agentId = getPrimaryAgentIdForTaskType(task.type);
  const taskId = task.id;
  const findings: AgentFinding[] = [];
  const recommendations: AgentRecommendation[] = [];
  let policyResult: 'allowed' | 'blocked' | 'review_required' = 'allowed';
  let securityResult: 'clear' | 'warning' | 'blocked' = 'clear';
  let summary = '';

  switch (task.type) {
    case 'network_health_check':
      findings.push({
        id: fid('f', taskId, 1),
        agentId,
        taskId,
        severity: 'info',
        title: 'XRPL network monitor ready',
        summary: 'Network health task completed in observe-only mode; no RPC side effects executed by the agent runtime.',
        evidence: ['Global XRPL client can connect for read-only account/ledger calls.'],
        confidencePct: 88,
        createdAt: nowIso(),
      });
      recommendations.push({
        id: fid('r', taskId, 1),
        agentId,
        taskId,
        title: 'Connect live feeds',
        recommendation:
          'Connect live XRPL WebSocket plus a public validator / explorer-style feed for richer uptime and lag metrics.',
        actionType: 'observe',
        riskLevel: 'green',
        requiresHumanApproval: false,
        confidencePct: 85,
        createdAt: nowIso(),
      });
      summary = 'Network health check (observe-only): monitor ready; recommend live WS + validator feed.';
      break;

    case 'wallet_intelligence_scan': {
      const targetTrim = task.target?.trim() ?? '';
      if (targetTrim && !isValidXRPLAddress(targetTrim)) {
        findings.push({
          id: fid('f', taskId, 1),
          agentId,
          taskId,
          severity: 'medium',
          title: 'Invalid classic address',
          summary: 'Task target is not a valid XRPL classic address; on-chain read scope was not opened.',
          evidence: ['Use a classic r… address from Profile / Wallet in read-only mode.'],
          confidencePct: 98,
          createdAt: nowIso(),
        });
        recommendations.push({
          id: fid('r', taskId, 1),
          agentId,
          taskId,
          title: 'Fix address and re-run',
          recommendation: 'Correct the wallet address and enqueue the scan again.',
          actionType: 'manual_review',
          riskLevel: 'yellow',
          requiresHumanApproval: true,
          confidencePct: 95,
          createdAt: nowIso(),
        });
        policyResult = 'review_required';
        summary = 'Wallet intelligence scan: invalid address; no ledger lookup performed.';
        break;
      }
      if (!targetTrim) {
        findings.push({
          id: fid('f', taskId, 1),
          agentId,
          taskId,
          severity: 'medium',
          title: 'Wallet target missing',
          summary: 'No classic address was supplied as task.target; intelligence scan cannot scope on-chain reads.',
          evidence: ['Pass target r-address in read-only mode from UI or enqueueTask.'],
          confidencePct: 95,
          createdAt: nowIso(),
        });
        recommendations.push({
          id: fid('r', taskId, 1),
          agentId,
          taskId,
          title: 'Add read-only address',
          recommendation: 'Add wallet address manually in read-only mode (Profile / Wallet) and re-run scan.',
          actionType: 'manual_review',
          riskLevel: 'yellow',
          requiresHumanApproval: true,
          confidencePct: 90,
          createdAt: nowIso(),
        });
        policyResult = 'review_required';
      } else {
        findings.push({
          id: fid('f', taskId, 1),
          agentId,
          taskId,
          severity: 'info',
          title: 'Wallet intelligence scope set',
          summary: `Target ${targetTrim.slice(0, 8)}… queued for read-only account_info-style checks when wired.`,
          confidencePct: 80,
          createdAt: nowIso(),
        });
        recommendations.push({
          id: fid('r', taskId, 1),
          agentId,
          taskId,
          title: 'Read-only enrichment',
          recommendation: 'Wire account_lines + account_tx read-only to populate trust and activity context.',
          actionType: 'analyze',
          riskLevel: 'yellow',
          requiresHumanApproval: false,
          confidencePct: 75,
          createdAt: nowIso(),
        });
        summary = 'Wallet intelligence scan: target present; recommend read-only XRPL enrichment.';
      }
      break;
    }

    case 'liquidity_scan':
      findings.push({
        id: fid('f', taskId, 1),
        agentId,
        taskId,
        severity: 'info',
        title: 'Liquidity scan requires AMM/CLOB adapters',
        summary: 'Liquidity surfaces (AMM, order book) need adapter wiring; runtime stays simulation-labelled.',
        evidence: ['No trade execution path in agent runtime.'],
        confidencePct: 82,
        createdAt: nowIso(),
      });
      recommendations.push({
        id: fid('r', taskId, 1),
        agentId,
        taskId,
        title: 'Simulation only',
        recommendation: 'Run route and depth simulation only; never execute offers or swaps from agents.',
        actionType: 'simulate',
        riskLevel: 'yellow',
        requiresHumanApproval: false,
        confidencePct: 92,
        createdAt: nowIso(),
      });
      summary = 'Liquidity scan: adapters required; simulation-only recommendation.';
      break;

    case 'ilp_endpoint_check':
      findings.push({
        id: fid('f', taskId, 1),
        agentId,
        taskId,
        severity: 'info',
        title: 'ILP connector data is local / config-driven',
        summary: 'ILP operator snapshot and WS URLs are env or bundled examples until production bridges are attached.',
        confidencePct: 78,
        createdAt: nowIso(),
      });
      recommendations.push({
        id: fid('r', taskId, 1),
        agentId,
        taskId,
        title: 'Endpoint health',
        recommendation: 'Add Open Payments health adapter and Rafiki telemetry for corridor SLO views.',
        actionType: 'observe',
        riskLevel: 'yellow',
        requiresHumanApproval: false,
        confidencePct: 80,
        createdAt: nowIso(),
      });
      summary = 'ILP endpoint check: local/config data; recommend OP health + Rafiki telemetry.';
      break;

    case 'route_simulation':
      findings.push({
        id: fid('f', taskId, 1),
        agentId,
        taskId,
        severity: 'info',
        title: 'Route simulation combines liquidity + endpoint context',
        summary: 'Simulated routes must be labelled DERIVED/SIMULATED; no settlement attempted.',
        evidence: ['XRPL liquidity read + ILP health read (when wired) can merge in UI.'],
        confidencePct: 84,
        createdAt: nowIso(),
      });
      recommendations.push({
        id: fid('r', taskId, 1),
        agentId,
        taskId,
        title: 'Mark outputs simulated',
        recommendation: 'Mark route output as DERIVED/SIMULATED in UI and receipts until live pathfinding is certified.',
        actionType: 'simulate',
        riskLevel: 'yellow',
        requiresHumanApproval: false,
        confidencePct: 88,
        createdAt: nowIso(),
      });
      summary = 'Route simulation: combined context recommended; output must stay simulated-labelled.';
      break;

    case 'compliance_review':
      findings.push({
        id: fid('f', taskId, 1),
        agentId,
        taskId,
        severity: 'medium',
        title: 'Safe mode is read-only / simulation-first',
        summary: 'Florida / US default compliance posture should treat agent outputs as advisory until human review.',
        confidencePct: 86,
        createdAt: nowIso(),
      });
      recommendations.push({
        id: fid('r', taskId, 1),
        agentId,
        taskId,
        title: 'Keep execution blocked',
        recommendation: 'Keep Florida/US default profile and block automated execution; user confirms any real action.',
        actionType: 'manual_review',
        riskLevel: 'yellow',
        requiresHumanApproval: true,
        confidencePct: 90,
        createdAt: nowIso(),
      });
      policyResult = 'review_required';
      summary = 'Compliance review: simulation-first; human review for execution-class intents.';
      break;

    case 'security_review':
      findings.push({
        id: fid('f', taskId, 1),
        agentId,
        taskId,
        severity: 'high',
        title: 'Block prompt injection, key requests, and signing intent',
        summary: 'Prompt firewall patterns should classify key/seeds/bypass and signing demands as blocked agent actions.',
        confidencePct: 91,
        createdAt: nowIso(),
      });
      recommendations.push({
        id: fid('r', taskId, 1),
        agentId,
        taskId,
        title: 'Route to Prompt Firewall',
        recommendation: 'Route suspicious prompts to Prompt Firewall agent output and deny auto-execution.',
        actionType: 'analyze',
        riskLevel: 'red',
        requiresHumanApproval: false,
        confidencePct: 87,
        createdAt: nowIso(),
      });
      securityResult = 'warning';
      summary = 'Security review: elevate suspicious prompts; agent runtime remains non-executing.';
      break;

    case 'receipt_audit':
      findings.push({
        id: fid('f', taskId, 1),
        agentId,
        taskId,
        severity: 'info',
        title: 'Receipts required for every agent task',
        summary: 'Each run produces a local receipt with input/output hashes for audit trail.',
        confidencePct: 94,
        createdAt: nowIso(),
      });
      recommendations.push({
        id: fid('r', taskId, 1),
        agentId,
        taskId,
        title: 'Show in Track tab',
        recommendation: 'Surface receipts under Agent drawer Track tab alongside economy receipts.',
        actionType: 'observe',
        riskLevel: 'green',
        requiresHumanApproval: false,
        confidencePct: 92,
        createdAt: nowIso(),
      });
      summary = 'Receipt audit: task receipts mandated; display in Track.';
      break;

    case 'grant_readiness_review':
      findings.push({
        id: fid('f', taskId, 1),
        agentId,
        taskId,
        severity: 'info',
        title: 'Expose repo, README, screenshots, safety boundaries',
        summary: 'Grant packets should include safety doc references and non-custody guarantees.',
        confidencePct: 80,
        createdAt: nowIso(),
      });
      recommendations.push({
        id: fid('r', taskId, 1),
        agentId,
        taskId,
        title: 'Glow nomination packet',
        recommendation: 'Create Glow nomination packet: README safety section, screenshots, agent activation policy link.',
        actionType: 'prepare',
        riskLevel: 'green',
        requiresHumanApproval: true,
        confidencePct: 78,
        createdAt: nowIso(),
      });
      summary = 'Grant readiness: documentation and safety boundaries for nomination draft.';
      break;

    case 'small_business_ops_review':
      findings.push({
        id: fid('f', taskId, 1),
        agentId,
        taskId,
        severity: 'info',
        title: 'Business tools start as invoice / payment-link intelligence',
        summary: 'SMB flows should prioritize records and exports before any fund movement (human-operated).',
        confidencePct: 83,
        createdAt: nowIso(),
      });
      recommendations.push({
        id: fid('r', taskId, 1),
        agentId,
        taskId,
        title: 'Records before funds',
        recommendation: 'Generate records/exports (CSV/PDF) before any payment or link send; agents do not move funds.',
        actionType: 'prepare',
        riskLevel: 'yellow',
        requiresHumanApproval: true,
        confidencePct: 85,
        createdAt: nowIso(),
      });
      summary = 'SMB ops review: intelligence and records first; no custody.';
      break;

    default:
      findings.push({
        id: fid('f', taskId, 1),
        agentId: 'receipt-auditor',
        taskId,
        severity: 'low',
        title: 'Unknown task type handled safely',
        summary: 'Task type fell through to generic observe-only receipt.',
        confidencePct: 50,
        createdAt: nowIso(),
      });
      recommendations.push({
        id: fid('r', taskId, 1),
        agentId: 'receipt-auditor',
        taskId,
        title: 'Manual review',
        recommendation: 'Define explicit handler for this task type in agentTaskEngine.',
        actionType: 'manual_review',
        riskLevel: 'yellow',
        requiresHumanApproval: true,
        confidencePct: 60,
        createdAt: nowIso(),
      });
      policyResult = 'review_required';
      summary = 'Generic fallback task run; review required.';
  }

  const completedTask: AgentTask = {
    ...task,
    status: 'completed',
  };

  const outputPayload = { findings, recommendations, task: completedTask };
  const receipt = createAgentReceipt({
    taskId,
    agentIds: [agentId],
    input: { type: task.type, target: task.target, payload: task.payload },
    output: outputPayload,
    policyResult,
    securityResult,
    summary,
  });

  return {
    task: completedTask,
    findings,
    recommendations,
    receipt,
  };
}
