/**
 * XRPL Agent Orchestrator – LangChain-inspired task routing and skill-loaded agents.
 * Dynamically loads 3–5 skills per invocation; routes to LedgerImpact, PortfolioGamer, UIEnhance.
 * Integrates with LedgerImpactTool, PortfolioTracker, and cyberpunk UI.
 * Testnet only; no mainnet spends.
 */

import { loadSkills, matchSkills } from './skills/registry';
import type { SkillName } from './skills/types';

/** Minimal XRPL client shape so we don't depend on the xrpl package at build time. */
export interface XRPLClientLike {
  isConnected(): boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

let xrplClient: XRPLClientLike | null = null;

async function getXRPLClient(): Promise<XRPLClientLike> {
  if (xrplClient) return xrplClient;
  // XRPL client is optional: no static import of the 'xrpl' npm package so the app builds when it's not installed.
  // The rest of the app (Ledger Impact Analyzer, agents) works without it.
  // Only the "connect to XRPL testnet" feature needs the package; then use connectOptionalXRPLClient() from ./xrplClientOptional.
  throw new Error(
    'Optional XRPL testnet client is not enabled. The app works without it. To use live testnet connection, install the xrpl npm package: npm install xrpl'
  );
}

export type AgentType = 'ledger' | 'portfolio' | 'ui-enhance';

export interface AgentInvocationResult {
  analysis: string;
  codeSuggestions: string[];
  uiUpdates: Record<string, unknown>;
  neonImpactScore?: number;
  agentType: AgentType;
}

const DEFAULT_SKILLS: SkillName[] = ['xrpl-expert', 'real-time-data', 'error-handling-master', 'cyberpunk-ui'];

export class XRPLAgentOrchestrator {
  private skills: import('./skills/types').Skill[] = [];
  private coreSkillNames: SkillName[] = [...DEFAULT_SKILLS];

  constructor() {
    this.loadCoreSkills();
  }

  /** Load skills by name (from registry; no external package). */
  loadCoreSkills(skillNames: SkillName[] = DEFAULT_SKILLS): void {
    this.coreSkillNames = skillNames.length > 0 ? skillNames : DEFAULT_SKILLS;
    this.skills = loadSkills(this.coreSkillNames);
  }

  /**
   * Invoke agent: match task to skills, build prompt, call AI (mock or API), apply response.
   */
  async invokeAgent(
    task: string,
    context: Record<string, unknown>,
    agentType: AgentType
  ): Promise<AgentInvocationResult> {
    const relevantSkills = matchSkills(task, this.coreSkillNames, 5);
    const prompt = this.buildPrompt(task, context, relevantSkills, agentType);
    const response = await this.callAI(prompt, agentType, context);
    return this.applyResponse(response, agentType);
  }

  /** Build prompt template for AI. */
  private buildPrompt(
    task: string,
    context: Record<string, unknown>,
    skills: import('./skills/types').Skill[],
    agentType: AgentType
  ): string {
    const skillTags = skills.map((s) => `@${s.name}`).join(', ');
    return `
System: You are an XRPL Cyberpunk Agent powered by ${skillTags}. Focus on ${agentType} tasks.
Output valid JSON only: { "analysis": "...", "codeSuggestions": [], "uiUpdates": {} }.
For ledger/amendment tasks include "neonImpactScore": 0-100 (game metric for TPS/impact).
User: Task: ${task}. Context: ${JSON.stringify(context)}.
`.trim();
  }

  /**
   * Call AI backend. Uses real API when VITE_AI_API_URL is set; otherwise rule-based fallback.
   * Set in .env: VITE_AI_API_URL (e.g. https://api.openai.com/v1/chat/completions or your proxy),
   * and optionally VITE_AI_API_KEY. API should accept POST with { "prompt": string } or { "messages": [...] }
   * and return JSON with analysis/codeSuggestions/uiUpdates/neonImpactScore, or OpenAI/Anthropic-style content.
   */
  private async callAI(
    prompt: string,
    agentType: AgentType,
    context: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const apiUrl = typeof import.meta.env.VITE_AI_API_URL === 'string' && import.meta.env.VITE_AI_API_URL.trim();
    const apiKey = typeof import.meta.env.VITE_AI_API_KEY === 'string' ? import.meta.env.VITE_AI_API_KEY.trim() : '';

    if (apiUrl) {
      try {
        const body: Record<string, unknown> = { prompt };
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        };
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`AI API error: ${res.status} ${res.statusText}`);
        const data = (await res.json()) as Record<string, unknown>;
        const parsed = this.parseAIResponse(data, agentType, context);
        if (parsed) return parsed;
      } catch (e) {
        console.warn('[Orchestrator] AI API failed, using rule-based fallback:', e);
      }
    }

