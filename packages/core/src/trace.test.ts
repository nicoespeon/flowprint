import { describe, it, expect } from "vitest";
import dedent from "string-dedent";
import { traceUpstream } from "./test-helpers.js";

describe("traceDataFlow", () => {
	describe("upstream (where does data come from)", () => {
		it("traces a direct variable assignment", () => {
			const code = `const source = "hello";
const [>]target = source;`;

			const result = traceUpstream(code);

			expect(result).toBe(dedent`
				target
				└── source
			`);
		});
	});
});
