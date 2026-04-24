/**
 * Non-interactive placeholder for planned Mission Control routes (v0.1).
 */

interface PlaceholderControlRoomPanelProps {
  title: string;
  description: string;
  status: string;
  bullets: string[];
}

export function PlaceholderControlRoomPanel({
  title,
  description,
  status,
  bullets,
}: PlaceholderControlRoomPanelProps) {
  return (
    <div className="neon-panel max-w-2xl space-y-4">
      <div>
        <h2 className="text-lg font-cyber text-[var(--cyber-cyan)]">{title}</h2>
        <p className="mt-2 text-sm text-cyber-muted leading-relaxed">{description}</p>
      </div>
      <div className="inline-flex items-center gap-2 rounded-lg border border-[var(--cyber-border)] bg-[var(--cyber-dark)]/50 px-3 py-1.5">
        <span className="text-[10px] uppercase tracking-wider text-cyber-muted">Status</span>
        <span className="text-xs font-mono text-cyber-glow">{status}</span>
      </div>
      {bullets.length > 0 && (
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-cyber-text/90">
          {bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
