import { describe, expect, it } from "bun:test";
import { hasClipboardImage, setOnImageChange } from "./monitor.ts";

describe("clipboard-monitor", () => {
  describe("success", () => {
    it("hasClipboardImage returns a boolean", () => {
      expect(typeof hasClipboardImage()).toBe("boolean");
    });

    it("hasClipboardImage is deterministic across calls", () => {
      const a = hasClipboardImage();
      const b = hasClipboardImage();
      expect(a).toBe(b);
    });

    it("setOnImageChange accepts a callback without throwing", () => {
      expect(() => setOnImageChange(() => {})).not.toThrow();
    });

    it("setOnImageChange can be called multiple times to replace the callback", () => {
      setOnImageChange(() => {});
      expect(() => setOnImageChange(() => {})).not.toThrow();
    });
  });

  describe("errors", () => {
    it("hasClipboardImage does not throw", () => {
      expect(() => hasClipboardImage()).not.toThrow();
    });
  });
});
