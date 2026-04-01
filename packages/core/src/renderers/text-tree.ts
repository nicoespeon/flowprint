import type { FlowGraph, FlowNode, FlowLocation } from "../trace.js";

type RenderOptions = {
	verbose?: boolean;
};

export function renderTextTree(
	graph: FlowGraph,
	options: RenderOptions = {},
): string {
	const showFilePath = options.verbose && hasMultipleFiles(graph.root);
	return renderNode(graph.root, "", { ...options, showFilePath });
}

type ResolvedOptions = RenderOptions & { showFilePath?: boolean };

function renderNode(
	node: FlowNode,
	prefix: string,
	options: ResolvedOptions,
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

function formatNodeLabel(node: FlowNode, options: ResolvedOptions): string {
	let label = node.symbolName;

	if (options.verbose && node.location) {
		const locationStr = formatLocation(node.location, options.showFilePath);
		label += ` (${locationStr})`;
	}

	if (node.incomplete) label += " …";

	return label;
}

function formatLocation(location: FlowLocation, showFilePath?: boolean) {
	const prefix = showFilePath ? `${location.filePath}:` : "";
	return `${prefix}${location.line}:${location.column}`;
}

function hasMultipleFiles(node: FlowNode): boolean {
	const paths = new Set<string>();
	collectFilePaths(node, paths);
	return paths.size > 1;
}

function collectFilePaths(node: FlowNode, paths: Set<string>): void {
	if (node.location) paths.add(node.location.filePath);
	node.children.forEach((child) => collectFilePaths(child, paths));
}
