/**
 * Decorator module for bat-style output decorations
 * Adds file headers, line numbers, and grid borders to rendered output
 */

import chalk from "chalk";
import path from "path";

/**
 * Individual style components that can be toggled independently
 */
export interface StyleComponents {
  header: boolean;
  numbers: boolean;
  grid: boolean;
}

/**
 * Options for decorating rendered output
 */
export interface DecorateOptions {
  /** Filename to display in header (omitted for stdin) */
  filename?: string;
  /** Terminal width in characters */
  width: number;
  /** Which decoration components to enable */
  style: StyleComponents;
}

/** Valid component names for --style flag */
const VALID_COMPONENTS: ReadonlySet<string> = new Set([
  "header",
  "numbers",
  "grid",
]);

/**
 * Parse a --style flag value into individual style components
 *
 * Supported formats:
 * - "full" -> all components enabled
 * - "plain" -> all components disabled
 * - "numbers" -> only that component enabled
 * - "header,grid" -> comma-separated list of components
 *
 * @param styleStr - Raw style string from CLI flag
 * @returns Parsed style components
 * @throws Error if an invalid component name is provided
 */
export function parseStyle(styleStr: string): StyleComponents {
  if (styleStr === "full") {
    return { header: true, numbers: true, grid: true };
  }

  if (styleStr === "plain") {
    return { header: false, numbers: false, grid: false };
  }

  const result: StyleComponents = { header: false, numbers: false, grid: false };
  const parts = styleStr.split(",");

  for (const part of parts) {
    const name = part.trim();
    if (!VALID_COMPONENTS.has(name)) {
      throw new Error(
        `unknown style component: "${name}". Valid: header, numbers, grid`
      );
    }
    result[name as keyof StyleComponents] = true;
  }

  return result;
}

/**
 * Calculate gutter width (number of digits) needed for line count
 */
function gutterWidthFor(lineCount: number): number {
  return Math.max(1, Math.ceil(Math.log10(lineCount + 1)));
}

/**
 * Prepend right-aligned, dimmed line numbers with a box-drawing separator
 *
 * @param lines - Array of content lines
 * @param gutterWidth - Number of characters for the line number column
 * @returns Lines with prepended line numbers
 */
export function addLineNumbers(
  lines: string[],
  gutterWidth: number,
): string[] {
  return lines.map((line, i) => {
    const num = String(i + 1).padStart(gutterWidth, " ");
    return `${chalk.dim(num)} │ ${line}`;
  });
}
