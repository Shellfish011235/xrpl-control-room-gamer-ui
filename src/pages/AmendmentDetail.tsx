/**
 * Full-page amendment detail — used when opening the app from X in-app browser on iPhone
 * so we avoid the modal/overlay which often fails to render there.
 * When location.state is lost (e.g. in-app browser navigation), we load by URL param.
 */

import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { fetchAmendmentByName } from '../components/LedgerImpactTool';
import {
  Clock, Zap, User, X, ExternalLink, ChevronRight, Cpu, HardDrive, Wifi, DollarSign, MemoryStick, CheckCircle2, Timer, Github, Users, Info,
} from 'lucide-react';
import { useGovernanceStore } from '../store/governanceStore';
import { CountdownTimer } from '../components/LedgerImpactTool';

type Tier = 'A' | 'B' | 'C';
type PerformanceImpact = 'Low' | 'Medium' | 'High' | 'Unknown';
type AffectedArea = 'CPU' | 'Memory' | 'Disk IO' | 'Network' | 'Fee pressure';

interface AmendmentState {
  id: string;
  name: string;
  summary: string;
  tier: Tier;
  waitingDays: number;
  ledgerImpact: {
    estimatedImpact: PerformanceImpact;
    confidence: string;
    affectedAreas: AffectedArea[];
    rationale: string;
    evidenceLinks?: { label: string; url: string }[];
  };
  validatorSupport: { current: number; required: number };
  enabled?: boolean;
  status?: string;
  daysUntilEnabled?: number;
  hoursUntilEnabled?: number;
  minutesUntilEnabled?: number;
  secondsUntilEnabled?: number;
  activationDate?: Date;
  majorityDate?: string | null;
  enabledOn?: string | null;
  author?: string;
  github?: string;
  whoBenefits?: string;
  whoBenefitsCategories?: string[];
  whoBenefitsExamples?: string[];
  estimatedReviewMinutes?: number;
}

const tierStyles: Record<Tier, { bg: string; border: string; text: string }> = {
  A: { bg: 'rgba(34,197,94,0.2)', border: 'rgba(34,197,94,0.5)', text: '#22c55e' },
  B: { bg: 'rgba(234,179,8,0.2)', border: 'rgba(234,179,8,0.5)', text: '#eab308' },
  C: { bg: 'rgba(168,85,247,0.2)', border: 'rgba(168,85,247,0.5)', text: '#a855f7' },
};
const impactStyles: Record<PerformanceImpact, string> = {
  Low: '#22c55e',
  Medium: '#eab308',
  High: '#ef4444',
  Unknown: '#94a3b8',
};
const areaIcons: Record<AffectedArea, React.ReactNode> = {
  CPU: <Cpu size={12} />,
  Memory: <MemoryStick size={12} />,
  'Disk IO': <HardDrive size={12} />,
  Network: <Wifi size={12} />,
  'Fee pressure': <DollarSign size={12} />,
};

