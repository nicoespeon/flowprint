import { traceDataFlow, type FlowDirection } from "./trace.js";
import { renderTextTree } from "./renderers/text-tree.js";

const CURSOR_MARKER = "[>]";

type TraceHelperOptions = {
	direction: FlowDirection;
	verbose?: boolean;
};

export function traceUpstream(codeWithCursor: string) {
	return traceAndRender(codeWithCursor, { direction: "upstream" });
}

export function traceUpstreamVerbose(codeWithCursor: string) {
	return traceAndRender(codeWithCursor, {
		direction: "upstream",
		verbose: true,
	});
}

export function traceDownstream(codeWithCursor: string) {
	return traceAndRender(codeWithCursor, { direction: "downstream" });
}

function traceAndRender(codeWithCursor: string, options: TraceHelperOptions) {
	const { code, position } = extractCursor(codeWithCursor);
	const graph = traceDataFlow({
		code,
		position,
		direction: options.direction,
	});
	return renderTextTree(graph, { verbose: options.verbose });
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
