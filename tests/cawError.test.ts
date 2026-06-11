import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeCawError } from "../lib/wallets/cawError";

describe("CAW error normalization", () => {
  it("extracts useful messages from nested SDK response bodies", () => {
    const normalized = normalizeCawError({
      response: {
        status: 422,
        data: {
          error: {
            code: "validation_error",
            reason: { recipient: "dst_addr is not allowed by pact" },
            details: {
              fieldErrors: {
                dst_addr: "recipient not in allowlist",
              },
            },
          },
        },
      },
    });

    assert.equal(normalized.status, 422);
    assert.equal(normalized.code, "validation_error");
    assert.match(normalized.message, /dst_addr is not allowed by pact|recipient not in allowlist/);
    assert.notEqual(normalized.message, "[object Object]");
    assert.equal(normalized.safeDetails?.cawCode, "validation_error");
  });

  it("redacts API keys, authorization headers, and bearer tokens", () => {
    const normalized = normalizeCawError({
      response: {
        status: 422,
        data: {
          message: "validation failed",
          details: {
            apiKey: "secret-api-key",
            headers: {
              Authorization: "Bearer secret-token",
              "X-API-Key": "secret-header-key",
            },
            nested: {
              AGENT_WALLET_API_KEY: "secret-env-key",
            },
          },
        },
      },
    });
    const serialized = JSON.stringify(normalized);

    assert.doesNotMatch(serialized, /secret-api-key|secret-token|secret-header-key|secret-env-key/);
    assert.match(serialized, /REDACTED/);
  });

  it("extracts status and body from Error instances that carry SDK response data", () => {
    const error = new Error("Request failed with status code 422") as Error & {
      response?: {
        status: number;
        data: {
          error: {
            code: string;
            reason: string;
            details: Record<string, string>;
          };
          suggestion: string;
        };
      };
    };
    error.response = {
      status: 422,
      data: {
        error: {
          code: "policy_denied",
          reason: "amount exceeds pact limit",
          details: {
            amount: "0.001",
            max: "0.0005",
          },
        },
        suggestion: "Use a smaller transfer amount.",
      },
    };

    const normalized = normalizeCawError(error);

    assert.equal(normalized.status, 422);
    assert.equal(normalized.code, "policy_denied");
    assert.match(normalized.message, /amount exceeds pact limit/);
    assert.match(normalized.message, /Use a smaller transfer amount/);
    assert.equal(normalized.safeDetails?.cawCode, "policy_denied");
    assert.notEqual(normalized.message, "[object Object]");
  });

  it("handles strings, Error instances, and unknown objects without object-string output", () => {
    assert.equal(normalizeCawError("plain CAW error").message, "plain CAW error");
    assert.equal(normalizeCawError(new Error("sdk failed")).message, "sdk failed");

    const normalized = normalizeCawError({ problem: { reason: "nested reason" } });

    assert.notEqual(normalized.message, "[object Object]");
    assert.match(normalized.message, /nested reason|CAW SDK validation error/);
  });
});
