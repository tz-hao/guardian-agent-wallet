import type { PaymentRequest, PolicyDecision } from "@/types";

export const walletPolicy = {
  chainId: 8453,
  token: "USDC",
  maxAmount: 0.1,
  dailyBudget: 1,
  allowedRecipients: ["0xServiceProviderTreasury00000000000000000001"],
  allowedSpenders: ["0xGuardianPolicySpender00000000000000000003"],
  highRiskActions: ["approve", "swap"],
};

export function evaluatePolicy(request: PaymentRequest): PolicyDecision {
  const rulesTriggered: string[] = [];

  if (request.chainId !== walletPolicy.chainId) rulesTriggered.push("chain_not_allowed");
  if (request.token !== walletPolicy.token) rulesTriggered.push("token_not_allowed");
  if (!walletPolicy.allowedRecipients.includes(request.recipient)) {
    rulesTriggered.push("recipient_not_allowed");
  }
  if (request.spender && !walletPolicy.allowedSpenders.includes(request.spender)) {
    rulesTriggered.push("spender_not_allowed");
  }
  if (request.amount > walletPolicy.maxAmount) {
    rulesTriggered.push("amount_exceeds_single_payment_cap");
  }
  if (request.isUnlimitedApproval) {
    rulesTriggered.push("unlimited_approval");
  }
  if (request.action === "unknown") {
    rulesTriggered.push("unknown_action");
  }
  if (request.rawInput.toLowerCase().includes("ignore all previous")) {
    rulesTriggered.push("prompt_injection_text_detected");
  }

  if (
    rulesTriggered.includes("recipient_not_allowed") ||
    rulesTriggered.includes("spender_not_allowed") ||
    rulesTriggered.includes("unlimited_approval")
  ) {
    return {
      decision: "DENY",
      riskLevel: "HIGH",
      reason: "This crosses a hard wallet boundary before any signing or settlement step.",
      rulesTriggered,
    };
  }

  if (rulesTriggered.length > 0 || walletPolicy.highRiskActions.includes(request.action)) {
    return {
      decision: "CONFIRM",
      riskLevel: "MEDIUM",
      reason: "This is outside the low-risk automation envelope and needs human review.",
      rulesTriggered: rulesTriggered.length ? rulesTriggered : ["high_risk_action"],
    };
  }

  return {
    decision: "ALLOW",
    riskLevel: "LOW",
    reason: "This stays inside the approved budget, recipient, token, chain, and action scope.",
    rulesTriggered: ["within_policy_scope"],
  };
}

