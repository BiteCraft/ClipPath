/**
 * @file Tray icon management — load, add, update, and remove the system tray icon.
 */
import { ptr } from "bun:ffi";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { NIF_ICON, NIF_INFO, NIF_MESSAGE, NIF_TIP, NIM_ADD, NIM_DELETE, NIM_MODIFY, SIZEOF_NOTIFYICONDATAW, WM_TRAYICON } from "../win32/constants.ts";
import { Shell_NotifyIconW } from "../win32/shell32.ts";
import { buildNotifyIconData, toWideString, writeWideStringInto } from "../win32/structs.ts";
import { LoadImageW } from "../win32/user32.ts";
import { getHwnd } from "../window/message-window.ts";
import { ICON_DATA } from "./icon-data.ts";

const IMAGE_ICON = 1;
const LR_LOADFROMFILE = 0x0010;
const LR_DEFAULTSIZE = 0x0040;
const TRAY_ICON_ID = 1;

let trayAdded = false;
let cachedIcon = 0;
let iconPathBuf: Buffer | null = null;

/** Write embedded icon to temp and load it, or load from assets/ in dev. */
function loadIcon(): number {
  // Try loading from assets/ (dev mode)
  const devCandidates = [
    join(dirname(process.argv[1] || ""), "..", "assets", "icon.ico"),
    join(dirname(process.argv[1] || ""), "assets", "icon.ico"),
    join(process.cwd(), "assets", "icon.ico"),
  ];

  for (const iconPath of devCandidates) {
    if (!existsSync(iconPath)) continue;
    iconPathBuf = toWideString(iconPath);
    const hIcon = LoadImageW(null, ptr(iconPathBuf), IMAGE_ICON, 0, 0, LR_LOADFROMFILE | LR_DEFAULTSIZE) as number;
    if (hIcon) {
      console.log(`[tray] Loaded icon: ${iconPath}`);
      return hIcon;
    }
  }

  // Fallback: write embedded icon to temp and load
  const tempDir = join(tmpdir(), "clippath");
  if (!existsSync(tempDir)) mkdirSync(tempDir, { recursive: true });
  const tempIcon = join(tempDir, "icon.ico");
  writeFileSync(tempIcon, ICON_DATA);
  iconPathBuf = toWideString(tempIcon);
  const hIcon = LoadImageW(null, ptr(iconPathBuf), IMAGE_ICON, 0, 0, LR_LOADFROMFILE | LR_DEFAULTSIZE) as number;
  if (hIcon) {
    console.log("[tray] Loaded embedded icon");
    return hIcon;
  }

  console.log("[tray] Icon not found");
  return 0;
}

/** Load the app icon (cached). */
export function loadAppIcon(): number {
  if (cachedIcon) return cachedIcon;
  cachedIcon = loadIcon();
  return cachedIcon;
}

/** Whether the tray icon is currently active. */
export function isTrayAdded(): boolean {
  return trayAdded;
}

/** Add the system tray icon. */
export function addTrayIcon(tip: string): void {
  const nid = buildNotifyIconData(
    getHwnd(),
    TRAY_ICON_ID,
    NIF_MESSAGE | NIF_ICON | NIF_TIP,
    WM_TRAYICON,
    loadAppIcon(),
    tip,
  );
  const result = Shell_NotifyIconW(NIM_ADD, ptr(nid));
  if (!result) throw new Error("Shell_NotifyIconW NIM_ADD failed");
  trayAdded = true;
}

/** Update the tray icon tooltip. */
export function updateTrayTip(tip: string): void {
  if (!trayAdded) return;
  const nid = buildNotifyIconData(getHwnd(), TRAY_ICON_ID, NIF_TIP, WM_TRAYICON, loadAppIcon(), tip);
  Shell_NotifyIconW(NIM_MODIFY, ptr(nid));
}

/** Remove the tray icon. */
export function removeTrayIcon(): void {
  if (!trayAdded) return;
  const nid = buildNotifyIconData(getHwnd(), TRAY_ICON_ID, 0, 0, 0, "");
  Shell_NotifyIconW(NIM_DELETE, ptr(nid));
  trayAdded = false;
}

/**
 * Show a balloon notification from the tray icon.
 */
export function showBalloon(title: string, text: string): void {
  if (!trayAdded) return;

  const nid = Buffer.alloc(SIZEOF_NOTIFYICONDATAW);
  nid.writeUInt32LE(SIZEOF_NOTIFYICONDATAW, 0); // cbSize
  const hwnd = getHwnd();
  nid.writeBigUInt64LE(BigInt(hwnd), 8); // hWnd
  nid.writeUInt32LE(TRAY_ICON_ID, 16); // uID
  nid.writeUInt32LE(NIF_INFO, 20); // uFlags

  writeWideStringInto(nid, 304, text, 512); // szInfo[256]
  writeWideStringInto(nid, 820, title, 128); // szInfoTitle[64]
  nid.writeUInt32LE(0x00000001, 948); // dwInfoFlags = NIIF_INFO

  Shell_NotifyIconW(NIM_MODIFY, ptr(nid));
}
