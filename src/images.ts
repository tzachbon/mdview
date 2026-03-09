/**
 * Native image rendering via timg
 */

import path from "path"
import { fileURLToPath } from "url"
import type { PagingMode } from "./pager.js"

export type ImagePixelMode = "quarter" | "half" | "kitty" | "iterm"
export type ImageRenderMode = "auto" | "always" | "never"

export interface ImageOptions {
  mode?: ImageRenderMode
  width?: number
  pixelMode?: ImagePixelMode
  center?: boolean
}

export interface ImageContext {
  cwd: string
  stdoutIsTTY: boolean
  paging: PagingMode
  terminalWidth: number
  options?: ImageOptions
}

interface ResolvedImageSource {
  displaySource: string
  resolvedPath?: string
  unsupportedReason?: string
}

const IMG_TAG_REGEX = /<img\b[^>]*>/gi
const FENCED_BLOCK_REGEX = /(```[\s\S]*?```|~~~[\s\S]*?~~~)/g
const REMOTE_SCHEME_REGEX = /^[a-zA-Z][a-zA-Z\d+.-]*:/
const WINDOWS_DRIVE_REGEX = /^[a-zA-Z]:[\\/]/
const MARKDOWN_ESCAPE_REGEX = /[[\]\\]/g
const TEXT_DECODER = new TextDecoder()

export function convertHtmlImages(markdown: string): string {
  const chunks: string[] = []
  let lastIndex = 0

  for (const match of markdown.matchAll(FENCED_BLOCK_REGEX)) {
    const index = match.index ?? 0
    chunks.push(rewriteHtmlImageTags(markdown.slice(lastIndex, index)))
    chunks.push(match[0])
    lastIndex = index + match[0].length
  }

  chunks.push(rewriteHtmlImageTags(markdown.slice(lastIndex)))

  return chunks.join("")
}

export function renderImage(
  href: string,
  alt: string,
  title: string | null,
  ctx: ImageContext,
): string {
  const normalized = normalizeImageSource(href, ctx.cwd)
  const imageName = alt.trim() || basenameForDisplay(normalized.displaySource)

  if (normalized.unsupportedReason) {
    return formatFallback(normalized.displaySource, imageName, title)
  }

  const imageOptions = resolveImageOptions(ctx)
  if (!shouldRenderNatively(imageOptions.mode, ctx.stdoutIsTTY)) {
    return formatFallback(normalized.displaySource, imageName, title)
  }

  const timgPath = Bun.which("timg")
  if (!timgPath || !normalized.resolvedPath) {
    return formatFallback(normalized.displaySource, imageName, title)
  }

  const command = [
    timgPath,
    ...buildTimgArgs(imageOptions, ctx),
    normalized.resolvedPath,
  ]

  try {
    const result = Bun.spawnSync(command, {
      stdout: "pipe",
      stderr: "pipe",
    })

    if (result.exitCode !== 0) {
      return formatFallback(normalized.displaySource, imageName, title)
    }

    const output = TEXT_DECODER.decode(result.stdout).replace(/\n+$/, "")
    if (!output.trim()) {
      return formatFallback(normalized.displaySource, imageName, title)
    }

    return output
  } catch {
    return formatFallback(normalized.displaySource, imageName, title)
  }
}

function rewriteHtmlImageTags(segment: string): string {
  return segment.replace(IMG_TAG_REGEX, (tag) => {
    const src = extractAttribute(tag, "src")
    if (!src) {
      return tag
    }

    const alt = escapeMarkdownText(extractAttribute(tag, "alt") ?? "")
    const title = extractAttribute(tag, "title")
    const href = escapeMarkdownHref(src)

    if (title) {
      return `![${alt}](<${href}> "${escapeMarkdownTitle(title)}")`
    }

    return `![${alt}](<${href}>)`
  })
}

