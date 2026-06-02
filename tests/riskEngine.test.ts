import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assessRisk } from "../lib/risk/riskEngine";
import type { PaymentRequest } from "../types";

function request(overrides: Partial<PaymentRequest> = {}): PaymentRequest {
  return {
    id: "risk-test",
    rawInput: "buy 10 USDC ETH",
    action: "swap",
    token: "USDC",
    amount: 10,
    recipient: "x402-service",
    spender: "",
    chainId: 8453,
    timestamp: Date.UTC(2026, 0, 1, 12),
    isUnlimitedApproval: false,
    ...overrides,
  };
}

describe("risk engine", () => {
  it("returns low risk for a small trusted payment", () => {
    const risk = assessRisk(request());

    assert.equal(risk.riskScore, 5);
    assert.equal(risk.riskLevel, "LOW");
    assert.deepEqual(risk.warnings, ["Small payment amount: 10 USDC."]);
  });

  it("generates a human explanation for unlimited approvals", () => {
    const risk = assessRisk(
      request({
        action: "approve",
        amount: 0,
        recipient: "0xUNKNOWN",
        spender: "0xUNKNOWN",
        isUnlimitedApproval: true,
      }),
    );

    assert.equal(risk.riskScore, 100);
    assert.equal(risk.riskLevel, "HIGH");
    assert.equal(
      risk.explanation,
      "This transaction grants unlimited spending permission to 0xUNKNOWN.",
    );
    assert.ok(
      risk.warnings.includes(
        "Unlimited approval: this grants unlimited future spending permission.",
      ),
    );
  });

  it("flags unsupported tokens", () => {
    const risk = assessRisk(request({ token: "DOGE" }));

    assert.equal(risk.riskScore, 50);
    assert.equal(risk.riskLevel, "MEDIUM");
    assert.ok(risk.warnings.includes("Unsupported token: DOGE is not in the allowed token list."));
  });

  it("flags unknown recipients and suspicious contracts", () => {
    const risk = assessRisk(
      request({
        action: "transfer",
        recipient: "0xBAD",
      }),
    );

    assert.equal(risk.riskScore, 95);
    assert.equal(risk.riskLevel, "HIGH");
    assert.ok(
      risk.warnings.includes(
        "Unknown recipient: the destination is not in the trusted recipient list.",
      ),
    );
    assert.ok(
      risk.warnings.includes(
        "Suspicious contract: the target address matches a known suspicious pattern.",
      ),
    );
  });
});
