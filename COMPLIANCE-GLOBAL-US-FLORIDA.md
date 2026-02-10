# Compliance: Global, US, and Florida (Crypto + AI)

**This document is not legal advice.** It summarizes how the XRPL Control Room app is designed and highlights regulatory areas you should confirm with a qualified attorney in your jurisdiction (global, US, and Florida).

---

## How This App Is Designed (Relevant to Compliance)

- **No custody:** Users sign with **their own** Xaman wallet. The platform does not hold user funds.
- **User-initiated only:** Payments require **user confirmation** and **Xaman signing**. No autonomous execution of payments without user approval.
- **No intermediation of funds:** Payments go **directly** from the user’s wallet to the recipient. The app facilitates signing; it does not receive and re-transmit value.
- **Safety and audit:** SafetyLayer (rate limits, caps, kill switch, audit log) and user-signing flow support accountability.

These design choices are commonly cited to argue that a product is **not** acting as a money transmitter (no custody, no “sending on behalf of” without user sign-off). Whether that applies to **your** exact use case is a legal question for counsel.

---

## Global (Crypto + AI)

- **Crypto:** Rules differ by country (e.g. EU MiCA, UK FCA, APAC regimes). Many jurisdictions regulate “virtual asset service providers” (VASPs), money transmission, and custody. Your **no-custody, user-signs-only** model is often distinguished from custodial or intermediary services, but each jurisdiction must be checked.
- **AI:** EU AI Act and other frameworks impose risk-based rules on AI systems. AI that suggests or assists payments still typically leaves **you** as the operator liable; keeping “user intent → agent suggests → user confirms → user signs” helps show human-in-the-loop control. Global norms on “AI agents” are still evolving; monitor updates in each market where you operate.
- **Action:** If you have users or operations in multiple countries, get jurisdiction-specific advice (EU, UK, US, Florida, etc.).

---

## United States (Federal)

- **Money transmission:** FinCEN (Bank Secrecy Act) and state laws govern money transmission. Typically, **receiving and transmitting** funds on behalf of others (or holding custody) triggers licensing. Your pattern—user signs from their own wallet, direct to recipient, no custody—is often argued to fall **outside** money transmission, but the analysis is fact-specific.
- **Securities:** SEC may treat certain tokens or arrangements as securities. The app uses XRP and facilitates user-signed transfers; it does not issue or sell securities. Token classification and any “investment” messaging should be reviewed by counsel.
- **Stablecoins / payments:** The GENIUS Act (mid-2025) and other federal initiatives set rules for payment stablecoins and AML. Your app does not issue stablecoins; if you integrate stablecoins or new payment flows, reassess with a lawyer.
- **CFTC:** Commodity-focused digital asset regulation is evolving (e.g. CLARITY Act discussion). XRP has been treated in litigation as non-security; regulatory boundaries remain in flux.
- **Action:** Have a US crypto/fintech attorney confirm that your **exact** product (tip bot, pay-per-skill, fee wallet flows, etc.) does not require a money transmitter license or other federal registration.

---

## Florida (State)

- **Money transmission:** Florida’s Money Transmitter law (Ch. 560, F.S.) requires a license to transmit currency, monetary value, or payment instruments. “Transmission” and “monetary value” can cover certain virtual currency activities. Florida has also clarified that **selling** Bitcoin (in some fact patterns) can be money transmission; courts and OFR interpret the statute in specific contexts.
- **Virtual currency / kiosks:** Florida has addressed virtual currency and kiosks (e.g. SB 292 discussion, later amendments). Those rules mainly target **kiosk operators** and specific business models. A **non-custodial wallet + signing app** that never takes possession of customer funds is a different fact pattern; whether it is exempt or out of scope must be confirmed by a Florida-licensed attorney.
- **Digital assets / UCC:** Florida has updated its UCC (e.g. CS/CS/SB 1666) for digital assets and crypto. This affects commercial and contractual treatment of crypto; it does not by itself license or prohibit your app but may affect how contracts and transfers are characterized.
- **Action:** Get a legal opinion from a lawyer familiar with Florida OFR and Ch. 560 on: (1) no custody, (2) user signs every payment, (3) no pooling of funds, (4) any platform/fee wallet flows (e.g. OpenClaw fee wallet, agent service wallet). Document these and keep terms of use and disclaimers up to date.

---

