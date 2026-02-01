/**
 * Unit tests for renderer.ts
 */
import { describe, test, expect } from "bun:test";
import { render } from "./renderer";

describe("render", () => {
  describe("plain markdown", () => {
    test("renders headers", () => {
      const md = "# Hello World";
      const result = render(md);
      // Should contain the header text
      expect(result).toContain("Hello World");
      // Should have some output
      expect(result.length).toBeGreaterThan(0);
    });

    test("renders multiple header levels", () => {
      const md = `# H1
## H2
### H3`;
      const result = render(md);
      expect(result).toContain("H1");
      expect(result).toContain("H2");
      expect(result).toContain("H3");
    });

    test("renders bold text", () => {
      const md = "This is **bold** text";
      const result = render(md);
      expect(result).toContain("bold");
      expect(result).toContain("text");
    });

    test("renders italic text", () => {
      const md = "This is *italic* text";
      const result = render(md);
      expect(result).toContain("italic");
      expect(result).toContain("text");
    });

    test("renders bold and italic combined", () => {
      const md = "This is ***bold italic*** text";
      const result = render(md);
      expect(result).toContain("bold italic");
    });

    test("renders paragraphs", () => {
      const md = `First paragraph.

Second paragraph.`;
      const result = render(md);
      expect(result).toContain("First paragraph");
      expect(result).toContain("Second paragraph");
    });

    test("renders bullet lists", () => {
      const md = `- Item 1
- Item 2
- Item 3`;
      const result = render(md);
      expect(result).toContain("Item 1");
      expect(result).toContain("Item 2");
      expect(result).toContain("Item 3");
    });

    test("renders numbered lists", () => {
      const md = `1. First
2. Second
3. Third`;
      const result = render(md);
      expect(result).toContain("First");
      expect(result).toContain("Second");
      expect(result).toContain("Third");
    });
  });

  describe("code blocks", () => {
    test("renders inline code", () => {
      const md = "Use `console.log()` to print";
      const result = render(md);
      expect(result).toContain("console.log()");
    });

    test("renders fenced code blocks", () => {
      const md = `\`\`\`javascript
const x = 42;
console.log(x);
\`\`\``;
      const result = render(md);
      expect(result).toContain("const");
      expect(result).toContain("42");
    });

    test("renders code blocks without language", () => {
      const md = `\`\`\`
plain code
\`\`\``;
      const result = render(md);
      expect(result).toContain("plain code");
    });
  });

  describe("mermaid blocks", () => {
    test("detects and converts mermaid flowchart", () => {
      const md = `\`\`\`mermaid
graph TD
    A --> B
\`\`\``;
      const result = render(md);
      // Should not contain the raw mermaid keyword
      expect(result).not.toContain("```mermaid");
      // Should have some output (ASCII art representation)
      expect(result.length).toBeGreaterThan(0);
    });

    test("detects and converts mermaid sequence diagram", () => {
      const md = `\`\`\`mermaid
sequenceDiagram
    Alice->>Bob: Hello
\`\`\``;
      const result = render(md);
      expect(result).not.toContain("```mermaid");
      expect(result.length).toBeGreaterThan(0);
    });

    test("handles invalid mermaid gracefully", () => {
      const md = `\`\`\`mermaid
not valid mermaid code
\`\`\``;
      const result = render(md);
      // Should still produce output (error box or fallback)
      expect(result.length).toBeGreaterThan(0);
      // Invalid mermaid should show error box
      expect(result).toContain("Error:");
    });
  });

  describe("mixed content", () => {
    test("renders markdown before and after mermaid", () => {
      const md = `# Title

Some text before.

\`\`\`mermaid
graph TD
    A --> B
\`\`\`

Some text after.`;
      const result = render(md);
      expect(result).toContain("Title");
      expect(result).toContain("Some text before");
      expect(result).toContain("Some text after");
      expect(result).not.toContain("```mermaid");
    });

    test("renders multiple mermaid blocks in one document", () => {
      const md = `# Diagrams

First diagram:

\`\`\`mermaid
graph TD
    A --> B
\`\`\`

Second diagram:

\`\`\`mermaid
graph LR
    X --> Y
\`\`\``;
      const result = render(md);
      expect(result).toContain("Diagrams");
      expect(result).toContain("First diagram");
      expect(result).toContain("Second diagram");
      // Neither mermaid block should remain as raw
      expect(result).not.toContain("```mermaid");
    });

    test("renders code blocks mixed with mermaid", () => {
      const md = `# Example

JavaScript:

\`\`\`javascript
const x = 1;
\`\`\`

Diagram:

\`\`\`mermaid
graph TD
    A --> B
\`\`\``;
      const result = render(md);
      expect(result).toContain("JavaScript");
      expect(result).toContain("const");
      expect(result).not.toContain("```mermaid");
    });
  });

  describe("width option", () => {
    test("accepts width option without error", () => {
      const md = "# Test";
      // Should not throw with width option
      expect(() => render(md, { width: 100 })).not.toThrow();
    });

    test("respects different width values", () => {
      const longText =
        "This is a very long line that might be wrapped differently depending on the terminal width setting passed to the renderer.";
      const result80 = render(longText, { width: 80 });
      const result40 = render(longText, { width: 40 });

      // Both should produce output
      expect(result80.length).toBeGreaterThan(0);
      expect(result40.length).toBeGreaterThan(0);
      // Results may differ due to text reflowing
      // At minimum, both should contain the key words
      expect(result80).toContain("long line");
      expect(result40).toContain("long line");
    });

    test("uses default width when not specified", () => {
      const md = "# Hello";
      // Should not throw without options
      expect(() => render(md)).not.toThrow();
      const result = render(md);
      expect(result).toContain("Hello");
    });
  });

  describe("tables", () => {
    test("renders simple table", () => {
      const md = `| Name | Age |
| ---- | --- |
| Alice | 30 |
| Bob | 25 |`;
      const result = render(md);
      expect(result).toContain("Name");
      expect(result).toContain("Age");
      expect(result).toContain("Alice");
      expect(result).toContain("Bob");
      expect(result).toContain("30");
      expect(result).toContain("25");
    });

    test("renders table with alignment", () => {
      const md = `| Left | Center | Right |
| :--- | :----: | ----: |
| L | C | R |`;
      const result = render(md);
      expect(result).toContain("Left");
      expect(result).toContain("Center");
      expect(result).toContain("Right");
    });
  });

  describe("links and images", () => {
    test("renders links", () => {
      const md = "Check out [Example](https://example.com)";
      const result = render(md);
      expect(result).toContain("Example");
      // URL might be shown or hidden depending on terminal renderer
    });

    test("renders images as alt text", () => {
      const md = "![Alt text](image.png)";
      const result = render(md);
      // Terminal can't show images, should show something
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("blockquotes", () => {
    test("renders blockquotes", () => {
      const md = "> This is a quote";
      const result = render(md);
      expect(result).toContain("This is a quote");
    });

    test("renders nested blockquotes", () => {
      const md = `> Level 1
>> Level 2`;
      const result = render(md);
      expect(result).toContain("Level 1");
      expect(result).toContain("Level 2");
    });
  });

  describe("edge cases", () => {
    test("handles empty input", () => {
      const result = render("");
      expect(typeof result).toBe("string");
    });

    test("handles whitespace-only input", () => {
      const result = render("   \n\n   ");
      expect(typeof result).toBe("string");
    });

    test("handles special characters", () => {
      const md = "Special: < > & \" '";
      const result = render(md);
      expect(result).toContain("Special");
    });
  });
});
