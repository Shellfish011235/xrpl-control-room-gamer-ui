/**
 * Control Room sidebar: Home, Wallet, Trade, Offers, Agents, Settings.
 * Collapsible on mobile; one section visible at a time.
 */

import { Home, Wallet, ArrowLeftRight, List, Bot, Settings, Zap, Brain } from 'lucide-react';

export type ControlRoomSection =
  | 'home'
  | 'wallet'
  | 'trade'
  | 'offers'
  | 'agents'
  | 'ilp'
  | 'analytics'
  | 'settings';

const NAV: { id: ControlRoomSection; label: string; icon: React.ReactNode }[] = [
  { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
  { id: 'wallet', label: 'Wallet', icon: <Wallet className="w-5 h-5" /> },
  { id: 'trade', label: 'Trade', icon: <ArrowLeftRight className="w-5 h-5" /> },
  { id: 'offers', label: 'Offers', icon: <List className="w-5 h-5" /> },
  { id: 'agents', label: 'Agents', icon: <Bot className="w-5 h-5" /> },
  { id: 'ilp', label: 'ILP / Open Payments', icon: <Zap className="w-5 h-5" /> },
  { id: 'analytics', label: 'Hidden Analytics', icon: <Brain className="w-5 h-5" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
];

interface ControlRoomSidebarProps {
  section: ControlRoomSection;
  onSectionChange: (s: ControlRoomSection) => void;
  collapsed?: boolean;
}

export default function ControlRoomSidebar({
  section,
  onSectionChange,
  collapsed = false,
}: ControlRoomSidebarProps) {
  return (
    <aside
      className={`border-r border-[var(--cyber-border)] bg-[var(--cyber-darker)]/80 flex flex-col ${
        collapsed ? 'w-14' : 'w-48'
      } shrink-0 transition-all duration-300`}
    >
      <nav className="p-2 space-y-0.5">
        {NAV.map(({ id, label, icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSectionChange(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
              section === id
                ? 'bg-[var(--cyber-cyan)]/15 text-[var(--cyber-cyan)] border border-[var(--cyber-border)]'
                : 'text-cyber-muted hover:text-cyber-text hover:bg-white/5'
            }`}
          >
            <span className="shrink-0">{icon}</span>
            {!collapsed && <span>{label}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
}
