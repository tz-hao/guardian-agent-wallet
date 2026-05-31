"use client";

import { useMemo, useState } from "react";
import { evaluateAction, policy, scenarios } from "@/lib/policy";

const statusStyles = {
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

export default function Home() {
  const [selectedId, setSelectedId] = useState(scenarios[0].id);
  const selected = scenarios.find((item) => item.id === selectedId) ?? scenarios[0];
  const decision = useMemo(() => evaluateAction(selected), [selected]);
  const status = statusStyles[decision.status];

  return (
    <main className="min-h-screen bg-[#f6f4ef] text-slate-950">
      <section className="border-b border-slate-300 bg-[#fdfcf8]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-6 md:flex-row md:items-end md:justify-between md:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-700">
              SafePay Guard Wallet
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal md:text-5xl">
              Guardian Agent Wallet
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-700">
              AI explains. Policy decides. Wallet enforces. Human confirms. Audit records.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-3">
            <Metric label="Budget" value={`$${policy.maxAmount.toFixed(2)}`} />
            <Metric label="Chain" value={policy.chain} />
            <Metric label="Asset" value={policy.asset} />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-6 md:px-8 xl:grid-cols-[1fr_1fr_0.9fr]">
        <Panel title="Action Request" kicker="agent intent">
          <div className="grid gap-2">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => setSelectedId(scenario.id)}
                className={`min-h-16 rounded-md border px-4 py-3 text-left transition ${
                  selected.id === scenario.id
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-300 bg-white text-slate-900 hover:border-teal-600"
                }`}
              >
                <span className="block text-sm font-semibold">{scenario.label}</span>
                <span
                  className={`mt-1 block text-xs leading-5 ${
                    selected.id === scenario.id ? "text-slate-200" : "text-slate-600"
                  }`}
                >
                  {scenario.description}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-md border border-slate-300 bg-[#fbfaf4] p-4">
            <dl className="grid gap-3 text-sm">
              <Fact label="Action" value={selected.action} />
              <Fact label="Amount" value={`${selected.amount.toFixed(2)} ${selected.asset}`} />
              <Fact label="Recipient" value={selected.recipient} mono />
              <Fact label="Resource" value={selected.resource} mono />
              <Fact label="Chain" value={selected.chain} />
              {selected.prompt ? <Fact label="Prompt" value={selected.prompt} /> : null}
              {selected.toolReturn ? <Fact label="Tool return" value={selected.toolReturn} /> : null}
            </dl>
          </div>
        </Panel>

        <Panel title="Policy Decision" kicker="wallet boundary">
          <div className={`rounded-md border p-5 ${status.className}`}>
            <div className="flex items-center gap-3">
              <span className={`h-3 w-3 rounded-full ${status.dot}`} />
              <h2 className="text-2xl font-semibold">{status.label}</h2>
            </div>
            <p className="mt-3 text-sm leading-6">{decision.explanation}</p>
          </div>

          <div className="mt-5 grid gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
              Reasons
            </h3>
            <div className="flex flex-wrap gap-2">
              {decision.reasons.map((reason) => (
                <span
                  key={reason}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-800"
                >
                  {reason}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
              Human confirmation triggers
            </h3>
            <ul className="grid gap-2 text-sm leading-6 text-slate-700">
              <li>New recipient or unknown contract</li>
              <li>Amount above 0.10 USDC or daily budget exhaustion</li>
              <li>Approve, policy change, delegatecall, or failed simulation</li>
            </ul>
          </div>
        </Panel>

        <Panel title="Audit Trail" kicker="mock settlement">
          <div className="grid gap-3">
            {decision.audit.map((event, index) => (
              <div
                key={`${event}-${index}`}
                className="flex gap-3 rounded-md border border-slate-300 bg-white p-3"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-teal-800 text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <div>
                  <p className="font-mono text-sm text-slate-950">{event}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {index === 0
                      ? "Captured as structured facts, not natural-language authority."
                      : "Recorded for review and replayable policy checks."}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-md border border-slate-300 bg-[#13231f] p-4 text-sm text-[#edf7ef]">
            <p className="font-semibold">Execution mode</p>
            <p className="mt-2 leading-6 text-[#c8d8d0]">
              Mock only. No private key, real wallet, Safe module, CAW signer, x402 facilitator,
              or onchain settlement is connected.
            </p>
          </div>
        </Panel>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-300 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function Panel({
  title,
  kicker,
  children,
}: {
  title: string;
  kicker: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-slate-300 bg-[#fdfcf8] p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">{kicker}</p>
      <h2 className="mt-1 text-xl font-semibold">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Fact({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</dt>
      <dd className={`mt-1 break-words text-slate-900 ${mono ? "font-mono text-xs" : "text-sm"}`}>
        {value}
      </dd>
    </div>
  );
}
