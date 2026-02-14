/**
 * @file Message loop — non-blocking pump for Win32 window messages.
 */
import { ptr } from "bun:ffi";
import { PM_REMOVE } from "../win32/constants.ts";
import { buildMsg } from "../win32/structs.ts";
import { DispatchMessageW, PeekMessageW, TranslateMessage } from "../win32/user32.ts";

let interval: ReturnType<typeof setInterval> | null = null;

/** Process pending window messages (non-blocking). */
export function pumpMessages(): void {
  const msg = buildMsg();
  while (PeekMessageW(ptr(msg), null, 0, 0, PM_REMOVE)) {
    TranslateMessage(ptr(msg));
    DispatchMessageW(ptr(msg));
  }
}

/** Start the non-blocking message loop (uses setInterval). */
export function startMessageLoop(): void {
  interval = setInterval(pumpMessages, 16);
}

/** Stop the message loop. */
export function stopMessageLoop(): void {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
}
