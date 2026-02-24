/**
 * Integration tests for CLI (index.ts)
 */
import { describe, test, expect } from "bun:test";
import { parseArgs, formatError, ErrorType, type ParsedArgs } from "./index";

describe("formatError", () => {
  test("NO_INPUT returns error message", () => {
    const result = formatError(ErrorType.NO_INPUT);
    expect(result).toBe("mdview: error: no input file specified");
  });

  test("FILE_NOT_FOUND returns error with filename", () => {
    const result = formatError(ErrorType.FILE_NOT_FOUND, "missing.md");
    expect(result).toBe("mdview: error: file not found: missing.md");
  });

  test("FILE_READ_ERROR returns error with filename", () => {
    const result = formatError(ErrorType.FILE_READ_ERROR, "unreadable.md");
    expect(result).toBe("mdview: error: failed to read file: unreadable.md");
  });

  test("STDIN_READ_ERROR returns error message", () => {
    const result = formatError(ErrorType.STDIN_READ_ERROR);
    expect(result).toBe("mdview: error: failed to read from stdin");
  });

  test("UNEXPECTED_ERROR returns custom message", () => {
    const result = formatError(ErrorType.UNEXPECTED_ERROR, "something went wrong");
    expect(result).toBe("mdview: error: something went wrong");
  });

  test("UNEXPECTED_ERROR without detail returns default", () => {
    const result = formatError(ErrorType.UNEXPECTED_ERROR);
    expect(result).toBe("mdview: error: an unexpected error occurred");
  });
});

