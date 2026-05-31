import type { MockTransactionResult } from "@/lib/mockWallet";
import type { AuditLog, PaymentRequest, PolicyDecision } from "@/types";

const STORAGE_KEY = "guardian-agent-wallet-audit-logs";

export function getAuditLogs(): AuditLog[] {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addAuditLog(log: AuditLog): void {
  if (typeof window === "undefined") return;

  const logs = getAuditLogs();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([log, ...logs]));
}

export function clearAuditLogs(): void {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(STORAGE_KEY);
}

export function createAuditLog(
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

