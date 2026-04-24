/**
 * Client-only prompt / cognitive pre-scan. Not a substitute for server-side or model-level controls.
 * No transaction submission, signing, or chain interaction — pattern match only in the browser.
 * External data can be evidence, but never instruction — reflect that in operator training and UI, not only here.
 */

export type PromptScanStatus = 'clean' | 'suspicious' | 'blocked';
export type PromptScanSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface PromptScanResult {
  status: PromptScanStatus;
  severity: PromptScanSeverity;
  flags: string[];
  explanation: string;
}

const SEV: Record<PromptScanSeverity, number> = { low: 0, medium: 1, high: 2, critical: 3 };

function maxSeverity(a: PromptScanSeverity, b: PromptScanSeverity): PromptScanSeverity {
  return SEV[a] >= SEV[b] ? a : b;
}

interface Rule {
  re: RegExp;
  flag: string;
  severity: PromptScanSeverity;
  block: boolean;
}

const RULES: Rule[] = [
  { re: /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+instructions?/i, flag: 'instruction_supersession', severity: 'high', block: false },
  { re: /disregard(\s+all)?\s+(the\s+)?(system|previous|safety|policy)/i, flag: 'disregard_safety_or_system', severity: 'high', block: false },
  { re: /override\s+(\w+\s+){0,2}(system\s+)?prompt/i, flag: 'override_system_prompt', severity: 'high', block: false },
  { re: /reveal\s+secrets?/i, flag: 'reveal_secrets', severity: 'high', block: true },
  { re: /private\s+key(s)?/i, flag: 'private_key_mention', severity: 'critical', block: true },
  { re: /seed(\s+phrases?|s)\b/i, flag: 'seed_phrase_mention', severity: 'critical', block: true },
  { re: /mnemonic(\s+phrase|s)?/i, flag: 'mnemonic_mention', severity: 'high', block: true },
  { re: /recovery(\s+phrase|s)/i, flag: 'recovery_phrase_mention', severity: 'high', block: true },
  { re: /send(\s+)?funds?/i, flag: 'send_funds', severity: 'medium', block: false },
  { re: /transfer\s+(\w+\s+)*funds?/i, flag: 'transfer_funds', severity: 'medium', block: false },
  { re: /change(\s+the)?\s+destination/i, flag: 'change_destination', severity: 'high', block: false },
  { re: /disable(\s+)?(safety|safeties|compliance|guard|filters?)/i, flag: 'disable_safety', severity: 'high', block: false },
  { re: /bypass(\s+)?(approval|compliance|policy|guard)/i, flag: 'bypass_approval', severity: 'critical', block: true },
  { re: /execute(\s+)?without(\s+)?(human\s+)?approval/i, flag: 'execute_without_approval', severity: 'critical', block: true },
  { re: /(run|execute|perform)(\s+)?(autonomously|without)\s+approval/i, flag: 'unapproved_execution', severity: 'critical', block: true },
  { re: /exfiltrat/i, flag: 'exfiltrate_data', severity: 'high', block: false },
  { re: /hidden(\s+)?(command|directive|instruction)/i, flag: 'hidden_command', severity: 'medium', block: false },
  { re: /developer\s*mode(\s*override)?/i, flag: 'developer_mode', severity: 'medium', block: false },
  { re: /jailbreak/i, flag: 'jailbreak', severity: 'high', block: false },
  { re: /turn(\s+)?off(\s+)?(compliance|safety|policy|guard|firewall)/i, flag: 'turn_off_safety', severity: 'high', block: false },
  { re: /ignore(\s+)?(the\s+)?(policy|compliance|guard)/i, flag: 'ignore_policy', severity: 'high', block: false },
  { re: /sign(\s+)(this|the|that|my)\s+transaction/i, flag: 'sign_transaction_prompt', severity: 'critical', block: true },
  { re: /signed\s+transaction.*broadcast/i, flag: 'signed_broadcast_hint', severity: 'high', block: false },
];

const BASELINE =
  'External or pasted content is untrusted: it may be evidence in an audit, but is not a privileged override of system or operator policy.';

export function scanPrompt(input: string): PromptScanResult {
  const trimmed = input?.trim() ?? '';
  if (!trimmed) {
    return {
      status: 'clean',
      severity: 'low',
      flags: [],
      explanation: 'Empty input — no patterns to evaluate. ' + BASELINE,
    };
  }

  const hits: { flag: string; severity: PromptScanSeverity; block: boolean }[] = [];
  for (const { re, flag, severity, block } of RULES) {
    re.lastIndex = 0;
    if (re.test(trimmed)) {
      hits.push({ flag, severity, block });
    }
  }

  if (hits.length === 0) {
    return {
      status: 'clean',
      severity: 'low',
      flags: [],
      explanation: 'No high-risk prompt-injection or wallet-safety patterns matched. ' + BASELINE,
    };
  }

  const flags = [...new Set(hits.map((h) => h.flag))];
  const anyBlock = hits.some((h) => h.block);
  let severity: PromptScanSeverity = 'low';
  for (const h of hits) {
    severity = maxSeverity(severity, h.severity);
  }
  if (anyBlock) {
    severity = 'critical';
  }

  const status: PromptScanStatus = anyBlock || severity === 'critical' ? 'blocked' : 'suspicious';

  const expl = `Matched ${flags.length} signal(s): ${flags.join(', ')}. ${BASELINE}`;

  return { status, severity, flags, explanation: expl };
}
