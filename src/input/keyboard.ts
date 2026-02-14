/**
 * @file Keyboard input — types a string into the foreground window via SendInput.
 */
import { ptr } from "bun:ffi";
import { SIZEOF_INPUT } from "../win32/constants.ts";
import { SendInput } from "../win32/user32.ts";
import { buildCharacterEvents } from "./key-events.ts";
import { getTargetKeyboardLayout, waitForKeyRelease } from "./key-state.ts";

/** Build the full list of INPUT events for a text string. */
function buildEventList(text: string, hkl: number): Buffer[] {
  const events: Buffer[] = [];
  for (const ch of text) {
    events.push(...buildCharacterEvents(ch, hkl));
  }
  return events;
}

/** Send an array of INPUT events via SendInput. Returns true on success. */
function sendEvents(events: Buffer[]): boolean {
  const totalBuf = Buffer.concat(events);
  const sent = SendInput(events.length, ptr(totalBuf), SIZEOF_INPUT);
  if (sent !== events.length) {
    console.error(`SendInput: sent ${sent}/${events.length} events`);
    return false;
  }
  return true;
}

/** Type a string into the currently focused window using SendInput. */
export function typeString(text: string): boolean {
  if (text.length === 0) return true;

  waitForKeyRelease();

  const hkl = getTargetKeyboardLayout();
  console.log(`[paste] Target keyboard layout HKL=0x${hkl.toString(16)}`);

  const events = buildEventList(text, hkl);
  return sendEvents(events);
}
