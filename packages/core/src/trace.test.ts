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

		it("traces through assignment into parameter into call-site argument", () => {
			const code = `function process(input: string) {
	const [>]value = input;
}
const data = "hello";
process(data);`;

			const result = traceUpstream(code);

			expect(result).toBe(dedent`
				value
				└── input
				    └── data
			`);
		});

		it("traces a property access on an object", () => {
			const code = `const obj = { name: "Alice" };
const [>]value = obj.name;`;

			const result = traceUpstream(code);

			expect(result).toBe(dedent`
				value
				└── obj.name
			`);
		});

		it("traces a property access back through a function parameter", () => {
			const code = `function process(data: { toto: string }) {
	const [>]value = data.toto;
}
const input = { toto: "hello" };
process(input);`;

			const result = traceUpstream(code);

			expect(result).toBe(dedent`
				value
				└── data.toto
				    └── input.toto
			`);
		});

		it("traces a parameter with multiple call sites", () => {
			const code = `function handleAdInt([>]data: { toto: string }) {
	console.log(data.toto);
}

function handleAddFromMQTT() {
	const mqttData = { toto: "from mqtt" };
	handleAdInt(mqttData);
}

function handleAd() {
	const wsData = { toto: "from ws" };
	handleAdInt(wsData);
}`;

			const result = traceUpstream(code);

			expect(result).toBe(dedent`
				data
				├── mqttData
				└── wsData
			`);
		});

		it("traces the full Notion example: variable through property access and multiple callers", () => {
			const code = `function handleAdInt(data: { toto: string }) {
	const [>]toto = data.toto;
}

function handleAddFromMQTT(ctx: { query: { tot: string } }) {
	const data = { toto: ctx.query.tot };
	handleAdInt(data);
}

function handleAd() {
	const data = { toto: "hello" };
	handleAdInt(data);
}`;

			const result = traceUpstream(code);

			expect(result).toBe(dedent`
				toto
				└── data.toto
				    ├── data.toto
				    └── data.toto
			`);
		});
	});
});
