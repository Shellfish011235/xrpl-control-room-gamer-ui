/**
 * Centralized search / command router for XRPL Control Room.
 *
 * HOW TO EXTEND (future modules):
 * - Call `registerSearchIntents([...])` at app init (e.g. from a plugin or feature module) with new `SearchIntent` objects.
 * - Each intent must use a unique `id`, point `path` to an existing in-app route, and stay read-only (navigation only).
 * - Prefer adding `keywords`, `commands` (/slash), and `nlPhrases` so NL and gamer-style inputs resolve consistently.
 * - **Keywords** = synonyms / tokens (good for partial matches). **nlPhrases** = full questions or phrases (strongest signal for multi-word queries like “ai agent”).
 *
 * All navigation is read-only: no signing, custody, keys, or fund movement from this layer.
 */

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type SearchIntentCategory =
  | 'nav'
  | 'wallet'
  | 'ledger'
  | 'dex'
  | 'liquidity'
  | 'nft'
  | 'payments'
  | 'ilp'
  | 'infra'
  | 'agents'
  | 'security'
  | 'compliance'
  | 'learn'

export interface SearchIntent {
  id: string
  title: string
  description: string
  category: SearchIntentCategory
  /** React Router path — navigation only. */
  path: string
  /** Tokens / synonyms / aliases (matched after normalization). */
  keywords: string[]
  /** Command bodies without leading slash, e.g. "wallet", "agent scan". */
  commands?: string[]
  /** Natural-language phrases (lowercase ok; normalized on match). */
  nlPhrases?: string[]
  /** Tie-break when scores are close (default 0). */
  boost?: number
}

export interface RankedSearchResult extends SearchIntent {
  confidence: number
}

// -----------------------------------------------------------------------------
// Optional dynamic registration (plugins / future modules)
// -----------------------------------------------------------------------------

let additionalIntents: SearchIntent[] = []

/**
 * Register more searchable intents at runtime (feature flags, plugins).
 * Duplicate `id` values override previous additional entries (last registration wins).
 * To override a core intent, use the same `id` as in `CORE_SEARCH_INTENTS`.
 */
export function registerSearchIntents(intents: SearchIntent[]): void {
  const byId = new Map(additionalIntents.map((i) => [i.id, i]))
  for (const i of intents) byId.set(i.id, i)
  additionalIntents = Array.from(byId.values())
}

export function getAllSearchIntents(): SearchIntent[] {
  const byId = new Map(CORE_SEARCH_INTENTS.map((i) => [i.id, i]))
  for (const i of additionalIntents) byId.set(i.id, i)
  return Array.from(byId.values())
}

// -----------------------------------------------------------------------------
// Normalization & light typo handling
// -----------------------------------------------------------------------------

const TYPO_ALIASES: Record<string, string> = {
  recieve: 'receive',
  receieve: 'receive',
  trasnfer: 'transfer',
  transacion: 'transaction',
  transacton: 'transaction',
  trusline: 'trustline',
  truslines: 'trustlines',
  tag: 'destination tag',
  memo: 'memos',
  stablecoin: 'stablecoins',
  rlusd: 'rlusd',
  xrp: 'xrp',
}

/**
 * Lowercase, trim, unify hyphens/underscores, collapse whitespace, light token fixes.
 */
export function normalizeSearchQuery(raw: string): string {
  let s = raw.toLowerCase().trim()
  s = s.replace(/[–—]/g, '-')
  s = s.replace(/[_-]+/g, ' ')
  s = s.replace(/\s+/g, ' ')
  const parts = s.split(' ').map((w) => TYPO_ALIASES[w] ?? w)
  return parts.join(' ').trim()
}

function tokens(s: string): string[] {
  return normalizeSearchQuery(s)
    .split(' ')
    .filter((t) => t.length > 0)
}

// -----------------------------------------------------------------------------
// Core intents (synonyms, NL, commands)
// -----------------------------------------------------------------------------

