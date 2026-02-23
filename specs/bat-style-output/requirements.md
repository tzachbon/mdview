# Requirements: bat-style Output for mdview

## Goal

Replace mdview's plain `console.log` output with bat-style terminal output: file header decorations, line numbers, grid borders, syntax-highlighted code blocks, and a scrollable pager -- always on by default, with smart TTY detection.

## User Stories

### US-1: Scrollable Pager for Long Documents
**As a** developer reading long markdown files in the terminal
**I want** output piped through a scrollable pager (like `less`)
**So that** I can navigate large documents without losing content off-screen

**Acceptance Criteria:**
- [ ] AC-1.1: Output pipes through `less -RFX` by default when stdout is a TTY
- [ ] AC-1.2: Short output (fits one screen) exits pager automatically (`-F` flag behavior)
- [ ] AC-1.3: ANSI colors render correctly inside pager (`-R` flag)
- [ ] AC-1.4: Terminal state preserved after pager exit (`-X` flag)
- [ ] AC-1.5: `MDVIEW_PAGER` env var overrides the pager command
- [ ] AC-1.6: `PAGER` env var used as fallback if `MDVIEW_PAGER` not set
- [ ] AC-1.7: If `less` binary not found and no env var set, output falls back to direct stdout (no crash)
- [ ] AC-1.8: Pager disabled when stdout is not a TTY (piped output)
- [ ] AC-1.9: `--paging=never` disables pager unconditionally
- [ ] AC-1.10: `--paging=always` forces pager even when piped
- [ ] AC-1.11: `--paging=auto` (default) uses TTY detection

### US-2: File Header Decoration
**As a** developer viewing a markdown file
**I want** the filename displayed in a styled header at the top of output
**So that** I always know which file I'm looking at

**Acceptance Criteria:**
- [ ] AC-2.1: File header shows `File: <filename>` at top of output (just basename, not full path)
- [ ] AC-2.2: Header styled with dimmed/gray text via chalk
- [ ] AC-2.3: Header separated from content by a horizontal grid line
- [ ] AC-2.4: No file header when reading from stdin (no filename available)
- [ ] AC-2.5: Header hidden when `--style` excludes `header`
- [ ] AC-2.6: Header hidden when `--plain` flag is used

### US-3: Line Numbers
**As a** developer referencing specific parts of rendered output
**I want** line numbers in a left gutter
**So that** I can reference specific lines when discussing content

**Acceptance Criteria:**
- [ ] AC-3.1: Line numbers appear in a left gutter separated by `│` from content
- [ ] AC-3.2: Line numbers are right-aligned and dimmed/gray
- [ ] AC-3.3: Line numbers count rendered output lines (not source markdown lines)
- [ ] AC-3.4: Gutter width adapts to total line count (e.g., 3 chars for <1000 lines)
- [ ] AC-3.5: Line numbers hidden when `--style` excludes `numbers`
- [ ] AC-3.6: Line numbers hidden when `--plain` flag is used

### US-4: Grid Borders
**As a** developer viewing decorated output
**I want** horizontal rules framing the content
**So that** the output has clear visual boundaries like bat

**Acceptance Criteria:**
- [ ] AC-4.1: Top horizontal rule appears below the file header (using `─` characters)
- [ ] AC-4.2: Bottom horizontal rule appears after last line of content
- [ ] AC-4.3: Grid lines span the full terminal width
- [ ] AC-4.4: Grid hidden when `--style` excludes `grid`
- [ ] AC-4.5: Grid hidden when `--plain` flag is used

### US-5: Syntax Highlighting in Code Blocks
**As a** developer reading markdown with code examples
**I want** code blocks syntax-highlighted with color
**So that** code is readable and visually distinct

**Acceptance Criteria:**
- [ ] AC-5.1: Fenced code blocks with language tags render with syntax highlighting (via existing cli-highlight)
- [ ] AC-5.2: Code blocks without language tags render with auto-detection or plain
- [ ] AC-5.3: Highlighting respects `NO_COLOR` env var (disabled when set)
- [ ] AC-5.4: Highlighting respects `FORCE_COLOR` env var (forced when set)

