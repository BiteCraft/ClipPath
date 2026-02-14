import { describe, expect, it } from "bun:test";
import { getTargetKeyboardLayout, isKeyDown, waitForKeyRelease } from "./key-state.ts";

const VK_CONTROL = 0x11;
const VK_SHIFT = 0x10;
const VK_MENU = 0x12;

describe("key-state", () => {
  describe("success", () => {
    it("isKeyDown returns a boolean", () => {
      expect(typeof isKeyDown(VK_CONTROL)).toBe("boolean");
    });

    it("isKeyDown reports Ctrl as not pressed during tests", () => {
      expect(isKeyDown(VK_CONTROL)).toBe(false);
    });

    it("isKeyDown reports Shift as not pressed during tests", () => {
      expect(isKeyDown(VK_SHIFT)).toBe(false);
    });

    it("isKeyDown reports Alt as not pressed during tests", () => {
      expect(isKeyDown(VK_MENU)).toBe(false);
    });

    it("waitForKeyRelease returns immediately when no keys are held", () => {
      const start = Date.now();
      waitForKeyRelease();
      expect(Date.now() - start).toBeLessThan(100);
    });

    it("getTargetKeyboardLayout returns a number", () => {
      expect(typeof getTargetKeyboardLayout()).toBe("number");
    });
  });

  describe("errors", () => {
    it("isKeyDown handles vk code 0 without throwing", () => {
      expect(() => isKeyDown(0)).not.toThrow();
    });

    it("isKeyDown handles vk code 0xFF without throwing", () => {
      expect(() => isKeyDown(0xff)).not.toThrow();
    });

    it("waitForKeyRelease can be called multiple times", () => {
      expect(() => {
        waitForKeyRelease();
        waitForKeyRelease();
      }).not.toThrow();
    });
  });
});
