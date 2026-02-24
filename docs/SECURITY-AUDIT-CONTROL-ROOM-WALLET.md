# Security Audit: Control Room Wallet (Red-Team)

**Scope:** In-app (Control Room) wallet: `localWalletService`, wallet store persistence, WalletConnect UI, PaperTradingPanel signing, XRPL service and proxy.  
**Date:** 2025-02-22.

---

## Executive summary

The Control Room wallet is **non-custodial**, **session-only**, and does **not persist seeds** anywhere. Signing is local; only signed transaction blobs are sent to the network. The main risks are **information leakage via verbose logging**, **no session lock** (wallet stays in memory until refresh), **seed in React state** longer than necessary, and **trust in XRPL endpoint/proxy**. Below: findings by severity and concrete remediations.

---

## Critical

### C-1. No session lock — wallet stays in memory until refresh

**Finding:** `localWalletService.clear()` exists but is **never called**. The session wallet (and its key material) remains in JS memory until the user refreshes or closes the tab. Anyone with access to the same browser session can sign transactions.

**Attack:** User imports seed, adds wallet, then walks away. Attacker uses same device → Paper Trading → Live → BUY/SELL → transaction is signed and submitted without re-entering the seed.

**Remediation:**
- Add a **Lock / Clear session** action (e.g. in Profile or wallet dropdown) that:
  1. Calls `localWalletService.clear()`.
  2. Optionally marks Control Room wallets in the store as "locked" so the UI shows "Re-import from Profile → Wallets" until the user imports again.
- Consider auto-lock after inactivity (e.g. 15–30 min) when a Control Room wallet is active.

---

## High

### H-1. Verbose logging in production leaks request/response data

**Finding:** `xrplService.ts` logs:
- Every request: method, URL, and **full `params`** (e.g. `account_info` with address, **`submit` with signed `tx_blob`**).
- Full raw response and extracted result as JSON.

**Risk:** Logs can be exfiltrated (browser extensions, devtools, log aggregation). Signed blobs and addresses are sensitive metadata; full responses can contain balances and tx history.

**Remediation:**
- In production (e.g. `import.meta.env.PROD` or `import.meta.env.MODE === 'production'`), **do not log** `params` or response bodies for `account_info`, `submit`, `server_info`, `account_tx`, etc.
- At most log: method, URL, and success/failure (no params/result). Optionally redact address to `rXXX...YYY` and never log `tx_blob` in production.

### H-2. Seed and backup seed remain in React state

**Finding:** In `WalletConnect.tsx`:
- `controlRoomImportSeed` holds the pasted seed until the user submits; after `addWalletAndFetch` the input is cleared but the string may have been in state for a long time.
- `controlRoomSeedToBackup` holds the generated seed until "I saved my seed — add to my wallets"; after that it’s set to `null`, but until then it’s in component state and rendered in the DOM (screenshot / DevTools).

**Risk:** React state is in memory; the backup seed is visible in the DOM. Any extension or malware that scrapes the page could capture it.

**Remediation:**
- After successful "Import & add to my wallets", explicitly clear the import seed and avoid keeping it in state longer than the click handler (already clearing; ensure no other refs hold it).
- After "I saved my seed — add to my wallets", clear `controlRoomSeedToBackup` immediately (already done) and avoid logging or passing the seed to any async callback that could leak.
- Consider showing the backup seed in a modal that unmounts when closed so it’s not always in the tree (optional hardening).

---

## Medium

### M-1. XRPL proxy and endpoint trust

**Finding:** If `VITE_XRPL_PROXY_URL` is set, **all** XRPL JSON-RPC (including `submit`) goes to that base URL. The app does not verify that the proxy forwards to a real XRPL node.

**Risk:** A malicious or compromised proxy could:
- Return fake account_info (e.g. fake balance).
- For `submit`, forward the signed blob to the real network (user loses funds as intended) or drop it and pretend success (user thinks tx succeeded when it didn’t).

**Remediation:**
- Document that `VITE_XRPL_PROXY_URL` must point to a trusted backend that only forwards to known XRPL nodes.
- For critical flows, consider verifying critical txs with a second read-only call (e.g. `tx` by hash) to a known-good endpoint if proxy is used.
- In production, avoid logging `tx_blob` and full submit params (see H-1).

### M-2. No explicit validation of OfferCreate payload before signing

