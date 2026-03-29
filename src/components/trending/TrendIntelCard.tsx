import { useState } from 'react';
import { ChevronDown, ChevronUp, Flame } from 'lucide-react';
import type { AttackType, TrendCard } from '../../lib/trending/types';

const ATTACK_LABELS: Record<AttackType, string> = {
  perception_shaping: 'Perception shaping',
  emotional_activation: 'Emotional activation',
  polarization: 'Polarization',
  confusion_flooding: 'Confusion flooding',
  narrative_hijack: 'Narrative hijack',
};

function momentumClass(m: TrendCard['momentum']): string {
  if (m === 'high') return 'text-cyber-orange';
  if (m === 'medium') return 'text-cyber-yellow';
  return 'text-cyber-muted';
}

function riskPill(r: TrendCard['decisionRisk']): string {
  if (r === 'high') return 'text-cyber-red border-cyber-red/40 bg-cyber-red/10';
  if (r === 'medium') return 'text-cyber-yellow border-cyber-yellow/40 bg-cyber-yellow/10';
  return 'text-cyber-green border-cyber-green/40 bg-cyber-green/10';
}

function qualityLabel(q: TrendCard['signalQuality']): string {
  return q.toUpperCase();
}

function categoryStripe(category: TrendCard['category']): string {
  if (category === 'infra') return 'from-cyber-cyan/30 to-transparent';
  if (category === 'narrative') return 'from-cyber-purple/30 to-transparent';
  return 'from-cyber-glow/30 to-transparent';
}

export default function TrendIntelCard({ card }: { card: TrendCard }) {
  const [openProof, setOpenProof] = useState(false);

  return (
    <article className="cyber-panel overflow-hidden border border-cyber-border/80 relative">
      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${categoryStripe(card.category)}`} aria-hidden />
      <div className="p-4 pl-5">
        <header className="flex flex-wrap items-start gap-2 mb-3">
          <Flame size={18} className="text-cyber-orange shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="font-cyber text-xs text-cyber-orange tracking-wider">TRENDING</p>
            <h3 className="font-cyber text-base text-cyber-text tracking-wide leading-snug">{card.topic}</h3>
            <p className="text-[10px] text-cyber-muted mt-1 uppercase">
              {card.category} · score {card.trendScore}{' '}
              <span className={momentumClass(card.momentum)}>· momentum {card.momentum}</span>
            </p>
          </div>
        </header>

        <div className="border-t border-cyber-border/60 my-3" />

        <section className="space-y-2 text-xs">
          <p className="text-[10px] font-cyber text-cyber-muted tracking-wider">COGNITIVE LAYER</p>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-cyber-text">Cognitive load</span>
            <span className="font-cyber text-cyber-cyan">{card.cognitiveLoad}</span>
            <span
              className={`ml-auto px-2 py-0.5 rounded border text-[10px] font-cyber uppercase ${riskPill(card.decisionRisk)}`}
            >
              Decision risk {card.decisionRisk}
            </span>
          </div>
          <div>
            <p className="text-cyber-muted text-[10px] mb-1">Attack types</p>
            <ul className="list-disc list-inside text-cyber-text space-y-0.5">
              {card.attackTypes.map((t) => (
                <li key={t}>{ATTACK_LABELS[t]}</li>
              ))}
            </ul>
          </div>
          <p className="text-[10px]">
            <span className="text-cyber-muted">Signal quality </span>
            <span className="font-cyber text-cyber-purple">{qualityLabel(card.signalQuality)}</span>
          </p>
        </section>

        <div className="border-t border-cyber-border/60 my-3" />

        <section className="space-y-2 text-xs">
          <p className="text-[10px] font-cyber text-cyber-muted tracking-wider">NARRATIVE (COGINT)</p>
          <div className="flex flex-wrap gap-4">
            <span>
              <span className="text-cyber-muted">Narrative risk </span>
              <span className="font-cyber text-cyber-text">{card.narrativeRisk}</span>
            </span>
            <span>
              <span className="text-cyber-muted">Coordination </span>
              <span className="font-cyber text-cyber-text">{card.coordinationScore}</span>
            </span>
          </div>
          <div>
            <p className="text-cyber-muted text-[10px] mb-1">Dominant frames</p>
            <ul className="list-disc list-inside text-cyber-text space-y-0.5">
              {card.dominantFrames.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        </section>

        {(card.strategicImpact || card.capitalFlow || card.timeline) && (
          <>
            <div className="border-t border-cyber-border/60 my-3" />
            <section className="space-y-1 text-xs">
              <p className="text-[10px] font-cyber text-cyber-muted tracking-wider">INFRASTRUCTURE</p>
              {card.strategicImpact && (
                <p>
                  <span className="text-cyber-muted">Impact </span>
                  <span className="font-cyber text-cyber-cyan uppercase">{card.strategicImpact}</span>
                </p>
              )}
              {card.capitalFlow && (
                <p>
                  <span className="text-cyber-muted">Capital flow </span>
                  <span className="text-cyber-text">{card.capitalFlow}</span>
                </p>
              )}
              {card.timeline && (
                <p>
                  <span className="text-cyber-muted">Timeline </span>
                  <span className="text-cyber-text">{card.timeline}</span>
                </p>
              )}
            </section>
          </>
        )}

        <div className="border-t border-cyber-border/60 my-3" />

        <section className="space-y-1 text-xs">
          <p className="text-[10px] font-cyber text-cyber-muted tracking-wider">XRPL RELEVANCE</p>
          <ul className="list-disc list-inside text-cyber-text space-y-1">
            <li>Liquidity: {card.xrplRelevance.liquidity}</li>
            <li>Payments: {card.xrplRelevance.payments}</li>
            <li>Agents: {card.xrplRelevance.agents}</li>
          </ul>
        </section>

        <div className="border-t border-cyber-border/60 my-3" />

        <section className="text-xs">
          <p className="text-[10px] font-cyber text-cyber-muted tracking-wider mb-1">WHY THIS MATTERS</p>
          <p className="text-cyber-text leading-relaxed">{card.whyItMatters}</p>
        </section>

        <button
          type="button"
          onClick={() => setOpenProof((o) => !o)}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded border border-cyber-border/80 text-[10px] font-cyber tracking-wider text-cyber-muted hover:text-cyber-cyan hover:border-cyber-cyan/40 transition-colors"
        >
          {openProof ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {openProof ? 'Collapse proof panel' : 'Expand proof panel'}
        </button>

        {openProof && (
          <div className="mt-3 p-3 rounded bg-cyber-darker/60 border border-cyber-border/50 text-xs space-y-2">
            <p className="text-[10px] font-cyber text-cyber-cyan">EVIDENCE</p>
            <ul className="list-disc list-inside text-cyber-text space-y-1">
              {card.proofPanel.evidence.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
            <p className="text-[10px] font-cyber text-cyber-muted">SOURCES</p>
            <ul className="list-disc list-inside text-cyber-muted space-y-0.5">
              {card.proofPanel.sources.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3 pt-1 text-[10px]">
              <span className="text-cyber-muted">
                Confidence <span className="font-cyber text-cyber-text">{(card.proofPanel.confidence * 100).toFixed(0)}%</span>
              </span>
              <span className="text-cyber-muted">
                Updated <span className="text-cyber-text">{new Date(card.proofPanel.lastUpdated).toLocaleString()}</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
