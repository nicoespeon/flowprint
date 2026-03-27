import type { FlowGraph, FlowNode } from "../trace.js";

export function renderMermaid(graph: FlowGraph) {
	const isUpstream = graph.direction === "upstream";
	const nodes: string[] = [];
	const edges: string[] = [];
	let nextId = 0;

	function traverse(node: FlowNode) {
		const id = `n${nextId++}`;
		nodes.push(`    ${id}["${node.symbolName}"]`);

		for (const child of node.children) {
			const childId = traverse(child);
			const [from, to] = isUpstream ? [childId, id] : [id, childId];
			edges.push(`    ${from} --> ${to}`);
		}

		return id;
	}

	traverse(graph.root);

	const flowDirection = isUpstream ? "BT" : "TD";
	return [`flowchart ${flowDirection}`, ...nodes, ...edges].join("\n");
}
