# How to Build Your Own Polymarket Clawdbot — $1,000 Per Day Strategy

**Bookmark this page so you don't lose it.**

This is a complete A–Z breakdown of how automated OpenClaw systems compound small probabilistic edges into daily income. It is **educational only** — not financial advice. Automated prediction-market trading is risky; you can lose money. Use small size, test first, and proceed at your own risk.

---

## Proof (what’s possible)

- One Polymarket wallet crossed **$350,000** in profit using short-duration automated execution ([example](https://polymarket.com/@0x1d0034134e)) — on the order of **$142K/week** on 5‑minute BTC rounds.
- Another wallet did **~$30,000 in 30 days** on **weather contracts** only (temperature brackets): e.g. $10→$5,000, $3→$1,400, $30→$6,000.
- Smaller examples: **$10→$1,000** in 7 days with a Clawdbot on 5‑minute BTC markets.

The edge is **not** genius forecasting. It’s **structure**: execution speed, rules, sizing, and repetition.

---

## Why most traders fail (and bots don’t)

| Most traders | Bots |
|--------------|------|
| Click manually | Execute instantly |
| Chase narratives | Follow predefined rules |
| Enter late | Size mechanically |
| Size emotionally | Repeat without fatigue |

**Clawdbot isn’t about prediction. It’s about structure.**

---

## Requirements

- **VPS** (24/7) — bot must stay online and react fast.
- **OpenClaw Bot** — [OpenClaw](https://openclaw.ai) / [docs](https://docs.openclaw.ai/start/getting-started).
- **Telegram** — commands, alerts, start/stop.
- **ChatGPT Plus** (or similar) — AI layer for strategy logic.
- **Simmer SDK account** — [simmer.markets](https://simmer.markets): agent wallet, Polymarket/Kalshi API, safety rails, ready-made skills.

---

## Setup (steps 1–12)

### 1. Hosting (24/7)

- Use a **VPS** (e.g. Ubuntu 22.04 or Windows Server). The bot must not depend on your laptop or Wi‑Fi.
- Example provider (among many): [ishosting.com](https://ishosting.com) — minimal specs are enough.

### 2. Connect to VPS

- **Windows:** Remote Desktop (RDP) → server IP, login.
- **Mac:** Microsoft Remote Desktop app → Add PC → server IP, credentials.

### 3. Install software on VPS

- **Python** 3.10+ ([python.org](https://python.org))
- **Git** ([git-scm.com](https://git-scm.com)) (optional)
- **Node.js** ([nodejs.org](https://nodejs.org)) if using JS version

### 4. Install Clawdbot

**Windows (PowerShell):**

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

**Mac/Linux:**

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

- Wait 1–10 minutes. Confirm security prompt. Choose **Quickstart** for base setup.

### 5. Connect AI model

- Log into **ChatGPT** (Plus). OpenAI access is used to generate/refine strategy logic. Clawdbot handles execution; the model handles intelligence.

### 6. Connect Telegram

- In Telegram, open **@BotFather** → `/newbot` → name + username (must end with `bot`). Copy the **Bot Token**.
- Paste token into the Clawdbot installer when prompted. **Do not share the token.**
- Verify: `openclaw pairing approve telegram <pairing code>` so the bot works on Telegram.

### 7. Simmer account

- Go to [simmer.markets](https://simmer.markets), sign up (e.g. Google).
- **Wallet → Agent Wallet**: create/fund with **USDC.e (Polygon)** and **POL** (gas). Send on **Polygon** only.
- ~$50 is enough to test.

### 8. Connect Clawdbot to Simmer

- Simmer → **Agent** → **Overview** → **Manual** → copy the generated command.
- Send that command to your Clawdbot in Telegram. Follow [simmer.markets/skill.md](https://simmer.markets/skill.md) to join Simmer. The bot replies with a link to your agent.

### 9. Choose a trading skill

Install and configure **one** skill via Telegram (examples):

| Skill | Best for | Install command |
|-------|----------|------------------|
| **Polymarket Weather Trader** | Beginners; slower, smaller size | `clawhub install polymarket-weather-trader` |
| **Polymarket Fast Loop** | 5/15‑min BTC; high frequency | `clawhub install polymarket-fast-loop` |
| Polymarket Copytrading | Mirror top wallets | (see Simmer/OpenClaw docs) |
| Polymarket Signal Sniper | RSS/news triggers | (see Simmer/OpenClaw docs) |
| Mert Sniper | Near-expiry conviction | (see Simmer/OpenClaw docs) |

**Beginner-friendly:** start with **Polymarket Weather Trader** (slower markets, smaller positions, easier to understand).

### 10. Example configs (send to bot in Telegram)

**Weather (conservative):**

- Entry threshold: 15% (buy below)
- Exit threshold: 45% (sell above)
- Max position: $2.00
- Locations: NYC, Chicago, Seattle, Atlanta, Dallas, Miami
- Max trades per run: 5
- Safeguards: On. Trend detection: On. Scan: every 2 minutes.

**5‑minute BTC (aggressive):**

- Markets: BTC 5‑min
- Strategy: Price deviation arbitrage
- Entry: real price moves 0.5%+
- Position size: $5; max positions: 3
- Stop loss: -$3 per trade; daily limit: -$50
- Scan: every 5 seconds; exit 15 seconds before close.

### 11. Alternative: 15‑minute assistant (no full auto)

- **BTC 15‑min Trading Assistant** (e.g. by @krajekis): terminal-based **decision support** (RSI, MACD, Heikin Ashi, VWAP, Binance–Polymarket spread, liquidity). You decide; the tool compresses the information. Good if you want structure without full automation.

### 12. $1,000/day target (structure, not magic)

- **Reality:** Not “click and print.” Requires capital, infra, discipline, and risk rules.
- With **$15k–$25k** and a **consistent 3–6% structured daily** return, ~$1,000/day is **mathematically possible** — not guaranteed.
- **Risk rules:** Max daily drawdown 3–5%; stop after 3 consecutive losses; no size increase after red days; scale only after sustained green performance.
- **Edge:** Small statistical advantages + high execution frequency + strict downside control + no emotion in the loop.

---

## How this ties to the Control Room repo

This dashboard (xrpl-control-room-gamer-ui) already gives you:

- **Polymarket data** — `src/services/predictionMarkets.ts`; Memetic Lab prediction markets + signals.
- **Quant formulas** — `src/services/predictionMarketQuant.ts`: Monte Carlo probability, standard error, Brier score, ESS, edge check. Use them so you don’t trade like a biased coin. See **Memetic Lab → AI-Powered Quantum Analytics → “4 Quant Formulas”**.
- **Telegram** — Alerts (Terminal → Alerts → Settings); optional agent-reply forward (Secure Payment Agent).
- **OpenClaw / agent UI** — Builder Agent (Tools → Builder); agent economy and bounties (see [OPENCLAW-DISCORD-BRIDGE.md](./OPENCLAW-DISCORD-BRIDGE.md)).

You can use the dashboard to **analyze** Polymarket and **track** your edge (Brier, SE, your p vs market); the **Clawdbot** (on a VPS with OpenClaw + Simmer) does **automated execution** on Polymarket. Structure in both places.

---

## Risk disclosure & DYOR

- **No guarantees.** Past performance of example wallets is not a guarantee of future results.
- **Capital at risk.** You can lose your entire deposit. Only use money you can afford to lose.
- One emotional or config mistake can wipe out weeks of gains.
- **Not financial advice.** This guide is for education and mechanics only.
- **Do your own research (DYOR).** Build your own system. Control your own risk.

---

## Links

- [OpenClaw](https://openclaw.ai) — install & docs
- [OpenClaw Getting Started (Windows)](https://docs.openclaw.ai/start/getting-started#windows-powershell)
- [Simmer](https://simmer.markets) — agent wallet, Polymarket/Kalshi, skills
- [Simmer skill.md](https://simmer.markets/skill.md) — join flow
- [Polymarket](https://polymarket.com) — prediction markets
- In this repo: [predictionMarketQuant.ts](../src/services/predictionMarketQuant.ts), [QuantFormulasCard](../src/components/QuantFormulasCard.tsx), [OPENCLAW-DISCORD-BRIDGE.md](./OPENCLAW-DISCORD-BRIDGE.md)
