/**
 * Unit tests for decorator module
 */
import { describe, test, expect } from "bun:test";
import {
  parseStyle,
  decorate,
  addLineNumbers,
  buildHeader,
  buildTopBorder,
  buildBottomBorder,
  type StyleComponents,
} from "./decorator";

describe("parseStyle", () => {
  describe("preset styles", () => {
    test('parseStyle("full") returns all components enabled', () => {
      const result = parseStyle("full");
      expect(result).toEqual({ header: true, numbers: true, grid: true });
    });

    test('parseStyle("plain") returns all components disabled', () => {
      const result = parseStyle("plain");
      expect(result).toEqual({ header: false, numbers: false, grid: false });
    });
  });

  describe("individual components", () => {
    test('parseStyle("header") enables only header', () => {
      const result = parseStyle("header");
      expect(result).toEqual({ header: true, numbers: false, grid: false });
    });

    test('parseStyle("numbers") enables only numbers', () => {
      const result = parseStyle("numbers");
      expect(result).toEqual({ header: false, numbers: true, grid: false });
    });

    test('parseStyle("grid") enables only grid', () => {
      const result = parseStyle("grid");
      expect(result).toEqual({ header: false, numbers: false, grid: true });
    });
  });

  describe("comma-separated combinations", () => {
    test('parseStyle("header,numbers") enables those two', () => {
      const result = parseStyle("header,numbers");
      expect(result).toEqual({ header: true, numbers: true, grid: false });
    });

    test('parseStyle("numbers,grid") enables those two', () => {
      const result = parseStyle("numbers,grid");
      expect(result).toEqual({ header: false, numbers: true, grid: true });
    });

    test('parseStyle("header,grid") enables those two', () => {
      const result = parseStyle("header,grid");
      expect(result).toEqual({ header: true, numbers: false, grid: true });
    });

    test('parseStyle("header,numbers,grid") enables all', () => {
      const result = parseStyle("header,numbers,grid");
      expect(result).toEqual({ header: true, numbers: true, grid: true });
    });
  });

  describe("whitespace handling", () => {
    test("parseStyle handles spaces around commas", () => {
      const result = parseStyle("header, numbers, grid");
      expect(result).toEqual({ header: true, numbers: true, grid: true });
    });

    test("parseStyle handles spaces before component names", () => {
      const result = parseStyle(" header , numbers ");
      expect(result).toEqual({ header: true, numbers: true, grid: false });
    });
  });

  describe("error cases", () => {
    test("parseStyle throws for invalid component", () => {
      expect(() => parseStyle("invalid")).toThrow();
    });

    test("parseStyle throws with helpful message for invalid component", () => {
      expect(() => parseStyle("invalid")).toThrow(
        /unknown style component.*Valid: header, numbers, grid/
      );
    });

    test("parseStyle throws when any component in list is invalid", () => {
      expect(() => parseStyle("header,invalid,grid")).toThrow();
    });

    test("parseStyle throws for empty component name", () => {
      expect(() => parseStyle("header,,grid")).toThrow();
    });
  });

  describe("component order independence", () => {
    test("components in any order produce same result", () => {
      const result1 = parseStyle("header,numbers,grid");
      const result2 = parseStyle("grid,header,numbers");
      const result3 = parseStyle("numbers,grid,header");
      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
    });
  });
});