    return this.ruleBasedFallback(prompt, agentType, context);
  }

  /** Parse API response: direct shape, OpenAI-style, or Anthropic-style. */
  private parseAIResponse(
    data: Record<string, unknown>,
    agentType: AgentType,
    context: Record<string, unknown>
  ): Record<string, unknown> | null {
    if (data.analysis != null && typeof data.analysis === 'string') {
      return {
        analysis: data.analysis,
        codeSuggestions: Array.isArray(data.codeSuggestions) ? data.codeSuggestions : [],
        uiUpdates: (data.uiUpdates as Record<string, unknown>) ?? {},
        neonImpactScore: typeof data.neonImpactScore === 'number' ? data.neonImpactScore : undefined,
      };
    }
    let raw = '';
    const choices = data.choices as Array<{ message?: { content?: string }; content?: string }> | undefined;
    if (Array.isArray(choices)?.[0]) {
      raw = choices[0].message?.content ?? choices[0].content ?? '';
    }
    const content = data.content as Array<{ text?: string }> | undefined;
    if (Array.isArray(content)?.[0]?.text) raw = content[0].text;
    if (typeof data.text === 'string') raw = data.text;
    if (!raw) return null;
    try {
      const json = JSON.parse(raw) as Record<string, unknown>;
      if (typeof json.analysis === 'string') {
        return {
          analysis: json.analysis,
          codeSuggestions: Array.isArray(json.codeSuggestions) ? json.codeSuggestions : [],
          uiUpdates: (json.uiUpdates as Record<string, unknown>) ?? {},
          neonImpactScore: typeof json.neonImpactScore === 'number' ? json.neonImpactScore : undefined,
        };
      }
    } catch (_) {}
    return null;
  }

  /** Rule-based fallback when no API is configured or API fails (no mock – uses context). */
  private ruleBasedFallback(
    _prompt: string,
    agentType: AgentType,
    context: Record<string, unknown>
  ): Record<string, unknown> {
    const amendments = (context.amendments as unknown[]) || [];
    const votesPct = amendments.length
      ? (amendments as { percentSupport?: number }[]).reduce((s, a) => s + (a.percentSupport ?? 0), 0) / amendments.length
      : 0;
    const neonImpactScore = Math.min(100, Math.round(votesPct * 1.2));
    return {
      analysis: `Rule-based ${agentType} analysis: amendment support ${votesPct.toFixed(1)}%; impact score ${neonImpactScore}/100. Configure VITE_AI_API_URL for full AI analysis.`,
      codeSuggestions: ['Add retry with exponential backoff', 'Cache amendments for offline mode'],
      uiUpdates: { neonImpactScore, lastRun: Date.now() },
      neonImpactScore,
    };
  }

  private applyResponse(response: Record<string, unknown>, agentType: AgentType): AgentInvocationResult {
    return {
      analysis: String(response.analysis ?? ''),
      codeSuggestions: Array.isArray(response.codeSuggestions) ? response.codeSuggestions : [],
      uiUpdates: (response.uiUpdates as Record<string, unknown>) ?? {},
      neonImpactScore:
        typeof response.neonImpactScore === 'number' ? response.neonImpactScore : undefined,
      agentType,
    };
  }

  /** Optional: expose XRPL client for ledger subscription (e.g. ledger events). Requires xrpl package. */
  async getClient(): Promise<XRPLClientLike> {
    return getXRPLClient();
  }

  /** Disconnect and clear client (e.g. on app unmount). */
  async disconnect(): Promise<void> {
    if (xrplClient) {
      try {
        await xrplClient.disconnect();
      } catch (_) {}
      xrplClient = null;
    }
  }
}

let defaultOrchestrator: XRPLAgentOrchestrator | null = null;

export function getDefaultOrchestrator(): XRPLAgentOrchestrator {
  if (!defaultOrchestrator) defaultOrchestrator = new XRPLAgentOrchestrator();
  return defaultOrchestrator;
}
