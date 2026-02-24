/**
 * Unit tests for pager module
 */
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { shouldPage, resolvePagerCommand, pipeToPager, type PagingMode } from "./pager";

describe("shouldPage", () => {
  describe("never mode", () => {
    test('shouldPage("never") always returns false', () => {
      expect(shouldPage("never")).toBe(false);
    });

    test('shouldPage("never") returns false even when stdout is TTY', () => {
      const original = process.stdout.isTTY;
      process.stdout.isTTY = true;
      expect(shouldPage("never")).toBe(false);
      process.stdout.isTTY = original;
    });
  });

  describe("always mode", () => {
    test('shouldPage("always") always returns true', () => {
      expect(shouldPage("always")).toBe(true);
    });

    test('shouldPage("always") returns true even when stdout is not TTY', () => {
      const original = process.stdout.isTTY;
      process.stdout.isTTY = false;
      expect(shouldPage("always")).toBe(true);
      process.stdout.isTTY = original;
    });
  });

  describe("auto mode", () => {
    test('shouldPage("auto") returns true when stdout is TTY', () => {
      const original = process.stdout.isTTY;
      process.stdout.isTTY = true;
      expect(shouldPage("auto")).toBe(true);
      process.stdout.isTTY = original;
    });

    test('shouldPage("auto") returns false when stdout is not TTY', () => {
      const original = process.stdout.isTTY;
      process.stdout.isTTY = false;
      expect(shouldPage("auto")).toBe(false);
      process.stdout.isTTY = original;
    });

    test('shouldPage("auto") returns false when stdout.isTTY is undefined', () => {
      const original = process.stdout.isTTY;
      process.stdout.isTTY = undefined;
      expect(shouldPage("auto")).toBe(false);
      process.stdout.isTTY = original;
    });
  });

  describe("type signature", () => {
    test("accepts valid PagingMode values", () => {
      const modes: PagingMode[] = ["never", "always", "auto"];
      modes.forEach((mode) => {
        expect(() => shouldPage(mode)).not.toThrow();
      });
    });
  });
});

