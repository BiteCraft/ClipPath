/**
 * @file Clipboard extraction — reads DIB image data from the Win32 clipboard.
 */
import { toArrayBuffer } from "bun:ffi";
import { CF_DIB } from "../win32/constants.ts";
import { GlobalLock, GlobalSize, GlobalUnlock } from "../win32/kernel32.ts";
import { asPtr } from "../win32/structs.ts";
import { CloseClipboard, GetClipboardData, IsClipboardFormatAvailable, OpenClipboard } from "../win32/user32.ts";
import { getHwnd } from "../window/message-window.ts";

/** Extract the DIB data from clipboard. Returns null if no image available. */
export function extractClipboardDIB(): Buffer | null {
  if (!IsClipboardFormatAvailable(CF_DIB)) return null;

  if (!OpenClipboard(asPtr(getHwnd()))) {
    console.error("OpenClipboard failed");
    return null;
  }

  try {
    const hData = GetClipboardData(CF_DIB) as number;
    if (!hData) return null;

    const size = Number(GlobalSize(asPtr(hData)));
    if (size === 0) return null;

    const dataPtr = GlobalLock(asPtr(hData)) as number;
    if (!dataPtr) return null;

    try {
      const arrayBuf = toArrayBuffer(asPtr(dataPtr), 0, size);
      return Buffer.from(arrayBuf);
    } finally {
      GlobalUnlock(asPtr(hData));
    }
  } finally {
    CloseClipboard();
  }
}
