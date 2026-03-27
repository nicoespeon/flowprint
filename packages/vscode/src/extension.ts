import * as vscode from "vscode";
import { traceDataFlow } from "@flowprint/core";
import type { FlowNode } from "@flowprint/core";

export function activate(context: vscode.ExtensionContext) {
	const treeDataProvider = new FlowTreeDataProvider();

	context.subscriptions.push(
		vscode.window.registerTreeDataProvider(
			"flowprint.traceView",
			treeDataProvider,
		),
		vscode.commands.registerCommand("flowprint.traceUpstream", () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) return;

			const filePath = editor.document.uri.fsPath;
			const position = editor.selection.active;

			try {
				const graph = traceDataFlow({
					filePath,
					position: {
						line: position.line + 1,
						column: position.character,
					},
					direction: "upstream",
				});

				treeDataProvider.setGraph(graph);
				vscode.commands.executeCommand(
					"setContext",
					"flowprint.hasTrace",
					true,
				);
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Unknown error";
				vscode.window.showErrorMessage(`Flowprint: ${message}`);
			}
		}),
	);
}

export function deactivate() {}

class FlowTreeDataProvider implements vscode.TreeDataProvider<FlowNode> {
	private graph: FlowGraph | undefined;
	private onDidChangeTreeDataEmitter = new vscode.EventEmitter<
		FlowNode | undefined
	>();
	readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

	setGraph(graph: FlowGraph) {
		this.graph = graph;
		this.onDidChangeTreeDataEmitter.fire(undefined);
	}

	getTreeItem(node: FlowNode): vscode.TreeItem {
		const hasChildren = node.children.length > 0;
		const item = new vscode.TreeItem(
			this.formatLabel(node),
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
			item.description = `${node.location.filePath}:${node.location.line}`;
		}

		return item;
	}

	getChildren(node?: FlowNode): FlowNode[] {
		if (!node) {
			return this.graph ? [this.graph.root] : [];
		}
		return node.children;
	}

	private formatLabel(node: FlowNode): string {
		return node.symbolName;
	}
}
