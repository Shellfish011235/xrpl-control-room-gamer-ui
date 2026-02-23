# XRPL Wallet Building: Official Repos, Exploits, and Security Protocols

This document consolidates **official GitHub repositories**, **reported code exploits**, and **recommended security protocols** for building non-custodial XRPL wallets and signers (e.g. for the Control Room Gamer UI). Use it when choosing dependencies, auditing supply chain risk, and aligning with community best practices.

---

## 1. Official and Recommended GitHub Repositories

**Priority:** Prefer official and audited repos. The **GitHub source** is the trusted reference—npm/registry can be compromised while the repo stays clean (see xrpl.js 2025 incident below).

### XRPL Foundation (XRPLF) – Core

| Repo | Purpose | GitHub | Notes |
|------|---------|--------|--------|
| **xrpl.js** | JavaScript/TypeScript – keys, signing, DEX, AMM, web/React | https://github.com/XRPLF/xrpl.js | Primary lib for browser/React UIs. Use **v4.2.5+** post-2025 exploit. Docs: https://js.xrpl.org/ |
| **xrpl-py** | Python – keys, serialization, signing | https://github.com/XRPLF/xrpl-py | For backend or desktop wallet components. |
| **rippled** | Core ledger/server implementation | https://github.com/XRPLF/rippled | Reference for protocol and tx formats; not required for client wallet. |
| **xrpl-dev-portal** | Source for XRPL docs, tutorials, samples | https://github.com/XRPLF/xrpl-dev-portal | Fork/adapt code samples; follow official tutorials. |

### Community / Wallet Connection & Examples

| Repo | Purpose | GitHub | Notes |
|------|---------|--------|--------|
| **xrpl-wallet** (TEQU) | Wallet connection standard; multiple signers (local, Xaman fallback) | https://github.com/tequdev/xrpl-wallet | Modular signer support; avoid single-provider lock-in. |
| **xrpl-connect** (XRPL Commons) | Framework-agnostic wallet connection toolkit | https://github.com/XRPL-Commons/xrpl-connect | Seamless wallet connect in apps. |
| **wallet-desktop** (MorganBergen) | Full desktop wallet example (Python/xrpl-py) | https://github.com/MorganBergen/wallet-desktop | Reference for complete wallet flow. |
| **awesome-xrpl** | Curated list of XRPL projects, tools, wallets | https://github.com/wojake/awesome-xrpl | Links to XUMM/Xaman integrations and wallet projects. |

### Security Tie-In

- **All XRPLF repos** are the canonical source; npm compromise did **not** affect GitHub code.
- **Best practice:** Clone from GitHub → build locally → verify tags/commits against official releases before using in production.
- For this project: signing is delegated to **Xaman** (user signs in external app); we use **xrpl.js** (or Xumm SDK) for tx building and submission only—no key generation or seed handling in our UI.

---

## 2. Known Code Exploits and Incidents

### 2.1 xrpl.js Supply Chain Attack (April 2025)

- **What:** Malicious versions of **xrpl.js** were published to **npm**. The malicious package could exfiltrate keys/seeds. The **GitHub repository** was **not** compromised.
- **Lesson:** Prefer installing from **GitHub tarball** or **pinned version** with a verified commit hash. Avoid blind `npm install xrpl` without version/checksum verification.
- **Action:** Use **xrpl.js v4.2.5 or later** (or current stable); pin version and, if possible, verify against the XRPLF GitHub release.

### 2.2 DropFiWallet Security Flaw and Community Backlash

- **What:** DropFiWallet (Chrome extension) was called out for serious security flaws (e.g. extension safety, key handling, or permission scope). The XRPL community responded strongly.
- **Lessons:**
  - **Go open-source:** Public code on GitHub allows community review and trust.
  - **Minimize permissions:** Request only the minimum (e.g. no broad “read all data”).
  - **No custody / no key storage in app:** Prefer “connect wallet” or “sign in Xaman” over holding keys in your own extension or site.
  - **Transparency:** Document what the app does with user data and keys; respond to public criticism with fixes and clarity.

**How this project aligns:** Non-custodial; no seeds or keys in the app; real value moves only after user signs in Xaman. See `SECURITY-VULNERABILITY-CHECK.md` and `docs/OPEN-SOURCE-SAFETY.md`.

---

## 3. Recommended Security Protocols (Checklist)

Use this when building or auditing wallet/signer flows:

| Area | Recommendation |
|------|-----------------|
| **Dependencies** | Prefer official XRPLF repos; pin versions; verify hashes/tags against GitHub releases. |
| **Keys / seeds** | Never store seeds or raw keys in frontend or extension; use WalletConnect/Xaman or client-side Wallet only in trusted, audited flows. |
| **Signing** | All real-value transactions require explicit user sign (e.g. Xaman); no silent or auto-sign of payments/offers. |
| **Network** | Connect only to trusted WSS endpoints (e.g. wss://xrplcluster.com); document egress. |
| **Secrets in frontend** | No server-only secrets in `VITE_*` or bundle; Xaman API key is client credential—document scope. See `SECURITY-VULNERABILITY-CHECK.md`. |
| **localStorage** | Do not trust client/localStorage for auth or spend limits; server must enforce if needed. |
| **Open-source** | Publish repo early for community review; address reported issues and document mitigations. |
| **Supply chain** | After any incident (e.g. xrpl.js), re-check dependency tree and upgrade to patched versions. |

---

## 4. Chris Dangerfield’s Udemy Course (Blockchain Development: XRP Ledger Bootcamp)

- Chris Dangerfield is a senior XRPL dev (XRPL365, community work). His Udemy course covers wallet basics, signing, payments, and ReactJS code-along.
- **Repos:** His personal GitHub (e.g. chrisdangerfield) and xrpl365 (https://github.com/xrpl365) may not include course code; course materials may provide their own repos or starter code.
- **Use with this doc:** Prefer **official xrpl.js** examples and https://xrpl.org/docs/tutorials/javascript/ to supplement the course. When the course references a library, cross-check with the XRPLF repo list above and use secure install practices (pin version, verify source).

---

## 5. How This Project Uses These Repos and Protocols

- **Signing:** Xaman (Xumm SDK) for real trades; no in-app key generation or seed handling for mainnet.
- **Libraries:** xrpl.js (or equivalent) for tx building and ledger queries; version pinned and sourced from trusted registry/GitHub.
- **Non-custodial:** No platform fees; no custody of user funds; see `docs/OPEN-SOURCE-SAFETY.md` and `docs/COMPLIANCE-CHECKLIST.md`.
- **Security:** Client treated as untrusted; security headers (CSP etc.) in `vercel.json`; see `SECURITY-VULNERABILITY-CHECK.md` and `docs/threat-model.md`.

When adding new wallet or signing features, revisit this doc and the official repos; keep dependencies minimal and traceable to GitHub.
