import {
	Project,
	Node,
	SyntaxKind,
	type ParameterDeclaration,
	type VariableDeclaration,
} from "ts-morph";

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
	const param = findParameterDeclaration(node);
	if (param) return traceParameter(param);

	const varDecl = findVariableDeclaration(node);
	if (varDecl) return traceVariableDeclaration(varDecl);

	return { symbolName: node.getText(), kind: "reference", children: [] };
}

function traceVariableDeclaration(varDecl: VariableDeclaration): FlowNode {
	const name = varDecl.getName();
	const initializer = varDecl.getInitializer();

	if (initializer && Node.isIdentifier(initializer)) {
		const refs = initializer.getDefinitionNodes();
		const children = refs.map((ref) => traceUpstreamNode(ref));
		return { symbolName: name, kind: "assignment", children };
	}

	return { symbolName: name, kind: "assignment", children: [] };
}

function traceParameter(param: ParameterDeclaration): FlowNode {
	const name = param.getName();
	const fn = param.getFirstAncestorByKind(SyntaxKind.FunctionDeclaration);
	if (!fn) return { symbolName: name, kind: "parameter", children: [] };

	const paramIndex = fn.getParameters().indexOf(param);
	const callSiteArgs = fn
		.findReferencesAsNodes()
		.map((ref) => ref.getParent())
		.filter(Node.isCallExpression)
		.map((call) => call.getArguments()[paramIndex])
		.filter((arg): arg is Node => arg !== undefined);

	const children = callSiteArgs.map((arg) => traceUpstreamNode(arg));
	return { symbolName: name, kind: "parameter", children };
}

function findVariableDeclaration(node: Node) {
	if (Node.isVariableDeclaration(node)) return node;
	return node.getFirstAncestorByKind(SyntaxKind.VariableDeclaration);
}

function findParameterDeclaration(node: Node) {
	if (Node.isParameterDeclaration(node)) return node;
	return node.getFirstAncestorByKind(SyntaxKind.Parameter);
}

function isFromCode(options: TraceOptions): options is TraceFromCode {
	return "code" in options;
}