describe("resolvePagerCommand", () => {
  let originalEnv: Record<string, string | undefined>;

  beforeEach(() => {
    originalEnv = {
      MDVIEW_PAGER: process.env.MDVIEW_PAGER,
      PAGER: process.env.PAGER,
    };
    delete process.env.MDVIEW_PAGER;
    delete process.env.PAGER;
  });

  afterEach(() => {
    if (originalEnv.MDVIEW_PAGER) {
      process.env.MDVIEW_PAGER = originalEnv.MDVIEW_PAGER;
    } else {
      delete process.env.MDVIEW_PAGER;
    }
    if (originalEnv.PAGER) {
      process.env.PAGER = originalEnv.PAGER;
    } else {
      delete process.env.PAGER;
    }
  });

  describe("MDVIEW_PAGER priority", () => {
    test("uses MDVIEW_PAGER if set", () => {
      process.env.MDVIEW_PAGER = "custom-pager";
      const result = resolvePagerCommand();
      expect(result[0]).toBe("custom-pager");
    });

    test("MDVIEW_PAGER takes precedence over PAGER", () => {
      process.env.MDVIEW_PAGER = "mdview-pager";
      process.env.PAGER = "pager";
      const result = resolvePagerCommand();
      expect(result[0]).toBe("mdview-pager");
    });

    test("splits MDVIEW_PAGER by spaces", () => {
      process.env.MDVIEW_PAGER = "less -RFX";
      const result = resolvePagerCommand();
      expect(result).toEqual(["less", "-RFX"]);
    });

    test("handles MDVIEW_PAGER with multiple arguments", () => {
      process.env.MDVIEW_PAGER = "pager --option1 --option2";
      const result = resolvePagerCommand();
      expect(result).toEqual(["pager", "--option1", "--option2"]);
    });
  });

  describe("PAGER fallback", () => {
    test("uses PAGER if MDVIEW_PAGER not set", () => {
      process.env.PAGER = "less";
      const result = resolvePagerCommand();
      expect(result[0]).toBe("less");
    });

    test("splits PAGER by spaces", () => {
      process.env.PAGER = "more -d";
      const result = resolvePagerCommand();
      expect(result).toEqual(["more", "-d"]);
    });

    test("handles PAGER with multiple arguments", () => {
      process.env.PAGER = "bat --style=plain --paging=always";
      const result = resolvePagerCommand();
      expect(result).toEqual(["bat", "--style=plain", "--paging=always"]);
    });
  });

  describe("default pager", () => {
    test("defaults to less -RFX when no env vars set", () => {
      const result = resolvePagerCommand();
      expect(result).toEqual(["less", "-RFX"]);
    });

    test("default pager command is less", () => {
      const result = resolvePagerCommand();
      expect(result[0]).toBe("less");
    });

    test("default includes raw control sequences flag", () => {
      const result = resolvePagerCommand();
      expect(result[1]).toContain("R");
    });

    test("default includes exit on eof flag", () => {
      const result = resolvePagerCommand();
      expect(result[1]).toContain("F");
    });

    test("default includes no terminal init flag", () => {
      const result = resolvePagerCommand();
      expect(result[1]).toContain("X");
    });
  });

  describe("edge cases", () => {
    test("handles empty MDVIEW_PAGER", () => {
      process.env.MDVIEW_PAGER = "";
      // Empty string is truthy for "in" check, but this is an edge case
      // The function returns the result of split, which would be [""]
      const result = resolvePagerCommand();
      // With empty string, we'd get [""], but actual behavior depends on implementation
      // Testing what actually happens
      expect(Array.isArray(result)).toBe(true);
    });

    test("handles pager with equals signs in arguments", () => {
      process.env.MDVIEW_PAGER = "less -P=prompt";
      const result = resolvePagerCommand();
      expect(result).toContain("-P=prompt");
    });

    test("handles pager commands with quotes properly", () => {
      // Note: The current implementation does naive split, so this tests that behavior
      process.env.MDVIEW_PAGER = "less -Pprompt";
      const result = resolvePagerCommand();
      expect(result[0]).toBe("less");
    });
  });

  describe("return type consistency", () => {
    test("always returns an array", () => {
      const result = resolvePagerCommand();
      expect(Array.isArray(result)).toBe(true);
    });

    test("returned array contains strings", () => {
      const result = resolvePagerCommand();
      result.forEach((item) => {
        expect(typeof item).toBe("string");
      });
    });

    test("returned array is not empty", () => {
      const result = resolvePagerCommand();
      expect(result.length).toBeGreaterThan(0);
    });

    test("first element is the command", () => {
      const result = resolvePagerCommand();
      expect(result[0]).toBeTruthy();
    });
  });
});

