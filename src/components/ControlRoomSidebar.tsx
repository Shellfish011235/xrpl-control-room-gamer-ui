/**
 * Control Room sidebar — Mission Control v0.1 navigation (10 sections; wallet/trade/offers are legacy sub-routes from home).
 */

import type { ReactNode } from 'react';
import {
  LayoutDashboard,
  Bot,
  LineChart,
  Shield,
  FileCheck,
  ShieldAlert,
  Scale,
  Zap,
  Brain,
  Settings,
} from 'lucide-react';

const NAV_ONLY = [
  'mission',
  'agent_fleet',
  'private_quant',
  'policy_firewall',
  'task_receipts',
  'security_ops',
  'compliance_guard',
  'payment_rails',
  'ledger_intel',
  'settings',
] as const;

export type ControlRoomNavId = (typeof NAV_ONLY)[number];
/** Programmatic routes from home quick actions are not in the main nav. */
export type ControlRoomSection = ControlRoomNavId | 'wallet' | 'trade' | 'offers';

export function controlRoomSidebarHighlight(section: ControlRoomSection): ControlRoomNavId {
  if (section === 'wallet' || section === 'trade' || section === 'offers') {
    return 'mission';
  }
  return section;
}

const NAV: { id: ControlRoomNavId; label: string; icon: ReactNode }[] = [
  { id: 'mission', label: 'Mission Control', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'agent_fleet', label: 'Agent Fleet', icon: <Bot className="w-5 h-5" /> },
  { id: 'private_quant', label: 'Private Quant Lab', icon: <LineChart className="w-5 h-5" /> },
  { id: 'policy_firewall', label: 'Policy Firewall', icon: <Shield className="w-5 h-5" /> },
  { id: 'task_receipts', label: 'Task Receipts', icon: <FileCheck className="w-5 h-5" /> },
  { id: 'security_ops', label: 'Security Ops', icon: <ShieldAlert className="w-5 h-5" /> },
  { id: 'compliance_guard', label: 'Compliance Guard', icon: <Scale className="w-5 h-5" /> },
  { id: 'payment_rails', label: 'Payment Rails', icon: <Zap className="w-5 h-5" /> },
  { id: 'ledger_intel', label: 'Ledger Intel', icon: <Brain className="w-5 h-5" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
];

interface ControlRoomSidebarProps {
  section: ControlRoomSection;
  onSectionChange: (s: ControlRoomSection) => void;
  collapsed?: boolean;
}

export default function ControlRoomSidebar({ section, onSectionChange, collapsed = false }: ControlRoomSidebarProps) {
  const active = controlRoomSidebarHighlight(section);

  return (
    <aside
      className={`border-r border-[var(--cyber-border)] bg-[var(--cyber-darker)]/80 flex flex-col ${
        collapsed ? 'w-14' : 'w-56 min-w-[14rem]'
      } shrink-0 transition-all duration-300`}
    >
      <nav className="p-2 space-y-0.5 overflow-y-auto max-h-[calc(100vh-7rem)]">
        {NAV.map(({ id, label, icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSectionChange(id)}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-left text-xs transition-all ${
              active === id
                ? 'bg-[var(--cyber-cyan)]/15 text-[var(--cyber-cyan)] border border-[var(--cyber-border)]'
                : 'text-cyber-muted hover:text-cyber-text hover:bg-white/5'
            }`}
            title={collapsed ? label : undefined}
          >
            <span className="shrink-0">{icon}</span>
            {!collapsed && <span className="leading-tight">{label}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
}
