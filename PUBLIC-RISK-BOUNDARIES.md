# Public Risk Boundaries

**Status:** Required public-facing architecture boundary  
**Applies to:** XRPL Control Room repository, public demos, public forks, and future trading/agent features

## Purpose

This file defines what the public project is intended to be and, just as importantly, what it is **not**.

The XRPL Control Room is experimental software, research tooling, simulation infrastructure, and a user-controlled transaction-preparation interface. It is not intended to function as a managed trading service, custodian, broker, investment adviser, fiduciary, money transmitter, or guaranteed execution system.

This document is not legal advice and does not determine regulatory status. The actual legal treatment of a deployment depends on what that deployment does, how it is operated, how it is marketed, who controls assets, how compensation works, and which jurisdictions apply.

## Required public boundary

### Allowed public posture

- read-only XRPL and market-data observation;
- analytics, visualization, education, and research;
- paper trading and backtesting;
- simulation and testnet experimentation;
- AI/agent-generated analysis, scores, alerts, or candidate actions;
- preparation of bounded transaction intents;
- Xaman or another user-controlled wallet for independent user review and signing;
- non-custodial architecture;
- auditable logs, receipts, limits, vetoes, and kill switches.

### Not part of the approved public architecture

- custody of user funds or private keys;
- pooled customer assets;
- discretionary management of another person's wallet;
- autonomous signing for other users;
- public copy-trading where the system controls user execution;
- performance guarantees or promises of profit;
- claims that an AI signal is reliable, safe, or suitable for a particular person;
- personalized recommendations to buy, sell, or hold an asset;
- marketing the project as regulated, certified, audited, institutionally approved, or production-safe unless that claim is independently true and documented;
- receiving and retransmitting user funds on behalf of others;
- performance-fee or managed-account functionality without separate review.

## Trading and AI-agent rule

AI and trading components may:

`observe → analyze → simulate → propose → prepare`

They do not independently obtain authority to move another person's value.

For real-value flows, the intended boundary is:

`analysis/agent → bounded intent → user review → user-controlled wallet signature → ledger`

A disclaimer does not make prohibited or regulated conduct safe. If the product's behavior changes, the compliance analysis must change with it.

## Fly / Zebrafish trading experiment

Any fly/zebrafish-inspired trading architecture begins as:

- XRPL DEX read-only observation;
- paper trading;
- deterministic guard/veto rules;
- no private keys;
- no live autonomous execution;
- no custody;
- no customer funds;
- no performance claims.

Promotion to live user-authorized execution requires a separate technical, security, and legal review. The initial live pattern, if approved, should prepare a bounded unsigned transaction for the wallet owner to review and sign.

## Downstream forks and users

The repository's MIT license permits reuse under its terms, but downstream users are responsible for their own:

- security review;
- deployment configuration;
- legal and regulatory analysis;
- licensing;
- user disclosures;
- tax obligations;
- data handling;
- key management;
- transaction behavior;
- marketing claims.

The original project's documentation does not provide regulatory cover for a modified or separately operated deployment.

## Public wording rule

Prefer:

- "experimental"
- "research"
- "simulation"
- "paper trading"
- "analytics"
- "candidate trade"
- "transaction intent"
- "user reviews and signs"

Avoid unsupported wording such as:

- "guaranteed"
- "safe profits"
- "institutional-grade" when implying certification or suitability
- "we trade for you"
- "we manage your wallet"
- "we send your funds"
- "regulated" unless documented
- "approved" unless documented

## Feature review trigger

Before merging a feature that touches real value or trading, ask:

1. Does it hold or control anyone else's keys or funds?
2. Can it sign or submit without the wallet owner's contemporaneous review?
3. Does it pool assets or coordinate managed accounts?
4. Does it create a fee tied to trading performance or user-to-user payments?
5. Does it produce personalized investment recommendations?
6. Does marketing imply guaranteed results, certification, or professional financial status?
7. Does it introduce new custody, intermediary, broker, adviser, exchange, or money-transmission questions?

If any answer is yes or unclear, stop the production rollout and obtain dedicated review before enabling the feature.

## Related documents

- `README.md`
- `COMPLIANCE-GLOBAL-US-FLORIDA.md`
- `SAFETY-AUDIT.md`
- `ROADMAP.md`
- `docs/LICENSES-AND-COMPLIANCE.md`
- `docs/FLORIDA-NOT-MONEY-TRANSMITTER.md`

## Core rule

**Software may inform and prepare. The asset owner keeps final authority over real value.**
