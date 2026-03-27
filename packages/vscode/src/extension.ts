import * as vscode from "vscode";
import * as path from "node:path";
import * as fs from "node:fs";
import { traceDataFlow } from "@flowprint/core";
import type { FlowGraph, FlowNode } from "@flowprint/core";

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
		vscode.commands.registerCommand("flowprint.traceUpstream", async () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) return;

			const filePath = editor.document.uri.fsPath;
			const position = editor.selection.start;
			const tsConfigFilePath = findNearestTsConfig(filePath);

			outputChannel.appendLine(
				`Tracing upstream from ${filePath}:${position.line + 1}:${position.character}`,
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
					direction: "upstream",
					tsConfigFilePath,
				});

				outputChannel.appendLine(
					`Trace complete: ${graph.root.symbolName} (${graph.root.children.length} children)`,
				);

				const workspaceRoot =
					vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
				treeDataProvider.setGraph(graph, workspaceRoot);
				await vscode.commands.executeCommand(
					"setContext",
					"flowprint.hasTrace",
					true,
				);
				await vscode.commands.executeCommand("flowprint.traceView.focus");
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Unknown error";
				outputChannel.appendLine(`Error: ${message}`);
				if (error instanceof Error && error.stack) {
					outputChannel.appendLine(error.stack);
				}
				vscode.window.showErrorMessage(`Flowprint: ${message}`);
			}
		}),
	);
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
		const item = new vscode.TreeItem(
			node.symbolName,
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
