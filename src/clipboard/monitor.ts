/**
 * @file Clipboard monitor — watches for image changes via WM_CLIPBOARDUPDATE.
 * Uses a callback pattern to decouple from tray (no circular dependency).
 */

import { CF_DIB, WM_CLIPBOARDUPDATE } from "../win32/constants.ts";
import { asPtr } from "../win32/structs.ts";
import {
  AddClipboardFormatListener,
  IsClipboardFormatAvailable,
  RemoveClipboardFormatListener,
} from "../win32/user32.ts";
import { onMessage } from "../window/message-bus.ts";
import { getHwnd } from "../window/message-window.ts";

let listenerActive = false;
let imageAvailable = false;
let onImageChangeCallback: ((hasImage: boolean) => void) | null = null;

/** Check if clipboard currently has an image. */
export function hasClipboardImage(): boolean {
  return imageAvailable;
}

/** Set callback for when clipboard image state changes. */
export function setOnImageChange(callback: (hasImage: boolean) => void): void {
  onImageChangeCallback = callback;
}

/** Start listening for clipboard changes. */
export function startClipboardMonitor(): void {
  const hwnd = getHwnd();
  const result = AddClipboardFormatListener(asPtr(hwnd));
  if (!result) {
    console.error("AddClipboardFormatListener failed");
    return;
  }
  listenerActive = true;

  checkClipboardImage();

  onMessage((_hwnd, uMsg) => {
    if (uMsg === WM_CLIPBOARDUPDATE) {
      checkClipboardImage();
      return 0;
    }
    return null;
  });
}

/** Stop listening for clipboard changes. */
export function stopClipboardMonitor(): void {
  if (listenerActive) {
    RemoveClipboardFormatListener(asPtr(getHwnd()));
    listenerActive = false;
  }
}

function checkClipboardImage(): void {
  const available = IsClipboardFormatAvailable(CF_DIB) !== 0;
  if (available !== imageAvailable) {
    imageAvailable = available;
    onImageChangeCallback?.(imageAvailable);
  }
}
