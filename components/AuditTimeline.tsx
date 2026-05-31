import type { AuditLog } from "@/types";

export function AuditTimeline({
  logs,
  onClear,
}: {
  logs: AuditLog[];
  onClear: () => void;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-300">Audit timeline</p>
        <button
          onClick={onClear}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-rose-400 hover:text-rose-200"
        >
          Clear
        </button>
      </div>
      <div className="grid gap-3">
        {logs.length === 0 ? (
          <div className="rounded-md border border-slate-700 bg-slate-900 p-4 text-sm text-slate-500">
            No audit logs yet.
          </div>
        ) : (
          logs.slice(0, 8).map((log, index) => (
            <div key={`${log.id}-${index}`} className="flex gap-3 rounded-md border border-slate-700 bg-slate-900 p-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold text-slate-950 ${
                  log.decision === "DENY"
                    ? "bg-rose-300"
                    : log.decision === "CONFIRM"
                      ? "bg-amber-300"
                      : "bg-emerald-300"
                }`}
              >
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  {log.decision} / {log.riskLevel}
                </p>
                <p className="mt-1 break-words text-xs leading-5 text-slate-400">{log.rawInput}</p>
                <p className="mt-1 break-words text-xs leading-5 text-slate-500">{log.reason}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
