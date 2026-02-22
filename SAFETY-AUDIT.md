# XRPL Control Room – Safety Audit Report

**Date:** February 2026  
**Scope:** `xrpl-control-room-gamer-ui` (dependencies, secrets, payment/signing flows, XSS/injection, auth and trust).  
**Disclaimer:** This is an internal review, not a formal penetration test or certification. For compliance and legal risk, see `OPENCLAW-COMPLIANCE-AND-USE.md` and `COMPLIANCE-GLOBAL-US-FLORIDA.md`.

---

## Executive Summary

- **Dependencies:** `npm audit` reports **0 vulnerabilities**.
- **Secrets:** Xaman API key is stored in `localStorage` and (when set) in the Vite build via `VITE_XAMAN_API_KEY`; both are expected for this client-only design. No wallet seeds or API secrets are persisted by the app except the in-memory CARV/XRPL connector seed (see findings).
- **Payment safety:** Two-step confirmation (plan → user confirm → Xaman sign), rate limits, kill switch, and audit logging are in place. OpenClaw SafetyLayer defaults to testnet-only.
- **XSS / injection:** No `dangerouslySetInnerHTML`, `eval`, or `innerHTML` on user input. Fetch URLs are either fixed or built from constants/encoded query params.
- **Recommendations:** Add Content-Security-Policy, document CARV seed handling, and optionally wrap `JSON.parse` of external/API data in safe parsing.

---

## 1. Dependencies

| Check | Result |
|-------|--------|
| `npm audit` | **0 vulnerabilities** reported |

**Recommendation:** Re-run `npm audit` and `npm update` periodically; before major releases, consider `npm audit fix` (review diff) and lockfile updates.

---

## 2. Secrets and Sensitive Data

### 2.1 Xaman (XUMM) API Key

- **Where:** `src/services/xaman/xamanService.ts`, `src/config/xaman.ts`
- **Storage:** 
  - Optional env: `VITE_XAMAN_API_KEY` (baked into client bundle at build time).
  - Optional in-app: saved in `localStorage` under `xaman-api-key`.
- **Usage:** Browser SDK only; API **Secret** is not used in the frontend (by design).
- **Finding:** Acceptable for a client-only, no-custody design. Key is visible to anyone who can inspect the built JS or the origin’s storage; treat as “client credential,” not a server secret.

### 2.2 CARV / XRPL Connector – Wallet Seed

- **Where:** `src/services/carv/xrplConnector.ts`
- **Flow:** Faucet response may set `this.wallet = { address, publicKey, seed: data.account.secret }`. `setWallet(seed)` allows setting a seed from caller (e.g. test harness). Seed is used in memory for signing (`sendPayment`).
- **Persistence:** Comment states “Only in memory, never persisted”; no `localStorage`/`sessionStorage` or `persist` for the wallet object was found.
- **Finding:** **Medium.** If any code path ever serializes `this.wallet` (e.g. to localStorage, or to a backend), the seed would be exposed. Recommend: (1) Explicitly avoid persisting or sending `wallet.seed` anywhere; (2) Add a short comment in code and in this doc that CARV connector is for testnet/demo and must not be used with mainnet seeds unless the flow is locked down and audited.

### 2.3 Other Env / Config

- **VITE_AGENT_SERVICE_WALLET:** Public XRPL address; not sensitive.
- (OpenClaw: no platform fees or royalties; no fee wallet.)
- **LLM API keys (OpenAI/Anthropic):** Used in `src/services/carv/llmAgent.ts` for payment approval. If supplied in the client, they are visible in the bundle/network. Prefer backend proxy for production if keys must stay server-only.

### 2.4 Sample Code in Repo

- **Where:** `src/services/micropayments/liveXRPLData.ts` (e.g. `signClaim` snippet) and similar.
- **Content:** Example snippets reference `privateKey` in **documentation/sample code strings**, not in executed runtime.
- **Finding:** No change needed; ensure no real keys are ever committed.

---

## 3. Payment and Signing Flows

### 3.1 Secure Payment Agent

- **Confirmation:** `requireConfirmation: true`; plan is created, then user must confirm before a Xaman signing request is created.
- **Limits:** `dailyLimit` (default 100 XRP), `singleTxLimit` (default 25 XRP), `cooldownSeconds` (default 5).
- **Audit:** Actions logged to `AuditLogEntry` and persisted to `localStorage` (`secure-agent-audit-log`).
- **Finding:** Design is sound: no custody, user signs in Xaman, limits and audit present.

### 3.2 OpenClaw SafetyLayer

- **Kill switch:** Can halt all payments; state persisted (e.g. zustand persist).
- **Rate limits:** Per minute/hour/day and per-amount caps (e.g. `MAX_AMOUNT_PER_TX`, `MAX_AMOUNT_PER_DAY`).
- **Consent:** `userConsentGiven` must be true for payments.
- **Mode:** `SAFETY_CONFIG.TESTNET_ONLY: true` in code – **testnet-only by default**; comment says “SET TO FALSE ONLY AFTER FULL AUDIT.”
- **Finding:** Good defaults; if mainnet is enabled later, do a dedicated review and document the change.