const CORE_SEARCH_INTENTS: SearchIntent[] = [
  {
    id: 'nav-profile',
    title: 'Profile',
    description: 'Your control-room profile, linked wallets, NFT gallery, and theme.',
    category: 'nav',
    path: '/',
    keywords: [
      'home',
      'profile',
      'you',
      'account',
      'wallet',
      'address',
      'avatar',
      'portfolio',
      'character',
      'collectibles',
    ],
    commands: ['profile', 'home', 'me'],
    nlPhrases: ['what does this wallet hold', 'show my profile', 'open my account'],
    boost: 5,
  },
  {
    id: 'nav-pay',
    title: 'Pay',
    description: 'Send flow, micropayments, payment channels, receipts (you sign in your wallet).',
    category: 'payments',
    path: '/pay',
    keywords: [
      'pay',
      'send',
      'receive',
      'stream',
      'micropayment',
      'micropayments',
      'payment channel',
      'channels',
      'carv',
      'openclaw',
      'open claw',
      'pie',
      'transfer',
      'xrp payment',
      'chat pay',
      'payment agent',
      'ai pay',
      'agent pay',
    ],
    commands: ['pay', 'send', 'stream'],
    nlPhrases: ['how do i send xrp', 'payment channel help', 'micropayment setup', 'pay with ai agent'],
    boost: 8,
  },
  {
    id: 'nav-control-room',
    title: 'Control Room',
    description: 'Ops dashboard: liquidity nexus, safety copy, institutional-style panels (read-only tooling).',
    category: 'nav',
    path: '/tools/control-room',
    keywords: [
      'control room',
      'dashboard',
      'hub',
      'ops',
      'liquidity nexus',
      'nexus',
      'observe',
      'interpret',
      'decide',
    ],
    commands: ['control', 'ops', 'room'],
    boost: 6,
  },
  {
    id: 'nav-tools',
    title: 'Tools',
    description: 'Tool index: ledger impact, bridges, agents, builder, wallet, DEX order.',
    category: 'nav',
    path: '/tools',
    keywords: ['tools', 'menu', 'utilities', 'apps', 'hub'],
    commands: ['tools'],
    boost: 3,
  },
  {
    id: 'tool-ledger-impact',
    title: 'Ledger Impact',
    description: 'Amendments, protocol changes, and XRPL governance impact context.',
    category: 'ledger',
    path: '/tools/ledger-impact',
    keywords: [
      'ledger',
      'amendment',
      'amendments',
      'governance',
      'rippled',
      'xls',
      'protocol',
      'upgrade',
      'voting',
      'consensus rule',
    ],
    commands: ['ledger', 'amendments', 'impact'],
    nlPhrases: ['what amendments are active', 'ledger upgrade'],
    boost: 4,
  },
  {
    id: 'tool-optimizer',
    title: 'Optimizer',
    description: 'Route and trade optimization views (analysis; no auto-execution from search).',
    category: 'liquidity',
    path: '/tools/optimizer',
    keywords: ['optimizer', 'optimize', 'route', 'swap', 'trade', 'best path', 'pathfinding'],
    commands: ['optimize', 'routes'],
    boost: 3,
  },
  {
    id: 'tool-bridges',
    title: 'Bridges',
    description: 'Cross-chain bridge references and tooling entry points.',
    category: 'nav',
    path: '/tools/bridges',
    keywords: ['bridge', 'bridges', 'cross chain', 'sidechain', 'evm', 'wrap'],
    commands: ['bridges', 'bridge'],
    boost: 2,
  },
  {
    id: 'tool-agents',
    title: 'Agent Hub',
    description: 'Agent fleet, orchestration, skills registry, wake/heartbeat (read-only configuration surfaces).',
    category: 'agents',
    path: '/tools/agents',
    keywords: [
      'agent',
      'agents',
      'ai',
      'ai agent',
      'ai agents',
      'artificial intelligence',
      'artificial intelligence agent',
      'llm',
      'llm agent',
      'machine learning',
      'ml agent',
      'agentic',
      'multi-agent',
      'multi agent',
      'agent swarm',
      'm2m',
      'machine to machine',
      'autonomous agent',
      'smart agent',
      'cognitive agent',
      'bot',
      'bots',
      'fleet',
      'orchestra',
      'orchestrator',
      'openclaw',
      'open claw',
      'wake',
      'heartbeat',
      'check in',
      'check-in',
      'memetic',
      'automation',
    ],
    commands: ['agents', 'agent', 'fleet', 'orchestra', 'ai agent', 'ai agents'],
    nlPhrases: [
      'show agent activity',
      'agent hub',
      'where are my agents',
      'ai agent',
      'ai agents',
      'artificial intelligence agents',
      'where is the ai agent',
      'open agent hub',
      'llm agents',
      'machine to machine agents',
    ],
    boost: 7,
  },
  {
    id: 'cmd-agent-scan',
    title: 'Agent Hub — scan',
    description: 'Review agent definitions, capabilities, and blocked actions (registry).',
    category: 'agents',
    path: '/tools/agents',
    keywords: [
      'agent scan',
      'scan agents',
      'agent registry',
      'capabilities',
      'ai agent scan',
      'scan ai agents',
    ],
    commands: ['agent scan', 'agents scan'],
    boost: 10,
  },
  {
    id: 'tool-builder',
    title: 'Builder',
    description: 'Builder workspace for experiments and integrations.',
    category: 'nav',
    path: '/tools/builder',
    keywords: ['builder', 'build', 'develop', 'sdk'],
    commands: ['builder'],
    boost: 1,
  },
  {
    id: 'tool-wallet',
    title: 'Wallet (MVP)',
    description: 'Wallet-oriented tools: balances context, trust lines, and read-only XRPL account helpers.',
    category: 'wallet',
    path: '/tools/wallet',
    keywords: [
      'wallet',
      'account',
      'address',
      'balance',
      'balances',
      'reserve',
      'base reserve',
      'owner reserve',
      'locked xrp',
      'xrp locked',
      'trustline',
      'trustlines',
      'trust line',
      'token',
      'tokens',
      'iou',
      'ioue',
      'issued',
      'issuer',
      'stablecoin',
      'stablecoins',
      'rlusd',
      'usd',
      'asset',
      'assets',
      'holding',
      'holdings',
    ],
    commands: ['wallet', 'trustlines', 'tokens', 'balance', 'reserve'],
    nlPhrases: [
      'what does this wallet hold',
      'show wallet tokens',
      'why is my xrp locked',
      'where is my reserve',
      'find rlusd',
      'show trust lines',
      'list tokens on account',
    ],
    boost: 9,
  },
  {
    id: 'tool-dex',
    title: 'DEX Order',
    description: 'Decentralized exchange order book and offer context on XRPL (read/analysis).',
    category: 'dex',
    path: '/tools/dex-order',
    keywords: [
      'dex',
      'order',
      'orders',
      'offer',
      'offers',
      'order book',
      'orderbook',
      'trade',
      'swap',
      'limit order',
      'autobridging',
    ],
    commands: ['dex', 'offers', 'orderbook'],
    nlPhrases: ['show open offers', 'dex depth', 'xrpl dex'],
    boost: 8,
  },
  {
    id: 'nav-network',
    title: 'Network',
    description: 'Topology, validators, ILP lens, connectors, corridors, and liquidity map.',
    category: 'ilp',
    path: '/network',
    keywords: [
      'network',
      'map',
      'globe',
      'topology',
      'validators',
      'validator',
      'ilp',
      'interledger',
      'connector',
      'connectors',
      'corridor',
      'corridors',
      'routing',
      'rafiki',
      'open payments',
      'amm',
      'liquidity pool',
      'pools',
      'lp',
      'pool',
      'automation market maker',
    ],
    commands: ['network', 'map', 'ilp', 'routes'],
    nlPhrases: ['ilp routes', 'show connectors', 'liquidity map', 'validator map'],
    boost: 8,
  },
  {
    id: 'cmd-ilp-routes',
    title: 'Network — ILP & routes',
    description: 'ILP lens: connectors, corridors, and routing-style views (reference / demo data may apply).',
    category: 'ilp',
    path: '/network',
    keywords: ['ilp route', 'interledger route', 'connector graph', 'corridor exposure'],
    commands: ['ilp routes', 'ilp route', 'routes'],
    boost: 12,
  },
  {
    id: 'cmd-liquidity-scan',
    title: 'Network / liquidity scan',
    description: 'Explore liquidity and path context on the Network page (read-only).',
    category: 'liquidity',
    path: '/network',
    keywords: ['liquidity scan', 'scan liquidity', 'path scan', 'route liquidity'],
    commands: ['liquidity scan', 'liquidity'],
    nlPhrases: ['scan liquidity', 'where is liquidity'],
    boost: 11,
  },
  {
    id: 'nav-terminal',
    title: 'Terminal',
    description: 'Trading terminal: strategies panel, alerts builder, paper trading, liquidation views (read/sim).',
    category: 'nav',
    path: '/terminal',
    keywords: [
      'terminal',
      'trading',
      'activity',
      'chart',
      'grid',
      'dca',
      'market maker',
      'mm',
      'arbitrage',
      'arb',
      'etf',
      'alerts',
      'alert',
      'paper trading',
    ],
    commands: ['terminal', 'tx', 'trades', 'activity'],
    nlPhrases: ['show recent transactions', 'open terminal', 'strategy status'],
    boost: 6,
  },
  {
    id: 'tx-memos',
    title: 'Terminal — transactions & memos',
    description: 'Activity, alerts, and institutional panels related to txs (no signing from search).',
    category: 'ledger',
    path: '/terminal',
    keywords: [
      'transaction',
      'transactions',
      'tx',
      'hash',
      'memo',
      'memos',
      'destination tag',
      'tag',
      'payment history',
    ],
    commands: ['tx', 'txs', 'transactions'],
    nlPhrases: ['what is a destination tag', 'payment memo'],
    boost: 5,
  },
  {
    id: 'nav-learn',
    title: 'Learn',
    description: 'Tutorials, streaming micropayment demos, cost comparator, Web Monetization context.',
    category: 'learn',
    path: '/learn',
    keywords: [
      'learn',
      'help',
      'docs',
      'education',
      'tutorial',
      'micropayment compare',
      'streaming payments',
      'web monetization',
      'ai agent payments',
      'agent payments tutorial',
      'machine payments',
    ],
    nlPhrases: ['how do ai agents pay', 'learn about agent payments'],
    commands: ['learn', 'help', 'docs'],
    boost: 4,
  },
  {
    id: 'learn-tigerbeetle',
    title: 'Learn — micropayments & ledger comparison',
    description: 'Reference comparison including XRPL channels vs other networks; TigerBeetle as OLTP ledger example.',
    category: 'infra',
    path: '/learn',
    keywords: [
      'tigerbeetle',
      'tiger beetle',
      'oltp',
      'ledger database',
      'double entry',
      'accounting',
      'reconciliation',
      'internal ledger',
      'posting engine',
      'throughput benchmark',
    ],
    commands: ['tigerbeetle', 'accounting', 'ledger db'],
    nlPhrases: ['what is tigerbeetle', 'internal accounting for payments', 'reconciliation engine'],
    boost: 6,
  },
  {
    id: 'nav-underworld',
    title: 'Regulations',
    description: 'Regulatory intel: SEC, CFTC, FinCEN, state law, IP tab, EO references (informational).',
    category: 'compliance',
    path: '/underworld',
    keywords: [
      'regulations',
      'regulation',
      'compliance',
      'legal',
      'jurisdiction',
      'risk',
      'sec',
      'cftc',
      'fincen',
      'msb',
      'money service',
      'florida',
      'fl',
      'mica',
      'sanctions',
      'kyc',
      'aml',
      'non custodial',
      'non-custodial',
      'read only',
      'read-only',
      'custody',
      'disclaimer',
    ],
    commands: ['compliance', 'regs', 'regulations', 'legal'],
    nlPhrases: ['check compliance', 'sec crypto rules', 'fincen msb', 'florida crypto'],
    boost: 9,
  },
  {
    id: 'cmd-compliance-check',
    title: 'Regulations — compliance check',
    description: 'Informational regulatory map and agency links — not legal advice.',
    category: 'compliance',
    path: '/underworld',
    keywords: ['compliance check', 'regulatory check', 'policy scan'],
    commands: ['compliance check', 'compliance'],
    boost: 14,
  },
  {
    id: 'nav-intelligence',
    title: 'Intelligence',
    description: 'Whale tracker, liquidity flow, validator monitor, bot cluster heuristics, AI-agent activity (analytics).',
    category: 'security',
    path: '/intelligence',
    keywords: [
      'intelligence',
      'whale',
      'flow',
      'monitor',
      'validator monitor',
      'bot cluster',
      'heuristic',
      'issuer risk',
      'risk scan',
      'analytics',
      'surveillance',
      'ai agent',
      'ai agents',
      'ai activity',
      'agent activity',
      'ai agent activity',
      'llm activity',
      'bot activity',
    ],
    commands: ['intel', 'intelligence', 'risk', 'issuer'],
    nlPhrases: [
      'scan issuer risk',
      'whale movements',
      'liquidity flow',
      'show ai agent activity',
      'ai agent analytics',
    ],
    boost: 10,
  },
  {
    id: 'cmd-security-audit',
    title: 'Security — audit & hardening',
    description: 'Security-oriented panels: prompt firewall concepts, agent blocked actions, ops safety copy (read-only).',
    category: 'security',
    path: '/tools/control-room',
    keywords: [
      'security',
      'audit',
      'vulnerability',
      'vulnerabilities',
      'prompt firewall',
      'firewall',
      'private key',
      'secret',
      'seed',
      'phishing',
      'exploit',
      'hardening',
    ],
    commands: ['security audit', 'security', 'audit'],
    nlPhrases: ['security audit', 'prompt firewall', 'is my key safe'],
    boost: 13,
  },
  {
    id: 'agents-security',
    title: 'Agents — security & prompt safety',
    description: 'Agent registry includes security-focused agents (e.g. prompt firewall) — configuration and docs.',
    category: 'security',
    path: '/tools/agents',
    keywords: [
      'agent security',
      'prompt firewall',
      'blocked actions',
      'universal block',
      'ai safety',
      'ai security',
      'llm safety',
      'agent hardening',
    ],
    commands: ['agent security'],
    boost: 8,
  },
  {
    id: 'nft-profile',
    title: 'Profile — NFTs',
    description: 'NFT gallery and profile/theme selection on home profile.',
    category: 'nft',
    path: '/',
    keywords: ['nft', 'nfts', 'nfoken', 'xls20', 'collectible', 'collection', 'metadata'],
    commands: ['nft', 'nfts'],
    nlPhrases: ['show my nfts', 'nft gallery'],
    boost: 5,
  },
  {
    id: 'escrow-learn',
    title: 'Learn / Pay — escrow & time locks',
    description: 'Educational and payment surfaces mentioning escrow-like flows (informational).',
    category: 'payments',
    path: '/learn',
    keywords: ['escrow', 'time lock', 'timelock', 'release', 'conditional payment'],
    commands: ['escrow'],
    boost: 3,
  },
  {
    id: 'nav-governance',
    title: 'Governance Guide',
    description: 'XRPL governance and amendment guide.',
    category: 'ledger',
    path: '/governance-guide',
    keywords: ['governance guide', 'amendment guide', 'xrpl governance'],
    commands: ['governance'],
    boost: 2,
  },
  {
    id: 'nav-trending',
    title: 'Trending — Memetic Lab',
    description: 'Trending narratives, memetic lab, market sentiment experiments.',
    category: 'nav',
    path: '/memetic-lab',
    keywords: ['trending', 'memetic', 'sentiment', 'lab', 'polymarket', 'narrative'],
    commands: ['trending', 'memes'],
    boost: 3,
  },
]

