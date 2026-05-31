import type { MockTransactionResult } from "@/lib/mockWallet";
import type { AuditLog, PaymentRequest, PolicyDecision } from "@/types";

export function buildAuditLog(
  request: PaymentRequest,
  decision: PolicyDecision,
  walletResult: MockTransactionResult | null,
): AuditLog {
  return {
    id: walletResult?.txHash || `audit-${request.id.slice(0, 8)}`,
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
