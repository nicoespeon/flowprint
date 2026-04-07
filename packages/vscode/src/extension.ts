import * as vscode from "vscode";
import * as path from "node:path";
import * as fs from "node:fs";
import { traceDataFlow, getOrigins } from "@flowprint/core";
import type { FlowDirection, FlowGraph, FlowNode } from "@flowprint/core";

let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
	outputChannel = vscode.window.createOutputChannel("Flowprint");
	const treeDataProvider = new FlowTreeDataProvider();

	context.subscriptions.push(
		outputChannel,
		vscode.window.registerTreeDataProvider(
			"flowprint.traceView",
			treeDataProvider,
		),
		vscode.commands.registerCommand("flowprint.traceUpstream", () =>
			trace("upstream", treeDataProvider),
		),
		vscode.commands.registerCommand("flowprint.traceDownstream", () =>
			trace("downstream", treeDataProvider),
		),
		vscode.commands.registerCommand("flowprint.showOrigins", () =>
			showOrigins(treeDataProvider),
		),
	);
}

async function trace(
	direction: FlowDirection,
	treeDataProvider: FlowTreeDataProvider,
) {
	const editor = vscode.window.activeTextEditor;
	if (!editor) return;

	const filePath = editor.document.uri.fsPath;
	const position = editor.selection.start;
	const tsConfigFilePath = findNearestTsConfig(filePath);

	outputChannel.appendLine(
		`Tracing ${direction} from ${filePath}:${position.line + 1}:${position.character}`,
	);
	if (tsConfigFilePath) {
		outputChannel.appendLine(`Using tsconfig: ${tsConfigFilePath}`);
	}

	try {
		const graph = traceDataFlow({
			filePath,
			position: {
				line: position.line + 1,
				column: position.character,
			},
			direction,
			tsConfigFilePath,
		});

		outputChannel.appendLine(
			`Trace complete: ${graph.root.symbolName} (${graph.root.children.length} children)`,
		);

		const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
		treeDataProvider.setGraph(graph, workspaceRoot);
		await vscode.commands.executeCommand(
			"setContext",
			"flowprint.hasTrace",
			true,
		);
		await vscode.commands.executeCommand("flowprint.traceView.focus");
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		outputChannel.appendLine(`Error: ${message}`);
		if (error instanceof Error && error.stack) {
			outputChannel.appendLine(error.stack);
		}
		vscode.window.showErrorMessage(`Flowprint: ${message}`);
	}
}

async function showOrigins(treeDataProvider: FlowTreeDataProvider) {
	const editor = vscode.window.activeTextEditor;
	if (!editor) return;

	const filePath = editor.document.uri.fsPath;
	const position = editor.selection.start;
	const tsConfigFilePath = findNearestTsConfig(filePath);

	try {
		const graph = traceDataFlow({
			filePath,
			position: { line: position.line + 1, column: position.character },
			direction: "upstream",
			tsConfigFilePath,
		});

		const origins = getOrigins(graph);
		if (origins.length === 0) {
			vscode.window.showInformationMessage(
				"Flowprint: no origins found for this symbol.",
			);
			return;
		}

		const originsGraph: FlowGraph = {
			root: { ...graph.root, children: origins },
			direction: "upstream",
		};

		const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
		treeDataProvider.setGraph(originsGraph, workspaceRoot);
		await vscode.commands.executeCommand(
			"setContext",
			"flowprint.hasTrace",
			true,
		);
		await vscode.commands.executeCommand("flowprint.traceView.focus");
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		vscode.window.showErrorMessage(`Flowprint: ${message}`);
	}
}

export function deactivate() {}

function findNearestTsConfig(filePath: string): string | undefined {
	let dir = path.dirname(filePath);
	while (dir !== path.dirname(dir)) {
		const candidate = path.join(dir, "tsconfig.json");
		if (fs.existsSync(candidate)) return candidate;
		dir = path.dirname(dir);
	}
	return undefined;
}

class FlowTreeDataProvider implements vscode.TreeDataProvider<FlowNode> {
	private graph: FlowGraph | undefined;
	private workspaceRoot: string | undefined;
	private onDidChangeTreeDataEmitter = new vscode.EventEmitter<
		FlowNode | undefined
	>();
	readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

	setGraph(graph: FlowGraph, workspaceRoot?: string) {
		this.graph = graph;
		this.workspaceRoot = workspaceRoot;
		this.onDidChangeTreeDataEmitter.fire(undefined);
	}

	getTreeItem(node: FlowNode): vscode.TreeItem {
		const hasChildren = node.children.length > 0;
		const label = node.incomplete ? `${node.symbolName} …` : node.symbolName;
		const item = new vscode.TreeItem(
			label,
			hasChildren
				? vscode.TreeItemCollapsibleState.Expanded
				: vscode.TreeItemCollapsibleState.None,
		);

		if (node.location) {
			const uri = vscode.Uri.file(node.location.filePath);
			const pos = new vscode.Position(
				node.location.line - 1,
				node.location.column,
			);
			item.command = {
				title: "Go to symbol",
				command: "vscode.open",
				arguments: [uri, { selection: new vscode.Range(pos, pos) }],
			};

			const relativePath = this.workspaceRoot
				? path.relative(this.workspaceRoot, node.location.filePath)
				: node.location.filePath;
			item.description = `${relativePath}:${node.location.line}`;
		}

		return item;
	}

	getChildren(node?: FlowNode): FlowNode[] {
		if (!node) {
			return this.graph ? [this.graph.root] : [];
		}
		return node.children;
	}
}