function extractAttribute(tag: string, name: string): string | null {
  const regex = new RegExp(
    `${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>` + "`" + `]+))`,
    "i",
  )
  const match = regex.exec(tag)
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null
}

function escapeMarkdownText(text: string): string {
  return text.replace(MARKDOWN_ESCAPE_REGEX, "\\$&")
}

function escapeMarkdownHref(href: string): string {
  return href.replace(/[<>]/g, (char) => (char === "<" ? "%3C" : "%3E"))
}

function escapeMarkdownTitle(title: string): string {
  return title.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
}

function normalizeImageSource(
  href: string,
  cwd: string,
): ResolvedImageSource {
  const displaySource = stripOuterAngleBrackets(href.trim())

  if (!displaySource) {
    return { displaySource: href, unsupportedReason: "empty" }
  }

  if (WINDOWS_DRIVE_REGEX.test(displaySource)) {
    return {
      displaySource,
      resolvedPath: path.resolve(displaySource),
    }
  }

  if (displaySource.startsWith("file://")) {
    try {
      return {
        displaySource,
        resolvedPath: fileURLToPath(displaySource),
      }
    } catch {
      return { displaySource, unsupportedReason: "invalid-file-url" }
    }
  }

  if (REMOTE_SCHEME_REGEX.test(displaySource)) {
    return { displaySource, unsupportedReason: "remote" }
  }

  if (path.isAbsolute(displaySource)) {
    return { displaySource, resolvedPath: displaySource }
  }

  return {
    displaySource,
    resolvedPath: path.resolve(cwd, displaySource),
  }
}

function stripOuterAngleBrackets(value: string): string {
  if (value.startsWith("<") && value.endsWith(">")) {
    return value.slice(1, -1)
  }

  return value
}

function basenameForDisplay(source: string): string {
  const trimmedSource = source.replace(/[?#].*$/, "")
  const basename = path.basename(trimmedSource)
  return basename || "image"
}

function formatFallback(
  href: string,
  alt: string,
  title: string | null,
): string {
  const lines = [`[image: ${alt || "image"}]`, `source: ${href}`]

  if (title) {
    lines.push(`title: ${title}`)
  }

  return lines.join("\n")
}

function shouldRenderNatively(
  mode: ImageRenderMode,
  stdoutIsTTY: boolean,
): boolean {
  if (mode === "never") {
    return false
  }

  if (mode === "always") {
    return true
  }

  return stdoutIsTTY
}

function resolveImageOptions(ctx: ImageContext): Required<ImageOptions> {
  const mode = ctx.options?.mode ?? "auto"
  const requestedPixelMode = ctx.options?.pixelMode ?? "quarter"
  const pixelMode =
    ctx.paging !== "never" &&
    (requestedPixelMode === "kitty" || requestedPixelMode === "iterm")
      ? "quarter"
      : requestedPixelMode

  return {
    mode,
    width: resolveImageWidth(ctx.options?.width, ctx.terminalWidth),
    pixelMode,
    center: ctx.options?.center ?? false,
  }
}

function resolveImageWidth(
  requestedWidth: number | undefined,
  terminalWidth: number,
): number {
  if (typeof requestedWidth === "number" && Number.isFinite(requestedWidth)) {
    return Math.max(1, Math.floor(requestedWidth))
  }

  return Math.max(1, terminalWidth - 4)
}

function buildTimgArgs(
  options: Required<ImageOptions>,
  ctx: ImageContext,
): string[] {
  const args = [`-p${mapPixelMode(options.pixelMode)}`, `-g${options.width}x`]

  if (options.center) {
    args.push("-C")
  }

  if (ctx.paging !== "never") {
    args.push("-bnone")
  }

  return args
}

function mapPixelMode(pixelMode: ImagePixelMode): string {
  switch (pixelMode) {
    case "half":
      return "h"
    case "kitty":
      return "k"
    case "iterm":
      return "i"
    default:
      return "q"
  }
}
