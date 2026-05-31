import type { PolicyDecision } from "@/types";

const styles = {
  ALLOW: {
    label: "ALLOW",
    className: "border-emerald-400/40 bg-emerald-400/10 text-emerald-100",
    dot: "bg-emerald-400",
  },
  CONFIRM: {
    label: "CONFIRM",
    className: "border-amber-400/40 bg-amber-400/10 text-amber-100",
    dot: "bg-amber-400",
  },
  DENY: {
    label: "DENY",
    className: "border-rose-400/40 bg-rose-400/10 text-rose-100",
    dot: "bg-rose-400",
  },
};

export function RiskCard({ decision }: { decision: PolicyDecision }) {
  const style = styles[decision.decision];

  return (
    <div className={`rounded-md border p-5 ${style.className}`}>
      <div className="flex items-center gap-3">
        <span className={`h-3 w-3 rounded-full ${style.dot}`} />
        <h2 className="text-2xl font-semibold">{style.label}</h2>
      </div>
      <p className="mt-3 text-sm leading-6">{decision.reason}</p>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em]">
        Risk level: {decision.riskLevel}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {decision.rulesTriggered.map((rule) => (
          <span key={rule} className="rounded-md bg-black/25 px-3 py-2 font-mono text-xs">
            {rule}
          </span>
        ))}
      </div>
    </div>
  );
}

