# CAW 403 Pact Permission Report

## Summary

The latest CAW response is a real authorization failure, not a malformed transfer payload.

CAW returned `INSUFFICIENT_PERMISSION` with required permission `can_transfer`. This means the current execution credential is not authorized by an active Pact for transfer execution.

## Root Cause

The previous implementation attempted to continue with the server configured API key when `PactsApi.getPact(AGENT_WALLET_PACT_ID)` did not return a Pact-scoped `api_key`.

That fallback is not valid for real transfers. CAW transactions require a Pact-scoped authorization key from an active Pact. Using the general server key for transfer execution causes CAW to reject the transaction with 403.

## Fix Applied

- Removed the invalid fallback from missing Pact-scoped key to server API key.
- If the active Pact does not return a Pact-scoped API key, execution stops before trying the transfer.
- The API now preserves the real CAW error status when returning execution errors.
- Added a regression test that verifies missing Pact API key errors are surfaced safely without exposing credentials.

## Files Changed

- `lib/wallets/cawServer.ts`
- `app/api/caw/execute-payment/route.ts`
- `tests/cawIntegration.test.ts`

## Security Notes

- `AGENT_WALLET_API_KEY` is not printed.
- `.env.local` is not printed.
- No fake transaction hash is generated.
- The transfer payload preview still shows only safe fields.

## Current Real CAW Blocker

The project now requires a valid active Pact that grants:

- `can_transfer`
- chain: `SETH`
- token: `SETH`
- source address: current CAW wallet address
- recipient: configured trusted recipient EVM address
- amount limit greater than or equal to the demo transfer amount

Recommended demo request:

```text
支付 0.001 SETH 给 数据 API 服务商
```

## Verification

```powershell
npm.cmd run test
npm.cmd run lint
npm.cmd run build
```

Result:

- Test: passed, 49 tests
- Lint: passed
- Build: passed

## Next Step

Create or approve a new CAW Pact in Cobo Agentic Wallet with transfer permission, then update:

```text
AGENT_WALLET_PACT_ID=<active pact id>
```

After that, retry the demo payment from the UI.
