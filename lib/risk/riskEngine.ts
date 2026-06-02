import type { PaymentRequest, RiskAssessment } from "@/types";
import { isAllowedToken, isSuspiciousAddress, isTrustedRecipient } from "@/lib/policy/securityConfig";

export function assessRisk(request: PaymentRequest): RiskAssessment {
  const factors = [
    evaluateAmountRisk(request),
    evaluateRecipientRisk(request),
    evaluateApprovalRisk(request),
    evaluateTokenRisk(request),
    evaluateSuspiciousContractRisk(request),
  ].filter((warning): warning is RiskWarning => warning !== null);

  const riskScore = Math.min(
    100,
    factors.reduce((total, warning) => total + warning.score, 0),
  );
  const riskLevel = toRiskLevel(riskScore);
  const warnings = factors.map((factor) => factor.message);

  return {
    riskScore,
    riskLevel,
    explanation: buildExplanation(request, warnings),
    warnings,
  };
}

type RiskWarning = {
  score: number;
  message: string;
};

function evaluateAmountRisk(request: PaymentRequest): RiskWarning | null {
  if (request.amount > 200) {
    return {
      score: 50,
      message: `Large amount: ${request.amount} ${request.token} is above the high-risk threshold.`,
    };
  }

  if (request.amount > 50) {
    return {
      score: 30,
      message: `Elevated amount: ${request.amount} ${request.token} is above the normal single-payment range.`,
    };
  }

  if (request.amount > 0) {
    return {
      score: 5,
      message: `Small payment amount: ${request.amount} ${request.token}.`,
    };
  }

  return null;
}

function evaluateRecipientRisk(request: PaymentRequest): RiskWarning | null {
  if (request.action === "transfer" && request.recipient.trim() === "") {
    return {
      score: 35,
      message: "Missing recipient: the agent did not provide a destination address.",
    };
  }

  if (!request.recipient || isTrustedRecipient(request.recipient)) return null;

  return {
    score: 35,
    message: "Unknown recipient: the destination is not in the trusted recipient list.",
  };
}

function evaluateApprovalRisk(request: PaymentRequest): RiskWarning | null {
  if (request.action !== "approve") return null;

  if (request.isUnlimitedApproval) {
    return {
      score: 70,
      message: "Unlimited approval: this grants unlimited future spending permission.",
    };
  }

  return {
    score: 35,
    message: "Approval request: this gives another contract permission to spend tokens.",
  };
}

function evaluateTokenRisk(request: PaymentRequest): RiskWarning | null {
  if (isAllowedToken(request.token)) return null;

  return {
    score: 45,
    message: `Unsupported token: ${request.token} is not in the allowed token list.`,
  };
}

function evaluateSuspiciousContractRisk(request: PaymentRequest): RiskWarning | null {
  const target = request.spender || request.recipient;

  if (!target || !isSuspiciousAddress(target)) return null;

  return {
    score: 55,
    message: "Suspicious contract: the target address matches a known suspicious pattern.",
  };
}

function buildExplanation(request: PaymentRequest, warnings: string[]) {
  if (warnings.length === 0) {
    return "This transaction matches the configured low-risk wallet profile.";
  }

  if (request.action === "approve" && request.isUnlimitedApproval) {
    const target = request.spender || request.recipient || "an unknown contract";
    return `This transaction grants unlimited spending permission to ${target}.`;
  }

  if (warnings.length === 1) {
    return warnings[0];
  }

  return warnings.join(" ");
}

function toRiskLevel(score: number): RiskAssessment["riskLevel"] {
  if (score >= 70) return "HIGH";
  if (score >= 30) return "MEDIUM";
  return "LOW";
}
