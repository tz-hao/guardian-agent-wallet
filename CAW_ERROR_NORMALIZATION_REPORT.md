# CAW Error Normalization Report

## Problem

The UI could show an unhelpful CAW SDK error:

```text
CAW SDK 验证错误 (422): [object Object]
```

Root cause: SDK error payloads can contain nested objects under `response.data.error.reason`, `details`, `errors`, or related fields. The previous formatter treated object-shaped errors like strings, which could degrade into `[object Object]`.

## Changes Made

### Added Safe Error Normalizer

Created:

```text
lib/wallets/cawError.ts
```

It exports:

```ts
normalizeCawError(error): {
  status?: number;
  code?: string;
  message: string;
  details?: unknown;
  safeDetails?: Record<string, unknown>;
}
```

Supported inputs:

- string
- `Error`
- response-like object
- CAW SDK error object with nested `response`, `data`, `body`, `error`, `errors`, or `details`
- unknown nested object

### Server CAW Handling

Updated:

```text
lib/wallets/cawServer.ts
app/api/caw/execute-payment/route.ts
```

CAW SDK failures now return structured error metadata:

- `code`
- `status`
- readable `message`
- `safeDetails`
- CAW request preview

The request preview includes:

- `chainId`
- `tokenId`
- `amount`
- `recipient`
- `resolvedRecipientAddress`
- `pactIdPresent`
- `walletIdPresent`

### Frontend Error Display

Updated:

```text
lib/wallets/cawWallet.ts
components/ConfirmPanel.tsx
types/index.ts
```

The execution panel now displays:

- 错误类型
- 状态码
- 原因
- 安全详情
- CAW 请求预览

## Security Boundary

The normalizer redacts sensitive keys and strings such as:

- `AGENT_WALLET_API_KEY`
- API key fields
- authorization headers
- bearer tokens
- secret / credential-like fields

No `.env.local` values were printed. No tx hash was fabricated.

## Tests Added

Created:

```text
tests/cawError.test.ts
```

Coverage:

- nested SDK response body extraction
- useful message instead of `[object Object]`
- API key / authorization / bearer token redaction
- string, `Error`, and unknown object handling

## Verification

Commands run:

```powershell
npm.cmd run test
npm.cmd run lint
npm.cmd run build
```

Results:

- `npm.cmd run test`: passed, 45 tests passed.
- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed.

## Expected UI Behavior

For a CAW 422 response, the UI should now show a readable validation reason and safe diagnostic details instead of:

```text
[object Object]
```
