import type { FlowGraph, FlowNode } from "../trace.js";

export function renderTextTree(graph: FlowGraph): string {
	return renderNode(graph.root, "");
}

function renderNode(node: FlowNode, prefix: string): string {
	let result = node.symbolName;

	node.children.forEach((child, i) => {
		const isLast = i === node.children.length - 1;
		const connector = isLast ? "└── " : "├── ";
		const childPrefix = isLast ? "    " : "│   ";

		result +=
			"\n" + prefix + connector + renderNode(child, prefix + childPrefix);
	});

	return result;
}
