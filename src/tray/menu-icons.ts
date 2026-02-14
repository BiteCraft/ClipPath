/**
 * @file Menu icon utilities — converts HICON to HBITMAP for use in menus.
 *
 * Uses SetMenuItemInfoW with MIIM_BITMAP to set the hbmpItem field,
 * which is the correct API for showing icons in modern themed menus.
 * (SetMenuItemBitmaps only sets check/uncheck bitmaps and is ignored by themed menus.)
 */
import { ptr } from "bun:ffi";
import { CreateCompatibleBitmap, CreateCompatibleDC, DeleteDC, SelectObject } from "../win32/gdi32.ts";
import { asPtr, writePointer } from "../win32/structs.ts";
import { DrawIconEx, GetDC, GetSystemMetrics, ReleaseDC, SetMenuItemInfoW } from "../win32/user32.ts";

const SM_CXSMICON = 49;
const SM_CYSMICON = 50;
const DI_NORMAL = 0x0003;
const MIIM_BITMAP = 0x0080;
const SIZEOF_MENUITEMINFOW = 80;

/** Convert an HICON to a small HBITMAP suitable for menu items. */
export function iconToBitmap(hIcon: number): number {
  const cx = GetSystemMetrics(SM_CXSMICON);
  const cy = GetSystemMetrics(SM_CYSMICON);

  const hScreenDC = GetDC(null) as number;
  if (!hScreenDC) return 0;

  const hMemDC = CreateCompatibleDC(asPtr(hScreenDC)) as number;
  const hBitmap = CreateCompatibleBitmap(asPtr(hScreenDC), cx, cy) as number;

  if (!hMemDC || !hBitmap) {
    if (hMemDC) DeleteDC(asPtr(hMemDC));
    ReleaseDC(null, asPtr(hScreenDC));
    return 0;
  }

  SelectObject(asPtr(hMemDC), asPtr(hBitmap));
  DrawIconEx(asPtr(hMemDC), 0, 0, asPtr(hIcon), cx, cy, 0, null, DI_NORMAL);

  DeleteDC(asPtr(hMemDC));
  ReleaseDC(null, asPtr(hScreenDC));

  return hBitmap;
}

/**
 * Attach a bitmap to a menu item by command ID using SetMenuItemInfoW.
 *
 * MENUITEMINFOW layout (80 bytes on x64):
 *   0: UINT cbSize (4)
 *   4: UINT fMask (4)
 *   8: UINT fType (4)
 *  12: UINT fState (4)
 *  16: UINT wID (4)
 *  20: padding (4)
 *  24: HMENU hSubMenu (8)
 *  32: HBITMAP hbmpChecked (8)
 *  40: HBITMAP hbmpUnchecked (8)
 *  48: ULONG_PTR dwItemData (8)
 *  56: LPWSTR dwTypeData (8)
 *  64: UINT cch (4)
 *  68: padding (4)
 *  72: HBITMAP hbmpItem (8)
 */
export function setMenuBitmap(hMenu: number, itemId: number, hBitmap: number): void {
  const info = Buffer.alloc(SIZEOF_MENUITEMINFOW);
  info.writeUInt32LE(SIZEOF_MENUITEMINFOW, 0); // cbSize
  info.writeUInt32LE(MIIM_BITMAP, 4); // fMask = MIIM_BITMAP
  writePointer(info, 72, hBitmap); // hbmpItem
  SetMenuItemInfoW(asPtr(hMenu), itemId, 0, ptr(info));
}
