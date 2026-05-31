import type { AuditLog } from "@/types";

export function AuditTimeline({ log }: { log: AuditLog }) {
  const events = [
    {
      title: "Intent captured",
      detail: log.rawInput,
      status: "complete",
    },
    {
      title: "Policy evaluated",
      detail: `${log.decision} / ${log.riskLevel}`,
      status: log.decision === "DENY" ? "blocked" : "complete",
    },
    {
      title: log.decision === "ALLOW" ? "Mock settlement recorded" : "Execution paused",
      detail: log.id.startsWith("0xMOCK") ? `${log.reason} (${log.id})` : log.reason,
      status: log.decision === "ALLOW" ? "complete" : log.decision === "DENY" ? "blocked" : "waiting",
    },
  ];

  return (
    <div className="grid gap-3">
      {events.map((event, index) => (
        <div key={event.title} className="flex gap-3 rounded-md border border-slate-300 bg-white p-3">
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold text-white ${
              event.status === "blocked"
                ? "bg-rose-700"
                : event.status === "waiting"
                  ? "bg-amber-600"
                  : "bg-teal-800"
            }`}
          >
            {index + 1}
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-950">{event.title}</p>
            <p className="mt-1 break-words text-xs leading-5 text-slate-600">{event.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
