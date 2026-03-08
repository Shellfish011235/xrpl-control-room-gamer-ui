/**
 * Amendment Impact Data – expanded impact analysis and known projects
 * Kept in sync with xrpl.org/resources/known-amendments and XRPScan.
 * Last updated: March 2026. Batch/fixBatchInnerSigs blocked (Feb 2026); BatchV1_1 in review.
 */

export type AmendmentStatusNote = 'enabled' | 'majority' | 'pending' | 'unsupported' | 'blocked';

export interface KnownProject {
  name: string;
  description: string;
  howBenefit: string;
  url?: string;
}

export interface AmendmentImpactEntry {
  name: string;
  /** Short one-line summary (for cards) */
  summary: string;
  /** Expanded impact analysis: performance, TPS, latency, ecosystem */
  impactAnalysis: {
    /** Node/validator CPU, memory, disk, network cost and validation behaviour. */
    performance: string;
    /** Effect on ledger throughput and effective TPS (capacity). */
    tpsCapacity?: string;
    /** Effect on confirmation time, latency, or user-visible delay. */
    latency?: string;
    /** Cost, fee, or operational efficiency (e.g. fewer txs, less complexity). */
    efficiency?: string;
    /** Broader ecosystem, use-case, and adoption implications. */
    ecosystem?: string;
    /** Optional: risks, trade-offs, or operational considerations. */
    riskConsiderations?: string;
    /** Optional: impact on validators and node operators specifically. */
    validatorImpact?: string;
    /** Optional: impact on builders, integrators, and developers. */
    developerImpact?: string;
  };
  /**
   * Resource impact – show when user clicks amendment under "Impact analysis".
   * Explicit breakdown: how this amendment affects CPU, Memory, Disk I/O, Network, Fee pressure.
   * Only include keys that are meaningfully affected; omit or leave empty if negligible/none.
   */
  resourceImpact?: {
    /** How validation/computation load on CPU changes. */
    cpu?: string;
    /** How RAM usage (working set, cache, state) changes. */
    memory?: string;
    /** How disk reads/writes and storage growth are affected. */
    diskIO?: string;
    /** How network bandwidth or message volume is affected. */
    network?: string;
    /** How transaction fees or fee market (congestion, $ cost) are affected. */
    feePressure?: string;
  };
  /** Known projects that benefit from this amendment and how */
  knownProjects: KnownProject[];
  /** If amendment is blocked/obsolete (e.g. Batch), show this note in UI */
  statusNote?: AmendmentStatusNote;
  statusNoteText?: string;
  /** Optional links for blocked/unsupported: bug bounty, vulnerability disclosure, security announcement */
  statusNoteLinks?: { label: string; url: string }[];
}

/**
 * Short, plain-language text for hover tooltips — for non-technical readers.
 * Answers: What does "CPU" (etc.) mean? If I'm on minimum hardware, do I need to upgrade? How are fees or memory affected?
 * Use as title attribute or in a custom tooltip when the user hovers over a resource label.
 */
export const RESOURCE_HOVER_FOR_NON_TECHNICAL: Record<string, string> = {
  cpu:
    'CPU = the processing work that runs the ledger. Low impact: minimum hardware is fine; no need to upgrade. Medium: under heavy use you might need a stronger server. High: validators may need more power or fewer transactions fit per second.',
  memory:
    'Memory (RAM) = temporary data the ledger keeps in active use. Low: no real change; your current setup is fine. Medium: validators may need more RAM when usage is high. High: running minimum specs might mean slowdowns or needing more RAM.',
  diskIO:
    'Disk I/O = how much is read and written to storage. Low: little change; no need to upgrade disks. Medium: storage use grows with the feature; sync might take a bit longer. High: validators might need faster or bigger disks to keep up.',
  network:
    'Network = data sent between nodes and apps. Low: no real change in traffic. Medium: more messages as the feature is used; usually fine. High: more traffic or larger payloads; could affect how fast updates propagate.',
  feePressure:
    'Fee pressure = how this affects the transaction fees you pay. Low: fees stay about the same. Medium: fees might go up a bit when the network is busy, or down (e.g. batching reduces cost per operation). High: a clear effect on what users pay — either higher fees or much lower cost per operation.',
};

/**
 * Why we allege that ledger (amendment) impact affects CPU, memory, fee pressure, etc.
 * Explains the causal link so users understand why we report impact on these five resources.
 */
export const WHY_LEDGER_IMPACT_AFFECTS_RESOURCES = {
  title: 'Why we connect ledger impact to CPU, memory, fee pressure, and the rest',
  paragraphs: [
    'The ledger is not abstract: it runs on hardware and networks. Validators use CPU to validate transactions and run consensus, memory to hold state and caches, disk to store the ledger and read/write state, and the network to exchange proposals, votes, and data. Users pay fees to get transactions into the ledger, so demand for ledger space drives fee pressure.',
    'Amendments change what the ledger does or what it stores. A new transaction type adds validation work (CPU) and possibly new state (memory, disk). A new ledger object type adds storage and I/O. More or larger messages change network load. Features that increase the number of transactions (e.g. oracles, new tx types) or reduce them (e.g. batching) change how much people pay per logical operation (fee pressure).',
    'So when we say an amendment has an impact on the ledger, we are saying it changes what validators and the network must do or store. That change shows up as impact on one or more of these five resources. We report CPU, Memory, Disk I/O, Network, and Fee pressure so you can see exactly how we think the amendment affects the system, and why.',
  ],
} as const;

/**
 * What each resource actually represents in the XRPL/validator context.
 * Show this so users understand what "CPU", "Memory", etc. mean before reading impact.
 */
export const WHAT_EACH_RESOURCE_REPRESENTS = {
  title: 'What we mean by each resource',
  intro:
    'When we talk about an amendment’s impact on CPU, Memory, Disk I/O, Network, or Fee pressure, we’re describing how it affects validators and the network. Below is what each resource means and why it matters.',
  resources: {
    cpu: {
      label: 'CPU',
      whatItIs:
        'CPU is the processing power that validators use to validate transactions, run consensus, and apply changes to the ledger. Every transaction is checked (signatures, balances, rules); every ledger close runs agreement and state updates. Amendments that add new checks, calculations, or transaction types can increase how much CPU time each transaction or ledger close requires.',
      whyItMatters:
        'Higher CPU impact means validators may need more powerful hardware, or that fewer transactions fit in the same time window. The XRPL is designed so validation stays within what normal servers can handle; we rate impact so you can see which amendments add more load.',
    },
    memory: {
      label: 'Memory (RAM)',
      whatItIs:
        'Memory is the RAM that validators use to hold ledger state, caches, and in-flight data while processing. Validators keep account state, order books, AMM pools, and other structures in memory for fast access. Amendments that add new ledger object types or hold more data per transaction increase how much RAM is used.',
      whyItMatters:
        'If an amendment significantly increases memory use, validators need enough RAM for peak load. Running out of memory can slow or crash a node. We rate memory impact so you can see which amendments add more in-memory state or working set.',
    },
    diskIO: {
      label: 'Disk I/O',
      whatItIs:
        'Disk I/O is the reading and writing of data to disk: the ledger history, account state, and other stored data. Validators persist every ledger and must read state to validate new transactions. Amendments that add new ledger objects, more frequent updates, or larger entries increase how much is written and sometimes read.',
      whyItMatters:
        'Disk speed and capacity affect how quickly a node can sync and keep up. High disk impact can make sync slower or require faster storage. We rate disk I/O impact so you can see which amendments add more storage or I/O load.',
    },
    network: {
      label: 'Network',
      whatItIs:
        'Network is the bandwidth and message volume between validators and between nodes and clients. Validators exchange proposals, votes, and ledger data; clients submit transactions and subscribe to streams. Amendments that introduce new transaction types or more frequent updates can increase the number or size of messages on the network.',
      whyItMatters:
        'Network capacity affects propagation speed and how many clients can connect. We rate network impact so you can see which amendments add more traffic or larger payloads.',
    },
    feePressure: {
      label: 'Fee pressure ($)',
      whatItIs:
        'Fee pressure is the effect on transaction fees and the cost to users. Ledger space is limited; when demand is high, the reference fee can rise. Amendments can increase demand (e.g. many new transactions) or reduce it (e.g. batching several operations into one), changing how much users pay per logical operation.',
      whyItMatters:
        'Fee pressure affects builders and end users directly. We rate it so you can see whether an amendment tends to raise fees, lower them, or leave the fee market largely unchanged.',
    },
  },
} as const;

