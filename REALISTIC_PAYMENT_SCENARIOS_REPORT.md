# Realistic Payment Scenarios Report

## Summary

Updated Guardian Agent Wallet from obvious placeholder demo requests into a more realistic Agentic Payment / API Payment / SaaS Payment environment.

This change keeps the existing CAW execution path, WalletAdapter interface, Policy Engine architecture, API key handling, and `.env.local` untouched.

## Scenarios Changed

### Default Payment Requests

The main Payment Requests panel now uses realistic business payment intents:

| Display scenario | Prompt | Parsed recipient alias | Expected result |
| --- | --- | --- | --- |
| 数据 API 服务商 | `支付 0.001 SETH 给 数据 API 服务商` | `data-api-provider` | `ALLOW` |
| AI 推理服务 | `支付 0.005 SETH 给 AI 推理服务` | `ai-inference-service` | `ALLOW` |
| 链上分析 API | `支付 0.01 SETH 给 链上分析 API` | `onchain-analytics-api` | `ALLOW` |
| 高级研究数据源 | `支付 0.05 SETH 给 高级研究数据源` | `premium-research-feed` | `ALLOW` |

## Trusted Recipients

Configured trusted recipient aliases:

- `data-api-provider`: 数据 API 服务商
- `ai-inference-service`: AI 推理服务
- `onchain-analytics-api`: 链上分析 API
- `premium-research-feed`: 高级研究数据源

These are MVP business aliases for policy and demo review. Production real CAW execution still needs a server-side resolver from service alias to verified payee address.

## Attack Simulation

Attack Simulation keeps suspicious and unsafe flows, but makes them more realistic:

| Scenario | Prompt | Expected decision |
| --- | --- | --- |
| 超预算 API 支付 | `支付 10 SETH 给 数据 API 服务商` | `CONFIRM` |
| 可疑收款方 | `支付 0.001 SETH 给 0xBAD0000000000000000000000000000000000000` | `CONFIRM` |
| 无限授权攻击 | `approve unlimited USDC` | `DENY` |
| 未授权服务商 | `支付 0.001 SETH 给 unknown-vendor` | `CONFIRM` |

## UI Copy Updated

- Main payment button: `分析支付请求`
- Execution button: `执行支付`
- Confirmation button: `确认执行`
- Reject button: `拒绝`
- Audit timeline now uses real execution-chain wording:
  - `收到 Agent 支付请求`
  - `支付意图已解析`
  - `策略判断：允许执行`
  - `已提交到 Cobo Agentic Wallet`
  - `CAW Receipt 已生成`

## Risk Review Copy Updated

Risk and policy explanations now describe realistic payment conditions:

- Low risk: `该请求为小额 API 支付，收款方在可信服务列表内，Token 与网络符合当前 CAW Pact 约束。`
- Over budget: `该请求金额超过当前 Agent 单笔支付限制，需要人工确认。`
- Unlimited approval: `该请求试图创建无限授权，已被策略拒绝。`

## Documentation Updated

- `README.md`
- `docs/demo-script.md`
- `docs/pitch.md`

## Verification

| Command | Result |
| --- | --- |
| `npm.cmd run test` | Passed |
| `npm.cmd run lint` | Passed |
| `npm.cmd run build` | Passed |

## Known Caveat

The new trusted recipients are business aliases used by the parser, policy engine, and UI. The current CAW execution logic was intentionally not changed. A production-ready payment flow should add server-side alias-to-address resolution before real CAW submission.
