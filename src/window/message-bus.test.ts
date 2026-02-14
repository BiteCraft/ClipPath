import { describe, expect, it } from "bun:test";
import { dispatchToHandlers, onMessage } from "./message-bus.ts";

describe("message-bus", () => {
  describe("success", () => {
    it("returns null when no handlers are registered", () => {
      expect(dispatchToHandlers(0, 0, 0, 0)).toBeNull();
    });

    it("returns the result from a matching handler", () => {
      onMessage((_h, uMsg) => (uMsg === 1001 ? 42 : null));
      expect(dispatchToHandlers(0, 1001, 0, 0)).toBe(42);
    });

    it("passes all four arguments to the handler", () => {
      let received: number[] = [];
      onMessage((h, u, w, l) => {
        if (u === 1002) {
          received = [h, u, w, l];
          return 0;
        }
        return null;
      });
      dispatchToHandlers(10, 1002, 20, 30);
      expect(received).toEqual([10, 1002, 20, 30]);
    });

    it("returns the first non-null result among multiple handlers", () => {
      onMessage((_h, uMsg) => (uMsg === 1003 ? 100 : null));
      onMessage((_h, uMsg) => (uMsg === 1003 ? 200 : null));
      expect(dispatchToHandlers(0, 1003, 0, 0)).toBe(100);
    });

    it("allows handlers to return zero as a valid result", () => {
      onMessage((_h, uMsg) => (uMsg === 1004 ? 0 : null));
      expect(dispatchToHandlers(0, 1004, 0, 0)).toBe(0);
    });
  });

  describe("errors", () => {
    it("returns null when all handlers return null", () => {
      expect(dispatchToHandlers(0, 9999, 0, 0)).toBeNull();
    });

    it("skips handlers returning null and finds the next match", () => {
      onMessage(() => null);
      onMessage((_h, uMsg) => (uMsg === 1005 ? 77 : null));
      expect(dispatchToHandlers(0, 1005, 0, 0)).toBe(77);
    });

    it("returns null for a message no handler recognizes", () => {
      expect(dispatchToHandlers(0, 55555, 0, 0)).toBeNull();
    });
  });
});
