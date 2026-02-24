---
spec: bat-cli-output
phase: tasks
created: 2026-02-24
generated: auto
---

# Tasks: bat-cli-output (Hardening)

All 214 existing tests pass at HEAD. HELP text is already complete. Remaining work: add integration tests for help flag docs, bat-style flag combinations, and edge cases to `src/index.test.ts`.

**Baseline**: 214 tests, 0 failures, 366 expect() calls across 5 files.

## Phase 1: Make It Work (POC)

Focus: Prove the integration test pattern works with one representative test before writing the full suite.

- [x] 1.1 Verify baseline: all 214 existing tests pass
  - **Do**:
    1. Run `bun test` from project root
    2. Confirm 214 pass, 0 fail
  - **Files**: (none modified)
  - **Done when**: `bun test` exits 0 with 214 pass, 0 fail
  - **Verify**: `cd /Users/zachbonfil/projects/private/mdview && bun test 2>&1 | grep -E '^\s+[0-9]+ pass'`
  - **Commit**: none
  - _Requirements: FR-1_

- [x] 1.2 POC: add one integration test for --plain flag
  - **Do**:
    1. Append a new `describe("bat-style flags")` block inside `describe("CLI integration")` in `src/index.test.ts`
    2. Add test: `--plain produces output without decorations`
    3. Spawn CLI with `["bun", "run", CLI_PATH, "--plain", "examples/test.md"]` and `env: { ...process.env, FORCE_COLOR: "1" }`
    4. Assert: exit 0, stdout contains "Test Document", stdout does NOT contain "│", does NOT contain "File:"
  - **Files**: `src/index.test.ts`
  - **Done when**: `bun test` shows 215 pass, 0 fail; new test verifies --plain suppresses decorations
  - **Verify**: `cd /Users/zachbonfil/projects/private/mdview && bun test --filter "bat-style" 2>&1 | grep -E 'pass|fail'`
  - **Commit**: `test(cli): add POC integration test for --plain flag`
  - _Requirements: AC-2.1_
  - _Design: Flag combination integration section_

- [x] 1.3 [VERIFY] Quality checkpoint: typecheck + test
  - **Do**: Run typecheck and full test suite
  - **Verify**: `cd /Users/zachbonfil/projects/private/mdview && bun tsc --noEmit && bun test 2>&1 | grep -E '^\s+[0-9]+ pass'`
  - **Done when**: 0 type errors, 215+ tests pass, 0 fail
  - **Commit**: `chore(cli): pass quality checkpoint` (only if fixes needed)

## Phase 2: Help Text Integration Tests

- [x] 2.1 Add --help documents --plain flag test
  - **Do**:
    1. Inside `describe("help output")` in `src/index.test.ts`, add test: `--help documents --plain flag`
    2. Spawn CLI with `--help`, capture stdout
    3. Assert: stdout contains `--plain`
  - **Files**: `src/index.test.ts`
  - **Done when**: Test passes, asserting --plain appears in help output
  - **Verify**: `cd /Users/zachbonfil/projects/private/mdview && bun test --filter "help" 2>&1 | grep -E 'pass|fail'`
  - **Commit**: `test(cli): add help text assertion for --plain flag`
  - _Requirements: AC-1.5_
  - _Design: Help text flag documentation section_

- [x] 2.2 Add --help documents --paging and --style flag tests
  - **Do**:
    1. Inside `describe("help output")`, add test: `--help documents --paging flag` -- assert stdout contains `--paging`
    2. Add test: `--help documents --style flag` -- assert stdout contains `--style`
  - **Files**: `src/index.test.ts`
  - **Done when**: Both tests pass, asserting --paging and --style appear in help output
  - **Verify**: `cd /Users/zachbonfil/projects/private/mdview && bun test --filter "help" 2>&1 | grep -E 'pass|fail'`
  - **Commit**: `test(cli): add help text assertions for --paging and --style flags`
  - _Requirements: AC-1.5_
  - _Design: Help text flag documentation section_

## Phase 3: Bat-Style Flag Integration Tests

- [x] 3.1 Add --style=numbers integration test
  - **Do**:
    1. Inside `describe("bat-style flags")` (created in 1.2), add test: `--style=numbers produces line numbers without header`
    2. Spawn CLI with `["bun", "run", CLI_PATH, "--style=numbers", "examples/test.md"]` and `FORCE_COLOR=1`
    3. Assert: stdout contains `│`, stdout does NOT contain `File:`
  - **Files**: `src/index.test.ts`
  - **Done when**: Test passes, confirming --style=numbers shows numbers but not header
  - **Verify**: `cd /Users/zachbonfil/projects/private/mdview && bun test --filter "bat-style" 2>&1 | grep -E 'pass|fail'`
  - **Commit**: `test(cli): add integration test for --style=numbers`
  - _Requirements: AC-2.2_
  - _Design: Flag combination integration section_

