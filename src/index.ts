#!/usr/bin/env bun
/**
 * mdview CLI - Render Markdown files in the terminal with Mermaid support
 */

import { render } from "./renderer.js";

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
    console.error("Error: No input file specified");
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
    } catch (err) {
      console.error("Error: Failed to read from stdin");
      process.exit(1);
    }
  } else {
    // Handle file input
    const filePath = args.file as string; // Safe: checked above
    const file = Bun.file(filePath);

    // Check if file exists
    if (!(await file.exists())) {
      console.error(`Error: File not found: ${filePath}`);
      process.exit(1);
    }

    try {
      markdown = await file.text();
    } catch (err) {
      console.error(`Error: Failed to read file: ${filePath}`);
      process.exit(1);
    }
  }

  // Render and output
  const output = render(markdown);
  console.log(output);
}

main().catch((err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});
