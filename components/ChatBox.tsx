import { samplePrompts } from "@/lib/intentParser";

export function ChatBox({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-4">
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-32 w-full resize-none rounded-md border border-slate-300 bg-white p-4 text-sm leading-6 outline-none focus:border-teal-700"
        aria-label="Agent action request"
      />
      <div className="grid gap-2">
        {samplePrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onChange(prompt)}
            className="rounded-md border border-slate-300 bg-white px-4 py-3 text-left text-xs leading-5 text-slate-700 transition hover:border-teal-700"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

