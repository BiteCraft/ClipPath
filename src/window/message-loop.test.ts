import { describe, expect, it } from "bun:test";
import { stopMessageLoop } from "./message-loop.ts";

describe("message-loop", () => {
  describe("success", () => {
    it("stopMessageLoop can be called safely when no loop is running", () => {
      expect(() => stopMessageLoop()).not.toThrow();
    });

    it("stopMessageLoop can be called multiple times without error", () => {
      stopMessageLoop();
      expect(() => stopMessageLoop()).not.toThrow();
    });
  });

  describe("errors", () => {
    it("stopMessageLoop is idempotent", () => {
      expect(() => {
        stopMessageLoop();
        stopMessageLoop();
        stopMessageLoop();
      }).not.toThrow();
    });
  });
});
