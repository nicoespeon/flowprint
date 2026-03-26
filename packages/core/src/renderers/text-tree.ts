import type { FlowGraph, FlowNode } from "../trace.js";

type RenderOptions = {
	verbose?: boolean;
};

export function renderTextTree(
	graph: FlowGraph,
	options: RenderOptions = {},
): string {
	return renderNode(graph.root, "", options);
}

function renderNode(
	node: FlowNode,
	prefix: string,
	options: RenderOptions,
): string {
	let result = formatNodeLabel(node, options);

	node.children.forEach((child, i) => {
		const isLast = i === node.children.length - 1;
		const connector = isLast ? "└── " : "├── ";
		const childPrefix = isLast ? "    " : "│   ";

		result +=
			"\n" +
			prefix +
			connector +
			renderNode(child, prefix + childPrefix, options);
	});

	return result;
}

function formatNodeLabel(node: FlowNode, options: RenderOptions): string {
	if (options.verbose && node.line !== undefined && node.column !== undefined) {
		return `${node.symbolName} (${node.line}:${node.column})`;
	}

	return node.symbolName;
}
