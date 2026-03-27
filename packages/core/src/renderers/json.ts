import type { FlowGraph, FlowNode } from "../trace.js";

export function renderJSON(graph: FlowGraph): string {
	return JSON.stringify(
		{
			direction: graph.direction,
			root: nodeToJSON(graph.root),
		},
		null,
		2,
	);
}

function nodeToJSON(node: FlowNode): Record<string, unknown> {
	const result: Record<string, unknown> = {
		symbolName: node.symbolName,
		kind: node.kind,
	};
	if (node.location) {
		result.location = node.location;
	}
	result.sources = node.children.map(nodeToJSON);
	return result;
}
