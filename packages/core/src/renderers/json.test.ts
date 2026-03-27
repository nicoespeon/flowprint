import { describe, it, expect } from "vitest";
import { traceUpstreamJSON } from "../test-helpers.js";

describe("renderJSON", () => {
	it("outputs the data flow trace as formatted JSON", () => {
		const code = `const source = "hello";
const [>]target = source;`;

		const result = JSON.parse(traceUpstreamJSON(code));

		expect(result).toMatchObject({
			direction: "upstream",
			root: {
				symbolName: "target",
				location: { filePath: "/input.ts", line: 2, column: 6 },
				sources: [
					{
						symbolName: "source",
						location: { filePath: "/input.ts", line: 1, column: 6 },
						sources: [],
					},
				],
			},
		});
	});

	it("includes all upstream sources in the JSON output", () => {
		const code = `function handle([>]data: string) {}

const a = "hello";
handle(a);

const b = "world";
handle(b);`;

		const result = JSON.parse(traceUpstreamJSON(code));

		expect(result).toMatchObject({
			root: {
				symbolName: "data",
				location: { filePath: "/input.ts", line: 1, column: 16 },
				sources: [
					{
						symbolName: "a",
						location: { filePath: "/input.ts", line: 3, column: 6 },
					},
					{
						symbolName: "b",
						location: { filePath: "/input.ts", line: 6, column: 6 },
					},
				],
			},
		});
	});
});
