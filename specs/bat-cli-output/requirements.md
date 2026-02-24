---
spec: bat-cli-output
phase: requirements
created: 2026-02-24
generated: auto
---

# Requirements: bat-cli-output (Hardening)

## Goal

Update HELP text to document new CLI flags and add integration tests for bat-style flag combinations. Implementation is complete and all 183 existing tests pass; this spec adds documentation and test coverage.

## User Stories

### US-1: Update HELP Text

**As a** CLI user
**I want** `--help` to document `--plain`, `--paging`, and `--style` flags
**So that** I can discover and use bat-style features without reading source

**Acceptance Criteria:**
- [ ] AC-1.1: HELP text lists `--plain, -p` with description "Disable all decorations"
- [ ] AC-1.2: HELP text lists `--paging=<mode>` with values `never|always|auto`
- [ ] AC-1.3: HELP text lists `--style=<components>` with values `full|plain|header,numbers,grid`
- [ ] AC-1.4: HELP text includes at least one example using the new flags (e.g., `mdview --plain README.md`)
- [ ] AC-1.5: Integration test for `--help` asserts presence of `--plain`, `--paging`, `--style` in output

### US-2: Integration Tests for Flag Combinations

**As a** developer
**I want** end-to-end tests verifying flag behavior via `bun run src/index.ts`
**So that** regressions in the CLI pipeline are caught

**Acceptance Criteria:**
- [ ] AC-2.1: Test `--plain` produces output without decoration characters (`│`, `─`, `File:`)
- [ ] AC-2.2: Test `--style=numbers` produces output with `│` but no `File:` header
- [ ] AC-2.3: Test `--style=header` produces output with `File:` but no `│` line numbers
- [ ] AC-2.4: Test `--paging=never` with file input exits 0 and writes to stdout
- [ ] AC-2.5: Test `--style=full` produces output with header, numbers, and grid borders
- [ ] AC-2.6: Test invalid `--style=invalid` produces a clear error message

### US-3: Edge Case Verification

**As a** CLI user
**I want** the tool to handle unusual input gracefully
**So that** it does not crash or produce garbled output

**Acceptance Criteria:**
- [ ] AC-3.1: Empty markdown file renders without error (exit 0)
- [ ] AC-3.2: Stdin with decorations enabled works (no filename in header, numbers + grid still render)
- [ ] AC-3.3: `NO_COLOR` env var suppresses decorations
- [ ] AC-3.4: `FORCE_COLOR` env var forces decorations even when piped

## Functional Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FR-1 | Verify baseline test suite passes (183 tests, 0 failures) | High | `bun test` = 0 failures |
| FR-2 | Update HELP constant in index.ts with new flags | High | AC-1.1 through AC-1.4 |
| FR-3 | Add integration tests for `--plain` flag | High | AC-2.1 |
| FR-4 | Add integration tests for `--style` flag variants | High | AC-2.2, AC-2.3, AC-2.5, AC-2.6 |
| FR-5 | Add integration tests for `--paging` flag | Medium | AC-2.4 |
| FR-6 | Add edge case tests for empty files and stdin | Medium | AC-3.1, AC-3.2 |
| FR-7 | Add tests for NO_COLOR / FORCE_COLOR env vars | Medium | AC-3.3, AC-3.4 |

## Non-Functional Requirements

| ID | Requirement | Metric | Target |
|----|-------------|--------|--------|
| NFR-1 | Test suite passes | `bun test` exit code | 0 |
| NFR-2 | No new dependencies | package.json dep count | Unchanged (4 prod) |
| NFR-3 | `--version` speed | Startup time | <50ms (lazy loading preserved) |

## Assumptions

- All 183 existing unit tests pass at HEAD (bc091df); this spec adds new integration and edge case coverage only.
- `--plain` and `--style` are mutually exclusive in practice; `--plain` takes precedence in the pipeline (sets `useDecorations=false`). `--style` is only applied when decorations are active.
- Windows support is out of scope (macOS/Linux only, matching `less` availability).

## Glossary

- **Pager**: External program (default: `less`) that handles scrolling for long output
- **Decorator**: Module that adds file headers, line numbers, and grid borders
- **Style components**: Individual decoration features: `header`, `numbers`, `grid`
- **TTY**: Interactive terminal (as opposed to piped output)

## Out of Scope

- New decoration features (syntax highlighting, git diff markers, snip, rule)
- Windows pager support
- `BAT_PAGER` env var (mdview uses `MDVIEW_PAGER`)
- Performance benchmarking
- Changes to rendering pipeline (marked/marked-terminal)

## Dependencies

- Bun test runner (`bun:test`)
- `less` available on system for pager integration tests
- `examples/test.md` fixture file for CLI integration tests

## Success Criteria

- All existing 183 tests continue to pass
- `--help` output documents all 3 new flags
- At least 6 new integration tests covering flag combinations
- Edge cases (empty file, stdin, NO_COLOR, FORCE_COLOR) covered
- Total test count increases by at least 6 new tests

## Unresolved Questions

- None. Scope is well-defined: update help text, add integration and edge case coverage.

## Next Steps

1. Update HELP constant in `src/index.ts`
2. Add integration tests to `src/index.test.ts` for flag combinations
3. Add edge case tests
4. Run `bun test` to verify 0 failures and new test count
