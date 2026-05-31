import type { AuditLog, PaymentRequest, PolicyDecision } from "@/types";
import type { MockWalletResult } from "@/lib/mockWallet";

export function buildAuditLog(
  request: PaymentRequest,
  decision: PolicyDecision,
  walletResult: MockWalletResult,
): AuditLog {
  return {
    id: walletResult.settlementId ?? `audit-${request.id.slice(0, 8)}`,
    timestamp: new Date().toISOString(),
    rawInput: request.rawInput,
    action: request.action,
    amount: request.amount,
    token: request.token,
    recipient: request.recipient,
    decision: decision.decision,
    riskLevel: decision.riskLevel,
    reason: decision.reason,
  };
}

