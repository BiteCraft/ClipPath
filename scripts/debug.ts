/**
 * @file Interactive debug test — sets up all components and logs events.
 */
import { JSCallback, ptr } from "bun:ffi";
import {
  CF_DIB,
  HOTKEY_ID,
  IDI_APPLICATION,
  MOD_CONTROL,
  MOD_NOREPEAT,
  MOD_SHIFT,
  NIF_ICON,
  NIF_MESSAGE,
  NIF_TIP,
  NIM_ADD,
  NIM_DELETE,
  PM_REMOVE,
  VK_V,
  WM_CLIPBOARDUPDATE,
  WM_DESTROY,
  WM_HOTKEY,
  WM_TRAYICON,
  WS_EX_TOOLWINDOW,
  WS_POPUP,
} from "../src/win32/constants.ts";
import { GetLastError, GetModuleHandleW } from "../src/win32/kernel32.ts";
import { Shell_NotifyIconW } from "../src/win32/shell32.ts";
import { asPtr, buildMsg, buildNotifyIconData, buildWndClassW, toWideString } from "../src/win32/structs.ts";
import {
  AddClipboardFormatListener,
  CreateWindowExW,
  DefWindowProcW,
  DestroyWindow,
  DispatchMessageW,
  IsClipboardFormatAvailable,
  LoadIconW,
  PeekMessageW,
  RegisterClassW,
  RegisterHotKey,
  RemoveClipboardFormatListener,
  TranslateMessage,
  UnregisterHotKey,
} from "../src/win32/user32.ts";

console.log("=== ClipPath Debug (Interactive) ===\n");

const hInstance = GetModuleHandleW(null) as number;
console.log(`[OK] hInstance = ${hInstance}`);

const wndProc = new JSCallback(
  (hWnd: number, uMsg: number, wParam: number, lParam: number): number => {
    if (uMsg === WM_CLIPBOARDUPDATE) {
      const hasDIB = IsClipboardFormatAvailable(CF_DIB);
      console.log(`>> WM_CLIPBOARDUPDATE - has DIB image: ${hasDIB !== 0}`);
      return 0;
    }
    if (uMsg === WM_HOTKEY) {
      console.log(`>> WM_HOTKEY wParam=${wParam} - HOTKEY WORKS!`);
      return 0;
    }
    if (uMsg === WM_TRAYICON) {
      const event = lParam & 0xffff;
      console.log(`>> WM_TRAYICON event=0x${event.toString(16)}`);
      return 0;
    }
    if (uMsg === WM_DESTROY) {
      return 0;
    }
    return DefWindowProcW(asPtr(hWnd), uMsg, asPtr(wParam), asPtr(lParam)) as number;
  },
  { args: ["ptr", "u32", "ptr", "ptr"], returns: "ptr" },
);
console.log(`[OK] WNDPROC callback ptr = ${wndProc.ptr}`);

const className = toWideString("DebugClass2");
const wndClass = buildWndClassW(wndProc.ptr as number, hInstance, ptr(className) as unknown as number);
const atom = RegisterClassW(ptr(wndClass));
console.log(`[OK] RegisterClassW atom = ${atom}`);

const windowName = toWideString("DebugWindow");
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
console.log(`[OK] hwnd = ${hwnd}`);
if (!hwnd) {
  console.error(`FATAL: CreateWindowExW failed, GetLastError = ${GetLastError()}`);
  process.exit(1);
}

const hIcon = LoadIconW(null, asPtr(IDI_APPLICATION)) as number;
console.log(`[OK] hIcon = ${hIcon}`);

const nid = buildNotifyIconData(
  hwnd,
  1,
  NIF_MESSAGE | NIF_ICON | NIF_TIP,
  WM_TRAYICON,
  hIcon,
  "Debug - ClipPath",
);
const trayOk = Shell_NotifyIconW(NIM_ADD, ptr(nid));
console.log(`[OK] Tray icon added = ${trayOk}`);

const clipOk = AddClipboardFormatListener(asPtr(hwnd));
console.log(`[OK] ClipboardFormatListener = ${clipOk}`);

const hkOk = RegisterHotKey(asPtr(hwnd), HOTKEY_ID, MOD_CONTROL | MOD_SHIFT | MOD_NOREPEAT, VK_V);
console.log(`[OK] RegisterHotKey(Ctrl+Shift+V) = ${hkOk}`);
if (!hkOk) {
  console.error(`  GetLastError = ${GetLastError()}`);
}

console.log("\n=== ALL SETUP DONE ===");
console.log("Now try:");
console.log("  1. Copy an image (Print Screen or copy from browser)");
console.log("  2. Press Ctrl+Shift+V");
console.log("  3. Right-click the tray icon");
console.log("  4. Press Ctrl+C here to exit\n");

let msgCount = 0;
const interval = setInterval(() => {
  const msg = buildMsg();
  while (PeekMessageW(ptr(msg), null, 0, 0, PM_REMOVE)) {
    msgCount++;
    const msgId = msg.readUInt32LE(8);
    if (msgId !== 0) {
      if (msgId === WM_HOTKEY || msgId === WM_CLIPBOARDUPDATE || msgId === WM_TRAYICON) {
        console.log(`  [PEEK] msg=0x${msgId.toString(16)} total=${msgCount}`);
      }
    }
    TranslateMessage(ptr(msg));
    DispatchMessageW(ptr(msg));
  }
}, 16);

function cleanup() {
  console.log(`\nTotal messages pumped: ${msgCount}`);
  clearInterval(interval);
  UnregisterHotKey(asPtr(hwnd), HOTKEY_ID);
  RemoveClipboardFormatListener(asPtr(hwnd));
  const nidDel = buildNotifyIconData(hwnd, 1, 0, 0, 0, "");
  Shell_NotifyIconW(NIM_DELETE, ptr(nidDel));
  DestroyWindow(asPtr(hwnd));
  console.log("Cleanup done.");
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
