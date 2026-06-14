import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shouldAutoExecutePayment } from "../lib/policy/autoExecute";
import type { PolicyDecision } from "../types";

function decision(value: PolicyDecision["decision"]): PolicyDecision {
  return {
    decision: value,
    riskLevel: value === "ALLOW" ? "LOW" : "HIGH",
    score: value === "ALLOW" ? 10 : 90,
    reason: "test",
    triggeredRules: value === "ALLOW" ? ["all_checks_passed"] : ["test_rule"],
    rulesTriggered: value === "ALLOW" ? ["all_checks_passed"] : ["test_rule"],
  };
}

describe("auto execute mode", () => {
  it("allows automatic CAW submission only for ALLOW decisions", () => {
    assert.equal(
      shouldAutoExecutePayment({
        autoExecuteEnabled: true,
        decision: decision("ALLOW"),
        hasExecuted: false,
      }),
      true,
    );
  });

  it("does not auto execute CONFIRM decisions", () => {
    assert.equal(
      shouldAutoExecutePayment({
        autoExecuteEnabled: true,
        decision: decision("CONFIRM"),
        hasExecuted: false,
      }),
      false,
    );
  });

  it("does not auto execute DENY decisions", () => {
    assert.equal(
      shouldAutoExecutePayment({
        autoExecuteEnabled: true,
        decision: decision("DENY"),
        hasExecuted: false,
      }),
      false,
    );
  });

  it("does not auto execute when the toggle is off", () => {
    assert.equal(
      shouldAutoExecutePayment({
        autoExecuteEnabled: false,
        decision: decision("ALLOW"),
        hasExecuted: false,
      }),
      false,
    );
  });
});
