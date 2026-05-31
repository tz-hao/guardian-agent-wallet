import type { AuditEvent, MockWalletResult, PolicyDecision, WalletIntent } from "@/types";

export function buildAuditLog(
  intent: WalletIntent,
  decision: PolicyDecision,
  walletResult: MockWalletResult,
): AuditEvent[] {
  const events: AuditEvent[] = [
    {
      id: "intent",
      title: "Intent captured",
      detail: "Agent request was converted into structured wallet facts.",
      status: "complete",
    },
    {
      id: "policy",
      title: "Policy evaluated",
      detail: decision.reasons.join(", "),
      status: decision.status === "deny" ? "blocked" : "complete",
    },
  ];

  if (intent.promptInjection) {
    events.push({
      id: "prompt-injection",
      title: "Prompt injection ignored",
      detail: "Natural language instructions cannot override policy facts.",
      status: "complete",
    });
  }

  if (intent.toolReturn) {
    events.push({
      id: "tool-return",
      title: "Tool return rechecked",
      detail: "The wallet layer does not trust tool-provided approval blindly.",
      status: "complete",
    });
  }

  events.push({
    id: "wallet",
    title: walletResult.executed ? "Mock settlement recorded" : "Execution paused",
    detail: walletResult.message,
    status: walletResult.executed ? "complete" : decision.status === "deny" ? "blocked" : "waiting",
  });

  return events;
}

