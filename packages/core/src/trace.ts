import {
	Project,
	Node,
	SyntaxKind,
	type BindingElement,
	type CallExpression,
	type ParameterDeclaration,
	type PropertyAccessExpression,
	type ReferenceFindableNode,
	type SourceFile,
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
	incomplete?: boolean;
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

	const node = findNodeAtPos(sourceFile, pos);
	if (!node) {
		throw new Error(
			`No traceable symbol at ${options.position.line}:${options.position.column}`,
		);
	}

	const root =
		options.direction === "upstream"
			? traceUpstreamNode(node, new Set())
			: traceDownstreamNode(node, new Set());
	return { root, direction: options.direction };
}

function findNodeAtPos(sourceFile: SourceFile, pos: number) {
	const node = sourceFile.getDescendantAtPos(pos);
	if (node && Node.isIdentifier(node)) return node;

	if (pos > 0) {
		const prevNode = sourceFile.getDescendantAtPos(pos - 1);
		if (prevNode && Node.isIdentifier(prevNode)) return prevNode;
	}

	return node;
}

function nodeKey(node: Node): string {
	return `${node.getSourceFile().getFilePath()}:${node.getStart()}`;
}

function traceUpstreamNode(node: Node, visited: Set<string>): FlowNode {
	if (Node.isIdentifier(node)) {
		const bindingElement = node.getFirstAncestorByKind(
			SyntaxKind.BindingElement,
		);
		if (bindingElement) return traceBindingElement(bindingElement, visited);

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

	if (Node.isBindingElement(node)) {
		return traceBindingElement(node, visited);
	}

	if (Node.isVariableDeclaration(node)) {
		return traceVariableDeclaration(node, visited);
	}

	if (Node.isParameterDeclaration(node)) {
		return traceParameter(node, visited);
	}

	if (Node.isConditionalExpression(node)) {
		const whenTrue = traceUpstreamNode(node.getWhenTrue(), visited);
		const whenFalse = traceUpstreamNode(node.getWhenFalse(), visited);
		return {
			symbolName: node.getText(),
			kind: "reference",
			children: [whenTrue, whenFalse],
			location: locationOf(node),
		};
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
			Node.isCallExpression(initializer) ||
			Node.isConditionalExpression(initializer));

	const children = isTraceableInitializer
		? [traceUpstreamNode(initializer, visited)]
		: [];

	const incomplete =
		!isTraceableInitializer &&
		initializer !== undefined &&
		containsVariableReferences(initializer);

	return {
		symbolName: name,
		kind: "assignment",
		children,
		location,
		...(incomplete && { incomplete }),
	};
}

function traceBindingElement(
	element: BindingElement,
	visited: Set<string>,
): FlowNode {
	const name = element.getName();
	const location = locationOf(element.getNameNode());

	const initializer = element
		.getFirstAncestorByKind(SyntaxKind.VariableDeclaration)
		?.getInitializer();
	if (initializer) {
		return {
			symbolName: name,
			kind: "destructuring",
			children: [traceUpstreamNode(initializer, visited)],
			location,
		};
	}

	const param = element.getFirstAncestorByKind(SyntaxKind.Parameter);
	if (param) {
		const callSiteArgs = findCallSiteArgs(param);
		const children = callSiteArgs.map((arg) => traceUpstreamNode(arg, visited));
		return { symbolName: name, kind: "destructuring", children, location };
	}

	return { symbolName: name, kind: "destructuring", children: [], location };
}

function traceCallExpression(
	call: CallExpression,
	visited: Set<string>,
): FlowNode {
	const callee = call.getExpression();

	if (Node.isPropertyAccessExpression(callee)) {
		return traceUpstreamNode(callee.getExpression(), visited);
	}

	if (Node.isIdentifier(callee)) {
		const returnValues = resolveReturnValues(callee);
		if (returnValues.length > 0) {
			const children = returnValues.map((rv) => traceUpstreamNode(rv, visited));
			return {
				symbolName: call.getText(),
				kind: "return",
				children,
				location: locationOf(call),
			};
		}
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

	const rawChildren = tracePropertyUpstream(
		expr.getExpression(),
		propertyName,
		visited,
	);

	const redundantWrapper =
		rawChildren.length === 1 && rawChildren[0]?.symbolName === fullName
			? rawChildren[0]
			: undefined;

	if (redundantWrapper) {
		return {
			symbolName: fullName,
			kind: "property-access",
			children: redundantWrapper.children,
			location,
			...(redundantWrapper.incomplete && {
				incomplete: redundantWrapper.incomplete,
			}),
		};
	}

	return {
		symbolName: fullName,
		kind: "property-access",
		children: rawChildren,
		location,
	};
}

function tracePropertyUpstream(
	object: Node,
	propertyName: string,
	visited: Set<string>,
): FlowNode[] {
	if (Node.isIdentifier(object)) {
		const definition = object.getDefinitionNodes().at(0);
		if (definition)
			return tracePropertyUpstream(definition, propertyName, visited);
		return [];
	}

	if (Node.isVariableDeclaration(object))
		return tracePropertyInVarDecl(object, propertyName, visited);

	if (Node.isParameterDeclaration(object)) {
		const key = nodeKey(object);
		if (visited.has(key)) return [];
		visited.add(key);
		return findCallSiteArgs(object).flatMap((arg) =>
			tracePropertyUpstream(arg, propertyName, visited),
		);
	}

	return [];
}

function tracePropertyInVarDecl(
	varDecl: VariableDeclaration,
	propertyName: string,
	visited: Set<string>,
): FlowNode[] {
	const key = nodeKey(varDecl);
	const name = varDecl.getName();
	const location = locationOf(varDecl.getNameNode());
	const symbolName = name + "." + propertyName;

	if (visited.has(key))
		return [{ symbolName, kind: "property-access", children: [], location }];
	visited.add(key);

	const initializer = varDecl.getInitializer();
	const propValue =
		initializer && Node.isObjectLiteralExpression(initializer)
			? getObjectPropertyValue(initializer, propertyName)
			: undefined;

	if (propValue) {
		const isTraceable =
			Node.isIdentifier(propValue) ||
			Node.isPropertyAccessExpression(propValue) ||
			Node.isCallExpression(propValue);

		const children = isTraceable ? [traceUpstreamNode(propValue, visited)] : [];
		const incomplete = !isTraceable && containsVariableReferences(propValue);

		return [
			{
				symbolName,
				kind: "property-access",
				children,
				location,
				...(incomplete && { incomplete }),
			},
		];
	}

	const incomplete =
		initializer !== undefined && containsVariableReferences(initializer);
	return [
		{
			symbolName,
			kind: "property-access",
			children: [],
			location,
			...(incomplete && { incomplete }),
		},
	];
}

function resolveReturnValues(callee: Node): Node[] {
	const definition = Node.isIdentifier(callee)
		? callee.getDefinitionNodes().at(0)
		: undefined;
	if (!definition) return [];

	const body = Node.isFunctionDeclaration(definition)
		? definition.getBody()
		: Node.isVariableDeclaration(definition)
			? (() => {
					const init = definition.getInitializer();
					if (
						init &&
						(Node.isArrowFunction(init) || Node.isFunctionExpression(init))
					)
						return init.getBody();
					return undefined;
				})()
			: undefined;
	if (!body) return [];

	return body
		.getDescendantsOfKind(SyntaxKind.ReturnStatement)
		.filter((ret) => ret.getExpression() !== undefined)
		.map((ret) => ret.getExpression() as Node);
}

function getObjectPropertyValue(
	objLiteral: Node,
	propertyName: string,
): Node | undefined {
	if (!Node.isObjectLiteralExpression(objLiteral)) return undefined;
	for (const prop of objLiteral.getProperties()) {
		if (Node.isPropertyAssignment(prop) && prop.getName() === propertyName) {
			return prop.getInitializer();
		}
		if (
			Node.isShorthandPropertyAssignment(prop) &&
			prop.getName() === propertyName
		) {
			return prop.getNameNode();
		}
	}
	return undefined;
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
	const referenceNode = findReferenceNode(fn);
	if (!referenceNode) return [];

	return argsAtIndex(referenceNode, paramIndex);
}

function findReferenceNode(fn: Node): ReferenceFindableNode | undefined {
	if (Node.isFunctionDeclaration(fn)) return fn;

	const parent = fn.getParent();
	if (!parent) return undefined;

	// const greet = (name) => { ... }; greet(user);
	if (Node.isVariableDeclaration(parent)) {
		const nameNode = parent.getNameNode();
		return Node.isIdentifier(nameNode) ? nameNode : undefined;
	}

	// process((value) => { ... }) — inline callback
	if (Node.isCallExpression(parent)) {
		return findCallbackReferenceNode(parent, fn);
	}

	return undefined;
}

function findCallbackReferenceNode(
	callExpr: CallExpression,
	callbackFn: Node,
): ReferenceFindableNode | undefined {
	const argIndex = callExpr.getArguments().indexOf(callbackFn);
	if (argIndex === -1) return undefined;

	const callee = callExpr.getExpression();
	if (!Node.isIdentifier(callee)) return undefined;

	const calleeDef = callee.getDefinitionNodes().at(0);
	if (!calleeDef) return undefined;

	const calleeParams = getCalleeParams(calleeDef);
	return calleeParams[argIndex];
}

function getCalleeParams(calleeDef: Node): ParameterDeclaration[] {
	if (Node.isFunctionDeclaration(calleeDef)) return calleeDef.getParameters();
	if (Node.isVariableDeclaration(calleeDef))
		return getParamsFromVarDecl(calleeDef);
	return [];
}

function argsAtIndex(
	referenceNode: ReferenceFindableNode,
	paramIndex: number,
): Node[] {
	return referenceNode
		.findReferencesAsNodes()
		.map((ref) => ref.getParent())
		.filter(Node.isCallExpression)
		.map((call) => call.getArguments()[paramIndex])
		.filter((arg): arg is Node => arg !== undefined);
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

function traceDownstreamNode(node: Node, visited: Set<string>): FlowNode {
	if (Node.isIdentifier(node)) {
		const varDecl = node.getFirstAncestorByKind(SyntaxKind.VariableDeclaration);
		if (varDecl) return traceDownstreamDeclaration(varDecl, visited);

		const param = node.getFirstAncestorByKind(SyntaxKind.Parameter);
		if (param) return traceDownstreamDeclaration(param, visited);
	}

	if (Node.isVariableDeclaration(node))
		return traceDownstreamDeclaration(node, visited);
	if (Node.isParameterDeclaration(node))
		return traceDownstreamDeclaration(node, visited);

	return {
		symbolName: node.getText(),
		kind: "reference",
		children: [],
		location: locationOf(node),
	};
}

function traceDownstreamDeclaration(
	decl: VariableDeclaration | ParameterDeclaration,
	visited: Set<string>,
): FlowNode {
	const key = nodeKey(decl);
	const name = decl.getName();
	const kind: FlowNodeKind = Node.isParameterDeclaration(decl)
		? "parameter"
		: "assignment";
	const location = locationOf(decl.getNameNode());

	if (visited.has(key))
		return { symbolName: name, kind, children: [], location };
	visited.add(key);

	const nameNode = decl.getNameNode();
	const children = Node.isIdentifier(nameNode)
		? downstreamConsumersOf(nameNode, visited)
		: [];
	return { symbolName: name, kind, children, location };
}

function downstreamConsumersOf(
	nameNode: ReferenceFindableNode & Node,
	visited: Set<string>,
): FlowNode[] {
	const declStart = nameNode.getStart();
	const declFile = nameNode.getSourceFile();

	return nameNode
		.findReferencesAsNodes()
		.filter(
			(ref) => ref.getStart() !== declStart || ref.getSourceFile() !== declFile,
		)
		.map((ref) => resolveDownstreamConsumer(ref, visited))
		.filter((node): node is FlowNode => node !== undefined);
}

function resolveDownstreamConsumer(
	ref: Node,
	visited: Set<string>,
): FlowNode | undefined {
	const parent = ref.getParent();
	if (!parent) return undefined;

	if (Node.isVariableDeclaration(parent) && parent.getInitializer() === ref) {
		return traceDownstreamDeclaration(parent, visited);
	}

	if (Node.isPropertyAccessExpression(parent)) {
		return resolveDownstreamConsumer(parent, visited);
	}

	if (Node.isCallExpression(parent)) {
		const argIndex = parent.getArguments().indexOf(ref);
		if (argIndex === -1) {
			return resolveDownstreamConsumer(parent, visited);
		}
		const param = resolveCalleeParam(parent, argIndex);
		if (param) return traceDownstreamDeclaration(param, visited);
	}

	return undefined;
}

function resolveCalleeParam(
	call: CallExpression,
	argIndex: number,
): ParameterDeclaration | undefined {
	const callee = call.getExpression();
	if (!Node.isIdentifier(callee)) return undefined;

	const definition = callee.getDefinitionNodes().at(0);
	if (!definition) return undefined;

	return getCalleeParams(definition)[argIndex];
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

function isPropertyName(id: Node) {
	const parent = id.getParent();
	if (!parent) return false;

	return (
		(Node.isPropertyAssignment(parent) ||
			Node.isPropertyAccessExpression(parent)) &&
		parent.getNameNode() === id
	);
}

function containsVariableReferences(node: Node) {
	return node
		.getDescendantsOfKind(SyntaxKind.Identifier)
		.some((id) => !isPropertyName(id));
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
