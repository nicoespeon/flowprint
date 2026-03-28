import { describe, it, expect } from "vitest";
import dedent from "string-dedent";
import { traceUpstream, traceUpstreamVerbose } from "./test-helpers.js";

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

		it("traces when cursor is at the end of the identifier", () => {
			const code = `const source = "hello";
const target[>] = source;`;

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

		it("shows location info in verbose mode", () => {
			const code = `const source = "hello";
const [>]target = source;`;

			const result = traceUpstreamVerbose(code);

			expect(result).toBe(dedent`
				target (2:6)
				└── source (1:6)
			`);
		});

		it("disambiguates same-named nodes with location info in verbose mode", () => {
			const code = `function handleAdInt([>]data: { toto: string }) {
	console.log(data.toto);
}

function handleAddFromMQTT() {
	const data = { toto: "from mqtt" };
	handleAdInt(data);
}

function handleAd() {
	const data = { toto: "from ws" };
	handleAdInt(data);
}`;

			const result = traceUpstreamVerbose(code);

			expect(result).toBe(dedent`
				data (1:21)
				├── data (6:7)
				└── data (11:7)
			`);
		});

		it("traces an imported variable across files", () => {
			const result = traceUpstream({
				"src/a.ts": `import { source } from "./b";
const [>]target = source;`,
				"src/b.ts": `export const source = "hello";`,
			});

			expect(result).toBe(dedent`
				target
				└── source
			`);
		});

		it("traces a function parameter across files to the call-site argument", () => {
			const result = traceUpstreamVerbose({
				"src/handler.ts": `import { process } from "./service";
const input = { toto: "hello" };
process(input);`,
				"src/service.ts": `export function process([>]data: { toto: string }) {
	console.log(data.toto);
}`,
			});

			expect(result).toBe(dedent`
				data (/src/service.ts:1:24)
				└── input (/src/handler.ts:2:6)
			`);
		});

		it("traces through a named re-export", () => {
			const result = traceUpstream({
				"src/a.ts": `import { source } from "./barrel";
const [>]target = source;`,
				"src/barrel.ts": `export { source } from "./b";`,
				"src/b.ts": `export const source = "hello";`,
			});

			expect(result).toBe(dedent`
				target
				└── source
			`);
		});

		it("traces through a renamed re-export", () => {
			const result = traceUpstream({
				"src/a.ts": `import { renamed } from "./barrel";
const [>]target = renamed;`,
				"src/barrel.ts": `export { source as renamed } from "./b";`,
				"src/b.ts": `export const source = "hello";`,
			});

			expect(result).toBe(dedent`
				target
				└── source
			`);
		});

		it("traces through a wildcard re-export", () => {
			const result = traceUpstream({
				"src/a.ts": `import { source } from "./barrel";
const [>]target = source;`,
				"src/barrel.ts": `export * from "./b";`,
				"src/b.ts": `export const source = "hello";`,
			});

			expect(result).toBe(dedent`
				target
				└── source
			`);
		});

		it("traces through a method call to its receiver", () => {
			const code = `const items = [1, 2, 3];
const [>]result = items.filter(x => x > 1);`;

			const result = traceUpstream(code);

			expect(result).toBe(dedent`
				result
				└── items
			`);
		});

		it("traces a method call on a parameter back to call-site arguments", () => {
			const code = `function process(input: string) {
	const [>]trimmed = input.trim();
}
const raw = "  hello  ";
process(raw);`;

			const result = traceUpstream(code);

			expect(result).toBe(dedent`
				trimmed
				└── input
				    └── raw
			`);
		});

		it("traces an arrow function parameter to its call-site argument", () => {
			const code = `const greet = ([>]name: string) => {
	console.log(name);
};
const user = "Alice";
greet(user);`;

			const result = traceUpstream(code);

			expect(result).toBe(dedent`
				name
				└── user
			`);
		});

		it("traces a function expression parameter to its call-site argument", () => {
			const code = `const greet = function([>]name: string) {
	console.log(name);
};
const user = "Alice";
greet(user);`;

			const result = traceUpstream(code);

			expect(result).toBe(dedent`
				name
				└── user
			`);
		});

		it("traces through an arrow function passed as a callback", () => {
			const code = `function process(callback: (x: string) => void) {
	callback("hello");
}
process(([>]value) => {
	console.log(value);
});`;

			const result = traceUpstream(code);

			expect(result).toBe(dedent`
				value
				└── "hello"
			`);
		});

		it("traces a destructured variable to its source object", () => {
			const code = `const obj = { name: "Alice", age: 30 };
const { [>]name } = obj;`;

			const result = traceUpstream(code);

			expect(result).toBe(dedent`
				name
				└── obj
			`);
		});

		it("traces a destructured parameter to its call-site argument", () => {
			const code = `function greet({ [>]name }: { name: string }) {
	console.log(name);
}
const user = { name: "Alice" };
greet(user);`;

			const result = traceUpstream(code);

			expect(result).toBe(dedent`
				name
				└── user
			`);
		});

		it("traces a renamed destructured variable", () => {
			const code = `const obj = { name: "Alice" };
const { name: [>]userName } = obj;`;

			const result = traceUpstream(code);

			expect(result).toBe(dedent`
				userName
				└── obj
			`);
		});

		it("traces property access through a parameter with multiple callers", () => {
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

			const result = traceUpstreamVerbose(code);

			expect(result).toBe(dedent`
				toto (2:7)
				└── data.toto (2:14)
				    ├── data.toto (6:7)
				    └── data.toto (11:7)
			`);
		});
	});
});
