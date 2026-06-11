# Debug 422 Report

## Summary

Debugged `/api/caw/execute-payment` 422 handling without refactoring the wallet architecture or exposing secrets.

No `.env.local` contents were printed or copied. `AGENT_WALLET_API_KEY` is not logged.

## Files Inspected

- `app/api/caw/execute-payment/route.ts`
- `lib/wallets/cawServer.ts`
- `lib/wallets/cawConfig.ts`
- `lib/wallets/cawWallet.ts`
- `components/PactPreview.tsx`
- `lib/policy/pactPreview.ts`
- `tests/cawIntegration.test.ts`
- `tests/pactPreview.test.ts`

## Findings

The 422 failure can come from two places:

1. Local MVP CAW validation before SDK submission.
   - Missing recipient.
   - Invalid amount.
   - Missing Pact ID.
   - Unsupported token.
   - Unsupported chain.
   - Recipient is a service alias instead of a real EVM address.

2. CAW SDK / API validation.
   - SDK or API rejects the transfer payload and returns a validation response.

The recent realistic payment scenarios use service aliases such as `data-api-provider`. These are correct for policy and demo review, but real CAW transfer execution still requires a verified EVM address. The UI now makes this clearer through the CAW request preview and exact 422 reason.

Follow-up check on 2026-06-11 confirmed the 422 handling is already implemented. One small correction was made: CAW request preview now reports `tokenId` from the current request token, so unsupported-token debugging shows the actual requested token instead of always displaying `SETH`.

## Safe Debug Logging

Added safe server-side debug logging with only these fields:

- `chainId`
- `tokenId` from the current request token
- `amount`
- `recipient`
- `pactIdExists`
- `walletIdExists`
- `apiUrlExists`
- `executionMode`

The API key is never logged.

## 422 Response Improvements

`POST /api/caw/execute-payment` now returns HTTP 422 for categorized CAW execution errors.

Response includes:

```json
{
  "result": {
    "success": false,
    "errorCode": "missing_pact_id",
    "message": "missing pact id: set AGENT_WALLET_PACT_ID for real CAW execution, or use CAW fallback/mock mode.",
    "cawRequestPreview": {
      "chainId": "SETH",
      "tokenId": "SETH",
      "amount": "0.001",
      "recipient": "0x...",
      "pactIdPresent": false
    }
  },
  "error": {
    "code": "missing_pact_id",
    "reason": "missing pact id: set AGENT_WALLET_PACT_ID for real CAW execution, or use CAW fallback/mock mode."
  }
}
```

Supported error codes:

- `missing_recipient`
- `invalid_amount`
- `missing_pact_id`
- `unsupported_token`
- `unsupported_chain`
- `caw_sdk_validation_error`

## CAW Request Preview

Added a CAW request preview before execution in Pact Preview:

- `chainId`
- `tokenId`
- `amount`
- `recipient`
- `pactId` present / missing

This lets users see why a request may fail before clicking execution.

## Tests Added / Updated

- Added CAW missing Pact ID validation coverage.
- Added CAW SDK validation error handling coverage.
- Updated Pact Preview tests to assert CAW preview fields.

## Verification

| Command | Result |
| --- | --- |
| `npm.cmd run test` | Passed, 33 tests |
| `npm.cmd run lint` | Passed |
| `npm.cmd run build` | Passed |

## Remaining Notes

- Real CAW execution still requires a real EVM recipient address.
- Service aliases are intentionally kept for realistic policy/UI demos.
- A production next step is a server-side alias-to-address resolver for trusted vendors.
- If real CAW requires a pact-scoped API key instead of a separate pact ID, keep `AGENT_WALLET_API_KEY` pact-scoped and store `AGENT_WALLET_PACT_ID` only for observability and preview.
