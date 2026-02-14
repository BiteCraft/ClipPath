import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { type AppConfig, getConfig, loadConfig, updateConfig } from "./config.ts";

let savedConfig: AppConfig;

beforeAll(() => {
  loadConfig();
  savedConfig = { ...getConfig() };
});

afterAll(() => {
  updateConfig(savedConfig);
});

describe("config", () => {
  describe("success", () => {
    it("loadConfig returns an object with all required fields", () => {
      const config = loadConfig();
      expect(config).toHaveProperty("cleanupSchedule");
      expect(config).toHaveProperty("dailyHour");
      expect(config).toHaveProperty("wslMode");
    });

    it("getConfig returns the same object as loadConfig produced", () => {
      const loaded = loadConfig();
      const current = getConfig();
      expect(current.cleanupSchedule).toBe(loaded.cleanupSchedule);
      expect(current.dailyHour).toBe(loaded.dailyHour);
    });

    it("updateConfig merges a partial update", () => {
      const before = getConfig();
      const updated = updateConfig({ cleanupSchedule: "6h" });
      expect(updated.cleanupSchedule).toBe("6h");
      expect(updated.dailyHour).toBe(before.dailyHour);
    });

    it("updateConfig persists the change in getConfig", () => {
      updateConfig({ dailyHour: 5 });
      expect(getConfig().dailyHour).toBe(5);
    });

    it("loadConfig reads back a previously saved value", () => {
      updateConfig({ cleanupSchedule: "30m" });
      const reloaded = loadConfig();
      expect(reloaded.cleanupSchedule).toBe("30m");
    });

    it("updateConfig supports all schedule values", () => {
      for (const schedule of ["off", "30m", "1h", "6h", "daily"] as const) {
        updateConfig({ cleanupSchedule: schedule });
        expect(getConfig().cleanupSchedule).toBe(schedule);
      }
    });
  });

  describe("errors", () => {
    it("updateConfig with empty object does not change any field", () => {
      loadConfig();
      const before = { ...getConfig() };
      updateConfig({});
      const after = getConfig();
      expect(after.cleanupSchedule).toBe(before.cleanupSchedule);
      expect(after.dailyHour).toBe(before.dailyHour);
      expect(after.wslMode).toBe(before.wslMode);
    });

    it("loadConfig handles repeated calls without error", () => {
      expect(() => {
        loadConfig();
        loadConfig();
        loadConfig();
      }).not.toThrow();
    });

    it("getConfig never returns undefined fields", () => {
      loadConfig();
      const config = getConfig();
      expect(config.cleanupSchedule).not.toBeUndefined();
      expect(config.dailyHour).not.toBeUndefined();
      expect(config.wslMode !== undefined).toBe(true);
    });
  });
});