### 3.3 CARV / LLM Approval

- **Flow:** Orchestrator can require `requireLLMApproval`; LLM evaluates payment request (red flags, regime compliance); user still sees plan and signs in Xaman.
- **Finding:** Human-in-the-loop is preserved; no autonomous signing without user approval.

### 3.4 Xaman Deep Links / QR

- **Usage:** `signingRequest.deepLink` and `signingRequest.qrCodeUrl` come from Xaman API responses, not from arbitrary user input.
- **Finding:** No open redirect from these values in the reviewed paths.

---

## 4. XSS, Injection, and Unsafe Patterns

| Check | Result |
|-------|--------|
| `dangerouslySetInnerHTML` | None found |
| `innerHTML` / `document.write` | None found |
| `eval` / `new Function` | None found |
| Fetch URL from raw user input | No; URLs are fixed, from constants, or from `encodeURIComponent(query)` (e.g. search). |
| `href` from user input | Links use app data (e.g. `nft.tokenId`, `selectedMeme.walletAddress`) or Xaman response (`signingRequest.deepLink`). No unsanitized user string used as sole `href`. |

**Note:** `OpenClawXRPL.ts` builds a URL with `encodeURIComponent(prompt)` to `generated-image.example.com` – example/mock only; if a real image service is used later, ensure the base URL is allowlisted and prompt is validated/sanitized as needed.

**Recommendation:** Keep avoiding `dangerouslySetInnerHTML` and raw user input in `href`/`fetch` URLs. If you add rich text from users, use a sanitization library (e.g. DOMPurify) and CSP.

---

## 5. Headers and CSP

- **Current (vercel.json):** `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`.
- **Missing:** `Content-Security-Policy` (CSP).
- **Recommendation:** Add a strict CSP (e.g. `default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self' https://api.xumm.app wss: https://s1.ripple.com https://api.coingecko.com ...`) and relax only as needed for trusted third parties. This reduces XSS impact and limits unexpected outbound requests.

---

## 6. Auth and Client-Side Trust

- **Model:** No backend auth; the app is a static frontend that uses Xaman for signing and optional env/localStorage for Xaman API key. All “trust” is in the client and Xaman.
- **CORS:** Fetch targets public APIs (CoinGecko, Binance, XRPL nodes, Xumm, etc.); no evidence of relying on missing CORS for security.
- **Webhook URL (AlertBuilder):** User can configure a Discord/webhook URL. The `fetch` runs in the browser, so it is the user’s context; avoid documenting or encouraging use of internal or sensitive URLs as webhooks.

---

## 7. JSON and External Data

- **JSON.parse:** Used on `localStorage` data, WebSocket `event.data` (XRPL/price feeds), and LLM `function_call.arguments`. Most are in try/catch or validated later.
- **Risk:** Malicious or malformed data could throw or, in theory, lead to prototype pollution if the result is merged into state without care.
- **Recommendation:** Keep try/catch around all `JSON.parse` of external or API-origin data; consider a small safe-parse helper that returns a default on failure. For LLM responses, validating the shape of `function_call.arguments` before use is good practice.

---

## 8. Checklist Summary

| Area | Status | Notes |
|------|--------|--------|
| Dependencies | ✅ | 0 known vulnerabilities |
| Xaman API key | ✅ | Client-only by design; no secret in frontend |
| Wallet seed (CARV) | ⚠️ | In-memory only; do not persist or send; document testnet/demo use |
| Payment confirmation | ✅ | Two-step + Xaman sign |
| Rate limits / kill switch | ✅ | SafetyLayer + Secure Payment Agent |
| Testnet default | ✅ | OpenClaw `TESTNET_ONLY: true` |
| XSS / injection | ✅ | No dangerous DOM/URL patterns found |
| Security headers | ⚠️ | Add CSP |
| JSON parsing | ✅ | Generally in try/catch; optional hardening for external data |

---

## 9. Recommended Next Steps

1. **Add Content-Security-Policy** in `vercel.json` (or equivalent) and test all critical flows (Xaman, payments, LLM, external APIs).
2. **Document CARV connector:** In code and in this doc, state that the in-memory seed is for testnet/demo only and must not be used with mainnet seeds without a dedicated security review.
3. **Re-run this audit** after major feature changes (new payment flows, new integrations, or mainnet enablement).
4. **Legal/compliance:** Rely on `OPENCLAW-COMPLIANCE-AND-USE.md` and `COMPLIANCE-GLOBAL-US-FLORIDA.md` and qualified counsel for money transmission, securities, and jurisdiction-specific rules.

---

*This report reflects a static and behavioral review of the codebase as of the audit date. It does not replace penetration testing, dependency monitoring, or legal advice.*
