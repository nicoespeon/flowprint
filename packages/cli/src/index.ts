import { resolve } from "node:path";
import { existsSync } from "node:fs";
import {
	traceDataFlow,
	getOrigins,
	renderTextTree,
	renderJSON,
	renderMermaid,
} from "@flowprint/core";

const USAGE = `Usage: flowprint trace <file>:<line>:<col> [options]

Options:
  --direction <upstream|downstream>  Trace direction (default: upstream)
  --format <text|json|mermaid>       Output format (default: text)
  --origins                          Show only the leaf nodes (data origins)
  --compact                          Hide location info in output
  --tsconfig <path>                  Path to tsconfig.json
  --help                             Show this help message`;

run();

function run() {
	const args = process.argv.slice(2);

	if (args.includes("--help") || args.length === 0) {
		console.log(USAGE);
		process.exit(0);
	}

	const command = args[0];
	if (command !== "trace") {
		console.error(`Unknown command: ${command}\n\n${USAGE}`);
		process.exit(1);
	}

	const target = args[1];
	if (!target) {
		console.error(`Missing target. Expected <file>:<line>:<col>\n\n${USAGE}`);
		process.exit(1);
	}

	const parsed = parseTarget(target);
	if (!parsed) {
		console.error(
			`Invalid target: ${target}. Expected <file>:<line>:<col>\n\n${USAGE}`,
		);
		process.exit(1);
	}

	const direction = parseFlag(args, "--direction") ?? "upstream";
	if (direction !== "upstream" && direction !== "downstream") {
		console.error(
			`Invalid direction: ${direction}. Use upstream or downstream.`,
		);
		process.exit(1);
	}
	const format = parseFlag(args, "--format") ?? "text";
	if (format !== "text" && format !== "json" && format !== "mermaid") {
		console.error(`Invalid format: ${format}. Use text, json, or mermaid.`);
		process.exit(1);
	}

	const verbose = !args.includes("--compact");
	const tsConfigFilePath = parseFlag(args, "--tsconfig");

	const filePath = resolve(parsed.filePath);
	if (!existsSync(filePath)) {
		console.error(`File not found: ${filePath}`);
		process.exit(1);
	}

	let graph;
	try {
		graph = traceDataFlow({
			filePath,
			position: { line: parsed.line, column: parsed.column - 1 },
			direction,
			tsConfigFilePath: tsConfigFilePath
				? resolve(tsConfigFilePath)
				: undefined,
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.error(`Error: ${message}`);
		process.exit(1);
	}

	if (args.includes("--origins")) {
		const origins = getOrigins(graph);
		for (const node of origins) {
			const loc = node.location;
			const suffix = loc ? ` (${loc.filePath}:${loc.line}:${loc.column})` : "";
			console.log(`${node.symbolName}${suffix}`);
		}
		return;
	}

	if (format === "text") {
		console.log(renderTextTree(graph, { verbose }));
	} else if (format === "json") {
		console.log(renderJSON(graph));
	} else {
		console.log(renderMermaid(graph));
	}
}

function parseTarget(target: string) {
	const match = target.match(/^(.+):(\d+):(\d+)$/);
	if (!match) return undefined;

	const [, filePath, lineStr, colStr] = match;
	if (!filePath || !lineStr || !colStr) return undefined;

	return {
		filePath,
		line: parseInt(lineStr, 10),
		column: parseInt(colStr, 10),
	};
}

function parseFlag(args: string[], flag: string) {
	const index = args.indexOf(flag);
	if (index === -1 || index + 1 >= args.length) return undefined;
	return args[index + 1];
}
