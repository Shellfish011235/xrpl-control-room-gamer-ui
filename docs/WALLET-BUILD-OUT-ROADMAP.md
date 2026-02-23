# Wallet Build-Out Roadmap

Plan for building out the wallet experience in the Control Room Gamer UI: in-app wallet (session-only), UX improvements, and security boundaries.

---

## Current State

- **Connect-only:** Users add wallets by **provider** (Xaman, Joey, Bifrost, Ledger/Direct, etc.) and **address**. The app fetches balance and tokens from the XRPL; it does not hold keys.
- **Signing:** Real transactions are signed via **Xaman** (Xumm SDK). The app builds payloads and opens a signing request; the user approves in the Xaman app.
- **Store:** `walletStore` holds `ConnectedWallet[]` (address, provider, label, balance, tokens). No seeds or private keys are stored.

---

## Phase 1: In-App “Control Room” Wallet (Session-Only)

**Goal:** Users can create or import a wallet **in the browser** and sign transactions **locally** during the session—no Xaman required for that wallet.

| Item | Description |
|------|-------------|
| **Generate** | New wallet via `xrpl.Wallet.generate()`. Show address and **backup warning** (save seed; session-only). |
| **Import** | Paste secret (seed) → `Wallet.fromSeed()` → use for signing. Seed kept in **memory only**. |
| **Storage** | **No persistence of seed.** Wallet instance lives in module memory; lost on refresh. User must re-import or re-create. |
| **Signing** | When active wallet is “Control Room Wallet,” sign with `wallet.sign()` and submit via existing RPC. No Xaman flow. |
| **Provider** | New provider `control-room` in `walletStore` and WalletConnect UI. |

**Security:** Aligns with “no seed in frontend” by not persisting. Session-only is the safest in-browser option; we document that the key exists in memory and is lost on refresh.

**Reference:** Official xrpl.js (XRPLF), `docs/XRPL-WALLET-SECURITY-AND-REPOS.md`.

---

## Phase 2: Optional Encrypted Persistence (Future)

- **Password-lock:** User sets a passphrase; we encrypt seed (e.g. WebCrypto) and store ciphertext in localStorage.
- **Unlock:** On load or “Unlock wallet,” decrypt to memory only; use for signing; never expose seed to UI.
- **Risks:** XSS could steal key when unlocked; document and consider “session-only only” as default.

---

## Phase 3: Wallet UX Improvements

- **Unified wallet page:** Single “Wallet” or “Profile → Wallets” view: list, add, remove, set default, refresh, show balance/tokens.
- **Tokens & NFTs:** Show trust lines and NFT count per wallet (already in `ConnectedWallet`; surface in UI).
- **History:** Optional link to xrpscan or in-app tx history for the active address.
- **Xaman API key:** Inline entry on Paper Trading (Live) when missing, so users don’t leave the page.

---

## Implementation Order

1. **Phase 1** – `localWalletService` (generate, import, sign, session-only), `control-room` provider, WalletConnect “Create / Import Control Room Wallet,” and signing path for Paper Trading (and Terminal if desired) when active wallet is Control Room.
2. **Phase 2** – Only if needed; document risks.
3. **Phase 3** – Iterate on UX using existing store and APIs.

---

## Security Checklist (Phase 1)

- [ ] Seed/secret never written to localStorage, sessionStorage, or any disk.
- [ ] Wallet instance only in module memory; cleared on refresh or “Lock”.
- [ ] Backup warning shown on create; user urged to save seed offline.
- [ ] Import flow warns that pasting seed in the browser is a risk; prefer hardware or Xaman for large holdings.
- [ ] Signing uses official xrpl.js; pin version and follow `docs/XRPL-WALLET-SECURITY-AND-REPOS.md`.
