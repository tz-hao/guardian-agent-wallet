import type { MockWalletResult, PolicyDecision, WalletIntent } from "@/types";

export function runMockWallet(intent: WalletIntent, decision: PolicyDecision): MockWalletResult {
  if (decision.status === "deny") {
    return {
      mode: "mock_only",
      executed: false,
      message: "Mock wallet refused to create a payment payload.",
    };
  }

  if (decision.status === "needs_human_confirmation") {
    return {
      mode: "mock_only",
      executed: false,
      message: "Mock wallet is waiting for human confirmation.",
    };
  }

  return {
    mode: "mock_only",
    executed: true,
    settlementId: `mock-settlement-${intent.id.slice(0, 8)}`,
    message: "Mock wallet created a bounded payment payload and recorded settlement.",
  };
}