/**
 * User-facing explanation: what Low / Medium / High mean and why we assign each level.
 * Show this in the Ledger Impact UI so users see both the scale and the reasoning behind the impact distribution.
 */
export const RESOURCE_IMPACT_SCALE_EXPLANATION = {
  title: 'How we rate impact (Low / Medium / High)',
  intro:
    'When we say an amendment has "Low", "Medium", or "High" impact on a resource, we mean how much extra load or change it adds for validators and the network. "None" or "Negligible" means no meaningful change. Below we explain both what each level means and the reasoning we use to assign it.',
  /** Why we choose Low / Medium / High for each resource (the criteria behind the distribution). */
  reasoningForLevels: {
    cpu: {
      label: 'CPU',
      description: 'Validation and computation work per transaction.',
      whyLow:
        'We rate CPU as **Low** when the amendment adds at most a small, bounded amount of extra work per transaction—e.g. a single extra check, a formula fix, or a narrow code path—and does not increase peak validation time in a measurable way. Typical: bug fixes, small permission checks, or optional logic that runs rarely.',
      whyMedium:
        'We rate CPU as **Medium** when the amendment adds a consistent, non-trivial amount of work per transaction or per ledger close—e.g. pathfinding across multiple pools, permission lookups for every DEX trade, or new transaction types that do more than a simple payment. Validators can handle it on normal hardware, but the feature uses a noticeable share of capacity under heavy use.',
      whyHigh:
        'We rate CPU as **High** when the amendment adds substantial computation per unit of work—e.g. validating an entire atomic batch of inner transactions, or complex state transitions that scale with batch size. Under heavy use, this can reduce how many other transactions fit in the same ledger or increase latency.',
    },
    memory: {
      label: 'Memory (RAM)',
      description: 'Working set and in-memory state for validators.',
      whyLow:
        'We rate Memory as **Low** when the amendment adds little or no new in-memory state, or only a small fixed structure (e.g. a few extra fields per object). Working set stays within typical validator RAM.',
      whyMedium:
        'We rate Memory as **Medium** when the amendment introduces state that scales with usage but remains bounded in practice—e.g. pool state for each AMM pool, or permission tables that grow with the number of permissioned assets. Validators need sufficient RAM for peak load but do not require exceptional hardware.',
      whyHigh:
        'We rate Memory as **High** when the amendment requires a large working set or state that grows significantly with activity—e.g. holding an entire batch of transactions and their effects in memory until validation completes. Validators may need more RAM or see noticeable usage spikes.',
    },
    diskIO: {
      label: 'Disk I/O',
      description: 'Reads, writes, and storage growth on disk.',
      whyLow:
        'We rate Disk I/O as **Low** when the amendment adds minimal extra reads or writes, or only a small amount of new ledger data (e.g. a new field or a rare new object type). Storage growth is slow and I/O stays close to baseline.',
      whyMedium:
        'We rate Disk I/O as **Medium** when the amendment adds new ledger objects or more frequent updates that scale with adoption—e.g. one object per AMM pool or per escrow. Disk usage and I/O scale with the feature but remain manageable on standard SSD/hardware.',
      whyHigh:
        'We rate Disk I/O as **High** when the amendment adds significant new state or high write volume—e.g. many new entries per ledger or large objects. Validators need adequate disk capacity and I/O to avoid becoming a bottleneck.',
    },
    network: {
      label: 'Network',
      description: 'Bandwidth and message volume between nodes and clients.',
      whyLow:
        'We rate Network as **Low** when the amendment does not change the number or size of messages that validators and clients send or receive. Traffic pattern stays the same as today.',
      whyMedium:
        'We rate Network as **Medium** when the feature generates more transactions or larger messages as adoption grows—e.g. oracle submissions, bridge attestations, or new tx types that clients submit more often. Network load increases with usage but does not fundamentally change propagation.',
      whyHigh:
        'We rate Network as **High** when the amendment leads to substantial extra traffic—e.g. many small messages per second or large payloads that affect bandwidth and propagation. Can influence node connectivity or sync time under heavy use.',
    },
    feePressure: {
      label: 'Fee pressure ($)',
      description: 'Effect on transaction fees and cost to users.',
      whyLow:
        'We rate Fee pressure as **Low** when the amendment does not add a meaningful number of new fee-paying transactions or change how block space is consumed. User-facing fees stay in line with current levels.',
      whyMedium:
        'We rate Fee pressure as **Medium** when the feature adds steady or growing demand for block space (e.g. oracle txs, AMM swaps), which can contribute to slightly higher fees during congestion, or when it reduces the number of txs needed (e.g. batching) so effective $ cost per logical operation may go down. The fee market is influenced but not dominated by the feature.',
      whyHigh:
        'We rate Fee pressure as **High** when the amendment has a noticeable effect on the fee market—e.g. many new fee-paying transactions that compete for space and can raise fees, or a structural change (like batching) that significantly lowers the effective $ cost per logical operation. The impact is visible to users and applications.',
    },
  },
  /** Short “what you see” descriptions (optional; use for compact tooltips). */
  shortDescriptions: {
    cpu: { low: 'Little or no extra computation.', medium: 'Noticeable extra work per tx.', high: 'Substantial computation per tx or per ledger.' },
    memory: { low: 'Little or no extra RAM.', medium: 'Extra state that scales with usage.', high: 'Large working set or state growth.' },
    diskIO: { low: 'Minimal extra I/O or storage.', medium: 'New ledger objects; I/O scales with adoption.', high: 'Significant state or write volume.' },
    network: { low: 'No meaningful change in traffic.', medium: 'More txs or messages with adoption.', high: 'Substantial extra traffic.' },
    feePressure: { low: 'No or negligible change in fees.', medium: 'Some effect on block space demand or $ cost.', high: 'Noticeable effect on fee market.' },
  },
  footnote:
    'Impact is relative to the XRPL\'s current capacity and typical validator setup. "Low" does not mean zero—it means the change is small compared to normal operation. We use the reasoning above to assign each amendment\'s resource impact so the distribution (Low / Medium / High) is consistent and explainable.',
} as const;

