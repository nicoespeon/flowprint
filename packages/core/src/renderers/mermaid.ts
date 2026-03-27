import type { FlowGraph, FlowNode } from "../trace.js";

export function renderMermaid(graph: FlowGraph): string {
	const direction = graph.direction === "upstream" ? "BT" : "TD";
	const nodes: string[] = [];
	const edges: string[] = [];
	let nextId = 0;

	function traverse(node: FlowNode): string {
		const id = `n${nextId++}`;
		nodes.push(`    ${id}["${node.symbolName}"]`);

		for (const child of node.children) {
			const childId = traverse(child);
			if (graph.direction === "upstream") {
				edges.push(`    ${childId} --> ${id}`);
			} else {
				edges.push(`    ${id} --> ${childId}`);
			}
		}

		return id;
	}

	traverse(graph.root);

	return [`flowchart ${direction}`, ...nodes, ...edges].join("\n");
}
