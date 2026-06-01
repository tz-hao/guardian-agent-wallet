import type { AuditTimelineItem } from "@/types";

export function AuditTimeline({
  items,
  onClear,
}: {
  items: AuditTimelineItem[];
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
        {items.length === 0 ? (
          <div className="rounded-md border border-slate-700 bg-slate-900 p-4 text-sm text-slate-500">
            No audit logs yet.
          </div>
        ) : (
          items.slice(0, 12).map((item, index) => (
            <div
              key={`${item.auditId}-${item.id}`}
              className="flex gap-3 rounded-md border border-slate-700 bg-slate-900 p-3"
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold text-slate-950 ${toneClassName(item.tone)}`}
              >
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-100">{item.title}</p>
                <p className="mt-1 break-words text-xs leading-5 text-slate-400">
                  {item.description}
                </p>
                <div className="mt-2 grid gap-1">
                  {item.details.map((detail) => (
                    <p key={detail} className="break-words font-mono text-[11px] text-slate-500">
                      {detail}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function toneClassName(tone: AuditTimelineItem["tone"]) {
  if (tone === "danger") return "bg-rose-300";
  if (tone === "warning") return "bg-amber-300";
  if (tone === "success") return "bg-emerald-300";
  return "bg-cyan-300";
}
