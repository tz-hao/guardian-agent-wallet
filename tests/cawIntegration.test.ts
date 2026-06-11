import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { executeCawPayment, getCawWalletInfo } from "../lib/wallets/cawServer";
import type { PaymentRequest } from "../types";

function setEnv(overrides: NodeJS.ProcessEnv) {
  const previous = {
    AGENT_WALLET_API_URL: process.env.AGENT_WALLET_API_URL,
    AGENT_WALLET_API_KEY: process.env.AGENT_WALLET_API_KEY,
    AGENT_WALLET_WALLET_ID: process.env.AGENT_WALLET_WALLET_ID,
    CAW_MOCK_MODE: process.env.CAW_MOCK_MODE,
    AGENT_WALLET_PACT_ID: process.env.AGENT_WALLET_PACT_ID,
    CAW_RECIPIENT_DATA_API: process.env.CAW_RECIPIENT_DATA_API,
    CAW_RECIPIENT_AI_INFERENCE: process.env.CAW_RECIPIENT_AI_INFERENCE,
    CAW_RECIPIENT_ONCHAIN_ANALYTICS: process.env.CAW_RECIPIENT_ONCHAIN_ANALYTICS,
    CAW_RECIPIENT_RESEARCH_FEED: process.env.CAW_RECIPIENT_RESEARCH_FEED,
    CAW_DESTINATION: process.env.CAW_DESTINATION,
    CAW_NETWORK: process.env.CAW_NETWORK,
    CAW_TOKEN_ID: process.env.CAW_TOKEN_ID,
  };

  process.env.AGENT_WALLET_API_URL = overrides.AGENT_WALLET_API_URL;
  process.env.AGENT_WALLET_API_KEY = overrides.AGENT_WALLET_API_KEY;
  process.env.AGENT_WALLET_WALLET_ID = overrides.AGENT_WALLET_WALLET_ID;
  process.env.CAW_MOCK_MODE = overrides.CAW_MOCK_MODE;
  process.env.AGENT_WALLET_PACT_ID = overrides.AGENT_WALLET_PACT_ID;
  process.env.CAW_RECIPIENT_DATA_API = overrides.CAW_RECIPIENT_DATA_API;
  process.env.CAW_RECIPIENT_AI_INFERENCE = overrides.CAW_RECIPIENT_AI_INFERENCE;
  process.env.CAW_RECIPIENT_ONCHAIN_ANALYTICS = overrides.CAW_RECIPIENT_ONCHAIN_ANALYTICS;
  process.env.CAW_RECIPIENT_RESEARCH_FEED = overrides.CAW_RECIPIENT_RESEARCH_FEED;
  process.env.CAW_DESTINATION = overrides.CAW_DESTINATION;
  process.env.CAW_NETWORK = overrides.CAW_NETWORK;
  process.env.CAW_TOKEN_ID = overrides.CAW_TOKEN_ID;

  return () => {
    process.env.AGENT_WALLET_API_URL = previous.AGENT_WALLET_API_URL;
    process.env.AGENT_WALLET_API_KEY = previous.AGENT_WALLET_API_KEY;
    process.env.AGENT_WALLET_WALLET_ID = previous.AGENT_WALLET_WALLET_ID;
    process.env.CAW_MOCK_MODE = previous.CAW_MOCK_MODE;
    process.env.AGENT_WALLET_PACT_ID = previous.AGENT_WALLET_PACT_ID;
    process.env.CAW_RECIPIENT_DATA_API = previous.CAW_RECIPIENT_DATA_API;
    process.env.CAW_RECIPIENT_AI_INFERENCE = previous.CAW_RECIPIENT_AI_INFERENCE;
    process.env.CAW_RECIPIENT_ONCHAIN_ANALYTICS = previous.CAW_RECIPIENT_ONCHAIN_ANALYTICS;
    process.env.CAW_RECIPIENT_RESEARCH_FEED = previous.CAW_RECIPIENT_RESEARCH_FEED;
    process.env.CAW_DESTINATION = previous.CAW_DESTINATION;
    process.env.CAW_NETWORK = previous.CAW_NETWORK;
    process.env.CAW_TOKEN_ID = previous.CAW_TOKEN_ID;
  };
}

