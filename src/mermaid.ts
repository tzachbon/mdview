/**
 * Mermaid diagram to ASCII art renderer
 * Uses beautiful-mermaid library for conversion
 */

import { renderMermaidAscii } from "beautiful-mermaid";

/**
 * Renders mermaid diagram code to ASCII art
 * On failure, returns the raw code in a box with error message
 *
 * @param code - Mermaid diagram source code
 * @returns ASCII art representation or fallback error box
 */
export function renderMermaid(code: string): string {
  try {
    return renderMermaidAscii(code);
  } catch (error) {
    // Fallback: return raw code in a box with error message
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const lines = code.trim().split("\n");
    const maxWidth = Math.max(
      ...lines.map((l) => l.length),
      errorMessage.length + 7
    );
    const border = "+" + "-".repeat(maxWidth + 2) + "+";
    const padLine = (line: string) =>
      "| " + line.padEnd(maxWidth) + " |";

    return [
      border,
      padLine(`Error: ${errorMessage}`),
      padLine(""),
      ...lines.map(padLine),
      border,
    ].join("\n");
  }
}
