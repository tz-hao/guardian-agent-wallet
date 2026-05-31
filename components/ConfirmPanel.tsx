import type { MockWalletResult } from "@/lib/mockWallet";
import type { PolicyDecision } from "@/types";

export function ConfirmPanel({
  decision,
  walletResult,
}: {
  decision: PolicyDecision;
  walletResult: MockWalletResult;
}) {
  return (
    <div className="rounded-md border border-slate-300 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        Confirmation boundary
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{walletResult.message}</p>
      <div className="mt-4 grid gap-2 text-sm text-slate-700">
        <p>Human required: {decision.decision === "CONFIRM" ? "Yes" : "No"}</p>
        <p>Mock execution: {walletResult.executed ? "Recorded" : "Not executed"}</p>
        {walletResult.settlementId ? <p className="font-mono text-xs">{walletResult.settlementId}</p> : null}
      </div>
    </div>
  );
}

