# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

mdview is a terminal Markdown viewer with Mermaid diagram support. It renders Markdown files with full styling and converts Mermaid diagrams to ASCII art. Built with Bun and TypeScript.

## Commands

```bash
bun install              # Install dependencies
bun test                 # Run tests
bun test --coverage      # Run tests with coverage
bun run typecheck        # Type check
bun run build            # Compile to standalone binary

# Development
bun run src/index.ts <file.md>   # Run without building
```

## Architecture

**Three-module design:**

1. **src/index.ts** - CLI entry point
   - Argument parsing via pure `parseArgs()` function
   - Error handling with typed `ErrorType` enum
   - Lazy-loads renderer to optimize `--version` startup time

2. **src/renderer.ts** - Markdown processing
   - Pre-processes content to extract Mermaid blocks using regex `/```mermaid\n([\s\S]*?)```/g`
   - Converts Mermaid to ASCII art before passing to marked
   - Uses `marked` + `marked-terminal` for terminal-styled output

3. **src/mermaid.ts** - Mermaid conversion wrapper
   - Wraps `beautiful-mermaid.renderMermaidAscii()`
   - Returns error box with original code on failure (graceful degradation)

**Key patterns:**
- Pure functions for testability (`parseArgs()`, `formatError()`)
- Lazy imports for performance (renderer only loaded when needed)
- Graceful fallback for invalid Mermaid diagrams
