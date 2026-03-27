import { describe, it, expect } from "vitest";
import dedent from "string-dedent";
import { traceUpstreamMermaid } from "../test-helpers.js";

describe("renderMermaid", () => {
	it("outputs the data flow trace as a Mermaid flowchart", () => {
		const code = `const source = "hello";
const [>]target = source;`;

		const result = traceUpstreamMermaid(code);

		expect(result).toBe(dedent`
			flowchart BT
			    n0["target"]
			    n1["source"]
			    n1 --> n0
		`);
	});

	it("renders fan-in with depth as connected nodes", () => {
		const code = `function handle([>]data: string) {}

const origin = "raw";
const a = origin;
handle(a);

const b = "world";
handle(b);`;

		const result = traceUpstreamMermaid(code);

		expect(result).toBe(dedent`
			flowchart BT
			    n0["data"]
			    n1["a"]
			    n2["origin"]
			    n3["b"]
			    n2 --> n1
			    n1 --> n0
			    n3 --> n0
		`);
	});
});
