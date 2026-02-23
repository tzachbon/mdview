/**
 * Decorator module for bat-style output decorations
 * Adds file headers, line numbers, and grid borders to rendered output
 */

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
