/**
 * Markdown renderer with Mermaid diagram support
 * Uses marked + marked-terminal for styling, with pre-processing for mermaid blocks
 */

import { marked, type MarkedExtension } from "marked";
import { markedTerminal } from "marked-terminal";
import {
  convertHtmlImages,
  renderImage,
  type ImageOptions,
} from "./images.js";
import { renderMermaid } from "./mermaid.js";
import type { PagingMode } from "./pager.js";

/**
 * Options for rendering markdown
 */
export interface RenderOptions {
  /** Terminal width in characters (defaults to process.stdout.columns or 80) */
  width?: number;
  /** Directory used to resolve relative image paths */
  sourceDir?: string;
  /** Whether stdout is a TTY */
  stdoutIsTTY?: boolean;
  /** Current paging mode */
  paging?: PagingMode;
  /** Image rendering options */
  images?: ImageOptions;
}

// Regex to detect mermaid code blocks
// Matches ```mermaid followed by content until closing ```
const MERMAID_BLOCK_REGEX = /```mermaid\n([\s\S]*?)```/g;

/**
 * Renders markdown string to styled terminal output
 * Mermaid blocks are converted to ASCII art before rendering
 *
 * @param markdown - Raw markdown string
 * @param options - Render options (width, etc.)
 * @returns Styled string for terminal output
 */
export function render(markdown: string, options?: RenderOptions): string {
  const terminalWidth: number = options?.width ?? process.stdout.columns ?? 80;
  const sourceDir = options?.sourceDir ?? process.cwd();
  const stdoutIsTTY = options?.stdoutIsTTY ?? (process.stdout.isTTY === true);
  const paging = options?.paging ?? "auto";
  const imageOutputs = new Map<string, string>();
  let imageIndex = 0;

  // Pre-process HTML image tags before markdown parsing.
  const markdownWithHtmlImages = convertHtmlImages(markdown);

  // Pre-process: Replace mermaid blocks with ASCII art
  const processedMarkdown = markdownWithHtmlImages.replace(
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
    markedTerminal(
      {
        reflowText: true,
        width: terminalWidth,
        image: (href: string, title: string | null, text: string) => {
          const placeholder = `MDVIEW_IMAGE_${imageIndex++}_TOKEN`;
          imageOutputs.set(
            placeholder,
            renderImage(href, text, title, {
              cwd: sourceDir,
              stdoutIsTTY,
              paging,
              terminalWidth,
              options: options?.images,
            }),
          );
          return placeholder;
        },
      } as any,
    ) as MarkedExtension
  );

  // Render markdown to styled terminal output
  const output = marked.parse(processedMarkdown);

  // marked.parse returns string | Promise<string>, but with sync usage it's string
  let rendered = output as string;

  for (const [placeholder, imageOutput] of imageOutputs) {
    rendered = rendered.replaceAll(placeholder, imageOutput);
  }

  return rendered;
}
