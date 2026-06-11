import { Configuration, PactsApi, TransactionRecordsApi, TransactionsApi, WalletsApi } from "@cobo/agentic-wallet";
import { getCawServerConfig, hasCawCredentials } from "@/lib/wallets/cawConfig";
import { normalizeCawError } from "@/lib/wallets/cawError";
import { mockWalletAdapter } from "@/lib/wallets/mockWallet";
import { getTrustedRecipientRegistry, resolveRecipient, type ResolvedRecipient } from "@/lib/wallets/recipientResolver";
import type { PaymentRequest, WalletExecutionResult, WalletInfo } from "@/types";

type TransferBody = {
  src_addr: string;
  dst_addr: string;
  amount: string;
  token_id: string;
  chain_id: string;
  request_id: string;
  description: string;
};

type TransferResponse = {
  success?: boolean;
  result?: {
    id?: string;
    request_id?: string;
    tx_hash?: string;
    transaction_hash?: string;
    hash?: string;
    chain_tx_hash?: string;
    transactionHash?: string;
    status?: number;
    status_display?: string;
  };
  message?: string;
  suggestion?: string;
};

type CawServerDeps = {
  getWalletAddress?: (walletId: string) => Promise<string>;
  getPactApiKey?: (pactId: string) => Promise<string>;
  getPactApiKeyFromSdk?: (pactId: string) => Promise<string | undefined>;
  transferTokens?: (walletId: string, body: TransferBody) => Promise<TransferResponse>;
  getTransactionRecordByRequestId?: (walletId: string, requestId: string) => Promise<CawTransactionRecord>;
  sleep?: (ms: number) => Promise<void>;
};

const MAX_MVP_SETH_AMOUNT = 0.01;

type CawValidationErrorCode = NonNullable<WalletExecutionResult["errorCode"]>;

type CawValidationResult = {
  code: CawValidationErrorCode;
  message: string;
};

type CawTransactionRecord = Record<string, unknown> & {
  id?: string;
  request_id?: string;
  status?: number | string;
  status_display?: string;
  tx_hash?: string;
  transaction_hash?: string;
  hash?: string;
  chain_tx_hash?: string;
  transactionHash?: string;
};

export type CawTransactionStatusResult = {
  success: boolean;
  requestId: string;
  status: WalletExecutionResult["status"];
  txHash: string;
  explorerUrl: string;
  message: string;
  cawStatus?: string;
  receiptId?: string;
  transactionRecordId?: string;
  safeRecord?: Record<string, unknown>;
  error?: {
    status?: number;
    code?: string;
    message: string;
    safeDetails?: Record<string, unknown>;
  };
};

export async function getCawWalletInfo(deps: CawServerDeps = {}): Promise<WalletInfo> {
  const config = getCawServerConfig();

  if (config.mockMode || !hasCawCredentials(config)) {
    const fallback = await mockWalletAdapter.getWalletInfo();

    return {
      ...fallback,
      name: config.mockMode ? "CAW Fallback Wallet" : "CAW Fallback Wallet",
      executionMode: "caw-fallback",
      cawConfigStatus: getSafeConfigStatus(config),
      cawTrustedRecipients: getSafeRecipientPreview(),
    };
  }

  return {
    mode: "caw",
    name: "Cobo Agentic Wallet",
    chainId: 11155111,
    address: await getWalletAddress(config.walletId, deps),
    isConnected: true,
    executionMode: "real-caw",
    cawConfigStatus: getSafeConfigStatus(config),
    cawTrustedRecipients: getSafeRecipientPreview(),
  };
}

