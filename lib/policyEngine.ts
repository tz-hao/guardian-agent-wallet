import type { PolicyDecision, WalletIntent } from "@/types";

export const walletPolicy = {
  chain: "base",
  asset: "USDC",
  maxAmount: 0.1,
  dailyBudget: 1,
  allowedRecipients: ["0xServiceProviderTreasury00000000000000000001"],
  allowedResources: ["https://api.guardian.local/v1/infer"],
  forbiddenActions: ["approve_unlimited", "change_policy", "call_unknown_contract"],
};

export function evaluatePolicy(intent: WalletIntent): PolicyDecision {
  const reasons: string[] = [];

  if (intent.chain !== walletPolicy.chain) reasons.push("chain_not_allowed");
  if (intent.asset !== walletPolicy.asset) reasons.push("asset_not_allowed");
  if (!walletPolicy.allowedRecipients.includes(intent.recipient)) {
    reasons.push("recipient_not_allowed");
  }
  if (!walletPolicy.allowedResources.includes(intent.resource)) {
    reasons.push("resource_not_allowed");
  }
  if (intent.amount > walletPolicy.maxAmount) {
    reasons.push("amount_exceeds_single_payment_cap");
  }
  if (walletPolicy.forbiddenActions.includes(intent.action)) {
    reasons.push("forbidden_action");
  }

  if (reasons.includes("forbidden_action") || reasons.includes("recipient_not_allowed")) {
    return {
      status: "deny",
      reasons,
      humanConfirmationRequired: false,
      explanation:
        "This crosses a hard wallet boundary. The policy blocks it before any signing or settlement step.",
    };
  }

  if (reasons.length > 0) {
    return {
      status: "needs_human_confirmation",
      reasons,
      humanConfirmationRequired: true,
      explanation:
        "This is outside the low-risk automation envelope. A wallet owner or Safe signer must review it.",
    };
  }

  return {
    status: "allow",
    reasons: ["within_policy_scope"],
    humanConfirmationRequired: false,
    explanation:
      "This stays inside the approved budget, recipient, resource, chain, asset, and action scope.",
  };
}

