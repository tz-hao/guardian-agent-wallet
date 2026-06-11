import { NextResponse } from "next/server";
import { normalizeCawError } from "@/lib/wallets/cawError";
import { executeCawPayment, getCawWalletInfo } from "@/lib/wallets/cawServer";
import type { PaymentRequest } from "@/types";

export async function GET() {
  try {
    return NextResponse.json({ wallet: await getCawWalletInfo() });
  } catch (error) {
    return NextResponse.json(
      {
        wallet: {
          mode: "mock",
          name: "CAW Fallback Wallet",
          chainId: 8453,
          address: "caw-wallet-info-unavailable",
          isConnected: false,
          executionMode: "caw-fallback",
        },
        error: error instanceof Error ? error.message : "Unable to load CAW wallet info.",
      },
      { status: 200 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { request?: PaymentRequest };

    if (!body.request) {
      return NextResponse.json({ error: "Missing payment request." }, { status: 400 });
    }

    const result = await executeCawPayment(body.request);
    const status = result.errorCode ? result.cawError?.status || 422 : 200;

    return NextResponse.json(
      {
        success: !result.errorCode,
        result,
        error: result.errorCode
          ? {
              code: result.cawError?.code || result.errorCode,
              status,
              reason: result.message,
              message: result.cawError?.message || result.message,
              safeDetails: result.cawError?.safeDetails,
            }
          : undefined,
        requestPreview: result.cawRequestPreview,
        cawPayloadPreview: result.cawPayloadPreview,
      },
      { status },
    );
  } catch (error) {
    const normalizedError = normalizeCawError(error);

    return NextResponse.json(
      {
        success: false,
        result: {
          success: false,
          txHash: "",
          status: "failed",
          walletMode: "caw",
          executionMode: "real-caw",
          message: normalizedError.message,
          errorCode: "caw_sdk_validation_error",
          cawError: {
            status: normalizedError.status,
            code: normalizedError.code || "caw_validation_error",
            message: normalizedError.message,
            safeDetails: normalizedError.safeDetails,
          },
        },
        error: {
          code: normalizedError.code || "caw_validation_error",
          status: normalizedError.status || 422,
          reason: normalizedError.message,
          message: normalizedError.message,
          safeDetails: normalizedError.safeDetails,
        },
      },
      { status: 422 },
    );
  }
}
