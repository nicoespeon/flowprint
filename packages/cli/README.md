<p align="center">
  <img src="https://raw.githubusercontent.com/nicoespeon/flowprint/main/assets/icon.png" alt="flowprint" width="128" />
</p>

# flowprint

Trace data flow across TypeScript codebases. See where a variable's data comes from.

VS Code's built-in Call Hierarchy works for function calls, but not for data. **flowprint** fills that gap: point at a variable and see the full chain of assignments, parameters, and property accesses that connect it to the rest of your codebase.

## Example

Given this code:

```ts
// service.ts
export function process(data: { toto: string }) {
	const value = data.toto;
	console.log(value);
}

// handler.ts
import { process } from "./service";
const input = { toto: "hello" };
process(input);
```

Running `flowprint trace service.ts:3:8` on `value`:

```
value (service.ts:3:7)
└── data.toto (service.ts:3:14)
    └── input.toto (handler.ts:3:6)
```

The trace follows `value` upstream through `data.toto` (property access on a parameter), across the file boundary to `input.toto` (the argument at the call site in handler.ts). Each node shows its file and position so you can jump straight to the code.

## Install

```sh
npm install -g flowprint
```

Or run without installing:

```sh
npx flowprint trace src/handler.ts:5:12
```

## Usage

```sh
flowprint trace <file>:<line>:<col> [options]
```

`<file>:<line>:<col>` is the symbol to trace. Line and column are 1-based (matching your editor's status bar).

### Options

| Flag                | Description                                        | Default     |
| ------------------- | -------------------------------------------------- | ----------- |
| `--direction <dir>` | `upstream` (where from) or `downstream` (where to) | `upstream`  |
| `--format <format>` | Output format: `text`, `json`, `mermaid`           | `text`      |
| `--origins`         | Show only the data entry points (leaf nodes)       | off         |
| `--compact`         | Hide file paths and positions in output            | off         |
| `--tsconfig <path>` | Path to tsconfig.json                              | auto-detect |

### What it traces

**Upstream** (where does data come from):

- Variable assignments (`const x = y`)
- Chained assignments (`a = b = c`)
- Function parameters to call-site arguments (declarations, arrow functions, callbacks)
- Property access (`obj.name`)
- Method call receivers (`items.filter(...)` traces to `items`)
- Destructuring (`const { name } = obj`)
- Cross-file imports and re-exports (`export { x } from "./y"`, `export * from "./y"`)

**Downstream** (where does data go):

- Variable assignments (`const target = source` traces `source` to `target`)
- Function call arguments into parameters (`fn(data)` traces `data` into `fn`'s parameter)

## VS Code Extension

Prefer a visual interface? Install the [flowprint VS Code extension](https://marketplace.visualstudio.com/items?itemName=nicoespeon.flowprint-vscode) — right-click any symbol and trace its data flow in a tree view.

## Contributing

See the [contributing guide](https://github.com/nicoespeon/flowprint/blob/main/CONTRIBUTING.md).

## License

[MIT](https://github.com/nicoespeon/flowprint/blob/main/LICENSE)
