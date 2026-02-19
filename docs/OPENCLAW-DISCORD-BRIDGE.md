# OpenClaw + Discord Bridge — Agentic XRPL Economy

This doc describes how to connect your **running OpenClaw instance** (already on Discord) to the **XRPL Control Room Gamer UI** so that:

- The dashboard is **mission control**: post bounties, see live Discord activity, reputation, and XRPL settlement.
- OpenClaw is the **worker**: reads bounties from Discord, executes tasks (ledger analysis, Memetic Lab sims, etc.), and settles in XRP via micropayments.

---

## Architecture

```
┌─────────────────────┐     Discord      ┌──────────────────────┐
│  XRPL Control Room  │ ◄──────────────► │  OpenClaw (your      │
│  Dashboard (React)  │   #xrpl-bounties │  local + Discord)    │
└──────────┬──────────┘                  └──────────┬──────────┘
           │                                          │
           │ VITE_DISCORD_BRIDGE_URL                   │ skills:
           │ (optional proxy)                          │ - XRPL micropay
           ▼                                          │ - ledger / sims
┌─────────────────────┐                                ▼
│  Bridge backend    │                    ┌──────────────────────┐
│  (Node/Next/…)     │                    │  XRPL (testnet/      │
│  - Discord.js bot  │                    │  mainnet)            │
│  - POST /api/      │                    │  BOUNTY-[id]-complete│
│    bounty/post     │                    │  memo → dashboard    │
│  - GET /api/       │                    └──────────────────────┘
│    discord/activity│
└─────────────────────┘
```

- **Dashboard** calls `postBounty()` and `fetchDiscordActivity()` from `discordBridgeService.ts`. If `VITE_DISCORD_BRIDGE_URL` is set, it uses your proxy; otherwise it uses **mock data** so the Bounty Board and feed still work.
- **Bridge backend** (you run it): Discord.js bot that joins `#xrpl-bounties`, posts messages when the dashboard posts a bounty, and returns recent messages as “activity” for the dashboard. It must **never** hold XRPL secret keys; use Xaman sign or a separate secure signer for payouts.

---

## 1. Dashboard side (this repo)

Already implemented:

- **Agent Economy → Bounties tab**: Bounty list, “Post bounty” modal, live Discord-style feed, reputation (completed count + XRP earned).
- **Discord bridge client** (`src/services/discordBridgeService.ts`): `postBounty()`, `fetchDiscordActivity()`, `sendAgentCommand()`. With no env set, uses mock data.
- **Store** (`src/store/bountyStore.ts`): Bounties, Discord activity list, reputation.

**Env (optional):**

- `VITE_DISCORD_BRIDGE_URL` — base URL of your bridge (e.g. `http://localhost:3001` or your deployed backend). No trailing slash.

---

## 2. Bridge backend (you add this)

Run a small Node server (or Next.js API routes) that:

1. **Discord.js bot** with intents: `Guilds`, `GuildMessages`, `MessageContent`. Log in with `DISCORD_BOT_TOKEN`.
2. **Channel**: Create or use a channel (e.g. `#xrpl-bounties`). Remember its `channelId`.
3. **Endpoints**:
   - `POST /api/bounty/post` — body `{ title, description, rewardXRP, channelId? }`. Bot sends a message to that channel, e.g. `BOUNTY: [title] REWARD: [rewardXRP] XRP` and optional body. Return `{ bountyId, discordMessageId }`.
   - `GET /api/discord/activity?limit=50` — return last N messages from the channel (and optionally bounties parsed from them) as `{ activity: DiscordActivityItem[], bounties?: Bounty[] }`.
   - `POST /api/discord/command` — body `{ command }`. Optional: DM the OpenClaw user or post in channel so the agent sees it.

**Message format (convention):**

- Bounty post: `BOUNTY: [title] REWARD: [X] XRP` (and description in next line or embed).
- Agent accept: `ACCEPTING – executing` (and optional bounty id).
- Agent complete: `BOUNTY-[id]-complete` (and optionally tx hash in next line or memo).

Your OpenClaw agent can parse these and post replies; the bridge just needs to return the same shape as `DiscordActivityItem` (id, type, authorName, content, timestamp, bountyId?, txHash?).

---

## 3. OpenClaw side (your running instance)

- **Channel**: Point OpenClaw at the same `#xrpl-bounties` (or DM) so it sees bounty posts and can reply with ACCEPTING / BOUNTY-*-complete.
- **Skills**:
  - **XRPL / ledger**: Use `xrpl.js` or call your dashboard’s backend (e.g. ledger analysis, pathfinding). No secrets in OpenClaw; call read-only APIs or trigger Xaman sign via a payload URL.
  - **Micropayment**: Prefer **Xaman (Xumm) sign flow** — OpenClaw requests a sign payload (e.g. from your bridge or dashboard API), you approve on phone; tx is submitted and memo set to `BOUNTY-[id]-complete`. Alternative: a tiny **secure signer service** (encrypted key, only signs for bounty payouts) that OpenClaw calls over localhost with a signed token.

See `docs/openclaw-xrpl-micropay.skill.example.md` for a skill template.

---

## 4. XRPL settlement and dashboard

- When the agent completes a bounty, it sends XRP (e.g. to the bounty poster or a shared wallet) with memo `BOUNTY-[id]-complete`.
- Your **bridge** can subscribe to the platform fee wallet (or a dedicated “bounty settlement” wallet) and map incoming txs + memos to `bounty_complete` activity items with `txHash` and `bountyId`. Then `GET /api/discord/activity` returns them and the dashboard shows the **celebration toast** and updates **reputation**.

If you don’t have a bridge yet, the dashboard still works with mock data and local bounties; when you add the bridge and OpenClaw posts `BOUNTY-[id]-complete` (or the bridge parses it from Discord), the same celebration and reputation logic will apply.

---

## 5. Quick tests

1. **No bridge**: Open Agent Economy → Bounties. You should see mock bounties and a “Demo mode” note. Post a bounty — it’s stored locally.
2. **With bridge**: Set `VITE_DISCORD_BRIDGE_URL`, run your bridge, then Post bounty — the bot should post in Discord and OpenClaw can reply.
3. **OpenClaw**: Manually send in Discord: `ACCEPTING – executing` and later `BOUNTY-bounty-xxx-complete` (and tx hash if you have it). Bridge returns these as activity; dashboard shows them in the feed and, for complete, shows the neon toast.

---

## Security

- **No seeds/keys in OpenClaw or the dashboard.** Use Xaman for user/agent-initiated payments.
- **Bridge**: Only post/read Discord and optionally build Xaman payloads; do not hold a funded wallet unless it’s a dedicated, locked-down signer with strict rules.
- **Testnet first**: Use XRPL testnet for all dev payouts; switch to mainnet only when compliant and legal.

---

*Last updated: 2026-02. See also OpenClaw docs and your Discord server setup.*
