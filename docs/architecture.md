# Guardian Agent Wallet Architecture

Guardian Agent Wallet is moving from a local safety demo toward a Cobo Agentic Wallet hackathon MVP without replacing the existing modules.

## Target Flow

```text
Intent Parser
  -> Policy Engine
  -> CAW Execution Adapter
  -> Audit Log
  -> Risk Review UI
```

## Runtime Modes

- `mock`: local deterministic execution for demos and tests.
- `caw`: CAW adapter placeholder for Cobo Agentic Wallet integration.

Set the mode with:

```bash
NEXT_PUBLIC_WALLET_MODE=mock
NEXT_PUBLIC_WALLET_MODE=caw
```

CAW mode also expects:

```bash
NEXT_PUBLIC_CAW_API_BASE_URL=
NEXT_PUBLIC_CAW_WALLET_ID=
```

## Wallet Adapter Boundary

All wallet execution is routed through `WalletAdapter`:

- `getWalletInfo()`
- `executePayment()`
- `getTransactionStatus()`

The UI does not import CAW SDKs or mock wallet internals. It only asks the selected adapter to execute a policy-approved payment intent.

## Agent Profiles

Agent profiles define the permission envelope before wallet execution:

- `ResearchAgent`: can pay allowlisted APIs, has a small budget, and cannot trade.
- `PaymentAgent`: can pay APIs and transfer to allowlisted recipients.
- `TradingAgent`: can trade and has a larger budget for demo scenarios.

The policy engine evaluates each request against the selected profile's allowed actions, daily budget, single-payment limit, recipients, and tokens. This keeps "what the agent wants" separate from "what this agent is allowed to do."

## Extension Points

- `lib/wallets/cawWallet.ts`: replace the placeholder response with CAW API or SDK calls.
- `lib/policyEngine.ts`: add CAW-specific policy checks such as wallet scopes, session limits, spending windows, or allowlisted counterparties.
- `lib/auditLog.ts`: extend local audit events into server-side evidence, signed receipts, or settlement records.
- `types/index.ts`: add protocol-specific request and receipt fields as the MVP connects to real CAW execution.

## Safety Boundary

The policy engine must remain before wallet execution. CAW, Safe, ERC-4337, x402, or swap router integrations should never bypass:

1. intent parsing,
2. policy evaluation,
3. explicit human confirmation when required,
4. audit logging.