### US-6: Smart Output Detection
**As a** developer piping mdview output to other tools
**I want** decorations suppressed when output is piped
**So that** downstream tools receive clean rendered markdown without decoration artifacts

**Acceptance Criteria:**
- [ ] AC-6.1: When stdout is not a TTY, no decorations (no header, numbers, grid)
- [ ] AC-6.2: When stdout is not a TTY, no pager spawned
- [ ] AC-6.3: `NO_COLOR` env var disables all ANSI color output
- [ ] AC-6.4: `FORCE_COLOR` env var forces colors even when piped
- [ ] AC-6.5: Piped output still renders markdown (headings, lists, etc.) -- only decorations stripped

### US-7: Plain Mode Override
**As a** developer who wants minimal output
**I want** a `--plain` flag to disable all decorations
**So that** I get rendered markdown without any bat-style chrome

**Acceptance Criteria:**
- [ ] AC-7.1: `--plain` or `-p` disables header, line numbers, and grid
- [ ] AC-7.2: `--plain` does NOT disable syntax highlighting (only decorations)
- [ ] AC-7.3: `--plain` does NOT disable the pager (use `--paging=never` for that)
- [ ] AC-7.4: `--plain` can combine with `--paging=never` for fully plain output

### US-8: Style Component Selection
**As a** developer customizing the display
**I want** a `--style` flag to toggle individual decoration components
**So that** I can show only the decorations I want

**Acceptance Criteria:**
- [ ] AC-8.1: `--style=full` enables all components (default)
- [ ] AC-8.2: `--style=numbers` enables only line numbers
- [ ] AC-8.3: `--style=header,grid` enables header and grid but not numbers
- [ ] AC-8.4: Supported components: `header`, `numbers`, `grid`
- [ ] AC-8.5: Invalid component names produce a clear error message
- [ ] AC-8.6: `--style=plain` is equivalent to `--plain`

## Functional Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FR-1 | Pager integration via system `less -RFX` with Bun.spawn | High | AC-1.1 through AC-1.4 |
| FR-2 | Pager env var override chain: `MDVIEW_PAGER` > `PAGER` > `less -RFX` | High | AC-1.5, AC-1.6 |
| FR-3 | Graceful fallback to direct stdout when `less` not found | High | AC-1.7 |
| FR-4 | `--paging=never\|always\|auto` flag | High | AC-1.9 through AC-1.11 |
| FR-5 | File header decoration with filename | Medium | AC-2.1 through AC-2.4 |
| FR-6 | Line numbers in left gutter with `│` separator | Medium | AC-3.1 through AC-3.4 |
| FR-7 | Grid borders (top/bottom horizontal rules with `─`) | Medium | AC-4.1 through AC-4.3 |
| FR-8 | Code block syntax highlighting via cli-highlight (existing) | High | AC-5.1, AC-5.2 |
| FR-9 | Smart TTY detection: suppress decorations + pager when piped | High | AC-6.1, AC-6.2 |
| FR-10 | `NO_COLOR` env var support | High | AC-5.3, AC-6.3 |
| FR-11 | `FORCE_COLOR` env var support | Medium | AC-5.4, AC-6.4 |
| FR-12 | `--plain` / `-p` flag | Medium | AC-7.1 through AC-7.4 |
| FR-13 | `--style` flag with component selection | Low | AC-8.1 through AC-8.6 |
| FR-14 | Update `--help` text to document new flags | High | N/A |

## Non-Functional Requirements

