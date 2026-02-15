/**
 * Audit log for safety and debugging. In-memory by default; hook for Redis/Postgres later.
 */

import type { AuditLogEntry } from './types';

const MAX_ENTRIES = 5000;
const log: AuditLogEntry[] = [];

export function appendAudit(entry: Omit<AuditLogEntry, 'id' | 'ts'>): void {
  log.push({
    ...entry,
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ts: Date.now(),
  });
  if (log.length > MAX_ENTRIES) log.splice(0, log.length - MAX_ENTRIES);
}

export function getAuditLog(since?: number): AuditLogEntry[] {
  if (since == null) return [...log];
  return log.filter((e) => e.ts >= since);
}
