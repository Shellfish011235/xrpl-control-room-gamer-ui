# XRPL Control Room — Redesign Spec

**Goal:** Turn the overloaded dashboard into a clean, focused, professional-yet-gamer control room: high-end trading terminal / sci-fi cockpit.

**Principles:** Strong hierarchy, progressive disclosure, HUD aesthetic, mobile-responsive (desktop-first), reduced cognitive load, MVP flow: balances → send/receive → simple DEX.

---

## 1. High-level layout structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│  TOP BAR (fixed)                                                        │
│  [Logo/Title]  [Network: Testnet ▼]  [Wallet: rAbc…xyz 🔒]  [Alerts]   │
├────────────┬────────────────────────────────────────────────────────────┤
│            │                                                            │
│  SIDEBAR   │  MAIN CONTENT                                              │
│  (narrow)  │  — Primary view changes by "mode" or section               │
│            │  — One primary action area at a time                       │
│  • Home    │  — Cards with clear hierarchy                              │
│  • Wallet  │                                                            │
│  • Trade   │                                                            │
│  • Offers  │                                                            │
│  ───────   │                                                            │
│  • Tools   │                                                            │
│  • Settings                                                             │
│            │                                                            │
└────────────┴────────────────────────────────────────────────────────────┘
```

- **Top bar:** Identity, network badge, wallet summary (address + lock state), global alerts. Stays visible; minimal height (~3rem).
- **Sidebar:** Icon-first nav (optional short labels on desktop). 4–6 primary items; "Tools" / "More" as overflow. No nested menus in MVP.
- **Main content:** Single primary focus per "page" (Wallet view, Trade view, Offers view). No competing panels; secondary actions in cards or one level deeper.

**Alternative (no sidebar):** Top nav tabs: **Wallet | Trade | Offers | Tools**. Main content full-width. Good for mobile-first.

**Recommendation:** Sidebar on desktop (≥1024px), bottom or top tab bar on mobile.

---

## 2. Component breakdown & tab/section organization

### Primary sections (always reachable)

| Section   | Purpose                    | Main content                          | Secondary (hidden until needed)     |
|----------|----------------------------|----------------------------------------|-------------------------------------|
| **Wallet**| Balances + send/receive   | Balance hero, Send XRP card, Receive (address + copy) | Token send, Trust lines, History   |
| **Trade** | DEX in one place          | One card: Limit order form (buy/sell, amount, price, Place) | Order book preview, Last fills     |
| **Offers**| Open orders + cancel      | List of open offers; Cancel per row   | Empty state CTA "Place order in Trade" |

### Moved off main screen (progressive disclosure)

- **Unlock / Import / Seed management** → Dedicated **Lock screen** or **modal** when wallet is locked. One flow: "Unlock" or "Import seed" (password + seed). No wallet actions visible until unlocked.
- **Network toggle** → Top bar dropdown (Testnet / Mainnet). One place only.
- **TrustSet (trust lines)** → Inside Wallet: collapsible "Trust lines" or "Add trust line" button → modal/sheet.
- **Token send** → Wallet section: "Send" expands or tab: "XRP" | "Token" (currency/issuer/amount).
- **Order book, bot alerts, NFT gallery** → Future: separate routes or "Tools" sub-pages.

### Suggested nav items (sidebar or top tabs)

1. **Home / Dashboard** — Optional: single "at a glance" card (balance + network + last action). Or skip and land on Wallet.
2. **Wallet** — Balances, Send, Receive (primary).
3. **Trade** — Single DEX limit-order form (primary).
4. **Offers** — Open offers list + cancel (primary).
5. **Tools** — Links to Ledger Impact, Builder, Agents, etc. (existing tools hub).
6. **Settings** — Network preference, lock timeout, clear wallet, theme. Rarely used.

---

## 3. Wireframe-style description of main screens

### Screen A: Locked state (gate)

- **Full-screen or centered card.**
- Logo / "Control Room" title.
- One input: **Password**.
- Two buttons: **Unlock** (if saved seed exists) | **Import seed** (opens inline or modal: seed field + password → Encrypt & unlock).
- Short line: "No wallet? Import a seed (s...) to start."
- No sidebar nav except "Settings" or "About." Rest of app hidden until unlocked.

### Screen B: Wallet (unlocked) — main view

- **Top:** Small wallet strip: `rAbc…xyz` [Copy] [Lock].
- **Hero card (primary):**
  - Big number: **X.XX XRP** (with optional USD equiv).
  - Below: **Trust lines** as chips or one line: "USD (rIssuer…), RLUSD (r…)" or "3 tokens" with expand.
- **Actions (two cards or one card with two areas):**
  - **Send:** Destination (r...), Amount (XRP), [Send]. Optional: "Send token" link → expands or modal.
  - **Receive:** Address (read-only) + [Copy]. Optional: QR in modal.
- **Secondary:** "Add trust line" link/button → modal. No other forms on this view.

### Screen C: Trade — single card

- **One card: "Limit order"**
  - Toggle or tabs: **Sell XRP** | **Buy XRP**.
  - Fields: Amount (XRP), Token (currency + issuer), Price or token amount (one of the two).
  - [Place order].
  - One line status below (success hash or error). No long log.
- **Link:** "View open offers →" to Offers section.

### Screen D: Offers — list only

- **Title:** "Open offers."
- **List:** Each row = Offer seq, Gets/Pays (short form), [Cancel].
- **Empty state:** "No open offers. Place one in Trade."
- **Refresh** in header or subtle button.

### Screen E: Tools (existing hub)

- Keep current Tools hub (Ledger Impact, Builder, Agents, etc.) as one page. No wallet-specific UI here; wallet is in Wallet / Trade / Offers.

---

## 4. Color palette & typography

### Palette (cyberpunk / neon HUD)

- **Background:** Dark base. `#0a0e17` (darker) or `#0f172a` (slate-900). Cards: `#1e293b` or `#0f172a` with border.
- **Surface/cards:** Slightly lighter than bg, border `rgba(cyan/green, 0.2)`.
- **Primary accent (actions, links):** Cyan `#22d3ee` or electric blue `#00d4ff`. Use for primary buttons, key labels.
- **Success / on:** Green `#22c55e` or `#16a34a`. Balances, success toasts, "unlocked."
- **Warning / pending:** Amber `#f59e0b`. Pending offers, caution text.
- **Error / danger:** Red `#ef4444` or `#dc2626`. Errors, cancel, lock.
- **Muted text:** `#94a3b8` (slate-400). Secondary labels, hints.
- **Text primary:** `#f1f5f9` or `#e2e8f0`.

