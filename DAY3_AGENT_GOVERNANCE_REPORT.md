# Day 3 Agent Governance Report

## Summary

Implemented the Day 3 Agent Governance upgrade to show that different AI agents have different payment permissions.

The upgrade preserves the existing architecture and CAW execution path:

- No CAW server-side execution changes.
- No server credential exposure.
- No folder structure refactor.
- Selected profile is wired into existing policy evaluation.

## Agent Profiles

| Profile | Budget | Allowed actions | Approval rule |
| --- | --- | --- | --- |
| Research Agent | 5 SETH/day equivalent | pay API only | unlimited approval blocked |
| Payment Agent | 20 SETH/day equivalent | pay API, transfer | unlimited approval blocked |
| Trading Agent | 100 SETH/day equivalent | swap, transfer | unlimited approval blocked |

Implementation location:

- `lib/policy/agentProfiles.ts`

## UI Changes

Improved the dashboard Agent Profiles panel into an `Agent Governance` panel.

It now shows:

- selected profile selector,
- daily budget in SETH equivalent,
- allowed actions,
- allowed tokens,
- allowed recipients,
- unlimited approval policy,
- comparison demo for the same request under Research Agent vs Payment Agent.

Implementation location:

- `components/AgentProfilesPanel.tsx`

## Comparison Demo

Same request:

```text
Pay 0.001 SETH to 0xSAFE
```

Expected decisions:

- Research Agent: `DENY`, because it can pay APIs only.
- Payment Agent: `ALLOW`, because it can transfer small payments to trusted recipients.

This is covered by tests in:

- `tests/policyEngine.test.ts`

## Docs Updated

- `README.md`
- `docs/demo-script.md`

## Verification

```text
npm.cmd run test  PASS
npm.cmd run lint  PASS
npm.cmd run build PASS
```

## Notes

- Budget values are stored as estimated budget units and displayed as SETH equivalent in the UI.
- The policy engine already supported profile-aware evaluation, so the selected dashboard profile is fully wired into policy decisions.
- CAW execution remains separated behind the existing execution / confirmation controls.
