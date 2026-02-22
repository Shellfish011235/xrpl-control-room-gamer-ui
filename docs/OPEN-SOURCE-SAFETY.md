# Open-Sourcing This Repo – Are We Within Safe Constraints?

**Short answer: Yes.** The project is designed to stay within the constraints that make open-sourcing non-custodial XRPL/crypto software low risk in the US (per FinCEN guidance, DOJ 2025 statements, and common practice). This is **not legal advice**; have a lawyer confirm for your jurisdiction and any future changes.

---

## Criteria from regulatory / enforcement guidance (summary)

| Criterion | Our status |
|-----------|------------|
| **Purely non-custodial** – Users manage their own keys; we never accept, hold, control, or transmit funds on behalf of others. | ✅ Yes. All value movement requires the **user’s signature in their own wallet** (Xaman). We build/suggest transactions; we do not sign or submit. See [FLORIDA-NOT-MONEY-TRANSMITTER.md](./FLORIDA-NOT-MONEY-TRANSMITTER.md). |
| **Software as tool** – Providing software (wallets, payment channels, dashboards) is treated like providing tools; developers who don’t transmit funds themselves are not MSBs. | ✅ Yes. We provide a dashboard/tool. No hosted service where we intermediate, hold keys, or process payments for users. |
| **No custodial features** – No “we manage channels for you” or turnkey payment processor service. | ✅ Yes. Strategy agents (grid, DCA, MM, arb) **emit intents**; user approves and signs. No autonomous execution. See [STRATEGY-AGENTS-INTEGRATION.md](./STRATEGY-AGENTS-INTEGRATION.md). |
| **Platform fee / receiving value** – Receiving a cut of user payments can trigger MT/regulatory scrutiny. | ✅ Mitigated. **Platform fee is OFF by default** (`VITE_OPENCLAW_PLATFORM_FEE_DISABLED` defaults to true). Do not enable without legal sign-off. See [COMPLIANCE-CHECKLIST.md](./COMPLIANCE-CHECKLIST.md). |
| **Clear disclaimers** – State non-custodial, users control keys, not providing financial services. | ✅ Yes. README, [LICENSE](../LICENSE) section, [DisclaimerBanner](../src/components/DisclaimerBanner.tsx) (“No custody”, “User signs via Xaman”), and payment/agent pages all state we do not hold funds or transmit on behalf of users. |

---

## When you could get in trouble (avoid these)

- **Running a hosted version** where your system intermediates, holds keys, or processes payments for users → could trigger MSB/MTL. We don’t do that; the repo is a **client-side tool** that hands off to Xaman.
- **Adding platform fees or royalties** without a legal opinion → higher risk. Do not add flows where the project receives value from user payments.
- **Marketing as “we send your payment” or “we transfer XRP for you”** → we avoid that language; we say “you sign in your wallet,” “we don’t hold your funds.”
- **Knowingly facilitating illicit use** → same as any open-source project; we don’t promote evasion or custodial abuse.

---

## Best practices we follow

- **README:** “Non-custodial … All execution via Xaman (user signs). No custody.”
- **License section:** MIT for code; operating/monetizing may require licenses; links to LICENSES-AND-COMPLIANCE and FLORIDA-NOT-MONEY-TRANSMITTER.
- **In-app:** Global disclaimer banner + per-page footers on payment/agent flows: “We do not transmit money or hold your funds. You sign in your own wallet.”
- **Docs:** Explicit DO / DO NOT in FLORIDA-NOT-MONEY-TRANSMITTER; no custody, no receiving value from user payments without sign-off.

---

## Bottom line

**Open-sourcing this repo is consistent with “pure open-source non-custodial tool” guidance.** We do not hold keys, do not custody funds, and do not transmit value on behalf of users. Keep the platform fee OFF by default and avoid adding flows where the platform receives value from user payments without legal review. For distribution in strict jurisdictions (e.g. New York) or if you add hosted/monetized features, get fintech/crypto counsel to review your exact setup.

*This document is for informational purposes only and does not constitute legal advice.*