function request(overrides: Partial<PaymentRequest> = {}): PaymentRequest {
  return {
    id: "caw-test-request",
    rawInput: "send 0.001 SETH to 0x1111111111111111111111111111111111111111",
    action: "transfer",
    token: "SETH",
    amount: 0.001,
    recipient: "0x1111111111111111111111111111111111111111",
    spender: "",
    chainId: 11155111,
    timestamp: Date.UTC(2026, 0, 1, 12),
    isUnlimitedApproval: false,
    ...overrides,
  };
}

describe("CAW integration", () => {
  it("falls back to mock execution when server credentials are missing", async () => {
    const restore = setEnv({
      AGENT_WALLET_API_URL: "",
      AGENT_WALLET_API_KEY: "",
      AGENT_WALLET_WALLET_ID: "",
      AGENT_WALLET_PACT_ID: "",
      CAW_RECIPIENT_DATA_API: "",
      CAW_RECIPIENT_AI_INFERENCE: "",
      CAW_RECIPIENT_ONCHAIN_ANALYTICS: "",
      CAW_RECIPIENT_RESEARCH_FEED: "",
      CAW_DESTINATION: "",
      CAW_NETWORK: "SETH",
      CAW_TOKEN_ID: "SETH",
      CAW_MOCK_MODE: "",
    });

    try {
      const result = await executeCawPayment(request());

      assert.equal(result.walletMode, "mock");
      assert.equal(result.success, true);
      assert.match(result.message, /fallback/i);
      assert.match(result.txHash, /^0xMOCK/);
    } finally {
      restore();
    }
  });

  it("returns real CAW receipt fields from a successful SDK transfer response", async () => {
    const restore = setEnv({
      AGENT_WALLET_API_URL: "https://api.agenticwallet.cobo.com",
      AGENT_WALLET_API_KEY: "test-key",
      AGENT_WALLET_WALLET_ID: "wallet-uuid",
      AGENT_WALLET_PACT_ID: "pact-uuid",
      CAW_RECIPIENT_DATA_API: "",
      CAW_RECIPIENT_AI_INFERENCE: "",
      CAW_RECIPIENT_ONCHAIN_ANALYTICS: "",
      CAW_RECIPIENT_RESEARCH_FEED: "",
      CAW_DESTINATION: "",
      CAW_NETWORK: "SETH",
      CAW_TOKEN_ID: "SETH",
      CAW_MOCK_MODE: "",
    });

    try {
      const result = await executeCawPayment(request(), {
        getWalletAddress: async () => "0x1111111111111111111111111111111111111111",
        transferTokens: async (_walletId, body) => ({
          success: true,
          result: {
            id: "tx-receipt-1",
            request_id: body.request_id,
            transaction_hash: "0xREALCAWTX",
            status: 300,
            status_display: "Processing",
          },
        }),
      });

      assert.equal(result.walletMode, "caw");
      assert.equal(result.success, true);
      assert.equal(result.txHash, "0xREALCAWTX");
      assert.equal(result.receiptId, "tx-receipt-1");
      assert.equal(result.requestId, "guardian-caw-caw-test-request");
      assert.equal(result.walletAddress, "0x1111111111111111111111111111111111111111");
      assert.equal(result.rawCawResponse?.result?.transaction_hash, "0xREALCAWTX");
    } finally {
      restore();
    }
  });

  it("polls CAW transaction record by request id when transfer response has no tx hash yet", async () => {
    const restore = setEnv({
      AGENT_WALLET_API_URL: "https://api.agenticwallet.cobo.com",
      AGENT_WALLET_API_KEY: "test-key",
      AGENT_WALLET_WALLET_ID: "wallet-uuid",
      AGENT_WALLET_PACT_ID: "pact-uuid",
      CAW_RECIPIENT_DATA_API: "",
      CAW_RECIPIENT_AI_INFERENCE: "",
      CAW_RECIPIENT_ONCHAIN_ANALYTICS: "",
      CAW_RECIPIENT_RESEARCH_FEED: "",
      CAW_DESTINATION: "",
      CAW_NETWORK: "SETH",
      CAW_TOKEN_ID: "SETH",
      CAW_MOCK_MODE: "",
    });

    try {
      const result = await executeCawPayment(request(), {
        getWalletAddress: async () => "0x1111111111111111111111111111111111111111",
        sleep: async () => undefined,
        transferTokens: async (_walletId, body) => ({
          success: true,
          result: {
            id: "tx-receipt-poll",
            request_id: body.request_id,
            status: 300,
            status_display: "Processing",
          },
        }),
        getTransactionRecordByRequestId: async (_walletId, requestId) => ({
          id: "record-1",
          request_id: requestId,
          status: 300,
          status_display: "Broadcasting",
          tx_hash: "0xPOLLEDHASH",
        }),
      });

      assert.equal(result.success, true);
      assert.equal(result.txHash, "0xPOLLEDHASH");
      assert.equal(result.explorerUrl, "https://sepolia.etherscan.io/tx/0xPOLLEDHASH");
      assert.equal(result.transactionRecordId, "record-1");
      assert.equal(result.cawStatus, "Processing");
    } finally {
      restore();
    }
  });

  it("resolves trusted recipient aliases before CAW transfer", async () => {
    const restore = setEnv({
      AGENT_WALLET_API_URL: "https://api.agenticwallet.cobo.com",
      AGENT_WALLET_API_KEY: "test-key",
      AGENT_WALLET_WALLET_ID: "wallet-uuid",
      AGENT_WALLET_PACT_ID: "pact-uuid",
      CAW_RECIPIENT_DATA_API: "0x3333333333333333333333333333333333333333",
      CAW_RECIPIENT_AI_INFERENCE: "",
      CAW_RECIPIENT_ONCHAIN_ANALYTICS: "",
      CAW_RECIPIENT_RESEARCH_FEED: "",
      CAW_DESTINATION: "",
      CAW_NETWORK: "SETH",
      CAW_TOKEN_ID: "SETH",
      CAW_MOCK_MODE: "",
    });

    try {
      let submittedRecipient = "";
      const result = await executeCawPayment(request({ recipient: "data-api-provider" }), {
        getWalletAddress: async () => "0x1111111111111111111111111111111111111111",
        transferTokens: async (_walletId, body) => {
          submittedRecipient = body.dst_addr;

          return {
            success: true,
            result: {
              id: "tx-receipt-2",
              request_id: body.request_id,
              status: 300,
              status_display: "Processing",
            },
          };
        },
      });

      assert.equal(submittedRecipient, "0x3333333333333333333333333333333333333333");
      assert.equal(result.resolvedRecipientAddress, "0x3333333333333333333333333333333333333333");
      assert.equal(result.displayRecipient, "数据 API 服务商");
      assert.equal(result.recipientIsFallback, false);
    } finally {
      restore();
    }
  });

  it("returns unresolved_recipient for unknown vendors", async () => {
    const restore = setEnv({
      AGENT_WALLET_API_URL: "https://api.agenticwallet.cobo.com",
      AGENT_WALLET_API_KEY: "test-key",
      AGENT_WALLET_WALLET_ID: "wallet-uuid",
      AGENT_WALLET_PACT_ID: "pact-uuid",
      CAW_RECIPIENT_DATA_API: "",
      CAW_RECIPIENT_AI_INFERENCE: "",
      CAW_RECIPIENT_ONCHAIN_ANALYTICS: "",
      CAW_RECIPIENT_RESEARCH_FEED: "",
      CAW_DESTINATION: "",
      CAW_NETWORK: "SETH",
      CAW_TOKEN_ID: "SETH",
      CAW_MOCK_MODE: "",
    });

    try {
      const result = await executeCawPayment(request({ recipient: "unknown-vendor" }));

      assert.equal(result.success, false);
      assert.equal(result.errorCode, "unresolved_recipient");
      assert.match(result.message, /trusted alias|valid EVM address|valid EVM/i);
    } finally {
      restore();
    }
  });

  it("reports fallback wallet info when CAW_MOCK_MODE is enabled", async () => {
    const restore = setEnv({
      AGENT_WALLET_API_URL: "https://api.agenticwallet.cobo.com",
      AGENT_WALLET_API_KEY: "test-key",
      AGENT_WALLET_WALLET_ID: "wallet-uuid",
      AGENT_WALLET_PACT_ID: "pact-uuid",
      CAW_RECIPIENT_DATA_API: "",
      CAW_RECIPIENT_AI_INFERENCE: "",
      CAW_RECIPIENT_ONCHAIN_ANALYTICS: "",
      CAW_RECIPIENT_RESEARCH_FEED: "",
      CAW_DESTINATION: "",
      CAW_NETWORK: "SETH",
      CAW_TOKEN_ID: "SETH",
      CAW_MOCK_MODE: "true",
    });

    try {
      const wallet = await getCawWalletInfo();

      assert.equal(wallet.mode, "mock");
      assert.equal(wallet.isConnected, true);
      assert.match(wallet.name, /fallback/i);
    } finally {
      restore();
    }
  });

  it("returns a missing pact id validation result before calling CAW", async () => {
    const restore = setEnv({
      AGENT_WALLET_API_URL: "https://api.agenticwallet.cobo.com",
      AGENT_WALLET_API_KEY: "test-key",
      AGENT_WALLET_WALLET_ID: "wallet-uuid",
      AGENT_WALLET_PACT_ID: "",
      CAW_RECIPIENT_DATA_API: "",
      CAW_RECIPIENT_AI_INFERENCE: "",
      CAW_RECIPIENT_ONCHAIN_ANALYTICS: "",
      CAW_RECIPIENT_RESEARCH_FEED: "",
      CAW_DESTINATION: "",
      CAW_NETWORK: "SETH",
      CAW_TOKEN_ID: "SETH",
      CAW_MOCK_MODE: "",
    });

    try {
      const result = await executeCawPayment(request());

      assert.equal(result.success, false);
      assert.equal(result.errorCode, "missing_pact_id");
      assert.equal(result.cawRequestPreview?.pactIdPresent, false);
      assert.match(result.message, /missing pact id/i);
    } finally {
      restore();
    }
  });

  it("returns CAW SDK validation errors without exposing credentials", async () => {
    const restore = setEnv({
      AGENT_WALLET_API_URL: "https://api.agenticwallet.cobo.com",
      AGENT_WALLET_API_KEY: "test-key",
      AGENT_WALLET_WALLET_ID: "wallet-uuid",
      AGENT_WALLET_PACT_ID: "pact-uuid",
      CAW_RECIPIENT_DATA_API: "",
      CAW_RECIPIENT_AI_INFERENCE: "",
      CAW_RECIPIENT_ONCHAIN_ANALYTICS: "",
      CAW_RECIPIENT_RESEARCH_FEED: "",
      CAW_DESTINATION: "",
      CAW_NETWORK: "SETH",
      CAW_TOKEN_ID: "SETH",
      CAW_MOCK_MODE: "",
    });

    try {
      const result = await executeCawPayment(request(), {
        getWalletAddress: async () => "0x1111111111111111111111111111111111111111",
        transferTokens: async () => {
          throw {
            response: {
              status: 422,
              data: {
                message: "token_id is invalid",
                suggestion: "Use SETH on Sepolia.",
              },
            },
          };
        },
      });

      assert.equal(result.success, false);
      assert.equal(result.errorCode, "caw_sdk_validation_error");
      assert.match(result.message, /422/);
      assert.match(result.message, /token_id is invalid/);
      assert.doesNotMatch(result.message, /test-key/);
    } finally {
      restore();
    }
  });

  it("submits resolved EVM address and string amount instead of the demo alias", async () => {
    const restore = setEnv({
      AGENT_WALLET_API_URL: "https://api.agenticwallet.cobo.com",
      AGENT_WALLET_API_KEY: "owner-key",
      AGENT_WALLET_WALLET_ID: "wallet-uuid",
      AGENT_WALLET_PACT_ID: "pact-uuid",
      CAW_RECIPIENT_DATA_API: "0x24870681a481856b69D85D41C6f2401575228861",
      CAW_RECIPIENT_AI_INFERENCE: "",
      CAW_RECIPIENT_ONCHAIN_ANALYTICS: "",
      CAW_RECIPIENT_RESEARCH_FEED: "",
      CAW_DESTINATION: "",
      CAW_NETWORK: "SETH",
      CAW_TOKEN_ID: "SETH",
      CAW_MOCK_MODE: "",
    });

    try {
      let submittedBody: Record<string, unknown> | null = null;
      const result = await executeCawPayment(request({ recipient: "data-api-provider" }), {
        getWalletAddress: async () => "0x1111111111111111111111111111111111111111",
        getPactApiKey: async () => "pact-scoped-key",
        transferTokens: async (_walletId, body) => {
          submittedBody = body;

          return {
            success: true,
            result: {
              id: "tx-receipt-3",
              request_id: body.request_id,
              status: 300,
            },
          };
        },
      });

      assert.equal(submittedBody?.dst_addr, "0x24870681a481856b69D85D41C6f2401575228861");
      assert.equal(submittedBody?.src_addr, "0x1111111111111111111111111111111111111111");
      assert.equal("dst_address" in (submittedBody || {}), false);
      assert.notEqual(submittedBody?.dst_addr, "data-api-provider");
      assert.equal(submittedBody?.amount, "0.001");
      assert.equal(typeof submittedBody?.amount, "string");
      assert.equal(submittedBody?.token_id, "SETH");
      assert.equal(submittedBody?.chain_id, "SETH");
      assert.match(String(submittedBody?.request_id), /^guardian-caw-caw-test-request/);
      assert.equal(result.resolvedRecipientAddress, "0x24870681a481856b69D85D41C6f2401575228861");
    } finally {
      restore();
    }
  });

  it("returns CAW payload preview on SDK validation failure", async () => {
    const restore = setEnv({
      AGENT_WALLET_API_URL: "https://api.agenticwallet.cobo.com",
      AGENT_WALLET_API_KEY: "owner-key",
      AGENT_WALLET_WALLET_ID: "wallet-uuid",
      AGENT_WALLET_PACT_ID: "pact-uuid",
      CAW_RECIPIENT_DATA_API: "0x24870681a481856b69D85D41C6f2401575228861",
      CAW_RECIPIENT_AI_INFERENCE: "",
      CAW_RECIPIENT_ONCHAIN_ANALYTICS: "",
      CAW_RECIPIENT_RESEARCH_FEED: "",
      CAW_DESTINATION: "",
      CAW_NETWORK: "SETH",
      CAW_TOKEN_ID: "SETH",
      CAW_MOCK_MODE: "",
    });

    try {
      const result = await executeCawPayment(request({ recipient: "data-api-provider" }), {
        getWalletAddress: async () => "0x1111111111111111111111111111111111111111",
        getPactApiKey: async () => "pact-scoped-key",
        transferTokens: async () => {
          throw {
            response: {
              status: 422,
              body: {
                error: {
                  code: "policy_denied",
                  reason: { dst_addr: "recipient blocked by pact" },
                  details: { allowed_recipients: ["0x24870681a481856b69D85D41C6f2401575228861"] },
                },
                suggestion: "Use an approved recipient.",
              },
            },
          };
        },
      });

      assert.equal(result.success, false);
      assert.equal(result.errorCode, "caw_sdk_validation_error");
      assert.equal(result.cawPayloadPreview?.dst_addr, "0x24870681a481856b69D85D41C6f2401575228861");
      assert.equal(result.cawPayloadPreview?.src_addr, "0x1111111111111111111111111111111111111111");
      assert.equal("dst_address" in (result.cawPayloadPreview || {}), false);
      assert.equal(result.cawPayloadPreview?.amount, "0.001");
      assert.equal(result.cawError?.safeDetails?.cawCode, "policy_denied");
      assert.doesNotMatch(result.message, /\[object Object\]/);
    } finally {
      restore();
    }
  });

  it("surfaces missing pact api key errors without exposing credentials", async () => {
    const restore = setEnv({
      AGENT_WALLET_API_URL: "https://api.agenticwallet.cobo.com",
      AGENT_WALLET_API_KEY: "server-only-key",
      AGENT_WALLET_WALLET_ID: "wallet-uuid",
      AGENT_WALLET_PACT_ID: "pact-uuid",
      CAW_RECIPIENT_DATA_API: "0x24870681a481856b69D85D41C6f2401575228861",
      CAW_RECIPIENT_AI_INFERENCE: "",
      CAW_RECIPIENT_ONCHAIN_ANALYTICS: "",
      CAW_RECIPIENT_RESEARCH_FEED: "",
      CAW_DESTINATION: "",
      CAW_NETWORK: "SETH",
      CAW_TOKEN_ID: "SETH",
      CAW_MOCK_MODE: "",
    });

    try {
      const result = await executeCawPayment(request({ recipient: "data-api-provider" }), {
        getWalletAddress: async () => "0x1111111111111111111111111111111111111111",
        transferTokens: async () => {
          throw {
            status: 403,
            code: "missing_pact_api_key",
            reason: "Active Pact did not return a pact-scoped API key for transaction execution.",
            suggestion: "Create or approve an active Pact with can_transfer permission.",
            details: {
              required_permission: "can_transfer",
            },
          };
        },
      });

      assert.equal(result.success, false);
      assert.equal(result.errorCode, "caw_sdk_validation_error");
      assert.equal(result.cawError?.status, 403);
      assert.equal(result.cawError?.code, "missing_pact_api_key");
      assert.match(result.message, /pact-scoped API key/i);
      assert.doesNotMatch(result.message, /server-only-key/);
    } finally {
      restore();
    }
  });
});
