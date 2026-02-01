# MAINNET GO-LIVE CHECKLIST

> **DO NOT GO LIVE UNTIL ALL BOXES ARE CHECKED**
> Safety is imperative. No shortcuts.

---

## Pre-Launch Security Audit

### Code Review
- [ ] All private keys stored in environment variables, NOT code
- [ ] No hardcoded secrets anywhere
- [ ] Rate limiting tested and working (100 tx/min max)
- [ ] Kill switch tested - can halt all payments instantly
- [ ] Error handling covers all edge cases
- [ ] Transaction timeout implemented (30s max)

### Wallet Security
- [ ] Fee wallet seed stored OFFLINE (paper, metal backup)
- [ ] Seed NEVER entered on any website
- [ ] Wallet is NEW - not used for anything else
- [ ] Test transactions sent to verify address is correct
- [ ] Considered multi-sig for large balances (optional)

### Testing
- [ ] Ran on testnet for minimum 24 hours
- [ ] Processed 100+ test transactions successfully
- [ ] Tested failure scenarios (network down, insufficient funds)
- [ ] Tested rate limiting by exceeding limits
- [ ] Tested kill switch activation and deactivation
- [ ] No errors in 24-hour test period

### Operational
- [ ] Monitoring/alerting set up
- [ ] Backup plan if primary server fails
- [ ] Know how to check XRPL explorer for transactions
- [ ] Emergency contact list ready

---

## Sign-Off

I confirm I have completed ALL items above:

**Name**: _______________________

**Date**: _______________________

**Signature**: _______________________

---

## ONLY AFTER SIGNING ABOVE

Change in `demo-mainnet.html`:
```javascript
MAINNET_ENABLED: true  // Line 25
```

---

*Safety is not optional. It is imperative.*
