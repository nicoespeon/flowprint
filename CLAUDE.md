# flowprint

Data flow tracing for TypeScript. Trace where a symbol's data comes from and where it goes, across files.

## Commands

```sh
pnpm test              # Vitest watch mode
pnpm test:run          # Single run (use before commit)
pnpm build             # Build all packages
pnpm lint              # ESLint, zero warnings
pnpm format --write    # Prettier
pnpm typecheck         # TypeScript check all packages
```

## Architecture

Monorepo with three packages:

- `packages/core` — Pure data flow engine. Uses ts-morph. No VS Code or CLI dependencies.
- `packages/cli` — CLI entry point. Depends on core. Renders output (text tree, JSON, Mermaid).
- `packages/vscode` — VS Code extension. Depends on core. Tree view panel.

Output renderers are adapters over the core `FlowGraph` type. The core engine knows nothing about rendering.

## Development Workflow

TDD loop:

1. Write failing test(s) that illustrate the missing behavior
2. Stop and ask the human to review and adjust the tests
3. Implement the minimal code to make the tests pass
4. Verify all tests, lint, and typecheck pass. Only commit when green. This commit is the safety net before refactoring.
5. Spawn a fresh subagent to review and refactor the implementation (clean context window, like a code review with no bias from the implementation process). The subagent must not modify tests without asking the human first.

Tests live next to source files (`foo.ts` / `foo.test.ts`).

### Test style for core

Tests describe data flow scenarios using inline TypeScript code strings. Assert against the text tree output, not internal data structures. This tests the full pipeline (trace + render) and makes expected output self-documenting.

Use `[>]` as a cursor marker in code strings to indicate the symbol being traced. Helpers `traceUpstream(code)` and `traceDownstream(code)` extract the cursor position, run the trace, and render the text tree.

Structure tests as given/when/then through whitespace separation (no comment blocks needed):

```ts
it("traces a direct variable assignment", () => {
	const code = `const source = "hello";
const [>]target = source;`;

	const result = traceUpstream(code);

	expect(result).toBe(
		`target
└── source`,
	);
});
```

When tests grow noisy, extract helpers (factories, custom assertions) to keep the signal-to-noise ratio high. The test body should read like a scenario description.

## Conventions

- Named exports only
- `type` over `interface`
- Tabs for indentation (Prettier enforced)
- Exact dependency versions (no `^` or `~`)
- Conventional commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`
