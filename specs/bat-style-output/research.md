---
spec: bat-style-output
phase: research
created: 2026-02-23
---

# Research: bat-style-output

## Executive Summary

Transforming mdview's output to bat-style is **highly feasible** with the existing stack. The current `marked-terminal` already uses `cli-highlight` (highlight.js-based) for code block syntax highlighting. The core work involves: (1) adding bat-style decorations (file header, line numbers, grid borders) around the rendered markdown output, (2) piping output through a system pager (`less -RFX`) via `Bun.spawn`, and (3) optionally upgrading syntax highlighting from cli-highlight to shiki for VS Code-grade accuracy. No major rewrites needed -- marked-terminal can be extended, not replaced.

## External Research

### 1. How bat Works

bat is a Rust CLI using [syntect](https://github.com/trishume/syntect) (Sublime Text grammars) for syntax highlighting and pipes output to `less` by default.

**Architecture pipeline:**
1. Input: reads files or stdin
2. Language detection: by file extension, first line, or `--language` flag
3. Syntax highlighting: syntect parses with `.sublime-syntax` grammars, applies `.tmTheme` theme, produces ANSI escape codes
4. Decorations: line numbers, git diff markers, file headers, grid borders added based on `--style`
5. Smart output detection: if piped to non-interactive terminal, decorations/colors suppressed
6. Pager: output piped to `less` (default) with flags `-R -F -X`

**Key bat decorations (configurable via `--style`):**
| Component | Description |
|-----------|-------------|
| `header` | File name/path at top |
| `header-filesize` | File size in header |
| `grid` | Horizontal lines separating header/content/footer |
| `numbers` | Line numbers in left gutter |
| `changes` | Git diff markers in gutter |
| `snip` | Separator between non-contiguous sections |
| `rule` | Horizontal rule between files |

**Pager defaults:**
- `less -R -F -X` (raw ANSI, quit-if-one-screen, no-init)
- Configurable via `BAT_PAGER` env or `--pager` flag
- `--paging=never` to disable
- Smart: if output fits one screen, no pager needed (via `-F`)

**Sources:**
- [sharkdp/bat README](https://github.com/sharkdp/bat)
- [bat man page](https://man.archlinux.org/man/bat.1.en)
- [syntect](https://github.com/trishume/syntect)

### 2. Node.js/TypeScript Terminal Rendering Libraries

#### Syntax Highlighting

| Library | Engine | Languages | Terminal Native | Bundle Size | Performance | Weekly Downloads |
|---------|--------|-----------|-----------------|-------------|-------------|------------------|
| **cli-highlight** | highlight.js | 185+ | Yes (ANSI) | Small | Fast | 3.1M |
| **shiki** (`codeToANSI`) | TextMate/VS Code | 100+ | Yes (via @shikijs/cli) | 6.4MB full, fine-grained available | Slower (more accurate) | High |
| **highlight.js** | Own regex | 185+ | No (HTML output) | Small | Fast | Very high |

**cli-highlight** (already in project via marked-terminal):
- Wraps highlight.js for terminal output
- Supports auto-detection and explicit language setting
- Custom themes via JSON (keys = highlight.js CSS classes, values = chalk styles)
- API: `highlight(code, { language, ignoreIllegals })`
- Source: [felixfbecker/cli-highlight](https://github.com/felixfbecker/cli-highlight)

**shiki** (`@shikijs/cli`):
- VS Code-grade accuracy (TextMate grammars)
- `codeToANSI(source, lang, theme)` -- async function producing ANSI terminal output
- Full bundle is 6.4MB; fine-grained imports available for CLI tools
- Requires WASM (oniguruma engine) or pure-JS engine (lighter, slightly less compatible)
- Source: [shiki.style](https://shiki.style/packages/cli), [GitHub](https://github.com/shikijs/shiki)

#### Terminal Decorations

| Library | Purpose | Downloads | Notes |
|---------|---------|-----------|-------|
| **boxen** | Box drawing around text | Very high (7201 dependents) | Single, double, round borders |
| **cli-boxes** | Box character definitions | High | Used by boxen internally |
| **chalk** | ANSI colors/styles | Very high | Already in project |
| **cli-table3** | Table rendering | High | Already used by marked-terminal |

**For bat-style decorations specifically**, no existing npm package replicates bat's decoration system. Custom implementation using chalk + Unicode box-drawing characters (`│`, `─`, `┬`, `┤`, etc.) is the way to go. This is straightforward string manipulation.

#### Pager Libraries

| Library | Type | Notes |
|---------|------|-------|
| **System `less`** | External process | Best option. Universal, proven, handles ANSI |
| **less-pager-mini** | Pure JS pager | Lightweight, TypeScript, MIT. Less mature. |
| **blessed** | Full TUI framework | Overkill for pager. 16K+ lines. |
| **terminal-kit** | TUI toolkit | Overkill. Good for full TUI apps. |

### 3. Pager Integration Options

#### Recommended: Spawn system `less` (like bat and git do)

**How git does it** (from [git/pager.c](https://github.com/git/git/blob/master/pager.c)):
1. Create pipe, fork child
2. Parent writes to pipe (stdout redirected to pipe write-end)
3. Child reads from pipe (stdin redirected to pipe read-end), execs `less -FRX`
4. Parent waits for child to exit

**Bun implementation** (verified compatible from [Bun docs](https://bun.com/docs/runtime/child-process)):

```typescript
const proc = Bun.spawn(["less", "-RFX"], {
  stdin: "pipe",      // We write content to less's stdin
  stdout: "inherit",  // less controls terminal output directly
  stderr: "inherit",  // less needs stderr for terminal control
});

proc.stdin.write(renderedOutput);
proc.stdin.end();

await proc.exited;  // Wait for user to quit less
```

**Key flags:**
- `-R`: Raw control chars (ANSI colors pass through)
- `-F`: Quit if one screen (no pager for short output)
- `-X`: Don't clear screen on exit (preserves output)

**Fallback chain:**
1. Check `MDVIEW_PAGER` env var
2. Check `PAGER` env var
3. Default to `less -RFX`
4. If `less` not found, fall back to direct stdout (no paging)

**Smart paging:**
- Only page when output is to a TTY (`process.stdout.isTTY`)
- Skip paging when piped (`mdview file.md | grep something`)
- `--paging=never` flag to disable

#### Alternative: Pure JS pager (less-pager-mini)

- Pro: No external dependency on `less` binary
- Con: Less mature, may not handle all edge cases, adds bundle size
- Con: Reinventing a well-solved problem
- **Verdict: Not recommended.** System `less` is universal on macOS/Linux and is what bat/git use.

### 4. Syntax Highlighting for Code Blocks within Markdown

#### Current flow (marked-terminal internals):

From reading `node_modules/marked-terminal/index.js`:

```
marked.parse(markdown)
  -> Renderer.prototype.code(code, lang, escaped)
    -> highlight(code, lang, opts, highlightOptions)
      -> cli-highlight's highlightCli(code, { language })
    -> indentify(tab, highlightedCode)
    -> section(indentifiedCode)  // adds \n\n
```

The `markedTerminal()` function accepts two arguments:
1. `options` -- styling options (e.g., `{ code: chalk.yellow }`)
2. `highlightOptions` -- passed directly to cli-highlight

#### Three approaches to enhance code block highlighting:

**Approach A: Keep cli-highlight, customize theme (Simplest)**
```typescript
markedTerminal({
  code: chalk.bgGray,  // background for code blocks
}, {
  theme: batStyleTheme  // custom cli-highlight theme
})
```
- Pro: Zero new dependencies, works today
- Con: highlight.js accuracy is "good enough" but not VS Code-grade

**Approach B: Override marked's code renderer (Moderate)**
```typescript
marked.use({
  renderer: {
    code({ text, lang }) {
      const highlighted = customHighlight(text, lang);
      const withDecorations = addBatDecorations(highlighted, lang);
      return withDecorations;
    }
  }
});
```
- Pro: Full control over code block rendering
- Pro: Can add bat-style decorations (line numbers, grid) per code block
- Con: Must handle indentation, spacing manually

**Approach C: Use shiki's `codeToANSI` (Highest quality)**
```typescript
import { codeToANSI } from '@shikijs/cli';
const highlighted = await codeToANSI(code, lang, 'monokai');
```
- Pro: VS Code-grade accuracy, beautiful themes
- Con: Adds ~1-6MB to bundle (fine-grained imports help)
- Con: Async API, requires WASM or JS engine setup
- Con: Startup time impact (shiki loads grammars upfront)

### 5. Feasibility and Approach Analysis

#### Recommended Architecture

**Do NOT replace marked-terminal.** Instead, layer bat-style output around it:

```
                    ┌─────────────────────────────┐
                    │        mdview CLI            │
                    └──────────┬──────────────────┘
                               │
                    ┌──────────▼──────────────────┐
                    │   marked + marked-terminal   │
                    │   (renders markdown to ANSI)  │
                    └──────────┬──────────────────┘
                               │
                    ┌──────────▼──────────────────┐
                    │   bat-style decorator        │
                    │   (header, numbers, grid)    │
                    └──────────┬──────────────────┘
                               │
                    ┌──────────▼──────────────────┐
                    │   pager (less -RFX)          │
                    │   or direct stdout           │
                    └─────────────────────────────┘
```

**Phase breakdown:**

1. **Pager integration** -- spawn `less -RFX`, smart detection, `--paging` flag
2. **File header decoration** -- filename, optional filesize, top grid line
3. **Line numbers** -- left gutter with line numbers, separator `│`
4. **Grid borders** -- top/bottom horizontal rules using `─`
5. **Enhanced code block highlighting** -- override code renderer for bat-style code blocks with their own mini line numbers and language label
6. **Style configuration** -- `--style` flag (like bat) to toggle components

#### Trade-offs: cli-highlight vs shiki

| Factor | cli-highlight (keep) | shiki (upgrade) |
|--------|---------------------|-----------------|
| Accuracy | Good (highlight.js) | Excellent (VS Code) |
| Startup time | Negligible | +50-200ms (grammar loading) |
| Bundle size | 0 (already included) | +1-6MB |
| Dependencies | 0 new | +shiki, +WASM or JS engine |
| Theme ecosystem | Basic JSON themes | VS Code themes (hundreds) |
| Maintenance | Stable, low activity | Active, well-maintained |
| Async requirement | No | Yes |

**Recommendation: Start with cli-highlight**, which is already integrated. The quality difference is noticeable but not critical for a terminal tool. Shiki upgrade can be a separate future enhancement spec.

#### Performance Considerations

- Current startup target: <50ms for `--version` (achieved via lazy imports)
- Pager spawn: negligible (~1ms via posix_spawn)
- cli-highlight: negligible per code block
- shiki: +50-200ms upfront, fast per block after init
- Line number calculation: O(n) string split, negligible
- Box-drawing decoration: pure string manipulation, negligible

**Key risk:** None of the proposed changes should impact `--version` startup time since all new code paths are behind the rendering branch (lazy loaded).

## Codebase Analysis

### Existing Patterns

| Pattern | Location | Relevant |
|---------|----------|----------|
| Lazy module loading | `src/index.ts:158` | `await import("./renderer.js")` -- keeps `--version` fast |
| marked + marked-terminal | `src/renderer.ts` | Current rendering pipeline |
| Mermaid pre-processing | `src/renderer.ts:34-40` | Regex replace before marked parse |
| Error handling | `src/index.ts` | ErrorType enum + formatError pattern |
| CLI arg parsing | `src/index.ts:71-106` | parseArgs pure function |
| Output | `src/index.ts:160` | `console.log(output)` -- single output point |

### Key Integration Points

1. **`src/index.ts:160`** -- `console.log(output)` is the single output point. This is where pager piping replaces direct console output.
2. **`src/renderer.ts:30-57`** -- `render()` function returns the full ANSI string. Decoration layer wraps this output.
3. **`src/renderer.ts:45-49`** -- `markedTerminal()` call. The second argument (highlightOptions) is currently not passed. This is where theme customization hooks in.
4. **Marked v12 token-based API** -- `code({ text, lang, escaped })` renderer can be overridden via `marked.use()`.

### Dependencies

Already in project (no new deps needed for MVP):
- `marked` v12.0.2 -- supports `marked.use({ renderer: { code() } })` override
- `marked-terminal` v7.3.0 -- uses cli-highlight v2.1.11 internally
- `chalk` v5.3.0 -- for ANSI styling of decorations

Potential new dependencies:
- None required for MVP
- `@shikijs/cli` -- optional future upgrade for highlighting quality

### Constraints

- Bun runtime -- `Bun.spawn` for pager (well-supported, posix_spawn based)
- `--version` must stay <50ms (lazy loading pattern already in place)
- Binary compilation via `bun build --compile` -- all deps must be bundleable
- macOS/Linux target -- `less` universally available
- Windows: `less` not guaranteed -- needs fallback to direct output

## Related Specs

| Spec | Relevance | Overlap | mayNeedUpdate |
|------|-----------|---------|---------------|
| `mdview` | **High** | Same project, same rendering pipeline | false |

The `mdview` spec is the original project spec (now complete). It established the current architecture. The bat-style-output spec extends it without conflicting. No updates needed to the mdview spec.

## Quality Commands

| Type | Command | Source |
|------|---------|--------|
| Test | `bun test` | package.json scripts.test |
| TypeCheck | `bun tsc --noEmit` | package.json scripts.typecheck |
| Build | `bun build src/index.ts --compile --outfile mdview` | package.json scripts.build |
| Lint | Not found | -- |
| E2E Test | Not found | -- |

**Local Quality Check**: `bun tsc --noEmit && bun test && bun build src/index.ts --compile --outfile mdview`

## Feasibility Assessment

| Aspect | Assessment | Notes |
|--------|------------|-------|
| Technical Viability | **High** | All pieces exist; well-understood patterns (git/bat pager, box-drawing chars, marked renderer override) |
| Effort Estimate | **M** (Medium) | Pager + decorations + code block enhancement + tests. ~3-5 implementation tasks. |
| Risk Level | **Low** | No new heavy dependencies for MVP. Bun.spawn is proven. marked-terminal is extensible. |
| Startup Impact | **None** | All new code behind lazy-loaded render path |

## Recommendations for Requirements

1. **Start with pager integration** -- spawn `less -RFX` with smart TTY detection and `--paging` flag. This is the highest-impact, lowest-risk change and unlocks comfortable viewing of long documents.

2. **Add bat-style decorations as a decorator module** -- file header, line numbers, grid borders as a separate `src/decorator.ts` that wraps rendered output. Use chalk + Unicode box chars. Make components toggleable via `--style` flag (matching bat's API).

3. **Keep cli-highlight for MVP** -- it is already integrated via marked-terminal and provides good-enough highlighting. Override marked's `code()` renderer only if bat-style per-block decorations (language label, mini line numbers) are desired. Defer shiki upgrade to a future spec.

4. **Smart output detection** -- suppress decorations and colors when piped to non-TTY (like bat does). Respect `NO_COLOR`, `FORCE_COLOR` env vars.

5. **Add `--plain` / `-p` flag** -- equivalent to bat's plain mode (no decorations, just rendered markdown). Useful for piping.

## Open Questions

1. Should line numbers apply to the entire rendered markdown output, or only to code blocks within it? (bat numbers the source file lines; for markdown rendering, numbering the output lines makes more sense)
2. Should the file header show the filename only, or include metadata like file size and last modified?
3. Should `--style` flag syntax match bat exactly (`numbers,grid,header`) or use a simplified version?
4. Is Windows support required? (affects pager fallback strategy)
5. Should there be a `--theme` flag for code block highlighting themes?

## Sources

- [sharkdp/bat README](https://github.com/sharkdp/bat)
- [bat man page](https://man.archlinux.org/man/bat.1.en)
- [syntect library](https://github.com/trishume/syntect)
- [marked-terminal GitHub](https://github.com/mikaelbr/marked-terminal)
- [cli-highlight GitHub](https://github.com/felixfbecker/cli-highlight)
- [shiki documentation](https://shiki.style/packages/cli)
- [shiki GitHub](https://github.com/shikijs/shiki)
- [shiki performance guide](https://shiki.style/guide/best-performance)
- [Bun spawn docs](https://bun.com/docs/runtime/child-process)
- [Node.js child_process docs](https://nodejs.org/api/child_process.html)
- [git pager.c source](https://github.com/git/git/blob/master/pager.c)
- [Git-style pager implementation](https://samrat.me/2019-10-28-git-style-pager/)
- [marked.js using_pro](https://marked.js.org/using_pro)
- [boxen npm](https://www.npmjs.com/package/boxen)
- [cli-boxes npm](https://www.npmjs.com/package/cli-boxes)
- [less-pager-mini](https://libraries.io/npm/less-pager-mini)
- [npm-compare: syntax highlighters](https://npm-compare.com/highlight.js,prismjs,react-syntax-highlighter,shiki)
