# Tasks: bat-style Output for mdview

**Total**: 48 tasks

## Phase 1: Make It Work (POC)

Focus: Get pager + decorations working end-to-end. Skip edge cases, hardcode where convenient.

### Task 1.1: Create pager module -- shouldPage + resolvePagerCommand [x]

**Do**:
1. Create `src/pager.ts` with `PagingMode` type, `shouldPage(mode)`, and `resolvePagerCommand()`
2. `shouldPage`: "never" -> false, "always" -> true, "auto" -> `process.stdout.isTTY === true`
3. `resolvePagerCommand`: check `MDVIEW_PAGER` > `PAGER` > `["less", "-RFX"]`, split env value by spaces

**Files**: `src/pager.ts`
**Done when**: Module exports `shouldPage` and `resolvePagerCommand` with correct types
**Verify**: `bun tsc --noEmit`
**Commit**: `feat(pager): add shouldPage and resolvePagerCommand`
_Requirements: FR-1, FR-2, FR-4, AC-1.5, AC-1.6, AC-1.9, AC-1.10, AC-1.11_
_Design: src/pager.ts_

### Task 1.2: Add pipeToPager to pager module

**Do**:
1. Add `pipeToPager(content: string): Promise<void>` to `src/pager.ts`
2. Use `Bun.spawn([cmd, ...args], { stdin: "pipe", stdout: "inherit", stderr: "inherit" })`
3. Write content to `proc.stdin`, call `proc.stdin.end()`, `await proc.exited`
4. Catch spawn errors and fall back to `process.stdout.write(content + "\n")`

**Files**: `src/pager.ts`
**Done when**: `pipeToPager` spawns a process and writes content to its stdin, with fallback
**Verify**: `bun tsc --noEmit`
**Commit**: `feat(pager): add pipeToPager with fallback to stdout`
_Requirements: FR-1, FR-3, AC-1.1, AC-1.7_
_Design: src/pager.ts pipeToPager implementation_

### Task 1.3: [VERIFY] Quality checkpoint

**Do**: Run typecheck and existing tests to verify no regressions
**Verify**: `bun tsc --noEmit && bun test`
**Done when**: Zero type errors, all 63 existing tests pass
**Commit**: `chore(pager): pass quality checkpoint` (only if fixes needed)

### Task 1.4: Create decorator module -- parseStyle

**Do**:
1. Create `src/decorator.ts` with `StyleComponents` interface and `DecorateOptions` interface
2. Implement `parseStyle(styleStr: string): StyleComponents`
3. "full" -> all true, "plain" -> all false, "numbers" -> only numbers true, comma-separated -> set listed ones
4. Throw descriptive error for invalid component names

**Files**: `src/decorator.ts`
**Done when**: `parseStyle("full")` returns all-true, `parseStyle("numbers,grid")` returns only those, invalid throws
**Verify**: `bun tsc --noEmit`
**Commit**: `feat(decorator): add parseStyle for --style flag parsing`
_Requirements: FR-13, AC-8.1 through AC-8.6_
_Design: src/decorator.ts parseStyle_

### Task 1.5: Add line number decoration to decorator module

**Do**:
1. Add helper `addLineNumbers(lines: string[], gutterWidth: number): string[]`
2. Right-align line numbers, use chalk.dim for the number, append ` │ ` separator
3. Calculate gutter width from line count: `Math.max(1, Math.ceil(Math.log10(lineCount + 1)))`

**Files**: `src/decorator.ts`
**Done when**: Helper takes lines array and prepends formatted line numbers with │ separator
**Verify**: `bun tsc --noEmit`
**Commit**: `feat(decorator): add line number gutter with box-drawing separator`
_Requirements: FR-6, AC-3.1 through AC-3.4_
_Design: src/decorator.ts internal structure steps 2, 5_

### Task 1.6: Add file header and grid borders to decorator module

