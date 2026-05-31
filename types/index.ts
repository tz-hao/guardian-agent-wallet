export type PaymentRequest = {
  id: string;
  rawInput: string;
  action: "swap" | "transfer" | "approve" | "unknown";
  token: string;
  amount: number;
  recipient: string;
  spender: string;
  chainId: number;
  timestamp: number;
  isUnlimitedApproval: boolean;
};

export type PolicyDecision = {
  decision: "ALLOW" | "CONFIRM" | "DENY";
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  reason: string;
  rulesTriggered: string[];
};

export type AuditLog = {
  id: string;
  timestamp: string;
  rawInput: string;
  action: PaymentRequest["action"];
  amount: number;
  token: string;
  recipient: string;
  decision: PolicyDecision["decision"];
  riskLevel: PolicyDecision["riskLevel"];
  reason: string;
};
