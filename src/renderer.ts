/**
 * Markdown renderer with Mermaid diagram support
 * Uses marked + marked-terminal for styling, with pre-processing for mermaid blocks
 */

import { marked, type MarkedExtension } from "marked";
import { markedTerminal } from "marked-terminal";
import { renderMermaid } from "./mermaid.js";

// Regex to detect mermaid code blocks
// Matches ```mermaid followed by content until closing ```
const MERMAID_BLOCK_REGEX = /```mermaid\n([\s\S]*?)```/g;

/**
 * Renders markdown string to styled terminal output
 * Mermaid blocks are converted to ASCII art before rendering
 *
 * @param markdown - Raw markdown string
 * @param width - Terminal width (defaults to process.stdout.columns or 80)
 * @returns Styled string for terminal output
 */
export function render(markdown: string, width?: number): string {
  const terminalWidth = width ?? process.stdout.columns ?? 80;

  // Pre-process: Replace mermaid blocks with ASCII art
  const processedMarkdown = markdown.replace(
    MERMAID_BLOCK_REGEX,
    (_match, code: string) => {
      const asciiArt = renderMermaid(code.trim());
      // Wrap in a code block to preserve formatting
      return "```\n" + asciiArt + "\n```";
    }
  );

  // Configure marked with terminal renderer
  // Type assertion needed: marked-terminal v7 types don't match @types/marked-terminal v6
  marked.use(
    markedTerminal({
      reflowText: true,
      width: terminalWidth,
    }) as MarkedExtension
  );

  // Render markdown to styled terminal output
  const output = marked.parse(processedMarkdown);

  // marked.parse returns string | Promise<string>, but with sync usage it's string
  return output as string;
}
