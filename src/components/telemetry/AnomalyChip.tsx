/**
 * Reusable anomaly chip: severity + message. Used in panels and detail drawers.
 */

import type { AnomalySeverity } from '../../types/telemetry-truth-model';

export interface AnomalyChipProps {
  /** Severity drives color */
  severity: AnomalySeverity;
  /** Short message or tag */
  message: string;
  /** Optional type/code for tooltip */
  type?: string;
  compact?: boolean;
  className?: string;
}

const SEVERITY_STYLES: Record<
  AnomalySeverity,
  string
> = {
  low: 'bg-cyber-muted/20 text-cyber-muted border-cyber-border',
  medium: 'bg-cyber-yellow/15 text-cyber-yellow border-cyber-yellow/40',
  high: 'bg-cyber-orange/20 text-cyber-orange border-cyber-orange/40',
  critical: 'bg-cyber-red/20 text-cyber-red border-cyber-red/40',
};

export function AnomalyChip({
  severity,
  message,
  type,
  compact = false,
  className = '',
}: AnomalyChipProps) {
  const style = SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.low;
  const title = type ? `${type}: ${message}` : message;

  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 ${compact ? 'text-[10px]' : 'text-xs'} ${style} ${className}`}
      title={title}
    >
      {message}
    </span>
  );
}
