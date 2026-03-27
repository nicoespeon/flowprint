import {
	Project,
	Node,
	SyntaxKind,
	type CallExpression,
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
	tsConfigFilePath?: string;
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
	let project;
	let sourceFile;

	if (isFromMultipleFiles(options)) {
		project = new Project({
			useInMemoryFileSystem: true,
			compilerOptions: { strict: true },
		});
		sourceFile = addMultipleFiles(project, options);
	} else if (isFromCode(options)) {
		project = new Project({
			useInMemoryFileSystem: true,
			compilerOptions: { strict: true },
		});
		sourceFile = project.createSourceFile("input.ts", options.code);
	} else {
		project = new Project({
			tsConfigFilePath: options.tsConfigFilePath,
		});
		sourceFile = project.addSourceFileAtPath(options.filePath);
	}

	const lineCount = sourceFile.getEndLineNumber();
	if (options.position.line < 1 || options.position.line > lineCount) {
		throw new Error(
			`Line ${options.position.line} is out of range (file has ${lineCount} lines)`,
		);
	}

	let pos;
	try {
		pos = sourceFile.compilerNode.getPositionOfLineAndCharacter(
			options.position.line - 1,
			options.position.column,
		);
	} catch {
		throw new Error(
			`Column ${options.position.column} is out of range at line ${options.position.line}`,
		);
	}

	const node = sourceFile.getDescendantAtPos(pos);
	if (!node) {
		throw new Error(
			`No traceable symbol at ${options.position.line}:${options.position.column}`,
		);
	}

	const root = traceUpstreamNode(node, new Set());
	return { root, direction: options.direction };
}

function nodeKey(node: Node): string {
	return `${node.getSourceFile().getFilePath()}:${node.getStart()}`;
}

function traceUpstreamNode(node: Node, visited: Set<string>): FlowNode {
	if (Node.isIdentifier(node)) {
		const definition = node.getDefinitionNodes().at(0);
		if (definition) return traceUpstreamNode(definition, visited);

		const param = node.getFirstAncestorByKind(SyntaxKind.Parameter);
		if (param) return traceParameter(param, visited);

		const varDecl = node.getFirstAncestorByKind(SyntaxKind.VariableDeclaration);
		if (varDecl) return traceVariableDeclaration(varDecl, visited);
	}

	if (Node.isCallExpression(node)) {
		return traceCallExpression(node, visited);
	}

	if (Node.isPropertyAccessExpression(node)) {
		return tracePropertyAccess(node, visited);
	}

	if (Node.isVariableDeclaration(node)) {
		return traceVariableDeclaration(node, visited);
	}

	if (Node.isParameterDeclaration(node)) {
		return traceParameter(node, visited);
	}

	return {
		symbolName: node.getText(),
		kind: "reference",
		children: [],
		location: locationOf(node),
	};
}

function traceVariableDeclaration(
	varDecl: VariableDeclaration,
	visited: Set<string>,
): FlowNode {
	const key = nodeKey(varDecl);
	const name = varDecl.getName();
	const location = locationOf(varDecl.getNameNode());
	if (visited.has(key))
		return { symbolName: name, kind: "assignment", children: [], location };
	visited.add(key);
	const initializer = varDecl.getInitializer();

	const isTraceableInitializer =
		initializer !== undefined &&
		(Node.isIdentifier(initializer) ||
			Node.isPropertyAccessExpression(initializer) ||
			Node.isCallExpression(initializer));

	const children = isTraceableInitializer
		? [traceUpstreamNode(initializer, visited)]
		: [];

	return { symbolName: name, kind: "assignment", children, location };
}

function traceCallExpression(
	call: CallExpression,
	visited: Set<string>,
): FlowNode {
	const callee = call.getExpression();

	if (Node.isPropertyAccessExpression(callee)) {
		return traceUpstreamNode(callee.getExpression(), visited);
	}

	return {
		symbolName: call.getText(),
		kind: "reference",
		children: [],
		location: locationOf(call),
	};
}

function tracePropertyAccess(
	expr: PropertyAccessExpression,
	visited: Set<string>,
): FlowNode {
	const fullName = expr.getText();
	const propertyName = expr.getName();
	const location = locationOf(expr);

	const objectTrace = traceUpstreamNode(expr.getExpression(), visited);
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

function traceParameter(
	param: ParameterDeclaration,
	visited: Set<string>,
): FlowNode {
	const key = nodeKey(param);
	const name = param.getName();
	const location = locationOf(param.getNameNode());
	if (visited.has(key))
		return { symbolName: name, kind: "parameter", children: [], location };
	visited.add(key);
	const callSiteArgs = findCallSiteArgs(param);
	const children = callSiteArgs.map((arg) => traceUpstreamNode(arg, visited));
	return { symbolName: name, kind: "parameter", children, location };
}

function findCallSiteArgs(param: ParameterDeclaration): Node[] {
	const fn =
		param.getFirstAncestorByKind(SyntaxKind.FunctionDeclaration) ??
		param.getFirstAncestorByKind(SyntaxKind.ArrowFunction) ??
		param.getFirstAncestorByKind(SyntaxKind.FunctionExpression);
	if (!fn) return [];

	const paramIndex = fn.getParameters().indexOf(param);

	if (Node.isFunctionDeclaration(fn)) {
		return fn
			.findReferencesAsNodes()
			.map((ref) => ref.getParent())
			.filter(Node.isCallExpression)
			.map((call) => call.getArguments()[paramIndex])
			.filter((arg): arg is Node => arg !== undefined);
	}

	const parent = fn.getParent();

	// const greet = (name) => { ... }; greet(user);
	if (parent && Node.isVariableDeclaration(parent)) {
		const nameNode = parent.getNameNode();
		if (!Node.isIdentifier(nameNode)) return [];
		return nameNode
			.findReferencesAsNodes()
			.map((ref) => ref.getParent())
			.filter(Node.isCallExpression)
			.map((call) => call.getArguments()[paramIndex])
			.filter((arg): arg is Node => arg !== undefined);
	}

	// process((value) => { ... }) — inline callback as argument
	if (parent && Node.isCallExpression(parent)) {
		const argIndex = parent.getArguments().indexOf(fn);
		if (argIndex === -1) return [];

		const callee = parent.getExpression();
		const calleeDefs = Node.isIdentifier(callee)
			? callee.getDefinitionNodes()
			: [];
		const calleeFn = calleeDefs.at(0);
		if (!calleeFn) return [];

		const calleeParams = Node.isFunctionDeclaration(calleeFn)
			? calleeFn.getParameters()
			: Node.isVariableDeclaration(calleeFn)
				? getParamsFromVarDecl(calleeFn)
				: [];

		const callbackParam = calleeParams[argIndex];
		if (!callbackParam) return [];

		// Find where the callback param is called inside the callee function
		return callbackParam
			.findReferencesAsNodes()
			.map((ref) => ref.getParent())
			.filter(Node.isCallExpression)
			.map((call) => call.getArguments()[paramIndex])
			.filter((arg): arg is Node => arg !== undefined);
	}

	return [];
}

function getParamsFromVarDecl(
	varDecl: VariableDeclaration,
): ParameterDeclaration[] {
	const init = varDecl.getInitializer();
	if (init && (Node.isArrowFunction(init) || Node.isFunctionExpression(init))) {
		return init.getParameters();
	}
	return [];
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
