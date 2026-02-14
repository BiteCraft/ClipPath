/**
 * @file Dark mode support via undocumented uxtheme.dll ordinal-based APIs.
 * Standard technique used by Notepad++, VS Code, Windows Terminal, etc.
 */
import { CFunction, ptr } from "bun:ffi";
import { GetProcAddress, LoadLibraryW } from "./kernel32.ts";
import { asPtr, toWideString } from "./structs.ts";

const uxthemeBuf = toWideString("uxtheme.dll");

function getOrdinalProc(hModule: number, ordinal: number): number {
  // GetProcAddress accepts ordinal as MAKEINTRESOURCE(ordinal) = (LPCSTR)(ULONG_PTR)ordinal
  return GetProcAddress(asPtr(hModule), asPtr(ordinal)) as number;
}

/**
 * Enable dark mode for the entire application.
 * Must be called BEFORE window creation.
 */
export function enableDarkMode(): void {
  try {
    const hUxtheme = LoadLibraryW(ptr(uxthemeBuf)) as number;
    if (!hUxtheme) return;

    // Ordinal 135: SetPreferredAppMode(mode) — mode=2 means "force dark"
    const pSetPreferredAppMode = getOrdinalProc(hUxtheme, 135);
    if (pSetPreferredAppMode) {
      const SetPreferredAppMode = CFunction({
        ptr: asPtr(pSetPreferredAppMode),
        args: ["i32"],
        returns: "i32",
      });
      (SetPreferredAppMode as Function)(2);
    }

    // Ordinal 104: RefreshImmersiveColorPolicyState()
    const pRefresh = getOrdinalProc(hUxtheme, 104);
    if (pRefresh) {
      const RefreshImmersiveColorPolicyState = CFunction({
        ptr: asPtr(pRefresh),
        args: [],
        returns: "void",
      });
      (RefreshImmersiveColorPolicyState as Function)();
    }

    console.log("[theme] Dark mode enabled");
  } catch (e) {
    console.log("[theme] Dark mode unavailable, using default theme");
  }
}

/**
 * Allow dark mode for a specific window and flush menu themes.
 * Must be called AFTER window creation.
 */
export function allowDarkModeForWindow(hwnd: number): void {
  try {
    const hUxtheme = LoadLibraryW(ptr(uxthemeBuf)) as number;
    if (!hUxtheme) return;

    // Ordinal 133: AllowDarkModeForWindow(hwnd, allow)
    const pAllow = getOrdinalProc(hUxtheme, 133);
    if (pAllow) {
      const AllowDarkModeForWindow = CFunction({
        ptr: asPtr(pAllow),
        args: ["ptr", "i32"],
        returns: "i32",
      });
      (AllowDarkModeForWindow as Function)(asPtr(hwnd), 1);
    }

    // Ordinal 136: FlushMenuThemes()
    const pFlush = getOrdinalProc(hUxtheme, 136);
    if (pFlush) {
      const FlushMenuThemes = CFunction({
        ptr: asPtr(pFlush),
        args: [],
        returns: "void",
      });
      (FlushMenuThemes as Function)();
    }
  } catch (e) {
    console.log("[theme] allowDarkModeForWindow failed, using default theme");
  }
}
