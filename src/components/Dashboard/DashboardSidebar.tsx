import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  BarChart3,
  Wallet,
  Terminal,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Globe,
  Zap,
} from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';
import clsx from 'clsx';

const navSections: { path: string; label: string; icon: React.ElementType; section: string }[] = [
  { path: '/dashboard', label: 'Overview', icon: LayoutDashboard, section: 'overview' },
  { path: '/network', label: 'Analyzer / Network', icon: BarChart3, section: 'analyzer' },
  { path: '/', label: 'Portfolio / Profile', icon: Wallet, section: 'portfolio' },
  { path: '/terminal', label: 'Terminal / Strategies', icon: Terminal, section: 'terminal' },
  { path: '/', label: 'Profile / Gamification', icon: User, section: 'profile' },
  { path: '/underworld', label: 'Community / Events', icon: Calendar, section: 'community' },
];

const externalLinks = [
  { href: 'https://livenet.xrpl.org', label: 'Explorer', icon: Globe },
  { href: 'https://xrpl.org', label: 'Docs', icon: Zap },
];

export function DashboardSidebar() {
  const location = useLocation();
  const collapsed = useDashboardStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useDashboardStore((s) => s.toggleSidebar);
  const setActiveSection = useDashboardStore((s) => s.setActiveSection);
  const gamerMode = useDashboardStore((s) => s.gamerMode);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 56 : 220 }}
      className={clsx(
        'flex flex-col border-r border-cyber-border bg-cyber-darker/95 shrink-0 overflow-hidden',
        gamerMode && 'border-cyber-purple/30'
      )}
    >
      <div className="flex flex-col h-full py-3">
        <div className="flex items-center justify-between px-3 mb-4">
          {!collapsed && (
            <span className="text-[10px] font-cyber uppercase tracking-wider text-cyber-muted">
              Control Room
            </span>
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1.5 rounded hover:bg-cyber-border/50 text-cyber-muted hover:text-cyber-text transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 px-2">
          {navSections.map(({ path, label, icon: Icon, section }) => {
            const isActive = location.pathname === path || location.pathname.startsWith(path + '/');
            return (
              <Link
                key={path + section}
                to={path}
                onClick={() => setActiveSection(section)}
                className={clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  collapsed ? 'justify-center px-2' : '',
                  isActive
                    ? 'bg-cyber-glow/10 text-cyber-glow border border-cyber-glow/30'
                    : 'text-cyber-muted hover:bg-cyber-border/30 hover:text-cyber-text'
                )}
                title={label}
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="mt-auto pt-4 px-2 border-t border-cyber-border space-y-0.5">
            {externalLinks.map(({ href, label, icon: Icon }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-cyber-muted hover:bg-cyber-border/30 hover:text-cyber-cyan transition-colors"
              >
                <Icon size={14} />
                <span>{label}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </motion.aside>
  );
}
