import type { WalletMode } from "@/types";

const supportedWalletModes: WalletMode[] = ["mock", "caw"];

export type AppConfig = {
  walletMode: WalletMode;
};

export type CawServerConfig = {
  apiUrl: string;
  apiKey: string;
  walletId: string;
  pactId: string;
  network: string;
  tokenId: string;
  mockMode: boolean;
};

function resolveWalletMode(value: string | undefined): WalletMode {
  if (supportedWalletModes.includes(value as WalletMode)) {
    return value as WalletMode;
  }

  return "mock";
}

export const appConfig: AppConfig = {
  walletMode: resolveWalletMode(process.env.NEXT_PUBLIC_WALLET_MODE),
};

export function getCawServerConfig(): CawServerConfig {
  return {
    apiUrl: process.env.AGENT_WALLET_API_URL || "",
    apiKey: process.env.AGENT_WALLET_API_KEY || "",
    walletId: process.env.AGENT_WALLET_WALLET_ID || "",
    pactId: process.env.AGENT_WALLET_PACT_ID || "",
    network: process.env.CAW_NETWORK || "SETH",
    tokenId: process.env.CAW_TOKEN_ID || "SETH",
    mockMode: process.env.CAW_MOCK_MODE === "true",
  };
}

export function hasCawCredentials(config = getCawServerConfig()) {
  return Boolean(config.apiUrl && config.apiKey && config.walletId);
}
