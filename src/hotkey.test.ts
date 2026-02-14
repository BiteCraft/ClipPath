import { describe, expect, it } from "bun:test";
import { onHotkeyPress } from "./hotkey.ts";

describe("hotkey", () => {
  describe("success", () => {
    it("onHotkeyPress accepts a callback without throwing", () => {
      expect(() => onHotkeyPress(() => {})).not.toThrow();
    });

    it("onHotkeyPress can be called multiple times to replace the callback", () => {
      onHotkeyPress(() => {});
      expect(() => onHotkeyPress(() => {})).not.toThrow();
    });
  });

  describe("errors", () => {
    it("onHotkeyPress does not throw with no-op callback", () => {
      expect(() => onHotkeyPress(() => {})).not.toThrow();
    });
  });
});
