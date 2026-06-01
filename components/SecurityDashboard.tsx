"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  Bot,
  CheckCircle2,
  Clock3,
  FileClock,
  Gauge,
  LayoutDashboard,
  LockKeyhole,
  ShieldAlert,
  ShieldCheck,
  Wallet,
  XCircle,
  Zap,
} from "lucide-react";
import { AuditTimeline } from "@/components/AuditTimeline";
import { ChatBox } from "@/components/ChatBox";
import { ConfirmPanel } from "@/components/ConfirmPanel";
import { RiskCard } from "@/components/RiskCard";
import { agentProfiles, getAgentProfile } from "@/lib/agentProfiles";
import {
  buildAuditTimelineItems,
  clearAuditLogs,
  getAuditLogs,
  recordIntentAndPolicy,
  recordTransactionExecuted,
  recordUserConfirmation,
} from "@/lib/auditLog";
import { appConfig } from "@/lib/config";
import { parseIntent } from "@/lib/intentParser";
import { evaluatePayment } from "@/lib/policyEngine";
import { getWalletAdapter } from "@/lib/wallets";
import type {
  AgentProfileId,
  AuditLog,
  AuditTimelineItem,
  PaymentRequest,
  PolicyDecision,
  WalletExecutionResult,
  WalletInfo,
} from "@/types";

type DashboardView = "dashboard" | "risk" | "audit";

const defaultPrompt = "\u4e70 10 USDC \u7684 ETH";
const walletAdapter = getWalletAdapter();

