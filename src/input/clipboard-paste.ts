/**
 * @file Clipboard paste — puts text into the clipboard and simulates Ctrl+V.
 * Works universally in terminals, text editors, and GUI apps.
 */
import { ptr } from "bun:ffi";
import { CF_UNICODETEXT, GMEM_MOVEABLE, SIZEOF_INPUT } from "../win32/constants.ts";
import { GlobalAlloc, GlobalLock, GlobalUnlock, RtlMoveMemory } from "../win32/kernel32.ts";
import { asPtr, toWideString } from "../win32/structs.ts";
import {
  CloseClipboard,
  EmptyClipboard,
  OpenClipboard,
  SendInput,
  SetClipboardData,
} from "../win32/user32.ts";
import { waitForKeyRelease } from "./key-state.ts";

const INPUT_KEYBOARD = 1;
const KEYEVENTF_KEYUP = 0x0002;
const VK_CONTROL = 0x11;
const VK_V = 0x56;

function buildKeyInput(wVk: number, wScan: number, dwFlags: number): Buffer {
  const buf = Buffer.alloc(SIZEOF_INPUT);
  buf.writeUInt32LE(INPUT_KEYBOARD, 0);
  buf.writeUInt16LE(wVk, 8);
  buf.writeUInt16LE(wScan, 10);
  buf.writeUInt32LE(dwFlags, 12);
  return buf;
}

/** Place a UTF-16 string into the clipboard as CF_UNICODETEXT. */
function setClipboardText(text: string): boolean {
  // Build the UTF-16LE buffer in JS-managed memory (includes null terminator)
  const jsBuf = toWideString(text);
  const byteLen = jsBuf.length;

  const hMem = GlobalAlloc(GMEM_MOVEABLE, byteLen) as number;
  if (!hMem) return false;

  const pMem = GlobalLock(asPtr(hMem)) as number;
  if (!pMem) return false;

  // Copy from JS buffer to native GlobalAlloc'd memory via RtlMoveMemory.
  // Avoids creating a JS view over native memory (which causes GC segfaults).
  RtlMoveMemory(asPtr(pMem), ptr(jsBuf), byteLen);
  GlobalUnlock(asPtr(hMem));

  if (!OpenClipboard(null)) return false;
  EmptyClipboard();
  const result = SetClipboardData(CF_UNICODETEXT, asPtr(hMem)) as number;
  CloseClipboard();

  return result !== 0;
}

/** Simulate Ctrl+V keypress via SendInput. */
function sendCtrlV(): boolean {
  const events = [
    buildKeyInput(VK_CONTROL, 0x1d, 0),               // Ctrl down
    buildKeyInput(VK_V, 0x2f, 0),                      // V down
    buildKeyInput(VK_V, 0x2f, KEYEVENTF_KEYUP),        // V up
    buildKeyInput(VK_CONTROL, 0x1d, KEYEVENTF_KEYUP),  // Ctrl up
  ];

  const buf = Buffer.concat(events);
  const sent = SendInput(events.length, ptr(buf), SIZEOF_INPUT);
  return sent === events.length;
}

/** Paste text into the focused window via clipboard + Ctrl+V. */
export function pasteString(text: string): boolean {
  if (text.length === 0) return true;

  waitForKeyRelease();

  if (!setClipboardText(text)) {
    console.error("[paste] Failed to set clipboard text");
    return false;
  }

  return sendCtrlV();
}
