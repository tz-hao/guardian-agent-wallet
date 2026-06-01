import type { PolicyDecision, WalletExecutionResult } from "@/types";

export function ConfirmPanel({
  decision,
  walletResult,
  isExecuting,
  onExecute,
  onConfirm,
  onReject,
}: {
  decision: PolicyDecision;
  walletResult: WalletExecutionResult | null;
  isExecuting: boolean;
  onExecute: () => void;
  onConfirm: () => void;
  onReject: () => void;
}) {
  return (
    <div className="rounded-md border border-slate-700 bg-slate-900 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        Execution gate
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{messageFor(decision, walletResult, isExecuting)}</p>

      {decision.decision === "ALLOW" ? (
        <button
          onClick={onExecute}
          disabled={isExecuting}
          className="mt-4 w-full rounded-md bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isExecuting ? "Executing..." : "Execute"}
        </button>
      ) : null}

      {decision.decision === "CONFIRM" ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={onConfirm}
            disabled={isExecuting}
            className="rounded-md bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Confirm
          </button>
          <button
            onClick={onReject}
            className="rounded-md border border-slate-600 px-4 py-3 text-sm font-semibold text-slate-200 hover:border-rose-400 hover:text-rose-200"
          >
            Reject
          </button>
        </div>
      ) : null}

      {decision.decision === "DENY" ? (
        <div className="mt-4 rounded-md border border-rose-400/40 bg-rose-400/10 p-3 text-sm text-rose-100">
          Blocked by policy. No wallet execution is available.
        </div>
      ) : null}

      {walletResult?.txHash ? (
        <p className="mt-4 break-words font-mono text-xs text-cyan-200">{walletResult.txHash}</p>
      ) : null}
    </div>
  );
}

function messageFor(
  decision: PolicyDecision,
  walletResult: WalletExecutionResult | null,
  isExecuting: boolean,
) {
  if (isExecuting) return "Wallet adapter is preparing a transaction result.";
  if (walletResult?.success) return walletResult.message;
  if (decision.decision === "ALLOW") return "Low-risk request can be executed automatically.";
  if (decision.decision === "CONFIRM") return "Human confirmation is required before execution.";
  return "Policy denied this request.";
}