- [x] 3.2 Add --style=header integration test
  - **Do**:
    1. Add test: `--style=header produces header without line numbers`
    2. Spawn CLI with `--style=header` and `FORCE_COLOR=1` on `examples/test.md`
    3. Assert: stdout contains `File:`, content lines do NOT start with digit+`│` pattern
  - **Files**: `src/index.test.ts`
  - **Done when**: Test passes, confirming --style=header shows header but not numbers
  - **Verify**: `cd /Users/zachbonfil/projects/private/mdview && bun test --filter "bat-style" 2>&1 | grep -E 'pass|fail'`
  - **Commit**: `test(cli): add integration test for --style=header`
  - _Requirements: AC-2.3_
  - _Design: Flag combination integration section_

- [x] 3.3 [VERIFY] Quality checkpoint: typecheck + test
  - **Do**: Run typecheck and full test suite
  - **Verify**: `cd /Users/zachbonfil/projects/private/mdview && bun tsc --noEmit && bun test 2>&1 | grep -E '^\s+[0-9]+ pass'`
  - **Done when**: 0 type errors, 219+ tests pass, 0 fail
  - **Commit**: `chore(cli): pass quality checkpoint` (only if fixes needed)

- [x] 3.4 Add --style=full integration test
  - **Do**:
    1. Add test: `--style=full produces header, numbers, and grid`
    2. Spawn CLI with `--style=full` and `FORCE_COLOR=1` on `examples/test.md`
    3. Assert: stdout contains `File:`, `│`, and `─`
  - **Files**: `src/index.test.ts`
  - **Done when**: Test passes, confirming --style=full shows all decoration components
  - **Verify**: `cd /Users/zachbonfil/projects/private/mdview && bun test --filter "bat-style" 2>&1 | grep -E 'pass|fail'`
  - **Commit**: `test(cli): add integration test for --style=full`
  - _Requirements: AC-2.5_
  - _Design: Flag combination integration section_

- [x] 3.5 Add --paging=never integration test
  - **Do**:
    1. Add test: `--paging=never writes to stdout and exits 0`
    2. Spawn CLI with `--paging=never` on `examples/test.md`
    3. Assert: exit 0, stdout contains `Test Document`
  - **Files**: `src/index.test.ts`
  - **Done when**: Test passes, confirming --paging=never outputs to stdout directly
  - **Verify**: `cd /Users/zachbonfil/projects/private/mdview && bun test --filter "bat-style" 2>&1 | grep -E 'pass|fail'`
  - **Commit**: `test(cli): add integration test for --paging=never`
  - _Requirements: AC-2.4_
  - _Design: Flag combination integration section_

- [x] 3.6 Add --style=invalid error integration test
  - **Do**:
    1. Add test: `--style=invalid produces error`
    2. Spawn CLI with `--style=invalid` on `examples/test.md`
    3. Assert: exit code is non-zero (1), stderr contains `unknown style`
  - **Files**: `src/index.test.ts`
  - **Done when**: Test passes, confirming invalid style values produce error
  - **Verify**: `cd /Users/zachbonfil/projects/private/mdview && bun test --filter "bat-style" 2>&1 | grep -E 'pass|fail'`
  - **Commit**: `test(cli): add integration test for --style=invalid error`
  - _Requirements: AC-2.6_
  - _Design: Flag combination integration section_

- [x] 3.7 [VERIFY] Quality checkpoint: typecheck + test
  - **Do**: Run typecheck and full test suite
  - **Verify**: `cd /Users/zachbonfil/projects/private/mdview && bun tsc --noEmit && bun test 2>&1 | grep -E '^\s+[0-9]+ pass'`
  - **Done when**: 0 type errors, 222+ tests pass, 0 fail
  - **Commit**: `chore(cli): pass quality checkpoint` (only if fixes needed)

## Phase 4: Edge Case Tests

- [x] 4.1 Add empty markdown file test
  - **Do**:
    1. Add `describe("edge cases")` inside `describe("CLI integration")` in `src/index.test.ts`
    2. Add test: `empty markdown file renders without error`
    3. Use `Bun.write("/tmp/mdview-test-empty.md", "")` to create empty file
    4. Spawn CLI on that file, assert exit 0
  - **Files**: `src/index.test.ts`
  - **Done when**: Test passes, confirming empty files don't crash
  - **Verify**: `cd /Users/zachbonfil/projects/private/mdview && bun test --filter "edge cases" 2>&1 | grep -E 'pass|fail'`
  - **Commit**: `test(cli): add edge case test for empty markdown file`
  - _Requirements: AC-3.1_
  - _Design: Edge Case Tests section_

- [ ] 4.2 Add stdin with decorations test
  - **Do**:
    1. Inside `describe("edge cases")`, add test: `stdin with decorations shows numbers and grid but no filename header`
    2. Spawn CLI with `["-"]` and `FORCE_COLOR=1`, pipe `# Hello\nSome text` via stdin
    3. Assert: stdout contains `│` (numbers present), stdout does NOT contain `File:` (no filename for stdin)
  - **Files**: `src/index.test.ts`
  - **Done when**: Test passes, confirming stdin skips File: header but shows numbers
  - **Verify**: `cd /Users/zachbonfil/projects/private/mdview && bun test --filter "edge cases" 2>&1 | grep -E 'pass|fail'`
  - **Commit**: `test(cli): add edge case test for stdin with decorations`
  - _Requirements: AC-3.2_
  - _Design: Edge Case Tests section_

