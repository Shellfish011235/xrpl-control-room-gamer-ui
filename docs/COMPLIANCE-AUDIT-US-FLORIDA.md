# US & Florida Compliance Audit — XRPL Control Room

**Audit date:** Post custody-removal cleanup  
**Scope:** Wallet custody, transaction signing, fees, money transmission, and regulated activity patterns.  
**Jurisdiction focus:** US federal (SEC/CFTC), Florida (money transmission, Ch. 560).

---

## Executive summary

After the compliance cleanup (no custody, connect-wallet only, sign in Xaman), the app is **in a defensible position** for US and Florida: it acts as a **visualization and orchestration interface** with **wallet connectivity**, not as a financial intermediary. Remaining items are **low risk** or **documented exceptions** (third-party integrations, example code, docs).

---

## 1. Custody & key storage — COMPLIANT

| Check | Status | Notes |
|-------|--------|-------|
| No wallet generation in UI | OK | `localWalletService.generate()` removed. No "Create Wallet" button. |
| No seed import / recovery phrase in UI | OK | Control Room "Watch only" = address entry only. No seed field. |
| No encrypted seed in localStorage | OK | `useSecureWallet` and encrypted seed storage removed. |
| No private keys in app storage | OK | Only public addresses (wallet store). |

**User flow:** Connect via **Xaman** (OAuth/deep link) or add a **watch-only address**. No keys or seeds stored.

---

## 2. Transaction signing — COMPLIANT

| Check | Status | Notes |
|-------|--------|-------|
| No in-app signing (wallet.sign) for user txs | OK | `WalletActionsPanel`, `ControlRoomSendReceive`, `PaperTradingPanel` use **Xaman** only. |
| Send / DEX / Cancel flow | OK | Prepare tx → `xamanService.requestCustomTransactionSignature()` → user signs in Xaman → Xaman returns txHash (Xaman submits). |
| Orchestra / Terminal live flow | OK | `executeOnXRPL` emits plan; UI opens Xaman; no app-side submit. |
| PlaceDEXOrder, NFTs, SecureAgentPanel, RealStreamsPanel | OK | All use `requestCustomTransactionSignature` + user signs in Xaman. |

**Legacy / unused:**

- `xrplService.submitSignedTx(txBlob)` — **no callers** in custody or Control Room flows. Safe to keep for future “submit user-signed blob” relay only (no platform signing).
- `orchestra/execution.ts` — `submitPlannedTx` is a stub; comment references in-app signing but no active path uses it.

---

## 3. Pooled / managed accounts & order routing — COMPLIANT

| Check | Status | Notes |
|-------|--------|-------|
| No pooled user funds | OK | No vaults, no “managed accounts” holding user funds. |
| No platform order aggregation | OK | No “collect user orders → route through our logic.” DEX flow: user’s wallet, user’s sign in Xaman. |
| Paper trading / auto-trader | OK | Simulation only; no real funds. Live trades require “Sign in Xaman.” |

---

## 4. Fee-on-execution (platform revenue) — COMPLIANT

| Check | Status | Notes |
|-------|--------|-------|
| No % of trades/swaps to platform | OK | OpenClaw: **no platform fees**; optional 2% to **skill creator** (recipient-side). |
| No brokerage-style execution fees | OK | No fee-on-execution model. |
| UI / docs | OK | “No platform fees,” “Payments to recipients and optional skill creators only.” |

---

## 5. Money transmission — COMPLIANT

| Check | Status | Notes |
|-------|--------|-------|
| Platform does not hold user funds | OK | No custody; no settlement accounts. |
| Platform does not transmit on behalf | OK | User signs in Xaman; Xaman submits. Platform only builds payload and opens Xaman. |
| Florida Ch. 560 | OK | No receiving/transmitting of user funds by the platform. |

---

## 6. Remaining items (low risk / recommendations)

### 6.1 OpenClawXRPL (`integrations/openclaw/OpenClawXRPL.ts`)

- **What:** `initializeAgentWallet()` creates a demo agent wallet with a random seed (`generateRandomSeed()`). Used only in **commented-out** `exampleUsage()`.
- **Risk:** Low. Not on a production code path. If ever enabled, “agent wallet” holding keys could look like platform custody.
- **Recommendation:** Keep example commented or move to `/docs` or `/examples` with a clear “demo only; do not use for real funds” notice. Do not use agent-held seeds for user payments in production.

### 6.2 CARV integration (`services/carv/xrplConnector.ts`, `orchestrator.ts`)

- **What:** `XRPLConnector` accepts optional `walletSeed`; orchestrator can set wallet from seed. Comment: “NEVER store in production!”
- **Risk:** Depends on who injects `walletSeed`. If **platform** stores or generates it for users → custody risk. If **CARV / user** provides it (e.g. from their wallet) → similar to “connect wallet.”
- **Recommendation:** Ensure no platform persistence of `walletSeed`. Prefer CARV-side or user-device signing. Document that CARV flows must not use platform-held seeds for user funds.

### 6.3 WalletConnect `backupModalPayload`

- **What:** Unused state: `backupModalPayload` (seed + address) for a backup modal. No `setBackupModalPayload` calls after removal of create-wallet flow.
- **Risk:** None (dead code).
- **Recommendation:** Remove `backupModalPayload` and `setBackupModalPayload` for clarity.

### 6.4 `liveXRPLData.ts` (micropayments)

- **What:** Contains **code snippet strings** (documentation/examples) that show `submitAndWait(tx, { wallet })` and `signClaim(..., privateKey)`.
- **Risk:** None. These are example snippets, not executed by the app.
- **Recommendation:** Optional: add a one-line comment that these are documentation-only and not used for in-app signing.

---

## 7. Florida-specific (Ch. 560 — money services)

- **No receipt of user funds for transmission:** OK.  
- **No transmission of user funds on behalf of users:** OK (user signs in Xaman).  
- **No stored value / e-wallet holding user funds:** OK.  
- **Control Room = “connect wallet” + read-only / prepare-tx + Sign in Xaman:** Fits “technology service” / visualization, not money transmission.

---

## 8. Conclusion

- **Custody:** No wallet creation, no seed storage, no in-app signing for user transactions.  
- **Signing:** All user-facing Send/DEX/Cancel and live trades go through **Sign in Xaman** (or equivalent wallet).  
- **Fees:** No platform execution fees; optional creator share is recipient-side (OpenClaw).  
- **Transmission:** Platform does not hold or transmit user funds.

**Verdict:** The codebase is **aligned with US and Florida compliance** for a non-custodial, connect-wallet-only XRPL intelligence terminal. Remaining items (OpenClaw demo agent wallet, CARV connector config, dead backup modal state) are low risk and can be tightened with the recommended small changes above.

---

*This audit is a code-level review and does not constitute legal advice. For legal certainty, consult counsel licensed in the relevant jurisdictions.*
