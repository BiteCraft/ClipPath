import { describe, expect, it } from "bun:test";
import { INPUT_KEYBOARD, KEYEVENTF_KEYUP, KEYEVENTF_UNICODE, SIZEOF_INPUT } from "../win32/constants.ts";
import { buildCharacterEvents, buildUnicodeKeyPair, buildVkKeySequence } from "./key-events.ts";

describe("key-events", () => {
  describe("success", () => {
    it("buildUnicodeKeyPair creates exactly two events", () => {
      expect(buildUnicodeKeyPair(65)).toHaveLength(2);
    });

    it("buildUnicodeKeyPair sets INPUT_KEYBOARD type on both events", () => {
      const [down, up] = buildUnicodeKeyPair(65);
      expect(down?.readUInt32LE(0)).toBe(INPUT_KEYBOARD);
      expect(up?.readUInt32LE(0)).toBe(INPUT_KEYBOARD);
    });

    it("buildUnicodeKeyPair encodes the char code in wScan", () => {
      const [down, up] = buildUnicodeKeyPair(0x41);
      expect(down?.readUInt16LE(10)).toBe(0x41);
      expect(up?.readUInt16LE(10)).toBe(0x41);
    });

    it("buildUnicodeKeyPair sets UNICODE flag on keydown and UNICODE|KEYUP on keyup", () => {
      const [down, up] = buildUnicodeKeyPair(65);
      expect(down?.readUInt32LE(12)).toBe(KEYEVENTF_UNICODE);
      expect(up?.readUInt32LE(12)).toBe(KEYEVENTF_UNICODE | KEYEVENTF_KEYUP);
    });

    it("buildUnicodeKeyPair creates buffers of SIZEOF_INPUT bytes", () => {
      const [down, up] = buildUnicodeKeyPair(97);
      expect(down?.length).toBe(SIZEOF_INPUT);
      expect(up?.length).toBe(SIZEOF_INPUT);
    });

    it("buildVkKeySequence creates 2 events without modifiers", () => {
      expect(buildVkKeySequence(0x41, 0)).toHaveLength(2);
    });

    it("buildVkKeySequence creates 4 events with Shift", () => {
      expect(buildVkKeySequence(0x41, 1)).toHaveLength(4);
    });

    it("buildVkKeySequence creates 6 events with Ctrl+Shift", () => {
      expect(buildVkKeySequence(0x41, 3)).toHaveLength(6);
    });

    it("buildVkKeySequence creates 8 events with Ctrl+Alt+Shift", () => {
      expect(buildVkKeySequence(0x41, 7)).toHaveLength(8);
    });

    it("buildVkKeySequence sets the vk code in key-down event", () => {
      const events = buildVkKeySequence(0x41, 0);
      expect(events[0]?.readUInt16LE(8)).toBe(0x41);
    });

    it("buildVkKeySequence sets KEYEVENTF_KEYUP on the key-up event", () => {
      const events = buildVkKeySequence(0x41, 0);
      expect(events[1]?.readUInt32LE(12)).toBe(KEYEVENTF_KEYUP);
    });

    it("buildCharacterEvents falls back to Unicode when hkl is 0", () => {
      const events = buildCharacterEvents("A", 0);
      expect(events).toHaveLength(2);
      expect(events[0]?.readUInt32LE(12)).toBe(KEYEVENTF_UNICODE);
    });
  });

  describe("errors", () => {
    it("buildUnicodeKeyPair handles char code 0", () => {
      const events = buildUnicodeKeyPair(0);
      expect(events).toHaveLength(2);
      expect(events[0]?.readUInt16LE(10)).toBe(0);
    });

    it("buildVkKeySequence handles vk code 0", () => {
      const events = buildVkKeySequence(0, 0);
      expect(events).toHaveLength(2);
    });

    it("buildCharacterEvents handles tab character with hkl 0", () => {
      const events = buildCharacterEvents("\t", 0);
      expect(events).toHaveLength(2);
    });

    it("buildCharacterEvents handles high unicode codepoint with hkl 0", () => {
      const events = buildCharacterEvents("\u00E9", 0);
      expect(events).toHaveLength(2);
      expect(events[0]?.readUInt16LE(10)).toBe(0xe9);
    });
  });
});
