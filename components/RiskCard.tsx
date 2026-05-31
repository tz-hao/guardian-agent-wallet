import type { PolicyDecision } from "@/types";

const styles = {
  allow: {
    label: "Allowed",
    className: "border-emerald-300 bg-emerald-50 text-emerald-950",
    dot: "bg-emerald-500",
  },
  needs_human_confirmation: {
    label: "Needs Human Confirmation",
    className: "border-amber-300 bg-amber-50 text-amber-950",
    dot: "bg-amber-500",
  },
  deny: {
    label: "Denied",
    className: "border-rose-300 bg-rose-50 text-rose-950",
    dot: "bg-rose-500",
  },
};

export function RiskCard({ decision }: { decision: PolicyDecision }) {
  const style = styles[decision.status];

  return (
    <div className={`rounded-md border p-5 ${style.className}`}>
      <div className="flex items-center gap-3">
        <span className={`h-3 w-3 rounded-full ${style.dot}`} />
        <h2 className="text-2xl font-semibold">{style.label}</h2>
      </div>
      <p className="mt-3 text-sm leading-6">{decision.explanation}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {decision.reasons.map((reason) => (
          <span key={reason} className="rounded-md bg-white/70 px-3 py-2 font-mono text-xs">
            {reason}
          </span>
        ))}
      </div>
    </div>
  );
}

