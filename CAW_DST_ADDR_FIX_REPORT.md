# CAW dst_addr Fix Report

## Summary

Aligned Guardian Agent Wallet's internal CAW payload preview with the installed `@cobo/agentic-wallet` SDK transfer body.

The SDK transfer body uses:

```json
{
  "dst_addr": "0x...",
  "token_id": "SETH",
  "chain_id": "SETH",
  "amount": "0.005",
  "request_id": "..."
}
```

It does not use `dst_address`.

## Files Changed

- `lib/wallets/cawServer.ts`
- `components/ConfirmPanel.tsx`
- `types/index.ts`
- `tests/cawIntegration.test.ts`

## Implementation Notes

- The actual SDK transfer payload already used `dst_addr`.
- The safe `cawPayloadPreview` now also uses `dst_addr`.
- UI remains user-friendly by labeling the field as `目标地址 / dst_addr`.
- `displayRecipient` remains separate from the execution recipient.
- Demo aliases are not sent to CAW as recipients.
- `resolvedRecipientAddress` remains the source of the actual `dst_addr`.
- Amount remains a string.
- `chain_id` remains sourced from `CAW_NETWORK`, defaulting to `SETH`.
- `token_id` remains sourced from `CAW_TOKEN_ID`, defaulting to `SETH`.
- Pact-scoped API key flow is unchanged:
  - `PactsApi.getPact(AGENT_WALLET_PACT_ID)`
  - `TransactionsApi` uses the Pact-scoped API key

## Tests Updated

The CAW integration tests now assert:

- transfer payload uses `dst_addr`
- transfer payload does not use `dst_address`
- alias is not sent to CAW
- resolved EVM address is sent as `dst_addr`
- amount is a string

## Verification

Commands run:

```powershell
npm.cmd run test
npm.cmd run lint
npm.cmd run build
```

Results:

- `npm.cmd run test`: passed, 47 tests passed.
- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed.

## Next UI Test Input

```text
支付 0.005 SETH 给 AI 推理服务
```

## Safety

- No `.env.local` contents were printed.
- `AGENT_WALLET_API_KEY` was not exposed.
- No fake tx hash was generated.
