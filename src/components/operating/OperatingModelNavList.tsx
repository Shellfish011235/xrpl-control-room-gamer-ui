import { NavLink, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import type { OperatingNavSection, NavItemStatus, OperatingNavItem } from '../../config/operatingNav';
import { OPERATING_NAV } from '../../config/operatingNav';

const statusClass = (s?: NavItemStatus) => {
  switch (s) {
    case 'live':
      return 'text-cyber-green border-cyber-green/30 bg-cyber-green/5';
    case 'simulation':
      return 'text-cyber-cyan border-cyber-cyan/30 bg-cyber-cyan/5';
    case 'read_only':
      return 'text-cyber-muted border-cyber-border';
    case 'coming_soon':
    case 'disabled':
      return 'text-cyber-muted/60 border-cyber-border/50 line-through';
    case 'approval_required':
      return 'text-cyber-yellow border-cyber-yellow/30 bg-cyber-yellow/5';
    default:
      return 'text-cyber-muted border-cyber-border';
  }
};

function statusLabel(s?: NavItemStatus): string {
  if (!s) return '';
  const map: Record<NavItemStatus, string> = {
    live: 'Live',
    simulation: 'Sim',
    read_only: 'Read',
    coming_soon: 'Soon',
    disabled: 'Off',
    approval_required: 'User',
  };
  return map[s] ?? s;
}

function isNavItemActive(itemTo: string, loc: { pathname: string; hash: string }): boolean {
  const [p, hashPart] = itemTo.split('#');
  const path = p || '/';
  const needHash = Boolean(hashPart);

  if (path === '/') {
    if (loc.pathname !== '/') return false;
    return needHash ? loc.hash === `#${hashPart}` : true;
  }
  if (path.startsWith('/tools') && !needHash) {
    return loc.pathname === path || loc.pathname.startsWith(path + '/');
  }
  if (loc.pathname !== path) return false;
  if (needHash) return (loc.hash || '') === `#${hashPart}`;
  return true;
}

function ItemRow({ item, onPick }: { item: OperatingNavItem; onPick?: () => void }) {
  const location = useLocation();

  if (item.disabled || !item.to) {
    return (
      <div
        className="group flex items-center gap-2 px-2 py-1.5 rounded-md text-cyber-muted/50 cursor-not-allowed"
        title={item.title}
      >
        <item.icon size={14} className="shrink-0 opacity-50" />
        <span className="text-[11px] font-cyber tracking-wide truncate flex-1">{item.label}</span>
        {item.status && <span className={clsx('text-[8px] font-cyber border px-1 py-0 rounded', statusClass(item.status))}>Off</span>}
      </div>
    );
  }

  const active = isNavItemActive(item.to, location);

  return (
    <NavLink
      to={item.to}
      onClick={onPick}
      title={item.title}
      className={({ isActive: navAct }) =>
        clsx(
          'group flex items-center gap-2 px-2 py-1.5 rounded-md border border-transparent transition-colors',
          (navAct || active) && 'bg-cyber-glow/10 border-cyber-glow/30 text-cyber-glow',
          !navAct && !active && 'text-cyber-muted hover:text-cyber-text hover:bg-cyber-border/20'
        )
      }
    >
      <item.icon size={14} className="shrink-0 opacity-80" />
      <span className="text-[11px] font-cyber tracking-wide truncate flex-1">{item.label}</span>
      {item.status && item.status !== 'live' && (
        <span className={clsx('text-[8px] font-cyber border px-1 py-0 rounded', statusClass(item.status))}>{statusLabel(item.status)}</span>
      )}
    </NavLink>
  );
}

export function OperatingModelNavList({ onNavigate, sections = OPERATING_NAV }: { onNavigate?: () => void; sections?: OperatingNavSection[] }) {
  return (
    <div className="space-y-5 pr-1">
      {sections.map((sec) => (
        <div key={sec.id}>
          <div className="text-[9px] font-cyber uppercase tracking-widest text-cyber-muted/90 mb-2 pl-0.5 border-l-2 border-cyber-glow/40 pl-1.5">{sec.label}</div>
          <div className="space-y-0.5">
            {sec.items.map((item) => (
              <ItemRow key={item.id} item={item} onPick={onNavigate} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