**Do**:
1. Add header builder: `chalk.dim(\`File: \${path.basename(filename)}\`)` when filename provided
2. Add grid builders: top border with `─` chars (and `┬` at gutter junction), bottom border with `┴`
3. Grid spans `opts.width` characters

**Files**: `src/decorator.ts`
**Done when**: Header and grid builder helpers exist, using chalk.dim and box-drawing chars
**Verify**: `bun tsc --noEmit`
**Commit**: `feat(decorator): add file header and grid border builders`
_Requirements: FR-5, FR-7, AC-2.1 through AC-2.3, AC-4.1 through AC-4.3_
_Design: src/decorator.ts internal structure steps 3, 4_

### Task 1.7: Assemble decorate() function

**Do**:
1. Implement `decorate(content: string, options: DecorateOptions): string`
2. Split content on `\n`, apply line numbers if `style.numbers`, build header if `style.header && filename`, build grid if `style.grid`
3. Assemble: `[header?, topBorder?, ...numberedLines, bottomBorder?].join("\n")`

**Files**: `src/decorator.ts`
**Done when**: `decorate("hello\nworld", { filename: "test.md", width: 80, style: { header: true, numbers: true, grid: true } })` returns decorated string with header, numbers, grid
**Verify**: `bun tsc --noEmit`
**Commit**: `feat(decorator): assemble decorate() from header, numbers, grid`
_Requirements: FR-5, FR-6, FR-7_
_Design: src/decorator.ts decorate function_

### Task 1.8: [VERIFY] Quality checkpoint

**Do**: Run typecheck and existing tests
**Verify**: `bun tsc --noEmit && bun test`
**Done when**: Zero type errors, all 63 existing tests pass
**Commit**: `chore(decorator): pass quality checkpoint` (only if fixes needed)

### Task 1.9: Extend ParsedArgs with new CLI flags

**Do**:
1. Import `PagingMode` type from `./pager.js` at top of type definition (but NOT the runtime import -- keep lazy)
2. Add to `ParsedArgs`: `paging: PagingMode` (default "auto"), `plain: boolean` (default false), `style: string | null` (default null)
3. Update `parseArgs()` to handle `--paging=never|always|auto`, `--plain`/`-p`, `--style=<value>`
4. Handle positional file arg that may appear before or after flags

**Files**: `src/index.ts`
**Done when**: `parseArgs(["README.md", "--plain", "--paging=never"])` returns correct ParsedArgs with all fields
**Verify**: `bun tsc --noEmit`
**Commit**: `feat(cli): extend parseArgs with --paging, --plain, --style flags`
_Requirements: FR-4, FR-12, FR-13, AC-1.9, AC-7.1, AC-8.1_
_Design: src/index.ts changes 1-2_

### Task 1.10: Wire decorator + pager into main() output pipeline

**Do**:
1. Replace `console.log(output)` at end of `main()` with decoration + pager pipeline
2. Lazy import `decorate`/`parseStyle` from `./decorator.js` and `shouldPage`/`pipeToPager` from `./pager.js`
3. Resolve `useDecorations` from plain/TTY/NO_COLOR/FORCE_COLOR
4. Call `decorate()` if decorations enabled, then `pipeToPager()` or `console.log()`

**Files**: `src/index.ts`
**Done when**: `main()` uses decorator + pager pipeline instead of bare console.log
**Verify**: `bun tsc --noEmit`
**Commit**: `feat(cli): wire decorator and pager into output pipeline`
_Requirements: FR-1, FR-5, FR-6, FR-7, FR-9, AC-6.1, AC-6.2_
_Design: src/index.ts change 3_

### Task 1.11: [VERIFY] Quality checkpoint

**Do**: Run typecheck and existing tests
**Verify**: `bun tsc --noEmit && bun test`
**Done when**: Zero type errors, all existing tests pass
**Commit**: `chore(cli): pass quality checkpoint` (only if fixes needed)

### Task 1.12: POC end-to-end validation

