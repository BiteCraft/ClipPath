/**
 * @file Test which SendInput method types visible text into a terminal.
 * Run this, then switch to another window (Notepad, terminal, etc.) within 3 seconds.
 */
import { ptr } from "bun:ffi";
import { INPUT_KEYBOARD, KEYEVENTF_KEYUP, KEYEVENTF_UNICODE, SIZEOF_INPUT } from "../src/win32/constants.ts";
import { MapVirtualKeyW, SendInput, VkKeyScanW } from "../src/win32/user32.ts";

const MAPVK_VK_TO_VSC = 0;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Method 1: KEYEVENTF_UNICODE (wVk=0, wScan=charCode) */
function typeUnicode(text: string): number {
  const count = text.length * 2;
  const buf = Buffer.alloc(count * SIZEOF_INPUT);
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    const off = i * 2 * SIZEOF_INPUT;
    buf.writeUInt32LE(INPUT_KEYBOARD, off);
    buf.writeUInt16LE(0, off + 8);
    buf.writeUInt16LE(ch, off + 10);
    buf.writeUInt32LE(KEYEVENTF_UNICODE, off + 12);
    buf.writeUInt32LE(INPUT_KEYBOARD, off + SIZEOF_INPUT);
    buf.writeUInt16LE(0, off + SIZEOF_INPUT + 8);
    buf.writeUInt16LE(ch, off + SIZEOF_INPUT + 10);
    buf.writeUInt32LE(KEYEVENTF_UNICODE | KEYEVENTF_KEYUP, off + SIZEOF_INPUT + 12);
  }
  return SendInput(count, ptr(buf), SIZEOF_INPUT) as number;
}

/** Method 2: Virtual key codes via VkKeyScanW */
function typeVK(text: string): number {
  const events: Buffer[] = [];

  for (const ch of text) {
    const vkResult = VkKeyScanW(ch.charCodeAt(0));
    if (vkResult === -1) {
      const ev1 = Buffer.alloc(SIZEOF_INPUT);
      ev1.writeUInt32LE(INPUT_KEYBOARD, 0);
      ev1.writeUInt16LE(0, 8);
      ev1.writeUInt16LE(ch.charCodeAt(0), 10);
      ev1.writeUInt32LE(KEYEVENTF_UNICODE, 12);
      events.push(ev1);
      const ev2 = Buffer.alloc(SIZEOF_INPUT);
      ev2.writeUInt32LE(INPUT_KEYBOARD, 0);
      ev2.writeUInt16LE(0, 8);
      ev2.writeUInt16LE(ch.charCodeAt(0), 10);
      ev2.writeUInt32LE(KEYEVENTF_UNICODE | KEYEVENTF_KEYUP, 12);
      events.push(ev2);
      continue;
    }

    const vk = vkResult & 0xff;
    const shift = (vkResult >> 8) & 0xff;
    const needShift = (shift & 1) !== 0;
    const scanCode = MapVirtualKeyW(vk, MAPVK_VK_TO_VSC) as number;

    if (needShift) {
      const ev = Buffer.alloc(SIZEOF_INPUT);
      ev.writeUInt32LE(INPUT_KEYBOARD, 0);
      ev.writeUInt16LE(0x10, 8);
      ev.writeUInt16LE(MapVirtualKeyW(0x10, MAPVK_VK_TO_VSC) as number, 10);
      ev.writeUInt32LE(0, 12);
      events.push(ev);
    }

    const kd = Buffer.alloc(SIZEOF_INPUT);
    kd.writeUInt32LE(INPUT_KEYBOARD, 0);
    kd.writeUInt16LE(vk, 8);
    kd.writeUInt16LE(scanCode, 10);
    kd.writeUInt32LE(0, 12);
    events.push(kd);

    const ku = Buffer.alloc(SIZEOF_INPUT);
    ku.writeUInt32LE(INPUT_KEYBOARD, 0);
    ku.writeUInt16LE(vk, 8);
    ku.writeUInt16LE(scanCode, 10);
    ku.writeUInt32LE(KEYEVENTF_KEYUP, 12);
    events.push(ku);

    if (needShift) {
      const ev = Buffer.alloc(SIZEOF_INPUT);
      ev.writeUInt32LE(INPUT_KEYBOARD, 0);
      ev.writeUInt16LE(0x10, 8);
      ev.writeUInt16LE(MapVirtualKeyW(0x10, MAPVK_VK_TO_VSC) as number, 10);
      ev.writeUInt32LE(KEYEVENTF_KEYUP, 12);
      events.push(ev);
    }
  }

  const totalBuf = Buffer.concat(events);
  const count = events.length;
  return SendInput(count, ptr(totalBuf), SIZEOF_INPUT) as number;
}

console.log("=== SendInput Typing Test ===");
console.log("Switch to another window (Notepad or terminal) within 3 seconds...\n");

await sleep(3000);

console.log("Sending Method 1 (KEYEVENTF_UNICODE): 'UNICODE'");
const r1 = typeUnicode("UNICODE");
console.log(`  sent ${r1} events`);

await sleep(500);

console.log("Sending Method 2 (VkKeyScan VK codes): 'VKCODE'");
const r2 = typeVK("VKCODE");
console.log(`  sent ${r2} events`);

await sleep(500);

console.log("Sending Method 2 (VK): 'C:\\test\\file.bmp'");
const r3 = typeVK("C:\\test\\file.bmp");
console.log(`  sent ${r3} events`);

console.log("\nDone. Check the target window for text.");
