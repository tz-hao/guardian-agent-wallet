import { autoExecuteMessage } from "@/lib/policy/autoExecute";
import type { PolicyDecision, WalletExecutionResult } from "@/types";

export function ConfirmPanel({
  decision,
  walletResult,
  isExecuting,
  autoExecuteEnabled,
  onExecute,
  onConfirm,
  onReject,
  onRefreshTransactionStatus,
  isRefreshingTransactionStatus = false,
}: {
  decision: PolicyDecision;
  walletResult: WalletExecutionResult | null;
  isExecuting: boolean;
  autoExecuteEnabled: boolean;
  onExecute: () => void;
  onConfirm: () => void;
  onReject: () => void;
  onRefreshTransactionStatus?: () => void;
  isRefreshingTransactionStatus?: boolean;
}) {
  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-4">
        <p className="text-xs font-medium text-[#6B7280]">CAW Execution Gate</p>
        <p className="mt-2 text-sm leading-6 text-[#111827]">
          {messageFor(decision, walletResult, isExecuting, autoExecuteEnabled)}
        </p>
      </div>

      {decision.decision === "ALLOW" && !autoExecuteEnabled ? (
        <button
          onClick={onExecute}
          disabled={isExecuting}
          className="rounded-xl bg-[#111827] px-4 py-3 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isExecuting ? "执行中..." : "执行支付"}
        </button>
      ) : null}

      {decision.decision === "CONFIRM" ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onConfirm}
            disabled={isExecuting}
            className="rounded-xl bg-[#111827] px-4 py-3 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExecuting ? "执行中..." : "确认执行"}
          </button>
          <button
            onClick={onReject}
            className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-medium text-[#111827] transition hover:border-[#111827]"
          >
            拒绝
          </button>
        </div>
      ) : null}

      {decision.decision === "DENY" ? (
        <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-sm text-[#B91C1C]">
          已被策略拒绝，不会进入钱包执行。
        </div>
      ) : null}

      {walletResult ? (
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
          <p className="text-xs font-medium text-[#6B7280]">执行结果</p>
          <p className="mt-2 text-sm leading-6 text-[#111827]">{walletResult.message}</p>
          {walletResult.executionTrigger ? (
            <p className="mt-2 text-xs text-[#6B7280]">Execution trigger: {walletResult.executionTrigger}</p>
          ) : null}
          {walletResult.txHash ? (
            <div className="mt-3 grid gap-2 rounded-lg border border-[#D1FAE5] bg-[#ECFDF5] p-3">
              <p className="text-xs font-medium text-[#047857]">交易哈希</p>
              <p className="break-words font-mono text-xs text-[#111827]">{walletResult.txHash}</p>
              {walletResult.explorerUrl ? (
                <a
                  href={walletResult.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-[#047857] underline underline-offset-4"
                >
                  Sepolia Etherscan link
                </a>
              ) : null}
            </div>
          ) : null}
          {walletResult.success && !walletResult.txHash ? (
            <div className="mt-3 grid gap-3 rounded-lg border border-[#FEF3C7] bg-[#FFFBEB] p-3 text-sm text-[#92400E]">
              <p className="font-medium">CAW 请求已提交</p>
              {walletResult.requestId ? (
                <p className="break-words font-mono text-xs text-[#111827]">Request ID: {walletResult.requestId}</p>
              ) : null}
              <p className="text-xs">当前状态 pending。交易哈希暂未生成，请稍后刷新或查询。</p>
              {onRefreshTransactionStatus && walletResult.requestId ? (
                <button
                  onClick={onRefreshTransactionStatus}
                  disabled={isRefreshingTransactionStatus}
                  className="w-fit rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-medium text-[#111827] transition hover:border-[#111827] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isRefreshingTransactionStatus ? "刷新中..." : "刷新交易状态"}
                </button>
              ) : null}
            </div>
          ) : null}
          {!walletResult.success && walletResult.cawError ? <CawErrorDetails walletResult={walletResult} /> : null}
        </div>
      ) : null}
    </div>
  );
}

function CawErrorDetails({ walletResult }: { walletResult: WalletExecutionResult }) {
  const preview = walletResult.cawRequestPreview;
  const payloadPreview = walletResult.cawPayloadPreview;

  return (
    <div className="mt-4 grid gap-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-sm text-[#7F1D1D]">
      <div className="grid gap-2 sm:grid-cols-2">
        <ErrorFact label="错误类型" value={walletResult.cawError?.code || walletResult.errorCode || "caw_validation_error"} />
        <ErrorFact label="状态码" value={walletResult.cawError?.status ? String(walletResult.cawError.status) : "未知"} />
      </div>
      <ErrorFact label="原因" value={walletResult.cawError?.message || walletResult.message} />
      {walletResult.cawError?.safeDetails ? (
        <pre className="max-h-44 overflow-auto rounded-lg border border-[#FECACA] bg-white p-3 text-xs leading-5 text-[#111827]">
          {safeJson(walletResult.cawError.safeDetails)}
        </pre>
      ) : null}
      {preview ? (
        <div className="grid gap-2 rounded-lg border border-[#FECACA] bg-white p-3">
          <p className="text-xs font-semibold text-[#991B1B]">CAW 请求预览</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <ErrorFact label="chainId" value={preview.chainId} />
            <ErrorFact label="tokenId" value={preview.tokenId} />
            <ErrorFact label="amount" value={preview.amount} />
            <ErrorFact label="recipient" value={preview.recipient} />
            <ErrorFact label="resolvedRecipientAddress" value={preview.resolvedRecipientAddress || "未解析"} mono />
            <ErrorFact label="pactIdPresent" value={preview.pactIdPresent ? "present" : "missing"} />
            <ErrorFact label="walletIdPresent" value={preview.walletIdPresent ? "present" : "missing"} />
          </div>
        </div>
      ) : null}
      {payloadPreview ? (
        <div className="grid gap-2 rounded-lg border border-[#FECACA] bg-white p-3">
          <p className="text-xs font-semibold text-[#991B1B]">CAW Payload Preview</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <ErrorFact label="目标地址 / dst_addr" value={payloadPreview.dst_addr} mono />
            <ErrorFact label="源地址 / src_addr" value={payloadPreview.src_addr} mono />
            <ErrorFact label="tokenId" value={payloadPreview.tokenId} />
            <ErrorFact label="chainId" value={payloadPreview.chainId} />
            <ErrorFact label="amount" value={payloadPreview.amount} />
            <ErrorFact label="requestId" value={payloadPreview.requestId} mono />
            <ErrorFact label="pactIdPresent" value={payloadPreview.pactIdPresent ? "present" : "missing"} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ErrorFact({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-[#991B1B]">{label}</p>
      <p className={`mt-1 break-words text-xs text-[#111827] ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function safeJson(value: Record<string, unknown>) {
  return JSON.stringify(value, null, 2).replace(/\[object Object\]/g, "Object");
}

function messageFor(
  decision: PolicyDecision,
  walletResult: WalletExecutionResult | null,
  isExecuting: boolean,
  autoExecuteEnabled: boolean,
) {
  if (isExecuting) return "钱包适配器正在准备交易结果。";
  if (walletResult?.success) return walletResult.message;
  if (autoExecuteEnabled) return autoExecuteMessage(decision);
  if (decision.decision === "ALLOW") return "低风险请求可在当前策略边界内执行。";
  if (decision.decision === "CONFIRM") return "该请求需要人工确认。";
  return "策略已在钱包执行前拒绝该请求。";
}
