/**
 * Bounty + OpenClaw Discord bridge state.
 * Bounties are synced from Discord (via bridge API) or created from dashboard.
 * Discord activity feed is appended from bridge polling.
 */

import { create } from 'zustand';

// ==================== TYPES ====================

export type BountyStatus = 'open' | 'claimed' | 'in-progress' | 'completed' | 'expired';

export interface Bounty {
  id: string;
  title: string;
  description: string;
  rewardXRP: number;
  status: BountyStatus;
  authorId?: string;
  authorName?: string;
  claimedBy?: string;
  claimedAt?: number;
  completedAt?: number;
  txHash?: string;
  discordMessageId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface DiscordActivityItem {
  id: string;
  type: 'bounty_post' | 'bounty_accept' | 'bounty_complete' | 'agent_message' | 'system';
  channelId?: string;
  messageId?: string;
  authorId?: string;
  authorName?: string;
  content: string;
  timestamp: number;
  bountyId?: string;
  txHash?: string;
}

export interface BountyReputation {
  completedBounties: number;
  totalXRPEarned: number;
  lastActivityAt: number;
}

interface BountyState {
  bounties: Bounty[];
  discordActivity: DiscordActivityItem[];
  reputation: BountyReputation;
  bridgeConnected: boolean;
  lastFetchAt: number | null;

  setBounties: (b: Bounty[]) => void;
  upsertBounty: (b: Bounty) => void;
  updateBountyStatus: (id: string, status: BountyStatus, opts?: { claimedBy?: string; txHash?: string; completedAt?: number }) => void;
  addBounty: (b: Omit<Bounty, 'id' | 'createdAt' | 'updatedAt'>) => void;

  appendDiscordActivity: (items: DiscordActivityItem[]) => void;
  setDiscordActivity: (items: DiscordActivityItem[]) => void;
  clearDiscordActivity: () => void;

  setReputation: (r: Partial<BountyReputation>) => void;
  addReputationCompletion: (xrpEarned: number) => void;

  setBridgeConnected: (v: boolean) => void;
  setLastFetchAt: (t: number | null) => void;
}

const defaultReputation: BountyReputation = {
  completedBounties: 0,
  totalXRPEarned: 0,
  lastActivityAt: 0,
};

// ==================== STORE ====================

export const useBountyStore = create<BountyState>()((set) => ({
  bounties: [],
  discordActivity: [],
  reputation: defaultReputation,
  bridgeConnected: false,
  lastFetchAt: null,

  setBounties: (bounties) => set({ bounties }),

  upsertBounty: (bounty) =>
    set((state) => {
      const idx = state.bounties.findIndex((x) => x.id === bounty.id);
      const next = [...state.bounties];
      const now = Date.now();
      const b = { ...bounty, updatedAt: now };
      if (idx >= 0) next[idx] = b;
      else next.push({ ...b, createdAt: b.createdAt || now });
      return { bounties: next };
    }),

  updateBountyStatus: (id, status, opts) =>
    set((state) => {
      const now = Date.now();
      const bounties = state.bounties.map((b) =>
        b.id !== id
          ? b
          : {
              ...b,
              status,
              updatedAt: now,
              ...(opts?.claimedBy && { claimedBy: opts.claimedBy, claimedAt: opts.claimedAt ?? now }),
              ...(opts?.txHash && { txHash: opts.txHash }),
              ...(opts?.completedAt && { completedAt: opts.completedAt }),
            }
      );
      return { bounties };
    }),

  addBounty: (b) =>
    set((state) => {
      const now = Date.now();
      const id = `bounty-${now}-${Math.random().toString(36).slice(2, 9)}`;
      const bounty: Bounty = {
        ...b,
        id,
        createdAt: now,
        updatedAt: now,
      };
      return { bounties: [bounty, ...state.bounties] };
    }),

  appendDiscordActivity: (items) =>
    set((state) => {
      const seen = new Set(state.discordActivity.map((x) => x.id));
      const newItems = items.filter((x) => !seen.has(x.id));
      if (newItems.length === 0) return state;
      const next = [...newItems, ...state.discordActivity].slice(0, 200);
      return { discordActivity: next };
    }),

  setDiscordActivity: (items) => set({ discordActivity: items }),

  clearDiscordActivity: () => set({ discordActivity: [] }),

  setReputation: (r) =>
    set((state) => ({
      reputation: { ...state.reputation, ...r },
    })),

  addReputationCompletion: (xrpEarned) =>
    set((state) => ({
      reputation: {
        ...state.reputation,
        completedBounties: state.reputation.completedBounties + 1,
        totalXRPEarned: state.reputation.totalXRPEarned + xrpEarned,
        lastActivityAt: Date.now(),
      },
    })),

  setBridgeConnected: (v) => set({ bridgeConnected: v }),

  setLastFetchAt: (t) => set({ lastFetchAt: t }),
}));
