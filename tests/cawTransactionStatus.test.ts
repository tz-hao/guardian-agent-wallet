import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildSepoliaExplorerUrl,
  extractCawTxHash,
  getCawTransactionStatusByRequestId,
} from "../lib/wallets/cawServer";
import { POST as transactionStatusPost } from "../app/api/caw/transaction-status/route";

describe("CAW transaction hash polling", () => {
  it("extracts tx_hash", () => {
    assert.equal(extractCawTxHash({ tx_hash: "0xHASH1" }), "0xHASH1");
  });

  it("extracts transaction_hash", () => {
    assert.equal(extractCawTxHash({ transaction_hash: "0xHASH2" }), "0xHASH2");
  });

  it("returns pending without faking txHash", async () => {
    const result = await getCawTransactionStatusByRequestId("request-1", {
      getTransactionRecordByRequestId: async () => ({
        id: "record-1",
        request_id: "request-1",
        status: 300,
        status_display: "Processing",
      }),
    });

    assert.equal(result.success, true);
    assert.equal(result.status, "pending");
    assert.equal(result.txHash, "");
    assert.equal(result.explorerUrl, "");
  });

  it("generates explorerUrl only when txHash exists", () => {
    assert.equal(buildSepoliaExplorerUrl(""), "");
    assert.equal(buildSepoliaExplorerUrl("0xHASH3"), "https://sepolia.etherscan.io/tx/0xHASH3");
  });

  it("API route rejects missing requestId", async () => {
    const response = await transactionStatusPost(new Request("http://localhost/api/caw/transaction-status", {
      method: "POST",
      body: JSON.stringify({}),
    }));
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.error.code, "missing_request_id");
  });

  it("does not expose API keys in status errors", async () => {
    const result = await getCawTransactionStatusByRequestId("request-2", {
      getTransactionRecordByRequestId: async () => {
        throw {
          response: {
            status: 403,
            data: {
              message: "api_key=secret-key cannot query this record",
            },
          },
        };
      },
    });

    assert.equal(result.success, false);
    assert.doesNotMatch(result.message, /secret-key/);
    assert.match(result.message, /\[REDACTED\]/);
  });
});
