import type { PolicyDecision } from "@/types";

export type ExecutionTrigger = "auto" | "manual";

export function shouldAutoExecutePayment({
  autoExecuteEnabled,
  decision,
  hasExecuted,
}: {
  autoExecuteEnabled: boolean;
  decision: PolicyDecision | null;
  hasExecuted: boolean;
}) {
  return autoExecuteEnabled && !hasExecuted && decision?.decision === "ALLOW";
}

export function autoExecuteMessage(decision: PolicyDecision | null) {
  if (decision?.decision === "ALLOW") {
    return "策略判断为 ALLOW，自动执行模式已将该请求提交到 CAW。";
  }

  if (decision?.decision === "CONFIRM") {
    return "该请求需要人工确认。";
  }

  if (decision?.decision === "DENY") {
    return "该请求已被策略拒绝，不会执行。";
  }

  return "开启后，低风险 ALLOW 支付会自动提交到 CAW。";
}
