/**
 * Skill types for XRPL Agent Orchestrator.
 * Modular skill loading: 3–5 skills per invocation to avoid context bloat.
 */

export interface Skill {
  name: string;
  /** Keywords used to match task to skill (e.g. "amendment", "ledger", "tps") */
  keywords: string[];
  /** Short description for prompt building */
  description: string;
}

export type SkillName =
  | 'react-patterns'
  | 'typescript-expert'
  | 'workflow-automation'
  | 'three-js'
  | 'xrpl-expert'
  | 'ai-agent-orchestrator'
  | 'cyberpunk-ui'
  | 'real-time-data'
  | 'error-handling-master'
  | 'performance-optimizer'
  | 'xrpl-path-optimizer'
  | 'nft-raider'
  | 'bridge-query';
