/**
 * @file Key event builders — construct INPUT structs for SendInput keyboard simulation.
 */

import { INPUT_KEYBOARD, KEYEVENTF_KEYUP, KEYEVENTF_UNICODE, SIZEOF_INPUT } from "../win32/constants.ts";
import { asPtr } from "../win32/structs.ts";
import { MapVirtualKeyW, VkKeyScanExW } from "../win32/user32.ts";

const VK_CONTROL = 0x11;
const VK_SHIFT = 0x10;
const VK_MENU = 0x12;
const MAPVK_VK_TO_VSC = 0;

/** Build a single keyboard INPUT struct. */
function buildInput(wVk: number, wScan: number, dwFlags: number): Buffer {
  const buf = Buffer.alloc(SIZEOF_INPUT);
  buf.writeUInt32LE(INPUT_KEYBOARD, 0);
  buf.writeUInt16LE(wVk, 8);
  buf.writeUInt16LE(wScan, 10);
  buf.writeUInt32LE(dwFlags, 12);
  return buf;
}

/** Build a Unicode key-down + key-up pair for an unmappable character. */
export function buildUnicodeKeyPair(charCode: number): Buffer[] {
  return [buildInput(0, charCode, KEYEVENTF_UNICODE), buildInput(0, charCode, KEYEVENTF_UNICODE | KEYEVENTF_KEYUP)];
}

function scanForVk(vk: number): number {
  return MapVirtualKeyW(vk, MAPVK_VK_TO_VSC) as number;
}

/** Build a VK key-down + key-up sequence with modifier presses/releases. */
export function buildVkKeySequence(vk: number, shiftState: number): Buffer[] {
  const needShift = (shiftState & 1) !== 0;
  const needCtrl = (shiftState & 2) !== 0;
  const needAlt = (shiftState & 4) !== 0;
  const scanCode = scanForVk(vk);
  const events: Buffer[] = [];

  if (needCtrl) events.push(buildInput(VK_CONTROL, scanForVk(VK_CONTROL), 0));
  if (needAlt) events.push(buildInput(VK_MENU, scanForVk(VK_MENU), 0));
  if (needShift) events.push(buildInput(VK_SHIFT, scanForVk(VK_SHIFT), 0));

  events.push(buildInput(vk, scanCode, 0));
  events.push(buildInput(vk, scanCode, KEYEVENTF_KEYUP));

  if (needShift) events.push(buildInput(VK_SHIFT, scanForVk(VK_SHIFT), KEYEVENTF_KEYUP));
  if (needAlt) events.push(buildInput(VK_MENU, scanForVk(VK_MENU), KEYEVENTF_KEYUP));
  if (needCtrl) events.push(buildInput(VK_CONTROL, scanForVk(VK_CONTROL), KEYEVENTF_KEYUP));

  return events;
}

/** Build all keyboard events for a single character using the target keyboard layout. */
export function buildCharacterEvents(ch: string, hkl: number): Buffer[] {
  const charCode = ch.charCodeAt(0);
  const vkResult = hkl ? VkKeyScanExW(charCode, asPtr(hkl)) : -1;

  if (vkResult === -1) return buildUnicodeKeyPair(charCode);

  const vk = vkResult & 0xff;
  const shiftState = (vkResult >> 8) & 0xff;
  return buildVkKeySequence(vk, shiftState);
}