**Glows:** Use `box-shadow` for key states: e.g. `0 0 12px rgba(34, 211, 238, 0.3)` for focused/active card. Green glow for success, red for error.

### Typography

- **Headings / numbers:** Monospace or "cyber" font (e.g. JetBrains Mono, Orbitron, or your existing font-cyber). Uppercase for section titles.
- **Body:** Sans (e.g. Inter, system-ui). Keep readable for amounts and addresses.
- **Scale:** One size up for balance (text-2xl or 3xl), smaller for labels (text-xs). Clear contrast between primary and secondary info.

---

## 5. Prioritized feature list

### On main screen (visible by default when unlocked)

- **Wallet:** Balance (XRP + tokens summary), Send XRP (dest + amount), Receive (address + copy).
- **Trade:** One limit-order form (buy/sell, amount, token, place).
- **Offers:** List of open offers + Cancel.

### Hidden until needed (modal, drawer, or secondary page)

- Unlock / Import seed / encrypted seed management → **Lock screen or modal.**
- Network toggle → **Top bar dropdown.**
- TrustSet (add trust line) → **Button in Wallet** → modal/sheet.
- Token send → **"Send token"** in Wallet → expand or modal.
- Order book, bot alerts, NFT gallery → **Tools or future routes.**

### Removed from primary flow (or single place)

