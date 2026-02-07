# Contributing to mdview

PRs welcome! This project is friendly to first-time contributors.

## Getting Started

```bash
git clone https://github.com/tzachbon/mdview.git
cd mdview
bun install
```

## Development

```bash
bun run src/index.ts README.md   # Run locally
bun test                          # Run tests
bun test --coverage               # Run tests with coverage
bun tsc --noEmit                  # Type check
bun run build                     # Build binary
```

## Submitting Changes

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Make your changes
4. Ensure tests pass (`bun test`)
5. Ensure types check (`bun tsc --noEmit`)
6. Commit your changes
7. Push to your branch
8. Open a PR

## What to Contribute

- Bug fixes
- New Mermaid diagram type support
- Performance improvements
- Documentation improvements
- Test coverage improvements

## Code Style

- TypeScript strict mode
- ES modules (`import`/`export`)
- Tests colocated with source files (`*.test.ts`)

## Reporting Bugs

Use the [bug report template](https://github.com/tzachbon/mdview/issues/new?template=bug_report.md) on GitHub Issues.

## Requesting Features

Use the [feature request template](https://github.com/tzachbon/mdview/issues/new?template=feature_request.md) on GitHub Issues.
