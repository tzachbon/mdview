---
spec: mdview
phase: tasks
total_tasks: 18
created: 2026-02-01
generated: auto
---

# Tasks: mdview

## Phase 1: Make It Work (POC)

Focus: Validate marked-terminal + beautiful-mermaid work together end-to-end.

- [x] 1.1 Initialize project with Bun
  - **Do**: Create package.json with dependencies, tsconfig.json with strict mode
  - **Files**: `/Users/zachbonfil/projects/private/mdview/package.json`, `/Users/zachbonfil/projects/private/mdview/tsconfig.json`
  - **Done when**: `bun install` succeeds, TypeScript compiles
  - **Verify**: `bun install && bun tsc --noEmit`
  - **Commit**: `chore: initialize bun project with dependencies`
  - _Requirements: FR-1, FR-3_

- [x] 1.2 Create basic mermaid renderer
  - **Do**: Create src/mermaid.ts with renderMermaid function using beautiful-mermaid, include error fallback
  - **Files**: `/Users/zachbonfil/projects/private/mdview/src/mermaid.ts`
  - **Done when**: Function exports, handles both valid and invalid mermaid
  - **Verify**: `bun tsc --noEmit`
  - **Commit**: `feat(mermaid): add mermaid to ASCII renderer`
  - _Requirements: FR-3, FR-4_
  - _Design: src/mermaid.ts_

- [x] 1.3 Create markdown renderer with mermaid detection
  - **Do**: Create src/renderer.ts with render function, detect mermaid blocks via regex, integrate marked-terminal
  - **Files**: `/Users/zachbonfil/projects/private/mdview/src/renderer.ts`
  - **Done when**: render() accepts markdown string, returns styled output, mermaid blocks converted
  - **Verify**: `bun tsc --noEmit`
  - **Commit**: `feat(renderer): add markdown renderer with mermaid support`
  - _Requirements: FR-1, FR-2, FR-11_
  - _Design: src/renderer.ts_

- [x] 1.4 Create CLI entry point
  - **Do**: Create src/index.ts with arg parsing, file reading, stdin support, help/version
  - **Files**: `/Users/zachbonfil/projects/private/mdview/src/index.ts`
  - **Done when**: CLI handles file, stdin, --help, --version, errors
  - **Verify**: `bun run src/index.ts --help`
  - **Commit**: `feat(cli): add CLI entry point with arg parsing`
  - _Requirements: FR-5, FR-6, FR-7, FR-8, FR-9, FR-10_
  - _Design: src/index.ts_

- [x] 1.5 Create test markdown file
  - **Do**: Create examples/test.md with headers, bold, italic, code blocks, table, mermaid diagram
  - **Files**: `/Users/zachbonfil/projects/private/mdview/examples/test.md`
  - **Done when**: File contains all markdown elements from PROMPT.md
  - **Verify**: `cat examples/test.md`
  - **Commit**: `docs: add test markdown file`

- [x] 1.6 POC Checkpoint - Validate end-to-end
  - **Do**: Run mdview on test file, verify all elements render correctly
  - **Done when**: Headers styled, code highlighted, mermaid shows as ASCII, tables formatted
  - **Verify**: `bun run src/index.ts examples/test.md`
  - **Commit**: `feat: complete POC - markdown + mermaid rendering works`

## Phase 2: Refactoring

- [x] 2.1 Add proper TypeScript types
  - **Do**: Add explicit interfaces for RenderOptions, MermaidResult, ensure strict type checking
  - **Files**: `/Users/zachbonfil/projects/private/mdview/src/renderer.ts`, `/Users/zachbonfil/projects/private/mdview/src/mermaid.ts`
  - **Done when**: No any types, all functions have typed params/returns
  - **Verify**: `bun tsc --noEmit --strict`
  - **Commit**: `refactor: add strict TypeScript types`
  - _Design: Interfaces_

- [x] 2.2 Extract CLI argument parsing
  - **Do**: Create parseArgs function with clear return type, handle all flag combinations
  - **Files**: `/Users/zachbonfil/projects/private/mdview/src/index.ts`
  - **Done when**: Arg parsing is testable pure function
  - **Verify**: `bun tsc --noEmit`
  - **Commit**: `refactor(cli): extract argument parsing function`

