# Florida / US: Staying Within Non–Money-Transmitter Capabilities

**Purpose:** Keep the XRPL Control Room app clearly within Florida and US regulations. **You are not a money transmitter.** This doc defines capability boundaries so the product does not stray into activities that could require a money transmitter license (Florida Ch. 560, F.S., or FinCEN/state equivalents).

**This is not legal advice.** Have a Florida-licensed attorney (and US crypto/fintech counsel) confirm these boundaries for your exact product and any fee flows. See also **[LICENSES-AND-COMPLIANCE.md](./LICENSES-AND-COMPLIANCE.md)** for what licenses you need in place before monetizing.

---

## What We Are

- **A software tool / dashboard** that lets users view data, run simulations, and **prepare** transactions.
- **User-controlled:** All value movement requires the **user’s** signature in **their own** wallet (e.g. Xaman). We do not hold, custody, or control user funds.
- **No transmission on behalf of others:** We do not receive funds from User A to send to User B. The user signs; value goes **directly** from the user’s wallet to the recipient(s) they choose.

---

## Capabilities We DO (Stay Here)

| Capability | Why it’s within scope |
|------------|------------------------|
| **Display data** | Prices, order books, ledger info, analytics—read-only. No transmission. |
| **Paper trading / simulations** | Fake balances, fake orders, no real funds. Educational/demo only. |
| **Suggest or build transactions** | We propose a payment or offer (amount, destination, params). User reviews and **signs in their wallet**. We never sign or submit on their behalf. |
| **Show a signing flow (e.g. Xaman QR)** | We hand off to the user’s wallet app. The wallet app signs. We do not hold keys or sign. |
| **Orchestra / strategy agents** | Agents **emit intents** (suggested actions). User approves and signs. No autonomous execution of value transfer. |
| **Backtesting, risk metrics, alerts** | Analytics and notifications. No movement of funds. |
| **Learn / education content** | Describing XRPL, micropayments, agents—informational only. |

**Golden rule:** If it moves real value, the **user** must initiate it and **sign** it in their own wallet. We facilitate; we do not transmit.

---

## Capabilities We DO NOT Do (Do Not Stray)

| We do NOT | Why (MT / Florida risk) |
|-----------|--------------------------|
| **Hold or custody user funds** | Custody = regulated; can trigger MT or other licenses. |
| **Receive funds to send to someone else** | Classic money transmission: receive from A, transmit to B. |
| **Sign or submit transactions for the user** | Signing on behalf of others = acting as transmitter/custodian. |
| **Pool user funds** | Commingling = custody/transmission. |
| **Execute transfers without user signature** | Autonomous execution = we are “sending” value; MT risk. |
| **Operate a wallet where we control keys** | We never hold private keys or “custody” wallets for users. |
| **Guarantee or promise to pay** | We don’t owe anyone value; we’re a tool, not a payer. |

**Red line:** Any flow where **we** (the platform) receive value from a user **as part of facilitating that user’s payment to a third party** can be scrutinized. If in doubt, don’t build it until counsel approves.

---

## Platform / Fee Wallet (Florida MT Caution)

The codebase currently includes optional **platform fee** flows (e.g. 1% to a “platform fee wallet” when a user pays a creator via OpenClaw). In that flow:

- The **user** signs **one** payment (e.g. 97% to creator, 3% to platform).
- Value goes **directly** from the user’s wallet to recipient(s); we do not custody.

Some jurisdictions still ask whether **receiving a fee** as part of that flow is “receiving and transmitting” or “payment for software.” To stay clearly within **non–money transmitter** in Florida:

1. **Get a legal opinion** from a lawyer familiar with Florida OFR and Ch. 560 on this exact flow (platform fee wallet, 1% or 3%, user-signed single payment).
2. **Or remove/disable** the platform fee wallet in production until you have that opinion. You can still monetize via subscriptions, licensing, or other means that do not touch user-to-user payment flows.

Do **not** add new flows where the platform **receives** value from user payments without written legal sign-off.

---

## Feature Checklist (Before Shipping New Flows)

Before adding any feature that touches **payments, withdrawals, or value movement**:

- [ ] Does the **user** sign in **their own** wallet (we never sign)?
- [ ] Does value go **directly** from user → recipient(s) (we never hold it)?
- [ ] Do we **receive** any portion of the payment? If yes → legal review before launch.
- [ ] Is the flow documented in [COMPLIANCE-GLOBAL-US-FLORIDA.md](../COMPLIANCE-GLOBAL-US-FLORIDA.md) (or this doc)?
- [ ] Have we avoided language that implies we “send,” “transmit,” or “pay” on the user’s behalf? (We “help you prepare” or “you send via your wallet.”)

---

## In-App Messaging (Suggested)

Use clear, consistent language so users and regulators understand the model:

- **Good:** “You sign in Xaman. We don’t hold your funds.”  
- **Good:** “Prepare payment → Confirm → Sign in your wallet.”  
- **Good:** “This app is a tool. You control your wallet and your transactions.”  
- **Avoid:** “We send your payment.” / “We transfer XRP for you.” / “We pay the recipient.”

A short footer or disclaimer on payment/agent pages is recommended, e.g.:  
*“We do not transmit money or hold your funds. You sign all transactions in your own wallet. Not legal or financial advice. Use in compliance with applicable laws.”*

---

## Where This Is Referenced

- **COMPLIANCE-GLOBAL-US-FLORIDA.md** — Overall compliance; Florida Ch. 560, no custody, user-signs-only.
- **OPENCLAW-COMPLIANCE-AND-USE.md** — Money transmission, royalties, fee flows, “get legal opinion.”
- **REGULATORY-WATCH.md** — How to stay current on Florida and federal updates.
- **This file** — Explicit DO / DO NOT and Florida non-MT capability boundaries.

When in doubt, **do not** add a feature that receives or transmits value on behalf of users. Reassess with qualified counsel in Florida and the US before changing payment or fee flows.
