import type { Pointer } from "bun:ffi";
import {
  INPUT_KEYBOARD,
  SIZEOF_BITMAPFILEHEADER,
  SIZEOF_INPUT,
  SIZEOF_MSG,
  SIZEOF_NOTIFYICONDATAW,
  SIZEOF_POINT,
  SIZEOF_WNDCLASSW,
} from "./constants.ts";

/**
 * Cast a raw numeric pointer value to Bun's Pointer type.
 * FFI functions return pointers as `number`, but parameters expect `Pointer`.
 * At runtime numbers are accepted; this satisfies the type checker.
 */
export function asPtr(value: number): Pointer {
  return value as unknown as Pointer;
}

/** Write a pointer-sized value (8 bytes on x64) into a buffer */
export function writePointer(buf: Buffer, offset: number, value: number): void {
  buf.writeBigUInt64LE(BigInt(value), offset);
}

/** Encode a JS string as a null-terminated UTF-16LE buffer */
export function toWideString(str: string): Buffer {
  const buf = Buffer.alloc((str.length + 1) * 2);
  for (let i = 0; i < str.length; i++) {
    buf.writeUInt16LE(str.charCodeAt(i), i * 2);
  }
  // null terminator is already 0 from Buffer.alloc
  return buf;
}

/** Write a UTF-16LE string into a buffer at a given offset (with max byte length) */
export function writeWideStringInto(buf: Buffer, offset: number, str: string, maxBytes: number): void {
  const maxChars = Math.floor(maxBytes / 2) - 1; // -1 for null terminator
  const len = Math.min(str.length, maxChars);
  for (let i = 0; i < len; i++) {
    buf.writeUInt16LE(str.charCodeAt(i), offset + i * 2);
  }
}

/**
 * Build WNDCLASSW struct (72 bytes on x64)
 * Layout:
 *   0: UINT style (4)
 *   4: padding (4)
 *   8: WNDPROC lpfnWndProc (8)
 *  16: int cbClsExtra (4)
 *  20: int cbWndExtra (4)
 *  24: HINSTANCE hInstance (8)
 *  32: HICON hIcon (8)
 *  40: HCURSOR hCursor (8)
 *  48: HBRUSH hbrBackground (8)
 *  56: LPCWSTR lpszMenuName (8)
 *  64: LPCWSTR lpszClassName (8)
 */
export function buildWndClassW(wndProc: number, hInstance: number, classNamePtr: number): Buffer {
  const buf = Buffer.alloc(SIZEOF_WNDCLASSW);
  // style = 0
  writePointer(buf, 8, wndProc); // lpfnWndProc
  writePointer(buf, 24, hInstance); // hInstance
  writePointer(buf, 64, classNamePtr); // lpszClassName
  return buf;
}

/**
 * Build NOTIFYICONDATAW struct (976 bytes on x64)
 * Key offsets:
 *   0: DWORD cbSize (4)
 *   4: padding (4)
 *   8: HWND hWnd (8)
 *  16: UINT uID (4)
 *  20: UINT uFlags (4)
 *  24: UINT uCallbackMessage (4)
 *  28: padding (4)
 *  32: HICON hIcon (8)
 *  40: WCHAR szTip[128] (256 bytes)
 */
export function buildNotifyIconData(
  hWnd: number,
  uID: number,
  uFlags: number,
  uCallbackMessage: number,
  hIcon: number,
  tip: string,
): Buffer {
  const buf = Buffer.alloc(SIZEOF_NOTIFYICONDATAW);
  buf.writeUInt32LE(SIZEOF_NOTIFYICONDATAW, 0); // cbSize
  writePointer(buf, 8, hWnd); // hWnd
  buf.writeUInt32LE(uID, 16); // uID
  buf.writeUInt32LE(uFlags, 20); // uFlags
  buf.writeUInt32LE(uCallbackMessage, 24); // uCallbackMessage
  writePointer(buf, 32, hIcon); // hIcon
  writeWideStringInto(buf, 40, tip, 256); // szTip[128]
  return buf;
}

/**
 * Build INPUT struct for keyboard event (40 bytes on x64)
 * Layout:
 *   0: DWORD type (4) = INPUT_KEYBOARD
 *   4: padding (4)
 *   8: WORD wVk (2)
 *  10: WORD wScan (2)
 *  12: DWORD dwFlags (4)
 *  16: DWORD time (4)
 *  20: padding (4)
 *  24: ULONG_PTR dwExtraInfo (8)
 * Total: 32 bytes union + 8 bytes header = 40
 */
export function buildKeyboardInput(wScan: number, dwFlags: number): Buffer {
  const buf = Buffer.alloc(SIZEOF_INPUT);
  buf.writeUInt32LE(INPUT_KEYBOARD, 0); // type
  buf.writeUInt16LE(0, 8); // wVk = 0
  buf.writeUInt16LE(wScan, 10); // wScan = character code
  buf.writeUInt32LE(dwFlags, 12); // dwFlags
  return buf;
}

/**
 * Build array of INPUT structs for typing a string via KEYEVENTF_UNICODE.
 * Each character becomes a keydown + keyup pair.
 */
export function buildKeyboardInputArray(text: string, keydownFlags: number, keyupFlags: number): Buffer {
  const count = text.length * 2; // keydown + keyup per char
  const buf = Buffer.alloc(count * SIZEOF_INPUT);

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const baseOffset = i * 2 * SIZEOF_INPUT;

    // Keydown
    buf.writeUInt32LE(INPUT_KEYBOARD, baseOffset);
    buf.writeUInt16LE(0, baseOffset + 8);
    buf.writeUInt16LE(charCode, baseOffset + 10);
    buf.writeUInt32LE(keydownFlags, baseOffset + 12);

    // Keyup
    buf.writeUInt32LE(INPUT_KEYBOARD, baseOffset + SIZEOF_INPUT);
    buf.writeUInt16LE(0, baseOffset + SIZEOF_INPUT + 8);
    buf.writeUInt16LE(charCode, baseOffset + SIZEOF_INPUT + 10);
    buf.writeUInt32LE(keyupFlags, baseOffset + SIZEOF_INPUT + 12);
  }

  return buf;
}

/** Build MSG struct buffer (48 bytes on x64) */
export function buildMsg(): Buffer {
  return Buffer.alloc(SIZEOF_MSG);
}

/** Read message ID from MSG struct */
export function readMsgId(msg: Buffer): number {
  return msg.readUInt32LE(8);
}

/** Build POINT struct buffer (8 bytes) */
export function buildPoint(): Buffer {
  return Buffer.alloc(SIZEOF_POINT);
}

/** Read x, y from POINT struct */
export function readPoint(pt: Buffer): { x: number; y: number } {
  return {
    x: pt.readInt32LE(0),
    y: pt.readInt32LE(4),
  };
}

/**
 * Build BITMAPFILEHEADER (14 bytes, packed)
 * Layout:
 *   0: WORD bfType = 'BM' (0x4D42)
 *   2: DWORD bfSize
 *   6: WORD bfReserved1 = 0
 *   8: WORD bfReserved2 = 0
 *  10: DWORD bfOffBits
 */
export function buildBitmapFileHeader(fileSize: number, offBits: number): Buffer {
  const buf = Buffer.alloc(SIZEOF_BITMAPFILEHEADER);
  buf.writeUInt16LE(0x4d42, 0); // 'BM'
  buf.writeUInt32LE(fileSize, 2); // bfSize
  // bfReserved1, bfReserved2 = 0 (already zeroed)
  buf.writeUInt32LE(offBits, 10); // bfOffBits
  return buf;
}
