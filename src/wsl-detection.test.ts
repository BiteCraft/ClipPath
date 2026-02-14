import { describe, expect, it } from "bun:test";
import { getForegroundTitle, isWslTerminal } from "./wsl-detection.ts";

describe("wsl-detection", () => {
  describe("success", () => {
    it("getForegroundTitle returns a string", () => {
      expect(typeof getForegroundTitle()).toBe("string");
    });

    it("getForegroundTitle is deterministic across consecutive calls", () => {
      const a = getForegroundTitle();
      const b = getForegroundTitle();
      expect(a).toBe(b);
    });

    it("isWslTerminal returns a boolean", () => {
      expect(typeof isWslTerminal()).toBe("boolean");
    });

    it("isWslTerminal is deterministic across consecutive calls", () => {
      const a = isWslTerminal();
      const b = isWslTerminal();
      expect(a).toBe(b);
    });
  });

  describe("errors", () => {
    it("getForegroundTitle does not throw", () => {
      expect(() => getForegroundTitle()).not.toThrow();
    });

    it("isWslTerminal does not throw", () => {
      expect(() => isWslTerminal()).not.toThrow();
    });
  });
});
