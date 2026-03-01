# XRPL Governance Guide

A short FAQ for validators and operators using the Ledger Impact / governance tools.

## What are amendments?

Amendments are protocol-level changes to the XRPL. They are voted on by validators and, once enabled, apply to the entire network. See [XRPL Amendments](https://xrpl.org/amendments.html) for the official overview.

## How does voting work?

Validators signal support by including amendment IDs in their validation messages. When 80% of the UNL (Unique Node List) validators support an amendment, it enters a **2-week waiting period**. After that, the amendment is enabled on the network. There is no “vote” transaction; support is inferred from validator configuration and published manifests.

## Where can I see live amendment status?

- **XRPScan**: [xrpscan.com/amendments](https://xrpscan.com/amendments) — current vote counts, majority status, and activation dates.
- **Validator page**: If you set your validator public key in this app, use “View validator on XRPScan” to see your validator’s status and UNL presence.

## What does “Mark as reviewed” do?

It is **local only**. It records that you have reviewed that amendment in this app. It does not submit any vote or transaction. Use it to track your own workflow and to filter the “Needs review” list.

## Who benefits from an amendment?

The “Who this helps” text on some amendments is a short, plain-English summary of which users or use cases benefit (e.g. DeFi protocols, institutional validators). It is for context only, not a recommendation.

## Where can I learn more?

- [xrpl.org – Amendments](https://xrpl.org/amendments.html)
- [XRPScan – Amendments](https://xrpscan.com/amendments)
- [XRPL Dev Portal](https://xrpl.org/docs.html)
- Your validator software docs (e.g. rippled, validator setup guides)

## Privacy

All “reviewed” state and optional validator key are stored only in your browser. Nothing is sent to a backend for governance tracking.
