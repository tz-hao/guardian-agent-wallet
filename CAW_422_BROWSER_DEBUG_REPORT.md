# CAW 422 Browser Debug Report

## Issue

The UI showed:

```text
CAW SDK validation error: Request failed with status code 422
状态码: 未知
安全详情: {}
```

The payload preview itself was valid:

```text
chainId: SETH
tokenId: SETH
amount: 0.001
recipient: data-api-provider
resolvedRecipientAddress: 0x24870681a481856b69D85D41C6f2401575228861
pactIdPresent: present
walletIdPresent: present
dst_addr: 0x24870681a481856b69D85D41C6f2401575228861
```

## Root Cause

The CAW SDK throws Axios-style errors that are both:

- `Error` instances, and
- objects containing `response.status` and `response.data` / `response.body`.

The previous error normalizer handled `Error` first, so it returned only:

```text
Request failed with status code 422
```

That discarded the SDK response status and body before the UI could display them.

## Fix

Updated `lib/wallets/cawError.ts` so response-like payloads are parsed before the generic `Error` branch.

Now the normalizer extracts:

- `response.status`
- `response.data`
- `response.body`
- nested `error.code`
- nested `error.reason`
- nested `error.details`
- `suggestion`

Sensitive fields remain redacted.

## Browser Debug Attempt

Chrome plugin connection succeeded and found the Guardian Agent Wallet tab.

However, Chrome browser automation rejected direct access to:

```text
http://localhost:3000
```

Reason:

```text
Browser Use cannot access http://localhost:3000 because enterprise network policy blocks it.
```

Because the browser plugin explicitly blocked localhost access, no browser workaround was attempted.

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

## Expected UI Result

After refreshing the local app manually, a CAW 422 should no longer show:

```text
状态码: 未知
安全详情: {}
```

Instead, it should show:

- status code `422`
- CAW error code if returned
- CAW reason if returned
- safe details if returned
- CAW request preview
- CAW payload preview

## Safety

- `.env.local` was not printed.
- `AGENT_WALLET_API_KEY` was not exposed.
- No fake tx hash was generated.
