import { describe, expect, it } from "bun:test";
import {
  INPUT_KEYBOARD,
  KEYEVENTF_KEYUP,
  KEYEVENTF_UNICODE,
  SIZEOF_BITMAPFILEHEADER,
  SIZEOF_INPUT,
  SIZEOF_MSG,
  SIZEOF_NOTIFYICONDATAW,
  SIZEOF_POINT,
  SIZEOF_WNDCLASSW,
} from "./constants.ts";
import {
  buildBitmapFileHeader,
  buildKeyboardInput,
  buildKeyboardInputArray,
  buildMsg,
  buildNotifyIconData,
  buildPoint,
  buildWndClassW,
  readMsgId,
  readPoint,
  toWideString,
  writePointer,
} from "./structs.ts";

describe("structs", () => {
  describe("success", () => {
    it("toWideString encodes ASCII as UTF-16LE with null terminator", () => {
      const buf = toWideString("AB");
      expect(buf.length).toBe(6);
      expect(buf.readUInt16LE(0)).toBe(0x41);
      expect(buf.readUInt16LE(2)).toBe(0x42);
      expect(buf.readUInt16LE(4)).toBe(0);
    });

    it("toWideString encodes non-ASCII characters", () => {
      const buf = toWideString("\u00E9");
      expect(buf.readUInt16LE(0)).toBe(0xe9);
    });

    it("toWideString handles empty string", () => {
      const buf = toWideString("");
      expect(buf.length).toBe(2);
      expect(buf.readUInt16LE(0)).toBe(0);
    });

    it("writePointer writes 8-byte value at correct offset", () => {
      const buf = Buffer.alloc(16);
      writePointer(buf, 0, 0x12345678);
      expect(buf.readBigUInt64LE(0)).toBe(BigInt(0x12345678));
    });

    it("writePointer writes at non-zero offset", () => {
      const buf = Buffer.alloc(24);
      writePointer(buf, 8, 42);
      expect(buf.readBigUInt64LE(8)).toBe(42n);
      expect(buf.readBigUInt64LE(0)).toBe(0n);
    });

    it("buildWndClassW creates buffer of SIZEOF_WNDCLASSW bytes", () => {
      const buf = buildWndClassW(100, 200, 300);
      expect(buf.length).toBe(SIZEOF_WNDCLASSW);
    });

    it("buildWndClassW sets wndProc at offset 8", () => {
      const buf = buildWndClassW(0xaabb, 0, 0);
      expect(buf.readBigUInt64LE(8)).toBe(BigInt(0xaabb));
    });

    it("buildWndClassW sets hInstance at offset 24", () => {
      const buf = buildWndClassW(0, 0xccdd, 0);
      expect(buf.readBigUInt64LE(24)).toBe(BigInt(0xccdd));
    });

    it("buildWndClassW sets className at offset 64", () => {
      const buf = buildWndClassW(0, 0, 0xeeff);
      expect(buf.readBigUInt64LE(64)).toBe(BigInt(0xeeff));
    });

    it("buildNotifyIconData creates buffer of SIZEOF_NOTIFYICONDATAW bytes", () => {
      const buf = buildNotifyIconData(1, 2, 3, 4, 5, "tip");
      expect(buf.length).toBe(SIZEOF_NOTIFYICONDATAW);
    });

    it("buildNotifyIconData sets cbSize at offset 0", () => {
      const buf = buildNotifyIconData(0, 0, 0, 0, 0, "");
      expect(buf.readUInt32LE(0)).toBe(SIZEOF_NOTIFYICONDATAW);
    });

    it("buildNotifyIconData sets hWnd at offset 8", () => {
      const buf = buildNotifyIconData(0x1234, 0, 0, 0, 0, "");
      expect(buf.readBigUInt64LE(8)).toBe(BigInt(0x1234));
    });

    it("buildNotifyIconData sets uID at offset 16", () => {
      const buf = buildNotifyIconData(0, 42, 0, 0, 0, "");
      expect(buf.readUInt32LE(16)).toBe(42);
    });

    it("buildNotifyIconData sets uFlags at offset 20", () => {
      const buf = buildNotifyIconData(0, 0, 0xff, 0, 0, "");
      expect(buf.readUInt32LE(20)).toBe(0xff);
    });

    it("buildNotifyIconData sets uCallbackMessage at offset 24", () => {
      const buf = buildNotifyIconData(0, 0, 0, 0x8001, 0, "");
      expect(buf.readUInt32LE(24)).toBe(0x8001);
    });

    it("buildNotifyIconData sets hIcon at offset 32", () => {
      const buf = buildNotifyIconData(0, 0, 0, 0, 0xabcd, "");
      expect(buf.readBigUInt64LE(32)).toBe(BigInt(0xabcd));
    });

    it("buildNotifyIconData writes tip string at offset 40 as UTF-16LE", () => {
      const buf = buildNotifyIconData(0, 0, 0, 0, 0, "Hi");
      expect(buf.readUInt16LE(40)).toBe(0x48);
      expect(buf.readUInt16LE(42)).toBe(0x69);
    });

    it("buildKeyboardInput creates buffer of SIZEOF_INPUT bytes", () => {
      const buf = buildKeyboardInput(65, 0);
      expect(buf.length).toBe(SIZEOF_INPUT);
    });

    it("buildKeyboardInput sets type to INPUT_KEYBOARD", () => {
      const buf = buildKeyboardInput(0, 0);
      expect(buf.readUInt32LE(0)).toBe(INPUT_KEYBOARD);
    });

    it("buildKeyboardInput sets wScan at offset 10", () => {
      const buf = buildKeyboardInput(0x41, 0);
      expect(buf.readUInt16LE(10)).toBe(0x41);
    });

    it("buildKeyboardInput sets dwFlags at offset 12", () => {
      const buf = buildKeyboardInput(0, KEYEVENTF_UNICODE);
      expect(buf.readUInt32LE(12)).toBe(KEYEVENTF_UNICODE);
    });

    it("buildKeyboardInputArray creates correct number of events", () => {
      const buf = buildKeyboardInputArray("AB", KEYEVENTF_UNICODE, KEYEVENTF_UNICODE | KEYEVENTF_KEYUP);
      expect(buf.length).toBe(4 * SIZEOF_INPUT);
    });

    it("buildKeyboardInputArray sets correct char codes for each pair", () => {
      const buf = buildKeyboardInputArray("A", KEYEVENTF_UNICODE, KEYEVENTF_UNICODE | KEYEVENTF_KEYUP);
      expect(buf.readUInt16LE(10)).toBe(0x41);
      expect(buf.readUInt16LE(SIZEOF_INPUT + 10)).toBe(0x41);
    });

    it("buildKeyboardInputArray sets keydown and keyup flags", () => {
      const buf = buildKeyboardInputArray("X", KEYEVENTF_UNICODE, KEYEVENTF_UNICODE | KEYEVENTF_KEYUP);
      expect(buf.readUInt32LE(12)).toBe(KEYEVENTF_UNICODE);
      expect(buf.readUInt32LE(SIZEOF_INPUT + 12)).toBe(KEYEVENTF_UNICODE | KEYEVENTF_KEYUP);
    });

    it("buildMsg creates buffer of SIZEOF_MSG bytes", () => {
      expect(buildMsg().length).toBe(SIZEOF_MSG);
    });

    it("readMsgId reads uint32 at offset 8", () => {
      const msg = buildMsg();
      msg.writeUInt32LE(0x0312, 8);
      expect(readMsgId(msg)).toBe(0x0312);
    });

    it("buildPoint creates buffer of SIZEOF_POINT bytes", () => {
      expect(buildPoint().length).toBe(SIZEOF_POINT);
    });

    it("readPoint reads x and y as int32", () => {
      const pt = buildPoint();
      pt.writeInt32LE(100, 0);
      pt.writeInt32LE(200, 4);
      expect(readPoint(pt)).toEqual({ x: 100, y: 200 });
    });

    it("readPoint handles negative coordinates", () => {
      const pt = buildPoint();
      pt.writeInt32LE(-50, 0);
      pt.writeInt32LE(-100, 4);
      expect(readPoint(pt)).toEqual({ x: -50, y: -100 });
    });

    it("buildBitmapFileHeader creates buffer of SIZEOF_BITMAPFILEHEADER bytes", () => {
      expect(buildBitmapFileHeader(100, 54).length).toBe(SIZEOF_BITMAPFILEHEADER);
    });

    it("buildBitmapFileHeader sets BM signature", () => {
      const buf = buildBitmapFileHeader(0, 0);
      expect(buf.readUInt16LE(0)).toBe(0x4d42);
    });

    it("buildBitmapFileHeader sets file size at offset 2", () => {
      const buf = buildBitmapFileHeader(12345, 0);
      expect(buf.readUInt32LE(2)).toBe(12345);
    });

    it("buildBitmapFileHeader sets offBits at offset 10", () => {
      const buf = buildBitmapFileHeader(0, 54);
      expect(buf.readUInt32LE(10)).toBe(54);
    });

    it("buildBitmapFileHeader reserved fields are zero", () => {
      const buf = buildBitmapFileHeader(100, 54);
      expect(buf.readUInt16LE(6)).toBe(0);
      expect(buf.readUInt16LE(8)).toBe(0);
    });
  });

  describe("errors", () => {
    it("toWideString with very long string does not throw", () => {
      expect(() => toWideString("a".repeat(1000))).not.toThrow();
    });

    it("buildKeyboardInputArray with empty string creates zero-length buffer", () => {
      const buf = buildKeyboardInputArray("", 0, 0);
      expect(buf.length).toBe(0);
    });

    it("readPoint on zeroed buffer returns origin", () => {
      expect(readPoint(buildPoint())).toEqual({ x: 0, y: 0 });
    });

    it("readMsgId on zeroed buffer returns 0", () => {
      expect(readMsgId(buildMsg())).toBe(0);
    });
  });
});