- [ ] 4.3 [VERIFY] Quality checkpoint: typecheck + test
  - **Do**: Run typecheck and full test suite
  - **Verify**: `cd /Users/zachbonfil/projects/private/mdview && bun tsc --noEmit && bun test 2>&1 | grep -E '^\s+[0-9]+ pass'`
  - **Done when**: 0 type errors, 224+ tests pass, 0 fail
  - **Commit**: `chore(cli): pass quality checkpoint` (only if fixes needed)

- [ ] 4.4 Add NO_COLOR suppresses decorations test
  - **Do**:
    1. Add test: `NO_COLOR suppresses decorations`
    2. Spawn CLI with `env: { ...process.env, NO_COLOR: "1" }` (no FORCE_COLOR) on `examples/test.md`
    3. Assert: exit 0, stdout does NOT contain `│`, does NOT contain `File:`
  - **Files**: `src/index.test.ts`
  - **Done when**: Test passes, confirming NO_COLOR env var suppresses all decorations
  - **Verify**: `cd /Users/zachbonfil/projects/private/mdview && bun test --filter "edge cases" 2>&1 | grep -E 'pass|fail'`
  - **Commit**: `test(cli): add edge case test for NO_COLOR env var`
  - _Requirements: AC-3.3_
  - _Design: Edge Case Tests section_

- [ ] 4.5 Add FORCE_COLOR forces decorations test
  - **Do**:
    1. Add test: `FORCE_COLOR forces decorations when piped`
    2. Spawn CLI with `env: { ...process.env, FORCE_COLOR: "1" }` on `examples/test.md` (stdout is piped, not TTY)
    3. Assert: exit 0, stdout contains `│` or `─` (decorations present despite piped output)
  - **Files**: `src/index.test.ts`
  - **Done when**: Test passes, confirming FORCE_COLOR enables decorations on piped output
  - **Verify**: `cd /Users/zachbonfil/projects/private/mdview && bun test --filter "edge cases" 2>&1 | grep -E 'pass|fail'`
  - **Commit**: `test(cli): add edge case test for FORCE_COLOR env var`
  - _Requirements: AC-3.4_
  - _Design: Edge Case Tests section_

## Phase 5: Quality Gates + PR Lifecycle

- [ ] 5.1 [VERIFY] Full local CI: typecheck + test + build
  - **Do**: Run complete local CI suite
  - **Verify**: `cd /Users/zachbonfil/projects/private/mdview && bun tsc --noEmit && bun test && bun build src/index.ts --compile --outfile mdview`
  - **Done when**: Build succeeds, all tests pass (227+ total, 0 fail)
  - **Commit**: `chore(cli): pass local CI` (if fixes needed)

- [ ] 5.2 Create PR and verify CI
  - **Do**:
    1. Verify current branch is feature branch: `git branch --show-current` (expect `feat/bat-cli-output`)
    2. If on default branch, STOP and alert user
    3. Push branch: `git push -u origin feat/bat-cli-output`
    4. Create PR: `gh pr create --title "test(cli): add integration tests for bat-style flags" --body "..."`
  - **Verify**: `gh pr checks --watch` -- all checks show passing
  - **Done when**: PR created, CI green
  - **Commit**: none

- [ ] 5.3 [VERIFY] AC checklist
  - **Do**: Programmatically verify each acceptance criterion is met
  - **Verify**:
    1. AC-1.5: `cd /Users/zachbonfil/projects/private/mdview && bun test --filter "help" 2>&1 | grep -c "pass"` shows 5+ (original 2 + 3 new)
    2. AC-2.1 through AC-2.6: `bun test --filter "bat-style" 2>&1 | grep -c "pass"` shows 6+
    3. AC-3.1 through AC-3.4: `bun test --filter "edge cases" 2>&1 | grep -c "pass"` shows 4+
    4. FR-1 baseline: `bun test 2>&1 | grep "0 fail"`
  - **Done when**: All acceptance criteria confirmed met via automated checks
  - **Commit**: none

## Notes

- **Baseline**: 214 tests pass at HEAD (bc091df), not 183 as originally assumed in requirements
- **HELP text already done**: AC-1.1 through AC-1.4 are satisfied; only AC-1.5 (test assertions) needs work
- **FORCE_COLOR=1**: Required in env for any test asserting decoration presence (Bun.spawn stdout is piped, not TTY)
- **NO_COLOR test**: Must NOT set FORCE_COLOR in env, or decorations will appear despite NO_COLOR
- **--style=invalid error path**: parseStyle throws, caught by main() catch handler; surfaces as stderr + exit 1
- **Stdin header skip**: `filename` is undefined for stdin, so `buildHeader` is gated off even with style.header=true
- **Temp file cleanup**: `/tmp/mdview-test-empty.md` created in 4.1; Bun.write overwrites on each run, no cleanup needed