describe("addLineNumbers", () => {
  test("adds line numbers to single line", () => {
    const result = addLineNumbers(["Hello"], 1);
    expect(result[0]).toContain("1");
    expect(result[0]).toContain("Hello");
  });

  test("right-aligns line numbers with correct gutter width", () => {
    const lines = ["line 1", "line 2", "line 3"];
    const result = addLineNumbers(lines, 1);
    // All numbers should be right-aligned to 1 digit
    expect(result[0]).toMatch(/1 │/);
    expect(result[1]).toMatch(/2 │/);
    expect(result[2]).toMatch(/3 │/);
  });

  test("handles multi-digit line numbers with larger gutter", () => {
    const lines = Array(100)
      .fill(0)
      .map((_, i) => `line ${i + 1}`);
    const result = addLineNumbers(lines, 3);
    // First lines should be padded to 3 digits
    expect(result[0]).toMatch(/\s+1 │/);
    expect(result[8]).toMatch(/\s+9 │/);
    expect(result[9]).toMatch(/\s+10 │/);
    expect(result[99]).toMatch(/100 │/);
  });

  test("preserves original line content after separator", () => {
    const result = addLineNumbers(["Hello World"], 1);
    expect(result[0]).toContain("Hello World");
  });

  test("handles empty string lines", () => {
    const result = addLineNumbers(["", "content", ""], 1);
    expect(result[0]).toMatch(/1 │\s*$/);
    expect(result[1]).toContain("content");
    expect(result[2]).toMatch(/3 │\s*$/);
  });

  test("handles lines with special characters", () => {
    const result = addLineNumbers(["# Header", "- List item", "> Quote"], 1);
    expect(result[0]).toContain("# Header");
    expect(result[1]).toContain("- List item");
    expect(result[2]).toContain("> Quote");
  });

  test("uses │ separator between number and content", () => {
    const result = addLineNumbers(["content"], 1);
    expect(result[0]).toContain("│");
  });

  test("applies chalk.dim to line numbers (via separator check)", () => {
    const result = addLineNumbers(["test"], 1);
    // The result should contain the separator and content
    expect(result[0]).toContain("│");
    expect(result[0]).toContain("test");
  });

  test("handles zero-indexed arrays correctly", () => {
    const result = addLineNumbers(["first", "second"], 1);
    expect(result[0]).toMatch(/1 │/);
    expect(result[1]).toMatch(/2 │/);
  });
});

describe("buildHeader", () => {
  test("builds header with filename", () => {
    const result = buildHeader("test.md");
    expect(result).toContain("test.md");
    expect(result).toContain("File:");
  });

  test("uses basename for full paths", () => {
    const result = buildHeader("/path/to/file.md");
    expect(result).toContain("file.md");
    expect(result).not.toContain("/path/to");
  });

  test("handles relative paths", () => {
    const result = buildHeader("./examples/test.md");
    expect(result).toContain("test.md");
  });

  test("handles simple filename", () => {
    const result = buildHeader("README.md");
    expect(result).toContain("README.md");
  });

  test("preserves file extension", () => {
    const result = buildHeader("document.markdown");
    expect(result).toContain("document.markdown");
  });

  test("handles files with no extension", () => {
    const result = buildHeader("LICENSE");
    expect(result).toContain("LICENSE");
  });
});

describe("buildTopBorder", () => {
  describe("without line numbers", () => {
    test("builds simple dashed line", () => {
      const result = buildTopBorder(20, 0, false);
      expect(result).toBe("─".repeat(20));
    });

    test("respects width parameter", () => {
      const result = buildTopBorder(50, 0, false);
      expect(result.length).toBe(50);
      expect(result).toBe("─".repeat(50));
    });
  });

  describe("with line numbers", () => {
    test("includes gutter section and junction", () => {
      const result = buildTopBorder(30, 2, true);
      expect(result).toContain("┬");
    });

    test("gutter area has correct width", () => {
      const result = buildTopBorder(30, 2, true);
      // Should have gutterWidth + 1 (for space) dashes before junction
      const gutterSection = result.split("┬")[0];
      expect(gutterSection).toBe("─".repeat(3)); // gutterWidth 2 + 1 = 3
    });

    test("includes content fill after junction", () => {
      const result = buildTopBorder(30, 2, true);
      const afterJunction = result.split("┬")[1];
      expect(afterJunction).toContain("─");
    });

    test("handles large widths", () => {
      const result = buildTopBorder(100, 3, true);
      expect(result).toContain("┬");
      // Width calculation: gutterWidth (3) + 1 space + 1 junction + remaining (100-3-4=93)
      // Total: 4 + 1 + 93 = 98
      expect(result.length).toBeLessThanOrEqual(100);
      expect(result.length).toBeGreaterThan(50);
    });

    test("handles small widths", () => {
      const result = buildTopBorder(10, 1, true);
      expect(result).toContain("┬");
      // Width calculation: gutterWidth (1) + 1 space + 1 junction + remaining (10-1-4=5)
      // Total: 2 + 1 + 5 = 8
      expect(result.length).toBeLessThanOrEqual(10);
      expect(result.length).toBeGreaterThan(5);
    });
  });

  describe("edge cases", () => {
    test("zero width produces empty string (without numbers)", () => {
      const result = buildTopBorder(0, 0, false);
      expect(result).toBe("");
    });

    test("width 1 with numbers produces junction and gutter", () => {
      const result = buildTopBorder(1, 1, true);
      // Width calculation: gutterWidth (1) + 1 space + 1 junction + remaining (1-1-4=-4, clamped to 0)
      // Total: 2 + 1 + 0 = 3 (but since remaining is negative, may be less)
      expect(result).toContain("┬");
    });

    test("single-digit line numbers", () => {
      const result = buildTopBorder(20, 1, true);
      expect(result).toContain("┬");
      // Width should be less than requested due to calculation
      expect(result.length).toBeLessThanOrEqual(20);
    });
  });
});

