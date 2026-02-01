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

async function main(): Promise<void> {
  // Parse args: Bun.argv is [bun, script, ...args]
  const args = Bun.argv.slice(2);

  if (args.length === 0) {
    console.error("Error: No input file specified");
    console.error("Usage: mdview <file> or mdview - for stdin");
    console.error("Run 'mdview --help' for more information");
    process.exit(1);
  }

  const arg = args[0] as string; // Safe: length check above guarantees this

  // Handle --help / -h
  if (arg === "--help" || arg === "-h") {
    console.log(HELP);
    return;
  }

  // Handle --version / -v
  if (arg === "--version" || arg === "-v") {
    console.log(`mdview v${VERSION}`);
    return;
  }

  let markdown: string;

  // Handle stdin
  if (arg === "-") {
    try {
      markdown = await Bun.stdin.text();
    } catch (err) {
      console.error("Error: Failed to read from stdin");
      process.exit(1);
    }
  } else {
    // Handle file input
    const filePath: string = arg;
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
