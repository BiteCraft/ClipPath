/**
 * @file Hidden message window — create/destroy the Win32 window used for message routing.
 */
import { JSCallback, ptr } from "bun:ffi";
import { WM_DESTROY, WS_EX_TOOLWINDOW, WS_POPUP } from "../win32/constants.ts";
import { GetModuleHandleW } from "../win32/kernel32.ts";
import { asPtr, buildWndClassW, toWideString } from "../win32/structs.ts";
import { CreateWindowExW, DefWindowProcW, DestroyWindow, PostQuitMessage, RegisterClassW } from "../win32/user32.ts";
import { dispatchToHandlers } from "./message-bus.ts";

let wndProcCallback: JSCallback | null = null;
let classNameBuf: Buffer | null = null;
let windowNameBuf: Buffer | null = null;
let hwnd = 0;
let hInstance = 0;

/** Get the message window handle. */
export function getHwnd(): number {
  return hwnd;
}

/** Get the module instance handle. */
export function getHInstance(): number {
  return hInstance;
}

/** Create the hidden message window. */
export function createMessageWindow(): number {
  hInstance = GetModuleHandleW(null) as number;

  wndProcCallback = new JSCallback(
    (hWnd: number, uMsg: number, wParam: number, lParam: number): number => {
      try {
        const result = dispatchToHandlers(hWnd, uMsg, wParam, lParam);
        if (result !== null) return result;

        if (uMsg === WM_DESTROY) {
          PostQuitMessage(0);
          return 0;
        }
      } catch (e) {
        console.error("WNDPROC error:", e);
      }
      return DefWindowProcW(asPtr(hWnd), uMsg, asPtr(wParam), asPtr(lParam)) as number;
    },
    { args: ["ptr", "u32", "ptr", "ptr"], returns: "ptr" },
  );

  classNameBuf = toWideString("ClipPathClass");
  const wndClass = buildWndClassW(wndProcCallback.ptr as number, hInstance, ptr(classNameBuf) as unknown as number);

  const atom = RegisterClassW(ptr(wndClass));
  if (atom === 0) throw new Error("RegisterClassW failed");

  windowNameBuf = toWideString("ClipPath");
  hwnd = CreateWindowExW(
    WS_EX_TOOLWINDOW,
    ptr(classNameBuf),
    ptr(windowNameBuf),
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

  if (hwnd === 0) throw new Error("CreateWindowExW failed");
  return hwnd;
}

/** Destroy the message window. */
export function destroyMessageWindow(): void {
  if (hwnd) {
    DestroyWindow(asPtr(hwnd));
    hwnd = 0;
  }
}