describe("parseArgs", () => {
  describe("help flag", () => {
    test("--help sets showHelp to true", () => {
      const result = parseArgs(["--help"]);
      expect(result.showHelp).toBe(true);
      expect(result.showVersion).toBe(false);
      expect(result.file).toBeNull();
      expect(result.useStdin).toBe(false);
    });

    test("-h sets showHelp to true", () => {
      const result = parseArgs(["-h"]);
      expect(result.showHelp).toBe(true);
      expect(result.showVersion).toBe(false);
      expect(result.file).toBeNull();
      expect(result.useStdin).toBe(false);
    });
  });

  describe("version flag", () => {
    test("--version sets showVersion to true", () => {
      const result = parseArgs(["--version"]);
      expect(result.showVersion).toBe(true);
      expect(result.showHelp).toBe(false);
      expect(result.file).toBeNull();
      expect(result.useStdin).toBe(false);
    });

    test("-v sets showVersion to true", () => {
      const result = parseArgs(["-v"]);
      expect(result.showVersion).toBe(true);
      expect(result.showHelp).toBe(false);
      expect(result.file).toBeNull();
      expect(result.useStdin).toBe(false);
    });
  });

  describe("file argument", () => {
    test("single file argument sets file", () => {
      const result = parseArgs(["README.md"]);
      expect(result.file).toBe("README.md");
      expect(result.showHelp).toBe(false);
      expect(result.showVersion).toBe(false);
      expect(result.useStdin).toBe(false);
    });

    test("file path with directory sets file", () => {
      const result = parseArgs(["examples/test.md"]);
      expect(result.file).toBe("examples/test.md");
    });

    test("absolute path sets file", () => {
      const result = parseArgs(["/path/to/file.md"]);
      expect(result.file).toBe("/path/to/file.md");
    });
  });

  describe("stdin argument", () => {
    test("- sets useStdin to true", () => {
      const result = parseArgs(["-"]);
      expect(result.useStdin).toBe(true);
      expect(result.file).toBeNull();
      expect(result.showHelp).toBe(false);
      expect(result.showVersion).toBe(false);
    });
  });

  describe("no arguments", () => {
    test("empty args returns all false/null", () => {
      const result = parseArgs([]);
      expect(result.showHelp).toBe(false);
      expect(result.showVersion).toBe(false);
      expect(result.file).toBeNull();
      expect(result.useStdin).toBe(false);
    });
  });

  describe("argument precedence", () => {
    test("first argument wins for flags", () => {
      // --help comes first, should take precedence
      const result = parseArgs(["--help", "--version"]);
      expect(result.showHelp).toBe(true);
      expect(result.showVersion).toBe(false);
    });

    test("file argument is only first positional", () => {
      // Only first argument is considered
      const result = parseArgs(["file1.md", "file2.md"]);
      expect(result.file).toBe("file1.md");
    });
  });

  describe("--plain flag", () => {
    test("--plain sets plain to true", () => {
      const result = parseArgs(["--plain", "file.md"]);
      expect(result.plain).toBe(true);
      expect(result.file).toBe("file.md");
    });

    test("-p sets plain to true", () => {
      const result = parseArgs(["-p", "file.md"]);
      expect(result.plain).toBe(true);
      expect(result.file).toBe("file.md");
    });

    test("--plain works with stdin", () => {
      const result = parseArgs(["--plain", "-"]);
      expect(result.plain).toBe(true);
      expect(result.useStdin).toBe(true);
    });

    test("--plain is independent of file argument", () => {
      const result = parseArgs(["file.md", "--plain"]);
      expect(result.plain).toBe(true);
      expect(result.file).toBe("file.md");
    });
  });

  describe("--paging flag", () => {
    test("--paging=never disables paging", () => {
      const result = parseArgs(["--paging=never", "file.md"]);
      expect(result.paging).toBe("never");
      expect(result.file).toBe("file.md");
    });

    test("--paging=always enables paging", () => {
      const result = parseArgs(["--paging=always", "file.md"]);
      expect(result.paging).toBe("always");
      expect(result.file).toBe("file.md");
    });

    test("--paging=auto uses automatic detection", () => {
      const result = parseArgs(["--paging=auto", "file.md"]);
      expect(result.paging).toBe("auto");
      expect(result.file).toBe("file.md");
    });

    test("default paging mode is auto", () => {
      const result = parseArgs(["file.md"]);
      expect(result.paging).toBe("auto");
    });

    test("--paging with invalid value keeps default", () => {
      const result = parseArgs(["--paging=invalid", "file.md"]);
      expect(result.paging).toBe("auto");
      expect(result.file).toBe("file.md");
    });

    test("--paging=always with stdin", () => {
      const result = parseArgs(["--paging=always", "-"]);
      expect(result.paging).toBe("always");
      expect(result.useStdin).toBe(true);
    });

    test("--paging=never ignores TTY detection", () => {
      const result = parseArgs(["--paging=never", "file.md"]);
      expect(result.paging).toBe("never");
    });

    test("multiple paging flags, last one wins", () => {
      const result = parseArgs(["--paging=never", "--paging=always", "file.md"]);
      expect(result.paging).toBe("always");
    });
  });

  describe("--style flag", () => {
    test("--style=full enables all components", () => {
      const result = parseArgs(["--style=full", "file.md"]);
      expect(result.style).toBe("full");
      expect(result.file).toBe("file.md");
    });

    test("--style=plain disables all components", () => {
      const result = parseArgs(["--style=plain", "file.md"]);
      expect(result.style).toBe("plain");
    });

    test("--style=header enables only header", () => {
      const result = parseArgs(["--style=header", "file.md"]);
      expect(result.style).toBe("header");
    });

    test("--style=numbers enables only numbers", () => {
      const result = parseArgs(["--style=numbers", "file.md"]);
      expect(result.style).toBe("numbers");
    });

    test("--style=grid enables only grid", () => {
      const result = parseArgs(["--style=grid", "file.md"]);
      expect(result.style).toBe("grid");
    });

    test("--style with comma-separated components", () => {
      const result = parseArgs(["--style=header,numbers", "file.md"]);
      expect(result.style).toBe("header,numbers");
    });

    test("--style=header,numbers,grid", () => {
      const result = parseArgs(["--style=header,numbers,grid", "file.md"]);
      expect(result.style).toBe("header,numbers,grid");
    });

    test("default style is null", () => {
      const result = parseArgs(["file.md"]);
      expect(result.style).toBeNull();
    });

    test("--style=invalid is preserved as-is (parsing happens later)", () => {
      const result = parseArgs(["--style=invalid", "file.md"]);
      expect(result.style).toBe("invalid");
    });

    test("--style with spaces in components", () => {
      const result = parseArgs(["--style=header, numbers", "file.md"]);
      expect(result.style).toBe("header, numbers");
    });

    test("multiple --style flags, last one wins", () => {
      const result = parseArgs(["--style=header", "--style=numbers", "file.md"]);
      expect(result.style).toBe("numbers");
    });

    test("--style works with stdin", () => {
      const result = parseArgs(["--style=grid", "-"]);
      expect(result.style).toBe("grid");
      expect(result.useStdin).toBe(true);
    });

    test("--style and --plain together", () => {
      const result = parseArgs(["--style=header", "--plain", "file.md"]);
      expect(result.style).toBe("header");
      expect(result.plain).toBe(true);
    });
  });

  describe("flag combinations", () => {
    test("--plain and --paging together", () => {
      const result = parseArgs(["--plain", "--paging=never", "file.md"]);
      expect(result.plain).toBe(true);
      expect(result.paging).toBe("never");
    });

    test("--plain and --style together", () => {
      const result = parseArgs(["--plain", "--style=header", "file.md"]);
      expect(result.plain).toBe(true);
      expect(result.style).toBe("header");
    });

    test("all flags together", () => {
      const result = parseArgs([
        "--plain",
        "--paging=always",
        "--style=numbers",
        "file.md",
      ]);
      expect(result.plain).toBe(true);
      expect(result.paging).toBe("always");
      expect(result.style).toBe("numbers");
      expect(result.file).toBe("file.md");
    });

    test("flags in different order", () => {
      const result = parseArgs([
        "file.md",
        "--style=grid",
        "--plain",
        "--paging=never",
      ]);
      expect(result.file).toBe("file.md");
      expect(result.plain).toBe(true);
      expect(result.paging).toBe("never");
      expect(result.style).toBe("grid");
    });

    test("--help returns early, ignoring flags after it", () => {
      const result = parseArgs([
        "--style=header",
        "--plain",
        "--help",
        "file.md",
      ]);
      expect(result.showHelp).toBe(true);
      // Flags before --help are still processed
      expect(result.style).toBe("header");
      expect(result.plain).toBe(true);
    });

    test("--version returns early, ignoring flags after it", () => {
      const result = parseArgs([
        "--style=header",
        "--version",
        "file.md",
      ]);
      expect(result.showVersion).toBe(true);
      // Style flag is processed before --version
      expect(result.style).toBe("header");
    });
  });
});

