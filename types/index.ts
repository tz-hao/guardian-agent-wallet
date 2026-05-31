export type PolicyStatus = "allow" | "needs_human_confirmation" | "deny";

export type WalletIntent = {
  id: string;
  label: string;
  description: string;
  rawInput: string;
  chain: string;
  asset: string;
  amount: number;
  recipient: string;
  resource: string;
  action: string;
  toolReturn?: string;
  promptInjection?: boolean;
};

export type PolicyDecision = {
  status: PolicyStatus;
  reasons: string[];
  explanation: string;
  humanConfirmationRequired: boolean;
};

export type MockWalletResult = {
  mode: "mock_only";
  executed: boolean;
  settlementId?: string;
  message: string;
};

export type AuditEvent = {
  id: string;
  title: string;
  detail: string;
  status: "complete" | "blocked" | "waiting";
};

