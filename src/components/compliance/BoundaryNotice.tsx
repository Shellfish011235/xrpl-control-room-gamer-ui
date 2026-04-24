import type { ReactNode } from 'react';
import clsx from 'clsx';

type Variant = 'action' | 'simulation' | 'interpretation' | 'compact';

const copy: Record<Variant, { title: string; body: string }> = {
  action: {
    title: 'User-controlled action',
    body: 'Nothing executes without your review and approval in your own wallet. This app does not sign or move funds in the background.',
  },
  simulation: {
    title: 'Simulation',
    body: 'Estimates and previews are informational. Network conditions change; results are not guarantees.',
  },
  interpretation: {
    title: 'Interpretation',
    body: 'Heuristics and model output are not investment, legal, or tax advice. Verify important facts independently.',
  },
  compact: {
    title: 'Read-only or preview',
    body: 'Informational software only. Not a broker, adviser, or custodian.',
  },
};

export function BoundaryNotice({ variant, className, children }: { variant: Variant; className?: string; children?: ReactNode }) {
  const c = copy[variant];
  return (
    <div
      className={clsx(
        'rounded-lg border border-cyber-border/60 bg-cyber-darker/60 p-3 text-left',
        className
      )}
    >
      <p className="text-[10px] font-cyber text-cyber-cyan/90 tracking-wide uppercase mb-1">{c.title}</p>
      <p className="text-[10px] sm:text-xs text-cyber-muted font-cyber leading-relaxed">{c.body}</p>
      {children}
    </div>
  );
}
