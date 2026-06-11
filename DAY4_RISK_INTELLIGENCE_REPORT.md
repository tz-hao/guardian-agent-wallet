# Day 4 Risk Intelligence Report

## Summary

Implemented the Day 4 Risk Intelligence upgrade to make risk scoring explainable and visually stronger for hackathon judges.

The upgrade preserves existing execution boundaries:

- No CAW execution logic changes.
- No `.env.local` exposure.
- No server credential exposure.
- Existing tests, lint, and build pass.

## Risk Intelligence Features

The Risk Review flow now shows:

- risk score from 0-100,
- LOW / MEDIUM / HIGH risk level,
- circular meter,
- progress bar,
- triggered policy rules,
- Chinese policy explanation,
- risk contribution breakdown.

## Risk Contribution Model

Added deterministic contribution items in:

- `lib/risk/riskContributions.ts`

Current contribution examples:

| Contribution | Score | Meaning |
| --- | ---: | --- |
| 超预算 | +40 | Amount exceeds the automatic execution risk threshold |
| 未知或可疑收款方 | +25 | Recipient is unknown or matches a suspicious pattern |
| 无限授权 | +20 | Request grants unlimited future token spending |
| 不支持的 Token | +10 | Token is outside the allowed token list |
| 低风险基线 | +5 | Safe low-risk request baseline |

## UI Changes

Added:

- `components/RiskIntelligencePanel.tsx`

Updated:

- `components/SecurityDashboard.tsx`

The new panel appears before the existing RiskCard so judges first see the explainable score and then the final policy result.

## Tests

Added:

- `tests/riskContributions.test.ts`

Coverage includes:

- Chinese contribution labels,
- contribution scores,
- low-risk baseline behavior.

## Docs Updated

- `docs/architecture.md`
- `docs/demo-script.md`

## Verification

```text
npm.cmd run test  PASS
npm.cmd run lint  PASS
npm.cmd run build PASS
```

## Notes

- The contribution model is deterministic and MVP-oriented.
- It is designed to explain risk clearly during judging, not to replace production-grade transaction simulation or contract reputation systems.
- CAW execution remains behind the existing server-side route and confirmation controls.