export function SecurityDashboard({ view }: { view: DashboardView }) {
  const pathname = usePathname();
  const [input, setInput] = useState(defaultPrompt);
  const [request, setRequest] = useState<PaymentRequest | null>(null);
  const [decision, setDecision] = useState<PolicyDecision | null>(null);
  const [agentProfileId, setAgentProfileId] = useState<AgentProfileId>("TradingAgent");
  const [walletResult, setWalletResult] = useState<WalletExecutionResult | null>(null);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => getAuditLogs());
  const auditTimelineItems: AuditTimelineItem[] = buildAuditTimelineItems(auditLogs);
  const currentProfile = getAgentProfile(agentProfileId);

  useEffect(() => {
    walletAdapter.getWalletInfo().then(setWalletInfo);
  }, []);

  function analyzeRequest() {
    const nextRequest = parseIntent(input);
    const nextDecision = evaluatePayment(nextRequest, currentProfile);

    setRequest(nextRequest);
    setDecision(nextDecision);
    setWalletResult(null);
    recordIntentAndPolicy({
      request: nextRequest,
      decision: nextDecision,
      wallet: walletInfo,
    });
    setAuditLogs(getAuditLogs());
  }

  async function executeRequest() {
    if (!request || !decision) return;

    setIsExecuting(true);
    if (decision.decision === "CONFIRM") {
      recordUserConfirmation({ requestId: request.id, confirmed: true });
    }
    const result = await walletAdapter.executePayment({ request });
    setWalletResult(result);
    setIsExecuting(false);

    recordTransactionExecuted({
      requestId: request.id,
      wallet: walletInfo,
      executionResult: result,
    });
    setAuditLogs(getAuditLogs());
  }

  function rejectRequest() {
    if (!request || !decision) return;

    recordUserConfirmation({ requestId: request.id, confirmed: false });
    setAuditLogs(getAuditLogs());
  }

  function handleProfileChange(nextProfileId: AgentProfileId) {
    const nextProfile = getAgentProfile(nextProfileId);
    setAgentProfileId(nextProfileId);

    if (request) {
      const nextDecision = evaluatePayment(request, nextProfile);
      setDecision(nextDecision);
      setWalletResult(null);
      recordIntentAndPolicy({
        request,
        decision: nextDecision,
        wallet: walletInfo,
      });
      setAuditLogs(getAuditLogs());
    }
  }

  return (
    <main className="min-h-screen bg-[#070a1a] text-slate-100">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.32),transparent_34%),radial-gradient(circle_at_top_right,rgba(126,34,206,0.28),transparent_30%)]" />
      <header className="border-b border-indigo-300/10 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-6 md:flex-row md:items-end md:justify-between md:px-8">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-blue-300">
              <ShieldCheck className="h-4 w-4" />
              Web3 Security Dashboard
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-white md:text-5xl">
              Guardian Agent Wallet
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-400">
              AI Agent Security Layer for Onchain Execution
            </p>
          </div>
          <nav className="grid grid-cols-3 gap-2 text-sm">
            <NavItem href="/" active={pathname === "/"} icon={<LayoutDashboard className="h-4 w-4" />}>
              Dashboard
            </NavItem>
            <NavItem
              href="/risk-review"
              active={pathname === "/risk-review"}
              icon={<ShieldAlert className="h-4 w-4" />}
            >
              Risk Review
            </NavItem>
            <NavItem
              href="/audit-timeline"
              active={pathname === "/audit-timeline"}
              icon={<FileClock className="h-4 w-4" />}
            >
              Audit
            </NavItem>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-6 md:px-8">
        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard
            icon={<Bot className="h-5 w-5" />}
            label="Agent"
            value={currentProfile.label}
            detail={`Daily budget $${currentProfile.dailyBudget}`}
          />
          <SummaryCard
            icon={<Gauge className="h-5 w-5" />}
            label="Risk Score"
            value={decision ? String(decision.score) : "--"}
            detail={decision ? decision.riskLevel : "Awaiting request"}
            tone={decision?.riskLevel}
          />
          <SummaryCard
            icon={<LockKeyhole className="h-5 w-5" />}
            label="Policy Result"
            value={decision?.decision ?? "PENDING"}
            detail={decision ? decision.triggeredRules.join(", ") : "No policy run yet"}
            decision={decision?.decision}
          />
          <SummaryCard
            icon={<Wallet className="h-5 w-5" />}
            label="Wallet"
            value={appConfig.walletMode.toUpperCase()}
            detail={walletInfo?.isConnected ? walletInfo.address : "Adapter ready"}
          />
        </div>

        {view === "dashboard" ? (
          <DashboardGrid
            input={input}
            setInput={setInput}
            analyzeRequest={analyzeRequest}
            request={request}
            decision={decision}
            agentProfileId={agentProfileId}
            handleProfileChange={handleProfileChange}
            walletResult={walletResult}
            isExecuting={isExecuting}
            executeRequest={executeRequest}
            rejectRequest={rejectRequest}
            auditTimelineItems={auditTimelineItems}
            clearAudit={() => {
              clearAuditLogs();
              setAuditLogs([]);
            }}
          />
        ) : null}

        {view === "risk" ? (
          <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <ControlPanel
              input={input}
              setInput={setInput}
              analyzeRequest={analyzeRequest}
              agentProfileId={agentProfileId}
              handleProfileChange={handleProfileChange}
            />
            <RiskReviewPanel
              request={request}
              decision={decision}
              walletResult={walletResult}
              isExecuting={isExecuting}
              executeRequest={executeRequest}
              rejectRequest={rejectRequest}
            />
          </div>
        ) : null}

        {view === "audit" ? (
          <div className="mt-5">
            <SecurityCard
              title="Audit Timeline"
              kicker="execution evidence"
              icon={<FileClock className="h-5 w-5" />}
            >
              <AuditTimeline
                items={auditTimelineItems}
                onClear={() => {
                  clearAuditLogs();
                  setAuditLogs([]);
                }}
              />
            </SecurityCard>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function DashboardGrid({
  input,
  setInput,
  analyzeRequest,
  request,
  decision,
  agentProfileId,
  handleProfileChange,
  walletResult,
  isExecuting,
  executeRequest,
  rejectRequest,
  auditTimelineItems,
  clearAudit,
}: {
  input: string;
  setInput: (value: string) => void;
  analyzeRequest: () => void;
  request: PaymentRequest | null;
  decision: PolicyDecision | null;
  agentProfileId: AgentProfileId;
  handleProfileChange: (profileId: AgentProfileId) => void;
  walletResult: WalletExecutionResult | null;
  isExecuting: boolean;
  executeRequest: () => void;
  rejectRequest: () => void;
  auditTimelineItems: AuditTimelineItem[];
  clearAudit: () => void;
}) {
  return (
    <div className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.05fr_0.95fr]">
      <ControlPanel
        input={input}
        setInput={setInput}
        analyzeRequest={analyzeRequest}
        agentProfileId={agentProfileId}
        handleProfileChange={handleProfileChange}
      />
      <RiskReviewPanel
        request={request}
        decision={decision}
        walletResult={walletResult}
        isExecuting={isExecuting}
        executeRequest={executeRequest}
        rejectRequest={rejectRequest}
      />
      <SecurityCard title="Audit Timeline" kicker="latest events" icon={<Clock3 className="h-5 w-5" />}>
        <AuditTimeline items={auditTimelineItems} onClear={clearAudit} />
      </SecurityCard>
    </div>
  );
}

function ControlPanel({
  input,
  setInput,
  analyzeRequest,
  agentProfileId,
  handleProfileChange,
}: {
  input: string;
  setInput: (value: string) => void;
  analyzeRequest: () => void;
  agentProfileId: AgentProfileId;
  handleProfileChange: (profileId: AgentProfileId) => void;
}) {
  return (
    <SecurityCard title="Agent" kicker="profile and intent" icon={<Bot className="h-5 w-5" />}>
      <label className="mb-4 block">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          Agent profile
        </span>
        <select
          value={agentProfileId}
          onChange={(event) => handleProfileChange(event.target.value as AgentProfileId)}
          className="mt-2 w-full rounded-md border border-blue-300/20 bg-slate-950 px-3 py-3 text-sm text-slate-100 outline-none focus:border-blue-400"
        >
          {Object.values(agentProfiles).map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.label}
            </option>
          ))}
        </select>
      </label>
      <ChatBox value={input} onChange={setInput} onSubmit={analyzeRequest} />
    </SecurityCard>
  );
}

