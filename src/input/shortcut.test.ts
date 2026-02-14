import { describe, expect, it } from "bun:test";
import { MOD_ALT, MOD_CONTROL, MOD_SHIFT } from "../win32/constants.ts";
import { parseShortcut, shortcutToString } from "./shortcut.ts";

describe("shortcut", () => {
  describe("parseShortcut", () => {
    it("parses Ctrl+Shift+V", () => {
      const result = parseShortcut("Ctrl+Shift+V");
      expect(result.modifiers).toBe(MOD_CONTROL | MOD_SHIFT);
      expect(result.vk).toBe(0x56);
    });

    it("parses Ctrl+Alt+S", () => {
      const result = parseShortcut("Ctrl+Alt+S");
      expect(result.modifiers).toBe(MOD_CONTROL | MOD_ALT);
      expect(result.vk).toBe(0x53);
    });

    it("parses Ctrl+1", () => {
      const result = parseShortcut("Ctrl+1");
      expect(result.modifiers).toBe(MOD_CONTROL);
      expect(result.vk).toBe(0x31);
    });

    it("parses F12 without modifiers", () => {
      const result = parseShortcut("F12");
      expect(result.modifiers).toBe(0);
      expect(result.vk).toBe(0x7b);
    });

    it("parses Ctrl+F5", () => {
      const result = parseShortcut("Ctrl+F5");
      expect(result.modifiers).toBe(MOD_CONTROL);
      expect(result.vk).toBe(0x74);
    });

    it("is case-insensitive", () => {
      const result = parseShortcut("ctrl+shift+v");
      expect(result.modifiers).toBe(MOD_CONTROL | MOD_SHIFT);
      expect(result.vk).toBe(0x56);
    });

    it("handles spaces around parts", () => {
      const result = parseShortcut("Ctrl + Shift + V");
      expect(result.modifiers).toBe(MOD_CONTROL | MOD_SHIFT);
      expect(result.vk).toBe(0x56);
    });

    it("parses Alt+Insert", () => {
      const result = parseShortcut("Alt+Insert");
      expect(result.modifiers).toBe(MOD_ALT);
      expect(result.vk).toBe(0x2d);
    });

    it("throws on unknown key", () => {
      expect(() => parseShortcut("Ctrl+???")).toThrow();
    });

    it("throws on modifier-only shortcut", () => {
      expect(() => parseShortcut("Ctrl+Shift")).toThrow();
    });

    it("throws on non-function key without modifier", () => {
      expect(() => parseShortcut("V")).toThrow();
    });

    it("throws on multiple non-modifier keys", () => {
      expect(() => parseShortcut("Ctrl+A+B")).toThrow();
    });

    it("throws on empty string", () => {
      expect(() => parseShortcut("")).toThrow();
    });
  });

  describe("shortcutToString", () => {
    it("converts Ctrl+Shift+V back to string", () => {
      const str = shortcutToString(MOD_CONTROL | MOD_SHIFT, 0x56);
      expect(str).toBe("Ctrl+Shift+V");
    });

    it("converts Ctrl+Alt+S back to string", () => {
      const str = shortcutToString(MOD_CONTROL | MOD_ALT, 0x53);
      expect(str).toBe("Ctrl+Alt+S");
    });

    it("converts F12 back to string", () => {
      const str = shortcutToString(0, 0x7b);
      expect(str).toBe("F12");
    });

    it("roundtrips through parse and back", () => {
      const shortcuts = ["Ctrl+Shift+V", "Ctrl+Alt+Delete", "F1", "Shift+F5", "Ctrl+Home"];
      for (const s of shortcuts) {
        const parsed = parseShortcut(s);
        const result = shortcutToString(parsed.modifiers, parsed.vk);
        const reparsed = parseShortcut(result);
        expect(reparsed.modifiers).toBe(parsed.modifiers);
        expect(reparsed.vk).toBe(parsed.vk);
      }
    });
  });
});