| ID | Requirement | Metric | Target |
|----|-------------|--------|--------|
| NFR-1 | Startup performance | `--version` response time | <50ms (no regression from current) |
| NFR-2 | Rendering performance | Time to first byte for pager | <200ms for typical README (~500 lines) |
| NFR-3 | No new runtime dependencies | Dependency count delta | 0 new deps (use chalk, marked-terminal, cli-highlight already bundled) |
| NFR-4 | Binary compilation | `bun build --compile` | Must still produce working standalone binary |
| NFR-5 | Test coverage | Line coverage for new code | >80% |
| NFR-6 | Lazy loading preserved | Import structure | New modules only imported when rendering (not for `--version`, `--help`) |

## Glossary

- **Pager**: External process (typically `less`) that provides scrollable, keyboard-navigable viewing of output
- **TTY**: Terminal device; `process.stdout.isTTY` is true when output goes to an interactive terminal, false when piped
- **Decoration**: Visual chrome added around content -- header, line numbers, grid borders
- **Grid**: Horizontal rules (`─`) separating header from content and marking end of content
- **Gutter**: Left-side column containing line numbers, separated from content by `│`
- **NO_COLOR**: Standard env var (see no-color.org) that disables all ANSI color output when set
- **FORCE_COLOR**: Env var that forces color output even in non-TTY contexts
- **less -RFX**: `less` with flags: Raw ANSI passthrough, quit-if-one-screen, no-init (preserve terminal)
- **cli-highlight**: highlight.js wrapper for terminal output, bundled inside marked-terminal

## Out of Scope

- **shiki/TextMate-based highlighting** -- defer to future spec; cli-highlight is sufficient for MVP
- **Git diff markers in gutter** -- bat's `changes` component; mdview renders markdown, not source code
- **Custom color themes / `--theme` flag** -- future enhancement
- **Per-code-block mini line numbers** -- only whole-document line numbers for MVP
- **Language label on code blocks** -- future enhancement (bat shows language name above code blocks)
- **File size in header** -- keep header minimal (filename only)
- **Windows support for pager** -- `less` may not exist on Windows; fallback to direct stdout is sufficient
- **Configuration file** (`.mdviewrc`) -- future spec
- **`--line-range` flag** -- bat feature for showing subset of lines; not applicable to rendered markdown
- **Snip markers between non-contiguous sections** -- bat feature not relevant here

## Dependencies

- **System `less` binary** -- required for pager (universally available on macOS/Linux; graceful fallback if missing)
- **chalk v5.3.0** -- already in project; used for decoration styling
- **marked-terminal v7.3.0** -- already in project; bundles cli-highlight for syntax highlighting
- **Bun.spawn API** -- required for pager process spawning; verified compatible in research
- **`process.stdout.isTTY`** -- Node.js/Bun API for TTY detection
- **`process.stdout.columns`** -- for grid width calculation (already used in renderer.ts)

## Unresolved Questions

1. **Line number scope**: Requirements specify line numbers on rendered output lines. If rendered output contains blank lines from markdown spacing, should those be numbered? (Recommendation: yes, number all lines including blanks, matching bat behavior)
2. **Grid corner characters**: Should grid intersect with gutter using `┬`, `┴`, `├`, `┤` box-drawing characters, or keep it simple with `─` only? (Recommendation: use corner characters for polish)
3. **`--style` additivity**: Should `--style=numbers` mean "only numbers" or "default + numbers"? (Recommendation: "only the listed components", matching bat's behavior)

## Success Criteria

- Running `mdview README.md` in a TTY shows output with file header, line numbers, grid, and pager
- Running `mdview README.md | cat` produces clean rendered markdown with no decoration artifacts
- Running `mdview --plain README.md` shows rendered markdown without decorations but with pager
- Running `mdview --paging=never README.md` outputs to stdout directly (no pager)
- `NO_COLOR=1 mdview README.md` produces uncolored output
- `--version` responds in <50ms (no regression)
- All existing tests continue to pass

## Next Steps

1. Approve these requirements (or flag changes needed)
2. Proceed to design phase -- define module architecture, interfaces, and decorator pipeline
3. Break into implementation tasks (pager, decorator module, CLI flags, tests)
