# Licenses and Compliance – What You Need in Place

**Summary:** The **code** is under the MIT license (see [../LICENSE](../LICENSE)). **Operating** the app as a business—especially with monetization (subscriptions, fees, premium features)—may require **regulatory licenses or legal opinions** in your jurisdiction. Have those in place before you rely on “we’re not a money transmitter” or offer paid tiers.

For a quick **“Am I compliant with what we have now?”** checklist, see [COMPLIANCE-CHECKLIST.md](./COMPLIANCE-CHECKLIST.md).

---

## 1. Software license (this repo)

- **License:** [MIT](../LICENSE)  
- **Meaning:** You can use, modify, and distribute the code under the MIT terms. No warranty; author not liable.

---

## 2. Regulatory / business licenses (your responsibility)

The app is designed to be **non-custodial** (user signs in Xaman; we don’t hold funds). That **does not by itself** mean you need no licenses. Whether you need any of the following depends on your exact use case and jurisdiction. **Get qualified legal advice** (e.g. Florida-licensed attorney, US crypto/fintech counsel) before:

- Offering **paid subscriptions** (Stripe, etc.) for Premium / Agent Fleet
- Taking any **fee from user payments** (e.g. platform fee wallet, % of tips)
- Marketing the app as **financial** or **investment** advice or as a **trading** service
- Operating in **Florida** or other states with money transmission / virtual currency rules

### Commonly relevant

| Area | What to confirm |
|------|------------------|
| **Money transmission (US / Florida)** | Florida Ch. 560, F.S.; FinCEN MSB. Our docs assume no custody + user-sign-only keeps you outside MT; **have a lawyer confirm** for your product and any fee flows. |
| **Securities / investment advice** | If you present the app or features as investment/financial advice, different rules may apply. |
| **Subscriptions (Stripe, etc.)** | Usually treated as **sale of software access**, not money transmission. Still: confirm with counsel for your entity and jurisdiction. |
| **Platform fee on user payments** | Taking a cut of user-to-user payments is the **highest risk**; get a written legal opinion or disable until you do. See [FLORIDA-NOT-MONEY-TRANSMITTER.md](./FLORIDA-NOT-MONEY-TRANSMITTER.md). |

### What we do *not* provide

- Legal or regulatory advice  
- A guarantee that you need no licenses  
- Approval of any specific monetization or fee structure  

---

## 3. Practical checklist before monetizing

- [ ] **Software license:** Understood (MIT for this repo).  
- [ ] **Legal counsel:** Engaged (or scheduled) with a lawyer familiar with Florida/US crypto and your exact product.  
- [ ] **Money transmission:** Written opinion or confirmation that your flows (including any platform fee) do not require an MT license, or you have/are getting one.  
- [ ] **Subscriptions:** Confirmed with counsel that selling “Premium” / “Agent Fleet” access (e.g. via Stripe) is acceptable and how to describe it.  
- [ ] **Disclaimers:** In-app disclaimers (educational tool, not advice, user signs, no custody) are present and accurate. See [FLORIDA-NOT-MONEY-TRANSMITTER.md](./FLORIDA-NOT-MONEY-TRANSMITTER.md) and the in-app disclaimer banner.  
- [ ] **Fee flows:** No new flows where the platform receives value from user payments without legal sign-off.

---

*This document is for informational purposes only and does not constitute legal advice. Consult qualified counsel in your jurisdiction.*
