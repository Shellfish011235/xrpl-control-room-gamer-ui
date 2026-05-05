/**
 * OpenClaw Builder Agent Panel – OODA workflow inside the dashboard.
 * Modes: UI Triage, XRPL Data Wiring, Module Factory, and Sign in Xaman (send XRP via user-approved payload).
 */

import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { isValidClassicAddress, xrpToDrops, convertStringToHex } from 'xrpl';
import { getDefaultOrchestrator } from '../agents/Orchestrator';
import type { AgentType, XamanSendDraft } from '../agents/Orchestrator';
import { getXRPLClient, getNetwork } from '../services/xrplClient';
import { xamanService } from '../services/xaman';
import type { SigningRequest } from '../services/xaman';
import { useWalletStore } from '../store/walletStore';
import { useXrplAddressBookSorted } from '../store/xrplAddressBookStore';

export type BuilderAgentMode = 'ui-triage' | 'xrpl-wiring' | 'module-factory' | 'xaman-send';

const MODE_TO_AGENT_TYPE: Record<BuilderAgentMode, AgentType> = {
  'ui-triage': 'ui-enhance',
  'xrpl-wiring': 'ledger',
  'module-factory': 'ui-enhance',
  'xaman-send': 'ledger',
};

export interface BuilderAgentPanelProps {
  account?: string;
  currentRoute?: string;
  selectedModuleId?: string;
  onApplyUiUpdate?: (uiUpdates: Record<string, unknown>) => void;
}

