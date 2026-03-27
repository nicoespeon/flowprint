# flowprint

Trace data flow across TypeScript codebases. See where a variable's data comes from.

VS Code's built-in Call Hierarchy works for function calls, but not for data. **flowprint** fills that gap: right-click a variable and see the full chain of assignments, parameters, and property accesses that connect it to the rest of your codebase.

## Usage

1. Open a TypeScript file
2. Right-click on a variable, parameter, or property access
3. Select **"Flowprint: Trace Data Flow (Upstream)"**
4. The **Data Flow** panel appears in the Explorer sidebar
5. Click any node to navigate to its source location

## What it traces

- Variable assignments (`const x = y`)
- Chained assignments (`a = b = c`)
- Function parameters to call-site arguments (declarations, arrow functions, callbacks)
- Property access (`obj.name`)
- Method call receivers (`items.filter(...)` traces to `items`)
- Destructuring (`const { name } = obj`)
- Cross-file imports

## CLI

flowprint is also available as a CLI, useful for scripting or giving to your AI agent:

```sh
npx flowprint trace src/handler.ts:5:12
```

See the [CLI package on npm](https://www.npmjs.com/package/flowprint) for full usage.

## Not yet implemented

- Downstream tracing (where does data flow _to_)
- Re-exports (`export { x } from "./y"`)

## Links

- [GitHub](https://github.com/nicoespeon/flowprint)
- [CLI package](https://www.npmjs.com/package/flowprint)
- [Issues](https://github.com/nicoespeon/flowprint/issues)
