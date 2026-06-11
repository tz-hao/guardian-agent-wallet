# CAW 422 Payload Fix Report

## Problem

The UI preview showed a valid resolved recipient:

```text
chainId: SETH
tokenId: SETH
amount: 0.001
recipient: data-api-provider
resolvedRecipientAddress: 0x24870681a481856b69D85D41C6f2401575228861
pactIdPresent: present
walletIdPresent: present
```

But CAW SDK transfer execution still returned HTTP `422`.

## SDK Findings

The installed `@cobo/agentic-wallet` TypeScript SDK defines:

```ts
transactionsApi.transferTokens(wallet_uuid, TransferCreate)
```

`TransferCreate` uses snake_case fields:

- `dst_addr`
- `amount`
- `token_id`
- `chain_id`
- `request_id`
- `description`

The SDK README also shows that transaction execution should use the Pact-scoped API key from `pact.api_key`, not the original owner/onboarding API key.

## Root Cause

The app already checked that `AGENT_WALLET_PACT_ID` existed, but the real transfer path still initialized `TransactionsApi` with the owner API key.

That meant the payload preview could look correct while CAW policy validation still rejected the transfer.

## Changes Made

Updated:

```text
lib/wallets/cawConfig.ts
lib/wallets/cawServer.ts
lib/wallets/cawError.ts
lib/wallets/cawWallet.ts
app/api/caw/execute-payment/route.ts
components/ConfirmPanel.tsx
types/index.ts
tests/cawIntegration.test.ts
```

### Transfer Payload

The server now builds the SDK transfer body as:

```ts
{
  dst_addr: resolvedRecipient.evmAddress,
  amount: String(request.amount),
  token_id,
  chain_id,
  request_id,
  description
}
```

The demo alias is not sent as the transfer recipient. It remains only as display/audit metadata.

### Pact-Scoped API Key

Before real transfer execution, the server now calls:

```ts
PactsApi.getPact(AGENT_WALLET_PACT_ID)
```

Then it uses the returned Pact-scoped `api_key` to initialize:

```ts
new TransactionsApi(new Configuration({ apiKey: pactApiKey, basePath }))
```

The Pact API key is never printed or returned to the frontend.

### Runtime Config

The server now reads:

- `CAW_NETWORK`
- `CAW_TOKEN_ID`

with safe defaults to `SETH`.

### Failure Debug Preview

On CAW SDK failure, the response can include:

```ts
cawPayloadPreview: {
  pactIdPresent: true,
  dstAddress: resolvedRecipientAddress,
  tokenId,
  chainId,
  amount: String(amount),
  requestId
}
```

This preview is safe: it does not include API keys, authorization headers, or bearer tokens.

### Error Normalization

The CAW error normalizer now extracts safe fields from:

- `error.response.data`
- `error.response.body`
- `error.body`
- `error.data`
- `error.details`
- `error.errors`
- `error.reason`
- `error.code`
- `error.suggestion`

It still redacts API keys, authorization headers, bearer tokens, and credential-like fields.

## Tests Added

Added coverage for:

- alias is resolved but not sent as recipient
- `dst_addr` equals `resolvedRecipientAddress`
- amount is a string
- `[object Object]` never appears in UI-facing error messages
- safe SDK error details are extracted
- CAW payload preview is returned on SDK validation failure

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

## Notes

- No `.env.local` values were printed.
- `AGENT_WALLET_API_KEY` was not exposed.
- No fake transaction hash was generated.
- A real tx hash should only be shown if CAW returns one after actual execution.
