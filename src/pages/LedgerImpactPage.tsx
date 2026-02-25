/**
 * Ledger Impact – amendments, forecasts, TPS/efficiency. Wraps LedgerImpactTool.
 * Shown on Home/Terminal; also available as a tab under Tools.
 */

import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { LedgerImpactTool } from '../components/LedgerImpactTool';

export default function LedgerImpactPage() {
  const location = useLocation();
  const inToolsHub = location.pathname.startsWith('/tools');

  return (
    <div className={`min-h-screen ${inToolsHub ? 'pt-4' : 'pt-20'} pb-8 px-4 lg:px-8`}>
      {!inToolsHub && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-wrap items-center gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyber-glow/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-cyber-glow" />
            </div>
            <div>
              <h1 className="font-cyber text-xl text-cyber-text">LEDGER IMPACT</h1>
              <p className="text-xs text-cyber-muted">Amendments · Forecasts · TPS & efficiency</p>
            </div>
          </div>
        </motion.div>
      )}
      <LedgerImpactTool />
    </div>
  );
}
