/**
 * @file Minimal message loop test — posts a message to itself.
 */
import { JSCallback, ptr } from "bun:ffi";
import { PM_REMOVE, WM_DESTROY, WS_EX_TOOLWINDOW, WS_POPUP } from "../src/win32/constants.ts";
import { GetLastError, GetModuleHandleW } from "../src/win32/kernel32.ts";
import { asPtr, buildMsg, buildWndClassW, toWideString } from "../src/win32/structs.ts";
import {
  CreateWindowExW,
  DefWindowProcW,
  DestroyWindow,
  DispatchMessageW,
  PeekMessageW,
  PostMessageW,
  RegisterClassW,
  TranslateMessage,
} from "../src/win32/user32.ts";

const WM_USER = 0x0400;

console.log("=== Minimal Message Test ===\n");

const hInstance = GetModuleHandleW(null) as number;
console.log(`hInstance = ${hInstance}`);

let wndProcCalls = 0;

const wndProc = new JSCallback(
  (hWnd: number, uMsg: number, wParam: number, lParam: number): number => {
    wndProcCalls++;

    if (uMsg === WM_USER) {
      console.log(`WNDPROC: WM_USER received! wParam=${wParam} lParam=${lParam}`);
      return 0;
    }
    if (uMsg === WM_DESTROY) {
      console.log("WNDPROC: WM_DESTROY");
      return 0;
    }
    if (wndProcCalls <= 10) {
      console.log(`WNDPROC call #${wndProcCalls}: uMsg=0x${uMsg.toString(16)}`);
    }
    return DefWindowProcW(asPtr(hWnd), uMsg, asPtr(wParam), asPtr(lParam)) as number;
  },
  { args: ["ptr", "u32", "ptr", "ptr"], returns: "ptr" },
);
console.log(`WNDPROC ptr = ${wndProc.ptr}`);

const className = toWideString("TestMsgClass");
const wndClass = buildWndClassW(wndProc.ptr as number, hInstance, ptr(className) as unknown as number);
const atom = RegisterClassW(ptr(wndClass));
console.log(`RegisterClassW atom = ${atom} (err=${GetLastError()})`);

const windowName = toWideString("TestMsg");
console.log("\nCreating window (WNDPROC should be called)...");
const hwnd = CreateWindowExW(
  WS_EX_TOOLWINDOW,
  ptr(className),
  ptr(windowName),
  WS_POPUP,
  -1000,
  -1000,
  1,
  1,
  null,
  null,
  asPtr(hInstance),
  null,
) as number;
console.log(`hwnd = ${hwnd} (err=${GetLastError()})`);
console.log(`WNDPROC was called ${wndProcCalls} times during CreateWindowExW\n`);

console.log("--- Test 1: PostMessageW(WM_USER) to self ---");
const postResult = PostMessageW(asPtr(hwnd), WM_USER, asPtr(42), asPtr(99));
console.log(`PostMessageW result = ${postResult}`);

console.log("\n--- Test 2: PeekMessageW (immediate) ---");
const msg = buildMsg();
const peekResult = PeekMessageW(ptr(msg), null, 0, 0, PM_REMOVE);
console.log(`PeekMessageW result = ${peekResult}`);
if (peekResult) {
  const msgId = msg.readUInt32LE(8);
  console.log(`  msg.message = 0x${msgId.toString(16)}`);
  TranslateMessage(ptr(msg));
  DispatchMessageW(ptr(msg));
}

console.log("\n--- Test 3: PeekMessageW with explicit hwnd ---");
const msg2 = buildMsg();
PostMessageW(asPtr(hwnd), WM_USER, asPtr(100), asPtr(200));

const peekResult2 = PeekMessageW(ptr(msg2), asPtr(hwnd), 0, 0, PM_REMOVE);
console.log(`PeekMessageW(hwnd) result = ${peekResult2}`);
if (peekResult2) {
  const msgId = msg2.readUInt32LE(8);
  console.log(`  msg.message = 0x${msgId.toString(16)}`);
  TranslateMessage(ptr(msg2));
  DispatchMessageW(ptr(msg2));
}

console.log("\n--- Test 4: setInterval pump (3 seconds) ---");
PostMessageW(asPtr(hwnd), WM_USER, asPtr(1000), asPtr(2000));

let pumpCount = 0;
const iv = setInterval(() => {
  const m = buildMsg();
  while (PeekMessageW(ptr(m), null, 0, 0, PM_REMOVE)) {
    pumpCount++;
    const id = m.readUInt32LE(8);
    console.log(`  [pump] msg=0x${id.toString(16)} count=${pumpCount}`);
    TranslateMessage(ptr(m));
    DispatchMessageW(ptr(m));
  }
}, 16);

setTimeout(() => {
  clearInterval(iv);
  console.log(`\nPump total: ${pumpCount} messages`);
  console.log(`WNDPROC total calls: ${wndProcCalls}`);
  DestroyWindow(asPtr(hwnd));
  console.log("Done.");
}, 3000);
