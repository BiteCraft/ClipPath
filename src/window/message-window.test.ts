import { describe, expect, it } from "bun:test";
import { getHInstance, getHwnd } from "./message-window.ts";

describe("message-window", () => {
  describe("success", () => {
    it("getHwnd returns a number", () => {
      expect(typeof getHwnd()).toBe("number");
    });

    it("getHInstance returns a number", () => {
      expect(typeof getHInstance()).toBe("number");
    });

    it("getHwnd is deterministic before window creation", () => {
      const a = getHwnd();
      const b = getHwnd();
      expect(a).toBe(b);
    });

    it("getHInstance is deterministic before window creation", () => {
      const a = getHInstance();
      const b = getHInstance();
      expect(a).toBe(b);
    });
  });

  describe("errors", () => {
    it("getHwnd does not throw", () => {
      expect(() => getHwnd()).not.toThrow();
    });

    it("getHInstance does not throw", () => {
      expect(() => getHInstance()).not.toThrow();
    });
  });
});
