import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildAuditTimelineItems, createAuditLog } from "../lib/auditLog";
import type { PaymentRequest, PolicyDecision, WalletExecutionResult, WalletInfo } from "../types";

const request: PaymentRequest = {
  id: "audit-request",
  rawInput: "send 20 USDC to 0x123",
  action: "transfer",
  token: "USDC",
  amount: 20,
  recipient: "0x123",
  spender: "",
  chainId: 8453,
  timestamp: Date.UTC(2026, 0, 1, 12),
  isUnlimitedApproval: false,
};

const decision: PolicyDecision = {
  decision: "ALLOW",
  riskLevel: "LOW",
  score: 10,
  reason: "Request is within policy.",
  triggeredRules: ["all_checks_passed"],
  rulesTriggered: ["all_checks_passed"],
};

const wallet: WalletInfo = {
  mode: "mock",
  name: "Mock Wallet",
  chainId: 8453,
  address: "0xMOCK_AGENT_WALLET",
  isConnected: true,
};

const executionResult: WalletExecutionResult = {
  success: true,
  txHash: "0xMOCK123",
  status: "confirmed",
  walletMode: "mock",
  message: "Mock wallet execution recorded.",
};

describe("audit log", () => {
  it("stores request, policy, risk, wallet, confirmation, and execution result", () => {
    const record = createAuditLog(request, decision, executionResult, wallet, "not_required");

    assert.equal(record.requestId, request.id);
    assert.deepEqual(record.request, request);
    assert.deepEqual(record.policyDecision, decision);
    assert.equal(record.riskScore, 10);
    assert.deepEqual(record.wallet, wallet);
    assert.equal(record.txHash, executionResult.txHash);
    assert.deepEqual(record.executionResult, executionResult);
    assert.equal(record.userConfirmation, "not_required");
    assert.deepEqual(
      record.events.map((event) => event.type),
      ["Intent Parsed", "Policy Evaluated"],
    );
  });

  it("generates UI-friendly timeline items", () => {
    const record = createAuditLog(request, decision, executionResult, wallet, "not_required");
    const items = buildAuditTimelineItems([record]);

    assert.equal(items.length, 2);
    assert.equal(items[0].title, "Intent parsed");
    assert.equal(items[0].tone, "info");
    assert.ok(items[0].details.some((detail) => detail.includes("TRANSFER 20 USDC")));
    assert.ok(items[1].details.some((detail) => detail.includes("Risk score: 10")));
  });
});
