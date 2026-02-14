/**
 * @file Shortcut parsing — converts between shortcut strings and modifier/VK pairs.
 */
import { MOD_ALT, MOD_CONTROL, MOD_SHIFT } from "../win32/constants.ts";

export interface ParsedShortcut {
  modifiers: number;
  vk: number;
}

/** Map of key names to virtual key codes */
const VK_MAP: Record<string, number> = {
  // Letters A-Z
  ...Object.fromEntries(
    Array.from({ length: 26 }, (_, i) => [String.fromCharCode(65 + i), 0x41 + i]),
  ),
  // Digits 0-9
  ...Object.fromEntries(
    Array.from({ length: 10 }, (_, i) => [String(i), 0x30 + i]),
  ),
  // Function keys F1-F12
  ...Object.fromEntries(
    Array.from({ length: 12 }, (_, i) => [`F${i + 1}`, 0x70 + i]),
  ),
  // Special keys
  INSERT: 0x2d,
  DELETE: 0x2e,
  HOME: 0x24,
  END: 0x23,
  PAGEUP: 0x21,
  PGUP: 0x21,
  PAGEDOWN: 0x22,
  PGDN: 0x22,
  SPACE: 0x20,
  TAB: 0x09,
  ESCAPE: 0x1b,
  ESC: 0x1b,
  BACKSPACE: 0x08,
  ENTER: 0x0d,
  RETURN: 0x0d,
  UP: 0x26,
  DOWN: 0x28,
  LEFT: 0x25,
  RIGHT: 0x27,
  PRINTSCREEN: 0x2c,
  PRTSC: 0x2c,
  PAUSE: 0x13,
  SCROLLLOCK: 0x91,
  NUMLOCK: 0x90,
  CAPSLOCK: 0x14,
};

/** Reverse map: VK code → display name */
const VK_NAME_MAP: Map<number, string> = new Map();
// Populate with preferred display names (first wins)
for (const [name, vk] of Object.entries(VK_MAP)) {
  if (!VK_NAME_MAP.has(vk)) {
    VK_NAME_MAP.set(vk, name.length === 1 ? name : name[0] + name.slice(1).toLowerCase());
  }
}
// Override specific display names
VK_NAME_MAP.set(0x21, "PgUp");
VK_NAME_MAP.set(0x22, "PgDn");
VK_NAME_MAP.set(0x2c, "PrtSc");

/** Modifier name → MOD flag */
const MODIFIER_MAP: Record<string, number> = {
  CTRL: MOD_CONTROL,
  CONTROL: MOD_CONTROL,
  SHIFT: MOD_SHIFT,
  ALT: MOD_ALT,
};

/**
 * Parse a shortcut string like "Ctrl+Shift+V" into modifiers and VK code.
 * Throws if the string is invalid.
 */
export function parseShortcut(str: string): ParsedShortcut {
  const parts = str.split("+").map((p) => p.trim().toUpperCase());
  if (parts.length === 0) throw new Error(`Invalid shortcut: "${str}"`);

  let modifiers = 0;
  let vk = 0;

  for (const part of parts) {
    const mod = MODIFIER_MAP[part];
    if (mod !== undefined) {
      modifiers |= mod;
      continue;
    }

    const key = VK_MAP[part];
    if (key === undefined) throw new Error(`Unknown key: "${part}" in shortcut "${str}"`);
    if (vk !== 0) throw new Error(`Multiple non-modifier keys in shortcut: "${str}"`);
    vk = key;
  }

  if (vk === 0) throw new Error(`No key specified in shortcut: "${str}"`);

  // Require at least one modifier unless it's a function key
  const isFunctionKey = vk >= 0x70 && vk <= 0x7b;
  if (modifiers === 0 && !isFunctionKey) {
    throw new Error(`Shortcut "${str}" requires at least one modifier (Ctrl, Shift, or Alt)`);
  }

  return { modifiers, vk };
}

/**
 * Convert modifiers and VK code back to a display string like "Ctrl+Shift+V".
 */
export function shortcutToString(modifiers: number, vk: number): string {
  const parts: string[] = [];
  if (modifiers & MOD_CONTROL) parts.push("Ctrl");
  if (modifiers & MOD_ALT) parts.push("Alt");
  if (modifiers & MOD_SHIFT) parts.push("Shift");

  const keyName = VK_NAME_MAP.get(vk);
  parts.push(keyName ?? `0x${vk.toString(16)}`);

  return parts.join("+");
}

/** Get a VK code by key name (for capture matching). Returns 0 if not found. */
export function getVkByName(name: string): number {
  return VK_MAP[name.toUpperCase()] ?? 0;
}

/** Get the display name for a VK code. */
export function getVkName(vk: number): string | undefined {
  return VK_NAME_MAP.get(vk);
}

/** List of non-modifier VK codes that can be captured. */
export const CAPTURABLE_VKS: number[] = Object.values(VK_MAP);