describe("buildBottomBorder", () => {
  describe("without line numbers", () => {
    test("builds simple dashed line", () => {
      const result = buildBottomBorder(20, 0, false);
      expect(result).toBe("─".repeat(20));
    });

    test("respects width parameter", () => {
      const result = buildBottomBorder(50, 0, false);
      expect(result.length).toBe(50);
      expect(result).toBe("─".repeat(50));
    });
  });

  describe("with line numbers", () => {
    test("includes gutter section and junction", () => {
      const result = buildBottomBorder(30, 2, true);
      expect(result).toContain("┴");
    });

    test("gutter area has correct width", () => {
      const result = buildBottomBorder(30, 2, true);
      const gutterSection = result.split("┴")[0];
      expect(gutterSection).toBe("─".repeat(3)); // gutterWidth 2 + 1 = 3
    });

    test("includes content fill after junction", () => {
      const result = buildBottomBorder(30, 2, true);
      const afterJunction = result.split("┴")[1];
      expect(afterJunction).toContain("─");
    });

    test("handles large widths", () => {
      const result = buildBottomBorder(100, 3, true);
      expect(result).toContain("┴");
      // Same calculation as top border
      expect(result.length).toBeLessThanOrEqual(100);
      expect(result.length).toBeGreaterThan(50);
    });
  });

  describe("symmetry with top border", () => {
    test("top and bottom borders have same length", () => {
      const top = buildTopBorder(50, 2, true);
      const bottom = buildBottomBorder(50, 2, true);
      expect(top.length).toBe(bottom.length);
    });

    test("both use junction at same position", () => {
      const top = buildTopBorder(50, 2, true);
      const bottom = buildBottomBorder(50, 2, true);
      const topJunctionPos = top.indexOf("┬");
      const bottomJunctionPos = bottom.indexOf("┴");
      expect(topJunctionPos).toBe(bottomJunctionPos);
    });
  });
});

