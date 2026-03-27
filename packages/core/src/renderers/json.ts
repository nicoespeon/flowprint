import type { FlowGraph, FlowNode } from "../trace.js";

export function renderJSON(graph: FlowGraph) {
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
	return {
		symbolName: node.symbolName,
		kind: node.kind,
		...(node.location && { location: node.location }),
		sources: node.children.map(nodeToJSON),
	};
}