export default function AmendmentDetail() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { amendmentId } = useParams<{ amendmentId?: string }>();
  const [amendment, setAmendment] = useState<AmendmentState | null>((state as { amendment?: AmendmentState })?.amendment ?? null);
  const [loading, setLoading] = useState(!amendment && !!amendmentId);
  const [loadError, setLoadError] = useState(false);
  const { isReviewed, markReviewed, unmarkReviewed } = useGovernanceStore();

  // When state was lost (e.g. X in-app browser), load by URL param
  useEffect(() => {
    if (amendment) return;
    const name = amendmentId ? decodeURIComponent(amendmentId) : '';
    if (!name) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    fetchAmendmentByName(name)
      .then((a) => {
        if (!cancelled && a) setAmendment(a as AmendmentState);
        if (!cancelled && !a) setLoadError(true);
      })
      .catch(() => { if (!cancelled) setLoadError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [amendmentId, amendment]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 px-4 pb-8 flex items-center justify-center">
        <div className="text-cyber-muted text-sm">Loading amendment…</div>
      </div>
    );
  }

  if (!amendment) {
    return (
      <div className="min-h-screen pt-24 px-4 pb-8">
        <div className="max-w-lg mx-auto rounded-lg border border-cyber-border bg-cyber-darker p-6 text-center">
          <p className="text-cyber-text mb-4">
            {loadError
              ? 'Could not load this amendment. Open in Safari or Chrome and try again from the Impact list.'
              : 'Amendment details are available when you tap an amendment from the list.'}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/" className="px-4 py-2 rounded bg-cyber-glow/20 text-cyber-glow border border-cyber-glow/50 text-sm">
              Home
            </Link>
            <Link to="/terminal" className="px-4 py-2 rounded bg-cyber-glow/20 text-cyber-glow border border-cyber-glow/50 text-sm">
              Terminal → Impact
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const t = tierStyles[amendment.tier] ?? tierStyles.C;
  const impactColor = impactStyles[amendment.ledgerImpact.estimatedImpact as PerformanceImpact] ?? impactStyles.Unknown;

  return (
    <div className="min-h-screen pt-20 pb-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 py-2 rounded border border-cyber-border text-cyber-text hover:bg-cyber-darker text-sm"
          >
            <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} /> Back
          </button>
        </div>

        <div
          style={{
            backgroundColor: '#0f172a',
            border: '2px solid #334155',
            borderRadius: 8,
            color: '#e2e8f0',
            overflow: 'hidden',
          }}
        >
          <div style={{ borderBottom: '1px solid #334155', padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, backgroundColor: t.bg, color: t.text, border: `1px solid ${t.border}` }}>
                {amendment.tier}
              </span>
              <h1 style={{ margin: 0, fontSize: 18, color: '#00d4ff' }}>{amendment.name}</h1>
              {amendment.enabled && (
                <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, backgroundColor: 'rgba(34,197,94,0.2)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.5)' }}>✓</span>
              )}
            </div>
            {(amendment.author || amendment.github) && (
              <div style={{ marginTop: 8 }}>
                <p style={{ margin: 0, fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Proposal credit</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                  {amendment.author && (
                    <span style={{ fontSize: 12, color: '#a855f7', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <User size={12} /> {amendment.author}
                    </span>
                  )}
                  {amendment.github && (
                    <a href={amendment.github} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: '#c4b5fd', padding: '2px 8px', borderRadius: 4, backgroundColor: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.5)', display: 'inline-flex', alignItems: 'center', gap: 4 }} title="View proposal on GitHub (source)">
                      <Github size={10} /> View proposal on GitHub
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
            <p style={{ margin: 0, fontSize: 14, color: '#e2e8f0', lineHeight: 1.5 }}>{amendment.summary}</p>

            {amendment.status === 'majority' && (
              <div style={{ padding: 12, borderRadius: 8, backgroundColor: 'rgba(88,28,135,0.3)', border: '1px solid rgba(168,85,247,0.4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                  <Timer size={12} style={{ color: '#c4b5fd' }} />
                  <span style={{ fontSize: 11, color: '#c4b5fd', fontWeight: 600 }}>2-week activation countdown</span>
                </div>
                <CountdownTimer
                  majorityDate={amendment.majorityDate ?? null}
                  daysUntilEnabled={amendment.daysUntilEnabled}
                  hoursUntilEnabled={amendment.hoursUntilEnabled}
                  minutesUntilEnabled={amendment.minutesUntilEnabled}
                  secondsUntilEnabled={amendment.secondsUntilEnabled}
                  activationDate={amendment.activationDate}
                />
                {amendment.activationDate && (
                  <p style={{ margin: '8px 0 0', fontSize: 10, color: 'rgba(196,181,253,0.8)', textAlign: 'center' }}>
                    Activates: {new Date(amendment.activationDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            {amendment.status === 'enabled' && amendment.enabledOn && (
              <div style={{ padding: 8, borderRadius: 4, backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={12} style={{ color: '#22c55e' }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: '#22c55e' }}>ACTIVATED</span>
                <span style={{ color: '#22c55e', fontSize: 12 }}>{new Date(amendment.enabledOn).toLocaleDateString()}</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div style={{ padding: 8, borderRadius: 4, backgroundColor: 'rgba(15,23,42,0.8)', border: '1px solid #334155', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 10, color: '#94a3b8' }}>Waiting</p>
                <p style={{ margin: 0, fontSize: 14, color: '#e2e8f0', fontWeight: 600 }}>{amendment.waitingDays}d</p>
              </div>
              <div style={{ padding: 8, borderRadius: 4, backgroundColor: 'rgba(15,23,42,0.8)', border: '1px solid #334155', textAlign: 'center' }} title="Validators supporting (reviewing / voting)">
                <p style={{ margin: 0, fontSize: 10, color: '#94a3b8' }}>Validators</p>
                <p style={{ margin: 0, fontSize: 14, color: '#e2e8f0', fontWeight: 600 }}>{amendment.validatorSupport.current}/{amendment.validatorSupport.required}</p>
              </div>
              <div style={{ padding: 8, borderRadius: 4, backgroundColor: 'rgba(15,23,42,0.8)', border: '1px solid #334155', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 10, color: '#94a3b8' }}>Impact</p>
                <p style={{ margin: 0, fontSize: 14, color: impactColor, fontWeight: 600 }}>{amendment.ledgerImpact.estimatedImpact}</p>
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: 12, color: '#00ffff', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={12} /> IMPACT ANALYSIS
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {amendment.ledgerImpact.affectedAreas.map((area) => (
                  <span key={area} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 4, fontSize: 11, backgroundColor: 'rgba(168,85,247,0.2)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.3)' }}>
                    {areaIcons[area]}
                    {area}
                  </span>
                ))}
                <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 11, color: '#e2e8f0', backgroundColor: 'rgba(15,23,42,0.8)', border: '1px solid #334155' }}>
                  {amendment.ledgerImpact.confidence} confidence
                </span>
              </div>
              <div style={{ padding: 10, borderRadius: 4, backgroundColor: 'rgba(15,23,42,0.8)', border: '1px solid #334155' }}>
                <p style={{ margin: 0, fontSize: 12, color: '#e2e8f0', lineHeight: 1.5 }}>{amendment.ledgerImpact.rationale}</p>
              </div>
            </div>

            {/* Who this helps — always visible, same styling as modal (Governance Companion reference) */}
            <div style={{ padding: '12px 14px', borderRadius: 10, backgroundColor: '#1e3a5f', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={18} style={{ color: '#fff' }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Who this helps</span>
                </div>
                <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.08)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.15)' }}>informational</span>
              </div>
              {amendment.whoBenefitsCategories && amendment.whoBenefitsCategories.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {amendment.whoBenefitsCategories.map((cat, i) => (
                    <span key={i} style={{ padding: '5px 12px', borderRadius: 999, fontSize: 11, background: 'rgba(59, 130, 246, 0.35)', color: '#fff', border: '1px solid rgba(59, 130, 246, 0.4)' }}>{cat}</span>
                  ))}
                </div>
              )}
              {(amendment.whoBenefits && amendment.whoBenefits.trim()) ? (
                <p style={{ margin: 0, fontSize: 12, color: '#fff', lineHeight: 1.5 }}>{amendment.whoBenefits}</p>
              ) : (
                <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>No beneficiary summary for this amendment yet.</p>
              )}
              {amendment.whoBenefitsExamples && amendment.whoBenefitsExamples.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <span style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>Examples: </span>
                  {amendment.whoBenefitsExamples.map((ex, i) => (
                    <span key={i} style={{ display: 'inline-block', margin: '2px 6px 2px 0', padding: '4px 10px', borderRadius: 6, fontSize: 11, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}>{ex}</span>
                  ))}
                </div>
              )}
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Info size={12} /> Examples are illustrative, not endorsements.
                </p>
              </div>
            </div>
            {amendment.estimatedReviewMinutes != null && (
              <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Timer size={12} /> Est. review time: {amendment.estimatedReviewMinutes} min
              </p>
            )}

            <button
              type="button"
              onClick={() => (isReviewed(amendment.name) ? unmarkReviewed : markReviewed)(amendment.name)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 14px',
                borderRadius: 4, border: '1px solid #334155', fontSize: 12, backgroundColor: isReviewed(amendment.name) ? 'rgba(34,197,94,0.2)' : '#1e293b', color: isReviewed(amendment.name) ? '#22c55e' : '#e2e8f0',
              }}
            >
              {isReviewed(amendment.name) ? <CheckCircle2 size={14} /> : <Clock size={14} />}
              {isReviewed(amendment.name) ? 'Reviewed' : 'Mark as reviewed'}
            </button>

            {amendment.ledgerImpact.evidenceLinks && amendment.ledgerImpact.evidenceLinks.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ margin: 0, fontSize: 10, color: '#94a3b8' }}>Evidence &amp; References</p>
                {amendment.ledgerImpact.evidenceLinks.map((link, i) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, borderRadius: 4, backgroundColor: 'rgba(15,23,42,0.8)', border: '1px solid #334155', fontSize: 12, color: '#e2e8f0' }}>
                    <ExternalLink size={12} style={{ color: '#00d4ff' }} />
                    <span>{link.label}</span>
                    <ChevronRight size={12} style={{ marginLeft: 'auto', color: '#94a3b8' }} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
