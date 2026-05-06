/**
 * Compact preview of a SafetyDecision before external signing (read-only summary).
 */

import type { SafetyDecision } from '../../safety/safetyTypes';

export interface IntentPreviewCardProps {
  title: string;
  action: string;
  network?: 'testnet' | 'mainnet';
  amountXrp?: number;
  destination?: string;
  destinationTag?: number;
  currency?: string;
  issuer?: string;
  decision: SafetyDecision;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function IntentPreviewCard({
  title,
  action,
  network,
  amountXrp,
  destination,
  destinationTag,
  currency,
  issuer,
  decision,
  onConfirm,
  onCancel,
}: IntentPreviewCardProps) {
  const blocked = !decision.allowed || decision.status === 'blocked';
  const review = decision.status === 'needs_review';

  return (
    <div className="rounded-xl border border-cyber-border/70 bg-cyber-darker/80 p-3 space-y-2 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="font-cyber text-cyber-glow text-[11px] uppercase tracking-wide">{title}</span>
        <span className="text-[10px] font-mono text-cyber-muted">{decision.mode}</span>
      </div>
      <div className="text-cyber-text space-y-0.5 font-mono text-[10px]">
        <div>
          <span className="text-cyber-muted">Action:</span> {action}
        </div>
        {network && (
          <div>
            <span className="text-cyber-muted">Network:</span>{' '}
            <span className={network === 'mainnet' ? 'text-cyber-red' : 'text-cyber-cyan'}>{network}</span>
          </div>
        )}
        {amountXrp != null && Number.isFinite(amountXrp) && (
          <div>
            <span className="text-cyber-muted">Amount XRP:</span> {amountXrp}
          </div>
        )}
        {destination && (
          <div className="truncate">
            <span className="text-cyber-muted">To:</span> {destination}
          </div>
        )}
        {destinationTag != null && (
          <div>
            <span className="text-cyber-muted">Tag:</span> {destinationTag}
          </div>
        )}
        {currency && (
          <div>
            <span className="text-cyber-muted">Currency:</span> {currency}
          </div>
        )}
        {issuer && (
          <div className="truncate">
            <span className="text-cyber-muted">Issuer:</span> {issuer}
          </div>
        )}
      </div>
      {decision.reasons.length > 0 && (
        <ul className="text-[10px] text-cyber-red space-y-0.5 list-disc pl-4">
          {decision.reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}
      {decision.warnings.length > 0 && (
        <ul className="text-[10px] text-cyber-yellow space-y-0.5 list-disc pl-4">
          {decision.warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      )}
      {decision.requiredActions.length > 0 && (
        <ul className="text-[10px] text-cyber-cyan space-y-0.5 list-disc pl-4">
          {decision.requiredActions.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      )}
      {!blocked && (
        <div className="flex flex-wrap gap-2 pt-1">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-2 py-1 rounded border border-cyber-border text-cyber-muted hover:text-cyber-text text-[10px] font-cyber"
            >
              Cancel
            </button>
          )}
          {onConfirm && (
            <button
              type="button"
              onClick={onConfirm}
              className="px-2 py-1 rounded border border-cyber-cyan/50 text-cyber-cyan hover:bg-cyber-cyan/10 text-[10px] font-cyber"
            >
              {review ? 'I understand — continue to Xaman' : 'Review in Xaman'}
            </button>
          )}
        </div>
      )}
      {blocked && <p className="text-[10px] text-cyber-red font-cyber">Blocked — no signing request created.</p>}
    </div>
  );
}