// -----------------------------------------------------------------------------
// Scoring
// -----------------------------------------------------------------------------

function scoreIntent(intent: SearchIntent, qRaw: string): number {
  const qNorm = normalizeSearchQuery(qRaw)
  if (!qNorm && !qRaw.trim()) return 0

  const boost = (intent.boost ?? 0) / 10000

  const trimmed = qRaw.trim()
  if (trimmed.startsWith('/')) {
    const body = normalizeSearchQuery(trimmed.slice(1))
    const cmds = (intent.commands ?? []).slice().sort((a, b) => b.length - a.length)
    for (const c of cmds) {
      const cn = normalizeSearchQuery(c)
      if (body === cn) return 0.97 + boost
      if (body.startsWith(cn + ' ') || cn.startsWith(body + ' ')) return 0.93 + boost
      if (body.length >= 2 && (cn.startsWith(body) || body.startsWith(cn))) return 0.88 + boost
    }
  }

  if (!qNorm) return 0

  let best = 0

  for (const phrase of intent.nlPhrases ?? []) {
    const pn = normalizeSearchQuery(phrase)
    if (pn && (qNorm === pn || qNorm.includes(pn) || pn.includes(qNorm))) {
      best = Math.max(best, 0.92 + boost)
    }
  }

  const titleN = normalizeSearchQuery(intent.title)
  if (titleN.includes(qNorm) || qNorm.includes(titleN.split(' ').slice(0, 2).join(' '))) {
    best = Math.max(best, 0.78 + boost)
  }

  const kw = intent.keywords.map((k) => normalizeSearchQuery(k)).filter(Boolean)
  const qTok = tokens(qNorm)
  let hits = 0
  for (const k of kw) {
    if (qNorm.includes(k) || k.includes(qNorm)) hits += 1
    else {
      for (const t of qTok) {
        if (t.length >= 2 && (k.includes(t) || t.includes(k))) {
          hits += 0.35
          break
        }
      }
    }
  }
  if (kw.length > 0) {
    const cap = Math.min(kw.length, 10)
    const ratio = Math.min(1, hits / cap)
    best = Math.max(best, 0.32 + 0.52 * ratio + boost)
  }

  const descN = normalizeSearchQuery(intent.description)
  if (descN.includes(qNorm)) best = Math.max(best, 0.45 + boost)

  return Math.min(best, 1)
}

