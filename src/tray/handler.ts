/**
 * @file Tray handler — routes tray icon messages to the context menu and settings.
 */
import { ptr } from "bun:ffi";
import {
  TPM_BOTTOMALIGN,
  TPM_LEFTALIGN,
  TPM_NONOTIFY,
  TPM_RETURNCMD,
  WM_LBUTTONDBLCLK,
  WM_NULL,
  WM_RBUTTONUP,
  WM_TRAYICON,
} from "../win32/constants.ts";
import { asPtr, buildPoint, readPoint } from "../win32/structs.ts";
import { DestroyMenu, GetCursorPos, PostMessageW, SetForegroundWindow, TrackPopupMenu } from "../win32/user32.ts";
import { onMessage } from "../window/message-bus.ts";
import { getHwnd } from "../window/message-window.ts";
import { openSettings } from "../settings/server.ts";
import { buildContextMenu } from "./menu-builder.ts";
import { handleMenuCommand } from "./menu-commands.ts";

function showContextMenu(): void {
  const hwnd = getHwnd();
  const hMenu = buildContextMenu();
  if (!hMenu) return;

  const ptBuf = buildPoint();
  GetCursorPos(ptr(ptBuf));
  const { x, y } = readPoint(ptBuf);

  SetForegroundWindow(asPtr(hwnd));

  const cmd = TrackPopupMenu(
    asPtr(hMenu),
    TPM_BOTTOMALIGN | TPM_LEFTALIGN | TPM_NONOTIFY | TPM_RETURNCMD,
    x,
    y,
    0,
    asPtr(hwnd),
    null,
  );

  PostMessageW(asPtr(hwnd), WM_NULL, asPtr(0), asPtr(0));
  DestroyMenu(asPtr(hMenu));

  handleMenuCommand(cmd);
}

/** Register tray message handler for right-click (menu) and double-click (settings). */
export function initTrayHandler(): void {
  onMessage((_hwnd, uMsg, _wParam, lParam) => {
    if (uMsg === WM_TRAYICON) {
      const event = lParam & 0xffff;
      if (event === WM_RBUTTONUP) {
        showContextMenu();
        return 0;
      }
      if (event === WM_LBUTTONDBLCLK) {
        openSettings();
        return 0;
      }
    }
    return null;
  });
}
