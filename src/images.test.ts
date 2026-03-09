/**
 * Unit tests for images.ts
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { convertHtmlImages, renderImage } from "./images"

const originalSpawnSync = Bun.spawnSync
const originalWhich = Bun.which

function createSpawnResult(stdout: string, exitCode = 0) {
  return {
    stdout: Buffer.from(stdout),
    stderr: Buffer.from(""),
    exitCode,
    success: exitCode === 0,
    resourceUsage: {} as never,
    pid: 1,
  }
}

describe("convertHtmlImages", () => {
  test("converts html img tags to markdown images", () => {
    const markdown =
      'before <img src="image.png" alt="Logo" title="Brand"> after'

    const result = convertHtmlImages(markdown)

    expect(result).toContain('![Logo](<image.png> "Brand")')
  })

  test("does not rewrite img tags inside fenced code blocks", () => {
    const markdown = [
      "```html",
      '<img src="image.png" alt="Logo">',
      "```",
    ].join("\n")

    const result = convertHtmlImages(markdown)

    expect(result).toContain('<img src="image.png" alt="Logo">')
    expect(result).not.toContain("![Logo]")
  })
})

describe("renderImage", () => {
  beforeEach(() => {
    Bun.which = originalWhich
    Bun.spawnSync = originalSpawnSync
  })

  afterEach(() => {
    Bun.which = originalWhich
    Bun.spawnSync = originalSpawnSync
  })

  test("renders local relative paths through timg", () => {
    let seenCommand: string[] = []

    Bun.which = () => "/usr/bin/timg"
    Bun.spawnSync = ((cmd: string[]) => {
      seenCommand = cmd
      return createSpawnResult("IMAGE DATA\n")
    }) as unknown as typeof Bun.spawnSync

    const result = renderImage("images/logo.png", "Logo", null, {
      cwd: "/tmp/project",
      stdoutIsTTY: true,
      paging: "never",
      terminalWidth: 80,
    })

    expect(result).toBe("IMAGE DATA")
    expect(seenCommand[0]).toBe("/usr/bin/timg")
    expect(seenCommand).toContain("-pq")
    expect(seenCommand).toContain("-g76x")
    expect(seenCommand[seenCommand.length - 1]).toBe(
      "/tmp/project/images/logo.png",
    )
  })

  test("uses cwd for stdin-style relative paths", () => {
    let seenCommand: string[] = []

    Bun.which = () => "/usr/bin/timg"
    Bun.spawnSync = ((cmd: string[]) => {
      seenCommand = cmd
      return createSpawnResult("IMAGE DATA\n")
    }) as unknown as typeof Bun.spawnSync

    renderImage("./logo.png", "Logo", null, {
      cwd: "/workspace",
      stdoutIsTTY: true,
      paging: "never",
      terminalWidth: 60,
    })

    expect(seenCommand[seenCommand.length - 1]).toBe("/workspace/logo.png")
  })

  test("normalizes file urls", () => {
    let seenCommand: string[] = []

    Bun.which = () => "/usr/bin/timg"
    Bun.spawnSync = ((cmd: string[]) => {
      seenCommand = cmd
      return createSpawnResult("IMAGE DATA\n")
    }) as unknown as typeof Bun.spawnSync

    renderImage("file:///tmp/logo.png", "Logo", null, {
      cwd: "/workspace",
      stdoutIsTTY: true,
      paging: "never",
      terminalWidth: 60,
    })

    expect(seenCommand[seenCommand.length - 1]).toBe("/tmp/logo.png")
  })

  test("falls back when timg is unavailable", () => {
    Bun.which = () => null

    const result = renderImage("logo.png", "Logo", null, {
      cwd: "/tmp/project",
      stdoutIsTTY: true,
      paging: "never",
      terminalWidth: 80,
    })

    expect(result).toContain("[image: Logo]")
    expect(result).toContain("source: logo.png")
  })

  test("falls back for remote urls", () => {
    const result = renderImage("https://example.com/logo.png", "Logo", null, {
      cwd: "/tmp/project",
      stdoutIsTTY: true,
      paging: "never",
      terminalWidth: 80,
    })

    expect(result).toContain("[image: Logo]")
    expect(result).toContain("source: https://example.com/logo.png")
  })

  test("uses title in fallback output", () => {
    const result = renderImage("logo.png", "Logo", "Brand", {
      cwd: "/tmp/project",
      stdoutIsTTY: false,
      paging: "never",
      terminalWidth: 80,
    })

    expect(result).toContain("title: Brand")
  })

  test("uses configured width and centering", () => {
    let seenCommand: string[] = []

    Bun.which = () => "/usr/bin/timg"
    Bun.spawnSync = ((cmd: string[]) => {
      seenCommand = cmd
      return createSpawnResult("IMAGE DATA\n")
    }) as unknown as typeof Bun.spawnSync

    renderImage("logo.png", "Logo", null, {
      cwd: "/tmp/project",
      stdoutIsTTY: true,
      paging: "never",
      terminalWidth: 80,
      options: {
        width: 42,
        center: true,
        pixelMode: "half",
      },
    })

    expect(seenCommand).toContain("-ph")
    expect(seenCommand).toContain("-g42x")
    expect(seenCommand).toContain("-C")
  })

  test("downgrades kitty mode while paging", () => {
    let seenCommand: string[] = []

    Bun.which = () => "/usr/bin/timg"
    Bun.spawnSync = ((cmd: string[]) => {
      seenCommand = cmd
      return createSpawnResult("IMAGE DATA\n")
    }) as unknown as typeof Bun.spawnSync

    renderImage("logo.png", "Logo", null, {
      cwd: "/tmp/project",
      stdoutIsTTY: true,
      paging: "always",
      terminalWidth: 80,
      options: {
        pixelMode: "kitty",
      },
    })

    expect(seenCommand).toContain("-pq")
    expect(seenCommand).toContain("-bnone")
  })

  test("falls back when timg exits with an error", () => {
    Bun.which = () => "/usr/bin/timg"
    Bun.spawnSync = (() =>
      ({
        ...createSpawnResult("", 1),
        stderr: Buffer.from("boom"),
      })) as unknown as typeof Bun.spawnSync

    const result = renderImage("logo.png", "Logo", null, {
      cwd: "/tmp/project",
      stdoutIsTTY: true,
      paging: "never",
      terminalWidth: 80,
    })

    expect(result).toContain("[image: Logo]")
    expect(result).toContain("source: logo.png")
  })
})
