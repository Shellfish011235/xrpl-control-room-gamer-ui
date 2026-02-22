# Sources and Proof — No Speculative Numbers

All corridor volumes, bridge TVL, and chain metrics in the dashboard are **sourced from official or published data**. This document provides **verification links** so anyone can confirm the numbers.

---

## What the numbers represent

We **do not** say or imply that corridor dollar amounts are Ripple ODL volume. We say what they are: **total remittance market** (sourced)—i.e. **everyone** in the corridor contributes to that number: banks, other MTOs (e.g. Western Union, Wise, MoneyGram), Ripple/ODL partners, other fintechs, and all other providers. ODL may serve a subset; Ripple does not publish corridor-level ODL figures.

| Data shown in UI | What it is | What it is not |
|------------------|------------|----------------|
| **Payment corridor "monthly volume" / "total market (monthly)"** | **Total remittance market** for that country pair (e.g. US→Mexico, US→Philippines), from **World Bank**, **BIS**, or **national central banks** (Banxico, BSP, SBV, BI, RBI, SBP, Bangladesh Bank, ECB, BoE). That total includes **all** players in the corridor: banks, MTOs (e.g. Western Union, Wise, MoneyGram), Ripple/ODL partners, other fintechs. | **Not** Ripple/ODL volume. Labels in the app state "total market" and "not ODL volume." ODL is a subset; Ripple does not publish corridor-level ODL breakdowns. |
| **Bridge TVL / monthly volume** | From **DefiLlama** (on-chain TVL and volume). | Estimates from DefiLlama methodology; see their docs. |
| **XRPL-connected chain metrics** | From **DefiLlama** or **chain explorers** (TVL, volume, tx counts). | Not speculative; linked to source below. |

---

## Verification links (proof)

### Remittance and corridor volumes

| Source name | Official URL | What we use it for |
|-------------|--------------|--------------------|
| **World Bank – remittances** | https://www.worldbank.org/en/topic/remittances | Global remittance context and reports. |
| **World Bank – remittance data (received)** | https://data.worldbank.org/indicator/BX.TRF.PWKR.CD.DT | Personal remittances received by country (IMF/World Bank data). |
| **World Bank – remittance data (paid)** | https://data.worldbank.org/indicator/BM.TRF.PWKR.CD.DT | Personal remittances paid. |
| **BIS – statistics** | https://www.bis.org/statistics/ | Payments and cross-border statistics. |
| **BIS – data portal** | https://data.bis.org/ | Retail payments, remittance-related indicators. |
| **Banxico (Mexico)** | https://www.banxico.org.mx/ | Mexican remittance and financial data. |
| **BSP (Philippines)** | https://www.bsp.gov.ph/ | Philippine remittance statistics (e.g. Key Indicators). |
| **SBV (Vietnam)** | https://www.sbv.gov.vn/ | Vietnamese remittance/financial data. |
| **BI (Indonesia)** | https://www.bi.go.id/en/ | Indonesian remittance statistics. |
| **RBI (India)** | https://www.rbi.org.in/ | Indian remittance data (e.g. bulletins). |
| **SBP (Pakistan)** | https://www.sbp.org.pk/ | Pakistani remittance data. |
| **Bangladesh Bank** | https://www.bb.org.bd/ | Bangladesh remittance data. |
| **ECB** | https://www.ecb.europa.eu/stats/html/index.en.html | Euro area statistics. |
| **Bank of England** | https://www.bankofengland.co.uk/ | UK payment and remittance-related statistics. |

### Ripple / ODL (no corridor-level figures)

| Source | URL | Note |
|--------|-----|------|
| **Ripple Insights** | https://ripple.com/insights/ | Company updates. Ripple does **not** publish corridor-level ODL volume. Our "Ripple / partner estimates" means we cite Ripple for context; **volume numbers on corridors come from World Bank / central banks** (total market). |

### Bridges and chains (TVL, volume)

| Source | URL | What we use it for |
|--------|-----|--------------------|
| **DefiLlama** | https://defillama.com/ | TVL and volume for bridges and chains. |
| **DefiLlama – chains** | https://defillama.com/chains | Chain-level metrics. |

---

## In the app

- **Network → Payment Corridors:** Each corridor shows **"Source: [name]"**. If the source has a known URL, it is a **clickable link** (e.g. "World Bank / Banxico" → Banxico or World Bank remittances).
- **Network → Bridges / Chains:** Same: **Source** is a link to DefiLlama (or the relevant explorer) when available.
- **Data layer:** `src/data/corridorData.ts` exports `DATA_SOURCE_URLS` and `getSourceUrl(dataSource)` so the UI can resolve labels to verification URLs.

---

## Who could be in the "subset" (disclosure)

The dollar amounts we show are **total remittance market** (sourced)—so **anyone** in the corridor contributes to that total: banks, Western Union, Wise, MoneyGram, Ripple/ODL partners, other fintechs, etc. The portion that **could** involve XRP/XRPL is a subset and may include:

- **Ripple (ODL)** — Ripple's On-Demand Liquidity product.
- **Partners we list as ODL partners** (exchanges, MTOs, payment providers that use or have used XRP/ODL): e.g. **SBI Remit, Bitso, Tranglo, Coins.ph, Nium, Novatti, Lulu Exchange, pyypl, Azimo (Papaya Global), SentBe, Flash FX**, and others shown in the app under "ODL Partners."

**We do not attribute a dollar amount to ODL or to any single partner** because none of them publish corridor-level volume. The "who else" that could be moving value on XRPL in those corridors is disclosed here for transparency.

---

## Caveats (transparency)

1. **ODL share is not public.** Ripple and the partners listed above do not disclose volume per corridor. We show **total remittance market** (World Bank / central bank data). We do not attribute a specific dollar amount to ODL or to any partner.
2. **"Partner estimates"** where used means we combine official data (e.g. World Bank, BSP) with partner or industry context; the **number is still anchored to the cited institution** where possible.
3. **DefiLlama** figures are on-chain derived; methodology is on DefiLlama. We use them as the cited source for bridge/chain TVL and volume.
4. **Data as of:** Each corridor/bridge/chain can show "Data as of [date]". When you verify, check the source’s own publication date.

## Summary

- **Corridor volumes** → World Bank, BIS, or central bank links above (total market, not ODL).
- **Bridge/chain TVL and volume** → DefiLlama (and chain explorers where noted).
- **No speculative ODL numbers** → We do not attribute a specific dollar volume to ODL per corridor; we cite total market and state that ODL is a subset.

If you need a single page to point to for "proof", use this document and the **Verification links** table above.