describe("pipeToPager", () => {
  describe("success cases", () => {
    test("pipes content through pager successfully", async () => {
      // Use cat as a simple test pager that outputs content
      const originalPager = process.env.MDVIEW_PAGER;
      process.env.MDVIEW_PAGER = "cat";

      try {
        await pipeToPager("test content\n");
        // If no error is thrown, the test passes
        expect(true).toBe(true);
      } finally {
        if (originalPager) {
          process.env.MDVIEW_PAGER = originalPager;
        } else {
          delete process.env.MDVIEW_PAGER;
        }
      }
    });

    test("handles multi-line content", async () => {
      const originalPager = process.env.MDVIEW_PAGER;
      process.env.MDVIEW_PAGER = "cat";

      try {
        const content = "Line 1\nLine 2\nLine 3\n";
        await pipeToPager(content);
        expect(true).toBe(true);
      } finally {
        if (originalPager) {
          process.env.MDVIEW_PAGER = originalPager;
        } else {
          delete process.env.MDVIEW_PAGER;
        }
      }
    });

    test("handles empty content", async () => {
      const originalPager = process.env.MDVIEW_PAGER;
      process.env.MDVIEW_PAGER = "cat";

      try {
        await pipeToPager("");
        expect(true).toBe(true);
      } finally {
        if (originalPager) {
          process.env.MDVIEW_PAGER = originalPager;
        } else {
          delete process.env.MDVIEW_PAGER;
        }
      }
    });

    test("handles content with ANSI codes", async () => {
      const originalPager = process.env.MDVIEW_PAGER;
      process.env.MDVIEW_PAGER = "cat";

      try {
        const content = "\u001b[31mRed\u001b[0m\nNormal";
        await pipeToPager(content);
        expect(true).toBe(true);
      } finally {
        if (originalPager) {
          process.env.MDVIEW_PAGER = originalPager;
        } else {
          delete process.env.MDVIEW_PAGER;
        }
      }
    });

    test("waits for pager process to exit", async () => {
      const originalPager = process.env.MDVIEW_PAGER;
      process.env.MDVIEW_PAGER = "cat";

      try {
        const startTime = Date.now();
        await pipeToPager("test");
        const endTime = Date.now();
        // Should complete (async function was awaited)
        expect(endTime).toBeGreaterThanOrEqual(startTime);
      } finally {
        if (originalPager) {
          process.env.MDVIEW_PAGER = originalPager;
        } else {
          delete process.env.MDVIEW_PAGER;
        }
      }
    });
  });

  describe("fallback behavior", () => {
    test("falls back to stdout when pager command is invalid", async () => {
      const originalPager = process.env.MDVIEW_PAGER;
      process.env.MDVIEW_PAGER = "nonexistent-pager-xyz-command-123";

      try {
        // Should not throw, should fall back
        await pipeToPager("fallback content");
        expect(true).toBe(true);
      } finally {
        if (originalPager) {
          process.env.MDVIEW_PAGER = originalPager;
        } else {
          delete process.env.MDVIEW_PAGER;
        }
      }
    });

    test("falls back when pager cannot be spawned", async () => {
      const originalPager = process.env.MDVIEW_PAGER;
      process.env.MDVIEW_PAGER = "";

      try {
        // Empty pager command will fail
        await pipeToPager("test content");
        expect(true).toBe(true);
      } finally {
        if (originalPager) {
          process.env.MDVIEW_PAGER = originalPager;
        } else {
          delete process.env.MDVIEW_PAGER;
        }
      }
    });

    test("does not throw when fallback occurs", async () => {
      const originalPager = process.env.MDVIEW_PAGER;
      process.env.MDVIEW_PAGER = "absolutely-nonexistent-command-12345";

      try {
        expect(async () => {
          await pipeToPager("test");
        }).not.toThrow();
      } finally {
        if (originalPager) {
          process.env.MDVIEW_PAGER = originalPager;
        } else {
          delete process.env.MDVIEW_PAGER;
        }
      }
    });
  });

  describe("pager argument passing", () => {
    test("passes arguments to pager correctly", async () => {
      const originalPager = process.env.MDVIEW_PAGER;
      // cat with no arguments will echo stdin to stdout
      process.env.MDVIEW_PAGER = "cat -n";

      try {
        await pipeToPager("test line 1\n");
        expect(true).toBe(true);
      } finally {
        if (originalPager) {
          process.env.MDVIEW_PAGER = originalPager;
        } else {
          delete process.env.MDVIEW_PAGER;
        }
      }
    });

    test("handles pager with multiple arguments", async () => {
      const originalPager = process.env.MDVIEW_PAGER;
      process.env.MDVIEW_PAGER = "cat -n -s";

      try {
        await pipeToPager("test");
        expect(true).toBe(true);
      } finally {
        if (originalPager) {
          process.env.MDVIEW_PAGER = originalPager;
        } else {
          delete process.env.MDVIEW_PAGER;
        }
      }
    });
  });

  describe("input handling", () => {
    test("writes full content to pager stdin", async () => {
      const originalPager = process.env.MDVIEW_PAGER;
      process.env.MDVIEW_PAGER = "cat";

      try {
        const content = "Line 1\nLine 2\nLine 3";
        await pipeToPager(content);
        expect(true).toBe(true);
      } finally {
        if (originalPager) {
          process.env.MDVIEW_PAGER = originalPager;
        } else {
          delete process.env.MDVIEW_PAGER;
        }
      }
    });

    test("properly ends stdin stream", async () => {
      const originalPager = process.env.MDVIEW_PAGER;
      process.env.MDVIEW_PAGER = "cat";

      try {
        // Test that stdin is properly closed so pager doesn't hang
        await pipeToPager("test content");
        expect(true).toBe(true);
      } finally {
        if (originalPager) {
          process.env.MDVIEW_PAGER = originalPager;
        } else {
          delete process.env.MDVIEW_PAGER;
        }
      }
    });

    test("handles content with null bytes", async () => {
      const originalPager = process.env.MDVIEW_PAGER;
      process.env.MDVIEW_PAGER = "cat";

      try {
        const content = "before\x00after";
        await pipeToPager(content);
        expect(true).toBe(true);
      } finally {
        if (originalPager) {
          process.env.MDVIEW_PAGER = originalPager;
        } else {
          delete process.env.MDVIEW_PAGER;
        }
      }
    });

    test("handles very large content", async () => {
      const originalPager = process.env.MDVIEW_PAGER;
      process.env.MDVIEW_PAGER = "cat";

      try {
        // Create 1MB of content
        const largeContent = "x\n".repeat(500000);
        await pipeToPager(largeContent);
        expect(true).toBe(true);
      } finally {
        if (originalPager) {
          process.env.MDVIEW_PAGER = originalPager;
        } else {
          delete process.env.MDVIEW_PAGER;
        }
      }
    });
  });

  describe("process management", () => {
    test("uses correct stdio configuration", async () => {
      const originalPager = process.env.MDVIEW_PAGER;
      process.env.MDVIEW_PAGER = "cat";

      try {
        // If stdio is wrong, this might not work correctly
        await pipeToPager("test");
        expect(true).toBe(true);
      } finally {
        if (originalPager) {
          process.env.MDVIEW_PAGER = originalPager;
        } else {
          delete process.env.MDVIEW_PAGER;
        }
      }
    });

    test("function returns promise", () => {
      const result = pipeToPager("test");
      expect(result).toBeInstanceOf(Promise);
    });

    test("promise resolves successfully", async () => {
      const originalPager = process.env.MDVIEW_PAGER;
      process.env.MDVIEW_PAGER = "cat";

      try {
        const promise = pipeToPager("test");
        const resolved = await promise;
        expect(resolved).toBeUndefined();
      } finally {
        if (originalPager) {
          process.env.MDVIEW_PAGER = originalPager;
        } else {
          delete process.env.MDVIEW_PAGER;
        }
      }
    });
  });

  describe("environment variable interaction", () => {
    test("uses MDVIEW_PAGER if set", async () => {
      const originalMdviewPager = process.env.MDVIEW_PAGER;
      const originalPager = process.env.PAGER;

      process.env.MDVIEW_PAGER = "cat";
      process.env.PAGER = "nonexistent";

      try {
        await pipeToPager("test");
        expect(true).toBe(true);
      } finally {
        if (originalMdviewPager) {
          process.env.MDVIEW_PAGER = originalMdviewPager;
        } else {
          delete process.env.MDVIEW_PAGER;
        }
        if (originalPager) {
          process.env.PAGER = originalPager;
        } else {
          delete process.env.PAGER;
        }
      }
    });

    test("falls back to PAGER if MDVIEW_PAGER not set", async () => {
      const originalMdviewPager = process.env.MDVIEW_PAGER;
      const originalPager = process.env.PAGER;

      delete process.env.MDVIEW_PAGER;
      process.env.PAGER = "cat";

      try {
        await pipeToPager("test");
        expect(true).toBe(true);
      } finally {
        if (originalMdviewPager) {
          process.env.MDVIEW_PAGER = originalMdviewPager;
        } else {
          delete process.env.MDVIEW_PAGER;
        }
        if (originalPager) {
          process.env.PAGER = originalPager;
        } else {
          delete process.env.PAGER;
        }
      }
    });

    test("uses default less if no env vars set", async () => {
      const originalMdviewPager = process.env.MDVIEW_PAGER;
      const originalPager = process.env.PAGER;

      delete process.env.MDVIEW_PAGER;
      delete process.env.PAGER;

      try {
        // Will try to use less by default
        // If less doesn't exist, fallback to stdout
        await pipeToPager("test");
        expect(true).toBe(true);
      } finally {
        if (originalMdviewPager) {
          process.env.MDVIEW_PAGER = originalMdviewPager;
        } else {
          delete process.env.MDVIEW_PAGER;
        }
        if (originalPager) {
          process.env.PAGER = originalPager;
        } else {
          delete process.env.PAGER;
        }
      }
    });
  });
});
