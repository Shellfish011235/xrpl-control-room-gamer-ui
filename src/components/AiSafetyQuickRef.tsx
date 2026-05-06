/**
 * End-user pointer to NIST AI RMF 1.0 (NIST.AI.100-1) and how this app reflects its themes.
 * Voluntary framework — shown for transparency, not as a certification.
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, Shield } from 'lucide-react';
import {
  NIST_AI_RMF_CORE_IN_APP,
  NIST_AI_RMF_HUB_URL,
  NIST_AI_RMF_PDF_URL,
  NIST_TRUSTWORTHY_IN_APP,
} from '../lib/nistAiRmf';

export function AiSafetyQuickRef() {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-cyber-border/60 bg-cyber-dark/40 shrink-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs text-cyber-muted hover:text-cyber-text"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 min-w-0">
          <Shield size={14} className="text-cyber-green shrink-0" />
          <span className="font-cyber text-cyber-text truncate">AI trust & safety (NIST AI RMF)</span>
        </span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-3 text-[10px] sm:text-xs text-cyber-muted leading-relaxed">
          <p>
            This control room uses <span className="text-cyber-text">assistive</span> agents and analytics—not autonomous custody.
            Design choices echo NIST’s voluntary{' '}
            <a
              href={NIST_AI_RMF_PDF_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyber-cyan underline-offset-2 hover:underline"
            >
              AI Risk Management Framework (PDF)
            </a>{' '}
            and{' '}
            <a
              href={NIST_AI_RMF_HUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyber-cyan underline-offset-2 hover:underline"
            >
              hub resources
            </a>
            : human oversight, transparency, and measured risk.
          </p>
          <ul className="space-y-1.5 border-l border-cyber-border/80 pl-2">
            {NIST_AI_RMF_CORE_IN_APP.map((row) => (
              <li key={row.fn}>
                <span className="font-cyber text-cyber-cyan">{row.fn}.</span> {row.summary}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-1">
            {NIST_TRUSTWORTHY_IN_APP.map((t) => (
              <span
                key={t.id}
                title={t.hint}
                className="px-1.5 py-0.5 rounded border border-cyber-border/60 bg-cyber-darker/80 text-[9px] sm:text-[10px] text-cyber-text/90 cursor-default"
              >
                {t.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
