import { traceDataFlow } from "./trace.js";
import { renderTextTree } from "./renderers/text-tree.js";

const CURSOR_MARKER = "[>]";

export function traceUpstream(codeWithCursor: string) {
	const { code, position } = extractCursor(codeWithCursor);
	const graph = traceDataFlow({ code, position, direction: "upstream" });
	return renderTextTree(graph);
}

export function traceUpstreamVerbose(codeWithCursor: string) {
	const { code, position } = extractCursor(codeWithCursor);
	const graph = traceDataFlow({ code, position, direction: "upstream" });
	return renderTextTree(graph, { verbose: true });
}

export function traceDownstream(codeWithCursor: string) {
	const { code, position } = extractCursor(codeWithCursor);
	const graph = traceDataFlow({ code, position, direction: "downstream" });
	return renderTextTree(graph);
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
