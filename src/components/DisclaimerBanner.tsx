/**
 * Phase 0: Prominent notice on every page.
 * Framing: informational software & analytics — not investment advice; no custody; user approves in wallet.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

const TEXT =
  'Informational software & public market data only — not investment, legal, or tax advice. No custody of keys or funds. You approve any transaction in your own wallet. AI-assisted areas follow human-in-the-loop and transparency practices aligned with NIST’s voluntary AI Risk Management Framework (NIST.AI.100-1); see the agent drawer for a short mapping. Comply with applicable law (including U.S. / FL as relevant).';

export function DisclaimerBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('xrpl-disclaimer-dismissed') === '1';
    } catch {
      return false;
    }
  });

  const dismiss = () => {
    try {
      sessionStorage.setItem('xrpl-disclaimer-dismissed', '1');
    } catch {}
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="border-b border-cyber-yellow/30 bg-cyber-yellow/5"
        >
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle size={14} className="text-cyber-yellow shrink-0" />
              <p className="text-[10px] sm:text-xs text-cyber-muted font-cyber tracking-wide">
                {TEXT}
              </p>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="p-1 rounded text-cyber-muted hover:text-cyber-text shrink-0"
              aria-label="Dismiss disclaimer"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
