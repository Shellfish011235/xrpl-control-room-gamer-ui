# Rendered generic Control Room acceptance

Use Node 24 and an explicitly started fresh-profile Chrome with loopback CDP port 9223. Keep the generic demo services running on 3000, 8787, and 5180. Run `node scripts/control-room-browser-acceptance.mjs` from this worktree. `CDP_URL` and `CONTROL_ROOM_URL` can override loopback URLs; interception intentionally targets gateway port 8787.

The harness opens and closes only its own target. It does not close Chrome, stop services, use wallet credentials, or call Ollama. Do not point CDP at a personal browsing profile. The operator owns the separate Chrome process and its eventual shutdown.

It checks the actual rendered section through six scenarios: healthy, quote with receipt details, backend failure clearing stale quote/receipt state, pending controls, receipt failure preserving quoted status without false details, and generic queue acceptance. Failure injection uses CDP Fetch on gateway requests only; OPTIONS remains untouched. Pending requests resume before completion. Every run creates one generic queued job and quote artifacts in the demo runtime; this is an acceptance run with actual backend effects, not a read-only inspection.

Screenshots and structured DOM states go to ignored `node_modules/.cache/shellfish-browser-acceptance`. Screenshots capture the viewport, not the entire page. No source screenshots are committed. Network failures outside this panel and financial/wallet behavior are outside its assertions.

Verified 2026-10-08 against local UI revision c7b8694 and spine 8f72175: all six scenarios passed, process exit 0. This script adds generic acceptance coverage, not Vault Exit Drill product behavior.

Independent review accepted the stated six-scenario scope. Receipt assertions cover presence and failure display, not payload/ID correlation; queue assertions cover QUEUED display, not exact backend submission count. Early WebSocket connection failure now closes the created blank target before propagating failure.