- Duplicate "Wallet" and "Trade" panels merged into one Wallet + one Trade view.
- Long status logs replaced by one-line status + toasts.
- Repeated network selector → only in top bar.

---

## 6. Key screens/flows (3–5)

1. **Locked → Unlock**
   - User opens app → sees Lock screen (password or Import seed).
   - Enters password → Unlock → redirect or transition to **Wallet** view. Top bar shows address + Lock.

2. **Wallet → Send**
   - User on Wallet view → fills Destination + Amount → Send → loading state on button → toast "Sent. Tx: …" and balance updates (or refresh).

3. **Wallet → Receive**
   - User on Wallet view → sees address + Copy → copies and shares. No form.

4. **Trade → Place order**
   - User opens Trade → selects Sell or Buy → fills amount, token, price → Place order → status under button → toast "Offer placed" → link to Offers.

5. **Offers → Cancel**
   - User opens Offers → sees list → Cancel on one offer → confirm if desired → status + toast → list refreshes.

---

## 7. Tailwind / implementation ideas

### Utility classes (align with existing cyber-* if present)

- **Cards:** `rounded-xl border border-cyber-border bg-cyber-darker/50` or `bg-slate-900/80 border-slate-700`.
- **Primary button:** `bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/30`.
- **Danger:** `border-red-500/40 text-red-400 hover:bg-red-500/10`.
- **Glow:** `shadow-[0_0_15px_rgba(34,211,238,0.25)]` for active card.
- **Muted:** `text-slate-400`, `text-cyber-muted`.

### Components to standardize

- **Status pill:** Network (Testnet/Mainnet), Lock state (Locked/Unlocked). Small, right side of top bar.
- **Balance hero:** One large number (XRP) + optional USD; below, token chips or "N tokens" with expand.
- **Action card:** Title (e.g. "Send XRP"), 2–4 inputs, one primary button, one line status. No extra buttons.
- **List row:** Offer row: left (Gets/Pays), right [Cancel]. Use consistent row height and hover state.
- **Toast:** Success (green), Error (red), Info (cyan). 3–4 sec, bottom-right or top-center.

### Layout (Tailwind)

- **Top bar:** `fixed top-0 left-0 right-0 z-50 h-12 px-4 flex items-center justify-between bg-slate-900/95 border-b border-slate-700`.
- **Sidebar:** `w-14 lg:w-48 border-r border-slate-700 flex flex-col pt-14` (icons only on small, labels on large).
- **Main:** `pt-12 pl-14 lg:pl-48 p-4 max-w-4xl mx-auto` (or full-width for trade).
- **Mobile:** Sidebar becomes bottom nav or top tabs; main content full width.

### Animation (Framer Motion already in use)

- Page transition: `initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}`.
- Card hover: slight scale or glow increase.
- Lock → Unlock: fade out lock screen, fade in Wallet (or slide).

---

## Summary checklist

- [ ] Single **Lock screen** when wallet locked; no other wallet UI visible.
- [ ] **Top bar:** Network dropdown, wallet address + Lock, minimal.
- [ ] **Wallet** view: Balance hero, Send card, Receive card; Trust + token send behind one extra step.
- [ ] **Trade** view: One limit-order card; link to Offers.
- [ ] **Offers** view: List + Cancel only; empty state CTA to Trade.
- [ ] **Tools** stays as hub; no duplication of wallet/trade there.
- [ ] One-line status per action; toasts for success/error.
- [ ] Consistent cyber palette + glows; monospace for numbers/addresses.
- [ ] Sidebar or top tabs for Wallet / Trade / Offers / Tools; mobile bottom or tabs.

This spec is ready to drive a phased refactor: implement Lock screen and top bar first, then Wallet view, then Trade, then Offers, then move advanced features into modals/secondary pages.
