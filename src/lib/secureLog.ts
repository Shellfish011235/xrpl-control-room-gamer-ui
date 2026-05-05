/**
 * Browser-safe logging: avoid leaking transaction payloads, memos, or infra URLs in production.
 */

export const isDevLogEnabled = (): boolean =>
  typeof import.meta !== 'undefined' && Boolean(import.meta.env?.DEV);

/** Redact XRPL-ish addresses in a string for dev-only traces. */
export function redactAddresses(s: string, visible = 6): string {
  return s.replace(/\br[1-9A-HJ-NP-Za-km-z]{24,34}\b/g, (m) => `${m.slice(0, visible)}…`);
}

/** Safe summary of a Xaman/XRPL payload for logs (no memos, minimal fields). */
export function summarizeTxForLog(tx: Record<string, unknown> | null | undefined): string {
  if (!tx || typeof tx !== 'object') return '(no tx)';
  const tt = tx.TransactionType;
  const acct = typeof tx.Account === 'string' ? redactAddresses(tx.Account) : '—';
  const dest = typeof tx.Destination === 'string' ? redactAddresses(tx.Destination) : undefined;
  return [String(tt ?? '?'), `Account:${acct}`, dest ? `Dest:${dest}` : null].filter(Boolean).join(' ');
}

export function devLog(...args: unknown[]): void {
  if (isDevLogEnabled()) console.log(...args);
}

export function devWarn(...args: unknown[]): void {
  if (isDevLogEnabled()) console.warn(...args);
}

export function devError(...args: unknown[]): void {
  if (isDevLogEnabled()) console.error(...args);
}
