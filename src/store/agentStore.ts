/**
 * OpenClaw-style persistent agent orchestration.
 * Always-on heartbeat, Zustand + localStorage persistence, memory for discoveries.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AgentStatus = 'idle' | 'waking' | 'active' | 'sleeping' | 'error';

export interface AgentDef {
  id: string;
  name: string;
  skillIds: string[];
  status: AgentStatus;
  lastHeartbeat: number | null;
  lastDiscoveryAt: number | null;
}

export interface MemoryEntry {
  id: string;
  ts: number;
  type: 'discovery' | 'alert' | 'path' | 'nft' | 'bridge';
  summary: string;
  agentId: string;
  payload?: Record<string, unknown>;
}

interface AgentState {
  agents: AgentDef[];
  memory: MemoryEntry[];
  heartbeatIntervalMs: number;
  heartbeatRunning: boolean;

  wake: (agentId: string) => void;
  sleep: (agentId: string) => void;
  setStatus: (agentId: string, status: AgentStatus) => void;
  tickHeartbeat: (agentId: string) => void;
  startHeartbeat: () => void;
  stopHeartbeat: () => void;
  addMemoryEntry: (entry: Omit<MemoryEntry, 'id' | 'ts'>) => void;
  clearMemory: () => void;
  getAgent: (agentId: string) => AgentDef | undefined;
}

const DEFAULT_AGENTS: AgentDef[] = [
  { id: 'xrpl-trader', name: '@xrpl-trader', skillIds: ['xrpl-path-optimizer', 'xrpl-expert'], status: 'idle', lastHeartbeat: null, lastDiscoveryAt: null },
  { id: 'compliance-guard', name: '@compliance-guard', skillIds: ['xrpl-expert'], status: 'idle', lastHeartbeat: null, lastDiscoveryAt: null },
  { id: 'memetic-lab', name: '@memetic-lab', skillIds: ['real-time-data'], status: 'idle', lastHeartbeat: null, lastDiscoveryAt: null },
  { id: 'path-optimizer', name: '@path-optimizer', skillIds: ['xrpl-path-optimizer'], status: 'idle', lastHeartbeat: null, lastDiscoveryAt: null },
  { id: 'nft-raider', name: '@nft-raider', skillIds: ['nft-raider'], status: 'idle', lastHeartbeat: null, lastDiscoveryAt: null },
  { id: 'bridge-scout', name: '@bridge-scout', skillIds: ['bridge-query'], status: 'idle', lastHeartbeat: null, lastDiscoveryAt: null },
];

const genId = () => `mem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      agents: DEFAULT_AGENTS,
      memory: [],
      heartbeatIntervalMs: 30_000,
      heartbeatRunning: false,

      wake: (agentId) => {
        set((s) => ({
          agents: s.agents.map((a) =>
            a.id === agentId ? { ...a, status: 'active' as AgentStatus, lastHeartbeat: Date.now() } : a
          ),
        }));
      },

      sleep: (agentId) => {
        set((s) => ({
          agents: s.agents.map((a) =>
            a.id === agentId ? { ...a, status: 'idle' as AgentStatus } : a
          ),
        }));
      },

      setStatus: (agentId, status) => {
        set((s) => ({
          agents: s.agents.map((a) => (a.id === agentId ? { ...a, status } : a)),
        }));
      },

      tickHeartbeat: (agentId) => {
        set((s) => ({
          agents: s.agents.map((a) =>
            a.id === agentId ? { ...a, lastHeartbeat: Date.now() } : a
          ),
        }));
      },

      startHeartbeat: () => {
        if (get().heartbeatRunning) return;
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        heartbeatTimer = setInterval(() => {
          const { agents, tickHeartbeat } = get();
          agents.filter((a) => a.status === 'active').forEach((a) => tickHeartbeat(a.id));
        }, get().heartbeatIntervalMs);
        set({ heartbeatRunning: true });
      },

      stopHeartbeat: () => {
        if (heartbeatTimer) {
          clearInterval(heartbeatTimer);
          heartbeatTimer = null;
        }
        set({ heartbeatRunning: false });
      },

      addMemoryEntry: (entry) => {
        set((s) => ({
          memory: [
            ...s.memory.slice(-199),
            { ...entry, id: genId(), ts: Date.now() },
          ],
        }));
      },

      clearMemory: () => set({ memory: [] }),

      getAgent: (agentId) => get().agents.find((a) => a.id === agentId),
    }),
    {
      name: 'xrpl-control-room-agents',
      partialize: (s) => ({ agents: s.agents, memory: s.memory.slice(-100) }),
    }
  )
);
