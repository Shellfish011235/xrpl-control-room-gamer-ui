/**
 * Single source of truth for operating-model sidebar. Routes must exist in App or be `disabled`.
 */
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Globe,
  Radio,
  Bell,
  LineChart,
  Map,
  Gavel,
  HeartPulse,
  MoveRight,
  BarChart2,
  Cpu,
  User,
  BookOpen,
  Network,
  Sparkles,
  Wrench,
  Sliders,
  GitCompare,
  CheckCircle2,
  Wallet,
  Inbox,
  Fingerprint,
  SlidersHorizontal,
  Scale,
} from 'lucide-react';

export type NavItemStatus = 'live' | 'simulation' | 'coming_soon' | 'read_only' | 'disabled' | 'approval_required';

export interface OperatingNavItem {
  id: string;
  label: string;
  to?: string;
  status?: NavItemStatus;
  /** If no route yet */
  disabled?: boolean;
  title?: string;
  icon: LucideIcon;
}

export interface OperatingNavSection {
  id: string;
  label: string;
  layer: 'control' | 'observe' | 'interpret' | 'decide' | 'act' | 'system';
  items: OperatingNavItem[];
}

export const OPERATING_NAV: OperatingNavSection[] = [
  {
    id: 'control',
    label: 'Control room',
    layer: 'control',
    items: [
      { id: 'cr_home', label: 'Home', to: '/tools/control-room', status: 'live', icon: LayoutDashboard },
      { id: 'cr_net', label: 'Network overview', to: '/network', status: 'live', icon: Globe },
      { id: 'cr_live', label: 'Live activity', to: '/memetic-lab', status: 'live', icon: Radio, title: 'Activity stream / trending' },
      { id: 'cr_alerts', label: 'Alerts', status: 'coming_soon', disabled: true, icon: Bell, title: 'Planned' },
    ],
  },
  {
    id: 'observe',
    label: 'Observe',
    layer: 'observe',
    items: [
      { id: 'ob_val', label: 'Validators & health', to: '/intelligence#health', status: 'live', icon: HeartPulse, title: 'Intelligence + validators' },
      { id: 'ob_cor', label: 'Corridors & paths', to: '/network', status: 'live', icon: Map },
      { id: 'ob_gov', label: 'Amendments', to: '/governance-guide', status: 'read_only', icon: Gavel },
      { id: 'ob_ledger', label: 'Ledger impact', to: '/tools/ledger-impact', status: 'live', icon: LineChart },
      { id: 'ob_wha', label: 'Whale & flow', to: '/intelligence#flow', status: 'live', icon: BarChart2 },
      { id: 'ob_node', label: 'Node telemetry', to: '/network', status: 'live', icon: Network },
    ],
  },
  {
    id: 'interpret',
    label: 'Interpret',
    layer: 'interpret',
    items: [
      { id: 'in_sum', label: 'AI & summaries', to: '/intelligence#ai', status: 'read_only', icon: Cpu, title: 'Heuristics, not investment advice' },
      { id: 'in_find', label: 'Agent findings', to: '/tools/agents', status: 'read_only', icon: Sparkles },
      { id: 'in_pat', label: 'Patterns', to: '/intelligence#patterns', status: 'read_only', icon: GitCompare },
      { id: 'in_ex', label: 'Explainers', to: '/learn', status: 'read_only', icon: BookOpen },
    ],
  },
  {
    id: 'decide',
    label: 'Decide',
    layer: 'decide',
    items: [
      { id: 'de_sim', label: 'Simulations', to: '/tools/optimizer', status: 'simulation', icon: Wrench, title: 'Scenarios, not live execution' },
      { id: 'de_dex', label: 'Route / DEX preview', to: '/tools/dex-order', status: 'simulation', icon: MoveRight },
      { id: 'de_policy', label: 'Policy & checks', to: '/system', status: 'read_only', icon: Sliders, title: 'Handbook' },
      { id: 'de_risk', label: 'Risk review', to: '/intelligence#risk', status: 'read_only', icon: Scale },
    ],
  },
  {
    id: 'act',
    label: 'Act',
    layer: 'act',
    items: [
      { id: 'ac_q', label: 'Approval queue', status: 'disabled', disabled: true, icon: Inbox, title: 'Not available — no background signing' },
      { id: 'ac_wallet', label: 'Wallet review', to: '/wallet', status: 'approval_required', icon: Wallet, title: 'User-controlled, Xaman' },
      { id: 'ac_center', label: 'Action center', to: '/pay', status: 'approval_required', icon: CheckCircle2, title: 'User-initiated flows' },
    ],
  },
  {
    id: 'system',
    label: 'System',
    layer: 'system',
    items: [
      { id: 'sy_pro', label: 'Provenance', to: '/system', status: 'read_only', icon: Fingerprint },
      { id: 'sy_mode', label: 'Modes (UI)', to: '/system#modes', status: 'read_only', icon: SlidersHorizontal, title: 'Use sidebar mode toggle' },
      { id: 'sy_set', label: 'Profile & wallet', to: '/', status: 'live', icon: User, title: 'User profile' },
      { id: 'sy_xrpl', label: 'XRPL endpoint', to: '/settings/node', status: 'read_only', icon: Network, title: 'Node & RPC / WS' },
      { id: 'sy_flag', label: 'Feature & policy', to: '/system/flags', status: 'read_only', icon: Sparkles },
      { id: 'sy_comp', label: 'Compliance & boundaries', to: '/system#boundaries', status: 'read_only', icon: Scale },
    ],
  },
];
