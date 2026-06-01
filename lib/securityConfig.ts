export const TRUSTED_RECIPIENTS = ["0x123", "0xSAFE", "x402-service"] as const;
export const ALLOWED_TOKENS = ["USDC", "USDT", "ETH", "DAI", "WETH"] as const;

export function isSuspiciousAddress(address: string) {
  return address.startsWith("0xBAD") || address.startsWith("0xbad");
}

export function isAllowedToken(token: string) {
  return ALLOWED_TOKENS.includes(token as (typeof ALLOWED_TOKENS)[number]);
}

export function isTrustedRecipient(recipient: string) {
  return TRUSTED_RECIPIENTS.includes(recipient as (typeof TRUSTED_RECIPIENTS)[number]);
}
