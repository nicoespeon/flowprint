import type { FlowGraph, FlowNode } from "./trace.js";

export function getOrigins(graph: FlowGraph): FlowNode[] {
	const leaves: FlowNode[] = [];
	for (const child of graph.root.children) {
		collectLeaves(child, leaves);
	}
	return leaves;
}

function collectLeaves(node: FlowNode, leaves: FlowNode[]): void {
	if (node.children.length === 0) {
		leaves.push(node);
		return;
	}
	for (const child of node.children) {
		collectLeaves(child, leaves);
	}
}
