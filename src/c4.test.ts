/**
 * Unit tests for c4.ts
 */
import { describe, test, expect } from "bun:test";
import { isC4Diagram, renderC4 } from "./c4";

describe("isC4Diagram", () => {
  test("detects C4Context diagrams", () => {
    const code = `C4Context
    title System Context`;
    expect(isC4Diagram(code)).toBe(true);
  });

  test("detects C4Container diagrams", () => {
    const code = `C4Container
    title Container diagram`;
    expect(isC4Diagram(code)).toBe(true);
  });

  test("detects C4Component diagrams", () => {
    const code = `C4Component
    title Component diagram`;
    expect(isC4Diagram(code)).toBe(true);
  });

  test("returns false for non-C4 diagrams", () => {
    const code = `graph TD
    A --> B`;
    expect(isC4Diagram(code)).toBe(false);
  });

  test("returns false for sequence diagrams", () => {
    const code = `sequenceDiagram
    Alice->>Bob: Hello`;
    expect(isC4Diagram(code)).toBe(false);
  });
});

describe("renderC4", () => {
  test("renders simple C4Context diagram", () => {
    const code = `C4Context
    title System Context diagram
    
    Person(user, "User", "A user of the system")
    System(system, "System", "The main system")
    
    Rel(user, system, "Uses")`;
    
    const result = renderC4(code);
    expect(result).not.toBeNull();
    expect(result).toContain("User");
    expect(result).toContain("System");
    expect(result).toContain("Uses");
  });

  test("renders C4 with boundaries", () => {
    const code = `C4Context
    title System Context diagram

    Enterprise_Boundary(b0, "Boundary 1") {
        Person(user, "User 1", "A user")
        System(system, "System 1", "A system")
    }
    
    Rel(user, system, "User Action")`;
    
    const result = renderC4(code);
    expect(result).not.toBeNull();
    expect(result).toContain("Boundary 1");
    expect(result).toContain("User 1");
    expect(result).toContain("System 1");
  });

  test("returns null for non-C4 diagrams", () => {
    const code = `graph TD
    A --> B`;
    
    const result = renderC4(code);
    expect(result).toBeNull();
  });
});