export async function executeCawPayment(
  request: PaymentRequest,
  deps: CawServerDeps = {},
): Promise<WalletExecutionResult> {
  const config = getCawServerConfig();

  if (config.mockMode || !hasCawCredentials(config)) {
    const fallback = await mockWalletAdapter.executePayment({ request });

    return {
      ...fallback,
      executionMode: "caw-fallback",
      message: config.mockMode
        ? "CAW_MOCK_MODE=true; executed through mock wallet fallback."
        : "CAW credentials missing; executed through mock wallet fallback.",
    };
  }

  const resolvedRecipient = resolveRecipient(request.recipient);
  const requestPreview = buildCawRequestPreview(request, config, resolvedRecipient);
  logSafeCawDebug("caw.execute.preview", requestPreview, config, "real-caw");

  const chainId = getCawChainId(config);
  const tokenId = getCawTokenId(request, config);
  const validationError = validateMvpSethTransfer(request, config);
  if (validationError) {
    return {
      success: false,
      txHash: "",
      status: "failed",
      walletMode: "caw",
      executionMode: "real-caw",
      message: validationError.message,
      errorCode: validationError.code,
      cawRequestPreview: requestPreview,
    };
  }
  if (!resolvedRecipient.ok || !resolvedRecipient.evmAddress) {
    return {
      success: false,
      txHash: "",
      status: "failed",
      walletMode: "caw",
      executionMode: "real-caw",
      message: resolvedRecipient.reason || "Recipient must be a trusted alias or a valid EVM address.",
      errorCode: "unresolved_recipient",
      cawRequestPreview: requestPreview,
      recipientAlias: resolvedRecipient.alias,
      displayRecipient: resolvedRecipient.displayName,
      recipientIsFallback: resolvedRecipient.isFallback,
    };
  }

  const requestId = `guardian-caw-${request.id}`;
  let walletAddress = "";

  try {
    walletAddress = await getWalletAddress(config.walletId, deps);
  } catch (error) {
    const normalizedError = normalizeCawError(error);

    return {
      success: false,
      txHash: "",
      status: "failed",
      walletMode: "caw",
      executionMode: "real-caw",
      message: `CAW wallet address lookup failed${normalizedError.status ? ` (${normalizedError.status})` : ""}: ${normalizedError.message}`,
      requestId,
      errorCode: "caw_sdk_validation_error",
      cawError: {
        status: normalizedError.status,
        code: normalizedError.code || "caw_wallet_address_lookup_error",
        message: normalizedError.message,
        safeDetails: normalizedError.safeDetails,
      },
      cawRequestPreview: requestPreview,
      recipientAlias: resolvedRecipient.alias,
      displayRecipient: resolvedRecipient.displayName,
      resolvedRecipientAddress: resolvedRecipient.evmAddress,
      recipientIsFallback: resolvedRecipient.isFallback,
    };
  }

  const transferBody: TransferBody = {
    src_addr: walletAddress,
    dst_addr: resolvedRecipient.evmAddress,
    amount: String(request.amount),
    token_id: tokenId,
    chain_id: chainId,
    request_id: requestId,
    description: `Guardian Agent Wallet MVP transfer for request ${request.id}`,
  };
  const cawPayloadPreview = buildCawPayloadPreview(transferBody, config);
  let transferResponse: TransferResponse;

  try {
    transferResponse = await transferTokens(config.walletId, transferBody, deps);
  } catch (error) {
    const normalizedError = normalizeCawError(error);
    logSafeCawDebug("caw.execute.sdk_validation_error", requestPreview, config, "real-caw");

    return {
      success: false,
      txHash: "",
      status: "failed",
      walletMode: "caw",
      executionMode: "real-caw",
      message: `CAW SDK validation error${normalizedError.status ? ` (${normalizedError.status})` : ""}: ${normalizedError.message}`,
      requestId,
      errorCode: "caw_sdk_validation_error",
      cawError: {
        status: normalizedError.status,
        code: normalizedError.code || "caw_validation_error",
        message: normalizedError.message,
        safeDetails: normalizedError.safeDetails,
      },
      cawRequestPreview: requestPreview,
      cawPayloadPreview,
      recipientAlias: resolvedRecipient.alias,
      displayRecipient: resolvedRecipient.displayName,
      resolvedRecipientAddress: resolvedRecipient.evmAddress,
      recipientIsFallback: resolvedRecipient.isFallback,
    };
  }
  const result = transferResponse.result;
  const responseRequestId = result?.request_id || requestId;
  const immediateTxHash = extractCawTxHash(result);
  const polledStatus = immediateTxHash
    ? null
    : await pollCawTransactionRecordByRequestId(responseRequestId, deps);
  const txHash = immediateTxHash || polledStatus?.txHash || "";
  const cawStatus = result?.status_display || polledStatus?.cawStatus;

  return {
    success: Boolean(transferResponse.success),
    txHash,
    status: txHash ? mapCawStatus(result?.status) : polledStatus?.status || "pending",
    walletMode: "caw",
    executionMode: "real-caw",
    message: txHash
      ? "Real CAW transfer submitted with on-chain transaction hash."
      : "CAW request accepted, transaction hash is not available yet.",
    requestId: responseRequestId,
    receiptId: result?.id || polledStatus?.receiptId,
    transactionRecordId: polledStatus?.transactionRecordId || result?.id,
    walletAddress,
    explorerUrl: buildSepoliaExplorerUrl(txHash),
    cawStatus,
    cawRequestPreview: requestPreview,
    cawPayloadPreview,
    recipientAlias: resolvedRecipient.alias,
    displayRecipient: resolvedRecipient.displayName,
    resolvedRecipientAddress: resolvedRecipient.evmAddress,
    recipientIsFallback: resolvedRecipient.isFallback,
    rawCawResponse: transferResponse as Record<string, unknown>,
    safeTransactionRecord: polledStatus?.safeRecord,
  };
}

