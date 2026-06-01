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
  score: number;
  reason: string;
  triggeredRules: string[];
  rulesTriggered: string[];
};

export type RiskAssessment = {
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  explanation: string;
  warnings: string[];
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

export type WalletMode = "mock" | "caw";

export type WalletInfo = {
  mode: WalletMode;
  name: string;
  chainId: number;
  address: string;
  isConnected: boolean;
};

export type WalletExecutionResult = {
  success: boolean;
  txHash: string;
  status: "pending" | "confirmed" | "failed";
  walletMode: WalletMode;
  message: string;
};

export type TransactionStatus = {
  txHash: string;
  status: WalletExecutionResult["status"];
  confirmations: number;
  updatedAt: number;
};