**Do**:
1. Run `bun run src/index.ts examples/test.md --paging=never` and verify output contains box-drawing chars (│, ─) and "File: test.md"
2. Run `bun run src/index.ts examples/test.md --plain --paging=never` and verify NO box-drawing chars
3. Run `echo "# Hello" | bun run src/index.ts - --paging=never` and verify no file header (stdin), content renders
4. Run `bun run src/index.ts --version` and verify still outputs version fast

**Files**: none (validation only)
**Done when**: Decorated output shows header/numbers/grid; plain mode is clean; stdin has no header; version works
**Verify**: `bun run src/index.ts examples/test.md --paging=never 2>&1 | grep -c '│' | xargs test 0 -lt`
**Commit**: `feat(bat-style): complete POC -- decorator + pager working`
_Requirements: Success Criteria from requirements.md_

## Phase 2: Core Functionality

Fill in remaining functionality, edge cases, and all CLI flag behaviors.

### Task 2.1: Add --paging validation and error for invalid values

**Do**:
1. In `parseArgs()`, validate `--paging=` value is one of `auto|always|never`
2. If invalid, store an error state or use a validation approach consistent with existing pattern
3. In `main()`, check for invalid paging value and call `exitWithError()` with descriptive message

**Files**: `src/index.ts`
**Done when**: `--paging=bogus` exits with error: `mdview: error: invalid paging mode: "bogus". Valid: auto, always, never`
**Verify**: `bun run src/index.ts examples/test.md --paging=bogus 2>&1 | grep "invalid paging mode"`
**Commit**: `feat(cli): validate --paging flag values`
_Requirements: FR-4_
_Design: Error Handling table_

### Task 2.2: Add --style validation and error for invalid components

**Do**:
1. In `main()`, wrap `parseStyle()` call in try/catch
2. On error, print error message and exit(1): `mdview: error: unknown style component: "foo". Valid: header, numbers, grid`

**Files**: `src/index.ts`
**Done when**: `--style=bogus` exits with descriptive error
**Verify**: `bun run src/index.ts examples/test.md --style=bogus --paging=never 2>&1 | grep "unknown style component"`
**Commit**: `feat(cli): validate --style flag components`
_Requirements: FR-13, AC-8.5_
_Design: Error Handling table_

### Task 2.3: Handle --style=plain as alias for --plain

**Do**:
1. In `parseStyle()`, treat "plain" as returning all-false StyleComponents (already done in 1.4)
2. In `main()`, when style resolves to all-false, set `useDecorations = false`

**Files**: `src/index.ts`
**Done when**: `--style=plain` produces same output as `--plain`
**Verify**: `diff <(bun run src/index.ts examples/test.md --style=plain --paging=never 2>&1) <(bun run src/index.ts examples/test.md --plain --paging=never 2>&1)`
**Commit**: `feat(cli): support --style=plain as --plain alias`
_Requirements: AC-8.6_

### Task 2.4: [VERIFY] Quality checkpoint

**Do**: Run typecheck and all tests
**Verify**: `bun tsc --noEmit && bun test`
**Done when**: Zero type errors, all tests pass
**Commit**: `chore(cli): pass quality checkpoint` (only if fixes needed)

### Task 2.5: Handle NO_COLOR env var to disable decorations and colors

**Do**:
1. In `main()`, when `NO_COLOR` is set (any value), disable decorations
2. Ensure chalk respects NO_COLOR (chalk v5 auto-detects NO_COLOR -- verify this is the case)
3. If NO_COLOR + FORCE_COLOR both set, NO_COLOR wins (per no-color.org)

**Files**: `src/index.ts`
**Done when**: `NO_COLOR=1 bun run src/index.ts examples/test.md --paging=never` has no ANSI escapes or decorations
**Verify**: `NO_COLOR=1 bun run src/index.ts examples/test.md --paging=never 2>&1 | grep -c $'\033' | xargs test 0 -eq`
**Commit**: `feat(cli): respect NO_COLOR env var`
_Requirements: FR-10, AC-5.3, AC-6.3_
_Design: Edge Cases -- NO_COLOR + FORCE_COLOR_

