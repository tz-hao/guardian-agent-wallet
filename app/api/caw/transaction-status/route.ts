import { NextResponse } from "next/server";
import { getCawTransactionStatusByRequestId } from "@/lib/wallets/cawServer";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { requestId?: string };
  const requestId = body.requestId?.trim() || "";

  if (!requestId) {
    return NextResponse.json(
      {
        success: false,
        requestId: "",
        status: "failed",
        txHash: "",
        explorerUrl: "",
        error: {
          code: "missing_request_id",
          message: "Missing requestId.",
        },
      },
      { status: 400 },
    );
  }

  const result = await getCawTransactionStatusByRequestId(requestId);

  return NextResponse.json(result, { status: result.success ? 200 : result.error?.status || 422 });
}
