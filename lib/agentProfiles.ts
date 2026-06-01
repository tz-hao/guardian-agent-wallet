import type { AgentProfile, AgentProfileId, PaymentRequest } from "@/types";
import { ALLOWED_TOKENS, TRUSTED_RECIPIENTS } from "@/lib/securityConfig";

export const agentProfiles: Record<AgentProfileId, AgentProfile> = {
  ResearchAgent: {
    id: "ResearchAgent",
    label: "Research Agent",
    allowedActions: ["pay_api"],
    dailyBudget: 100,
    singlePaymentLimit: 20,
    allowedRecipients: ["x402-service"],
    allowedTokens: ["USDC"],
  },
  PaymentAgent: {
    id: "PaymentAgent",
    label: "Payment Agent",
    allowedActions: ["pay_api", "transfer"],
    dailyBudget: 300,
    singlePaymentLimit: 50,
    allowedRecipients: [...TRUSTED_RECIPIENTS],
    allowedTokens: ["USDC", "USDT", "DAI"],
  },
  TradingAgent: {
    id: "TradingAgent",
    label: "Trading Agent",
    allowedActions: ["swap", "transfer", "pay_api"],
    dailyBudget: 1000,
    singlePaymentLimit: 250,
    allowedRecipients: [...TRUSTED_RECIPIENTS],
    allowedTokens: [...ALLOWED_TOKENS],
  },
};

export const defaultAgentProfile = agentProfiles.TradingAgent;

export function getAgentProfile(profileId: AgentProfileId = defaultAgentProfile.id) {
  return agentProfiles[profileId];
}

export function resolveAgentAction(request: PaymentRequest) {
  if (request.recipient === "x402-service") {
    return request.action === "swap" ? "swap" : "pay_api";
  }

  return request.action;
}
