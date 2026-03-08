/**
 * Reusable confidence badge: observation class + confidence label.
 * Shows warning icon when stale/weak evidence. Shared across maps and analytics panels.
 */

import { AlertTriangle } from 'lucide-react';
import {
  getConfidenceLabel,
  getObservationClassLabel,
  shouldShowWarningBadge,
} from '../../types/telemetry-visual-rules';
import type { ObservationClass } from '../../types/telemetry-truth-model';

export interface ConfidenceBadgeProps {
  /** 0–100 */
  confidence: number;
  observationClass: ObservationClass;
  /** If true, show warning icon (stale/weak). Can be derived via shouldShowWarningBadge if not passed. */
  showWarning?: boolean;
  /** Compact = smaller text; default false */
  compact?: boolean;
  className?: string;
}

export function ConfidenceBadge({
  confidence,
  observationClass,
  showWarning: showWarningProp,
  compact = false,
  className = '',
}: ConfidenceBadgeProps) {
  const label = getConfidenceLabel(confidence, observationClass);
  const obsLabel = getObservationClassLabel(observationClass);
  const showWarning =
    showWarningProp ??
    shouldShowWarningBadge({
      observation_class: observationClass,
      confidence,
      freshness: 'unknown',
    });

  const isHigh = confidence >= 70 && observationClass === 'observed';
  const isSynthetic = observationClass === 'synthetic';
  const isInferred = observationClass === 'inferred' || observationClass === 'unknown';

  const textClass = isHigh
    ? 'text-cyber-cyan'
    : isSynthetic
      ? 'text-cyber-orange'
      : isInferred
        ? 'text-cyber-yellow'
        : 'text-cyber-muted';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border border-cyber-border px-2 py-0.5 ${compact ? 'text-[10px]' : 'text-[11px]'} ${className}`}
      title={`${obsLabel} · ${label} (${confidence}%)`}
    >
      {showWarning && <AlertTriangle className="w-3 h-3 text-cyber-yellow shrink-0" aria-hidden />}
      <span className={textClass}>{obsLabel}</span>
      <span className="text-cyber-muted">·</span>
      <span className="text-cyber-muted">{label}</span>
    </span>
  );
}