- [x] 2.3 Improve error handling
  - **Do**: Add specific error types, consistent error messages, proper exit codes
  - **Files**: `/Users/zachbonfil/projects/private/mdview/src/index.ts`
  - **Done when**: All error paths have clear messages and exit 1
  - **Verify**: `bun run src/index.ts nonexistent.md; echo $?` (should be 1)
  - **Commit**: `refactor(cli): improve error handling`
  - _Design: Error Handling_

## Phase 3: Testing

- [ ] 3.1 Add mermaid unit tests
  - **Do**: Create src/mermaid.test.ts testing valid mermaid, invalid mermaid, edge cases
  - **Files**: `/Users/zachbonfil/projects/private/mdview/src/mermaid.test.ts`
  - **Done when**: Tests cover success path, error path, empty input
  - **Verify**: `bun test src/mermaid.test.ts`
  - **Commit**: `test(mermaid): add unit tests`
  - _Requirements: AC-2.2, AC-2.3_

- [ ] 3.2 Add renderer unit tests
  - **Do**: Create src/renderer.test.ts testing markdown rendering, mermaid detection, width option
  - **Files**: `/Users/zachbonfil/projects/private/mdview/src/renderer.test.ts`
  - **Done when**: Tests cover plain markdown, mermaid blocks, mixed content
  - **Verify**: `bun test src/renderer.test.ts`
  - **Commit**: `test(renderer): add unit tests`
  - _Requirements: AC-1.1, AC-2.1_

- [ ] 3.3 Add CLI integration tests
  - **Do**: Create src/index.test.ts testing file reading, stdin, help, version, errors
  - **Files**: `/Users/zachbonfil/projects/private/mdview/src/index.test.ts`
  - **Done when**: Tests cover all CLI argument combinations
  - **Verify**: `bun test src/index.test.ts`
  - **Commit**: `test(cli): add integration tests`
  - _Requirements: AC-3.1, AC-4.1, AC-4.3, AC-5.1_

- [ ] 3.4 Verify test coverage
  - **Do**: Run all tests, ensure coverage meets NFR-3 (>80%)
  - **Verify**: `bun test --coverage`
  - **Done when**: All tests pass, coverage >80%
  - **Commit**: `test: achieve >80% coverage` (if fixes needed)
  - _Requirements: NFR-3_

## Phase 4: Quality Gates

- [ ] 4.1 Add build script for binary
  - **Do**: Add build script to package.json, verify binary works
  - **Files**: `/Users/zachbonfil/projects/private/mdview/package.json`
  - **Done when**: `bun run build` creates working mdview binary
  - **Verify**: `bun run build && ./mdview examples/test.md`
  - **Commit**: `build: add compile script for standalone binary`
  - _Requirements: FR-12_

- [ ] 4.2 Verify performance target
  - **Do**: Time binary startup, ensure <50ms
  - **Verify**: `time ./mdview --version`
  - **Done when**: Startup time <50ms
  - **Commit**: (no commit needed, verification only)
  - _Requirements: NFR-1_

- [ ] 4.3 Run full quality check
  - **Do**: Run type check, tests, verify no errors
  - **Verify**: `bun tsc --noEmit && bun test`
  - **Done when**: All checks pass
  - **Commit**: `fix: address any remaining issues` (if needed)

- [ ] 4.4 Create PR and verify CI
  - **Do**: Push branch, create PR with gh CLI, verify all checks pass
  - **Verify**: `gh pr create && gh pr checks --watch`
  - **Done when**: PR created, ready for review
  - **Commit**: (no commit, PR creation)

## Notes

- **POC shortcuts taken**: Minimal error messages, basic types
- **Production TODOs**: Better error messages in Phase 2.3, full types in 2.1
- **Testing strategy**: Unit tests for mermaid/renderer, integration tests for CLI
- **beautiful-mermaid risk**: If it doesn't work as expected, may need alternative or manual ASCII rendering