/**
 * Rank intents for a user query. Empty query returns [] (use suggestions + popular shortcuts in UI).
 */
export function rankSearchIntents(query: string, limit = 12): RankedSearchResult[] {
  const all = getAllSearchIntents()
  const q = query.trim()
  if (!q) return []

  const scored = all
    .map((intent) => ({
      ...intent,
      confidence: scoreIntent(intent, query),
    }))
    .filter((r) => r.confidence >= 0.28)
    .sort((a, b) => b.confidence - a.confidence || (b.boost ?? 0) - (a.boost ?? 0) || a.title.localeCompare(b.title))

  const dedup = new Map<string, RankedSearchResult>()
  for (const r of scored) {
    const prev = dedup.get(r.id)
    if (!prev || prev.confidence < r.confidence) dedup.set(r.id, r)
  }

  return Array.from(dedup.values())
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit)
}

/** Shown when the search field is focused and empty — quick NL / command examples. */
export const SUGGESTED_SEARCH_CHIPS: string[] = [
  '/wallet',
  'ai agent',
  '/ilp routes',
  'why is my xrp locked',
  'show open offers',
  'find RLUSD',
  'scan issuer risk',
  '/agent scan',
  '/compliance check',
  '/security audit',
]

/**
 * Default shortcuts when focused with no query (stable, read-only destinations).
 */
export function getPopularShortcuts(): RankedSearchResult[] {
  const ids = [
    'nav-profile',
    'nav-pay',
    'tool-wallet',
    'nav-network',
    'tool-dex',
    'nav-terminal',
    'tool-agents',
    'nav-underworld',
    'nav-learn',
    'nav-intelligence',
  ]
  const map = new Map(getAllSearchIntents().map((i) => [i.id, i]))
  return ids
    .map((id) => map.get(id))
    .filter(Boolean)
    .map((intent) => ({
      ...intent!,
      confidence: 1,
    }))
}

export function categoryLabel(c: SearchIntentCategory): string {
  const labels: Record<SearchIntentCategory, string> = {
    nav: 'NAV',
    wallet: 'WALLET',
    ledger: 'LEDGER',
    dex: 'DEX',
    liquidity: 'LIQUIDITY',
    nft: 'NFT',
    payments: 'PAY',
    ilp: 'ILP',
    infra: 'INFRA',
    agents: 'AGENTS',
    security: 'SEC',
    compliance: 'COMPLIANCE',
    learn: 'LEARN',
  }
  return labels[c] ?? c.toUpperCase()
}
