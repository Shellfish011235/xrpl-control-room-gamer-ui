# Bug Bounty Audit Report — xrpl-control-room-gamer-ui

**Scope:** Full codebase (wallet, Xaman, orchestra, stores, API/WS, UI).  
**Treat as:** Bug bounty / security and correctness audit.

---

## High severity

### 1. **`Buffer` is undefined in browser — runtime crash (Orchestra / plan)**

**Files:** `src/orchestra/plan.ts`, `src/services/carv/xrplConnector.ts`, `src/services/carv/ilpConnector.ts`

**Issue:** `Buffer` is a Node.js global. The app is a Vite SPA and runs in the browser, where `Buffer` is not defined. Any code path that builds a settlement plan with memos (or uses CARV/ILP hex helpers) will throw `ReferenceError: Buffer is not defined`.

**Evidence:**
- `plan.ts` line 34: `Buffer.from(JSON.stringify({ batch: true, seq })).toString('hex')`
- `plan.ts` line 74: `Buffer.from(o.memo, 'utf8').toString('hex')`
- `src/services/carv/xrplConnector.ts`: `Buffer.from(...)`
- `src/services/carv/ilpConnector.ts`: `Buffer.from(...)`

**Trigger:** User triggers Orchestra netting/settlement that produces a plan with memos, or CARV/ILP flows that encode to hex.

**Fix:** Use a browser-safe encoding instead of `Buffer`:

```ts
// Replace Buffer.from(x).toString('hex') with:
function toHex(s: string): string {
  return Array.from(new TextEncoder().encode(s))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
// For JSON: toHex(JSON.stringify({ batch: true, seq }))
// For utf8 string: toHex(o.memo)
```

Add the same helper (or a small `buffer` polyfill) and use it in `plan.ts` and the CARV/ILP connectors. Do not rely on Node’s `Buffer` in browser build.

---

### 2. **Xaman custom tx: `Account` can be overridden by caller**

**File:** `src/services/xaman/xamanService.ts`  
**Method:** `requestCustomTransactionSignature(tx, sourceAccount?)`

**Issue:** The payload is built as `{ ...tx, Account: tx.Account ?? account }`. So if the caller passes a `tx` object with `Account` set (e.g. from UI or another module), that value is used. The signer identity should always be the connected session or `sourceAccount`, not attacker-controlled input.

**Risk:** Confused deputy: UI or any consumer could make the app ask the user to “sign for” a different account (wrong UX, or spoofed “Sign for account X” if X is shown from `tx.Account`).

**Fix:** Always force the signer account:

```ts
const payload = { ...tx, Account: account };
```

Remove use of `tx.Account` when building the payload sent to Xaman.

---

## Medium severity

### 3. **walletStore: mutating state inside `removeWallet`**

**File:** `src/store/walletStore.ts`  
**Function:** `removeWallet`

**Issue:** Inside the `set()` updater you do `filtered[0].isDefault = true`. That mutates an object that is still part of the previous state (filter returns same object references). Zustand and React work best with immutable updates; mutating can cause subtle bugs (stale closures, comparisons).

**Fix:** Return new objects:

```ts
const filtered = state.wallets.filter(w => w.id !== id);
const wasDefault = state.wallets.find(w => w.id === id)?.isDefault;
const next = wasDefault && filtered.length > 0
  ? filtered.map((w, i) => i === 0 ? { ...w, isDefault: true } : w)
  : filtered;
return {
  wallets: next,
  activeWalletId: wasActive ? (next[0]?.id || null) : state.activeWalletId,
};
```

---

### 4. **Bounty reputation: no validation of `rewardXRP`**

**Files:** `src/store/bountyStore.ts` (`addReputationCompletion`), `src/components/agentEconomy/BountyBoard.tsx`

**Issue:** When a `bounty_complete` activity is processed, `addReputationCompletion(bounty.rewardXRP)` is called. `bounty` can come from the Discord bridge API. If the API (or a compromised bridge) returns a bounty with `rewardXRP: -1000` or `NaN`, reputation state becomes inconsistent (e.g. negative `totalXRPEarned` or NaN).

