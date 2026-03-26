# Contributing to flowprint

Thanks for your interest in contributing!

## Setup

You need [asdf](https://asdf-vm.com/) to manage tool versions. The required versions are in `.tool-versions`.

```sh
git clone https://github.com/nicoespeon/flowprint.git
cd flowprint
pnpm install
```

## Development

```sh
pnpm test       # Run tests in watch mode
pnpm test:run   # Run tests once
pnpm lint       # Run ESLint
pnpm typecheck  # Run TypeScript type checking
pnpm build      # Build all packages
```

## Workflow

We follow TDD:

1. Write a failing test that describes the expected behavior
2. Implement the minimal code to make it pass
3. Refactor if needed

## Commits

We use [conventional commits](https://www.conventionalcommits.org/):

- `feat:` new feature
- `fix:` bug fix
- `refactor:` code change that neither fixes a bug nor adds a feature
- `test:` adding or updating tests
- `docs:` documentation changes
- `chore:` maintenance tasks

## Code Style

- Prettier formats code on commit (via Husky + lint-staged)
- ESLint enforces linting rules
- TypeScript strict mode is enabled

## Pull Requests

- One concern per PR
- Tests are required
- CI must pass (build, lint, test, typecheck)