function RiskReviewPanel({
  request,
  decision,
  walletResult,
  isExecuting,
  executeRequest,
  rejectRequest,
}: {
  request: PaymentRequest | null;
  decision: PolicyDecision | null;
  walletResult: WalletExecutionResult | null;
  isExecuting: boolean;
  executeRequest: () => void;
  rejectRequest: () => void;
}) {
  return (
    <SecurityCard title="Risk Review" kicker="policy result" icon={<ShieldAlert className="h-5 w-5" />}>
      {decision ? (
        <div className="grid gap-5">
          <div className="flex flex-wrap gap-2">
            <StatusBadge decision={decision.decision} />
            <RiskBadge riskLevel={decision.riskLevel} score={decision.score} />
          </div>
          <RiskCard decision={decision} />
          <TransactionPreview request={request} />
          <ConfirmPanel
            decision={decision}
            walletResult={walletResult}
            isExecuting={isExecuting}
            onExecute={executeRequest}
            onConfirm={executeRequest}
            onReject={rejectRequest}
          />
        </div>
      ) : (
        <EmptyState text="Submit an agent command to run parser and policy checks." />
      )}
    </SecurityCard>
  );
}

function TransactionPreview({ request }: { request: PaymentRequest | null }) {
  if (!request) return null;

  return (
    <div className="rounded-md border border-indigo-300/15 bg-slate-950/80 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-100">
        <Activity className="h-4 w-4 text-blue-300" />
        Transaction Preview
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <Fact label="Action" value={request.action} />
        <Fact label="Amount" value={`${request.amount.toFixed(2)} ${request.token}`} />
        <Fact label="Recipient" value={request.recipient || "none"} mono />
        <Fact label="Spender" value={request.spender || "none"} mono />
        <Fact label="Chain ID" value={String(request.chainId)} />
        <Fact label="Unlimited approval" value={request.isUnlimitedApproval ? "true" : "false"} />
      </dl>
    </div>
  );
}

function SecurityCard({
  title,
  kicker,
  icon,
  children,
}: {
  title: string;
  kicker: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-indigo-300/15 bg-slate-950/70 p-5 shadow-2xl shadow-blue-950/20 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-blue-300/20 bg-blue-500/10 text-blue-200">
          {icon}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-300">{kicker}</p>
          <h2 className="mt-1 text-xl font-semibold text-white">{title}</h2>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  detail,
  tone,
  decision,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  tone?: PolicyDecision["riskLevel"];
  decision?: PolicyDecision["decision"];
}) {
  return (
    <div className="rounded-md border border-indigo-300/15 bg-slate-950/70 p-4 shadow-xl shadow-blue-950/10">
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-indigo-500/15 text-blue-200">
          {icon}
        </div>
        {decision ? <StatusBadge decision={decision} compact /> : null}
        {tone ? <RiskDot riskLevel={tone} /> : null}
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 truncate text-xl font-semibold text-white">{value}</p>
      <p className="mt-2 truncate text-xs text-slate-400">{detail}</p>
    </div>
  );
}

function StatusBadge({
  decision,
  compact = false,
}: {
  decision: PolicyDecision["decision"];
  compact?: boolean;
}) {
  const classes = {
    ALLOW: "border-emerald-300/30 bg-emerald-400/15 text-emerald-200",
    CONFIRM: "border-amber-300/30 bg-amber-400/15 text-amber-200",
    DENY: "border-rose-300/30 bg-rose-400/15 text-rose-200",
  };
  const icons = {
    ALLOW: <CheckCircle2 className="h-3.5 w-3.5" />,
    CONFIRM: <Clock3 className="h-3.5 w-3.5" />,
    DENY: <XCircle className="h-3.5 w-3.5" />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${classes[decision]}`}
    >
      {icons[decision]}
      {compact ? decision.slice(0, 1) : decision}
    </span>
  );
}

function RiskBadge({
  riskLevel,
  score,
}: {
  riskLevel: PolicyDecision["riskLevel"];
  score: number;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-300/20 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-200">
      <Gauge className="h-3.5 w-3.5" />
      {riskLevel} / {score}
    </span>
  );
}

function RiskDot({ riskLevel }: { riskLevel: PolicyDecision["riskLevel"] }) {
  const color =
    riskLevel === "HIGH" ? "bg-rose-300" : riskLevel === "MEDIUM" ? "bg-amber-300" : "bg-emerald-300";

  return <span className={`h-2.5 w-2.5 rounded-full ${color}`} />;
}

function NavItem({
  href,
  active,
  icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-center gap-2 rounded-md border px-3 py-3 text-xs font-semibold transition ${
        active
          ? "border-blue-300/40 bg-blue-400/15 text-blue-100"
          : "border-indigo-300/15 bg-slate-950 text-slate-400 hover:border-blue-300/30 hover:text-white"
      }`}
    >
      {icon}
      <span>{children}</span>
    </Link>
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
    <div className="rounded-md border border-indigo-300/15 bg-slate-950/70 p-5 text-sm leading-6 text-slate-400">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-indigo-500/15 text-blue-200">
        <Zap className="h-4 w-4" />
      </div>
      {text}
    </div>
  );
}
