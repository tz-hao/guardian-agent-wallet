# 3-Minute Demo Script

Project: Guardian Agent Wallet

Positioning: Policy-Aware Agent Payment Framework Built on Cobo Agentic Wallet

## 0:00-0:25 Opening Problem

AI agents are beginning to pay for APIs, data, compute, research feeds, and SaaS services. Wallet execution is irreversible, so a direct `agent says pay -> wallet signs` flow is unsafe.

Guardian Agent Wallet separates intent, policy, execution, governance, and audit:

```text
AI explains.
Policy decides.
CAW executes.
Human governs.
Audit records.
```

```text
AI 解释意图。
策略判断风险。
CAW 执行支付。
人类治理边界。
审计记录全过程。
```

## 0:25-0:55 Normal Agent Payment

Run this safe Real CAW demo request:

```text
支付 0.0001 SETH 给 数据 API 服务商
```

Expected decision: `ALLOW`.

The intent parser converts the natural-language Agent payment request into a structured payment intent. The trusted service name maps to the alias `data-api-provider`. The server resolves that alias to a real EVM address before CAW execution. The frontend never receives the CAW API key.

Trusted demo recipients:

| Display name | Alias |
| --- | --- |
| 数据 API 服务商 | `data-api-provider` |
| AI 推理服务 | `ai-inference-service` |
| 链上分析 API | `onchain-analytics-api` |
| 高级研究数据源 | `premium-research-feed` |

## 0:55-1:25 Risk Intelligence

Point to the Risk Intelligence panel.

Show:

- 风险评分: 0-100 score
- 风险等级: LOW / MEDIUM / HIGH
- 触发规则: deterministic policy rules
- 策略解释: human-readable Chinese explanation
- 风险贡献拆解: amount, recipient, approval, and token factors

Low-risk explanation:

```text
该请求为小额 API 支付，收款方在可信服务列表内，Token 与网络符合当前 CAW Pact 约束。
```

## 1:25-1:50 Pact Preview

Point to Pact Preview before execution.

Show:

- payment intent
- amount
- token
- recipient
- allowed budget
- policy decision
- expected wallet mode
- whether human approval is required

This is the execution boundary preview before the wallet adapter is called.

## 1:50-2:10 CAW Execution

If Real CAW Mode is available, execute the safe small payment through the `执行支付` button.

CAW enforces the reusable base Pact:

- chain allowlist: `SETH`
- token allowlist: `SETH`
- max single transfer: deny if amount > `0.001 SETH`
- total spend completion: `0.05 SETH`
- time completion: after June 15, 2026
- no `tx_count = 1`, so the Pact does not complete after one transfer

Guardian enforces application-level controls before CAW execution:

- trusted recipient allowlist
- service alias to EVM address resolver
- daily demo budget
- risk score
- attack simulation denial
- audit log

The current Pact intentionally does not guess unsupported CAW recipient allowlist or daily budget fields.

## 2:10-2:40 Attack Simulation

Run the Attack Simulation buttons:

| Story | Command | Expected decision |
| --- | --- | --- |
| 超预算 API 支付 | `支付 10 SETH 给 数据 API 服务商` | `CONFIRM` |
| 可疑收款方 | `支付 0.001 SETH 给 0xBAD0000000000000000000000000000000000000` | `CONFIRM` |
| 无限授权攻击 | `approve unlimited USDC` | `DENY` |
| 未授权服务商 | `支付 0.001 SETH 给 unknown-vendor` | `CONFIRM` |

This shows that small amount alone is not enough: recipient trust, approval scope, token support, and policy boundaries all matter.

## 2:40-2:55 Audit Timeline

Open the Audit Timeline page.

Show recorded events:

- 收到 Agent 支付请求
- 支付意图已解析
- 策略判断：允许执行 / 需要人工确认 / 拒绝执行
- 人工确认执行 or 人工拒绝执行
- 已提交到 Cobo Agentic Wallet / CAW Receipt 已生成 / 模拟钱包已执行

## 2:55-3:00 Closing Value

Guardian Agent Wallet makes agent-native payments safer by separating AI intent from wallet authority.

It gives teams explainable risk, profile-based agent governance, server-side CAW execution, human confirmation for dangerous flows, and auditable evidence.

## CAW Execution Record

Do not record API keys in this file.

```text
CAW Wallet Address: <your-caw-wallet-address>
Tx Hash / Receipt ID: pending unless returned by CAW
Network: Ethereum Sepolia (SETH)
Token: SETH
Amount: 0.0001 for reusable Pact demo; max single transfer is 0.001
Recipient: trusted service alias data-api-provider; server resolves it through CAW_RECIPIENT_DATA_API or local-demo CAW_DESTINATION fallback
Reusable Pact ID: <active-reusable-pact-id>
```
