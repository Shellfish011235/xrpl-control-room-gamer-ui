import type { TrendCard } from '../../lib/trending/types';

/** Compact narrative-influence sketch: nodes = themes, edges = inferred coupling (illustrative). */
export default function CognitiveMapMini({ cards }: { cards: TrendCard[] }) {
  const nodes = cards.slice(0, 6).map((c, i) => {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const r = 78;
    return {
      id: c.id,
      label: c.topic.length > 28 ? `${c.topic.slice(0, 26)}…` : c.topic,
      x: 110 + r * Math.cos(angle),
      y: 110 + r * Math.sin(angle),
      risk: c.narrativeRisk,
    };
  });

  const edges: { from: number; to: number; strength: number }[] = [];
  for (let i = 0; i < nodes.length; i++) {
    edges.push({ from: i, to: (i + 1) % nodes.length, strength: 0.4 });
    edges.push({ from: i, to: (i + 2) % nodes.length, strength: 0.25 });
  }

  return (
    <div className="cyber-panel p-4 border-cyber-purple/25">
      <p className="font-cyber text-[10px] text-cyber-purple tracking-wider mb-2">COGNITIVE MAP (ILLUSTRATIVE)</p>
      <p className="text-[10px] text-cyber-muted mb-3">
        Nodes are narrative clusters from the active deck; edge weight is a visual proxy for co-activation, not a measured causal graph.
      </p>
      <svg viewBox="0 0 220 220" className="w-full max-h-64 text-cyber-purple" aria-label="Cognitive map preview">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {edges.map((e, idx) => {
          const a = nodes[e.from];
          const b = nodes[e.to];
          if (!a || !b) return null;
          const opacity = 0.15 + e.strength * 0.5;
          return (
            <line
              key={`${e.from}-${e.to}-${idx}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="currentColor"
              strokeWidth={1}
              opacity={opacity}
            />
          );
        })}
        {nodes.map((n) => {
          const heat = Math.min(1, n.risk / 100);
          const fill = heat > 0.65 ? '#f87171' : heat > 0.4 ? '#fbbf24' : '#22d3ee';
          return (
            <g key={n.id} filter="url(#glow)">
              <circle cx={n.x} cy={n.y} r={10} fill={fill} opacity={0.35} />
              <circle cx={n.x} cy={n.y} r={5} fill={fill} />
              <text
                x={n.x}
                y={n.y - 14}
                textAnchor="middle"
                className="fill-cyber-muted"
                style={{ fontSize: '7px' }}
              >
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