### Task 2.6: Handle FORCE_COLOR env var to force decorations when piped

**Do**:
1. In `main()`, when `FORCE_COLOR` is set AND `NO_COLOR` is NOT set, force decorations even if not TTY
2. This is already partially wired in the `useDecorations` calculation -- verify and fix if needed

**Files**: `src/index.ts`
**Done when**: `FORCE_COLOR=1 bun run src/index.ts examples/test.md --paging=never | cat` shows decorations (│ chars)
**Verify**: `FORCE_COLOR=1 bun run src/index.ts examples/test.md --paging=never 2>&1 | grep -c '│' | xargs test 0 -lt`
**Commit**: `feat(cli): respect FORCE_COLOR env var for forced decorations`
_Requirements: FR-11, AC-5.4, AC-6.4_

### Task 2.7: Suppress decorations when stdout is not a TTY (piped)

**Do**:
1. Verify that when running piped (stdout not TTY), decorations are suppressed
2. Ensure `useDecorations` logic correctly checks `isTTY` -- when piped and no FORCE_COLOR, decorations off
3. Fix any issues found

**Files**: `src/index.ts`
**Done when**: `bun run src/index.ts examples/test.md --paging=never | cat` has no box-drawing chars
**Verify**: `bun run src/index.ts examples/test.md --paging=never 2>&1 | grep -c '│' | xargs test 0 -eq`
**Commit**: `feat(cli): suppress decorations when piped`
_Requirements: FR-9, AC-6.1, AC-6.2, AC-6.5_

### Task 2.8: [VERIFY] Quality checkpoint

**Do**: Run typecheck and all tests
**Verify**: `bun tsc --noEmit && bun test`
**Done when**: Zero errors, all tests pass
**Commit**: `chore(env-vars): pass quality checkpoint` (only if fixes needed)

### Task 2.9: Handle stdin -- no file header

**Do**:
1. Verify that when using `mdview -` (stdin), the decorator receives `filename: undefined`
2. Verify `decorate()` skips header when no filename
3. Fix if needed

**Files**: `src/index.ts`, `src/decorator.ts`
**Done when**: `echo "# Hi" | bun run src/index.ts - --paging=never` has grid but no "File:" header
**Verify**: `echo "# Hi" | bun run src/index.ts - --paging=never 2>&1 | grep -c "File:" | xargs test 0 -eq`
**Commit**: `fix(decorator): skip file header for stdin input`
_Requirements: AC-2.4_
_Design: Edge Cases -- Stdin + header_

### Task 2.10: Handle empty file input

**Do**:
1. Verify behavior when file is empty -- decorator should still add header/grid around empty content
2. Line numbers: none (0 lines)
3. Fix `decorate()` if it breaks on empty string

**Files**: `src/decorator.ts`
**Done when**: `decorate("", { filename: "empty.md", width: 80, style: { header: true, numbers: true, grid: true } })` returns header + grid with no content lines
**Verify**: `bun tsc --noEmit`
**Commit**: `fix(decorator): handle empty content gracefully`
_Requirements: Design Edge Cases -- Empty file_

### Task 2.11: Adaptive gutter width for large line counts

**Do**:
1. Verify gutter width adapts: 1-9 lines = 1 char, 10-99 = 2 chars, 100-999 = 3 chars
2. Verify grid junction chars (┬/┴) align with gutter width
3. Fix if width calculation is off

**Files**: `src/decorator.ts`
**Done when**: Content with 100+ lines has 3-char gutter; content with 5 lines has 1-char gutter
**Verify**: `bun tsc --noEmit`
**Commit**: `fix(decorator): verify adaptive gutter width`
_Requirements: AC-3.4_
_Design: src/decorator.ts internal structure step 2_

### Task 2.12: [VERIFY] Quality checkpoint