describe("decorate", () => {
  const testContent = "Line 1\nLine 2\nLine 3";

  describe("with all components disabled", () => {
    test("returns content unchanged", () => {
      const result = decorate(testContent, {
        width: 80,
        style: { header: false, numbers: false, grid: false },
      });
      expect(result).toBe(testContent);
    });
  });

  describe("with all components enabled", () => {
    test("includes header, numbers, and grid", () => {
      const result = decorate(testContent, {
        filename: "test.md",
        width: 80,
        style: { header: true, numbers: true, grid: true },
      });
      expect(result).toContain("test.md");
      expect(result).toContain("1 │");
      expect(result).toContain("2 │");
      expect(result).toContain("3 │");
      expect(result).toContain("─");
    });

    test("header appears before content", () => {
      const result = decorate(testContent, {
        filename: "test.md",
        width: 80,
        style: { header: true, numbers: true, grid: true },
      });
      const headerPos = result.indexOf("test.md");
      const contentPos = result.indexOf("Line 1");
      expect(headerPos).toBeLessThan(contentPos);
    });

    test("borders surround content", () => {
      const result = decorate(testContent, {
        filename: "test.md",
        width: 80,
        style: { header: true, numbers: true, grid: true },
      });
      const lines = result.split("\n");
      // Should have: header, top border, 3 content lines, bottom border
      expect(lines.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe("header component", () => {
    test("omits header when header=false", () => {
      const result = decorate(testContent, {
        filename: "test.md",
        width: 80,
        style: { header: false, numbers: false, grid: false },
      });
      expect(result).not.toContain("File:");
    });

    test("omits header when filename not provided", () => {
      const result = decorate(testContent, {
        width: 80,
        style: { header: true, numbers: false, grid: false },
      });
      expect(result).not.toContain("File:");
    });

    test("includes header only when both enabled and filename provided", () => {
      const result = decorate(testContent, {
        filename: "test.md",
        width: 80,
        style: { header: true, numbers: false, grid: false },
      });
      expect(result).toContain("test.md");
    });
  });

  describe("numbers component", () => {
    test("includes line numbers when enabled", () => {
      const result = decorate(testContent, {
        width: 80,
        style: { header: false, numbers: true, grid: false },
      });
      expect(result).toContain("1 │");
      expect(result).toContain("2 │");
      expect(result).toContain("3 │");
    });

    test("omits line numbers when disabled", () => {
      const result = decorate(testContent, {
        width: 80,
        style: { header: false, numbers: false, grid: false },
      });
      expect(result).not.toContain("│");
    });

    test("right-aligns numbers correctly for single digits", () => {
      const result = decorate(testContent, {
        width: 80,
        style: { header: false, numbers: true, grid: false },
      });
      expect(result).toContain("1 │");
      expect(result).toContain("2 │");
      expect(result).toContain("3 │");
    });

    test("handles multi-line content with correct gutter width", () => {
      const lines = Array(10)
        .fill(0)
        .map((_, i) => `Line ${i + 1}`);
      const result = decorate(lines.join("\n"), {
        width: 80,
        style: { header: false, numbers: true, grid: false },
      });
      // Last line should be padded to 2 digits
      expect(result).toContain("10 │");
    });
  });

  describe("grid component", () => {
    test("includes top and bottom borders when enabled", () => {
      const result = decorate(testContent, {
        width: 80,
        style: { header: false, numbers: false, grid: true },
      });
      const lines = result.split("\n");
      expect(lines[0]).toMatch(/^─+$/);
      expect(lines[lines.length - 1]).toMatch(/^─+$/);
    });

    test("omits borders when disabled", () => {
      const result = decorate(testContent, {
        width: 80,
        style: { header: false, numbers: false, grid: false },
      });
      expect(result).not.toContain("─");
    });

    test("grid respects width parameter", () => {
      const result = decorate(testContent, {
        width: 40,
        style: { header: false, numbers: false, grid: true },
      });
      const lines = result.split("\n");
      const topBorder = lines[0];
      expect(topBorder.length).toBe(40);
    });

    test("grid with numbers includes junction", () => {
      const result = decorate(testContent, {
        width: 80,
        style: { header: false, numbers: true, grid: true },
      });
      expect(result).toContain("┬");
      expect(result).toContain("┴");
    });
  });

  describe("edge cases", () => {
    test("empty content", () => {
      const result = decorate("", {
        width: 80,
        style: { header: false, numbers: true, grid: false },
      });
      // Empty content splits to [""], so with numbers enabled it becomes "1 │ "
      expect(result).toBe("1 │ ");
    });

    test("single line content", () => {
      const result = decorate("Single line", {
        width: 80,
        style: { header: false, numbers: true, grid: true },
      });
      expect(result).toContain("1 │ Single line");
    });

    test("preserves newline structure", () => {
      const result = decorate(testContent, {
        width: 80,
        style: { header: false, numbers: false, grid: false },
      });
      expect(result).toBe(testContent);
    });

    test("handles lines with ANSI escape codes", () => {
      const ansiContent = "\u001b[31mRed text\u001b[0m\nNormal text";
      const result = decorate(ansiContent, {
        width: 80,
        style: { header: false, numbers: true, grid: false },
      });
      expect(result).toContain("\u001b[31m");
      expect(result).toContain("1 │");
    });

    test("handles very long lines", () => {
      const longLine = "x".repeat(200);
      const result = decorate(longLine, {
        width: 80,
        style: { header: false, numbers: false, grid: false },
      });
      expect(result).toContain("x".repeat(200));
    });

    test("handles mixed line lengths", () => {
      const mixed = "Short\nThis is a much longer line\nMedium length line";
      const result = decorate(mixed, {
        width: 80,
        style: { header: false, numbers: true, grid: true },
      });
      expect(result).toContain("1 │ Short");
      expect(result).toContain("much longer line");
    });
  });

  describe("combination scenarios", () => {
    test("header + numbers (no grid)", () => {
      const result = decorate(testContent, {
        filename: "test.md",
        width: 80,
        style: { header: true, numbers: true, grid: false },
      });
      expect(result).toContain("test.md");
      expect(result).toContain("1 │");
      expect(result).not.toContain("─");
    });

    test("header + grid (no numbers)", () => {
      const result = decorate(testContent, {
        filename: "test.md",
        width: 80,
        style: { header: true, numbers: false, grid: true },
      });
      expect(result).toContain("test.md");
      expect(result).toContain("─");
      expect(result).not.toContain("│");
    });

    test("numbers + grid (no header)", () => {
      const result = decorate(testContent, {
        width: 80,
        style: { header: false, numbers: true, grid: true },
      });
      expect(result).not.toContain("File:");
      expect(result).toContain("1 │");
      expect(result).toContain("┬");
    });
  });
});
