const examples = [
  "\u4e70 10 USDC \u7684 ETH",
  "\u4e70 200 USDC \u7684 ETH",
  "\u8f6c\u8d26 20 USDC \u7ed9 0xBAD",
  "approve unlimited USDC",
];

export function ChatBox({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="grid gap-4">
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-32 w-full resize-none rounded-md border border-slate-700 bg-slate-950 p-4 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400"
        aria-label="Agent action request"
        placeholder="Describe an onchain action..."
      />
      <div className="grid gap-2 sm:grid-cols-2">
        {examples.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onChange(prompt)}
            className="rounded-md border border-slate-700 bg-slate-900 px-4 py-3 text-left text-xs leading-5 text-slate-300 transition hover:border-cyan-400 hover:text-white"
          >
            {prompt}
          </button>
        ))}
      </div>
      <button
        onClick={onSubmit}
        className="rounded-md bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
      >
        Analyze request
      </button>
    </div>
  );
}