**Do**: Run typecheck and all tests
**Verify**: `bun tsc --noEmit && bun test`
**Done when**: All pass
**Commit**: `chore(decorator): pass quality checkpoint` (only if fixes needed)

## Phase 3: Polish

Error handling, help text, edge cases.

### Task 3.1: Update HELP text with new flags

**Do**:
1. Add `--paging=auto|always|never`, `--plain`/`-p`, `--style=<components>` to HELP string
2. Add examples showing new flags
3. Keep format consistent with existing HELP

**Files**: `src/index.ts`
**Done when**: `bun run src/index.ts --help` shows all new flags with descriptions
**Verify**: `bun run src/index.ts --help 2>&1 | grep -c "paging" | xargs test 0 -lt`
**Commit**: `docs(cli): update --help text with new flags`
_Requirements: FR-14_
_Design: src/index.ts change 4_

### Task 3.2: Handle pager broken pipe gracefully

**Do**:
1. In `pipeToPager`, catch write errors (user quits pager early -> EPIPE/broken pipe)
2. Silently ignore broken pipe -- normal behavior when user presses `q` in less

**Files**: `src/pager.ts`
**Done when**: Writing to pager stdin after pager exit does not crash the process
**Verify**: `bun tsc --noEmit`
**Commit**: `fix(pager): handle broken pipe when user quits pager early`
_Requirements: Design Error Handling -- Pager stdin write fails_

### Task 3.3: Handle --plain combined with --style gracefully

**Do**:
1. When both `--plain` and `--style` are specified, `--plain` wins (all decorations off)
2. Document this precedence in code comment

**Files**: `src/index.ts`
**Done when**: `--plain --style=numbers` produces no decorations
**Verify**: `bun run src/index.ts examples/test.md --plain --style=numbers --paging=never 2>&1 | grep -c '│' | xargs test 0 -eq`
**Commit**: `fix(cli): --plain takes precedence over --style`
_Requirements: Design Edge Cases -- --plain --style=numbers_

### Task 3.4: [VERIFY] Quality checkpoint

**Do**: Run typecheck and all tests
**Verify**: `bun tsc --noEmit && bun test`
**Done when**: All pass
**Commit**: `chore(polish): pass quality checkpoint` (only if fixes needed)

### Task 3.5: Ensure --version and --help remain fast (lazy loading)

**Do**:
1. Verify decorator.ts and pager.ts are only imported inside the render path (after help/version early return)
2. Import via `await import("./decorator.js")` and `await import("./pager.js")` only in the render branch
3. Do NOT add top-level imports for these modules

**Files**: `src/index.ts`
**Done when**: `bun run src/index.ts --version` does not load decorator or pager modules
**Verify**: `time bun run src/index.ts --version 2>&1 | head -1`
**Commit**: `perf(cli): verify lazy loading preserved for new modules`
_Requirements: NFR-1, NFR-6_
_Design: Performance Considerations_

### Task 3.6: Ensure binary compilation still works

**Do**:
1. Run `bun build src/index.ts --compile --outfile mdview`
2. Test the compiled binary: `./mdview --version`, `./mdview --help`

**Files**: none
**Done when**: Binary compiles and basic commands work
**Verify**: `bun build src/index.ts --compile --outfile mdview && ./mdview --version && ./mdview --help | grep -c "paging" | xargs test 0 -lt`
**Commit**: `build(cli): verify binary compilation with new modules`
_Requirements: NFR-4_

## Phase 4: Testing

Unit tests and integration tests for new modules.

### Task 4.1: Unit tests for parseStyle

**Do**:
1. Create `src/decorator.test.ts`
2. Test: "full" -> all true, "plain" -> all false, "numbers" -> only numbers, "header,grid" -> those two
3. Test: "header,numbers,grid" -> all true, invalid component throws, empty string throws

**Files**: `src/decorator.test.ts`
**Done when**: All parseStyle tests pass
**Verify**: `bun test src/decorator.test.ts`
**Commit**: `test(decorator): add unit tests for parseStyle`
_Requirements: AC-8.1 through AC-8.6_
_Design: Test Strategy -- parseStyle tests_

