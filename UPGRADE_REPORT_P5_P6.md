# P5/P6 Hackathon Demo Upgrade Report

Generated: 2026-06-09

Scope:

- P5: Attack Simulation panel.
- P6: Agent Profiles UI.

Constraints respected:

- CAW execution logic was not changed.
- `.env.local` was not exposed.
- Architecture was not refactored.
- MVP flow remains stable.

## Scenarios Added

Attack Simulation presets:

| Scenario | Prompt | Expected Decision |
|---|---|---|
| 正常小额支付 | `Pay 0.001 SETH to 0xSAFE` | `ALLOW` |
| 超预算支付 | `Pay 10 SETH to 0xSAFE` | `CONFIRM` |
| 可疑收款方 | `Transfer 0.001 SETH to 0xBAD0000000000000000000000000000000000000` | `CONFIRM` |
| 无限授权攻击 | `approve unlimited USDC` | `DENY` |

Each scenario fills the input and immediately runs:

```text
Intent Parser
-> Risk Engine
-> Policy Engine
-> UI review state
```

## Profile Behavior

Agent Profiles UI now displays:

- Research Agent
- Payment Agent
- Trading Agent

For each profile, the UI shows:

- allowed actions,
- daily budget,
- allowed tokens,
- allowed recipients.

The selected profile is already wired into policy evaluation through the existing `evaluatePayment(request, currentProfile)` path. Attack Simulation expected decisions are calculated dynamically against the currently selected profile, so profile changes affect the scenario result honestly.

## Files Changed In This Upgrade

- `components/AttackSimulationPanel.tsx`
- `components/AgentProfilesPanel.tsx`
- `components/SecurityDashboard.tsx`
- `lib/demo/attackScenarios.ts`
- `lib/intent/intentParser.ts`
- `lib/policy/budgetValue.ts`
- `lib/policy/policyEngine.ts`
- `lib/policy/securityConfig.ts`
- `lib/risk/riskEngine.ts`
- `README.md`
- `tests/attackScenarios.test.ts`

## Notes

- `SETH` was added to the allowed token list so the small CAW demo transfer can pass policy evaluation before execution.
- `Pay ... to ...` and `SETH` parsing were added to support the exact attack simulation prompts.
- Native token budget value estimation was added for policy/risk calculation, so `10 SETH` is treated as a high-value over-budget payment while `0.001 SETH` remains low risk.

## Test / Lint / Build Results

```text
npm.cmd run test
PASS
26 tests passed
```

```text
npm.cmd run lint
PASS
eslint completed successfully
```

```text
npm.cmd run build
PASS
Next.js production build completed successfully
```
