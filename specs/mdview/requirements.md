---
spec: mdview
phase: requirements
created: 2026-02-01
generated: auto
---

# Requirements: mdview

## Summary

CLI tool that renders Markdown files in the terminal with styling and Mermaid diagram support. Differentiator: only terminal markdown viewer with Mermaid support.

## User Stories

### US-1: View Markdown File
As a developer, I want to view a markdown file with proper formatting so that I can read documentation without leaving the terminal.

**Acceptance Criteria**:
- AC-1.1: `mdview README.md` renders the file with headers, bold, italic, lists, code blocks styled
- AC-1.2: Tables render with box-drawing characters
- AC-1.3: Code blocks show syntax highlighting
- AC-1.4: Output respects terminal width

### US-2: View Mermaid Diagrams
As a developer, I want Mermaid diagrams rendered as ASCII art so that I can understand flowcharts and diagrams in the terminal.

**Acceptance Criteria**:
- AC-2.1: ```mermaid blocks detected and processed separately
- AC-2.2: Valid mermaid code renders as ASCII art
- AC-2.3: Invalid mermaid shows raw code with error message
- AC-2.4: Other code blocks unaffected

### US-3: Read from Stdin
As a developer, I want to pipe markdown content to mdview so that I can view remote or generated markdown.

**Acceptance Criteria**:
- AC-3.1: `cat file.md | mdview -` renders piped content
- AC-3.2: `curl url | mdview -` works for remote content
- AC-3.3: Empty stdin shows helpful message

### US-4: Get Help and Version
As a user, I want to see help and version information so that I can learn usage and check installed version.

**Acceptance Criteria**:
- AC-4.1: `mdview --help` shows usage, options, examples
- AC-4.2: `mdview -h` same as `--help`
- AC-4.3: `mdview --version` shows version number
- AC-4.4: `mdview -v` same as `--version`

### US-5: Handle Errors Gracefully
As a user, I want clear error messages so that I can understand and fix problems.

**Acceptance Criteria**:
- AC-5.1: Missing file shows "File not found: <path>"
- AC-5.2: Invalid file path shows helpful error
- AC-5.3: No arguments shows help
- AC-5.4: Non-zero exit code on error

## Functional Requirements

| ID | Requirement | Priority | Source |
|----|-------------|----------|--------|
| FR-1 | Parse and render markdown with marked + marked-terminal | Must | US-1 |
| FR-2 | Detect ```mermaid blocks via regex | Must | US-2 |
| FR-3 | Render mermaid to ASCII via beautiful-mermaid | Must | US-2 |
| FR-4 | Fallback to raw code if mermaid fails | Must | US-2 |
| FR-5 | Read file path from CLI argument | Must | US-1 |
| FR-6 | Read content from stdin when `-` passed | Must | US-3 |
| FR-7 | Show help on `--help` or `-h` | Must | US-4 |
| FR-8 | Show version on `--version` or `-v` | Must | US-4 |
| FR-9 | Show help when no arguments | Should | US-5 |
| FR-10 | Exit with code 1 on error | Must | US-5 |
| FR-11 | Respect terminal width for wrapping | Should | US-1 |
| FR-12 | Compile to standalone binary | Should | - |

## Non-Functional Requirements

| ID | Requirement | Category |
|----|-------------|----------|
| NFR-1 | Startup time <50ms for compiled binary | Performance |
| NFR-2 | Handle files up to 1MB without hanging | Performance |
| NFR-3 | Test coverage >80% for core modules | Quality |
| NFR-4 | TypeScript strict mode enabled | Quality |

## Out of Scope
- Interactive/pager mode (like less)
- File watching/live reload
- Custom themes
- Multiple file rendering
- Export to other formats

## Dependencies
- Bun runtime (tested with ^1.1.0)
- marked ^12.0.0
- marked-terminal ^7.0.0
- beautiful-mermaid ^0.1.0
- chalk ^5.3.0