describe("CLI integration", () => {
  const CLI_PATH = "./src/index.ts";

  describe("file reading", () => {
    test("reads and renders test.md successfully", async () => {
      const proc = Bun.spawn(["bun", "run", CLI_PATH, "examples/test.md"], {
        stdout: "pipe",
        stderr: "pipe",
        env: { ...process.env, FORCE_COLOR: "1" },
      });
      const exitCode = await proc.exited;
      const stdout = await new Response(proc.stdout).text();

      expect(exitCode).toBe(0);
      expect(stdout).toContain("Test Document");
      expect(stdout).toContain("Bold");
    });

    test("nonexistent file returns error with exit code 1", async () => {
      const proc = Bun.spawn(
        ["bun", "run", CLI_PATH, "nonexistent-file-xyz.md"],
        {
          stdout: "pipe",
          stderr: "pipe",
        }
      );
      const exitCode = await proc.exited;
      const stderr = await new Response(proc.stderr).text();

      expect(exitCode).toBe(1);
      expect(stderr).toContain("mdview: error:");
      expect(stderr).toContain("file not found");
    });
  });

  describe("help output", () => {
    test("--help shows usage info", async () => {
      const proc = Bun.spawn(["bun", "run", CLI_PATH, "--help"], {
        stdout: "pipe",
        stderr: "pipe",
      });
      const exitCode = await proc.exited;
      const stdout = await new Response(proc.stdout).text();

      expect(exitCode).toBe(0);
      expect(stdout).toContain("USAGE:");
      expect(stdout).toContain("mdview <file>");
      expect(stdout).toContain("--help");
      expect(stdout).toContain("--version");
    });

    test("-h shows usage info", async () => {
      const proc = Bun.spawn(["bun", "run", CLI_PATH, "-h"], {
        stdout: "pipe",
        stderr: "pipe",
      });
      const exitCode = await proc.exited;
      const stdout = await new Response(proc.stdout).text();

      expect(exitCode).toBe(0);
      expect(stdout).toContain("USAGE:");
    });

    test("--help documents --plain flag", async () => {
      const proc = Bun.spawn(["bun", "run", CLI_PATH, "--help"], {
        stdout: "pipe",
        stderr: "pipe",
      });
      const exitCode = await proc.exited;
      const stdout = await new Response(proc.stdout).text();

      expect(exitCode).toBe(0);
      expect(stdout).toContain("--plain");
    });

    test("--help documents --paging flag", async () => {
      const proc = Bun.spawn(["bun", "run", CLI_PATH, "--help"], {
        stdout: "pipe",
        stderr: "pipe",
      });
      const exitCode = await proc.exited;
      const stdout = await new Response(proc.stdout).text();

      expect(exitCode).toBe(0);
      expect(stdout).toContain("--paging");
    });

    test("--help documents --style flag", async () => {
      const proc = Bun.spawn(["bun", "run", CLI_PATH, "--help"], {
        stdout: "pipe",
        stderr: "pipe",
      });
      const exitCode = await proc.exited;
      const stdout = await new Response(proc.stdout).text();

      expect(exitCode).toBe(0);
      expect(stdout).toContain("--style");
    });
  });

  describe("version output", () => {
    test("--version shows version", async () => {
      const proc = Bun.spawn(["bun", "run", CLI_PATH, "--version"], {
        stdout: "pipe",
        stderr: "pipe",
      });
      const exitCode = await proc.exited;
      const stdout = await new Response(proc.stdout).text();

      expect(exitCode).toBe(0);
      expect(stdout).toContain("mdview v");
    });

    test("-v shows version", async () => {
      const proc = Bun.spawn(["bun", "run", CLI_PATH, "-v"], {
        stdout: "pipe",
        stderr: "pipe",
      });
      const exitCode = await proc.exited;
      const stdout = await new Response(proc.stdout).text();

      expect(exitCode).toBe(0);
      expect(stdout).toContain("mdview v");
    });
  });

  describe("no input error", () => {
    test("no arguments shows error", async () => {
      const proc = Bun.spawn(["bun", "run", CLI_PATH], {
        stdout: "pipe",
        stderr: "pipe",
      });
      const exitCode = await proc.exited;
      const stderr = await new Response(proc.stderr).text();

      expect(exitCode).toBe(1);
      expect(stderr).toContain("mdview: error:");
      expect(stderr).toContain("no input file specified");
    });
  });

  describe("stdin handling", () => {
    test("- flag reads from stdin", async () => {
      const proc = Bun.spawn(["bun", "run", CLI_PATH, "-"], {
        stdin: "pipe",
        stdout: "pipe",
        stderr: "pipe",
        env: { ...process.env, FORCE_COLOR: "1" },
      });

      // Write markdown to stdin using Bun's FileSink API
      proc.stdin.write("# Hello from stdin\n");
      proc.stdin.end();

      const exitCode = await proc.exited;
      const stdout = await new Response(proc.stdout).text();

      expect(exitCode).toBe(0);
      expect(stdout).toContain("Hello from stdin");
    });

    test("stdin with multiple lines", async () => {
      const proc = Bun.spawn(["bun", "run", CLI_PATH, "-"], {
        stdin: "pipe",
        stdout: "pipe",
        stderr: "pipe",
        env: { ...process.env, FORCE_COLOR: "1" },
      });

      const markdown = `# Title
## Subtitle
- Item 1
- Item 2
`;
      proc.stdin.write(markdown);
      proc.stdin.end();

      const exitCode = await proc.exited;
      const stdout = await new Response(proc.stdout).text();

      expect(exitCode).toBe(0);
      expect(stdout).toContain("Title");
      expect(stdout).toContain("Subtitle");
      expect(stdout).toContain("Item 1");
    });
  });

  describe("bat-style flags", () => {
    test("--plain produces output without decorations", async () => {
      const proc = Bun.spawn(
        ["bun", "run", CLI_PATH, "--plain", "examples/test.md"],
        {
          stdout: "pipe",
          stderr: "pipe",
          env: { ...process.env, FORCE_COLOR: "1" },
        }
      );
      const exitCode = await proc.exited;
      const stdout = await new Response(proc.stdout).text();

      expect(exitCode).toBe(0);
      expect(stdout).toContain("Test Document");
      // Decorator line-number pattern: "  1 │ " -- absent when --plain
      expect(stdout).not.toMatch(/^\s*\d+\s│\s/m);
      expect(stdout).not.toContain("File:");
    });

    test("--style=numbers produces line numbers without header", async () => {
      const proc = Bun.spawn(
        ["bun", "run", CLI_PATH, "--style=numbers", "examples/test.md"],
        {
          stdout: "pipe",
          stderr: "pipe",
          env: { ...process.env, FORCE_COLOR: "1" },
        }
      );
      const exitCode = await proc.exited;
      const stdout = await new Response(proc.stdout).text();

      expect(exitCode).toBe(0);
      // Decorator adds " │ " separator after line numbers
      expect(stdout).toContain(" │ ");
      expect(stdout).not.toContain("File:");
    });

    test("--style=header produces header without line numbers", async () => {
      const proc = Bun.spawn(
        ["bun", "run", CLI_PATH, "--style=header", "examples/test.md"],
        {
          stdout: "pipe",
          stderr: "pipe",
          env: { ...process.env, FORCE_COLOR: "1" },
        }
      );
      const exitCode = await proc.exited;
      const stdout = await new Response(proc.stdout).text();

      expect(exitCode).toBe(0);
      expect(stdout).toContain("File:");
      // No line number separator from decorator
      // Split to check content lines only (skip first line which is the header)
      const lines = stdout.split("\n").slice(1);
      const hasNumberedLine = lines.some((l) => /^\s*\d+\s│\s/.test(l));
      expect(hasNumberedLine).toBe(false);
    });
  });
});
