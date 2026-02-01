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
});
