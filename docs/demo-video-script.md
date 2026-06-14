# Demo Video Script

## 30-Second Pitch

Guardian Agent Wallet is a Policy-Aware Agent Payment Framework Built on Cobo Agentic Wallet.

It is designed for agentic commerce: AI agents may need to pay for APIs, AI inference, onchain analytics, or research feeds, but they should not receive unrestricted wallet authority.

The core flow is:

```text
AI explains.
Policy decides.
CAW executes.
Human governs.
Audit records.
```

## 3-Minute Demo

### 0:00-0:20 Problem

AI agents can initiate payments, but wallet execution is irreversible. Prompt injection, forged tool output, unknown recipients, overspending, and unlimited approval requests can all turn autonomous payments into real financial risk.

Guardian Agent Wallet asks a narrower question: can an agent pay within explicit policy, budget, permission, and audit boundaries?

### 0:20-0:45 Solution

Guardian splits execution into verifiable stages:

- Intent Parser turns natural language into a structured payment request.
- Risk Engine explains risk.
- Policy Engine returns `ALLOW`, `CONFIRM`, or `DENY`.
- CAW executes only through the server-side adapter and active Pact.
- Audit Log records intent, policy, trigger, CAW status, receipt, and tx hash if CAW returns it.

### 0:45-1:15 Auto Execute Demo

Turn on:

```text
自动执行低风险支付 / Auto-execute low-risk payments
```

Run:

```text
支付 0.0001 SETH 给 数据 API 服务商
```

Expected:

- Risk: LOW
- Policy: ALLOW
- Trigger: auto
- Result: submitted to CAW automatically

Narration:

This request is small, uses SETH, and targets a trusted service alias. Guardian resolves the alias server-side to an EVM address. Since Auto Execute Mode is enabled and the decision is `ALLOW`, the app submits it to CAW without requiring an extra click.

### 1:15-1:50 Manual Confirmation Demo

Run:

```text
支付 0.5 SETH 给 数据 API 服务商
```

Expected:

- Within CAW wallet-layer max: 1 SETH
- Above Guardian auto threshold: 0.001 SETH
- Policy: CONFIRM
- Trigger: manual only

Narration:

This is still inside the CAW Pact max single transfer boundary, but it is too large for automatic execution. Guardian requires human confirmation before calling CAW.

### 1:50-2:20 Deny And Attack Demo

Run:

```text
支付 2 SETH 给 数据 API 服务商
```

Expected: `DENY`, because it exceeds the 1 SETH CAW / Guardian max.

Then run:

```text
approve unlimited USDC
```

Expected: `DENY`, because unlimited approval is dangerous.

Narration:

Guardian does not automatically execute every payment the Pact could theoretically cover. It applies a safer application-layer policy before CAW execution.

### 2:20-2:45 Pact Preview

Point to the two-layer boundary:

CAW Pact wallet boundary:

- permission: `can_transfer`
- chain: `SETH`
- token: `SETH`
- max single transfer: `1 SETH`

Guardian auto-execute boundary:

- auto-execute only low-risk `ALLOW` payments
- default auto threshold: `0.001 SETH`
- larger payments require human confirmation

### 2:45-3:00 Closing

Human approves the Pact once in Cobo Agentic Wallet. After that, low-risk agent payments can move automatically, medium/high-value payments require human confirmation, dangerous requests are denied, and CAW remains the mandatory execution layer.
