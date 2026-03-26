import { Project, Node, SyntaxKind } from "ts-morph";

type FlowDirection = "upstream" | "downstream";

type FlowNodeKind =
	| "assignment"
	| "parameter"
	| "property-access"
	| "destructuring"
	| "return"
	| "reference";

export type FlowNode = {
	symbolName: string;
	kind: FlowNodeKind;
	children: FlowNode[];
	filePath?: string;
	line?: number;
	column?: number;
};

export type FlowGraph = {
	root: FlowNode;
	direction: FlowDirection;
};

type Position = {
	line: number;
	column: number;
};

type TraceFromFile = {
	filePath: string;
	position: Position;
	direction: FlowDirection;
};

type TraceFromCode = {
	code: string;
	position: Position;
	direction: FlowDirection;
};

type TraceOptions = TraceFromFile | TraceFromCode;

export function traceDataFlow(options: TraceOptions): FlowGraph {
	const project = new Project({ useInMemoryFileSystem: true });
	const sourceFile = isFromCode(options)
		? project.createSourceFile("input.ts", options.code)
		: project.addSourceFileAtPath(options.filePath);

	const pos = sourceFile.compilerNode.getPositionOfLineAndCharacter(
		options.position.line - 1,
		options.position.column,
	);

	const node = sourceFile.getDescendantAtPos(pos);
	if (!node) {
		throw new Error(
			`No node found at ${options.position.line}:${options.position.column}`,
		);
	}

	const root = traceUpstreamNode(node);
	return { root, direction: options.direction };
}

function traceUpstreamNode(node: Node): FlowNode {
	const varDecl =
		node.getFirstAncestorByKind(SyntaxKind.VariableDeclaration) ??
		(Node.isVariableDeclaration(node) ? node : undefined);

	if (!varDecl) {
		return {
			symbolName: node.getText(),
			kind: "reference",
			children: [],
		};
	}

	const name = varDecl.getName();
	const initializer = varDecl.getInitializer();

	if (initializer && Node.isIdentifier(initializer)) {
		const refs = initializer.getDefinitionNodes();
		const children = refs.map((ref) => traceUpstreamNode(ref));
		return { symbolName: name, kind: "assignment", children };
	}

	return { symbolName: name, kind: "assignment", children: [] };
}

function isFromCode(options: TraceOptions): options is TraceFromCode {
	return "code" in options;
}
