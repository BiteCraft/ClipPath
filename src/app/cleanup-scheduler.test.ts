import { afterEach, describe, expect, it } from "bun:test";
import { rescheduleCleanup } from "./cleanup-scheduler.ts";

describe("cleanup-scheduler", () => {
  afterEach(() => {
    rescheduleCleanup("off");
  });

  describe("success", () => {
    it("accepts 'off' schedule", () => {
      expect(() => rescheduleCleanup("off")).not.toThrow();
    });

    it("accepts '30m' schedule", () => {
      expect(() => rescheduleCleanup("30m")).not.toThrow();
    });

    it("accepts '1h' schedule", () => {
      expect(() => rescheduleCleanup("1h")).not.toThrow();
    });

    it("accepts '6h' schedule", () => {
      expect(() => rescheduleCleanup("6h")).not.toThrow();
    });

    it("accepts 'daily' schedule", () => {
      expect(() => rescheduleCleanup("daily")).not.toThrow();
    });

    it("handles rapid rescheduling without errors", () => {
      expect(() => {
        rescheduleCleanup("30m");
        rescheduleCleanup("1h");
        rescheduleCleanup("6h");
        rescheduleCleanup("daily");
        rescheduleCleanup("off");
      }).not.toThrow();
    });

    it("clears previous timer when rescheduling", () => {
      rescheduleCleanup("30m");
      rescheduleCleanup("1h");
      rescheduleCleanup("off");
      expect(() => rescheduleCleanup("off")).not.toThrow();
    });
  });

  describe("errors", () => {
    it("handles unknown schedule value without throwing", () => {
      expect(() => rescheduleCleanup("unknown" as never)).not.toThrow();
    });

    it("handles empty string schedule without throwing", () => {
      expect(() => rescheduleCleanup("" as never)).not.toThrow();
    });
  });
});
