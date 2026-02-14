import { describe, expect, it } from "bun:test";
import { typeString } from "./keyboard.ts";

describe("keyboard", () => {
  describe("success", () => {
    it("typeString with empty string returns true immediately", () => {
      expect(typeString("")).toBe(true);
    });
  });

  describe("errors", () => {
    it("typeString with empty string does not throw", () => {
      expect(() => typeString("")).not.toThrow();
    });
  });
});
