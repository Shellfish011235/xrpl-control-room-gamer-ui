import { useMemo, useState } from 'react';
import { GitBranch, Layers, Network, Scale, Flame, Cpu } from 'lucide-react';
import type { IntelViewTab } from '../../lib/trending/types';
import { filterAndSortTrendCards, TREND_CARD_SEED } from '../../lib/trending/trendCards';
import TrendIntelCard from './TrendIntelCard';
import CognitiveMapMini from './CognitiveMapMini';
import XRPLLiveNetworkFeed from './XRPLLiveNetworkFeed';

const INTEL_TABS: { id: IntelViewTab; label: string; icon: typeof Flame }[] = [
  { id: 'whats_trending', label: "What's trending", icon: Flame },
  { id: 'narrative_pressure', label: 'Narrative pressure', icon: Network },
  { id: 'coordination_signals', label: 'Coordination signals', icon: Layers },
  { id: 'decision_impact', label: 'Decision impact', icon: Scale },
  { id: 'infra_signals', label: 'Infra signals', icon: Cpu },
];

export default function TrendingIntelligenceDeck() {
  const [intelTab, setIntelTab] = useState<IntelViewTab>('whats_trending');
  const [showMap, setShowMap] = useState(false);

  const visible = useMemo(() => filterAndSortTrendCards(intelTab), [intelTab]);

  return (
    <div className="space-y-4">
      <div className="cyber-panel p-4 border-cyber-orange/20 bg-cyber-orange/[0.03]">
        <p className="text-sm text-slate-200 leading-relaxed">
          This deck tracks what is shaping <span className="text-cyan-300 font-medium">perception</span>,{' '}
          <span className="text-amber-300 font-medium">capital flow</span>, and{' '}
          <span className="text-fuchsia-300 font-medium">decision-making</span> — not a headline popularity list.
        </p>
        <p className="text-[10px] text-cyber-muted mt-2">
          Scores are heuristic. Every card carries a proof panel with confidence. No evidence → no strong claim; connect RAG for live corpora.
        </p>
        <p className="text-[10px] text-cyan-500/90 mt-2">
          Below: live ledger closes and validated transactions from your configured XRPL WebSocket (same transport as XRPL Intelligence).
        </p>
      </div>

      <XRPLLiveNetworkFeed />

      <div className="cyber-panel p-2 sm:p-3">
        <div className="flex flex-wrap items-stretch gap-2">
          <div
            className="flex flex-wrap gap-2 flex-1 min-w-[min(100%,280px)]"
            role="tablist"
            aria-label="Trending intelligence views"
          >
            {INTEL_TABS.map(({ id, label, icon: Icon }) => {
              const active = intelTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setIntelTab(id)}
                  className={`min-h-[40px] flex items-center gap-2 px-3 py-2 rounded-md font-cyber text-[10px] sm:text-xs tracking-wider transition-all cursor-pointer border ${
                    active
                      ? 'bg-amber-600 border-amber-200 text-white shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                      : 'border-slate-600/80 bg-slate-900/60 text-slate-300 hover:text-white hover:border-cyan-400/50 hover:bg-slate-800'
                  }`}
                >
                  <Icon size={14} className={active ? 'text-white' : 'text-cyan-400/90 shrink-0'} aria-hidden />
                  {label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            aria-pressed={showMap}
            aria-label={showMap ? 'Hide cognitive map' : 'Show cognitive map'}
            onClick={() => setShowMap((s) => !s)}
            className={`min-h-[40px] flex items-center gap-2 px-3 py-2 rounded-md font-cyber text-[10px] sm:text-xs tracking-wider transition-all cursor-pointer border shrink-0 ${
              showMap
                ? 'bg-violet-600 border-violet-200 text-white shadow-[0_0_10px_rgba(139,92,246,0.3)]'
                : 'border-slate-600/80 bg-slate-900/60 text-slate-300 hover:text-white hover:border-violet-400/50 hover:bg-slate-800'
            }`}
          >
            <GitBranch size={14} className={showMap ? 'text-white' : 'text-violet-400 shrink-0'} aria-hidden />
            Cognitive map
          </button>
          <span className="min-h-[40px] flex items-center px-2 text-[10px] text-slate-500" aria-live="polite">
            {visible.length} signals
          </span>
        </div>
      </div>

      {showMap && (
        <CognitiveMapMini cards={visible.length ? visible : TREND_CARD_SEED} />
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {visible.map((card) => (
          <TrendIntelCard key={card.id} card={card} />
        ))}
      </div>

      {intelTab === 'infra_signals' && visible.length === 0 && (
        <p className="text-sm text-cyber-muted text-center py-8">No infra cards in seed deck — add corpus tags or lower filters.</p>
      )}
    </div>
  );
}