export async function getCawTransactionStatusByRequestId(
  requestId: string,
  deps: CawServerDeps = {},
): Promise<CawTransactionStatusResult> {
  if (!requestId.trim()) {
    return {
      success: false,
      requestId,
      status: "failed",
      txHash: "",
      explorerUrl: "",
      message: "Missing requestId.",
      error: { code: "missing_request_id", message: "Missing requestId." },
    };
  }

  try {
    const record = await getCawTransactionRecordByRequestId(requestId, deps);
    return buildTransactionStatusResult(requestId, record);
  } catch (error) {
    const normalizedError = normalizeCawError(error);

    return {
      success: false,
      requestId,
      status: "failed",
      txHash: "",
      explorerUrl: "",
      message: normalizedError.message,
      error: {
        status: normalizedError.status,
        code: normalizedError.code || "caw_transaction_status_error",
        message: normalizedError.message,
        safeDetails: normalizedError.safeDetails,
      },
    };
  }
}

async function pollCawTransactionRecordByRequestId(
  requestId: string,
  deps: CawServerDeps,
): Promise<CawTransactionStatusResult> {
  if (deps.transferTokens && !deps.getTransactionRecordByRequestId) {
    return pendingTransactionStatus(requestId);
  }

  let lastResult = pendingTransactionStatus(requestId);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (attempt > 0) {
      await (deps.sleep ? deps.sleep(2000) : sleep(2000));
    }

    const result = await getCawTransactionStatusByRequestId(requestId, deps);
    lastResult = result;

    if (result.txHash || result.status === "failed") {
      return result;
    }
  }

  return {
    ...lastResult,
    status: lastResult.status === "failed" ? "failed" : "pending",
    txHash: lastResult.txHash || "",
    explorerUrl: lastResult.txHash ? lastResult.explorerUrl : "",
    message: lastResult.txHash
      ? lastResult.message
      : "CAW request accepted, transaction hash is not available yet.",
  };
}

export async function getCawTransactionRecordByRequestId(
  requestId: string,
  deps: CawServerDeps = {},
): Promise<CawTransactionRecord> {
  const config = getCawServerConfig();

  if (deps.getTransactionRecordByRequestId) {
    return deps.getTransactionRecordByRequestId(config.walletId, requestId);
  }

  const pactApiKey = await getPactApiKey(config.pactId, deps);
  const recordsApi = new TransactionRecordsApi(new Configuration({ basePath: config.apiUrl, apiKey: pactApiKey }));
  const response = await recordsApi.getUserTransactionByRequestId(config.walletId, requestId, true);

  return response.data.result as unknown as CawTransactionRecord;
}

async function getWalletAddress(walletId: string, deps: CawServerDeps) {
  if (deps.getWalletAddress) {
    return deps.getWalletAddress(walletId);
  }

  const config = getCawServerConfig();
  const walletsApi = new WalletsApi(new Configuration({ basePath: config.apiUrl, apiKey: config.apiKey }));
  const response = await walletsApi.listWalletAddresses(walletId);
  const addresses = response.data.result ?? [];
  const evmAddress = addresses.find(
    (address) => address.chain_type === "ETH" || address.compatible_chains?.includes(getCawChainId()),
  );

  return evmAddress?.address || "caw-wallet-address-unavailable";
}

