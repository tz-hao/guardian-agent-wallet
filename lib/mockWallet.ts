import type { PaymentRequest } from "@/types";

export type MockTransactionResult = {
  success: boolean;
  txHash: string;
};

export async function executeMockTransaction(
  request: PaymentRequest,
): Promise<MockTransactionResult> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (request.action === "unknown") {
    return {
      success: false,
      txHash: "",
    };
  }

  return {
    success: true,
    txHash: `0xMOCK${request.id.replaceAll("-", "").slice(0, 24).toUpperCase()}`,
  };
}
