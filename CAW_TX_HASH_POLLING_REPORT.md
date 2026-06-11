# CAW Transaction Hash Polling Report

## Summary

Added server-side CAW transaction hash polling after a successful transfer request.

Some real SETH transfers return a CAW `request_id` / receipt record first while the on-chain transaction hash is still unavailable. The app now polls the CAW transaction record by `request_id` and exposes a manual refresh action in the UI.

## SDK Method Found

The installed `@cobo/agentic-wallet` SDK exposes transaction record lookup through:

```ts
TransactionRecordsApi.getUserTransactionByRequestId(wallet_uuid, request_id, ext)
```

This method is used server-side only.

## Server Changes

- Added `getCawTransactionRecordByRequestId(requestId)`.
- Added `getCawTransactionStatusByRequestId(requestId)`.
- Added polling after successful CAW transfer submission:
  - max attempts: `8`
  - interval: `2 seconds`
  - stops when a transaction hash is found
  - stops when the record becomes failed / denied / rejected
- Added transaction hash normalization for:
  - `tx_hash`
  - `transaction_hash`
  - `hash`
  - `chain_tx_hash`
  - `transactionHash`
- Added Sepolia explorer URL generation:

```text
https://sepolia.etherscan.io/tx/<txHash>
```

## API Route

Created:

```text
app/api/caw/transaction-status/route.ts
```

Input:

```json
{ "requestId": "guardian-caw-..." }
```

Output includes:

- `success`
- `requestId`
- `status`
- `txHash`
- `explorerUrl`
- `safeRecord`

Missing `requestId` is rejected with `400`.

## UI Changes

Updated execution result panel:

- Shows `交易哈希` when available.
- Shows Sepolia Etherscan link when a real hash exists.
- Shows pending state when hash is not yet available:
  - `CAW 请求已提交`
  - `Request ID`
  - `当前状态 pending`
  - `交易哈希暂未生成，请稍后刷新或查询`
- Added button:

```text
刷新交易状态
```

## Audit Log

Audit records now preserve:

- `requestId`
- `receiptId`
- `txHash` when available
- `explorerUrl` when available
- `cawStatus`
- safe transaction record metadata

## Security

- CAW status polling runs server-side.
- `AGENT_WALLET_API_KEY` is never exposed to the frontend.
- `.env.local` is not printed.
- No fake transaction hash is generated.
- Explorer URL is generated only when a real hash field is present.

## Verification

Commands run:

```powershell
npm.cmd run test
npm.cmd run lint
npm.cmd run build
```

Results:

- Test: passed, `56` tests
- Lint: passed
- Build: passed

## Files Changed

- `lib/wallets/cawServer.ts`
- `app/api/caw/transaction-status/route.ts`
- `components/ConfirmPanel.tsx`
- `components/SecurityDashboard.tsx`
- `lib/audit/auditLog.ts`
- `types/index.ts`
- `tests/cawIntegration.test.ts`
- `tests/cawTransactionStatus.test.ts`
