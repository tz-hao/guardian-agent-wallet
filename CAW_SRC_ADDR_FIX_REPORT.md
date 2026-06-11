# CAW src_addr Fix Report

## Problem

CAW returned:

```text
CAW SDK validation error (422): detail: type: missing; loc: body; src_addr; msg: Field required
```

The transfer body included:

```json
{
  "dst_addr": "0x24870681a481856b69D85D41C6f2401575228861",
  "amount": "0.001",
  "token_id": "SETH",
  "chain_id": "SETH",
  "request_id": "...",
  "description": "..."
}
```

But it did not include `src_addr`.

## Root Cause

The installed `@cobo/agentic-wallet` SDK type marks `src_addr` as optional, but the CAW API validation for this wallet/transfer path requires it.

## Fix

Updated `lib/wallets/cawServer.ts`:

- Resolve CAW wallet source address before creating transfer body.
- Add `src_addr` to the actual SDK transfer body.
- Add `src_addr` to `cawPayloadPreview`.
- Keep `dst_addr` as the resolved recipient EVM address.
- Keep alias display separate from CAW execution payload.

The transfer body now includes:

```json
{
  "src_addr": "<resolved CAW wallet address>",
  "dst_addr": "0x24870681a481856b69D85D41C6f2401575228861",
  "amount": "0.001",
  "token_id": "SETH",
  "chain_id": "SETH",
  "request_id": "...",
  "description": "..."
}
```

## Files Changed

- `lib/wallets/cawServer.ts`
- `types/index.ts`
- `components/ConfirmPanel.tsx`
- `tests/cawIntegration.test.ts`

## Tests Updated

The CAW integration tests now verify:

- `src_addr` is included in transfer body.
- `src_addr` equals the resolved wallet address.
- `dst_addr` equals the resolved recipient address.
- demo alias is not sent to CAW.
- amount remains a string.
- `dst_address` is not used.

## Verification

Commands run:

```powershell
npm.cmd run test
npm.cmd run lint
npm.cmd run build
```

Results:

- `npm.cmd run test`: passed, 48 tests passed.
- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed.

## Safety

- `.env.local` was not printed.
- `AGENT_WALLET_API_KEY` was not exposed.
- No fake tx hash was generated.

## Next UI Test

```text
支付 0.001 SETH 给 数据 API 服务商
```