**Fix:** In `addReputationCompletion`, clamp or validate:

```ts
addReputationCompletion: (xrpEarned) =>
  set((state) => {
    const safe = Number(xrpEarned);
    const amount = Number.isFinite(safe) && safe >= 0 ? safe : 0;
    return {
      reputation: {
        ...state.reputation,
        completedBounties: state.reputation.completedBounties + 1,
        totalXRPEarned: state.reputation.totalXRPEarned + amount,
        lastActivityAt: Date.now(),
      },
    };
  }),
```

Optionally also validate `bounty.rewardXRP` before calling in BountyBoard.

---

### 5. **Discord bridge API response not validated**

**File:** `src/services/discordBridgeService.ts`  
**Functions:** `fetchDiscordActivity`, `postBounty`

**Issue:** `data.activity` and `data.bounties` are used with only `Array.isArray()` checks. No shape validation (required fields, types, or length limits). Malicious or buggy bridge could return huge arrays (DoS), or objects with prototype/extra keys that could affect downstream logic.

**Fix:** Validate array length (e.g. cap at 200), and optionally validate item shape (e.g. `id`, `type`, `content` for activity; `id`, `rewardXRP`, `status` for bounties) before storing.

---

## Low severity / hardening

### 6. **Weak wallet ID generation**

**File:** `src/store/walletStore.ts`  
**Code:** `const generateId = () => Math.random().toString(36).substring(2, 15);`

**Issue:** `Math.random()` is not cryptographically secure. IDs are used for in-memory/local state (Zustand persist). Risk is low (no auth or signing), but collisions could theoretically cause duplicate keys or overwrites in persisted state.

**Fix:** For local-only IDs this is acceptable; if you want to harden, use `crypto.randomUUID()` (or a short hex from `crypto.getRandomValues`) where available.

---

### 7. **localStorage JSON parsing without schema**

**Files:** `src/services/securePaymentAgent.ts` (audit log, daily spent), `src/services/dna/xdnaMetering.ts`, `src/services/ilp/carDecisionLog.ts`, `src/services/ilp/timeSeriesReplay.ts`

**Issue:** Data from `localStorage` is `JSON.parse()`’d and used (or spread) without validating shape. If an attacker can write to localStorage (e.g. via XSS), they could inject large payloads (DoS) or odd structures. No evidence of prototype pollution in current usage, but spreading parsed objects into state is a common vector.

**Fix:** Validate parsed structure (required fields, types, max array length) before use; avoid blindly spreading untrusted objects into state.

---

### 8. **Unused parameter in `getCurrentLedger`**

**File:** `src/services/xaman/initiatePayment.ts`  
**Function:** `getCurrentLedger(_network: 'mainnet' | 'testnet' = 'mainnet')`

**Issue:** `_network` is never used. If the implementation is supposed to switch RPC by network, it’s a logic bug (mainnet/testnet not distinguished).

**Fix:** Either use `_network` to select the appropriate RPC/endpoint for `getServerInfo()`, or remove the parameter and document that ledger is always from the default network.

---

## Positive findings

- **XSS:** No `dangerouslySetInnerHTML` with user input. `innerHTML` use is limited to static fallback (main.tsx) and clearing a Three.js container (PortfolioArena) — both safe.
- **Address validation:** `isValidXRPLAddress` is used before fetching wallet data and in wallet store.
- **Env:** `VITE_*` usage is guarded with `typeof import.meta.env.* === 'string'` where checked.
- **CSP:** `vercel.json` sets a strict Content-Security-Policy.
- **Xaman:** API key stored in localStorage is a known tradeoff; not exposing secret in browser is correct.

---

## Summary

| Severity | Count | Suggested priority |
|----------|--------|---------------------|
| High    | 2     | Fix before production (Buffer crash, Xaman Account override) |
| Medium  | 3     | Fix soon (state mutation, reputation validation, bridge response validation) |
| Low     | 3     | Hardening / tech debt |

**Recommended order:** Fix **#1 (Buffer)** and **#2 (Xaman Account)** first, then **#3** and **#4**, then **#5** and the low-severity items as capacity allows.
