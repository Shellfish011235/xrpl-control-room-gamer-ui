# Security Ops (Control Room) — v0.1

## Scope

The **Security Ops** view is a **client-side, non-custodial** surface. It does **not** replace a Web Application Firewall, a SIEM, or an organizational security program. It adds **cognitive and prompt** guardrails in the product shell.

## Non-custodial model

- The app does not **hold user funds** or act as a custodian.
- **No private keys, no seed phrases** are collected, stored, or used for in-app execution.
- **Mainnet effects** (where applicable elsewhere in the app) are expected to go through **user-controlled wallets** (e.g. Xaman) and explicit operator choices — not through autonomous execution in this control layer.

## Prompt-injection model

User-pasted and external text may attempt to **override** safety instructions, **bypass** approvals, or elicit **signing** behavior. The in-browser `scanPrompt()` helper applies **heuristic** pattern checks. It is **tunable** and will produce false positives/negatives; it is a **pre-filter** for review, not a guarantee.

**External data** may be used as **evidence** in an operator audit trail, but must not be treated as a **privileged system instruction** over your policies.

## Data-poisoning / cognitive-security model

Paired with prompt scanning, the **poisoning log** records when a scan is **suspicious** or **blocked**. That supports later human review. It is **not** a tamper-proof audit log: data lives in the browser (persisted with Zustand) unless a future export or backend is added.

## Wallet safety

Wallet safety in this app means: **read-only and clearly labeled flows** where the operator connects or watches an address, and **all signing** happens in the user’s **external** wallet. Security Ops reiterates that; it does not add new wallet APIs.

## Audit log model (local)

- **Security event log** — e.g. each `prompt_scan` summary (including clean runs).
- **Poisoning log** — only when a scan is not `clean`.

For production, consider exporting these events to your own logging pipeline; nothing is sent automatically in v0.1.

## Crypto-agility and post-quantum readiness

The **quantum readiness** field is a **roadmap and inventory** label (e.g. classical signatures in use, planned migration). It is **not** a certification of quantum resistance. Post-quantum (PQC) readiness in XRPL and your stack depends on standards, node releases, and key-management practices outside this UI.

## Prohibited / out of scope in this screen

- No **live trading**, **autonomous on-chain execution**, or **in-app** signing of mainnet transactions from this panel.
- No **backend** services, model hosting, or remote scanning API for Ticket 004.
- No new **Xaman** or signing flows were added for this feature.

## References

- `src/security/promptFirewall.ts` — heuristics and `scanPrompt()`.
- `src/store/securityStore.ts` — persisted state and log appenders.
- `src/components/control-room/SecurityOpsPanel.tsx` — operator UI.
