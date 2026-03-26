import {
	Project,
	Node,
	SyntaxKind,
	type ParameterDeclaration,
	type PropertyAccessExpression,
	type VariableDeclaration,
} from "ts-morph";

export type FlowDirection = "upstream" | "downstream";

type FlowNodeKind =
	| "assignment"
	| "parameter"
	| "property-access"
	| "destructuring"
	| "return"
	| "reference";

export type FlowLocation = {
	filePath: string;
	line: number;
	column: number;
};

export type FlowNode = {
	symbolName: string;
	kind: FlowNodeKind;
	children: FlowNode[];
	location?: FlowLocation;
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

type TraceFromMultipleFiles = {
	files: Record<string, string>;
	filePath: string;
	position: Position;
	direction: FlowDirection;
};

type TraceOptions = TraceFromFile | TraceFromCode | TraceFromMultipleFiles;

export function traceDataFlow(options: TraceOptions): FlowGraph {
	const project = new Project({
		useInMemoryFileSystem: isFromCode(options) || isFromMultipleFiles(options),
		compilerOptions: { strict: true },
	});

	let sourceFile;
	if (isFromMultipleFiles(options)) {
		sourceFile = addMultipleFiles(project, options);
	} else if (isFromCode(options)) {
		sourceFile = project.createSourceFile("input.ts", options.code);
	} else {
		sourceFile = project.addSourceFileAtPath(options.filePath);
	}

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
	if (Node.isIdentifier(node)) {
		const definition = node.getDefinitionNodes().at(0);
		if (definition) return traceUpstreamNode(definition);

		const param = node.getFirstAncestorByKind(SyntaxKind.Parameter);
		if (param) return traceParameter(param);

		const varDecl = node.getFirstAncestorByKind(SyntaxKind.VariableDeclaration);
		if (varDecl) return traceVariableDeclaration(varDecl);
	}

	if (Node.isPropertyAccessExpression(node)) {
		return tracePropertyAccess(node);
	}

	if (Node.isVariableDeclaration(node)) {
		return traceVariableDeclaration(node);
	}

	if (Node.isParameterDeclaration(node)) {
		return traceParameter(node);
	}

	return {
		symbolName: node.getText(),
		kind: "reference",
		children: [],
		location: locationOf(node),
	};
}

function locationOf(node: Node): FlowLocation {
	const sourceFile = node.getSourceFile();
	const pos = node.getStart();
	const { line, character } =
		sourceFile.compilerNode.getLineAndCharacterOfPosition(pos);
	return {
		filePath: sourceFile.getFilePath(),
		line: line + 1,
		column: character,
	};
}

function traceVariableDeclaration(varDecl: VariableDeclaration): FlowNode {
	const name = varDecl.getName();
	const location = locationOf(varDecl.getNameNode());
	const initializer = varDecl.getInitializer();
	if (!initializer)
		return { symbolName: name, kind: "assignment", children: [], location };

	if (
		Node.isIdentifier(initializer) ||
		Node.isPropertyAccessExpression(initializer)
	) {
		return {
			symbolName: name,
			kind: "assignment",
			children: [traceUpstreamNode(initializer)],
			location,
		};
	}

	return { symbolName: name, kind: "assignment", children: [], location };
}

function tracePropertyAccess(expr: PropertyAccessExpression): FlowNode {
	const fullName = expr.getText();
	const propertyName = expr.getName();
	const location = locationOf(expr);

	const objectTrace = traceUpstreamNode(expr.getExpression());
	const children = objectTrace.children.map((child) => ({
		...child,
		symbolName: child.symbolName + "." + propertyName,
		kind: "property-access" as const,
		children: [] as FlowNode[],
	}));

	return {
		symbolName: fullName,
		kind: "property-access",
		children,
		location,
	};
}

function traceParameter(param: ParameterDeclaration): FlowNode {
	const name = param.getName();
	const location = locationOf(param.getNameNode());
	const fn = param.getFirstAncestorByKind(SyntaxKind.FunctionDeclaration);
	if (!fn)
		return { symbolName: name, kind: "parameter", children: [], location };

	const paramIndex = fn.getParameters().indexOf(param);
	const callSiteArgs = fn
		.findReferencesAsNodes()
		.map((ref) => ref.getParent())
		.filter(Node.isCallExpression)
		.map((call) => call.getArguments()[paramIndex])
		.filter((arg): arg is Node => arg !== undefined);

	const children = callSiteArgs.map((arg) => traceUpstreamNode(arg));
	return { symbolName: name, kind: "parameter", children, location };
}

function addMultipleFiles(project: Project, options: TraceFromMultipleFiles) {
	for (const [path, content] of Object.entries(options.files)) {
		project.createSourceFile(path, content);
	}
	const sourceFile = project.getSourceFile(options.filePath);
	if (!sourceFile) {
		throw new Error(`File not found in project: ${options.filePath}`);
	}
	return sourceFile;
}

function isFromCode(options: TraceOptions): options is TraceFromCode {
	return "code" in options;
}

function isFromMultipleFiles(
	options: TraceOptions,
): options is TraceFromMultipleFiles {
	return "files" in options;
}
