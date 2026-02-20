/**
 * Mermaid diagram to ASCII art renderer
 * Uses beautiful-mermaid library for conversion
 * Supports C4 diagrams with custom renderer
 */

import { renderMermaidAscii } from "beautiful-mermaid";
import { isC4Diagram, renderC4 } from "./c4.js";

/**
 * Result of a mermaid rendering operation
 */
export interface MermaidResult {
  /** Whether rendering succeeded */
  success: boolean;
  /** ASCII art output or error message */
  output: string;
}

/**
 * Renders mermaid diagram code to ASCII art
 * On failure, returns the raw code in a box with error message
 *
 * @param code - Mermaid diagram source code
 * @returns ASCII art representation or fallback error box
 */
export function renderMermaid(code: string): string {
  // Check if it's a C4 diagram first
  if (isC4Diagram(code)) {
    const c4Result = renderC4(code);
    if (c4Result) {
      return c4Result;
    }
    // If C4 parsing failed, fall through to error handling
  }
  
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
