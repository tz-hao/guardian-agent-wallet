import type { PaymentRequest, PolicyDecision } from "@/types";

const trustedRecipients = ["0x123", "0xSAFE", "x402-service"];

export const walletPolicy = {
  maxAmount: 50,
  trustedRecipients,
};

type PolicyRule = {
  id: string;
  matches: (request: PaymentRequest) => boolean;
  decision: Omit<PolicyDecision, "rulesTriggered">;
};

const rules: PolicyRule[] = [
  {
    id: "unlimited_approval",
    matches: (request) => request.action === "approve" && request.isUnlimitedApproval,
    decision: {
      decision: "DENY",
      riskLevel: "HIGH",
      reason: "Unlimited approval is dangerous",
    },
  },
  {
    id: "suspicious_recipient",
    matches: (request) => startsWithBadAddress(request.recipient),
    decision: {
      decision: "CONFIRM",
      riskLevel: "HIGH",
      reason: "Unknown or suspicious recipient",
    },
  },
  {
    id: "missing_transfer_recipient",
    matches: (request) => request.action === "transfer" && request.recipient.trim() === "",
    decision: {
      decision: "CONFIRM",
      riskLevel: "MEDIUM",
      reason: "Transfer recipient is missing",
    },
  },
  {
    id: "amount_exceeds_daily_budget",
    matches: (request) => request.amount > walletPolicy.maxAmount,
    decision: {
      decision: "CONFIRM",
      riskLevel: "HIGH",
      reason: "Amount exceeds daily budget",
    },
  },
  {
    id: "unknown_action",
    matches: (request) => request.action === "unknown",
    decision: {
      decision: "CONFIRM",
      riskLevel: "MEDIUM",
      reason: "Unknown action needs review",
    },
  },
  {
    id: "limited_approval",
    matches: (request) => request.action === "approve" && !request.isUnlimitedApproval,
    decision: {
      decision: "CONFIRM",
      riskLevel: "MEDIUM",
      reason: "Token approval needs review",
    },
  },
  {
    id: "trusted_recipient_low_amount",
    matches: (request) =>
      request.amount <= walletPolicy.maxAmount && trustedRecipients.includes(request.recipient),
    decision: {
      decision: "ALLOW",
      riskLevel: "LOW",
      reason: "Trusted recipient and amount within daily budget",
    },
  },
];

export function evaluatePayment(request: PaymentRequest): PolicyDecision {
  const matched = rules.find((rule) => rule.matches(request));

  if (!matched) {
    return {
      decision: "CONFIRM",
      riskLevel: "MEDIUM",
      reason: "Recipient is not trusted",
      rulesTriggered: ["recipient_not_trusted"],
    };
  }

  return {
    ...matched.decision,
    rulesTriggered: [matched.id],
  };
}

function startsWithBadAddress(recipient: string) {
  return recipient.startsWith("0xBAD") || recipient.startsWith("0xbad");
}
