/**
 * Tools hub – Ledger Impact, Control Room, DEX, Liquidity Nexus, Bridges, Agents.
 * Card strip + tab bar; content from nested routes.
 */

import { Link, NavLink, Outlet } from 'react-router-dom';
import { ArrowRightLeft, Sparkles, BarChart3, ArrowDownUp, LayoutDashboard, Zap } from 'lucide-react';

const TABS = [
  { path: '/tools/ledger-impact', label: 'Ledger Impact', labelShort: 'Impact', icon: BarChart3 },
  { path: '/tools/control-room', label: 'Control Room', labelShort: 'Control', icon: LayoutDashboard },
  { path: '/tools/dex-order', label: 'DEX Order', labelShort: 'DEX', icon: ArrowDownUp },
  { path: '/tools/optimizer', label: 'Liquidity Nexus', labelShort: 'Nexus', icon: Zap },
  { path: '/tools/bridges', label: 'Bridges', labelShort: 'Bridge', icon: ArrowRightLeft },
  { path: '/tools/agents', label: 'Agents', labelShort: 'Agents', icon: Sparkles },
] as const;

export default function Tools() {
  return (
    <div className="min-h-screen pt-4 pb-8 px-4 lg:px-8">
      <div className="mb-6">
        <p className="text-xs font-cyber uppercase tracking-widest text-cyber-muted mb-3">Tools</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:max-w-2xl">
          <Link
            to="/tools/optimizer"
            className="group block rounded-lg border border-cyber-border bg-cyber-dark/50 p-4 transition-colors hover:border-cyber-cyan/50 hover:bg-cyber-cyan/[0.06]"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-amber-500/40 bg-amber-500/10 text-amber-200 group-hover:border-cyber-cyan/40 group-hover:text-cyber-cyan">
                <Zap className="h-5 w-5" strokeWidth={2.25} />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <span className="inline-flex rounded border border-cyber-cyan/40 px-1.5 py-0.5 text-[9px] font-cyber uppercase tracking-wide text-cyber-cyan">
                  Simulation / Analysis
                </span>
                <h2 className="text-base font-cyber text-cyber-glow">Liquidity Nexus</h2>
                <p className="text-xs text-cyber-muted leading-relaxed">Path Optimizer · Cost · Speed · Risk</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Tab bar – matches nested routes under /tools */}
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
