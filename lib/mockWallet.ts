import type { PaymentRequest, PolicyDecision } from "@/types";

export type MockWalletResult = {
  mode: "mock_only";
  executed: boolean;
  settlementId?: string;
  message: string;
};

export function runMockWallet(request: PaymentRequest, decision: PolicyDecision): MockWalletResult {
  if (decision.decision === "DENY") {
    return {
      mode: "mock_only",
      executed: false,
      message: "Mock wallet refused to create a payment payload.",
    };
  }

  if (decision.decision === "CONFIRM") {
    return {
      mode: "mock_only",
      executed: false,
      message: "Mock wallet is waiting for human confirmation.",
    };
  }

  return {
    mode: "mock_only",
    executed: true,
    settlementId: `mock-settlement-${request.id.slice(0, 8)}`,
    message: "Mock wallet created a bounded payment payload and recorded settlement.",
  };
}

