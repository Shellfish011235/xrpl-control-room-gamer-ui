/**
 * User-facing safety copy for Mission Control panels (Ticket 008).
 * Centralizes repeated “simulation / local-only” strings for consistency.
 */

export const COPY_PRIVATE_QUANT_SIMULATION_ONLY =
  'Private Quant Lab is simulation-only: it does not execute trades, submit transactions, or move funds on the ledger.';

export const COPY_PAPER_TRADING_LOCAL =
  'Paper trading is local-only: PnL and size are stored in this browser, not on-chain.';

export const COPY_KILL_SWITCH =
  'When on, the kill switch blocks new sample simulations, Liquidity Nexus imports, and new paper trades.';

export const COPY_TASK_RECEIPTS_LOCAL =
  'Task Receipts are stored in this browser only. They are not XRPL memos and do not submit transactions.';

export const COPY_COMPLIANCE_NOT_LEGAL =
  'Compliance Guard reflects technical policy guardrails for the UI — not legal advice. Consult qualified counsel for your situation.';

export const COPY_SECURITY_EVIDENCE_NOT_INSTRUCTION =
  'Security Ops: treat external or pasted content as evidence for review, never as instruction to override safety or policy.';

export const COPY_SIMULATED_ACCOUNTING =
  'Simulated accounting is browser-only; not a real general ledger, TigerBeetle, or bank balance.';

/** @returns Human-readable reason when a control is disabled, or `null` if enabled. */
export function importOptimizerDisabledReason(
  privateQuantEnabled: boolean,
  killSwitch: boolean,
  pathCount: number
): string | null {
  if (!privateQuantEnabled) {
    return 'Enable Private Quant Lab first (simulation-only).';
  }
  if (killSwitch) {
    return 'Turn the kill switch off. It blocks new simulations and imports while on.';
  }
  if (pathCount === 0) {
    return 'No ranked paths in memory. Open Liquidity Nexus, run a path search, then return to import.';
  }
  return null;
}

/** @returns Human-readable reason when "Open paper trade" is disabled, or `null` if enabled. */
export function openPaperTradeDisabledReason(
  privateQuantEnabled: boolean,
  killSwitch: boolean,
  hasOpportunities: boolean,
  paperSizeXRP: number,
  recommendation: string
): string | null {
  if (!privateQuantEnabled) {
    return 'Enable Private Quant Lab first (simulation-only).';
  }
  if (killSwitch) {
    return 'Kill switch is on — it blocks new paper trades until turned off.';
  }
  if (!hasOpportunities) {
    return 'Add at least one opportunity (sample run or Liquidity Nexus import) first.';
  }
  if (!(paperSizeXRP > 0)) {
    return 'Enter a notional greater than 0 XRP. Local cap still applies.';
  }
  if (recommendation === 'ignore') {
    return 'This opportunity is marked ignore — open paper trade is disabled for this row.';
  }
  return null;
}

/** @returns Reason when "Run sample simulation" is disabled. */
export function runSampleDisabledReason(privateQuantEnabled: boolean, killSwitch: boolean): string | null {
  if (!privateQuantEnabled) {
    return 'Enable Private Quant Lab to run a sample (simulation-only).';
  }
  if (killSwitch) {
    return 'Turn the kill switch off to run a sample. While on, it blocks new simulations and paper trades.';
  }
  return null;
}
