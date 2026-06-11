import type { PaymentRequest, TransactionStatus, WalletExecutionResult, WalletInfo } from "@/types";
import type { WalletAdapter } from "./walletAdapter";

export class CawWalletAdapter implements WalletAdapter {
  mode = "caw" as const;

  async getWalletInfo(): Promise<WalletInfo> {
    const response = await fetch("/api/caw/execute-payment", { method: "GET" });
    const data = (await response.json()) as { wallet: WalletInfo };

    return data.wallet;
  }

  async executePayment({ request }: { request: PaymentRequest }): Promise<WalletExecutionResult> {
    const response = await fetch("/api/caw/execute-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request }),
    });
    const data = (await response.json()) as {
      result?: WalletExecutionResult;
      error?: {
        code?: string;
        status?: number;
        reason?: string;
        message?: string;
        safeDetails?: Record<string, unknown>;
      };
      requestPreview?: WalletExecutionResult["cawRequestPreview"];
      cawPayloadPreview?: WalletExecutionResult["cawPayloadPreview"];
    };

    if (data.result) return data.result;

    return {
      success: false,
      txHash: "",
      status: "failed",
      walletMode: "caw",
      executionMode: "real-caw",
      message: data.error?.message || data.error?.reason || "CAW execution failed.",
      errorCode: "caw_sdk_validation_error",
      cawError: data.error
        ? {
            status: data.error.status,
            code: data.error.code,
            message: data.error.message || data.error.reason || "CAW execution failed.",
            safeDetails: data.error.safeDetails,
          }
        : undefined,
      cawRequestPreview: data.requestPreview,
      cawPayloadPreview: data.cawPayloadPreview,
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
