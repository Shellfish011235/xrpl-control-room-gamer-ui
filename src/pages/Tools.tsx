/**
 * Tools hub – consolidates Optimizer, NFT Arena, and Bridges into one nav entry.
 * Single tab bar; content from nested routes.
 */

import { NavLink, Outlet } from 'react-router-dom';
import { Zap, LayoutGrid, ArrowRightLeft, Sparkles, BarChart3, Wrench } from 'lucide-react';

const TABS = [
  { path: '/tools/ledger-impact', label: 'Ledger Impact', labelShort: 'Impact', icon: BarChart3 },
  { path: '/tools/optimizer', label: 'Optimizer', labelShort: 'Optim', icon: Zap },
  { path: '/tools/nfts', label: 'NFT Arena', labelShort: 'NFT', icon: LayoutGrid },
  { path: '/tools/bridges', label: 'Bridges', labelShort: 'Bridge', icon: ArrowRightLeft },
  { path: '/tools/agents', label: 'Agents', labelShort: 'Agents', icon: Sparkles },
  { path: '/tools/builder', label: 'Builder', labelShort: 'Build', icon: Wrench },
] as const;

export default function Tools() {
  return (
    <div className="min-h-screen pt-4 pb-8 px-4 lg:px-8">
      {/* Consolidated tab bar – Ledger Impact | Optimizer | NFT Arena | Bridges | Agents */}
      <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-cyber-border pb-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={false}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2.5 rounded-t-lg border border-b-0 font-cyber text-sm tracking-wider uppercase transition-colors ${
                  isActive
                    ? 'border-cyber-glow text-cyber-glow bg-cyber-glow/10 -mb-px'
                    : 'border-cyber-border text-cyber-muted hover:border-cyber-glow/50 hover:text-cyber-text'
                }`
              }
            >
              <Icon size={18} />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.labelShort}</span>
            </NavLink>
          );
        })}
      </div>

      <Outlet />
    </div>
  );
}
