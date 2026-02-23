/**
 * Pager support for piping rendered output through a terminal pager
 * Resolves pager command from environment or defaults to less
 */

/**
 * Paging mode: "never" disables, "always" enables, "auto" enables when stdout is a TTY
 */
export type PagingMode = "never" | "always" | "auto";

/**
 * Determines whether output should be piped through a pager
 *
 * @param mode - Paging mode to evaluate
 * @returns true if output should be paged
 */
export function shouldPage(mode: PagingMode): boolean {
  if (mode === "never") return false;
  if (mode === "always") return true;
  // auto: page only when stdout is a TTY
  return process.stdout.isTTY === true;
}

/** Default pager command when no environment variable is set */
const DEFAULT_PAGER: string[] = ["less", "-RFX"];

/**
 * Resolves the pager command to use, checking environment variables
 * Priority: MDVIEW_PAGER > PAGER > ["less", "-RFX"]
 *
 * @returns Array of command and arguments for the pager
 */
export function resolvePagerCommand(): string[] {
  const mdviewPager = process.env["MDVIEW_PAGER"];
  if (mdviewPager) {
    return mdviewPager.split(" ");
  }

  const pager = process.env["PAGER"];
  if (pager) {
    return pager.split(" ");
  }

  return DEFAULT_PAGER;
}
