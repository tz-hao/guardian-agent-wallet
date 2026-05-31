"use client";

import { useEffect, useMemo, useState } from "react";
import { AuditTimeline } from "@/components/AuditTimeline";
import { ChatBox } from "@/components/ChatBox";
import { ConfirmPanel } from "@/components/ConfirmPanel";
import { RiskCard } from "@/components/RiskCard";
import { addAuditLog, clearAuditLogs, createAuditLog, getAuditLogs } from "@/lib/auditLog";
import { parseIntent } from "@/lib/intentParser";
import { executeMockTransaction, type MockTransactionResult } from "@/lib/mockWallet";
import { evaluatePayment, walletPolicy } from "@/lib/policyEngine";
import type { AuditLog } from "@/types";

const defaultPrompt = "Pay 0.10 USDC on Base for the allowlisted x402 API.";

export default function Home() {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [execution, setExecution] = useState<{
    requestId: string;
    result: MockTransactionResult;
  } | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => getAuditLogs());
  const intent = useMemo(() => parseIntent(prompt), [prompt]);
  const decision = useMemo(() => evaluatePayment(intent), [intent]);
  const walletResult = execution?.requestId === intent.id ? execution.result : null;
  const isExecuting = decision.decision === "ALLOW" && !walletResult;
  const currentAuditLog = useMemo(
    () => createAuditLog(intent, decision, walletResult),
    [intent, decision, walletResult],
  );

  useEffect(() => {
    let cancelled = false;

    if (decision.decision !== "ALLOW") {
      return;
    }

    executeMockTransaction(intent).then((result) => {
      if (!cancelled) {
        setExecution({ requestId: intent.id, result });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [intent, decision]);

  return (
    <main className="min-h-screen bg-[#f6f4ef] text-slate-950">
      <section className="border-b border-slate-300 bg-[#fdfcf8]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-6 md:flex-row md:items-end md:justify-between md:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-700">
              3-7 day MVP
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal md:text-5xl">
              Guardian Agent Wallet
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-700">
              AI explains. Policy decides. Wallet enforces. Human confirms. Audit records.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-3">
            <Metric label="Budget" value={`$${walletPolicy.maxAmount.toFixed(2)}`} />
            <Metric label="Trusted" value={String(walletPolicy.trustedRecipients.length)} />
            <Metric label="Mode" value="Mock" />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-6 md:px-8 xl:grid-cols-[1fr_1fr_0.9fr]">
        <Panel title="Action Request" kicker="agent intent">
          <ChatBox value={prompt} onChange={setPrompt} />
          <div className="mt-5 rounded-md border border-slate-300 bg-[#fbfaf4] p-4">
            <dl className="grid gap-3 text-sm">
              <Fact label="Request ID" value={intent.id} mono />
              <Fact label="Action" value={intent.action} />
              <Fact label="Amount" value={`${intent.amount.toFixed(2)} ${intent.token}`} />
              <Fact label="Recipient" value={intent.recipient} mono />
              <Fact label="Spender" value={intent.spender || "none"} mono />
              <Fact label="Chain ID" value={String(intent.chainId)} />
              <Fact label="Unlimited approval" value={intent.isUnlimitedApproval ? "true" : "false"} />
            </dl>
          </div>
        </Panel>

        <Panel title="Policy Decision" kicker="wallet boundary">
          <RiskCard decision={decision} />
          <div className="mt-5">
            <ConfirmPanel
              decision={decision}
              walletResult={walletResult}
              isExecuting={isExecuting}
            />
          </div>
        </Panel>

        <Panel title="Audit Trail" kicker="mock settlement">
          <AuditTimeline
            logs={[currentAuditLog, ...auditLogs]}
            onClear={() => {
              clearAuditLogs();
              setAuditLogs([]);
            }}
          />
          <button
            onClick={() => {
              addAuditLog(currentAuditLog);
              setAuditLogs(getAuditLogs());
            }}
            className="mt-3 w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:border-teal-700"
          >
            Save current audit log
          </button>
          <div className="mt-5 rounded-md border border-slate-300 bg-[#13231f] p-4 text-sm text-[#edf7ef]">
            <p className="font-semibold">Execution mode</p>
            <p className="mt-2 leading-6 text-[#c8d8d0]">
              Mock only. No Safe, ERC-4337, 1inch, Uniswap, GPT API, private key, or onchain
              settlement is connected.
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