## AI-Specific (US and Florida)

- **Liability:** In the US (and Florida), the **operator** of the platform is responsible for compliance. The AI agent is not a separate legal entity. You should maintain human oversight, audit trails, and clear terms (see OPENCLAW-COMPLIANCE-AND-USE.md).
- **User approval:** Keeping the flow as **user intent → agent suggests plan → user confirms → user signs in Xaman** supports the position that the human is in control and the app does not “execute” payments autonomously. Do not allow the AI to send value without a clear, user-facing approval step (per payment or per legally designed batch).
- **Florida:** There is no Florida-specific “AI license” for this type of app yet. General rules on fraud, consumer protection, and money transmission still apply; your lawyer can confirm.

---

## AI Risk Policy and Explainability (Future-Proofing)

To align with evolving AI regulations (e.g. **EU AI Act** full enforcement Aug 2026; **US state laws** such as Colorado AI Act June 2026), we document and implement the following where AI influences payments or trading:

- **Risk assessments:** Document how AI is used (e.g. suggestions, position sizing, alerts). For high-risk use cases, maintain a simple risk assessment (what can go wrong, mitigations, human oversight). Update when features change.
- **Explainability protocols:** In the UI, where AI suggests an action (e.g. payment plan, trade size), show a short, user-facing reason (e.g. “Based on Kelly Criterion and current balance”) so users understand the suggestion. Avoid black-box decisions for financial actions.
- **Audit trails and provenance:** Log AI-involved decisions (sim, testnet, and if ever mainnet) so we can trace “who/what suggested what and when.” Stored in audit log (e.g. Secure Payment Agent, SafetyLayer); use for mock or real audits and incident reporting.
- **Oversight:** Keep human-in-the-loop for any transfer of value. Rate limits, kill switch, and caps (SafetyLayer) count as oversight controls.

*This is not a full compliance program; it is a set of practices to grow into as we add AI-driven features. Counsel should confirm adequacy for your jurisdiction.*

---

## Staying Current on Regulations

Regulations change. We maintain a **regulatory watch** so the project can stay current:

- **REGULATORY-WATCH.md** — Lists where we check for updates (White House, SEC, CFTC, FinCEN, EU AI Act, state laws, XRPL ecosystem). Re-check after major announcements (e.g. president/crypto meetings, new AI or digital asset rules).
- **ROADMAP.md** — Phased plan (simulations → testnet → compliant APIs) and compliance tie-ins (EU AI Act, Colorado AI Act, GENIUS/CLARITY).

When in doubt, reassess with qualified counsel before enabling mainnet or real-user flows.

---

## Practical Checklist (Still Get Legal Advice)

| Area | Your design | What to confirm with counsel |
|------|-------------|------------------------------|
| Money transmission (US / Florida) | No custody; user signs; direct P2P | That your exact flows and fee structures do not require an MT license. |
| Securities (US) | No issuance or sale of securities; user transfers only | That marketing and token use do not create securities exposure. |
| AML / KYC | No custody; user’s wallet and identity are with Xaman/wallet provider | Whether any additional AML/KYC or disclosures are required for your role. |
| AI / agent | Human-in-the-loop; user confirms and signs | That agent-assisted flows and disclaimers meet current expectations. |
| Terms and disclaimers | — | Clear terms of use; “not legal/financial advice”; user responsibility. |

---

## Where This Is Documented in the Repo

- **OPENCLAW-COMPLIANCE-AND-USE.md** — Money transmission, custody, Xaman use, royalties, AI agent economy, liability, and “get a legal opinion” guidance.
- **docs/AI-AGENT-ECONOMY-INTEGRATION.md** — How AI payments, OpenClaw, and Agent Economy fit together; regulatory scope (no custody, user-signs-only, applicable laws).
- **This file** — High-level alignment with global, US, and Florida crypto and AI regulation; AI risk policy and explainability; not a substitute for legal advice.
- **ROADMAP.md** — Phased roadmap (sim → testnet → compliant APIs) with compliance tie-ins.
- **REGULATORY-WATCH.md** — Where to check for regulatory updates (White House, SEC, EU AI Act, state laws, etc.).

---

*This document is for informational purposes only and does not constitute legal, tax, or regulatory advice. Consult a qualified attorney licensed in your jurisdiction (including Florida and other relevant states) for advice tailored to your product and operations.*
