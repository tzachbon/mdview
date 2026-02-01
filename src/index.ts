#!/usr/bin/env bun
/**
 * mdview CLI - Render Markdown files in the terminal with Mermaid support
 */

import { render } from "./renderer.js";

/**
 * Error types for consistent error handling
 */
enum ErrorType {
  NO_INPUT = "NO_INPUT",
  FILE_NOT_FOUND = "FILE_NOT_FOUND",
  FILE_READ_ERROR = "FILE_READ_ERROR",
  STDIN_READ_ERROR = "STDIN_READ_ERROR",
  UNEXPECTED_ERROR = "UNEXPECTED_ERROR",
}

/**
 * Format error message with consistent prefix
 */
function formatError(type: ErrorType, detail?: string): string {
  const messages: Record<ErrorType, string> = {
    [ErrorType.NO_INPUT]: "no input file specified",
    [ErrorType.FILE_NOT_FOUND]: `file not found: ${detail}`,
    [ErrorType.FILE_READ_ERROR]: `failed to read file: ${detail}`,
    [ErrorType.STDIN_READ_ERROR]: "failed to read from stdin",
    [ErrorType.UNEXPECTED_ERROR]: detail || "an unexpected error occurred",
  };
  return `mdview: error: ${messages[type]}`;
}

/**
 * Exit with error message and code 1
 */
function exitWithError(type: ErrorType, detail?: string): never {
  console.error(formatError(type, detail));
  process.exit(1);
}

// Read version from package.json
const pkg = await import("../package.json");
const VERSION = pkg.version;

const HELP = `
mdview - Render Markdown in the terminal with Mermaid diagram support

USAGE:
  mdview <file>          Render a markdown file
  mdview -               Read from stdin
  mdview --help, -h      Show this help message
  mdview --version, -v   Show version

EXAMPLES:
  mdview README.md
  cat README.md | mdview -
  echo "# Hello" | mdview -
`.trim();

/**
 * Parsed CLI arguments
 */
export interface ParsedArgs {
  showHelp: boolean;
  showVersion: boolean;
  file: string | null;
  useStdin: boolean;
}

/**
 * Parse CLI arguments into structured form
 * Pure function - no side effects, fully testable
 */
export function parseArgs(args: string[]): ParsedArgs {
  const result: ParsedArgs = {
    showHelp: false,
    showVersion: false,
    file: null,
    useStdin: false,
  };

  if (args.length === 0) {
    return result;
  }

  const arg = args[0] as string;

  // Handle --help / -h
  if (arg === "--help" || arg === "-h") {
    result.showHelp = true;
    return result;
  }

  // Handle --version / -v
  if (arg === "--version" || arg === "-v") {
    result.showVersion = true;
    return result;
  }

  // Handle stdin
  if (arg === "-") {
    result.useStdin = true;
    return result;
  }

  // Handle file input
  result.file = arg;
  return result;
}

async function main(): Promise<void> {
  // Parse args: Bun.argv is [bun, script, ...args]
  const args = parseArgs(Bun.argv.slice(2));

  if (!args.showHelp && !args.showVersion && !args.file && !args.useStdin) {
    console.error(formatError(ErrorType.NO_INPUT));
    console.error("Usage: mdview <file> or mdview - for stdin");
    console.error("Run 'mdview --help' for more information");
    process.exit(1);
  }

  // Handle --help / -h
  if (args.showHelp) {
    console.log(HELP);
    return;
  }

  // Handle --version / -v
  if (args.showVersion) {
    console.log(`mdview v${VERSION}`);
    return;
  }

  let markdown: string;

  // Handle stdin
  if (args.useStdin) {
    try {
      markdown = await Bun.stdin.text();
    } catch {
      exitWithError(ErrorType.STDIN_READ_ERROR);
    }
  } else {
    // Handle file input
    const filePath = args.file as string; // Safe: checked above
    const file = Bun.file(filePath);

    // Check if file exists
    if (!(await file.exists())) {
      exitWithError(ErrorType.FILE_NOT_FOUND, filePath);
    }

    try {
      markdown = await file.text();
    } catch {
      exitWithError(ErrorType.FILE_READ_ERROR, filePath);
    }
  }

  // Render and output
  const output = render(markdown);
  console.log(output);
}

// Only run main when executed directly, not when imported for testing
if (import.meta.main) {
  main().catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    exitWithError(ErrorType.UNEXPECTED_ERROR, message);
  });
}
