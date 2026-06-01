import type { WalletMode } from "@/types";

const supportedWalletModes: WalletMode[] = ["mock", "caw"];

export type AppConfig = {
  walletMode: WalletMode;
  cawApiBaseUrl: string;
  cawWalletId: string;
};

function resolveWalletMode(value: string | undefined): WalletMode {
  if (supportedWalletModes.includes(value as WalletMode)) {
    return value as WalletMode;
  }

  return "mock";
}

export const appConfig: AppConfig = {
  walletMode: resolveWalletMode(process.env.NEXT_PUBLIC_WALLET_MODE),
  cawApiBaseUrl: process.env.NEXT_PUBLIC_CAW_API_BASE_URL || "",
  cawWalletId: process.env.NEXT_PUBLIC_CAW_WALLET_ID || "",
};
