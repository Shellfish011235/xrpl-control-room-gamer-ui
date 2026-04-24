import { Link } from 'react-router-dom';
import { useXrplEndpointStore } from '../store/xrplEndpointStore';
import { getEndpointPool, applyUserEndpointChoice, measureCurrentLatency, isRotationUnlocked, getSourceLabel } from '../services/xrplEndpointManager';
import { BoundaryNotice } from '../components/compliance/BoundaryNotice';
import { redactUrlLikeText } from '../lib/endpointDisplay';
import clsx from 'clsx';

export default function NodeSettingsPage() {
  const mode = useXrplEndpointStore((s) => s.mode);
  const manualIndex = useXrplEndpointStore((s) => s.manualIndex);
  const setToAuto = useXrplEndpointStore((s) => s.setToAuto);
  const setMode = useXrplEndpointStore((s) => s.setMode);
  const setManualIndex = useXrplEndpointStore((s) => s.setManualIndex);
  const locked = useXrplEndpointStore((s) => s.locked);
  const latency = useXrplEndpointStore((s) => s.latencyMs);
  const lastError = useXrplEndpointStore((s) => s.lastError);

  const pool = getEndpointPool();
  const currentLabel = getSourceLabel();

  return (
    <div className="min-h-screen px-4 lg:px-8 py-6 max-w-2xl mx-auto space-y-6 pb-16">
      <header>
        <p className="text-[9px] font-cyber text-cyber-glow/80">Settings</p>
        <h1 className="text-2xl font-cyber text-cyber-text">XRPL endpoint</h1>
        <p className="text-sm text-cyber-muted">Public cluster + fallback. Read-only JSON-RPC / WebSocket — no keys.</p>
      </header>

      <BoundaryNotice variant="compact" />

      {locked && (
        <div className="rounded-lg border border-cyber-yellow/40 bg-cyber-yellow/5 p-3 text-xs text-cyber-yellow font-cyber">
          Pool is <strong>locked</strong> (custom or proxy in env). To use automatic failover, clear private-only overrides or set public URLs, or remove
          VITE_XRPL_PRIVATE_MODE=1. See <code className="text-cyber-cyan">.env.example</code>.
        </div>
      )}

      <div className="space-y-3">
        <p className="text-[10px] text-cyber-muted leading-snug rounded border border-cyber-border/40 bg-cyber-darker/40 p-2">
          Endpoint <strong>addresses are not shown</strong> in this app. You choose a profile (auto / public defaults or
          a custom build-time profile only). <code className="text-cyber-cyan/80">VITE_</code> values live in your local{' '}
          <code className="text-cyber-cyan/80">.env</code> (gitignored) — never commit that file. A built site still embeds
          any <code className="text-cyber-cyan/80">VITE_</code> URL in JavaScript, so for a <strong>private</strong> node
          on the public internet use a <strong>server-side proxy</strong> instead of putting a LAN URL in the client.
        </p>
        <h2 className="text-sm font-cyber text-cyber-cyan">Selection</h2>
        {isRotationUnlocked() && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-cyber-muted w-20">Mode</span>
            <button
              type="button"
              onClick={() => {
                setToAuto();
                applyUserEndpointChoice();
                void measureCurrentLatency();
              }}
              className={clsx(
                'px-3 py-1.5 rounded text-xs font-cyber border',
                mode === 'auto' ? 'border-cyber-glow text-cyber-glow' : 'border-cyber-border text-cyber-muted'
              )}
            >
              Auto (failover)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('manual');
                setManualIndex(manualIndex);
                applyUserEndpointChoice();
                void measureCurrentLatency();
              }}
              className={clsx(
                'px-3 py-1.5 rounded text-xs font-cyber border',
                mode === 'manual' ? 'border-cyber-glow text-cyber-glow' : 'border-cyber-border text-cyber-muted'
              )}
            >
              Manual
            </button>
          </div>
        )}

        <div className="space-y-2">
          {pool.map((e, i) => (
            <button
              key={e.id}
              type="button"
              onClick={() => {
                setMode('manual');
                setManualIndex(i);
                applyUserEndpointChoice();
                void measureCurrentLatency();
              }}
              className={clsx(
                'w-full text-left flex flex-col gap-0.5 rounded border p-3',
                (mode === 'manual' && manualIndex === i) || (mode === 'auto' && e.displayName === currentLabel)
                  ? 'border-cyber-glow/60 bg-cyber-glow/5'
                  : 'border-cyber-border/50 hover:border-cyber-border',
                'cursor-pointer'
              )}
            >
              <div className="text-xs font-cyber text-cyber-text">
                {e.displayName}
                {e.displayName === currentLabel && <span className="ml-1 text-cyber-green/90">(active)</span>}
              </div>
            </button>
          ))}
        </div>
        <p className="text-[9px] text-cyber-muted/80">
          Active: {currentLabel} · {mode === 'auto' ? 'auto failover on RPC/WS errors' : 'manual (fixed)'}
        </p>
        <p className="text-[9px] text-cyber-muted/80">
          Last measure: {latency != null ? `${latency}ms` : '—'}{' '}
          {lastError ? `· ${redactUrlLikeText(lastError)}` : ''}
        </p>
        <button
          type="button"
          className="px-3 py-1.5 text-xs font-cyber border border-cyber-border text-cyber-cyan rounded hover:border-cyber-cyan/60"
          onClick={() => void measureCurrentLatency()}
        >
          Test latency now
        </button>
      </div>

      <p className="text-sm font-cyber">
        <Link to="/" className="text-cyber-cyan hover:underline">
          ← Home
        </Link>
        <span className="mx-2">·</span>
        <Link to="/system/flags" className="text-cyber-cyan hover:underline">
          Build / flags
        </Link>
      </p>
    </div>
  );
}
