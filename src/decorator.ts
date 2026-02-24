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

/**
 * Build a dimmed file header line
 *
 * @param filename - Path to the file being displayed
 * @returns Formatted header string
 */
export function buildHeader(filename: string): string {
  return chalk.dim(`File: ${path.basename(filename)}`);
}

/**
 * Build top grid border using box-drawing characters
 *
 * @param width - Total border width in characters
 * @param gutterWidth - Gutter column width (0 if numbers disabled)
 * @param numbersEnabled - Whether line numbers are shown
 * @returns Top border string
 */
export function buildTopBorder(
  width: number,
  gutterWidth: number,
  numbersEnabled: boolean,
): string {
  if (numbersEnabled) {
    // gutter area + space + junction + space + remaining content
    const gutterFill = "─".repeat(gutterWidth + 1);
    const remaining = width - gutterWidth - 4; // -1 space -1 junction -1 space -1 gutter pad
    const contentFill = "─".repeat(Math.max(0, remaining));
    return `${gutterFill}┬${contentFill}`;
  }
  return "─".repeat(width);
}

/**
 * Build bottom grid border using box-drawing characters
 *
 * @param width - Total border width in characters
 * @param gutterWidth - Gutter column width (0 if numbers disabled)
 * @param numbersEnabled - Whether line numbers are shown
 * @returns Bottom border string
 */
export function buildBottomBorder(
  width: number,
  gutterWidth: number,
  numbersEnabled: boolean,
): string {
  if (numbersEnabled) {
    const gutterFill = "─".repeat(gutterWidth + 1);
    const remaining = width - gutterWidth - 4;
    const contentFill = "─".repeat(Math.max(0, remaining));
    return `${gutterFill}┴${contentFill}`;
  }
  return "─".repeat(width);
}

/**
 * Decorate rendered content with bat-style header, line numbers, and grid
 *
 * Assembles optional components based on style flags:
 * - header: dimmed "File: filename" line
 * - numbers: right-aligned line numbers with │ separator
 * - grid: top/bottom borders using box-drawing characters
 *
 * @param content - Rendered markdown content
 * @param options - Decoration options (filename, width, style flags)
 * @returns Decorated string ready for terminal output
 */
export function decorate(content: string, options: DecorateOptions): string {
  const { filename, width, style } = options;
  let lines = content.split("\n");

  const gutter = style.numbers ? gutterWidthFor(lines.length) : 0;

  if (style.numbers) {
    lines = addLineNumbers(lines, gutter);
  }

  const parts: string[] = [];

  if (style.header && filename) {
    parts.push(buildHeader(filename));
  }

  if (style.grid) {
    parts.push(buildTopBorder(width, gutter, style.numbers));
  }

  parts.push(...lines);

  if (style.grid) {
    parts.push(buildBottomBorder(width, gutter, style.numbers));
  }

  return parts.join("\n");
}
