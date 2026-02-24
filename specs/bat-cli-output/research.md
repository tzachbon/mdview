---
spec: bat-cli-output
phase: research
created: 2026-02-24
generated: auto
---

# Research: bat-cli-output

## Executive Summary

mdview's bat-style output implementation is **95% complete**. The decorator module (file headers, line numbers, grid borders), pager integration (less -RFX with smart TTY detection), and CLI flags (--paging, --plain, --style) are all implemented and working as of the POC commit (bc091df). The remaining work is primarily **testing and documentation**: unit tests for decorator.ts and pager.ts, updated help text, and edge case verification.

## External Research

### How bat Works

bat is a Rust CLI using syntect (Sublime Text grammars) for syntax highlighting. Key architecture:

1. Input: reads files or stdin
2. Language detection: by file extension, first line, or `--language` flag
3. Syntax highlighting: syntect → ANSI escape codes
4. Decorations: line numbers, git diff markers, file headers, grid borders (via `--style`)
5. Smart output detection: if piped to non-interactive terminal, decorations/colors suppressed
6. Pager: output piped to `less -RFX` by default

**bat `--style` components**: header, header-filesize, grid, numbers, changes, snip, rule

**Pager behavior**: `less -R -F -X` (raw ANSI, quit-if-one-screen, no-init). Configurable via `BAT_PAGER` env or `--pager` flag. `--paging=never` to disable.

### Best Practices

- Layer decorations post-render (don't modify the rendering pipeline)
- Use system `less` for paging (universal on macOS/Linux, proven, handles ANSI)
- Respect `NO_COLOR` and `FORCE_COLOR` env vars
- Suppress decorations when piped to non-TTY
- Keep `--version` fast via lazy loading

### Prior Art

- bat: Rust, syntect, less -RFX, comprehensive --style system
- git: Uses pager for all output (diff, log, etc.) via fork+pipe
- cli-highlight: Already in mdview via marked-terminal; good-enough syntax highlighting

### Pitfalls to Avoid

- Don't replace marked-terminal; layer decorations around its output
- Don't add heavy dependencies (shiki adds 1-6MB, startup impact)
- Don't break piped output (decoration suppression is critical)
- Don't impact --version startup time (lazy loading pattern must be preserved)

## Codebase Analysis

### Existing Patterns

| Pattern | Location | Status |
|---------|----------|--------|
| Lazy module loading | `src/index.ts` | `await import("./renderer.js")` keeps --version fast |
| marked + marked-terminal | `src/renderer.ts` | Core rendering pipeline, unchanged |
| Decorator module | `src/decorator.ts` | **NEW** - header, numbers, grid |
| Pager module | `src/pager.ts` | **NEW** - less spawning, TTY detection |
| CLI arg parsing | `src/index.ts` | Enhanced with --paging, --plain, --style |
| Error handling | `src/index.ts` | ErrorType enum + formatError pattern |

### Dependencies

**Production (4)**: chalk v5.3.0, marked v12.0.0, marked-terminal v7.3.0, beautiful-mermaid v0.1.0
**No new dependencies required.**

### Constraints

- Bun runtime (≥1.0.0), ES modules
- Binary compilation via `bun build --compile`
- `--version` must stay <50ms (lazy loading)
- macOS/Linux target (less available; Windows needs fallback)

### What's Already Built

| Feature | Module | Status |
|---------|--------|--------|
| Pager (less -RFX) | src/pager.ts | Complete |
| Smart TTY detection | src/pager.ts | Complete |
| Env var chain (MDVIEW_PAGER > PAGER > less) | src/pager.ts | Complete |
| File header decoration | src/decorator.ts | Complete |
| Line numbers with gutter | src/decorator.ts | Complete |
| Grid borders | src/decorator.ts | Complete |
| Style component parsing (--style) | src/decorator.ts | Complete |
| --paging flag | src/index.ts | Complete |
| --plain flag | src/index.ts | Complete |
| Pipeline integration | src/index.ts | Complete |
| End-to-end POC | Manual testing | Complete |

## Related Specs

| Spec | Relevance | Relationship | May Need Update |
|------|-----------|-------------|-----------------|
| bat-style-output | High | Prior spec; all artifacts generated, implementation complete | No |
| mdview | High | Original project spec; established architecture | No |

## Quality Commands

| Type | Command | Source |
|------|---------|--------|
| Test | `bun test` | package.json |
| TypeCheck | `bun tsc --noEmit` | package.json |
| Build | `bun build src/index.ts --compile --outfile mdview` | package.json |
| Full CI | `bun tsc --noEmit && bun test && bun build src/index.ts --compile --outfile mdview` | Composite |

## Feasibility Assessment

| Aspect | Assessment | Notes |
|--------|-----------|-------|
| Technical Viability | **High** | Core features already implemented |
| Risk Level | **Low** | Remaining work is tests + docs |
| Effort | **S** (Small) | Unit tests, help text update, edge case verification |
| Startup Impact | **None** | All new code behind lazy-loaded render path |

## Recommendations for Requirements

1. **Focus on test coverage** -- Create unit tests for decorator.ts and pager.ts (currently 0% coverage on new modules)
2. **Update HELP text** -- Current --help doesn't document --paging, --plain, --style flags
3. **Verify edge cases** -- Empty files, very long lines, ANSI in content, large files
4. **Integration tests** -- Test CLI flag combinations end-to-end
5. **Keep scope tight** -- Implementation is done; this spec should focus on hardening, not new features

## Open Questions

1. Should HELP text match bat's exact flag documentation style?
2. What test coverage threshold is acceptable? (prior spec targeted >80%)
3. Should edge cases like Windows support be in scope?

## Sources

- [sharkdp/bat README](https://github.com/sharkdp/bat)
- [bat man page](https://man.archlinux.org/man/bat.1.en)
- [Bun spawn docs](https://bun.com/docs/runtime/child-process)
- [marked-terminal GitHub](https://github.com/mikaelbr/marked-terminal)
- [cli-highlight GitHub](https://github.com/felixfbecker/cli-highlight)
- Prior spec: specs/bat-style-output/research.md
