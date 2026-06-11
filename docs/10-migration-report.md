# Migration Report

## 1. Files Moved

The repository was refactored from mixed flat `lib/*.ts` files into clearer module folders.

| Old Path | New Path |
| --- | --- |
| `lib/intentParser.ts` | `lib/intent/intentParser.ts` |
| `lib/riskEngine.ts` | `lib/risk/riskEngine.ts` |
| `lib/policyEngine.ts` | `lib/policy/policyEngine.ts` |
| `lib/agentProfiles.ts` | `lib/policy/agentProfiles.ts` |
| `lib/securityConfig.ts` | `lib/policy/securityConfig.ts` |
| `lib/auditLog.ts` | `lib/audit/auditLog.ts` |
| `lib/config.ts` | `lib/wallets/cawConfig.ts` |

New wallet integration support file:

- `lib/wallets/cawTypes.ts`

Existing wallet files retained:

- `lib/wallets/walletAdapter.ts`
- `lib/wallets/mockWallet.ts`
- `lib/wallets/cawWallet.ts`
- `lib/wallets/index.ts`

## 2. Import Paths Updated

Updated imports in:

- `components/SecurityDashboard.tsx`
- `tests/auditLog.test.ts`
- `tests/policyEngine.test.ts`
- `tests/riskEngine.test.ts`
- `lib/policy/agentProfiles.ts`
- `lib/policy/policyEngine.ts`
- `lib/risk/riskEngine.ts`
- `lib/wallets/cawWallet.ts`
- `lib/wallets/index.ts`

Documentation paths were also updated in:

- `README.md`
- `docs/02-system-architecture.md`
- `docs/03-policy-engine.md`
- `docs/04-risk-engine.md`
- `docs/05-wallet-adapter.md`
- `docs/06-cobo-caw-integration.md`
- `docs/architecture.md`

## 3. New Folder Structure

```text
lib/
  intent/
    intentParser.ts
  risk/
    riskEngine.ts
  policy/
    agentProfiles.ts
    policyEngine.ts
    securityConfig.ts
  wallets/
    walletAdapter.ts
    mockWallet.ts
    cawWallet.ts
    cawConfig.ts
    cawTypes.ts
    index.ts
  audit/
    auditLog.ts
  mockWallet.ts
```

Note: `lib/mockWallet.ts` remains as a legacy compatibility re-export. The frontend no longer imports it directly.

## 4. What Still Uses Mock Mode

Mock mode is still used by:

- default wallet adapter selection when `NEXT_PUBLIC_WALLET_MODE` is unset,
- explicit `NEXT_PUBLIC_WALLET_MODE=mock`,
- CAW fallback path when CAW credentials are missing,
- local demo execution,
- unit tests,
- the current hackathon MVP demo flow.

## 5. What Is Ready For CAW Integration

Ready boundaries:

- `WalletAdapter` interface exists.
- `MockWalletAdapter` implements `WalletAdapter`.
- `CawWalletAdapter` implements `WalletAdapter`.
- `cawConfig.ts` centralizes CAW env configuration.
- `cawTypes.ts` provides initial CAW intent/receipt types.
- `getWalletAdapter()` selects CAW only when mode is `caw` and credentials exist.
- Frontend uses `getWalletAdapter()` instead of calling mock wallet directly.
- Audit log records wallet execution results through the adapter layer.

## 6. Remaining TODOs

- Continue expanding Cobo Agentic Wallet API/SDK calls from the server-side CAW execution path.
- Expand `cawTypes.ts` after the real CAW API shape is confirmed.
- Add unit tests for CAW mode with missing credentials and mocked valid credentials.
- Remove `lib/mockWallet.ts` legacy compatibility re-export after old imports are no longer needed.
- Consider extracting dashboard state into a hook.
- Consider splitting `types/index.ts` by domain after MVP.
- Add browser/e2e tests for the four demo scenarios.

## 7. Commands Run

```bash
npm.cmd run test
npm.cmd run lint
npm.cmd run build
```

Required commands:

```bash
npm run lint
npm run build
```

The Windows environment used `npm.cmd` to avoid PowerShell script execution issues.

## 8. Known Issues

- Real CAW execution is implemented for the narrow MVP `SETH` transfer path.
- CAW mode falls back to mock mode if server credentials are missing or `CAW_MOCK_MODE=true`.
- Audit persistence is browser localStorage only.
- `lib/mockWallet.ts` is still present as a compatibility re-export.
- Some older docs still exist alongside the new numbered docs.
- Git reports warnings about inaccessible global Git config ignore file: `C:\Users\71546/.config/git/ignore`.
