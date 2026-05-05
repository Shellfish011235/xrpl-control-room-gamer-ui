import { create } from 'zustand';
import type {
  AgentDefinition,
  AgentFinding,
  AgentRecommendation,
  AgentReceipt,
  AgentTask,
  AgentTaskType,
} from '../agents/types';
import { getDefaultActiveAgents } from '../agents/agentRegistry';
import { runAgentTask, getPrimaryAgentIdForTaskType, type RunAgentTaskResult } from '../agents/agentTaskEngine';

export interface AgentRuntimeState {
  agents: AgentDefinition[];
  tasks: AgentTask[];
  findings: AgentFinding[];
  recommendations: AgentRecommendation[];
  receipts: AgentReceipt[];
  isRunning: boolean;
  lastRunAt?: string;
  error?: string;
}

export interface AgentRuntimeActions {
  initializeAgents: () => void;
  enqueueTask: (input: Pick<AgentTask, 'type' | 'title' | 'description'> & Partial<AgentTask>) => string;
  runTask: (taskId: string) => Promise<RunAgentTaskResult | undefined>;
  runQuickTask: (type: AgentTaskType, target?: string) => Promise<RunAgentTaskResult | undefined>;
  setAgentStatus: (agentId: string, status: AgentDefinition['status']) => void;
  clearAgentRuntime: () => void;
}

const initialAgents = (): AgentDefinition[] => getDefaultActiveAgents();

export const useAgentRuntimeStore = create<AgentRuntimeState & AgentRuntimeActions>()((set, get) => ({
  agents: initialAgents(),
  tasks: [],
  findings: [],
  recommendations: [],
  receipts: [],
  isRunning: false,
  lastRunAt: undefined,
  error: undefined,

  initializeAgents: () => {
    set({
      agents: initialAgents(),
      error: undefined,
    });
  },

  enqueueTask: (input) => {
    const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const primary = getPrimaryAgentIdForTaskType(input.type);
    const task: AgentTask = {
      id,
      type: input.type,
      title: input.title,
      description: input.description,
      createdAt: new Date().toISOString(),
      requestedBy: input.requestedBy ?? 'user',
      target: input.target,
      payload: input.payload,
      status: 'queued',
      assignedAgentIds: input.assignedAgentIds?.length ? input.assignedAgentIds : [primary],
    };
    set((s) => ({ tasks: [task, ...s.tasks].slice(0, 200) }));
    return id;
  },

  runTask: async (taskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) {
      set({ error: `Task not found: ${taskId}` });
      return undefined;
    }

    set((s) => ({
      isRunning: true,
      error: undefined,
      tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, status: 'running' } : t)),
      agents: s.agents.map((a) =>
        task.assignedAgentIds.includes(a.id)
          ? { ...a, status: 'analyzing', currentTaskId: taskId }
          : a
      ),
    }));

    try {
      const runningTask: AgentTask = { ...task, status: 'running' };
      const out = await runAgentTask(runningTask);
      const ts = new Date().toISOString();

      set((s) => ({
        isRunning: false,
        lastRunAt: ts,
        tasks: s.tasks.map((t) => (t.id === taskId ? out.task : t)),
        findings: [...out.findings, ...s.findings].slice(0, 500),
        recommendations: [...out.recommendations, ...s.recommendations].slice(0, 500),
        receipts: [out.receipt, ...s.receipts].slice(0, 300),
        agents: s.agents.map((a) =>
          task.assignedAgentIds.includes(a.id)
            ? { ...a, status: 'idle', lastRunAt: ts, currentTaskId: undefined }
            : a
        ),
      }));

      return out;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      set((s) => ({
        isRunning: false,
        error: msg,
        tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, status: 'error' } : t)),
        agents: s.agents.map((a) =>
          task.assignedAgentIds.includes(a.id) ? { ...a, status: 'error', currentTaskId: undefined } : a
        ),
      }));
      return undefined;
    }
  },

  runQuickTask: async (type, target) => {
    const titles: Record<AgentTaskType, string> = {
      network_health_check: 'Network health check',
      wallet_intelligence_scan: 'Wallet intelligence scan',
      liquidity_scan: 'Liquidity scan',
      ilp_endpoint_check: 'ILP endpoint check',
      route_simulation: 'Route simulation',
      compliance_review: 'Compliance review',
      security_review: 'Security review',
      receipt_audit: 'Receipt audit',
      grant_readiness_review: 'Grant readiness review',
      small_business_ops_review: 'Small business ops review',
    };
    const descriptions: Record<AgentTaskType, string> = {
      network_health_check: 'Observe-only XRPL network posture.',
      wallet_intelligence_scan: 'Read-only wallet context (requires target when enforced).',
      liquidity_scan: 'Liquidity context scan (simulation-first).',
      ilp_endpoint_check: 'ILP / Open Payments endpoint posture.',
      route_simulation: 'Simulated routing intelligence.',
      compliance_review: 'Compliance posture review.',
      security_review: 'Security and prompt-risk review.',
      receipt_audit: 'Receipt coverage audit.',
      grant_readiness_review: 'Grant / nomination readiness.',
      small_business_ops_review: 'SMB operations intelligence.',
    };
    const id = get().enqueueTask({
      type,
      title: titles[type],
      description: descriptions[type],
      requestedBy: 'user',
      target,
    });
    return get().runTask(id);
  },

  setAgentStatus: (agentId, status) =>
    set((s) => ({
      agents: s.agents.map((a) => (a.id === agentId ? { ...a, status } : a)),
    })),

  clearAgentRuntime: () =>
    set({
      agents: initialAgents(),
      tasks: [],
      findings: [],
      recommendations: [],
      receipts: [],
      isRunning: false,
      lastRunAt: undefined,
      error: undefined,
    }),
}));
