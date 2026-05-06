/**
 * NIST Artificial Intelligence Risk Management Framework (AI RMF 1.0), NIST.AI.100-1.
 * Voluntary, use-case-agnostic guidance — not legal compliance by itself.
 * @see https://doi.org/10.6028/NIST.AI.100-1
 */

export const NIST_AI_RMF_PDF_URL = 'https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf';
export const NIST_AI_RMF_HUB_URL = 'https://www.nist.gov/itl/ai-risk-management-framework';

/** How the four Core functions map to product-facing controls (plain language). */
export const NIST_AI_RMF_CORE_IN_APP = [
  {
    fn: 'Govern',
    summary:
      'Written guardrails: agents cannot request secrets, bypass policy, or autonomously sign or move funds—wallet stays in control.',
  },
  {
    fn: 'Map',
    summary:
      'Context is explicit: each agent lists role, data sources, capabilities, and blocked actions (see Agents page / registry).',
  },
  {
    fn: 'Measure',
    summary:
      'Observable behavior: sim vs live display, receipts and task fingerprints where wired—so outputs can be reviewed.',
  },
  {
    fn: 'Manage',
    summary:
      'Human-in-the-loop: risky prompts can be flagged; you confirm payments in your wallet; errors surface in the UI instead of silent failure.',
  },
] as const;

/** Trustworthy-AI characteristics from Part 1, tightened for this UI. */
export const NIST_TRUSTWORTHY_IN_APP = [
  { id: 'accountable', label: 'Accountable & transparent', hint: 'Registry + receipts; no hidden autonomous trading.' },
  { id: 'safe', label: 'Safe', hint: 'Financial execution blocked at the agent layer unless you act in a wallet.' },
  { id: 'secure', label: 'Secure & resilient', hint: 'Universal blocks on private keys and policy bypass.' },
  { id: 'explainable', label: 'Explainable', hint: 'Each agent has a stated role and scope—not a black box.' },
  { id: 'privacy', label: 'Privacy-aware', hint: 'Credentials you enter stay on your device/session; we do not custody keys.' },
] as const;
