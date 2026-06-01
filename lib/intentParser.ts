import type { PaymentRequest } from "@/types";

const DEFAULT_CHAIN_ID = 8453;
const ZERO_ADDRESS = "";
const TRUSTED_SERVICE = "x402-service";

const BUY = "\u4e70";
const TRANSFER = "\u8f6c\u8d26";
const TO = "\u7ed9";

export const samplePrompts = [
  `${BUY} 10 USDC \u7684 ETH`,
  "buy 10 USDC ETH",
  `${TRANSFER} 20 USDC ${TO} 0x123`,
  "send 20 USDC to 0x123",
  "send 20 USDC to 0xBAD123",
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
    recipient: action === "transfer" ? parseRecipient(normalized) : TRUSTED_SERVICE,
    spender: action === "approve" ? parseSpender(normalized) : ZERO_ADDRESS,
    chainId: DEFAULT_CHAIN_ID,
    timestamp: Date.now(),
    isUnlimitedApproval: action === "approve" && lower.includes("unlimited"),
  };
}

function parseAction(input: string): PaymentRequest["action"] {
  if (input.includes(BUY) || input.includes("buy")) return "swap";
  if (input.includes(TRANSFER) || input.includes("send")) return "transfer";
  if (input.includes("approve")) return "approve";
  return "unknown";
}

function parseAmount(input: string) {
  const match = input.match(/(\d+(?:\.\d+)?)\s*(USDC|USDT|ETH|DAI|WETH)/i);
  return match ? Number(match[1]) : 0;
}

function parseToken(input: string) {
  const match = input.match(/\b(USDC|USDT|ETH|DAI|WETH)\b/i);
  return match ? match[1].toUpperCase() : "USDC";
}

function parseRecipient(input: string) {
  const match = input.match(/0x[a-zA-Z0-9]+/);
  return match ? match[0] : ZERO_ADDRESS;
}

function parseSpender(input: string) {
  const match = input.match(new RegExp(`(?:to|${TO})\\s+(0x[a-zA-Z0-9]+)`, "i"));
  return match ? match[1] : ZERO_ADDRESS;
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `request-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
