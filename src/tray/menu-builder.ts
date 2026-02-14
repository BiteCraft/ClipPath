/**
 * @file Menu builder — constructs the simplified tray context menu.
 */
import { ptr } from "bun:ffi";
import { countTempFiles } from "../image/temp-files.ts";
import {
  IDM_CLEAN_NOW,
  IDM_EXIT,
  IDM_HEADER,
  IDM_MODE_AUTO,
  IDM_MODE_WIN,
  IDM_MODE_WSL,
  IDM_OPEN_FOLDER,
  IDM_SETTINGS,
  MF_BYPOSITION,
  MF_CHECKED,
  MF_GRAYED,
  MF_SEPARATOR,
  MF_STRING,
  MF_UNCHECKED,
} from "../win32/constants.ts";
import { asPtr, toWideString } from "../win32/structs.ts";
import { CreatePopupMenu, InsertMenuW } from "../win32/user32.ts";
import { getWslMode } from "../wsl.ts";
import { loadAppIcon } from "./icon.ts";
import { iconToBitmap, setMenuBitmap } from "./menu-icons.ts";

let menuBufs: Buffer[] = [];

function insertItem(hMenu: number, label: string, id: number, checked: boolean): void {
  const buf = toWideString(label);
  menuBufs.push(buf);
  const flags = MF_BYPOSITION | MF_STRING | (checked ? MF_CHECKED : MF_UNCHECKED);
  InsertMenuW(asPtr(hMenu), 0, flags, asPtr(id), ptr(buf));
}

function insertHeader(hMenu: number, label: string, id: number): void {
  const buf = toWideString(label);
  menuBufs.push(buf);
  InsertMenuW(asPtr(hMenu), 0, MF_BYPOSITION | MF_STRING | MF_GRAYED, asPtr(id), ptr(buf));
}

function insertSep(hMenu: number): void {
  InsertMenuW(asPtr(hMenu), 0, MF_BYPOSITION | MF_SEPARATOR, asPtr(0), null);
}

function addPathSection(hMenu: number): void {
  const mode = getWslMode();
  insertItem(hMenu, "Path: Windows (C:\\...)", IDM_MODE_WIN, mode === false);
  insertItem(hMenu, "Path: WSL (/mnt/c/...)", IDM_MODE_WSL, mode === true);
  insertItem(hMenu, "Path: Auto-detect", IDM_MODE_AUTO, mode === null);
}

function addCleanSection(hMenu: number): void {
  const fileCount = countTempFiles();
  insertItem(hMenu, "Open folder", IDM_OPEN_FOLDER, false);
  const label = fileCount > 0 ? `Clean now (${fileCount} file${fileCount !== 1 ? "s" : ""})` : "Clean now (empty)";
  insertItem(hMenu, label, IDM_CLEAN_NOW, false);
}

/** Build the full context menu (bottom-to-top via InsertMenuW at position 0). */
export function buildContextMenu(): number {
  const hMenu = CreatePopupMenu() as number;
  if (!hMenu) return 0;

  menuBufs = [];

  insertItem(hMenu, "Exit", IDM_EXIT, false);
  insertSep(hMenu);
  insertItem(hMenu, "Settings...", IDM_SETTINGS, false);
  insertSep(hMenu);
  addCleanSection(hMenu);
  insertSep(hMenu);
  addPathSection(hMenu);
  insertSep(hMenu);
  insertHeader(hMenu, "ClipPath", IDM_HEADER);

  // Attach app icon bitmap to the header item
  const hIcon = loadAppIcon();
  if (hIcon) {
    const hBitmap = iconToBitmap(hIcon);
    if (hBitmap) setMenuBitmap(hMenu, IDM_HEADER, hBitmap);
  }

  return hMenu;
}
