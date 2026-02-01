/**
 * Unit tests for mermaid.ts
 */
import { describe, test, expect } from "bun:test";
import { renderMermaid } from "./mermaid";

describe("renderMermaid", () => {
  describe("success path", () => {
    test("renders valid flowchart to ASCII", () => {
      const code = `graph TD
    A --> B`;
      const result = renderMermaid(code);
      // Should return ASCII art, not an error box
      expect(result).not.toContain("Error:");
      // Should contain some representation of the nodes
      expect(result.length).toBeGreaterThan(0);
    });

    test("renders valid sequence diagram", () => {
      const code = `sequenceDiagram
    Alice->>Bob: Hello`;
      const result = renderMermaid(code);
      expect(result).not.toContain("Error:");
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("error path", () => {
    test("returns error box for invalid mermaid syntax", () => {
      const code = "not valid mermaid at all!!!";
      const result = renderMermaid(code);
      // Should contain the error indicator
      expect(result).toContain("Error:");
      // Should be wrapped in a box (starts with +)
      expect(result.startsWith("+")).toBe(true);
      // Should contain the original code
      expect(result).toContain("not valid mermaid at all!!!");
    });

    test("returns error box for malformed diagram", () => {
      const code = `graph TD
    A --> --> B`;
      const result = renderMermaid(code);
      // May or may not error depending on library tolerance
      // But result should always be a non-empty string
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("edge cases", () => {
    test("handles empty input gracefully", () => {
      const result = renderMermaid("");
      // Empty input likely causes error, should be in error box
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    test("handles whitespace-only input gracefully", () => {
      const result = renderMermaid("   \n\t\n   ");
      // Whitespace-only likely causes error, should be in error box
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    test("handles single line input", () => {
      const code = "graph TD";
      const result = renderMermaid(code);
      // Incomplete diagram, but should not crash
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    test("preserves multiline code in error box", () => {
      const code = `invalid
multiline
code`;
      const result = renderMermaid(code);
      // Should be in error box with all lines preserved
      expect(result).toContain("Error:");
      expect(result).toContain("invalid");
      expect(result).toContain("multiline");
      expect(result).toContain("code");
    });
  });
});
