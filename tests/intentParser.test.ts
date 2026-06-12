import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseIntent } from "../lib/intent/intentParser";

describe("intent parser", () => {
  it("parses realistic Chinese agent payment requests into trusted service aliases", () => {
    const cases = [
      ["\u652f\u4ed8 0.0001 SETH \u7ed9 \u6570\u636e API \u670d\u52a1\u5546", 0.0001, "data-api-provider"],
      ["\u652f\u4ed8 0.001 SETH \u7ed9 \u6570\u636e API \u670d\u52a1\u5546", 0.001, "data-api-provider"],
      ["\u652f\u4ed8 0.005 SETH \u7ed9 AI \u63a8\u7406\u670d\u52a1", 0.005, "ai-inference-service"],
      ["\u652f\u4ed8 0.01 SETH \u7ed9 \u94fe\u4e0a\u5206\u6790 API", 0.01, "onchain-analytics-api"],
      [
        "\u652f\u4ed8 0.05 SETH \u7ed9 \u9ad8\u7ea7\u7814\u7a76\u6570\u636e\u6e90",
        0.05,
        "premium-research-feed",
      ],
    ] as const;

    for (const [input, amount, recipient] of cases) {
      const request = parseIntent(input);

      assert.equal(request.action, "transfer");
      assert.equal(request.token, "SETH");
      assert.equal(request.amount, amount);
      assert.equal(request.recipient, recipient);
    }
  });
});
