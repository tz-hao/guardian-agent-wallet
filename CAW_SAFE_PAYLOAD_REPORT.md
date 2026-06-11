# CAW Safe Payload Report

## Scope

Generated a safe CAW transfer payload for Guardian Agent Wallet without executing the transfer.

No `.env.local` contents or API keys were printed. No transaction hash was fabricated.

## Pact Inspection

Current Pact:

- Status: `active`
- Name: `Guardian Agent Wallet demo transfer`
- Intent: `Guardian Agent Wallet demo transfer`
- Wallet ID matches configured wallet: yes

Extracted constraints:

- Max single transfer amount: `0.01 SETH`
- Allowed chainId: `SETH`
- Allowed tokenId: `SETH`
- Allowed recipients list: no explicit recipient allowlist was found in the Pact policy

The Pact policy includes:

```text
deny_if.amount_gt = 0.01
```

## Requested Transfer

```text
chainId: SETH
tokenId: SETH
amount: 0.005
recipient alias: AI 推理服务
resolvedRecipientAddress: 0x24870681a481856b69D85D41C6f2401575228861
```

## Checks

| Check | Result | Notes |
| --- | --- | --- |
| amount <= Pact max | pass | `0.005 <= 0.01` |
| chainId allowed | pass | `SETH` is allowed |
| tokenId allowed | pass | `SETH` is allowed |
| recipient in allowed list | inconclusive | Pact does not expose an explicit recipient allowlist |

## Adjustments

- Amount adjustment: none
- Recipient adjustment: none

Because no explicit recipient allowlist was found, the recipient check cannot prove allowlisted status from Pact metadata. The resolved recipient is the same configured safe demo address used by the trusted recipient resolver.

## Safe Payload JSON

This is the requested debug payload shape:

```json
{
  "dst_address": "0x24870681a481856b69D85D41C6f2401575228861",
  "token_id": "SETH",
  "chain_id": "SETH",
  "amount": "0.005",
  "pact_id": "b499689a-73da-40ce-9ddc-f00ec311b238",
  "request_id": "guardian-safe-preview-1781180285431"
}
```

For the installed `@cobo/agentic-wallet` TypeScript SDK, the equivalent `TransferCreate` body should use snake_case `dst_addr`:

```json
{
  "dst_addr": "0x24870681a481856b69D85D41C6f2401575228861",
  "token_id": "SETH",
  "chain_id": "SETH",
  "amount": "0.005",
  "request_id": "guardian-safe-preview-1781180285431"
}
```

The Pact ID is not sent in the transfer body. The server uses `AGENT_WALLET_PACT_ID` to fetch the Pact-scoped API key, then uses that scoped key for the CAW transfer call.

## Suggested Demo Input

Use:

```text
支付 0.005 SETH 给 AI 推理服务
```

Suggested payload values:

- Amount: `0.005`
- Token: `SETH`
- Chain: `SETH`
- Recipient: `0x24870681a481856b69D85D41C6f2401575228861`

If CAW still returns `422`, the next likely cause is not the amount or token/chain. It is more likely one of:

- Pact-scoped API key not returned or not accepted for this operation
- Wallet balance or source address issue
- CAW policy constraints not fully visible from the Pact metadata
- Server expects recipient rules not represented as a simple address allowlist

## Execution

No transfer was executed.
