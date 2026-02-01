---
spec: mdview
phase: research
created: 2026-02-01
generated: auto
---

# Research: mdview

## Executive Summary

Building mdview is highly feasible. All dependencies (marked, marked-terminal, beautiful-mermaid, chalk) are mature npm packages. Bun provides fast TypeScript execution and native binary compilation. Main risk: beautiful-mermaid is newer library, needs POC validation.

## Codebase Analysis

### Existing Patterns
- Greenfield project, no existing code
- PROMPT.md provides clear architecture: `src/index.ts`, `src/renderer.ts`, `src/mermaid.ts`

### Dependencies

| Package | Version | Purpose | Maturity |
|---------|---------|---------|----------|
| marked | ^12.0.0 | Markdown AST parsing | Mature, widely used |
| marked-terminal | ^7.0.0 | Terminal renderer for marked | Stable, active |
| beautiful-mermaid | ^0.1.0 | Mermaid to ASCII | Newer, needs validation |
| chalk | ^5.3.0 | Terminal colors | Mature, standard |
| bun | native | Runtime + compiler | Production ready |

### Constraints
- Terminal width detection via `process.stdout.columns`
- Mermaid rendering may fail on complex diagrams - need graceful fallback
- Stdin reading requires special handling with Bun
- Compiled binary must include all deps

## Feasibility Assessment

| Aspect | Assessment | Notes |
|--------|------------|-------|
| Technical Viability | High | All deps exist and work together |
| Effort Estimate | M | ~15-20 tasks, core is straightforward |
| Risk Level | Low | Main risk is beautiful-mermaid edge cases |

## Key Technical Findings

### marked-terminal Integration
```typescript
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";

marked.use(markedTerminal({
  reflowText: true,
  width: process.stdout.columns || 80
}));

const output = marked.parse(markdown);
```

### Mermaid Block Detection
```typescript
const MERMAID_REGEX = /```mermaid\n([\s\S]*?)```/g;
```

### Bun CLI Argument Parsing
```typescript
const args = Bun.argv.slice(2);
// Bun.argv[0] = bun, Bun.argv[1] = script
```

### Stdin Reading with Bun
```typescript
const stdin = await Bun.stdin.text();
```

### Binary Compilation
```bash
bun build src/index.ts --compile --outfile mdview
```

## Recommendations
1. Start with POC validating marked-terminal + beautiful-mermaid integration
2. Implement graceful fallback for mermaid parsing failures
3. Add comprehensive tests before refactoring
4. Use Bun's built-in test runner for consistency
