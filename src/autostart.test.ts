import { describe, expect, it } from "bun:test";
import { disableAutoStart, enableAutoStart, isAutoStartEnabled } from "./autostart.ts";

describe("autostart", () => {
  describe("success", () => {
    it("isAutoStartEnabled returns a boolean", () => {
      expect(typeof isAutoStartEnabled()).toBe("boolean");
    });

    it("isAutoStartEnabled is deterministic across calls", () => {
      const a = isAutoStartEnabled();
      const b = isAutoStartEnabled();
      expect(a).toBe(b);
    });

    it("enable and disable toggle the registry state and restore", () => {
      const wasEnabled = isAutoStartEnabled();
      try {
        if (wasEnabled) {
          expect(disableAutoStart()).toBe(true);
          expect(isAutoStartEnabled()).toBe(false);
        } else {
          expect(enableAutoStart()).toBe(true);
          expect(isAutoStartEnabled()).toBe(true);
        }
      } finally {
        if (wasEnabled) enableAutoStart();
        else disableAutoStart();
      }
    });
  });

  describe("errors", () => {
    it("redundant enable calls do not throw", () => {
      const wasEnabled = isAutoStartEnabled();
      try {
        enableAutoStart();
        expect(() => enableAutoStart()).not.toThrow();
      } finally {
        if (!wasEnabled) disableAutoStart();
      }
    });

    it("redundant disable calls do not throw", () => {
      const wasEnabled = isAutoStartEnabled();
      try {
        disableAutoStart();
        expect(() => disableAutoStart()).not.toThrow();
      } finally {
        if (wasEnabled) enableAutoStart();
      }
    });
  });
});
