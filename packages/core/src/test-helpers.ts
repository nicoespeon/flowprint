import { traceDataFlow, type FlowDirection } from "./trace.js";
import { renderTextTree } from "./renderers/text-tree.js";
import { renderJSON } from "./renderers/json.js";
import { renderMermaid } from "./renderers/mermaid.js";

const CURSOR_MARKER = "[>]";

type CodeInput = string | Record<string, string>;

export function traceUpstream(input: CodeInput) {
	return renderTextTree(traceGraph(input, "upstream"));
}

export function traceUpstreamVerbose(input: CodeInput) {
	return renderTextTree(traceGraph(input, "upstream"), { verbose: true });
}

export function traceDownstream(input: CodeInput) {
	return renderTextTree(traceGraph(input, "downstream"));
}

export function traceUpstreamJSON(input: CodeInput) {
	return renderJSON(traceGraph(input, "upstream"));
}

export function traceUpstreamMermaid(input: CodeInput) {
	return renderMermaid(traceGraph(input, "upstream"));
}

function traceGraph(input: CodeInput, direction: FlowDirection) {
	const parsed =
		typeof input === "string"
			? extractCursor(input)
			: parseMultipleFiles(input);

	return traceDataFlow({ ...parsed, direction });
}

function parseMultipleFiles(filesWithCursor: Record<string, string>) {
	const files: Record<string, string> = {};
	let cursorFilePath: string | undefined;
	let cursorPosition: { line: number; column: number } | undefined;

	for (const [path, content] of Object.entries(filesWithCursor)) {
		if (content.includes(CURSOR_MARKER)) {
			cursorFilePath = path;
			const { code, position } = extractCursor(content);
			files[path] = code;
			cursorPosition = position;
		} else {
			files[path] = content;
		}
	}

	if (!cursorFilePath || !cursorPosition) {
		throw new Error(`One file must contain a ${CURSOR_MARKER} cursor marker`);
	}

	return { files, filePath: cursorFilePath, position: cursorPosition };
}

function extractCursor(codeWithCursor: string) {
	const index = codeWithCursor.indexOf(CURSOR_MARKER);
	if (index === -1) {
		throw new Error(`Code must contain a ${CURSOR_MARKER} cursor marker`);
	}

	const before = codeWithCursor.slice(0, index);
	const lines = before.split("\n");
	const line = lines.length;
	const lastLine = lines.at(-1) ?? "";
	const column = lastLine.length;

	const code = codeWithCursor.replace(CURSOR_MARKER, "");
	return { code, position: { line, column } };
}