/** Parse natural-language send intent; deterministic, no AI. */
function parseNaturalPayment(text: string): XamanSendDraft | null {
  const raw = text.trim();
  if (!raw) return null;

  const tagMatch = raw.match(/\b(?:dt|tag|dest(?:ination)?\s*tag)\s*[:#]?\s*(\d{1,10})\b/i);
  const destinationTag = tagMatch ? parseInt(tagMatch[1], 10) : undefined;
  const memoMatch = raw.match(/\bmemo\s*[:]\s*(.+)$/i) ?? raw.match(/\bmemo\s+(.+)$/i);
  const memo = memoMatch?.[1]?.trim().slice(0, 500);
  const body = memoMatch ? raw.slice(0, memoMatch.index).trim() : raw;

  const reForward = /\b(?:send|pay)\s+([\d][\d,\s]*\.?[\d]*)\s*xrp\s+to\s+(r[1-9A-HJ-NP-Za-km-z]{24,34})\b/i;
  const reForwardShort = /\b(?:send|pay)\s+([\d][\d,\s]*\.?[\d]*)\s+to\s+(r[1-9A-HJ-NP-Za-km-z]{24,34})\b/i;
  const reReverse = /\b(?:send|pay)\s+(r[1-9A-HJ-NP-Za-km-z]{24,34})\s+([\d][\d,\s]*\.?[\d]*)\s*xrp\b/i;

  let m = body.match(reForward) || body.match(reForwardShort);
  let amountStr: string;
  let dest: string;
  if (m) {
    amountStr = m[1].replace(/[\s,]/g, '');
    dest = m[2];
  } else {
    const m2 = body.match(reReverse);
    if (!m2) return null;
    dest = m2[1];
    amountStr = m2[2].replace(/[\s,]/g, '');
  }

  if (!isValidClassicAddress(dest)) return null;
  const n = parseFloat(amountStr);
  if (!Number.isFinite(n) || n <= 0) return null;

  const draft: XamanSendDraft = {
    destination: dest,
    amountXrp: String(n),
    ...(memo ? { memo } : {}),
    ...(destinationTag !== undefined && Number.isFinite(destinationTag) ? { destinationTag } : {}),
  };
  return draft;
}

export default function BuilderAgentPanel(props: BuilderAgentPanelProps) {
  const [mode, setMode] = useState<BuilderAgentMode>('ui-triage');
  const [task, setTask] = useState('');
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<Array<{ role: 'you' | 'agent' | 'system'; text: string }>>([]);
  const [pendingDraft, setPendingDraft] = useState<XamanSendDraft | null>(null);
  const [signingRequest, setSigningRequest] = useState<SigningRequest | null>(null);
  const [xamanBusy, setXamanBusy] = useState(false);
  const [xamanErr, setXamanErr] = useState('');
  const lastBuilderPayloadIdRef = useRef<string | null>(null);

  const refreshWallet = useWalletStore((s) => s.refreshWallet);
  const activeWalletId = useWalletStore((s) => s.activeWalletId);
  const wallets = useWalletStore((s) => s.wallets);
  const activeWallet = activeWalletId ? wallets.find((w) => w.id === activeWalletId) : wallets[0];
  const payerAddress = props.account ?? activeWallet?.address ?? '';
  const savedContacts = useXrplAddressBookSorted();

  const context = useMemo(
    () => ({
      account: props.account ?? null,
      route: props.currentRoute ?? null,
      selectedModuleId: props.selectedModuleId ?? null,
      intent: mode,
      guardrails: {
        noPrivateKeys: true,
        noAutoSigning: true,
        readOnlyFirst: mode !== 'xaman-send',
        preferSmallPatches: true,
      },
    }),
    [props.account, props.currentRoute, props.selectedModuleId, mode]
  );

  useEffect(() => {
    lastBuilderPayloadIdRef.current = null;
    setPendingDraft(null);
    setSigningRequest(null);
    setXamanErr('');
  }, [mode]);

  useEffect(() => {
    const onSigned = (req: SigningRequest) => {
      if (req.id !== lastBuilderPayloadIdRef.current) return;
      lastBuilderPayloadIdRef.current = null;
      setSigningRequest(null);
      setPendingDraft(null);
      setLog((l) => [
        ...l,
        {
          role: 'system',
          text: `Signed in Xaman. Tx: ${req.txHash ?? '—'}`,
        },
      ]);
      if (activeWallet?.id) void refreshWallet(activeWallet.id);
    };
    const onRejected = (req: SigningRequest) => {
      if (req.id !== lastBuilderPayloadIdRef.current) return;
      lastBuilderPayloadIdRef.current = null;
      setSigningRequest(null);
      setLog((l) => [...l, { role: 'system', text: 'Signing request rejected or closed in Xaman.' }]);
    };
    xamanService.on('signingSigned', onSigned);
    xamanService.on('signingRejected', onRejected);
    return () => {
      xamanService.off('signingSigned', onSigned);
      xamanService.off('signingRejected', onRejected);
    };
  }, [activeWallet?.id, refreshWallet]);

  const openXamanForPayment = useCallback(
    async (draft: XamanSendDraft) => {
      setXamanBusy(true);
      setXamanErr('');
      try {
        if (!payerAddress || !isValidClassicAddress(payerAddress)) {
          throw new Error('Set an active wallet address (Control Room / Wallet) as the sender.');
        }
        if (!xamanService.hasApiCredentials()) {
          throw new Error('Add your Xaman API key in Settings (https://apps.xumm.dev) to create signing payloads.');
        }
        const client = await getXRPLClient();
        const tx: Record<string, unknown> = {
          TransactionType: 'Payment',
          Account: payerAddress,
          Destination: draft.destination,
          Amount: xrpToDrops(draft.amountXrp),
        };
        if (draft.destinationTag !== undefined) tx.DestinationTag = draft.destinationTag;
        if (draft.memo) {
          tx.Memos = [
            {
              Memo: {
                MemoType: convertStringToHex('text/plain'),
                MemoData: convertStringToHex(draft.memo),
              },
            },
          ];
        }
        const prepared = await client.autofill(tx as Parameters<typeof client.autofill>[0]);
        const req = await xamanService.requestCustomTransactionSignature(
          prepared as Parameters<typeof xamanService.requestCustomTransactionSignature>[0],
          payerAddress
        );
        lastBuilderPayloadIdRef.current = req.id;
        setSigningRequest(req);
        const openUrl = req.browserSignUrl ?? `https://xumm.app/sign/${req.id}`;
        window.open(openUrl, '_blank', 'noopener,noreferrer');
        setLog((l) => [
          ...l,
          {
            role: 'system',
            text: `Xaman signing link opened. Approve in the app or tab.\n${openUrl}`,
          },
        ]);
      } catch (e) {
        setXamanErr(e instanceof Error ? e.message : String(e));
      } finally {
        setXamanBusy(false);
      }
    },
    [payerAddress]
  );

  async function run() {
    const prompt = task.trim();
    if (!prompt || busy) return;

    setLog((l) => [...l, { role: 'you', text: prompt }]);
    setTask('');
    setBusy(true);
    setXamanErr('');

    try {
      const orchestrator = getDefaultOrchestrator();
      const agentType = MODE_TO_AGENT_TYPE[mode];

      const userParsed = mode === 'xaman-send' ? parseNaturalPayment(prompt) : null;

      const baseRules = `
Rules: small patches only (1–3 files), no secrets in client code, read-only XRPL first; any ledger spend must be a user-approved Xaman payload (never auto-submit).`;

      const xamanJsonHint =
        mode === 'xaman-send'
          ? `
Also include optional top-level JSON field "xamanSend": { "destination": "r...", "amountXrp": "1.5", "memo": "optional", "destinationTag": optional number }
ONLY if the user clearly asked to send XRP and both destination and amount are known. Never invent addresses. Omit "xamanSend" if unclear.
`
          : '';

      const builderTask = `
You are my OpenClaw Builder Agent for xrpl-control-room-gamer-ui.
Return valid JSON with:
1) "analysis" (short summary; you may include PATCH blocks in the analysis as: PATCH <path> <<< ... >>>).
2) "codeSuggestions" as a bullet list (array of strings).
3) "uiUpdates" JSON for what to change next.
${xamanJsonHint}
${baseRules}

Context: ${JSON.stringify(context)}
Task: ${prompt}
      `.trim();

      const response = await orchestrator.invokeAgent(builderTask, { account: props.account ?? '', ...context }, agentType);

      const aiDraft = mode === 'xaman-send' ? response.xamanSend : undefined;
      const draft = userParsed ?? aiDraft ?? null;
      if (mode === 'xaman-send' && draft) {
        setPendingDraft(draft);
      } else if (mode === 'xaman-send') {
        setPendingDraft(null);
      }

      const agentText = [
        response.analysis,
        response.codeSuggestions?.length
          ? '\nCode suggestions:\n' + response.codeSuggestions.map((s) => ` • ${s}`).join('\n')
          : '',
        Object.keys(response.uiUpdates ?? {}).length
          ? '\nuiUpdates: ' + JSON.stringify(response.uiUpdates, null, 2)
          : '',
        mode === 'xaman-send' && draft
          ? `\n\n— Payment draft (confirm below, then Sign in Xaman): ${draft.amountXrp} XRP → ${draft.destination}${
              draft.memo ? ` (memo: ${draft.memo})` : ''
            }${draft.destinationTag != null ? ` (tag ${draft.destinationTag})` : ''}`
          : '',
        mode === 'xaman-send' && !draft
          ? '\n\nTip: try a clear phrase like: send 1.5 XRP to rXXXXXXXXXXXXXXXXXXXXXXXXXXX'
          : '',
      ]
        .filter(Boolean)
        .join('\n');

      setLog((l) => [...l, { role: 'agent', text: agentText }]);

      if (response.uiUpdates && Object.keys(response.uiUpdates).length > 0 && props.onApplyUiUpdate) {
        props.onApplyUiUpdate(response.uiUpdates);
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      setLog((l) => [...l, { role: 'agent', text: `Error: ${errMsg}` }]);
    } finally {
      setBusy(false);
    }
  }

  const netLabel = getNetwork();

  return (
    <div className="rounded-xl border border-cyber-border bg-cyber-dark/80 p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <h3 className="font-cyber text-sm font-bold uppercase tracking-wider text-cyber-glow">
          OpenClaw Builder Agent
        </h3>
        <span className="text-xs text-cyber-muted">{busy ? 'Working…' : 'Ready'}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as BuilderAgentMode)}
          className="rounded-lg border border-cyber-border bg-cyber-darker px-3 py-2 text-sm text-cyber-text focus:border-cyber-glow focus:outline-none"
        >
          <option value="ui-triage">UI Triage</option>
          <option value="xrpl-wiring">XRPL Wiring</option>
          <option value="module-factory">Module Factory</option>
          <option value="xaman-send">Sign in Xaman — Send XRP</option>
        </select>

        <input
          value={task}
          onChange={(e) => setTask(e.target.value)}
          onKeyDown={(e) => (e.key === 'Enter' ? run() : null)}
          placeholder={
            mode === 'xaman-send'
              ? 'e.g. send 2 XRP to rN…  |  memo: thanks  |  tag 12345'
              : 'e.g. Simplify the dashboard header, add a Wallet Snapshot card…'
          }
          className="min-w-[200px] flex-1 rounded-lg border border-cyber-border bg-cyber-darker px-3 py-2 text-sm text-cyber-text placeholder:text-cyber-muted/70 focus:border-cyber-glow focus:outline-none"
        />

        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="rounded-lg border border-cyber-border bg-cyber-glow/20 px-4 py-2 font-cyber text-sm text-cyber-glow transition hover:bg-cyber-glow/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send
        </button>
      </div>

      {mode === 'xaman-send' && (
        <div className="mt-3 rounded-lg border border-cyber-border/80 bg-cyber-darker/60 p-3 text-xs text-cyber-muted">
          <p>
            Sender:{' '}
            <span className="font-mono text-cyber-text">
              {payerAddress ? `${payerAddress.slice(0, 10)}…${payerAddress.slice(-6)}` : '(no active wallet)'}
            </span>
            {' · '}
            Network: <span className="text-cyber-cyan">{netLabel}</span> (matches Wallet / Control Room client)
          </p>
          <p className="mt-1">
            You describe the payment; the app builds an unsigned transaction and opens Xaman. You always approve in the wallet — nothing is auto-submitted without your signature.
          </p>
          {savedContacts.length > 0 ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-cyber-muted shrink-0">Saved addresses</span>
              <select
                defaultValue=""
                aria-label="Insert a saved destination into the prompt"
                className="max-w-[min(100%,22rem)] flex-1 rounded border border-cyber-border bg-cyber-dark px-2 py-1.5 text-xs text-cyber-text"
                onChange={(e) => {
                  const addr = e.target.value;
                  if (!addr) return;
                  const c = savedContacts.find((x) => x.address === addr);
                  const tagPart = c?.destinationTag != null ? ` tag ${c.destinationTag}` : '';
                  setTask(`send 1 XRP to ${addr}${tagPart}`);
                  e.currentTarget.value = '';
                }}
              >
                <option value="">Choose to fill prompt (edit amount)…</option>
                {savedContacts.map((c) => (
                  <option key={c.id} value={c.address}>
                    {c.label} — {c.address.slice(0, 6)}…{c.address.slice(-4)}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="mt-2 text-[11px] text-cyber-muted">
              Save recipients in Control Room → Send XRP (Save address); they appear here for quick insert.
            </p>
          )}
        </div>
      )}

      {mode === 'xaman-send' && pendingDraft && (
        <div className="mt-3 rounded-lg border border-cyber-glow/40 bg-cyber-glow/5 p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-cyber-glow">Ready to sign</div>
          <pre className="mt-2 whitespace-pre-wrap break-all font-mono text-xs text-cyber-text">
            {JSON.stringify(pendingDraft, null, 2)}
          </pre>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={xamanBusy}
              onClick={() => void openXamanForPayment(pendingDraft)}
              className="rounded-lg border border-cyber-glow bg-cyber-glow/25 px-4 py-2 text-sm font-cyber text-cyber-glow hover:bg-cyber-glow/35 disabled:opacity-50"
            >
              {xamanBusy ? 'Creating payload…' : 'Open signing in Xaman'}
            </button>
            <button
              type="button"
              onClick={() => setPendingDraft(null)}
              className="rounded-lg border border-cyber-border px-3 py-2 text-xs text-cyber-muted hover:text-cyber-text"
            >
              Dismiss draft
            </button>
          </div>
          {xamanErr ? <p className="mt-2 text-xs text-red-400">{xamanErr}</p> : null}
          {signingRequest?.qrCodeUrl ? (
            <div className="mt-3 flex flex-col items-start gap-2">
              <span className="text-[10px] uppercase text-cyber-muted">Scan with Xaman</span>
              <img
                src={signingRequest.qrCodeUrl}
                alt="Xaman QR"
                className="h-40 w-40 rounded border border-cyber-border"
              />
            </div>
          ) : null}
        </div>
      )}

      <div className="mt-3 max-h-60 overflow-y-auto rounded-lg border border-cyber-border bg-cyber-darker/80 p-3">
        {log.length === 0 ? (
          <p className="text-xs text-cyber-muted">
            Ask: &quot;Audit the dashboard and propose a new hierarchy&quot;, &quot;Add a Wallet Snapshot card (read-only XRPL)&quot;,
            or switch to <strong>Sign in Xaman</strong> and type <strong>send 1 XRP to r…</strong>
          </p>
        ) : (
          log.map((m, i) => (
            <div key={i} className="mb-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-cyber-muted">
                {m.role}
              </div>
              <pre className="whitespace-pre-wrap break-words font-mono text-xs text-cyber-text">
                {m.text}
              </pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
