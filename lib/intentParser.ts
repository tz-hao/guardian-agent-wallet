import type { PaymentRequest } from "@/types";

const DEFAULT_CHAIN_ID = 8453;
const ZERO_ADDRESS = "";

export const samplePrompts = [
  "买 10 USDC 的 ETH",
  "buy 10 USDC ETH",
  "转账 20 USDC 给 0x123",
  "send 20 USDC to 0x123",
  "approve unlimited USDC",
  "What is the weather today?",
];

export function parseIntent(input: string): PaymentRequest {
  const normalized = input.trim();
  const lower = normalized.toLowerCase();
  const action = parseAction(lower);

  return {
    id: createId(),
    rawInput: input,
    action,
    token: parseToken(normalized),
    amount: parseAmount(normalized),
    recipient: action === "transfer" ? parseRecipient(normalized) : ZERO_ADDRESS,
    spender: action === "approve" ? parseSpender(normalized) : ZERO_ADDRESS,
    chainId: DEFAULT_CHAIN_ID,
    timestamp: Date.now(),
    isUnlimitedApproval: action === "approve" && lower.includes("unlimited"),
  };
}

function parseAction(input: string): PaymentRequest["action"] {
  if (input.includes("买") || input.includes("buy")) return "swap";
  if (input.includes("转账") || input.includes("send")) return "transfer";
  if (input.includes("approve")) return "approve";
  return "unknown";
}

function parseAmount(input: string) {
  const match = input.match(/(?:^|\s)(\d+(?:\.\d+)?)(?=\s*[A-Za-z])/);
  return match ? Number(match[1]) : 0;
}

function parseToken(input: string) {
  const match = input.match(/\b(USDC|USDT|ETH|DAI|WETH)\b/i);
  return match ? match[1].toUpperCase() : "";
}

function parseRecipient(input: string) {
  const match = input.match(/0x[a-fA-F0-9]+/);
  return match ? match[0] : "";
}

function parseSpender(input: string) {
  const match = input.match(/(?:to|给)\s+(0x[a-fA-F0-9]+)/i);
  return match ? match[1] : "";
}

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `request-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
