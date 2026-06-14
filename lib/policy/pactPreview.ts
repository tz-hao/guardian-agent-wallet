import type { AgentProfile, PaymentRequest, PolicyDecision, WalletInfo } from "@/types";
import { guardianPolicyConfig } from "@/lib/policy/securityConfig";

export type PactPreviewData = {
  intent: string;
  amount: string;
  token: string;
  recipient: string;
  allowedBudget: string;
  policyDecision: PolicyDecision["decision"];
  expectedCawMode: "Real CAW Mode" | "CAW Fallback Mode" | "Mock Mode";
  humanApprovalRequired: boolean;
  cawPactBoundary: {
    permission: string;
    chain: string;
    token: string;
    maxSingleTransfer: string;
  };
  guardianAutoBoundary: {
    autoExecuteRule: string;
    autoThreshold: string;
    confirmationRule: string;
  };
  cawRequestPreview: {
    chainId: string;
    tokenId: string;
    amount: string;
    recipient: string;
    displayRecipient: string;
    resolvedRecipientAddress: string;
    recipientFallbackStatus: "fallback" | "configured" | "direct" | "missing";
    pactIdStatus: "present" | "missing";
  };
};

export function buildPactPreview({
  request,
  decision,
  agentProfile,
  walletInfo,
}: {
  request: PaymentRequest;
  decision: PolicyDecision;
  agentProfile: AgentProfile;
  walletInfo: WalletInfo | null;
}): PactPreviewData {
  return {
    intent: request.rawInput || `${request.action} ${request.amount} ${request.token}`,
    amount: request.amount.toFixed(request.amount > 0 && request.amount < 1 ? 4 : 2),
    token: request.token,
    recipient: request.recipient || "none",
    allowedBudget: `${formatSethBudget(agentProfile.singlePaymentLimit)} per payment / ${formatSethBudget(
      agentProfile.dailyBudget,
    )} daily`,
    policyDecision: decision.decision,
    expectedCawMode: resolveExpectedMode(walletInfo),
    humanApprovalRequired: decision.decision === "CONFIRM",
    cawPactBoundary: {
      permission: "can_transfer",
      chain: "SETH",
      token: "SETH",
      maxSingleTransfer: `${guardianPolicyConfig.cawPactMaxSingleTransferSeth} SETH`,
    },
    guardianAutoBoundary: {
      autoExecuteRule: "Auto execute only for low-risk ALLOW payments",
      autoThreshold: `${guardianPolicyConfig.autoExecuteMaxSeth} SETH`,
      confirmationRule: `Payments above ${guardianPolicyConfig.autoExecuteMaxSeth} SETH and up to ${guardianPolicyConfig.confirmMaxSeth} SETH require human confirmation`,
    },
    cawRequestPreview: {
      chainId: "SETH",
      tokenId: request.token,
      amount: String(request.amount),
      recipient: request.recipient || "none",
      ...resolvePreviewRecipient(request.recipient, walletInfo),
      pactIdStatus: walletInfo?.cawConfigStatus?.pactIdPresent ? "present" : "missing",
    },
  };
}

function resolvePreviewRecipient(recipient: string, walletInfo: WalletInfo | null) {
  const directAddress = /^0x[a-fA-F0-9]{40}$/.test(recipient);
  if (directAddress) {
    return {
      displayRecipient: "Direct EVM address",
      resolvedRecipientAddress: recipient,
      recipientFallbackStatus: "direct" as const,
    };
  }

  const entry = walletInfo?.cawTrustedRecipients?.find(
    (candidate) =>
      candidate.alias === recipient ||
      candidate.displayNameZh === recipient ||
      candidate.displayNameEn.toLowerCase() === recipient.toLowerCase(),
  );

  if (!entry) {
    return {
      displayRecipient: recipient || "none",
      resolvedRecipientAddress: "unresolved",
      recipientFallbackStatus: "missing" as const,
    };
  }

  return {
    displayRecipient: entry.displayNameZh,
    resolvedRecipientAddress: entry.evmAddress || "unresolved",
    recipientFallbackStatus: entry.isFallback ? ("fallback" as const) : ("configured" as const),
  };
}

function formatSethBudget(budgetValue: number) {
  return `${budgetValue / 3000} SETH equivalent`;
}

function resolveExpectedMode(walletInfo: WalletInfo | null): PactPreviewData["expectedCawMode"] {
  if (walletInfo?.executionMode === "real-caw") return "Real CAW Mode";
  if (walletInfo?.executionMode === "caw-fallback") return "CAW Fallback Mode";

  return "Mock Mode";
}
