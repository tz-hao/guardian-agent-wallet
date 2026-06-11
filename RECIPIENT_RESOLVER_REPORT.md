# Recipient Resolver Report

## Summary

Implemented a server-side trusted recipient resolver to fix real CAW 422 failures caused by demo aliases such as `data-api-provider` and Chinese service labels.

The UI and policy engine can continue using business-friendly aliases, while the server resolves those aliases into real EVM recipient addresses before calling Cobo Agentic Wallet.

No `.env.local` contents were read into docs or printed. `AGENT_WALLET_API_KEY` remains server-only and is not logged.

## Files Changed

- `lib/wallets/recipientResolver.ts`
- `lib/wallets/cawServer.ts`
- `lib/policy/pactPreview.ts`
- `components/PactPreview.tsx`
- `lib/audit/auditLog.ts`
- `types/index.ts`
- `.env.example`
- `tests/recipientResolver.test.ts`
- `tests/cawIntegration.test.ts`
- `tests/pactPreview.test.ts`
- `README.md`
- `docs/demo-script.md`
- `docs/06-cobo-caw-integration.md`

## Trusted Recipient Registry

Server-side registry entries:

| Alias | Chinese name | English name | Env var |
| --- | --- | --- | --- |
| `data-api-provider` | 数据 API 服务商 | Data API Provider | `CAW_RECIPIENT_DATA_API` |
| `ai-inference-service` | AI 推理服务 | AI Inference Service | `CAW_RECIPIENT_AI_INFERENCE` |
| `onchain-analytics-api` | 链上分析 API | Onchain Analytics API | `CAW_RECIPIENT_ONCHAIN_ANALYTICS` |
| `premium-research-feed` | 高级研究数据源 | Premium Research Feed | `CAW_RECIPIENT_RESEARCH_FEED` |

Each entry includes:

- `alias`
- `displayNameZh`
- `displayNameEn`
- `evmAddress`
- `allowedTokens`
- `allowedChains`
- `category`
- `isFallback`

## Resolution Behavior

`resolveRecipient(input)` supports:

- alias, for example `data-api-provider`
- Chinese display name, for example `数据 API 服务商`
- English display name, for example `Data API Provider`
- direct `0x` EVM address

If the specific recipient env var is missing, local demo mode can fall back to `CAW_DESTINATION`. The returned result marks this with `isFallback: true`.

If resolution fails, CAW execution returns:

```json
{
  "code": "unresolved_recipient",
  "reason": "Recipient must be a trusted alias or a valid EVM address."
}
```

## CAW Execution Change

Before calling CAW:

1. `executeCawPayment` resolves `request.recipient`.
2. CAW `transferTokens` receives `resolvedRecipient.evmAddress` as `dst_addr`.
3. The original UI/policy recipient label stays in the request and audit trail.
4. `WalletExecutionResult` stores:
   - `recipientAlias`
   - `displayRecipient`
   - `resolvedRecipientAddress`
   - `recipientIsFallback`

No fake tx hash is generated.

## CAW Request Preview

Pact Preview now shows:

- display recipient
- resolved EVM recipient
- whether fallback `CAW_DESTINATION` is used
- chainId
- tokenId
- amount
- pactId present / missing

## Environment Additions

Added to `.env.example`:

```bash
CAW_RECIPIENT_DATA_API=
CAW_RECIPIENT_AI_INFERENCE=
CAW_RECIPIENT_ONCHAIN_ANALYTICS=
CAW_RECIPIENT_RESEARCH_FEED=
```

Also documented:

```bash
AGENT_WALLET_PACT_ID=
CAW_DESTINATION=
```

## Tests

Added coverage for:

- resolving Chinese display name
- resolving English display name and alias
- resolving direct `0x` EVM address
- failing unknown vendor
- using `CAW_DESTINATION` fallback only when allowed
- never returning API key
- using resolved EVM address for CAW transfer
- returning `unresolved_recipient` for unknown vendors
- showing resolved recipient address in Pact Preview

## Verification

| Command | Result |
| --- | --- |
| `npm.cmd run test` | Passed, 42 tests |
| `npm.cmd run lint` | Passed |
| `npm.cmd run build` | Passed |

## Remaining Notes

- Recipient addresses are currently environment configured, not editable in the UI.
- Production should manage recipient registry updates through a reviewed admin or deployment process.
- The resolver intentionally does not expose or return `AGENT_WALLET_API_KEY`.
