# Reusable Demo Pact Report

## Summary

Created and activated a reusable CAW Pact for Guardian Agent Wallet demo payments.

The new Pact avoids `tx_count = 1`, so it can support multiple demo transfers until either the total transfer budget is exhausted or the Pact expires.

## New Pact

- Pact ID: `c3a3dfe7-e390-4d82-9125-1e7e5dd5bafb`
- Status: `active`
- Pact-scoped API key: present
- Activated at: `2026-06-11T13:33:33.177944Z`
- Expires at: `2026-06-12T13:33:33.177944Z`
- Current transaction count: `0`
- Current USD spend: `0`

## Policy Scope

- Permission: `can_transfer`
- Chain: `SETH`
- Token: `SETH`
- Intended trusted recipient: `0x24870681a481856b69D85D41C6f2401575228861`
- Max single transfer: `0.01 SETH`
- Total budget completion condition: `amount_spent = 0.1`
- Time expiry completion condition: `time_elapsed = 86400`
- `tx_count = 1`: not used

## Daily Budget Note

The CAW TypeScript SDK documentation confirms support for:

- `deny_if.amount_gt`
- `completion_conditions.amount_spent`
- `completion_conditions.time_elapsed`

The public Pact rule schema did not confirm a daily transfer budget field. Therefore:

- The daily budget target `0.05 SETH` is included in the Pact execution plan for owner review.
- Guardian Agent Wallet continues to enforce daily budget behavior in the local Policy Engine.
- CAW enforces the hard on-chain execution constraints listed above.

## Local Configuration

Updated local `.env.local`:

```text
AGENT_WALLET_PACT_ID=c3a3dfe7-e390-4d82-9125-1e7e5dd5bafb
```

Secrets were not printed. `.env.local` remains ignored by git.

## Verification

Commands run:

```powershell
git check-ignore -v .env.local
npm.cmd run test
npm.cmd run lint
npm.cmd run build
```

Results:

- `.env.local`: ignored by `.gitignore`
- Test: passed, 49 tests
- Lint: passed
- Build: passed

## Recommended UI Tests

```text
支付 0.001 SETH 给 数据 API 服务商
支付 0.005 SETH 给 AI 推理服务
支付 0.001 SETH 给 链上分析 API
```

Restart the Next.js dev server before testing so `.env.local` is reloaded.
