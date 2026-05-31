import type { MockTransactionResult } from "@/lib/mockWallet";
import type { PolicyDecision } from "@/types";

export function ConfirmPanel({
  decision,
  walletResult,
  isExecuting,
}: {
  decision: PolicyDecision;
  walletResult: MockTransactionResult | null;
  isExecuting: boolean;
}) {
  const message = getMessage(decision, walletResult, isExecuting);

  return (
    <div className="rounded-md border border-slate-300 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        Confirmation boundary
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{message}</p>
      <div className="mt-4 grid gap-2 text-sm text-slate-700">
        <p>Human required: {decision.decision === "CONFIRM" ? "Yes" : "No"}</p>
        <p>Mock execution: {walletResult?.success ? "Recorded" : "Not recorded"}</p>
        {walletResult?.txHash ? <p className="break-words font-mono text-xs">{walletResult.txHash}</p> : null}
      </div>
    </div>
  );
}

function getMessage(
  decision: PolicyDecision,
  walletResult: MockTransactionResult | null,
  isExecuting: boolean,
) {
  if (isExecuting) return "Mock wallet is preparing a transaction result.";
  if (decision.decision === "DENY") return "Mock wallet refused to create a transaction.";
  if (decision.decision === "CONFIRM") return "Mock wallet is waiting for human confirmation.";
  if (walletResult?.success) return "Mock wallet returned a successful transaction hash.";
  if (walletResult && !walletResult.success) return "Mock wallet returned a failed transaction.";
  return "Mock wallet has not executed yet.";
}