async function transferTokens(walletId: string, body: TransferBody, deps: CawServerDeps) {
  if (deps.transferTokens) {
    return deps.transferTokens(walletId, body);
  }

  const config = getCawServerConfig();
  const pactApiKey = await getPactApiKey(config.pactId, deps);
  const transactionsApi = new TransactionsApi(
    new Configuration({ basePath: config.apiUrl, apiKey: pactApiKey }),
  );
  const response = await transactionsApi.transferTokens(walletId, body);

  return response.data;
}

async function getPactApiKey(pactId: string, deps: CawServerDeps) {
  if (deps.getPactApiKey) {
    return deps.getPactApiKey(pactId);
  }

  const config = getCawServerConfig();
  const pactApiKey = deps.getPactApiKeyFromSdk
    ? await deps.getPactApiKeyFromSdk(pactId)
    : await getPactApiKeyFromSdk(pactId, config);

  if (!pactApiKey) {
    throw {
      status: 403,
      code: "missing_pact_api_key",
      reason: "Active Pact did not return a pact-scoped API key for transaction execution.",
      suggestion:
        "Create or approve an active Pact with can_transfer permission, then update AGENT_WALLET_PACT_ID.",
      details: {
        pact_id_present: Boolean(pactId),
        wallet_id_present: Boolean(config.walletId),
        required_permission: "can_transfer",
      },
    };
  }

  return pactApiKey;
}

async function getPactApiKeyFromSdk(pactId: string, config = getCawServerConfig()) {
  const pactsApi = new PactsApi(new Configuration({ basePath: config.apiUrl, apiKey: config.apiKey }));
  const response = await pactsApi.getPact(pactId);

  return response.data.result?.api_key;
}

export function buildCawRequestPreview(
  request: PaymentRequest,
  config = getCawServerConfig(),
  resolvedRecipient: ResolvedRecipient = resolveRecipient(request.recipient),
) {
  return {
    chainId: getCawChainId(config),
    tokenId: getCawTokenId(request, config),
    amount: String(request.amount),
    recipient: request.recipient,
    displayRecipient: resolvedRecipient.displayName || request.recipient,
    resolvedRecipientAddress: resolvedRecipient.evmAddress,
    recipientIsFallback: Boolean(resolvedRecipient.isFallback),
    pactIdPresent: Boolean(config.pactId),
    walletIdPresent: Boolean(config.walletId),
  };
}

function validateMvpSethTransfer(request: PaymentRequest, config = getCawServerConfig()): CawValidationResult | null {
  const tokenId = getCawTokenId(request, config);

  if (request.action !== "transfer") {
    return {
      code: "unsupported_chain",
      message: "Real CAW MVP currently supports only SETH transfer actions.",
    };
  }
  if (request.token !== tokenId) {
    return {
      code: "unsupported_token",
      message: `unsupported token: Real CAW MVP currently supports only ${tokenId} transfers.`,
    };
  }
  if (request.chainId !== 11155111 && request.chainId !== 8453) {
    return {
      code: "unsupported_chain",
      message: "unsupported chain: Real CAW MVP currently supports Ethereum Sepolia SETH only.",
    };
  }
  if (!Number.isFinite(request.amount) || request.amount <= 0 || request.amount > MAX_MVP_SETH_AMOUNT) {
    return {
      code: "invalid_amount",
      message: `invalid amount: Real CAW MVP transfer amount must be greater than 0 and at most ${MAX_MVP_SETH_AMOUNT} SETH.`,
    };
  }
  if (!config.pactId) {
    return {
      code: "missing_pact_id",
      message: "missing pact id: set AGENT_WALLET_PACT_ID for real CAW execution, or use CAW fallback/mock mode.",
    };
  }
  if (!request.recipient.trim()) {
    return {
      code: "missing_recipient",
      message: "missing recipient: Real CAW MVP requires a destination recipient.",
    };
  }

  return null;
}

function buildCawPayloadPreview(body: TransferBody, config = getCawServerConfig()) {
  return {
    pactIdPresent: Boolean(config.pactId),
    src_addr: body.src_addr,
    dst_addr: body.dst_addr,
    tokenId: body.token_id,
    chainId: body.chain_id,
    amount: body.amount,
    requestId: body.request_id,
  };
}

function getCawChainId(config = getCawServerConfig()) {
  return config.network || "SETH";
}

function getCawTokenId(request?: PaymentRequest, config = getCawServerConfig()) {
  return config.tokenId || request?.token || "SETH";
}

