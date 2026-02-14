/**
 * @file Key state utilities — physical key detection and keyboard layout lookup.
 */

import { asPtr } from "../win32/structs.ts";
import { GetAsyncKeyState, GetForegroundWindow, GetKeyboardLayout, GetWindowThreadProcessId } from "../win32/user32.ts";

const VK_CONTROL = 0x11;
const VK_SHIFT = 0x10;
const VK_MENU = 0x12;
const VK_V = 0x56;

/** Check if a key is currently physically pressed. */
export function isKeyDown(vk: number): boolean {
  return (GetAsyncKeyState(vk) & 0x8000) !== 0;
}

/** Wait for the user to release modifier keys + V (max 2 seconds). */
export function waitForKeyRelease(): void {
  const start = Date.now();
  const MAX_WAIT = 2000;

  while (Date.now() - start < MAX_WAIT) {
    const allUp = !isKeyDown(VK_CONTROL) && !isKeyDown(VK_SHIFT) && !isKeyDown(VK_MENU) && !isKeyDown(VK_V);
    if (allUp) return;
    Bun.sleepSync(5);
  }
  console.log("[paste] Warning: modifier keys still held after 2s timeout");
}

/** Get the keyboard layout (HKL) of the foreground window's thread. */
export function getTargetKeyboardLayout(): number {
  const hwnd = GetForegroundWindow() as number;
  if (!hwnd) return 0;
  const threadId = GetWindowThreadProcessId(asPtr(hwnd), null) as number;
  if (!threadId) return 0;
  return GetKeyboardLayout(threadId) as number;
}
