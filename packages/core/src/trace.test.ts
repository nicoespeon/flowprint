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

		it("traces through chained variable assignments", () => {
			const code = `const a = "hello";
const b = a;
const [>]c = b;`;

			const result = traceUpstream(code);

			expect(result).toBe(dedent`
				c
				└── b
				    └── a
			`);
		});

		it("traces a function parameter to its call-site argument", () => {
			const code = `function greet([>]name: string) {
	console.log(name);
}
const user = "Alice";
greet(user);`;

			const result = traceUpstream(code);

			expect(result).toBe(dedent`
				name
				└── user
			`);
		});
	});
});
