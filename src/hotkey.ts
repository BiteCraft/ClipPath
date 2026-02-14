/**
 * @file Global hotkey — register/unregister configurable hotkey and dispatch presses.
 */
import { HOTKEY_ID, MOD_NOREPEAT, WM_HOTKEY } from "./win32/constants.ts";
import { asPtr } from "./win32/structs.ts";
import { RegisterHotKey, UnregisterHotKey } from "./win32/user32.ts";
import { onMessage } from "./window/message-bus.ts";
import { getHwnd } from "./window/message-window.ts";

let hotkeyRegistered = false;
let messageHandlerRegistered = false;
let onHotkeyCallback: (() => void) | null = null;
let currentModifiers = 0;
let currentVk = 0;

/** Set callback for when the hotkey is pressed */
export function onHotkeyPress(callback: () => void): void {
  onHotkeyCallback = callback;
}

/** Get current hotkey modifiers */
export function getHotkeyModifiers(): number {
  return currentModifiers;
}

/** Get current hotkey VK code */
export function getHotkeyVk(): number {
  return currentVk;
}

/** Whether the hotkey is currently registered */
export function isHotkeyRegistered(): boolean {
  return hotkeyRegistered;
}

/** Register the global hotkey with specified modifiers and virtual key code */
export function registerHotkey(modifiers: number, vk: number): boolean {
  const hwnd = getHwnd();
  const result = RegisterHotKey(asPtr(hwnd), HOTKEY_ID, modifiers | MOD_NOREPEAT, vk);

  if (!result) {
    console.error(`RegisterHotKey failed - shortcut may be in use by another app`);
    return false;
  }

  hotkeyRegistered = true;
  currentModifiers = modifiers;
  currentVk = vk;

  // Register message handler only once
  if (!messageHandlerRegistered) {
    onMessage((_hwnd, uMsg, wParam, _lParam) => {
      if (uMsg === WM_HOTKEY && wParam === HOTKEY_ID) {
        if (onHotkeyCallback) {
          onHotkeyCallback();
        }
        return 0;
      }
      return null;
    });
    messageHandlerRegistered = true;
  }

  return true;
}

/** Unregister the global hotkey */
export function unregisterHotkey(): void {
  if (hotkeyRegistered) {
    UnregisterHotKey(asPtr(getHwnd()), HOTKEY_ID);
    hotkeyRegistered = false;
  }
}

/** Unregister old hotkey and register a new one. Returns true on success. */
export function reregisterHotkey(modifiers: number, vk: number): boolean {
  unregisterHotkey();
  return registerHotkey(modifiers, vk);
}
