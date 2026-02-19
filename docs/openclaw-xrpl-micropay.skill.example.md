# OpenClaw skill example: XRPL Micropay (bounty payout)

Use this as a template for a custom skill in your OpenClaw instance so the agent can trigger XRPL bounty payouts without holding keys.

---

## Option A: Xaman (recommended)

Agent does **not** sign. It calls your bridge or dashboard API to create a **Xaman sign request**; you (or the bounty poster) approve on phone; the tx is submitted with memo `BOUNTY-[id]-complete`.

**Skill (pseudo):**

```yaml
name: XRPL Bounty Payout
description: Request a XRP payment with memo BOUNTY-{id}-complete (via Xaman).
tools:
  - name: requestBountyPayout
    prompt: |
      To pay {amountXRP} XRP to {destination} with memo "BOUNTY-{bountyId}-complete".
      Call the bridge API to create a Xaman sign request; do not hold or use private keys.
    execute: |
      POST {{VITE_DISCORD_BRIDGE_URL}}/api/xrpl/request-sign
      Body: { "amountXRP", "destination", "memo": "BOUNTY-{bountyId}-complete", "agentId": "openclaw" }
      Returns: { signUrl, payloadId } — user opens signUrl on phone to approve.
```

Your bridge then:

1. Builds a Payment tx (amount, destination, memo).
2. Creates a Xaman payload (e.g. via Xumm SDK) and returns the sign URL.
3. When the user signs, you submit the tx and store the hash; next `GET /api/discord/activity` can include a `bounty_complete` item with that hash and bountyId.

---

## Option B: Secure signer (advanced)

A tiny service (e.g. on the same machine as OpenClaw) holds an **encrypted** agent wallet and exposes:

- `POST /sign-xrpl` — body `{ amountDrops, destination, memo }`, only callable from localhost or with a shared secret. Returns signed tx blob; caller submits to XRPL.

OpenClaw skill calls this so the agent can “pay” without the main app ever seeing the key. Lock down the signer (network, rate limit, allowlist destinations).

---

## Convention for dashboard

- **Memo**: `BOUNTY-<bountyId>-complete` so the dashboard (or bridge) can match incoming txs to bounties and show the celebration + update reputation.
- **Amount**: Use the bounty’s `rewardXRP`; fee handling (e.g. 97/2/1 split) can be done in your bridge or in a second step.

---

*Place this in your OpenClaw skills dir (e.g. `~/.openclaw/skills/` or your ClawHub-style path) and adapt to your runtime (YAML/TS).*