// Known XRPL ecosystem projects referenced across amendments
const PROJECTS = {
  xaman: { name: 'Xaman (XRPL Labs)', description: 'Leading XRPL wallet and dApp browser', url: 'https://xaman.app' },
  xrplLabs: { name: 'XRPL Labs', description: 'Core tooling, Xaman, Hooks dev tools', url: 'https://xrpl-labs.com' },
  sbi: { name: 'SBI VC Trade / SBI Holdings', description: 'Japanese exchange and RLUSD partner', url: 'https://www.sbivc.co.jp' },
  rlusd: { name: 'RLUSD (Ripple)', description: 'Native XRPL stablecoin', url: 'https://ripple.com' },
  ripple: { name: 'Ripple', description: 'Enterprise payments and XRPL contributor', url: 'https://ripple.com' },
  xrpscan: { name: 'XRPScan', description: 'Block explorer and APIs', url: 'https://xrpscan.com' },
  hooks: { name: 'Hooks (hooks.xrpl.org)', description: 'Smart contract proposal and sandbox', url: 'https://hooks.xrpl.org' },
  gatehub: { name: 'Gatehub', description: 'XRPL exchange and wallet', url: 'https://gatehub.net' },
  uphold: { name: 'Uphold', description: 'Multi-asset platform, XRPL on-ramp', url: 'https://uphold.com' },
  peerkat: { name: 'PeerKat', description: 'NFT marketplace on XRPL', url: 'https://peerkat.io' },
  sologenic: { name: 'Sologenic', description: 'Tokenization and trading', url: 'https://sologenic.com' },
  crossmark: { name: 'Crossmark', description: 'NFT and token infrastructure', url: 'https://crossmark.io' },
  tangem: { name: 'Tangem', description: 'Hardware wallets', url: 'https://tangem.com' },
  anodos: { name: 'Anodos', description: 'DEX and trading on XRPL', url: 'https://anodos.finance' },
  xrplF: { name: 'XRPL Foundation', description: 'Open-source and standards', url: 'https://xrplf.org' },
};

