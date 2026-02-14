/**
 * @file Shortcut capture API — state machine for browser-driven shortcut capture.
 * Uses GetAsyncKeyState polling (works regardless of which window has focus).
 * Prevents concurrent captures with the tray capture via isCapturing().
 */
import { updateConfig } from "../config.ts";
import { getHotkeyModifiers, getHotkeyVk, reregisterHotkey, unregisterHotkey } from "../hotkey.ts";
import { CAPTURABLE_VKS, shortcutToString } from "../input/shortcut.ts";
import { MOD_ALT, MOD_CONTROL, MOD_SHIFT } from "../win32/constants.ts";
import { GetAsyncKeyState } from "../win32/user32.ts";
import { isCapturing as isTrayCapturing } from "../tray/shortcut-capture.ts";

const VK_ESCAPE = 0x1b;
const VK_LCONTROL = 0xa2;
const VK_RCONTROL = 0xa3;
const VK_LSHIFT = 0xa0;
const VK_RSHIFT = 0xa1;
const VK_LMENU = 0xa4;
const VK_RMENU = 0xa5;

const POLL_INTERVAL_MS = 50;
const TIMEOUT_MS = 10_000;
const INITIAL_DELAY_MS = 500;

const MODIFIER_VKS = new Set([
  VK_LCONTROL, VK_RCONTROL, 0x11,
  VK_LSHIFT, VK_RSHIFT, 0x10,
  VK_LMENU, VK_RMENU, 0x12,
]);

export type CaptureStatus = "idle" | "capturing" | "done" | "cancelled" | "failed";

interface CaptureState {
  status: CaptureStatus;
  shortcut?: string;
}

let state: CaptureState = { status: "idle" };
let timer: ReturnType<typeof setInterval> | null = null;
let prevModifiers = 0;
let prevVk = 0;

function isKeyDown(vk: number): boolean {
  return (GetAsyncKeyState(vk) & 0x8000) !== 0;
}

function getModifiers(): number {
  let mods = 0;
  if (isKeyDown(VK_LCONTROL) || isKeyDown(VK_RCONTROL)) mods |= MOD_CONTROL;
  if (isKeyDown(VK_LSHIFT) || isKeyDown(VK_RSHIFT)) mods |= MOD_SHIFT;
  if (isKeyDown(VK_LMENU) || isKeyDown(VK_RMENU)) mods |= MOD_ALT;
  return mods;
}

function cleanup(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

/** Start capturing a new shortcut via API. */
export function startApiCapture(): boolean {
  if (state.status === "capturing" || isTrayCapturing()) return false;

  prevModifiers = getHotkeyModifiers();
  prevVk = getHotkeyVk();
  unregisterHotkey();

  state = { status: "capturing" };
  const startTime = Date.now();
  let started = false;

  timer = setInterval(() => {
    if (!started) {
      if (Date.now() - startTime < INITIAL_DELAY_MS) return;
      started = true;
    }

    // Escape → cancel
    if (isKeyDown(VK_ESCAPE)) {
      cleanup();
      reregisterHotkey(prevModifiers, prevVk);
      state = { status: "cancelled" };
      return;
    }

    // Timeout
    if (Date.now() - startTime > TIMEOUT_MS) {
      cleanup();
      reregisterHotkey(prevModifiers, prevVk);
      state = { status: "cancelled" };
      return;
    }

    const mods = getModifiers();

    for (const vk of CAPTURABLE_VKS) {
      if (MODIFIER_VKS.has(vk)) continue;
      if (vk === VK_ESCAPE) continue;
      if (!isKeyDown(vk)) continue;

      const isFunctionKey = vk >= 0x70 && vk <= 0x7b;
      if (mods === 0 && !isFunctionKey) continue;

      cleanup();

      const success = reregisterHotkey(mods, vk);
      if (success) {
        const shortcutStr = shortcutToString(mods, vk);
        updateConfig({ shortcut: shortcutStr });
        state = { status: "done", shortcut: shortcutStr };
        console.log(`[shortcut-api] Changed to ${shortcutStr}`);
      } else {
        reregisterHotkey(prevModifiers, prevVk);
        state = { status: "failed" };
      }
      return;
    }
  }, POLL_INTERVAL_MS);

  return true;
}

/** Cancel an in-progress capture. */
export function cancelApiCapture(): void {
  if (state.status !== "capturing") return;
  cleanup();
  reregisterHotkey(prevModifiers, prevVk);
  state = { status: "cancelled" };
}

/** Get the current capture state. Reading a terminal state resets to idle. */
export function getCaptureStatus(): CaptureState {
  const current = { ...state };
  if (state.status !== "idle" && state.status !== "capturing") {
    state = { status: "idle" };
  }
  return current;
}
