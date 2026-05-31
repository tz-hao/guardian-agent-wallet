# Guardian Agent Wallet

AI explains. Policy decides. Wallet enforces. Human confirms. Audit records.

Guardian Agent Wallet is a first-pass product demo for **SafePay Guard Wallet**, a bounded agent wallet interface for AI x Web3 safe execution. It does not connect to real wallets or move funds. The app demonstrates how a local policy layer classifies agent actions before any signing or settlement step.

## What This Demo Shows

- Action requests for x402-style paid API calls.
- Policy evaluation: `Allowed`, `Needs Human Confirmation`, or `Denied`.
- Risk explanations for budget, recipient, resource, and forbidden actions.
- Audit trail events for intent capture, policy checks, mock settlement, and response release.
- Prompt injection and forged tool return scenarios that do not override policy facts.

## Run Locally

```bash
npm.cmd install
npm.cmd run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scenarios

- Budgeted x402 API payment: allowed.
- Oversized payment: needs human confirmation.
- Unknown recipient: denied.
- Unlimited approval: denied.
- Forged tool return: denied by signer-style recheck.
- Prompt injection attempt: ignored by structured policy evaluation.

## Current Boundaries

- Mock only: no Safe, CAW, x402 facilitator, private key, or onchain settlement.
- No automatic GitHub push is configured.
- Real wallet integration belongs in a later milestone after policy tests and human confirmation flows are stable.
