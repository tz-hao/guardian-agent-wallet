# Day 2 Demo Story Report

## Summary

Upgraded Guardian Agent Wallet with a stronger hackathon judge-facing demo story panel.

The update focuses only on the demo narrative layer:

- No architecture refactor.
- No CAW server-side execution changes.
- No `.env.local` or `AGENT_WALLET_API_KEY` exposure.
- CAW execution remains separate and is not auto-triggered by scenario buttons.

## UI Changes

Added a visible `演示故事线 / Demo Story` panel through the existing dashboard scenario component.

Each scenario button now shows:

- Scenario label
- Agent actor
- Human-readable story
- Raw agent command
- Expected policy decision

Clicking a scenario runs:

```text
Intent Parser -> Risk Engine -> Policy Engine -> Risk Review UI
```

It does not execute CAW automatically.

## Demo Stories

| Story | Command | Expected Decision |
| --- | --- | --- |
| 正常 Agent | `Pay 0.001 SETH to 0xSAFE` | `ALLOW` |
| 失控 Agent | `Pay 100 SETH to 0xSAFE` | `CONFIRM` |
| 恶意 Agent | `approve unlimited USDC` | `DENY` |
| 钓鱼地址 | `转账 0.001 SETH 给 0xBAD0000000000000000000000000000000000000` | `CONFIRM` |

## Files Changed

- `components/AttackSimulationPanel.tsx`
- `lib/demo/attackScenarios.ts`
- `tests/attackScenarios.test.ts`
- `docs/demo-script.md`
- `DAY2_DEMO_STORY_REPORT.md`

## Verification

```text
npm.cmd run test  PASS
npm.cmd run lint  PASS
npm.cmd run build PASS
```

## Notes

- The phishing address story currently resolves to `CONFIRM` because the active policy treats suspicious recipients as high-risk human-review cases.
- Unlimited approval resolves to `DENY` because it is a hard policy block.
- The runaway-agent story uses `100 SETH` to make budget risk obvious for a live demo.
