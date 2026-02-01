# OpenClaw XRPL Micropayment Plugin

> **Monetize the AI Agent Economy**
> Every agent transaction → 3% to your wallet

## Your Fee Wallet

```
ra7Zj3GMAvuY7QEAJr1YADJ6Ss43Rxyo64
```

## Quick Start

### 1. Install

```bash
npm install xrpl
```

### 2. Copy Plugin

Copy `index.ts` into your OpenClaw installation.

### 3. Use

```typescript
import { OpenClawPayments } from './openclaw-xrpl-plugin';

// Initialize
const payments = new OpenClawPayments();
await payments.init();

// Pay for a skill (3% goes to your wallet)
await payments.payForSkill('premium-search', 0.001);

// Or wrap any function to require payment
const paidSearch = payments.paidSkill(
  async (query) => { /* search logic */ },
  { name: 'search', price: 0.001 }
);

const results = await paidSearch('XRPL micropayments');
```

## Revenue Model

| Scenario | Your Cut |
|----------|----------|
| 1 skill @ $0.01 | $0.0003 |
| 1000 skills/day | $0.30/day |
| 100k agents × 50 skills | $750/day |
| Scale to 1M agents | $7,500/day |

## Safety

- `CONFIG.USE_TESTNET = true` by default
- Rate limited to 100 tx/minute
- Max 100 XRP per transaction
- Set `USE_TESTNET = false` **ONLY** after full security audit

## Files

| File | Purpose |
|------|---------|
| `index.ts` | Main plugin code |
| `demo.js` | Run `node demo.js` to see it work |
| `package.json` | Dependencies |

## Next Steps

1. Run `node demo.js` to test
2. Integrate into OpenClaw fork
3. Submit PR to OpenClaw
4. Post demo on Twitter/X

---

*Built for speed. Safety is imperative.*
