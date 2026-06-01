import type { PaymentRequest, PolicyDecision } from "@/types";

type PolicyDecisionValue = PolicyDecision["decision"];
type RiskLevel = PolicyDecision["riskLevel"];

export type PolicyContext = {
  dailySpent: number;
  dailyBudgetLimit: number;
  singlePaymentLimit: number;
  trustedRecipients: string[];
  allowedTokens: string[];
  timeWindow: {
    startHourUtc: number;
    endHourUtc: number;
  };
};

export type PolicyRuleResult = {
  id: string;
  decision: Exclude<PolicyDecisionValue, "ALLOW">;
  riskLevel: Exclude<RiskLevel, "LOW">;
  score: number;
  reason: string;
};

export interface PolicyRule {
  id: string;
  label: string;
  evaluate(request: PaymentRequest, context: PolicyContext): PolicyRuleResult | null;
}

const trustedRecipients = ["0x123", "0xSAFE", "x402-service"];
const allowedTokens = ["USDC", "USDT", "ETH", "DAI", "WETH"];

export const walletPolicy: PolicyContext = {
  dailySpent: 0,
  dailyBudgetLimit: 300,
  singlePaymentLimit: 50,
  trustedRecipients,
  allowedTokens,
  timeWindow: {
    startHourUtc: 0,
    endHourUtc: 24,
  },
};

export const UnknownActionPolicy: PolicyRule = {
  id: "unknown_action",
  label: "Known action required",
  evaluate(request) {
    if (request.action !== "unknown") return null;

    return {
      id: this.id,
      decision: "CONFIRM",
      riskLevel: "MEDIUM",
      score: 50,
      reason: "The agent request could not be parsed into a supported wallet action.",
    };
  },
};

export const DailyBudgetPolicy: PolicyRule = {
  id: "daily_budget",
  label: "Daily budget",
  evaluate(request, context) {
    if (context.dailySpent + request.amount <= context.dailyBudgetLimit) return null;

    return {
      id: this.id,
      decision: "CONFIRM",
      riskLevel: "HIGH",
      score: 80,
      reason: `This request would exceed the daily budget of ${context.dailyBudgetLimit} ${request.token}.`,
    };
  },
};

export const SinglePaymentLimitPolicy: PolicyRule = {
  id: "single_payment_limit",
  label: "Single payment limit",
  evaluate(request, context) {
    if (request.amount <= context.singlePaymentLimit) return null;

    return {
      id: this.id,
      decision: "CONFIRM",
      riskLevel: "HIGH",
      score: 75,
      reason: `The amount is above the single payment limit of ${context.singlePaymentLimit} ${request.token}.`,
    };
  },
};

export const TrustedRecipientPolicy: PolicyRule = {
  id: "trusted_recipient",
  label: "Trusted recipient",
  evaluate(request, context) {
    if (request.action === "transfer" && request.recipient.trim() === "") {
      return {
        id: "missing_recipient",
        decision: "CONFIRM",
        riskLevel: "MEDIUM",
        score: 55,
        reason: "The transfer recipient is missing and must be reviewed before execution.",
      };
    }

    if (startsWithBadAddress(request.recipient)) {
      return {
        id: "suspicious_recipient",
        decision: "CONFIRM",
        riskLevel: "HIGH",
        score: 85,
        reason: "The recipient matches a suspicious address pattern.",
      };
    }

    if (context.trustedRecipients.includes(request.recipient)) return null;

    return {
      id: this.id,
      decision: "CONFIRM",
      riskLevel: "MEDIUM",
      score: 60,
      reason: "The recipient is not in the trusted recipient list.",
    };
  },
};

export const UnlimitedApprovalPolicy: PolicyRule = {
  id: "unlimited_approval",
  label: "Unlimited approval",
  evaluate(request) {
    if (request.action !== "approve" || !request.isUnlimitedApproval) return null;

    return {
      id: this.id,
      decision: "DENY",
      riskLevel: "HIGH",
      score: 100,
      reason: "Unlimited token approval is blocked because it can drain the wallet later.",
    };
  },
};

export const AllowedTokenPolicy: PolicyRule = {
  id: "allowed_token",
  label: "Allowed token",
  evaluate(request, context) {
    if (context.allowedTokens.includes(request.token)) return null;

    return {
      id: this.id,
      decision: "DENY",
      riskLevel: "HIGH",
      score: 90,
      reason: `${request.token} is not approved for agent execution.`,
    };
  },
};

export const TimeWindowPolicy: PolicyRule = {
  id: "time_window",
  label: "Execution time window",
  evaluate(request, context) {
    const hour = new Date(request.timestamp).getUTCHours();
    const { startHourUtc, endHourUtc } = context.timeWindow;
    const insideWindow =
      startHourUtc <= endHourUtc
        ? hour >= startHourUtc && hour < endHourUtc
        : hour >= startHourUtc || hour < endHourUtc;

    if (insideWindow) return null;

    return {
      id: this.id,
      decision: "CONFIRM",
      riskLevel: "MEDIUM",
      score: 45,
      reason: `The request was made outside the allowed execution window (${startHourUtc}:00-${endHourUtc}:00 UTC).`,
    };
  },
};

export const defaultPolicyRules: PolicyRule[] = [
  UnknownActionPolicy,
  UnlimitedApprovalPolicy,
  AllowedTokenPolicy,
  TrustedRecipientPolicy,
  SinglePaymentLimitPolicy,
  DailyBudgetPolicy,
  TimeWindowPolicy,
];

export function evaluatePayment(request: PaymentRequest): PolicyDecision {
  return evaluatePolicies(request);
}

export function evaluatePolicies(
  request: PaymentRequest,
  context: PolicyContext = walletPolicy,
  rules: PolicyRule[] = defaultPolicyRules,
): PolicyDecision {
  const results = rules
    .map((rule) => rule.evaluate(request, context))
    .filter((result): result is PolicyRuleResult => result !== null);

  if (results.length === 0) {
    return buildDecision({
      decision: "ALLOW",
      riskLevel: "LOW",
      score: 10,
      reason:
        "Request is within policy: trusted recipient, allowed token, payment limit, daily budget, and execution window all passed.",
      triggeredRules: ["all_checks_passed"],
    });
  }

  const score = Math.min(100, Math.max(...results.map((result) => result.score)));
  const decision = results.some((result) => result.decision === "DENY") ? "DENY" : "CONFIRM";
  const riskLevel = score >= 70 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW";
  const reason = results.map((result) => result.reason).join(" ");
  const triggeredRules = results.map((result) => result.id);

  return buildDecision({
    decision,
    riskLevel,
    score,
    reason,
    triggeredRules,
  });
}

function buildDecision({
  decision,
  riskLevel,
  score,
  reason,
  triggeredRules,
}: {
  decision: PolicyDecisionValue;
  riskLevel: RiskLevel;
  score: number;
  reason: string;
  triggeredRules: string[];
}): PolicyDecision {
  return {
    decision,
    riskLevel,
    score,
    reason,
    triggeredRules,
    rulesTriggered: triggeredRules,
  };
}

function startsWithBadAddress(recipient: string) {
  return recipient.startsWith("0xBAD") || recipient.startsWith("0xbad");
}
