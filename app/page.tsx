"use client";

import { useEffect, useState } from "react";
import { AuditTimeline } from "@/components/AuditTimeline";
import { ChatBox } from "@/components/ChatBox";
import { ConfirmPanel } from "@/components/ConfirmPanel";
import { RiskCard } from "@/components/RiskCard";
import { addAuditLog, clearAuditLogs, createAuditLog, getAuditLogs } from "@/lib/auditLog";
import { appConfig } from "@/lib/config";
import { parseIntent } from "@/lib/intentParser";
import { evaluatePayment, walletPolicy } from "@/lib/policyEngine";
import { getWalletAdapter } from "@/lib/wallets";
import type {
  AuditLog,
  PaymentRequest,
  PolicyDecision,
  WalletExecutionResult,
  WalletInfo,
} from "@/types";

const defaultPrompt = "\u4e70 10 USDC \u7684 ETH";
const walletAdapter = getWalletAdapter();

export default function Home() {
  const [input, setInput] = useState(defaultPrompt);
  const [request, setRequest] = useState<PaymentRequest | null>(null);
  const [decision, setDecision] = useState<PolicyDecision | null>(null);
  const [walletResult, setWalletResult] = useState<WalletExecutionResult | null>(null);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => getAuditLogs());

  useEffect(() => {
    walletAdapter.getWalletInfo().then(setWalletInfo);
  }, []);

  function analyzeRequest() {
    const nextRequest = parseIntent(input);
    const nextDecision = evaluatePayment(nextRequest);

    setRequest(nextRequest);
    setDecision(nextDecision);
    setWalletResult(null);
  }

  async function executeRequest() {
    if (!request || !decision) return;

    setIsExecuting(true);
    const result = await walletAdapter.executePayment({ request });
    setWalletResult(result);
    setIsExecuting(false);

    const log = createAuditLog(request, decision, result);
    addAuditLog(log);
    setAuditLogs(getAuditLogs());
  }

  function rejectRequest() {
    if (!request || !decision) return;

    const log = createAuditLog(request, {
      ...decision,
      reason: `Rejected by user: ${decision.reason}`,
    }, null);
    addAuditLog(log);
    setAuditLogs(getAuditLogs());
  }

  return (
    <main className="min-h-screen bg-[#07100f] text-slate-100">
      <section className="border-b border-cyan-400/10 bg-[#091615]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 md:flex-row md:items-end md:justify-between md:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300">
              Wallet / Permission / Safe Execution
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-white md:text-5xl">
              Guardian Agent Wallet
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-400">
              AI Agent Security Layer for Onchain Execution
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <Metric label="Budget" value={`$${walletPolicy.maxAmount.toFixed(0)}`} />
            <Metric label="Trusted" value={String(walletPolicy.trustedRecipients.length)} />
            <Metric label="Mode" value={appConfig.walletMode.toUpperCase()} />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-6 md:px-8 xl:grid-cols-[1fr_1fr_0.95fr]">
        <Panel title="Action Request" kicker="agent command">
          <ChatBox value={input} onChange={setInput} onSubmit={analyzeRequest} />
          {request ? (
            <div className="mt-5 rounded-md border border-slate-700 bg-slate-950 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Parsed transaction
              </p>
              <dl className="grid gap-3 text-sm">
                <Fact label="Action" value={request.action} />
                <Fact label="Amount" value={`${request.amount.toFixed(2)} ${request.token}`} />
                <Fact label="Recipient" value={request.recipient || "none"} mono />
                <Fact label="Spender" value={request.spender || "none"} mono />
                <Fact label="Chain ID" value={String(request.chainId)} />
                <Fact
                  label="Unlimited approval"
                  value={request.isUnlimitedApproval ? "true" : "false"}
                />
              </dl>
            </div>
          ) : null}
        </Panel>

        <Panel title="Risk Review" kicker="policy engine">
          {decision ? (
            <>
              <RiskCard decision={decision} />
              <div className="mt-5">
                <ConfirmPanel
                  decision={decision}
                  walletResult={walletResult}
                  isExecuting={isExecuting}
                  onExecute={executeRequest}
                  onConfirm={executeRequest}
                  onReject={rejectRequest}
                />
              </div>
            </>
          ) : (
            <EmptyState text="Submit an agent command to run parser and policy checks." />
          )}
        </Panel>

        <Panel title="Audit Trail" kicker="local evidence">
          {walletInfo ? (
            <div className="mb-4 rounded-md border border-slate-700 bg-slate-950 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Wallet adapter
              </p>
              <dl className="mt-3 grid gap-3 text-sm">
                <Fact label="Name" value={walletInfo.name} />
                <Fact label="Address" value={walletInfo.address} mono />
                <Fact label="Connected" value={walletInfo.isConnected ? "true" : "false"} />
              </dl>
            </div>
          ) : null}
          <AuditTimeline
            logs={auditLogs}
            onClear={() => {
              clearAuditLogs();
              setAuditLogs([]);
            }}
          />
          <div className="mt-5 rounded-md border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-50">
            <p className="font-semibold">Execution boundary</p>
            <p className="mt-2 leading-6 text-cyan-100/80">
              Execution goes through a WalletAdapter. Mock mode stays local; CAW mode is an
              integration placeholder until real credentials and review gates are configured.
            </p>
          </div>
        </Panel>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-700 bg-slate-950 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-100">{value}</p>
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
    <section className="rounded-md border border-slate-800 bg-[#0d1817] p-5 shadow-2xl shadow-black/20">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">{kicker}</p>
      <h2 className="mt-1 text-xl font-semibold text-white">{title}</h2>
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
      <dd className={`mt-1 break-words text-slate-200 ${mono ? "font-mono text-xs" : "text-sm"}`}>
        {value}
      </dd>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-slate-700 bg-slate-950 p-5 text-sm leading-6 text-slate-400">
      {text}
    </div>
  );
}
