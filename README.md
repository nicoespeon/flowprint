# flowprint

Trace data flow across TypeScript codebases. See where a variable's data comes from and where it goes.

VS Code's built-in Call Hierarchy works for function calls, but not for data. **flowprint** fills that gap: right-click a variable and see the full chain of assignments, parameters, and property accesses that connect it to the rest of your codebase.

## Install

```sh
npm install -g flowprint
```

Or run without installing:

```sh
npx flowprint trace src/handler.ts:5:12 --direction upstream
```

## Usage

```sh
# Trace where the data comes from (upstream)
flowprint trace src/handler.ts:5:12 --direction upstream

# Trace where the data flows to (downstream)
flowprint trace src/handler.ts:5:12 --direction downstream

# Output as JSON
flowprint trace src/handler.ts:5:12 --format json

# Output as Mermaid diagram
flowprint trace src/handler.ts:5:12 --format mermaid
```

## VS Code Extension

Install the `flowprint` extension from the VS Code Marketplace. Right-click any symbol and select "Trace Data Flow" to see the flow in a tree view panel.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions and development workflow.

## License

[MIT](LICENSE)
