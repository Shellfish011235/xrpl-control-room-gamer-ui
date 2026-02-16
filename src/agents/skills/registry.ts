/**
 * In-app skill registry (no external antigravity package).
 * Load 3–5 skills per agent invocation for modularity.
 */

import type { Skill, SkillName } from './types';

const SKILLS: Record<SkillName, Skill> = {
  'react-patterns': {
    name: 'react-patterns',
    keywords: ['react', 'component', 'hook', 'ui', 'render', 'lazy', 'suspense'],
    description: 'React 18+ patterns, hooks, lazy-loading, component composition',
  },
  'typescript-expert': {
    name: 'typescript-expert',
    keywords: ['type', 'interface', 'generic', 'strict', 'ts'],
    description: 'TypeScript strict mode, types, interfaces, generics',
  },
  'workflow-automation': {
    name: 'workflow-automation',
    keywords: ['workflow', 'alert', 'trigger', 'automate', 'discord', 'popup'],
    description: 'Automate workflows, triggers, alerts, multi-step flows',
  },
  'three-js': {
    name: 'three-js',
    keywords: ['3d', 'three', 'scene', 'hologram', 'arena', 'nft', 'particle'],
    description: 'Three.js 3D scenes, holographic UI, particles',
  },
  'xrpl-expert': {
    name: 'xrpl-expert',
    keywords: ['xrpl', 'ledger', 'amendment', 'validator', 'tx', 'account', 'nft'],
    description: 'XRPL ledger, amendments, testnet, xrpl.js',
  },
  'ai-agent-orchestrator': {
    name: 'ai-agent-orchestrator',
    keywords: ['agent', 'orchestrat', 'multi-agent', 'task', 'route'],
    description: 'Multi-agent orchestration, task routing, agent coordination',
  },
  'cyberpunk-ui': {
    name: 'cyberpunk-ui',
    keywords: ['cyberpunk', 'neon', 'glitch', 'hologram', 'synthwave', 'visual'],
    description: 'Cyberpunk/synthwave aesthetics, neon grids, glitch effects',
  },
  'real-time-data': {
    name: 'real-time-data',
    keywords: ['realtime', 'live', 'websocket', 'stream', 'subscribe'],
    description: 'Real-time data, WebSockets, live updates',
  },
  'error-handling-master': {
    name: 'error-handling-master',
    keywords: ['error', 'retry', 'offline', 'fallback', 'catch'],
    description: 'Error handling, retries, offline fallbacks',
  },
  'performance-optimizer': {
    name: 'performance-optimizer',
    keywords: ['perf', 'performance', 'debounce', 'virtual', 'lazy'],
    description: 'Performance, debounce, virtualization, bundle size',
  },
  'xrpl-path-optimizer': {
    name: 'xrpl-path-optimizer',
    keywords: ['path', 'route', 'ripple_path_find', 'amm_info', 'bridge', 'cost', 'risk', 'xrp', 'usd', 'ilp'],
    description: 'Find best XRPL route for amount from source to dest, score risk/cost/speed',
  },
  'nft-raider': {
    name: 'nft-raider',
    keywords: ['nft', 'xls-20', 'mint', 'offer', 'collection', 'taxon', 'floor', 'nftoken'],
    description: 'XRPL NFT discovery, floor prices, mint/offer suggestions',
  },
  'bridge-query': {
    name: 'bridge-query',
    keywords: ['bridge', 'axelar', 'evm', 'solana', 'cross-chain', 'mxrp', 'bridge_query'],
    description: 'Cross-chain bridge flows, XRPL ↔ EVM/Solana, volume and route queries',
  },
};

/** Return skills that match task (by keyword). Cap at maxSkills. */
export function matchSkills(task: string, skillNames: SkillName[], maxSkills: number = 5): Skill[] {
  const lower = task.toLowerCase();
  const scored = skillNames
    .map((name) => SKILLS[name])
    .filter(Boolean)
    .map((s) => ({
      skill: s,
      score: s.keywords.filter((k) => lower.includes(k.toLowerCase())).length,
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSkills)
    .map((x) => x.skill);
  if (scored.length > 0) return scored;
  return skillNames.slice(0, maxSkills).map((n) => SKILLS[n]).filter(Boolean);
}

export function getSkill(name: SkillName): Skill {
  return SKILLS[name];
}

export function loadSkills(skillNames: SkillName[]): Skill[] {
  return skillNames.map((n) => SKILLS[n]).filter(Boolean);
}

export { SKILLS };
