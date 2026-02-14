/**
 * @file Shortcut capture — polls GetAsyncKeyState to let the user press a new hotkey combo.
 */
import { updateConfig } from "../config.ts";
import { getHotkeyModifiers, getHotkeyVk, reregisterHotkey, unregisterHotkey } from "../hotkey.ts";
import { CAPTURABLE_VKS, shortcutToString } from "../input/shortcut.ts";
import { MOD_ALT, MOD_CONTROL, MOD_SHIFT } from "../win32/constants.ts";
import { GetAsyncKeyState } from "../win32/user32.ts";
import { showBalloon } from "./icon.ts";

const VK_ESCAPE = 0x1b;
const VK_LCONTROL = 0xa2;
const VK_RCONTROL = 0xa3;
const VK_LSHIFT = 0xa0;
const VK_RSHIFT = 0xa1;
const VK_LMENU = 0xa4; // Left Alt
const VK_RMENU = 0xa5; // Right Alt

const POLL_INTERVAL_MS = 50;
const TIMEOUT_MS = 10_000;
const INITIAL_DELAY_MS = 500;

let capturing = false;

/** Whether a shortcut capture is currently in progress */
export function isCapturing(): boolean {
  return capturing;
}

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

// Modifier VK codes to skip when scanning for the main key
const MODIFIER_VKS = new Set([
  VK_LCONTROL, VK_RCONTROL, 0x11, // VK_CONTROL
  VK_LSHIFT, VK_RSHIFT, 0x10, // VK_SHIFT
  VK_LMENU, VK_RMENU, 0x12, // VK_MENU
]);

/**
 * Start capturing a new shortcut.
 * Unregisters the current hotkey, shows a balloon prompt, and polls for input.
 */
export function startCapture(): void {
  if (capturing) return;
  capturing = true;

  const prevModifiers = getHotkeyModifiers();
  const prevVk = getHotkeyVk();

  unregisterHotkey();
  showBalloon("Change Shortcut", "Press your desired shortcut combination...\nPress Escape to cancel.");

  const startTime = Date.now();
  let started = false;

  const timer = setInterval(() => {
    // Initial delay to avoid capturing the click that triggered this
    if (!started) {
      if (Date.now() - startTime < INITIAL_DELAY_MS) return;
      started = true;
    }

    // Check for Escape → cancel
    if (isKeyDown(VK_ESCAPE)) {
      clearInterval(timer);
      capturing = false;
      reregisterHotkey(prevModifiers, prevVk);
      showBalloon("Shortcut Unchanged", `Keeping: ${shortcutToString(prevModifiers, prevVk)}`);
      return;
    }

    // Timeout
    if (Date.now() - startTime > TIMEOUT_MS) {
      clearInterval(timer);
      capturing = false;
      reregisterHotkey(prevModifiers, prevVk);
      showBalloon("Shortcut Unchanged", "Timed out. Keeping previous shortcut.");
      return;
    }

    const mods = getModifiers();

    // Scan for a non-modifier key that is pressed
    for (const vk of CAPTURABLE_VKS) {
      if (MODIFIER_VKS.has(vk)) continue;
      if (vk === VK_ESCAPE) continue;

      if (!isKeyDown(vk)) continue;

      // Found a key press! Check validity
      const isFunctionKey = vk >= 0x70 && vk <= 0x7b;
      if (mods === 0 && !isFunctionKey) continue; // Need modifier for non-F keys

      clearInterval(timer);
      capturing = false;

      const success = reregisterHotkey(mods, vk);
      if (success) {
        const shortcutStr = shortcutToString(mods, vk);
        updateConfig({ shortcut: shortcutStr });
        showBalloon("Shortcut Changed", `New shortcut: ${shortcutStr}`);
        console.log(`[shortcut] Changed to ${shortcutStr}`);
      } else {
        // Failed to register — restore previous
        reregisterHotkey(prevModifiers, prevVk);
        showBalloon("Shortcut Failed", "Could not register that shortcut. It may be in use by another app.");
      }
      return;
    }
  }, POLL_INTERVAL_MS);
}