### Task 4.2: Unit tests for decorate -- header

**Do**:
1. Add tests to `src/decorator.test.ts`
2. Test: header shows "File: basename" when filename provided
3. Test: header omitted when filename undefined (stdin)
4. Test: header omitted when style.header = false

**Files**: `src/decorator.test.ts`
**Done when**: Header decoration tests pass
**Verify**: `bun test src/decorator.test.ts`
**Commit**: `test(decorator): add unit tests for header decoration`
_Requirements: AC-2.1 through AC-2.5_
_Design: Test Strategy -- decorate() header tests_

### Task 4.3: Unit tests for decorate -- line numbers

**Do**:
1. Add tests to `src/decorator.test.ts`
2. Test: line numbers right-aligned, separated by │
3. Test: gutter width adapts (1 digit for <10, 2 for <100, etc.)
4. Test: line numbers hidden when style.numbers = false

**Files**: `src/decorator.test.ts`
**Done when**: Line number tests pass
**Verify**: `bun test src/decorator.test.ts`
**Commit**: `test(decorator): add unit tests for line numbers`
_Requirements: AC-3.1 through AC-3.5_
_Design: Test Strategy -- decorate() line number tests_

### Task 4.4: [VERIFY] Quality checkpoint

**Do**: Run typecheck and all tests
**Verify**: `bun tsc --noEmit && bun test`
**Done when**: All pass
**Commit**: `chore(tests): pass quality checkpoint` (only if fixes needed)

### Task 4.5: Unit tests for decorate -- grid borders

**Do**:
1. Add tests to `src/decorator.test.ts`
2. Test: top/bottom borders use ─ characters
3. Test: junction chars ┬/┴ present when numbers enabled
4. Test: grid omitted when style.grid = false

**Files**: `src/decorator.test.ts`
**Done when**: Grid border tests pass
**Verify**: `bun test src/decorator.test.ts`
**Commit**: `test(decorator): add unit tests for grid borders`
_Requirements: AC-4.1 through AC-4.4_
_Design: Test Strategy -- decorate() grid tests_

### Task 4.6: Unit tests for decorate -- combined and edge cases

**Do**:
1. Add tests to `src/decorator.test.ts`
2. Test: all decorations off when all style components false
3. Test: empty content produces header + grid with no content lines
4. Test: content with ANSI escapes counts lines correctly

**Files**: `src/decorator.test.ts`
**Done when**: Combined/edge case tests pass
**Verify**: `bun test src/decorator.test.ts`
**Commit**: `test(decorator): add combined and edge case tests`
_Design: Test Strategy -- decorate() combined tests_

### Task 4.7: Unit tests for shouldPage

**Do**:
1. Create `src/pager.test.ts`
2. Test: "never" -> false regardless of TTY
3. Test: "always" -> true regardless of TTY
4. Test: "auto" with mocked isTTY=true -> true, isTTY=false -> false

**Files**: `src/pager.test.ts`
**Done when**: shouldPage tests pass
**Verify**: `bun test src/pager.test.ts`
**Commit**: `test(pager): add unit tests for shouldPage`
_Requirements: AC-1.9, AC-1.10, AC-1.11_
_Design: Test Strategy -- shouldPage tests_

### Task 4.8: Unit tests for resolvePagerCommand

**Do**:
1. Add tests to `src/pager.test.ts`
2. Test: returns MDVIEW_PAGER split by spaces when set
3. Test: falls back to PAGER when MDVIEW_PAGER not set
4. Test: falls back to ["less", "-RFX"] when neither set

**Files**: `src/pager.test.ts`
**Done when**: resolvePagerCommand tests pass
**Verify**: `bun test src/pager.test.ts`
**Commit**: `test(pager): add unit tests for resolvePagerCommand`
_Requirements: AC-1.5, AC-1.6_
_Design: Test Strategy -- resolvePagerCommand tests_