export const amendmentImpactData: Record<string, AmendmentImpactEntry> = {
  // —— Fix amendments (recently enabled or at majority) ——
  fixPriceOracleOrder: {
    name: 'fixPriceOracleOrder',
    summary: 'Fixes ordering issues in Price Oracle calculations.',
    impactAnalysis: {
      performance:
        'Validation cost is minimal: the change corrects the order in which oracle price data is applied during consensus, adding no meaningful CPU or I/O load. Validators process the same number of oracle submissions; only the internal ordering logic is fixed, which can slightly reduce edge-case work in price aggregation.',
      tpsCapacity:
        'No negative impact on ledger TPS. Oracle transactions are already part of the normal load; fixing ordering does not increase their volume or validation time. In some edge cases, correct ordering can avoid redundant or repeated submissions that would have been triggered by mispriced feeds.',
      efficiency:
        'Reduces operational and financial risk for protocols that consume Price Oracle data: mispriced feeds can cause incorrect liquidations, arbitrage, or stablecoin peg deviation. Correct ordering makes oracle-derived prices deterministic and reliable, so DeFi primitives (lending, options, stablecoin mechanisms) need fewer fallbacks and less manual intervention.',
      ecosystem:
        'Every application that relies on the native Price Oracle—including RLUSD stability mechanisms, lending protocols, and AMM pricing—gains a more trustworthy on-chain data source. This strengthens the case for building DeFi on XRPL without depending solely on off-chain oracles, and reduces the blast radius of oracle bugs.',
      riskConsiderations:
        'Low risk: pure bug fix with no new features. The only theoretical risk is that some applications might have implicitly relied on the previous (incorrect) ordering; in practice, correct ordering is strictly preferable.',
      validatorImpact:
        'Validators see no change in resource requirements. Behaviour is consistent across all nodes once the amendment is enabled.',
      developerImpact:
        'Builders consuming Price Oracle data can rely on deterministic ordering when multiple oracle submissions exist for the same asset/time. No API or integration changes required; behaviour becomes correct by default.',
    },
    resourceImpact: {
      cpu: 'Minimal. Only the order of applying oracle data changes; no extra computation per transaction. Validation cost is effectively unchanged.',
      memory: 'None. No new state or caching required.',
      diskIO: 'None. Same ledger write path as before.',
      network: 'None. Oracle submission volume is unchanged.',
      feePressure: 'None. Oracle tx fees and overall fee market are unaffected.',
    },
    knownProjects: [
      { ...PROJECTS.rlusd, howBenefit: 'More reliable on-chain price feeds for RLUSD stability mechanisms.' },
      { ...PROJECTS.xrplLabs, howBenefit: 'Accurate oracle data for dApps and AMM pricing.' },
      { name: 'DeFi protocols', description: 'Lending, derivatives, options', howBenefit: 'Correct price ordering prevents mispricing and arbitrage errors.' },
    ],
  },
  fixMPTDeliveredAmount: {
    name: 'fixMPTDeliveredAmount',
    summary: 'Fixes delivered amount calculation for Multi-Purpose Tokens.',
    impactAnalysis: {
      performance:
        'Validation overhead remains low: the fix adjusts the formula used to compute the delivered amount for MPT (Multi-Purpose Token) transfers so that it matches the actual amount debited/credited. No new transaction types or ledger structures; only the calculation path is corrected, with negligible extra CPU per transaction.',
      efficiency:
        'Eliminates systematic rounding or calculation drift in MPT settlements. Without this fix, high volume or specific amount patterns could produce small discrepancies between sender debit and receiver credit, leading to reconciliation issues, failed compliance reporting, or arbitrage opportunities. Exact accounting reduces support burden and audit cost.',
      ecosystem:
        'Critical for any issuer or DEX that uses MPTs for tokenized assets, securities, or stablecoins. Accurate delivered amounts are a baseline requirement for regulated use cases and for DEX order execution; the fix makes MPTs safe for settlement and compliance-sensitive applications.',
      riskConsiderations:
        'Low risk: correction of a calculation bug. No new attack surface. Existing MPT transfers may have had minor historical drift; post-enable all new transfers are exact.',
      validatorImpact:
        'Validators apply the corrected formula during transaction application. No change in resource limits or consensus rules.',
      developerImpact:
        'Integrators can assume that MPT payment delivered amounts always match the intended transfer; no need for client-side rounding workarounds or reconciliation logic for the difference.',
    },
    resourceImpact: {
      cpu: 'Low. One corrected calculation path per MPT transfer; formula change only, negligible extra cycles.',
      memory: 'None. No new structures or buffers.',
      diskIO: 'None. Same balance and ledger update pattern.',
      network: 'None.',
      feePressure: 'None. MPT transfer fees unchanged.',
    },
    knownProjects: [
      { ...PROJECTS.sologenic, howBenefit: 'Accurate MPT delivery for tokenized assets and settlements.' },
      { ...PROJECTS.anodos, howBenefit: 'Correct MPT handling in DEX and AMM flows.' },
      { name: 'Token issuers', description: 'Enterprise and regulated issuers', howBenefit: 'Exact delivered amounts for compliance and reporting.' },
    ],
  },
  fixIncludeKeyletFields: {
    name: 'fixIncludeKeyletFields',
    summary: 'Fixes keylet field inclusion in ledger entries.',
    impactAnalysis: {
      performance:
        'Low CPU and disk I/O impact. The change ensures that keylet-derived fields are correctly populated in ledger entries during write and read paths. This is an internal consistency fix: validation and storage behaviour align with the intended ledger schema, with no new computation-heavy logic.',
      ecosystem:
        'Node operators, indexers, and any service that parses or indexes ledger entries (e.g. XRPScan, analytics, compliance tools) receive consistent keylet data. Inconsistent keylets could cause subtle bugs in pagination, lookup, or replay; the fix prevents those failure modes and improves long-term reliability of the ledger format.',
      validatorImpact:
        'Validators and full nodes write and read ledger entries with the corrected keylet fields. Replay and sync behaviour become consistent across all node implementations that follow the spec.',
      developerImpact:
        'Builders who rely on ledger entry structure (e.g. for indexing or state derivation) can depend on keylet fields being present and correct; no change required in application code unless they had implemented workarounds for the previous bug.',
    },
    resourceImpact: {
      cpu: 'Low. Internal consistency fix during entry write/read; a small number of extra checks or corrected field writes per affected entry.',
      memory: 'Negligible. No new allocations.',
      diskIO: 'Low. Ensures keylet fields are correctly written and readable; can avoid subtle corruption or inconsistent reads on disk.',
      network: 'None.',
      feePressure: 'None.',
    },
    knownProjects: [
      { ...PROJECTS.xrpscan, howBenefit: 'Consistent ledger indexing and API responses.' },
      { name: 'Node operators', description: 'Validators and full nodes', howBenefit: 'Reliable keylet handling during validation and replay.' },
    ],
  },
  fixAMMClawbackRounding: {
    name: 'fixAMMClawbackRounding',
    summary: 'Fixes rounding issues in AMM clawback operations.',
    impactAnalysis: {
      performance:
        'Low CPU impact. The fix applies only when an AMM pool uses LP tokens that have the clawback flag set (e.g. for compliance). The rounding logic in clawback execution is corrected so that reclaimed amounts and remaining balances are consistent; no new transaction types or heavy computation.',
      efficiency:
        'Prevents dust accumulation, double-accounting, or rounding errors when clawback is executed on AMM LP positions. Without the fix, repeated clawbacks or specific amount patterns could leave pools or accounts in inconsistent states, complicating audits and potentially creating arbitrage or exploit vectors.',
      ecosystem:
        'Regulated AMMs (e.g. RLUSD-related pools or compliance-focused DEXs) that use clawback on LP tokens can operate with correct accounting. The fix makes the combination of AMM + Clawback safe for institutional and compliant use cases.',
      riskConsiderations:
        'Low risk: targeted fix for a specific interaction (AMM + Clawback). Only affects pools that have clawback-enabled LP tokens.',
      developerImpact:
        'Protocols that rely on AMM clawback for compliance or recovery can assume exact rounding and consistent pool state after the fix.',
    },
    resourceImpact: {
      cpu: 'Low. Corrected rounding only when clawback is executed on AMM LP tokens; single code path, minimal extra work.',
      memory: 'None.',
      diskIO: 'None. Same balance and pool state updates.',
      network: 'None.',
      feePressure: 'None.',
    },
    knownProjects: [
      { ...PROJECTS.rlusd, howBenefit: 'Correct AMM LP accounting when using clawback for compliance.' },
      { ...PROJECTS.anodos, howBenefit: 'Accurate AMM pool accounting for compliant pools.' },
      { name: 'Regulated AMMs', description: 'Compliance-focused liquidity', howBenefit: 'Exact rounding when clawback is used on LP tokens.' },
    ],
  },
  fixTokenEscrowV1: {
    name: 'fixTokenEscrowV1',
    summary: 'Fixes edge cases in token escrow functionality.',
    impactAnalysis: {
      performance:
        'Low CPU impact. The amendment corrects edge-case handling in the token escrow flow (e.g. conditional release, cancel, or finish) so that state transitions and balance updates are consistent. No new ledger object types; validation logic is tightened with negligible extra cost per escrow transaction.',
      ecosystem:
        'Escrow services, vesting contracts, and conditional payment applications that use native token escrow get predictable behaviour. Edge cases that previously could leave escrows in an ambiguous state or produce incorrect releases are eliminated, improving trust and reducing support and legal risk.',
      developerImpact:
        'Builders using token escrow for vesting, OTC, or conditional payments can rely on deterministic completion and cancel semantics without implementing client-side guards for the previous edge cases.',
    },
    resourceImpact: {
      cpu: 'Low. Edge-case handling in escrow state machine corrected; no new transaction types, negligible extra validation.',
      memory: 'None.',
      diskIO: 'None. Same escrow ledger objects.',
      network: 'None.',
      feePressure: 'None.',
    },
    knownProjects: [
      { name: 'Escrow and vesting apps', description: 'Token vesting, conditional release', howBenefit: 'Reliable time-locked and condition-based token release.' },
      { ...PROJECTS.sologenic, howBenefit: 'Stable escrow for tokenized asset flows.' },
    ],
  },

  // —— Permissioned / institutional ——
  PermissionedDomains: {
    name: 'PermissionedDomains',
    summary: 'Enables permissioned domains for institutional use cases (XLS-80).',
    impactAnalysis: {
      performance:
        'Low disk I/O and CPU impact. The amendment introduces a new ledger object type (domain permissions) and associated checks during transaction application. Only transactions that reference permissioned domains are affected; the rest of the ledger continues at baseline cost. Storage grows modestly with the number of configured domains.',
      ecosystem:
        'Enables institutional and regulated deployments where participation is restricted by domain (e.g. only KYC’d entities, or only designated validators). Central banks, banks, and regulated exchanges can run or use XRPL with topology that meets compliance requirements while still benefiting from the same core protocol and tooling.',
      riskConsiderations:
        'Introduces a new trust and policy layer: domain configuration and enforcement must be managed carefully. Misconfiguration could lock out intended participants or create confusion between permissioned and open parts of the network.',
      validatorImpact:
        'Validators that enforce permissioned domains must maintain domain state and apply permission checks; others can run as before. No change to consensus rules for the open ledger.',
      developerImpact:
        'Builders targeting permissioned deployments need to integrate with domain semantics (e.g. account–domain association, permission checks). Open-ledger developers are unaffected.',
    },
    resourceImpact: {
      cpu: 'Low. Permission check only when a transaction references a permissioned domain; lookups are bounded.',
      memory: 'Low. Domain permission state is small (e.g. per-domain config); working set grows slowly.',
      diskIO: 'Low. New ledger object type for domain permissions; storage grows with number of domains.',
      network: 'None.',
      feePressure: 'None. Domain-related txs can have normal or custom fee structure.',
    },
    knownProjects: [
      { ...PROJECTS.sbi, howBenefit: 'Domain-level controls for regulated Japanese offerings.' },
      { ...PROJECTS.ripple, howBenefit: 'Enterprise and central bank pilots with permissioned topology.' },
      { name: 'Institutional validators', description: 'Banks and regulated entities', howBenefit: 'Restrict participation by domain for compliance.' },
    ],
  },
  PermissionedDEX: {
    name: 'PermissionedDEX',
    summary: 'Enables permissioned DEX trading for compliant assets (XLS-81).',
    impactAnalysis: {
      performance:
        'Medium CPU and memory impact. Each DEX offer and trade execution must be checked against permission rules (e.g. only allow trading for accounts that have passed KYC or belong to a permitted domain). This adds a bounded number of lookups and comparisons per DEX transaction; under heavy DEX load, validators see a measurable but manageable increase in resource use.',
      tpsCapacity:
        'DEX-heavy ledgers may see a slight reduction in effective TPS for permissioned pairs because each trade does additional permission checks. For mixed or order-book–heavy workloads, the impact is proportionally smaller.',
      efficiency:
        'Enables regulated venues to offer DEX-style execution (on-chain, transparent, low latency) while enforcing AML/KYC at the protocol layer. This can reduce the need for separate off-chain matching engines and reconciliation, and allows security tokens or restricted assets to trade on a shared ledger.',
      ecosystem:
        'Bridges traditional finance with DEX benefits: institutions and regulated exchanges can list compliant assets (e.g. RLUSD, security tokens) with on-chain order books and settlement while meeting jurisdictional requirements. Expands the addressable market for XRPL into regulated securities and stablecoin trading.',
      riskConsiderations:
        'Permission policy must be designed and operated carefully; overly strict rules could fragment liquidity or confuse users. Integration with identity and compliance systems is required for real-world deployment.',
      developerImpact:
        'Builders of compliant trading venues gain native support for permissioned order books and execution. Wallet and dApp UX must clearly distinguish permissioned vs open markets to avoid user errors.',
    },
    resourceImpact: {
      cpu: 'Medium. Every DEX offer and trade execution does permission lookups and checks; adds measurable CPU per DEX transaction.',
      memory: 'Medium. Permission state (e.g. allowed accounts/domains per asset) must be in memory during validation; scales with number of permissioned pairs and rules.',
      diskIO: 'Low to medium. Permission config and state stored on disk; read on each relevant DEX op.',
      network: 'None.',
      feePressure: 'None to low. DEX fees unchanged; heavy permissioned DEX load could slightly increase competition for block space.',
    },
    knownProjects: [
      { ...PROJECTS.sbi, howBenefit: 'Compliant DEX-style trading for Japanese users and RLUSD.' },
      { ...PROJECTS.rlusd, howBenefit: 'Regulated trading venues for RLUSD with KYC/AML.' },
      { name: 'Security token platforms', description: 'Regulated token exchanges', howBenefit: 'Permissioned order books for securities and regulated assets.' },
    ],
  },

  // —— Token escrow & batch (Batch currently blocked) ——
  TokenEscrow: {
    name: 'TokenEscrow',
    summary: 'Native escrow support for issued tokens (XLS-85).',
    impactAnalysis: {
      performance:
        'Medium CPU and disk I/O impact. The amendment adds new transaction types (e.g. create/cancel/finish token escrow) and ledger objects to hold escrowed amounts and conditions. Each escrow creation and completion requires validation and state updates; volume scales with the number of active escrows and completions.',
      efficiency:
        'Time-locked and conditional releases become native for any issued token (not only XRP). This removes the need for custom smart contracts or off-chain escrow agents for vesting, OTC, or conditional payments, reducing complexity and counterparty risk while keeping logic on-ledger and auditable.',
      ecosystem:
        'Vesting, payroll, OTC settlement, and conditional payments can be built entirely on XRPL for all assets. Stablecoin issuers (e.g. RLUSD) and tokenization platforms can offer programmatic escrow for institutional flows; developers get a single, consistent primitive across tokens.',
      riskConsiderations:
        'Escrow conditions and finish logic must be correctly implemented by clients; misuse could lock funds until expiry. No new consensus risks beyond normal transaction validation.',
      developerImpact:
        'Builders gain a standard way to implement vesting, escrow, and conditional release for any token without deploying separate contracts; SDKs and wallets can offer escrow UX consistently.',
    },
    resourceImpact: {
      cpu: 'Medium. New transaction types (create/cancel/finish token escrow) and validation logic; each escrow op does more work than a simple payment.',
      memory: 'Medium. Escrow state (amount, condition, expiry) held in memory during validation and in ledger state.',
      diskIO: 'Medium. New ledger objects for each active escrow; storage grows with escrow count and lifecycle.',
      network: 'None.',
      feePressure: 'Low. Escrow transactions pay fees; high escrow volume could add marginal demand for block space.',
    },
    knownProjects: [
      { ...PROJECTS.rlusd, howBenefit: 'Programmatic escrow for RLUSD in institutional flows.' },
      { ...PROJECTS.sologenic, howBenefit: 'Token vesting and conditional release for tokenized assets.' },
      { name: 'Vesting and payroll', description: 'Token distribution', howBenefit: 'Native time-locked releases reduces smart-contract dependency.' },
    ],
  },
  Batch: {
    name: 'Batch',
    summary: 'Enables batching multiple transactions atomically (XLS-56).',
    impactAnalysis: {
      performance:
        'Medium CPU, memory, and fee pressure. A batch is validated as a single unit: all inner transactions must succeed or the entire batch fails. Validators must process the full batch atomically, which increases peak memory and CPU per unit of work compared to the same number of independent transactions. Fee structure can allow batches to be cheaper per logical operation than submitting each step separately.',
      tpsCapacity:
        'Effective TPS can improve for batch-heavy applications: one batch might represent many logical operations (e.g. multi-hop swap, mint + create offer). Conversely, very large batches could temporarily consume more validation capacity per ledger close; overall network capacity is designed to absorb this with appropriate fee incentives.',
      latency:
        'Batch submission reduces round-trips for multi-step flows: one submit and one confirmation instead of several. User-perceived latency for complex operations (e.g. swap + stake, or mint + list) improves when those steps are batched.',
      efficiency:
        'All-or-nothing execution eliminates partial-fill and race conditions: DEX aggregators can guarantee a multi-hop swap either fully completes or not at all; mint+offer for NFTs becomes a single atomic action. Reduces fee cost and UX complexity for advanced DeFi and payment flows.',
      ecosystem:
        'DEX aggregators, batch payment apps, and multi-step DeFi (e.g. flash-loan-style flows, conditional swaps) gain a native primitive. Lowers the barrier to building sophisticated on-ledger applications without off-chain coordination.',
      riskConsiderations:
        'Original Batch and fixBatchInnerSigs were blocked (Feb 2026) due to a vulnerability in inner transaction signature validation. BatchV1_1 is the planned replacement. When enabled, batch size and composition should be monitored to avoid resource exhaustion.',
      validatorImpact:
        'Validators must support atomic batch validation and enforce inner-transaction rules; implementations need to handle batch-specific resource limits.',
      developerImpact:
        'SDKs and wallets will need to support constructing and signing batches; UX for “multi-step in one click” becomes possible once BatchV1_1 is live.',
    },
    knownProjects: [
      { ...PROJECTS.xrplLabs, howBenefit: 'Atomic multi-step flows in Xaman and future dApps (once BatchV1_1 enabled).' },
      { ...PROJECTS.anodos, howBenefit: 'Atomic swap and aggregator flows with lower cost.' },
      { name: 'DEX aggregators', description: 'Multi-hop swap apps', howBenefit: 'Single atomic batch instead of multiple txs; no partial fill.' },
    ],
    statusNote: 'blocked',
    statusNoteText: 'Original Batch and fixBatchInnerSigs were blocked (Feb 2026) due to security finding. BatchV1_1 replacement under review. No user funds at risk.',
    statusNoteLinks: [
      { label: 'Vulnerability disclosure (Feb 2026)', url: 'https://xrpl.org/blog/2026/vulnerabilitydisclosurereport-bug-feb2026' },
      { label: 'Report a vulnerability (XRPLF)', url: 'https://github.com/XRPLF/rippled/security' },
    ],
  },

  // —— AMM & DeFi ——
  AMM: {
    name: 'AMM',
    summary: 'Native automated market maker (XLS-30).',
    impactAnalysis: {
      performance:
        'Medium CPU, memory, and disk I/O impact. AMM introduces new ledger objects (pool state, LP tokens), transaction types (deposit, withdraw, swap), and pathfinding logic that considers both order book and AMM liquidity. Each swap or liquidity operation updates pool state and may traverse multiple pools; validation cost is higher than a simple payment but remains bounded and predictable.',
      tpsCapacity:
        'AMM swaps and liquidity operations consume more validation work per transaction than simple XRP payments. Under heavy AMM usage, a larger share of ledger capacity is used by AMM transactions; the network remains capable of thousands of TPS with a mixed workload. Peak AMM-only TPS is lower than payment-only TPS.',
      latency:
        'Swap and deposit/withdraw transactions confirm in the same 3–5 second window as other XRPL transactions; no additional latency from AMM itself. Pathfinding and pool selection can add a small amount of client-side or server-side computation before submission.',
      efficiency:
        'Native liquidity provision and swaps reduce reliance on order-book-only DEX for many pairs: liquidity is concentrated in pools, and routing can combine AMM and book for best execution. Fee and slippage are transparent and on-ledger.',
      ecosystem:
        'Core primitive for DEXs (e.g. Anodos, Gatehub), liquidity providers, and token projects. Enables RLUSD and other assets to have deep on-ledger liquidity and swap UX in wallets like Xaman without leaving the chain.',
      riskConsiderations:
        'AMM pools are subject to impermanent loss and pool-specific risk; protocol-level safety is maintained through continuous auditing and follow-up fix amendments (e.g. fixAMMv1_1, fixAMMClawbackRounding).',
      validatorImpact:
        'Validators must maintain AMM pool state and execute swap/deposit/withdraw logic; resource usage scales with the number of pools and activity.',
      developerImpact:
        'Builders can integrate swap and liquidity UX using standard AMM APIs and pathfinding; no need to run a separate AMM contract layer.',
    },
    resourceImpact: {
      cpu: 'Medium. Pathfinding across pools and order book, plus pool math (swap/deposit/withdraw); each AMM tx does more validation than a simple payment.',
      memory: 'Medium. Pool state (reserves, LPs) and pathfinding working set in memory; scales with number of pools and active liquidity.',
      diskIO: 'Medium. Pool and LP token state stored on disk; every swap or liquidity op updates ledger objects.',
      network: 'None.',
      feePressure: 'Low to medium. AMM txs pay fees; under heavy AMM usage a larger share of block space is AMM, which can slightly raise fee market for non-AMM txs.',
    },
    knownProjects: [
      { ...PROJECTS.anodos, howBenefit: 'Native AMM pools and swap UX.' },
      { ...PROJECTS.xaman, howBenefit: 'In-wallet AMM swap and liquidity via Xaman.' },
      { ...PROJECTS.rlusd, howBenefit: 'RLUSD/XRP and other AMM pools for liquidity.' },
      { ...PROJECTS.gatehub, howBenefit: 'AMM-based trading and liquidity.' },
    ],
  },
  PriceOracle: {
    name: 'PriceOracle',
    summary: 'Native price oracle infrastructure (XLS-47).',
    impactAnalysis: {
      performance:
        'Medium CPU, network, and fee pressure. The amendment adds a new transaction type for oracle price submissions and ledger objects to store price data. Validators process and store submissions; consumers read the data. Volume depends on how many oracles submit and at what frequency; aggregation and ordering (e.g. fixPriceOracleOrder) affect consistency and correctness.',
      efficiency:
        'On-chain price feeds allow DeFi protocols to use XRPL-native data for collateral valuation, liquidations, and stablecoin mechanisms without depending solely on off-chain oracles. Reduces oracle manipulation risk and simplifies architecture when the same chain hosts both assets and price data.',
      ecosystem:
        'Lending, derivatives, options, and stablecoins (e.g. RLUSD) can anchor to native Price Oracle data. Expands the set of trust-minimized DeFi use cases on XRPL and improves composability between oracle consumers and the rest of the ledger.',
      riskConsiderations:
        'Oracle data quality and liveness depend on submitter behaviour; protocol cannot enforce correctness of reported prices. Design should assume multiple oracles and aggregation to reduce single-point failure.',
      developerImpact:
        'Builders get a standard way to publish and consume price data on-ledger; integration with AMM, lending, and stablecoin logic becomes straightforward.',
    },
    resourceImpact: {
      cpu: 'Medium. Validation of oracle submissions and aggregation/ordering logic; cost scales with number of submissions per ledger.',
      memory: 'Low to medium. Oracle price state and possibly aggregation buffers in memory.',
      diskIO: 'Low to medium. Oracle ledger objects stored and updated on each submission.',
      network: 'Medium. Oracle submitters send transactions; high-frequency feeds increase network and validation load.',
      feePressure: 'Medium. Oracle submissions pay fees; protocols that submit often add steady demand for block space and can influence fee levels during congestion.',
    },
    knownProjects: [
      { ...PROJECTS.rlusd, howBenefit: 'On-chain oracle data for RLUSD stability.' },
      { name: 'Lending and derivatives', description: 'DeFi protocols', howBenefit: 'Trust-minimized price feeds for collateral and settlement.' },
    ],
  },
  Clawback: {
    name: 'Clawback',
    summary: 'Token issuers can reclaim tokens from holders (XLS-39).',
    impactAnalysis: {
      performance:
        'Low CPU impact. Clawback is optional per token (issuer sets a flag). When enabled, the issuer can submit a clawback transaction to reclaim tokens from a holder; validation requires a single flag check and balance update. Normal transfers for non-clawback tokens are unchanged; clawback execution is a small additional path.',
      efficiency:
        'Enables compliant recovery (e.g. court order, fraud, sanctions) without moving the entire asset to a separate chain or custodian. One transaction can reclaim from one or more addresses as needed, with full on-ledger audit trail.',
      ecosystem:
        'Compliant stablecoins (e.g. RLUSD) and regulated asset tokenization can meet regulatory expectations for recovery and sanctions while staying on XRPL. Expands institutional and jurisdictional adoption for tokenized assets.',
      riskConsiderations:
        'Clawback is a powerful capability; issuers must use it in line with law and policy. Users of clawback-enabled tokens should understand that the issuer can reclaim; transparency and legal frameworks are important.',
      developerImpact:
        'Issuers can enable clawback at issuance and implement compliance workflows that trigger clawback when required; wallets and explorers can surface clawback status so users make informed decisions.',
    },
    resourceImpact: {
      cpu: 'Low. One flag check on transfer for clawback-enabled tokens; clawback execution is a single balance update path.',
      memory: 'None. No new state structures.',
      diskIO: 'Low. Same balance and ledger updates as a normal transfer when clawback runs.',
      network: 'None.',
      feePressure: 'None. Clawback tx pays normal fee.',
    },
    knownProjects: [
      { ...PROJECTS.rlusd, howBenefit: 'Compliance and court-order recovery for RLUSD.' },
      { ...PROJECTS.sbi, howBenefit: 'Regulated token controls for Japanese market.' },
      { name: 'Regulated stablecoins', description: 'Compliance-focused issuers', howBenefit: 'Ability to reclaim in case of fraud or court order.' },
    ],
  },

  // —— Identity & credentials ——
  DID: {
    name: 'DID',
    summary: 'Decentralized Identifier support (XLS-40).',
    impactAnalysis: {
      performance:
        'Low disk I/O impact. DID adds a new ledger object type for DID documents (identity and key material). Creation and updates are relatively infrequent compared to payments or DEX activity; validation and storage cost scale with the number of DIDs and updates, which is expected to remain a small fraction of total ledger load.',
      ecosystem:
        'Identity verification, credential issuance, and KYC/AML linkage can be anchored on XRPL via DIDs. Enterprises and regulators can reference on-chain identity without building a separate identity chain; wallets and dApps can present verifiable identity tied to the same ledger as assets.',
      riskConsiderations:
        'DID content and key rotation are under the control of the DID controller; protocol does not enforce semantic correctness of documents. Privacy and data minimization should be considered when storing identity-related data on a public ledger.',
      developerImpact:
        'Builders can create and resolve DIDs on XRPL, and integrate with standards-based credential and verification flows (e.g. verifiable credentials) that reference XRPL DIDs.',
    },
    resourceImpact: {
      cpu: 'Low. DID document create/update/resolve adds a small validation and lookup path; volume typically low.',
      memory: 'Low. DID documents in state; total size grows with number of DIDs.',
      diskIO: 'Low. New ledger object type for DID documents; storage grows with adoption.',
      network: 'None.',
      feePressure: 'None. DID txs pay normal fees; low volume.',
    },
    knownProjects: [
      { name: 'Identity and KYC providers', description: 'Verifiable credentials', howBenefit: 'On-chain DID for attestations and KYC linkage.' },
      { ...PROJECTS.ripple, howBenefit: 'Enterprise identity and compliance use cases.' },
    ],
  },
  Credentials: {
    name: 'Credentials',
    summary: 'On-chain credential verification (XLS-70).',
    impactAnalysis: {
      performance:
        'Low disk I/O impact. The amendment introduces a new ledger entry type for storing and referencing credentials. Volume depends on adoption; credential issuance and verification are typically less frequent than payments or trades, so aggregate load is expected to stay modest.',
      ecosystem:
        'Verifiable credentials (e.g. KYC attestations, qualifications, attestations) can be stored and verified on XRPL without a separate identity chain. Enables compliance and identity use cases to sit alongside payments and tokenization on one ledger.',
      developerImpact:
        'Builders can issue and resolve credentials on-ledger, and combine them with DID and other XRPL primitives for end-to-end identity and compliance flows.',
    },
    resourceImpact: {
      cpu: 'Low. Credential issuance and verification add a bounded validation path; not high volume.',
      memory: 'Low. Credential entries in state.',
      diskIO: 'Low. New ledger entry type; storage scales with credential count.',
      network: 'None.',
      feePressure: 'None.',
    },
    knownProjects: [
      { name: 'Credential issuers', description: 'KYC, attestations', howBenefit: 'Store and verify credentials on XRPL.' },
      { ...PROJECTS.ripple, howBenefit: 'Enterprise and regulatory credential flows.' },
    ],
  },

  // —— Cross-chain & NFTs ——
  XChainBridge: {
    name: 'XChainBridge',
    summary: 'Cross-chain bridge functionality (XLS-38).',
    impactAnalysis: {
      performance:
        'Medium CPU and network impact. Bridge state and attestations are stored on the main ledger; witness servers (off-chain or sidechain) produce signatures that validators verify. Cross-chain commit and claim flows add validation and state updates; load scales with bridge activity and the number of active bridges.',
      latency:
        'Cross-chain transfers typically involve a waiting period (e.g. for attestation finality) in addition to normal ledger confirmation; user-perceived latency is higher than single-chain transfers but remains in the range of minutes when the sidechain is responsive.',
      ecosystem:
        'Sidechain deployments (e.g. XRPL EVM sidechain) and cross-chain asset transfers become possible with a standardized bridge primitive. Expands XRPL’s reach to other chains and L2s while keeping mainnet as the anchor for security and liquidity.',
      riskConsiderations:
        'Bridge security depends on witness set and sidechain behaviour; compromise of witnesses or the sidechain can affect locked/claimed assets. Design and operations must ensure robust key management and attestation logic.',
      validatorImpact:
        'Mainnet validators verify bridge-related transactions and attestations; they do not run sidechains. Witness operators may be separate from validators.',
      developerImpact:
        'Builders can implement bridge front-ends and sidechain logic that conform to XChainBridge; mainnet provides a common anchor for multiple sidechains.',
    },
    resourceImpact: {
      cpu: 'Medium. Bridge attestation verification and commit/claim state updates; cost scales with bridge activity.',
      memory: 'Medium. Bridge state and attestation data in memory during validation.',
      diskIO: 'Medium. Bridge state and lock/claim history stored on disk.',
      network: 'Medium. Witness servers and mainnet communicate; attestation and claim traffic add to network load.',
      feePressure: 'Low. Bridge txs pay fees; volume usually modest.',
    },
    knownProjects: [
      { ...PROJECTS.ripple, howBenefit: 'EVM and other sidechain bridges (e.g. XRPL EVM sidechain).' },
      { name: 'Sidechain operators', description: 'Bridge and L2', howBenefit: 'Atomic cross-chain commits and attestations.' },
    ],
  },
  fixXChainRewardRounding: {
    name: 'fixXChainRewardRounding',
    summary: 'Fixes reward rounding in cross-chain bridge.',
    impactAnalysis: {
      performance:
        'Low CPU impact. The fix corrects the rounding applied when distributing bridge rewards to witness servers or other participants. Validation logic is adjusted with no new transaction types or heavy computation; only the reward-calculation path changes.',
      efficiency:
        'Eliminates systematic rounding bias in reward distribution. Ensures that bridge operators and witnesses are compensated correctly over time, avoiding drift or disputes over reward amounts.',
      ecosystem:
        'Sidechain and bridge operators get correct reward accounting, which is important for incentivizing a healthy witness set and sustainable bridge operations.',
      developerImpact:
        'Bridge and sidechain implementers can rely on accurate reward amounts when building economics and dashboards around XChainBridge.',
    },
    resourceImpact: {
      cpu: 'Low. Corrected rounding in reward calculation path only; no new logic.',
      memory: 'None.',
      diskIO: 'None.',
      network: 'None.',
      feePressure: 'None.',
    },
    knownProjects: [
      { name: 'Bridge and sidechain operators', description: 'XRPL bridges', howBenefit: 'Correct reward distribution for witnesses and signers.' },
    ],
  },
  DynamicNFT: {
    name: 'DynamicNFT',
    summary: 'Mutable NFT metadata (XLS-46).',
    impactAnalysis: {
      performance:
        'Low disk I/O and CPU impact. The amendment adds a transaction type that allows updating NFT metadata (e.g. URI, attributes) under rules set at mint. Each update is a single transaction; volume depends on how often creators or systems update metadata. Storage grows with the number of dynamic NFTs and their update history as defined by the implementation.',
      efficiency:
        'Enables use cases that require evolving metadata (e.g. game state, levels, achievements) without burning and reminting. Reduces transaction count and complexity for dynamic content compared to immutable NFT + new mint workflows.',
      ecosystem:
        'Gaming, dynamic collectibles, and updatable NFT content (e.g. in-game items, evolving art) become native. Marketplaces and wallets can support “living” NFTs that change over time while remaining the same token.',
      riskConsiderations:
        'Mutability must be constrained by the rules set at mint (e.g. who can update, how often) to avoid abuse; implementations should make update permissions clear to buyers.',
      developerImpact:
        'Creators and platforms can design NFTs that update over time; SDKs and indexers need to handle metadata updates and versioning for display and discovery.',
    },
    resourceImpact: {
      cpu: 'Low. Metadata update is one transaction type; validation cost similar to other NFT ops.',
      memory: 'Low. Updated metadata in state.',
      diskIO: 'Low to medium. Metadata updates write to ledger; volume depends on how often NFTs are updated.',
      network: 'None.',
      feePressure: 'None to low. Update txs pay fees.',
    },
    knownProjects: [
      { ...PROJECTS.peerkat, howBenefit: 'Updatable metadata for gaming and dynamic collectibles.' },
      { ...PROJECTS.crossmark, howBenefit: 'Dynamic NFT experiences and metadata lifecycle.' },
      { name: 'Gaming and metaverse', description: 'In-game assets', howBenefit: 'NFT state that can evolve with game or story.' },
    ],
  },
  fixNFTokenDirV1: {
    name: 'fixNFTokenDirV1',
    summary: 'Corrects NFToken directory pagination edge cases.',
    impactAnalysis: {
      performance:
        'Negligible impact. The fix adds a single validation check during NFToken directory traversal to handle an edge case in pagination logic. Benchmarks show no measurable increase in validation time; the change prevents incorrect or inconsistent directory navigation in rare conditions.',
      ecosystem:
        'NFT marketplaces, wallets, and high-volume token applications that paginate through large NFT collections benefit from reliable directory behaviour. Prevents subtle bugs when listing or querying accounts with many NFTs.',
      developerImpact:
        'Builders who paginate NFT directories can rely on consistent results at boundary conditions; no API changes required.',
    },
    resourceImpact: {
      cpu: 'Negligible. One extra validation check during NFT directory traversal; no measurable increase.',
      memory: 'None.',
      diskIO: 'None. Same read path.',
      network: 'None.',
      feePressure: 'None.',
    },
    knownProjects: [
      { ...PROJECTS.peerkat, howBenefit: 'Reliable directory pagination for large collections.' },
      { ...PROJECTS.crossmark, howBenefit: 'Stable NFT indexing and listing.' },
    ],
  },

  // —— Payment channels ——
  fixPayChanCancelAfter: {
    name: 'fixPayChanCancelAfter',
    summary: 'Fixes payment channel cancel timing.',
    impactAnalysis: {
      performance:
        'Low CPU impact. The fix corrects the handling of the cancel-after time when closing or settling a payment channel. Validation logic is adjusted so that channel lifecycle (create, fund, claim, cancel) is consistent with the intended semantics; no new transaction types.',
      latency:
        'No direct effect on confirmation latency; the fix ensures that time-based cancel behaviour is predictable, so streaming and micropayment apps can rely on channels closing at the expected time.',
      ecosystem:
        'Streaming payments, micropayments, and high-throughput payment apps (e.g. pay-per-view, tipping, IoT) depend on correct channel lifecycle. Fixing cancel-after prevents channels from being closed earlier or later than intended, avoiding disputes or stuck funds.',
      developerImpact:
        'Builders using payment channels can assume correct cancel-after semantics when implementing timeout and closure logic.',
    },
    resourceImpact: {
      cpu: 'Low. Corrected cancel-after handling in channel lifecycle; no new transaction types.',
      memory: 'None.',
      diskIO: 'None.',
      network: 'None.',
      feePressure: 'None.',
    },
    knownProjects: [
      { ...PROJECTS.xaman, howBenefit: 'Correct payment channel behavior for streaming and high-throughput flows.' },
      { name: 'Micropayment and streaming apps', description: 'Pay-per-use', howBenefit: 'Predictable channel close and cancel semantics.' },
    ],
  },

  // —— 2.5.0 voting / additional ——
  AMMv1_3: {
    name: 'AMMv1_3',
    summary: 'AMM improvements and bug fixes (v1.3).',
    impactAnalysis: {
      performance:
        'Low CPU impact. The amendment applies the latest round of correctness and safety fixes to the AMM implementation (e.g. edge cases in swap or deposit/withdraw math, rounding, or state transitions). Validation cost per AMM transaction is unchanged or marginally lower where logic is simplified.',
      efficiency:
        'Improves safety and predictability of AMM behaviour: fewer edge-case failures, more consistent rounding, and correct state across upgrades. Reduces risk of dust, rounding exploits, or inconsistent pool state.',
      ecosystem:
        'All AMM pools, liquidity providers, and DEXs benefit from more reliable native AMM behaviour. Complements earlier fixes (fixAMMv1_1, fixAMMv1_2, fixAMMClawbackRounding) to keep the AMM primitive production-ready.',
      developerImpact:
        'No integration changes required; AMM APIs and behaviour remain the same from a high-level perspective, with underlying correctness improved.',
    },
    resourceImpact: {
      cpu: 'Low. Bug fixes only; validation path unchanged or marginally simpler.',
      memory: 'None.',
      diskIO: 'None.',
      feePressure: 'None.',
    },
    knownProjects: [
      { ...PROJECTS.anodos, howBenefit: 'Stable and predictable AMM behavior.' },
      { ...PROJECTS.xaman, howBenefit: 'Reliable in-wallet AMM swaps.' },
      { ...PROJECTS.rlusd, howBenefit: 'Safer RLUSD AMM pools.' },
    ],
  },
  EnforceNFTokenTrustlineV2: {
    name: 'EnforceNFTokenTrustlineV2',
    summary: 'Additional NFToken trustline enforcement.',
    impactAnalysis: {
      performance:
        'Low CPU impact. The amendment tightens enforcement of NFToken trustline rules (e.g. ensuring that only accounts with the correct trustline can hold or receive certain NFTs). One or a small number of additional checks during NFT transfer or offer execution; negligible overhead per transaction.',
      ecosystem:
        'NFT marketplaces, wallets, and issuers benefit from stronger guarantees that NFT ownership and transfer respect trustline configuration. Reduces risk of NFTs being held or traded in violation of issuer intent (e.g. restricted or gated collections).',
      riskConsiderations:
        'Low risk: enforcement aligns behaviour with the intended NFT trustline model. Existing valid trustlines are unaffected; only previously undetected edge cases are now rejected.',
      developerImpact:
        'Builders must ensure that trustlines are set correctly before minting or transferring NFTs that have restrictions; UX should guide users to establish trust where required.',
    },
    resourceImpact: {
      cpu: 'Low. One or a few extra checks during NFT transfer/offer when trustline enforcement applies.',
      memory: 'None.',
      diskIO: 'None.',
      network: 'None.',
      feePressure: 'None.',
    },
    knownProjects: [
      { ...PROJECTS.peerkat, howBenefit: 'Stronger NFT trustline security.' },
      { ...PROJECTS.crossmark, howBenefit: 'Correct trustline behavior for NFTs.' },
    ],
  },
  PermissionDelegation: {
    name: 'PermissionDelegation',
    summary: 'Allows delegation of account permissions (XLS-82).',
    impactAnalysis: {
      performance:
        'Low overhead. The amendment introduces a permission model where an account can delegate a subset of its capabilities (e.g. sign for certain transaction types or up to a limit) to another key or account. Validation requires checking delegation rules in addition to normal signature verification; cost is bounded and scales with the number of delegations in use.',
      efficiency:
        'Enables delegated signing without sharing the master key: hot wallets or service accounts can have limited authority (e.g. only payments below X XRP, or only specific transaction types), reducing the impact of compromise and simplifying operational security.',
      ecosystem:
        'Custodians, multisig setups, and institutional key management can implement tiered access (e.g. operator keys for daily operations, cold key for large transfers). Supports regulatory and enterprise requirements for separation of duties.',
      riskConsiderations:
        'Delegation configuration must be designed carefully to avoid over-granting; UX should make clear what each key is allowed to do.',
      developerImpact:
        'Wallets and custody solutions can implement delegation UX and key hierarchies; signers need to support the new transaction types and permission checks.',
    },
    resourceImpact: {
      cpu: 'Low. Delegation check in addition to normal signature verification; bounded per tx.',
      memory: 'Low. Delegation rules and state in memory during validation.',
      diskIO: 'Low. Delegation config stored on ledger.',
      network: 'None.',
      feePressure: 'None.',
    },
    knownProjects: [
      { ...PROJECTS.ripple, howBenefit: 'Enterprise custody and delegated signing.' },
      { name: 'Custodians and multisig', description: 'Key management', howBenefit: 'Delegate without sharing master key.' },
    ],
  },
};

/** Amendments that are blocked or obsolete (show warning in UI) */
export const BLOCKED_OR_OBSOLETE_AMENDMENTS: string[] = ['Batch', 'fixBatchInnerSigs'];
