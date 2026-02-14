/**
 * @file Test hotkey + clipboard registration and message reception.
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

console.log("=== Hotkey + Clipboard Test ===\n");

const hInstance = GetModuleHandleW(null) as number;

const wndProc = new JSCallback(
  (hWnd: number, uMsg: number, wParam: number, lParam: number): number => {
    if (uMsg === WM_HOTKEY) {
      console.log(`>> WM_HOTKEY! wParam=${wParam}`);
      console.log(`   Clipboard has image: ${IsClipboardFormatAvailable(CF_DIB) !== 0}`);
      return 0;
    }
    if (uMsg === WM_CLIPBOARDUPDATE) {
      console.log(`>> WM_CLIPBOARDUPDATE! hasImage=${IsClipboardFormatAvailable(CF_DIB) !== 0}`);
      return 0;
    }
    if (uMsg === WM_TRAYICON) {
      console.log(`>> WM_TRAYICON! lParam=0x${lParam.toString(16)}`);
      return 0;
    }
    if (uMsg === WM_DESTROY) return 0;
    return DefWindowProcW(asPtr(hWnd), uMsg, asPtr(wParam), asPtr(lParam)) as number;
  },
  { args: ["ptr", "u32", "ptr", "ptr"], returns: "ptr" },
);

const className = toWideString("TestHKClass");
const wndClass = buildWndClassW(wndProc.ptr as number, hInstance, ptr(className) as unknown as number);
RegisterClassW(ptr(wndClass));

const windowName = toWideString("TestHK");
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
console.log(`hwnd = ${hwnd}`);

const hIcon = LoadIconW(null, asPtr(IDI_APPLICATION)) as number;
const nid = buildNotifyIconData(hwnd, 1, NIF_MESSAGE | NIF_ICON | NIF_TIP, WM_TRAYICON, hIcon, "Test HK");
const trayOk = Shell_NotifyIconW(NIM_ADD, ptr(nid));
console.log(`Tray: ${trayOk}`);

const clipOk = AddClipboardFormatListener(asPtr(hwnd));
console.log(`Clipboard listener: ${clipOk}`);

const hkOk = RegisterHotKey(asPtr(hwnd), HOTKEY_ID, MOD_CONTROL | MOD_SHIFT | MOD_NOREPEAT, VK_V);
console.log(`Hotkey registered: ${hkOk} (err=${!hkOk ? GetLastError() : 0})`);

console.log("\nWaiting 30s. Copy image + press Ctrl+Shift+V. Right-click tray.");
console.log("Check system tray for the icon.\n");

let msgTotal = 0;
const iv = setInterval(() => {
  const msg = buildMsg();
  while (PeekMessageW(ptr(msg), null, 0, 0, PM_REMOVE)) {
    msgTotal++;
    TranslateMessage(ptr(msg));
    DispatchMessageW(ptr(msg));
  }
}, 16);

setTimeout(() => {
  clearInterval(iv);
  console.log(`\nTotal messages: ${msgTotal}`);
  UnregisterHotKey(asPtr(hwnd), HOTKEY_ID);
  RemoveClipboardFormatListener(asPtr(hwnd));
  const nidDel = buildNotifyIconData(hwnd, 1, 0, 0, 0, "");
  Shell_NotifyIconW(NIM_DELETE, ptr(nidDel));
  DestroyWindow(asPtr(hwnd));
  console.log("Done.");
}, 30000);
