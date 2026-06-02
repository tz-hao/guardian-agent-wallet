import { appConfig, hasCawCredentials } from "@/lib/wallets/cawConfig";
import type { PaymentRequest, TransactionStatus, WalletExecutionResult, WalletInfo } from "@/types";
import { mockWalletAdapter } from "./mockWallet";
import { createMockTxHash, type WalletAdapter } from "./walletAdapter";

export class CawWalletAdapter implements WalletAdapter {
  mode = "caw" as const;

  async getWalletInfo(): Promise<WalletInfo> {
    return {
      mode: this.mode,
      name: "Cobo Agentic Wallet",
      chainId: 8453,
      address: appConfig.cawWalletId || "caw-wallet-not-configured",
      isConnected: Boolean(appConfig.cawWalletId && appConfig.cawApiBaseUrl),
    };
  }

  async executePayment({ request }: { request: PaymentRequest }): Promise<WalletExecutionResult> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!hasCawCredentials()) {
      const fallback = await mockWalletAdapter.executePayment({ request });

      return {
        ...fallback,
        message: "CAW credentials missing; executed through mock wallet fallback.",
      };
    }

    // Extension point: replace this placeholder with the CAW SDK/API call.
    // The policy layer should pass only already-approved payment intents here.
    return {
      success: true,
      txHash: createMockTxHash("0xCAW", request.id),
      status: "pending",
      walletMode: this.mode,
      message: "CAW adapter placeholder accepted the payment intent.",
    };
  }

  async getTransactionStatus(txHash: string): Promise<TransactionStatus> {
    return {
      txHash,
      status: txHash ? "pending" : "failed",
      confirmations: 0,
      updatedAt: Date.now(),
    };
  }
}

export const cawWalletAdapter = new CawWalletAdapter();