### Task 4.9: [VERIFY] Quality checkpoint

**Do**: Run typecheck and all tests
**Verify**: `bun tsc --noEmit && bun test`
**Done when**: All pass
**Commit**: `chore(tests): pass quality checkpoint` (only if fixes needed)

### Task 4.10: Unit tests for pipeToPager fallback

**Do**:
1. Add tests to `src/pager.test.ts`
2. Test: falls back to stdout when spawn throws (mock Bun.spawn to throw)
3. Test: writes content to stdout on fallback

**Files**: `src/pager.test.ts`
**Done when**: pipeToPager fallback tests pass
**Verify**: `bun test src/pager.test.ts`
**Commit**: `test(pager): add unit tests for pipeToPager fallback`
_Requirements: AC-1.7_
_Design: Test Strategy -- pipeToPager mock tests_

### Task 4.11: Tests for extended parseArgs -- new flags

**Do**:
1. Add tests to `src/index.test.ts`
2. Test: `--paging=never` sets paging to "never", `--paging=always` sets "always", default is "auto"
3. Test: `--plain` and `-p` set plain to true
4. Test: `--style=numbers` sets style, file arg works alongside flags

**Files**: `src/index.test.ts`
**Done when**: All new parseArgs tests pass
**Verify**: `bun test src/index.test.ts`
**Commit**: `test(cli): add parseArgs tests for new flags`
_Requirements: FR-4, FR-12, FR-13_
_Design: Test Strategy -- parseArgs extensions_

### Task 4.12: Integration tests for CLI with new flags

**Do**:
1. Add integration tests to `src/index.test.ts`
2. Test: piped output has no box-drawing chars (spawn with stdout: "pipe")
3. Test: `--plain` output has no decorations
4. Test: `--paging=never` outputs directly (verify exit code 0, output on stdout)

**Files**: `src/index.test.ts`
**Done when**: Integration tests verify piped/plain/paging behavior
**Verify**: `bun test src/index.test.ts`
**Commit**: `test(cli): add integration tests for decoration and paging flags`
_Requirements: AC-6.1, AC-7.1, AC-1.9_
_Design: Test Strategy -- CLI integration_

### Task 4.13: Integration test for --style flag

**Do**:
1. Add to `src/index.test.ts`
2. Test: `--style=numbers` shows │ but no "File:" header
3. Test: `--style=header,grid` shows "File:" but no │ after content lines
4. Test: `--style=bogus` exits with error

**Files**: `src/index.test.ts`
**Done when**: Style flag integration tests pass
**Verify**: `bun test src/index.test.ts`
**Commit**: `test(cli): add integration tests for --style flag`
_Requirements: AC-8.2, AC-8.3, AC-8.5_

### Task 4.14: [VERIFY] Quality checkpoint

**Do**: Run typecheck and all tests
**Verify**: `bun tsc --noEmit && bun test`
**Done when**: All pass
**Commit**: `chore(tests): pass quality checkpoint` (only if fixes needed)

### Task 4.15: Integration tests for env vars (NO_COLOR, FORCE_COLOR)

**Do**:
1. Add to `src/index.test.ts`
2. Test: `NO_COLOR=1` output has no ANSI escape sequences
3. Test: `FORCE_COLOR=1` piped output contains decorations (│ chars)
4. Spawn CLI subprocess with custom env for each test

**Files**: `src/index.test.ts`
**Done when**: Env var tests pass
**Verify**: `bun test src/index.test.ts`
**Commit**: `test(cli): add integration tests for NO_COLOR and FORCE_COLOR`
_Requirements: AC-5.3, AC-5.4, AC-6.3, AC-6.4_

### Task 4.16: Integration test for help text showing new flags

**Do**:
1. Add to `src/index.test.ts`
2. Test: `--help` output contains "--paging", "--plain", "--style"

