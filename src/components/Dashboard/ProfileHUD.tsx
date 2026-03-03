import { Link } from 'react-router-dom';
import { Star, Trophy } from 'lucide-react';
import { useProfileStore } from '../../store/profileStore';
import { useDashboardStore } from '../../store/dashboardStore';

export function ProfileHUD() {
  const reputation = useProfileStore((s) => s.reputation);
  const skillPoints = useProfileStore((s) => s.skillPoints);
  const gamerMode = useDashboardStore((s) => s.gamerMode);

  if (!gamerMode) return null;

  return (
    <Link
      to="/"
      className="flex items-center gap-3 rounded-lg border border-cyber-purple/40 bg-cyber-purple/10 px-3 py-2 text-xs hover:border-cyber-purple/60 transition-colors"
    >
      <div className="flex items-center gap-2">
        <Star size={14} className="text-cyber-yellow" />
        <span className="text-cyber-text font-cyber">Profile</span>
      </div>
      <div className="flex items-center gap-2 text-cyber-muted">
        <Trophy size={12} />
        <span>{reputation}</span>
        <span>·</span>
        <span>{skillPoints} SP</span>
      </div>
    </Link>
  );
}