function getSafeConfigStatus(config = getCawServerConfig()) {
  return {
    apiUrlPresent: Boolean(config.apiUrl),
    walletIdPresent: Boolean(config.walletId),
    pactIdPresent: Boolean(config.pactId),
  };
}

function getSafeRecipientPreview() {
  return getTrustedRecipientRegistry().map((entry) => ({
    alias: entry.alias,
    displayNameZh: entry.displayNameZh,
    displayNameEn: entry.displayNameEn,
    evmAddress: entry.evmAddress,
    isFallback: entry.isFallback,
  }));
}

function logSafeCawDebug(
  label: string,
  preview: ReturnType<typeof buildCawRequestPreview>,
  config = getCawServerConfig(),
  executionMode: NonNullable<WalletInfo["executionMode"]>,
) {
  console.info(label, {
    chainId: preview.chainId,
    tokenId: preview.tokenId,
    amount: preview.amount,
    recipient: preview.recipient,
    pactIdExists: Boolean(config.pactId),
    walletIdExists: Boolean(config.walletId),
    apiUrlExists: Boolean(config.apiUrl),
    executionMode,
  });
}

function mapCawStatus(status: number | undefined): WalletExecutionResult["status"] {
  if (status === 900) return "confirmed";
  if (status && status >= 901) return "failed";

  return "pending";
}

export function extractCawTxHash(record: unknown): string {
  const source = asRecord(record);
  if (!source) return "";

  const direct =
    source.tx_hash ||
    source.transaction_hash ||
    source.hash ||
    source.chain_tx_hash ||
    source.transactionHash;
  if (typeof direct === "string" && direct) return direct;

  const dataHash = extractCawTxHash(source.data);
  if (dataHash) return dataHash;

  const extTransactions = Array.isArray(source.ext_transactions) ? source.ext_transactions : [];
  for (const item of extTransactions) {
    const nestedHash = extractCawTxHash(item);
    if (nestedHash) return nestedHash;
  }

  return "";
}

export function buildSepoliaExplorerUrl(txHash: string) {
  return txHash ? `https://sepolia.etherscan.io/tx/${txHash}` : "";
}

function buildTransactionStatusResult(
  requestId: string,
  record: CawTransactionRecord,
): CawTransactionStatusResult {
  const txHash = extractCawTxHash(record);
  const status = mapCawRecordStatus(record.status);
  const cawStatus = String(record.status_display || record.status || "");

  return {
    success: true,
    requestId: String(record.request_id || requestId),
    status: txHash ? "pending" : status,
    txHash,
    explorerUrl: buildSepoliaExplorerUrl(txHash),
    message: txHash
      ? "CAW transaction hash is available."
      : "CAW request accepted, transaction hash is not available yet.",
    cawStatus,
    receiptId: typeof record.id === "string" ? record.id : undefined,
    transactionRecordId: typeof record.id === "string" ? record.id : undefined,
    safeRecord: sanitizeCawRecord(record),
  };
}

function pendingTransactionStatus(requestId: string): CawTransactionStatusResult {
  return {
    success: true,
    requestId,
    status: "pending",
    txHash: "",
    explorerUrl: "",
    message: "CAW request accepted, transaction hash is not available yet.",
  };
}

function mapCawRecordStatus(status: unknown): WalletExecutionResult["status"] {
  if (status === 900 || String(status).toLowerCase() === "success" || String(status).toLowerCase() === "completed") {
    return "confirmed";
  }
  if (
    typeof status === "number" && status >= 901 ||
    ["failed", "denied", "rejected", "cancelled", "canceled"].includes(String(status).toLowerCase())
  ) {
    return "failed";
  }

  return "pending";
}

function sanitizeCawRecord(record: CawTransactionRecord): Record<string, unknown> {
  const allowedKeys = [
    "id",
    "wallet_id",
    "pact_id",
    "type",
    "request_type",
    "chain_id",
    "token_id",
    "src_address",
    "dst_address",
    "amount",
    "status",
    "status_display",
    "sub_status",
    "transaction_hash",
    "tx_hash",
    "hash",
    "chain_tx_hash",
    "transactionHash",
    "request_id",
    "cobo_transaction_id",
    "created_at",
    "updated_at",
    "ext_transactions",
  ];

  return Object.fromEntries(allowedKeys.filter((key) => key in record).map((key) => [key, record[key]]));
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
