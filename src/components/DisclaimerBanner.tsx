/**
 * Phase 0: Prominent disclaimer on every page.
 * "Educational/sim tool only. Not financial advice. User signs via Xaman. Comply with US/FL laws. No custody."
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

const TEXT = 'Educational / sim tool only. Not financial advice. All execution via Xaman (user signs). Comply with US/FL laws. No custody.';

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
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden border-b border-cyber-yellow/30 bg-cyber-yellow/5"
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