**Finding:** `PaperTradingPanel` builds payload via `buildOfferCreate(activeWallet.address, ...)` and passes it to `signAndSubmit(payload as unknown as Record<...>)`. The payload shape is trusted (account from store, amount/price from UI; issuer hardcoded). There is no runtime check that the payload is actually an OfferCreate and that `Account` matches the session wallet.

**Risk:** If another code path ever passed a different payload (e.g. different Account or TransactionType), the user could sign a different tx. Currently the only caller is the panel with trusted inputs — low likelihood.

**Remediation:**
- In `localWalletService.signAndSubmit`, assert `tx.TransactionType` and that `tx.Account === sessionWallet.classicAddress` before signing. Reject otherwise.

### M-3. `signOnly` exported but unused

**Finding:** `localWalletService.signOnly()` is exported. No caller in the repo. If a future caller submitted the returned `tx_blob` to a malicious endpoint, the signed tx could be replayed or misused.

**Remediation:**
- Either remove `signOnly` or document that callers must only submit `tx_blob` to a trusted XRPL node. Prefer a single code path (e.g. only `signAndSubmit`) unless you have a clear use case.

---

## Low

### L-1. Persisted wallet state contains addresses and labels only

**Finding:** Zustand persist name `xrpl-wallet-state` stores the full wallet list. The `ConnectedWallet` type does not include seed or private key; only id, address, provider, label, balance, etc. Confirmed: no secret material is persisted.

**Remediation:** None required. Optionally document in code that persist must never include secret material and consider `partialize` to explicitly allow-list persisted keys if the state shape grows.

### L-2. Seed input is `type="password"`

**Finding:** The import seed field uses `type="password"` so it’s masked in the UI. Good.

**Remediation:** None. Keep it.

### L-3. Wallet.fromSeed(seed.trim()) — invalid seed

**Finding:** If the user pastes an invalid seed, `Wallet.fromSeed` (xrpl lib) will throw. The error could expose "invalid seed" vs "network error" in some environments. No seed is sent over the network.

**Remediation:** Catch the error and show a generic "Invalid secret key. Check the value and try again." Do not rethrow the raw library error to the UI.

---

## Informational

### I-1. buildOfferCreate uses hardcoded Bitstamp USD issuer

**Finding:** `paperTradingLiveExecute.ts` uses `rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B` (Bitstamp USD). This is intentional for the XRP/USD pair.

**Remediation:** Document in code or config; if you ever support multiple USD issuers, make it configurable and validate.

### I-2. Dependencies

**Finding:** `xrpl` ^3.0.0 is used for `Wallet.generate()`, `Wallet.fromSeed()`, and `wallet.sign()`. No custom crypto; key handling is in the library.

**Remediation:** Keep `xrpl` updated; run `npm audit` and address known vulnerabilities. The 17 vulnerabilities mentioned in the Vercel build should be reviewed (many may be dev or transitive).

---

## Positive findings

- **No seed in localStorage/sessionStorage/cookies.** Session wallet is module-level variable only.
- **No seed or private key sent over the network.** Only signed `tx_blob` is submitted.
- **OfferCreate payload is built from trusted inputs** (active wallet address, UI amount/price, fixed issuer).
- **Control Room wallet is clearly described** as session-only and "lost on refresh" in the UI.
- **Password field** for seed import reduces shoulder-surfing.

---

## Checklist (remediation summary)

- [x] **C-1:** Add Lock / Clear session that calls `localWalletService.clear()` — **Done:** "Lock session" button in WalletConnect when Control Room wallet is active and session has key.
- [x] **H-1:** Gate or remove verbose XRPL logging in production — **Done:** `isProd` check in xrplService; params/result not logged in production.
- [x] **H-2:** Ensure seed state is cleared as soon as possible after use; consider modal for backup seed — **Done:** Backup seed shown in modal that unmounts when closed; import seed cleared immediately in handler (copy then clear before async).
- [x] **M-1:** Document proxy trust; consider tx verification when using proxy — **Done:** docs/DATA-PROXY.md § Security and trust (VITE_XRPL_PROXY_URL); comment in xrplService getXRPLUrl.
- [x] **M-2:** In `signAndSubmit` (and `signOnly`), validate TransactionType and Account === session wallet — **Done.**
- [x] **M-3:** Remove or document `signOnly`; prefer single signing path — **Done:** `signOnly` removed; single path is `signAndSubmit`.
- [x] **L-3:** Catch Wallet.fromSeed errors and show generic invalid-seed message — **Done:** WalletConnect shows "Invalid secret key. Check the value and try again."
