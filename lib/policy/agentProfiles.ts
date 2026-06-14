import type { AgentProfile, AgentProfileId, PaymentRequest } from "@/types";
import {
  ALLOWED_TOKENS,
  GUARDIAN_AUTO_EXECUTE_LIMIT,
  GUARDIAN_CONFIRM_LIMIT,
  GUARDIAN_DAILY_DEMO_BUDGET,
  TRUSTED_RECIPIENTS,
} from "@/lib/policy/securityConfig";

export const agentProfiles: Record<AgentProfileId, AgentProfile> = {
  ResearchAgent: {
    id: "ResearchAgent",
    label: "Research Agent",
    allowedActions: ["pay_api"],
    dailyBudget: GUARDIAN_DAILY_DEMO_BUDGET,
    singlePaymentLimit: GUARDIAN_AUTO_EXECUTE_LIMIT,
    allowedRecipients: [...TRUSTED_RECIPIENTS],
    allowedTokens: ["USDC", "SETH"],
  },
  PaymentAgent: {
    id: "PaymentAgent",
    label: "Payment Agent",
    allowedActions: ["pay_api", "transfer"],
    dailyBudget: GUARDIAN_DAILY_DEMO_BUDGET,
    singlePaymentLimit: GUARDIAN_AUTO_EXECUTE_LIMIT,
    allowedRecipients: [...TRUSTED_RECIPIENTS],
    allowedTokens: ["USDC", "USDT", "DAI", "SETH"],
  },
  TradingAgent: {
    id: "TradingAgent",
    label: "Trading Agent",
    allowedActions: ["swap", "transfer"],
    dailyBudget: GUARDIAN_CONFIRM_LIMIT,
    singlePaymentLimit: GUARDIAN_AUTO_EXECUTE_LIMIT,
    allowedRecipients: [...TRUSTED_RECIPIENTS],
    allowedTokens: [...ALLOWED_TOKENS],
  },
};

export const defaultAgentProfile = agentProfiles.PaymentAgent;

export function getAgentProfile(profileId: AgentProfileId = defaultAgentProfile.id) {
  return agentProfiles[profileId];
}

export function resolveAgentAction(request: PaymentRequest) {
  if (TRUSTED_RECIPIENTS.includes(request.recipient as (typeof TRUSTED_RECIPIENTS)[number])) {
    return request.action === "swap" ? "swap" : "pay_api";
  }

  return request.action;
}
