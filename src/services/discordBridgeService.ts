/**
 * OpenClaw + Discord bridge client.
 * Calls a backend proxy (VITE_DISCORD_BRIDGE_URL) to post bounties and fetch Discord activity.
 * When no proxy URL is set, uses mock data so the Bounty Board UI still works.
 */

import type { Bounty, DiscordActivityItem } from '../store/bountyStore';

const BRIDGE_URL =
  typeof import.meta !== 'undefined' &&
  typeof (import.meta as { env?: Record<string, string> }).env?.VITE_DISCORD_BRIDGE_URL === 'string'
    ? (import.meta as { env: Record<string, string> }).env.VITE_DISCORD_BRIDGE_URL.trim().replace(/\/$/, '')
    : '';

// ==================== API TYPES ====================

export interface PostBountyPayload {
  title: string;
  description: string;
  rewardXRP: number;
  /** Optional: Discord channel ID to post to. */
  channelId?: string;
}

export interface PostBountyResult {
  success: boolean;
  bountyId?: string;
  discordMessageId?: string;
  error?: string;
}

export interface FetchActivityResult {
  success: boolean;
  activity: DiscordActivityItem[];
  bounties?: Bounty[];
  error?: string;
}

const MAX_BRIDGE_ITEMS = 200;
const ACTIVITY_TYPES = new Set<DiscordActivityItem['type']>([
  'bounty_post', 'bounty_accept', 'bounty_complete', 'agent_message', 'system',
]);
const BOUNTY_STATUSES = new Set<Bounty['status']>([
  'open', 'claimed', 'in-progress', 'completed', 'expired',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function optionalFiniteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function sanitizeDiscordActivityItems(value: unknown): DiscordActivityItem[] {
  if (!Array.isArray(value)) return [];
  const items: DiscordActivityItem[] = [];
  for (const raw of value.slice(0, MAX_BRIDGE_ITEMS)) {
    if (!isRecord(raw)) continue;
    if (
      typeof raw.id !== 'string' ||
      typeof raw.type !== 'string' ||
      !ACTIVITY_TYPES.has(raw.type as DiscordActivityItem['type']) ||
      typeof raw.content !== 'string' ||
      typeof raw.timestamp !== 'number' ||
      !Number.isFinite(raw.timestamp)
    ) continue;
    items.push({
      id: raw.id,
      type: raw.type as DiscordActivityItem['type'],
      content: raw.content,
      timestamp: raw.timestamp,
      ...(optionalString(raw.channelId) !== undefined && { channelId: raw.channelId as string }),
      ...(optionalString(raw.messageId) !== undefined && { messageId: raw.messageId as string }),
      ...(optionalString(raw.authorId) !== undefined && { authorId: raw.authorId as string }),
      ...(optionalString(raw.authorName) !== undefined && { authorName: raw.authorName as string }),
      ...(optionalString(raw.bountyId) !== undefined && { bountyId: raw.bountyId as string }),
      ...(optionalString(raw.txHash) !== undefined && { txHash: raw.txHash as string }),
    });
  }
  return items;
}

export function sanitizeBountyItems(value: unknown): Bounty[] {
  if (!Array.isArray(value)) return [];
  const items: Bounty[] = [];
  for (const raw of value.slice(0, MAX_BRIDGE_ITEMS)) {
    if (!isRecord(raw)) continue;
    if (
      typeof raw.id !== 'string' ||
      typeof raw.title !== 'string' ||
      typeof raw.description !== 'string' ||
      typeof raw.rewardXRP !== 'number' ||
      !Number.isFinite(raw.rewardXRP) ||
      raw.rewardXRP < 0 ||
      typeof raw.status !== 'string' ||
      !BOUNTY_STATUSES.has(raw.status as Bounty['status']) ||
      typeof raw.createdAt !== 'number' ||
      !Number.isFinite(raw.createdAt) ||
      typeof raw.updatedAt !== 'number' ||
      !Number.isFinite(raw.updatedAt)
    ) continue;
    items.push({
      id: raw.id,
      title: raw.title,
      description: raw.description,
      rewardXRP: raw.rewardXRP,
      status: raw.status as Bounty['status'],
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      ...(optionalString(raw.authorId) !== undefined && { authorId: raw.authorId as string }),
      ...(optionalString(raw.authorName) !== undefined && { authorName: raw.authorName as string }),
      ...(optionalString(raw.claimedBy) !== undefined && { claimedBy: raw.claimedBy as string }),
      ...(optionalFiniteNumber(raw.claimedAt) !== undefined && { claimedAt: raw.claimedAt as number }),
      ...(optionalFiniteNumber(raw.completedAt) !== undefined && { completedAt: raw.completedAt as number }),
      ...(optionalString(raw.txHash) !== undefined && { txHash: raw.txHash as string }),
      ...(optionalString(raw.discordMessageId) !== undefined && { discordMessageId: raw.discordMessageId as string }),
    });
  }
  return items;
}

export function sanitizePostBountyResponse(value: unknown): Pick<PostBountyResult, 'bountyId' | 'discordMessageId'> {
  if (!isRecord(value)) return {};
  const result: Pick<PostBountyResult, 'bountyId' | 'discordMessageId'> = {};
  if (typeof value.bountyId === 'string') result.bountyId = value.bountyId;
  if (typeof value.discordMessageId === 'string') result.discordMessageId = value.discordMessageId;
  return result;
}

// ==================== MOCK DATA (when bridge not configured) ====================

function mockActivity(): DiscordActivityItem[] {
  const now = Date.now();
  return [
    {
      id: `mock-${now}-1`,
      type: 'system',
      content: 'Discord bridge not configured. Set VITE_DISCORD_BRIDGE_URL to your proxy to see live OpenClaw activity.',
      timestamp: now - 60000,
    },
    {
      id: `mock-${now}-2`,
      type: 'bounty_post',
      authorName: 'Dashboard',
      content: 'BOUNTY: Analyze XRP flow for wallet rXXX… REWARD: 0.02 XRP',
      timestamp: now - 120000,
      bountyId: 'bounty-demo-1',
    },
    {
      id: `mock-${now}-3`,
      type: 'agent_message',
      authorName: 'OpenClaw',
      content: 'ACCEPTING – executing analysis.',
      timestamp: now - 90000,
      bountyId: 'bounty-demo-1',
    },
  ];
}

function mockBounties(): Bounty[] {
  const now = Date.now();
  return [
    {
      id: 'bounty-demo-1',
      title: 'Analyze XRP flow',
      description: 'Run ledger analysis for wallet rXXX… and return top 10 flows.',
      rewardXRP: 0.02,
      status: 'open',
      createdAt: now - 300000,
      updatedAt: now - 60000,
    },
    {
      id: 'bounty-demo-2',
      title: 'Memetic Lab sim',
      description: 'Run pump-detection sim and report risk score.',
      rewardXRP: 0.005,
      status: 'open',
      createdAt: now - 600000,
      updatedAt: now - 300000,
    },
  ];
}

// ==================== API ====================

/**
 * Post a bounty to Discord via the bridge (or simulate when no bridge).
 */
export async function postBounty(payload: PostBountyPayload): Promise<PostBountyResult> {
  if (!BRIDGE_URL) {
    // Simulate success; store will add via addBounty in UI
    return {
      success: true,
      bountyId: `bounty-${Date.now()}-mock`,
      discordMessageId: undefined,
    };
  }

  try {
    const res = await fetch(`${BRIDGE_URL}/api/bounty/post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.error || res.statusText };
    }
    return {
      success: true,
      ...sanitizePostBountyResponse(data),
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Network error';
    return { success: false, error: message };
  }
}

/**
 * Fetch recent Discord activity and optionally bounties from the bridge.
 */
export async function fetchDiscordActivity(): Promise<FetchActivityResult> {
  if (!BRIDGE_URL) {
    return {
      success: true,
      activity: mockActivity(),
      bounties: mockBounties(),
    };
  }

  try {
    const res = await fetch(`${BRIDGE_URL}/api/discord/activity?limit=50`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, activity: [], error: data.error || res.statusText };
    }
    return {
      success: true,
      activity: sanitizeDiscordActivityItems(data.activity),
      bounties: Array.isArray(data.bounties) ? sanitizeBountyItems(data.bounties) : undefined,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Network error';
    return { success: false, activity: [], error: message };
  }
}

/**
 * Send a direct command to the OpenClaw agent (e.g. "Post bounty: …").
 */
export async function sendAgentCommand(command: string): Promise<{ success: boolean; error?: string }> {
  if (!BRIDGE_URL) {
    return { success: true };
  }

  try {
    const res = await fetch(`${BRIDGE_URL}/api/discord/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.error || res.statusText };
    }
    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Network error';
    return { success: false, error: message };
  }
}

export function isBridgeConfigured(): boolean {
  return BRIDGE_URL.length > 0;
}
