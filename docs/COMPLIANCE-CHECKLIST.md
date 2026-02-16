# Compliance Checklist – "Am I Compliant With What We Have Now?"

**Short answer:** The app is **compliant by default**: non-custodial, user-signs-only, disclaimers, and **platform fee OFF** until you explicitly enable it after legal sign-off. You are **not** compliant for **running with the platform fee on** or paid tiers until you have **licenses/legal opinions** in place.

---

## What the app does today (design vs reality)

| Area | Doc says | App today | Compliant? |
|------|----------|-----------|------------|
| **Custody** | We never hold or control user funds. | No custody. All value movement is user-signed in Xaman; we never hold keys or sign for the user. | Yes. |
| **Transmission** | We do not receive from A to send to B. User signs; value goes user → recipient(s). | Payments/NFTs/Orchestra: we build tx, user signs in Xaman. Value goes directly from user wallet. | Yes. |
| **Platform fee (OpenClaw)** | Get legal opinion on 1% platform fee, or disable until then. | **Platform fee is OFF by default.** UI shows "Platform fee OFF (compliant default)". To enable set `VITE_OPENCLAW_PLATFORM_FEE_DISABLED=false` only after legal sign-off. | **Yes** (default). |
| **Disclaimers** | Prominent "educational only, user signs, no custody." | Global disclaimer banner (dismissible) + in-app copy on key pages. | Yes. |
| **Subscriptions (Premium)** | Monetize via subscriptions is OK per doc; still get counsel for your jurisdiction. | "Free" / "Premium" badge only; no Stripe yet. | Not applicable yet – get sign-off before paid tiers. |

---

## Where you are **compliant** with the docs (as built)

- **User signs only** – All real value moves only after the user signs in Xaman (or their wallet). We don't sign or submit on their behalf.
- **No custody** – We don't hold keys, don't hold user funds, don't pool or commingle.
- **No transmission on behalf** – We don't receive from User A to send to User B; the user's wallet sends directly to the recipient(s).
- **Disclaimers** – Educational/sim, not advice, user signs, comply with US/FL, no custody – stated in the banner and referenced in docs.
- **Platform fee OFF by default** – The app does not include the platform in the OpenClaw payment split unless you set `VITE_OPENCLAW_PLATFORM_FEE_DISABLED=false`. UI clearly states "Platform fee OFF (compliant default)".

---

## Where you are **not** compliant (or not yet)

1. **If you enable the platform fee** – Setting `VITE_OPENCLAW_PLATFORM_FEE_DISABLED=false` turns the 1% fee on. Do **not** do this until you have a legal opinion (or license). While the fee is on without that, you are not compliant.

2. **Licenses / legal opinions** – For production business use (including any fee or paid tiers), get a Florida-licensed attorney (and US crypto/fintech counsel) to confirm your exact product and fee flows.

3. **Monetization (Premium / Stripe)** – When you add paid subscriptions, confirm with counsel before launch.

---

## What to do to stay compliant

1. **Keep the design** – Don't add custody, don't sign for users, don't receive user funds to transmit to others. Keep disclaimers.
2. **Leave platform fee OFF** – Default is compliant. Only set `VITE_OPENCLAW_PLATFORM_FEE_DISABLED=false` in `.env` **after** you have a legal opinion (or license) for the 1% platform fee.
3. **Licenses** – For production business use, get licenses/opinions in place. See [LICENSES-AND-COMPLIANCE.md](./LICENSES-AND-COMPLIANCE.md).
4. **Subscriptions** – Before launching paid tiers, get counsel's sign-off.

---

## Platform fee flag (default = compliant)

- **Default (no env set):** Platform fee is **OFF**. App is compliant.
- **To enable the 1% fee:** Set in `.env` only after legal sign-off: `VITE_OPENCLAW_PLATFORM_FEE_DISABLED=false`. With this set, the app includes the platform in the OpenClaw payment split. Get a legal opinion before doing this.

---

*This checklist is not legal advice. It summarizes how the app matches the project's own compliance docs. For legal compliance in your jurisdiction, consult qualified counsel.*
