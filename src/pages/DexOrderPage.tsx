/**
 * DEX Order page – Place OfferCreate (testnet), sign with Xumm.
 */

import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import PlaceDEXOrder from '../components/PlaceDEXOrder';

export default function DexOrderPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-cyber text-lg font-bold uppercase tracking-wider text-cyber-text">
          Place DEX Order
        </h1>
        <Link
          to="/tools"
          className="inline-flex items-center gap-1 text-xs text-cyber-muted hover:text-cyber-glow transition-colors"
        >
          <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} />
          Tools
        </Link>
      </div>
      <PlaceDEXOrder />
    </div>
  );
}
