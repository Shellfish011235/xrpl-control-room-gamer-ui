import { useEffect, useState } from 'react'
import { Radio } from 'lucide-react'
import {
  ILP_OPERATOR_STORAGE_KEYS,
  clearIlpOperatorStorageOverrides,
} from '../../config/ilpOperatorRealtimeConfig'
import { validateIlpHttpSnapshotInput, validateIlpWebSocketInput } from '../../lib/urlValidation'

type Props = {
  className?: string
}

/** Same-origin file in `public/` — works with no backend (GET returns JSON). */
function getBundledExampleSnapshotUrl(): string {
  const base = import.meta.env.BASE_URL || '/'
  const normalized = base.endsWith('/') ? base : `${base}/`
  return `${normalized}ilp-operator-snapshot.example.json`
}

export function IlpOperatorBridgeQuickConfig({ className = '' }: Props) {
  const [httpUrl, setHttpUrl] = useState('')
  const [wsUrl, setWsUrl] = useState('')
  const [urlError, setUrlError] = useState<string | null>(null)

  useEffect(() => {
    try {
      setHttpUrl(localStorage.getItem(ILP_OPERATOR_STORAGE_KEYS.httpSnapshotUrl) ?? '')
      setWsUrl(localStorage.getItem(ILP_OPERATOR_STORAGE_KEYS.wsUrl) ?? '')
    } catch {
      /* ignore */
    }
  }, [])

  const apply = () => {
    setUrlError(null)
    try {
      const h = httpUrl.trim()
      const w = wsUrl.trim()
      if (h) {
        const vh = validateIlpHttpSnapshotInput(h)
        if (vh.ok === false) {
          setUrlError(`HTTP snapshot: ${vh.reason}`)
          return
        }
        localStorage.setItem(ILP_OPERATOR_STORAGE_KEYS.httpSnapshotUrl, vh.normalized)
      } else {
        localStorage.removeItem(ILP_OPERATOR_STORAGE_KEYS.httpSnapshotUrl)
      }
      if (w) {
        const vw = validateIlpWebSocketInput(w)
        if (vw.ok === false) {
          setUrlError(`WebSocket: ${vw.reason}`)
          return
        }
        localStorage.setItem(ILP_OPERATOR_STORAGE_KEYS.wsUrl, vw.normalized)
      } else {
        localStorage.removeItem(ILP_OPERATOR_STORAGE_KEYS.wsUrl)
      }
      window.location.reload()
    } catch {
      setUrlError('Could not save URLs')
    }
  }

  const clearSaved = () => {
    clearIlpOperatorStorageOverrides()
    window.location.reload()
  }

  const useBundledHttpExample = () => {
    setHttpUrl(getBundledExampleSnapshotUrl())
    setWsUrl('')
  }

  return (
    <div
      className={
        'rounded-lg border border-cyber-cyan/25 bg-cyber-darker/40 p-2.5 space-y-2 ' + className
      }
    >
      <div className="flex items-center gap-2 text-[10px] font-cyber uppercase tracking-wider text-cyber-cyan">
        <Radio size={12} className="shrink-0" />
        Live operator feed (this browser)
      </div>
      <p className="text-[9px] text-cyber-muted leading-snug">
        Use full URLs or a same-origin path like <span className="text-cyber-text/90">/api/ilp-snapshot</span> (avoids CORS if
        your dev server proxies it). Quick link: add{' '}
        <span className="text-cyber-text/90 break-all">?ilpHttp=</span>
        <span className="text-cyber-cyan/90">YOUR_URL</span> to this page and reload once. Or set{' '}
        <span className="text-cyber-text/90">VITE_ILP_OPERATOR_*</span> in <span className="text-cyber-text/90">.env</span> and
        restart <span className="text-cyber-text/90">npm run dev</span>.
      </p>
      <details className="rounded border border-cyber-border/40 bg-cyber-darker/30 px-2 py-1.5 text-[9px] text-cyber-muted">
        <summary className="cursor-pointer font-cyber text-cyber-cyan/90 tracking-wide">
          Example URLs (no public registry)
        </summary>
        <ul className="mt-2 list-disc space-y-1 pl-4 leading-relaxed">
          <li>
            <span className="text-cyber-text/90">HTTP — bundled sample (easiest):</span>{' '}
            <code className="text-cyber-green/80">{getBundledExampleSnapshotUrl()}</code> — static file in{' '}
            <code className="text-cyber-text/80">public/</code>. Use the button below, then Save &amp; reload.
          </li>
          <li>
            <span className="text-cyber-text/90">HTTP — your service:</span> any GET that returns JSON with{' '}
            <code className="text-cyber-text/80">queue</code> and/or <code className="text-cyber-text/80">exposures</code> (see
            parser in <code className="text-cyber-text/80">ilpOperatorSnapshotParser.ts</code>).
          </li>
          <li>
            <span className="text-cyber-text/90">WebSocket:</span> must be <em>your</em> server (e.g.{' '}
            <code className="text-cyber-text/80">ws://127.0.0.1:8787/ilp</code> locally, <code className="text-cyber-text/80">wss://</code>{' '}
            in production). There is no global “ILP operator WebSocket directory” in this app.
          </li>
        </ul>
      </details>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={useBundledHttpExample}
          className="rounded-md border border-cyber-cyan/35 bg-cyber-cyan/10 px-2.5 py-1 text-[10px] font-cyber text-cyber-cyan hover:bg-cyber-cyan/20"
        >
          Fill bundled HTTP example
        </button>
      </div>
      <label className="block">
        <span className="text-[9px] text-cyber-muted">HTTP snapshot (GET JSON, polled)</span>
        <input
          type="text"
          value={httpUrl}
          onChange={(e) => setHttpUrl(e.target.value)}
          placeholder="https://host/… or /api/ilp-snapshot"
          className="mt-0.5 w-full rounded border border-cyber-border/60 bg-cyber-darker px-2 py-1.5 text-[10px] text-cyber-text placeholder:text-cyber-muted/50"
          autoComplete="off"
          spellCheck={false}
        />
      </label>
      <label className="block">
        <span className="text-[9px] text-cyber-muted">WebSocket (optional)</span>
        <input
          type="text"
          value={wsUrl}
          onChange={(e) => setWsUrl(e.target.value)}
          placeholder="wss://host/…"
          className="mt-0.5 w-full rounded border border-cyber-border/60 bg-cyber-darker px-2 py-1.5 text-[10px] text-cyber-text placeholder:text-cyber-muted/50"
          autoComplete="off"
          spellCheck={false}
        />
      </label>
      {urlError ? (
        <p className="text-[9px] text-red-400 border border-red-500/35 rounded px-2 py-1" role="alert">
          {urlError}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2 pt-0.5">
        <button
          type="button"
          onClick={apply}
          className="rounded-md border border-cyber-green/40 bg-cyber-green/15 px-2.5 py-1 text-[10px] font-cyber text-cyber-green hover:bg-cyber-green/25"
        >
          Save &amp; reload
        </button>
        <button
          type="button"
          onClick={clearSaved}
          className="rounded-md border border-cyber-border/60 px-2.5 py-1 text-[10px] text-cyber-muted hover:text-cyber-text hover:border-cyber-muted"
        >
          Clear saved URLs
        </button>
      </div>
    </div>
  )
}