**Files**: `src/index.test.ts`
**Done when**: Help text test passes
**Verify**: `bun test src/index.test.ts`
**Commit**: `test(cli): verify help text documents new flags`
_Requirements: FR-14_

### Task 4.17: Integration test for stdin with decorations

**Do**:
1. Add to `src/index.test.ts`
2. Test: stdin input with `FORCE_COLOR=1` + `--paging=never` shows grid/numbers but no "File:" header
3. Spawn with stdin pipe, write markdown, verify output

**Files**: `src/index.test.ts`
**Done when**: Stdin decoration test passes
**Verify**: `bun test src/index.test.ts`
**Commit**: `test(cli): add stdin decoration integration test`
_Requirements: AC-2.4, AC-3.1_

### Task 4.18: [VERIFY] Quality checkpoint

**Do**: Run full test suite and typecheck
**Verify**: `bun tsc --noEmit && bun test`
**Done when**: All pass
**Commit**: `chore(tests): pass quality checkpoint` (only if fixes needed)

## Phase 5: Quality Gate

### Task 5.1: [VERIFY] Full local CI: typecheck + test + build

**Do**:
1. Run `bun tsc --noEmit`
2. Run `bun test`
3. Run `bun build src/index.ts --compile --outfile mdview`
4. Run `./mdview --version` and `./mdview examples/test.md --paging=never --plain` to verify binary

**Verify**: `bun tsc --noEmit && bun test && bun build src/index.ts --compile --outfile mdview && ./mdview --version`
**Done when**: Typecheck clean, all tests pass, binary compiles and runs
**Commit**: `chore(bat-style): pass full local CI` (only if fixes needed)

### Task 5.2: [VF] Acceptance criteria verification

**Do**:
1. Verify AC-1.1: `bun run src/index.ts examples/test.md --paging=never` with FORCE_COLOR shows decorated output (pager tested separately)
2. Verify AC-2.1: output contains "File: test.md" header
3. Verify AC-3.1: output contains │ gutter separator
4. Verify AC-4.1: output contains ─ grid borders
5. Verify AC-6.1: piped output has no decorations
6. Verify AC-7.1: `--plain` disables decorations
7. Verify AC-8.2: `--style=numbers` shows only numbers
8. Verify NFR-1: `--version` responds fast
9. Verify all existing tests still pass (no regressions)

**Verify**: `FORCE_COLOR=1 bun run src/index.ts examples/test.md --paging=never 2>&1 | grep "File: test.md" && FORCE_COLOR=1 bun run src/index.ts examples/test.md --paging=never 2>&1 | grep "│" && FORCE_COLOR=1 bun run src/index.ts examples/test.md --paging=never 2>&1 | grep "─" && bun run src/index.ts examples/test.md --paging=never 2>&1 | grep -c "│" | xargs test 0 -eq && bun run src/index.ts examples/test.md --plain --paging=never 2>&1 | grep -c "│" | xargs test 0 -eq && bun test`
**Done when**: All key acceptance criteria confirmed via automated checks
**Commit**: none

## Notes

- **POC shortcuts taken**: No validation of --paging/--style values in Phase 1 (added in Phase 2). No broken pipe handling in Phase 1 (added in Phase 3). Limited edge case coverage until Phase 2.
- **Production TODOs**: Phase 2 adds validation, env var handling, edge cases. Phase 3 adds polish and help text.
- **Key dependency**: `path.basename()` needed in decorator.ts for header -- use `import { basename } from "node:path"` (works in Bun).
- **Test pattern**: Existing tests use `describe/test/expect` from `bun:test`. Integration tests spawn `Bun.spawn(["bun", "run", CLI_PATH, ...])`. Follow same pattern.
- **Piped output detection**: When spawning CLI with `stdout: "pipe"`, `process.stdout.isTTY` will be false in the child -- this is correct for testing pipe behavior.
- **FORCE_COLOR in tests**: Existing integration tests already set `FORCE_COLOR: "1"` in env -- need to be aware this enables decorations now.
