/**
 * @file WSL detection — heuristics to identify WSL terminals from window titles.
 */
import { ptr } from "bun:ffi";
import { asPtr } from "./win32/structs.ts";
import { GetForegroundWindow, GetWindowTextW } from "./win32/user32.ts";

const WSL_INDICATORS = [
  "wsl",
  "ubuntu",
  "debian",
  "kali",
  "opensuse",
  "fedora",
  "pengwin",
  "alpine",
  "arch",
  "oracle",
  "suse",
  "linux",
  "bash",
  "zsh",
];

const WSL_PATTERNS = [
  /\w+@\w+:/, // user@host: (typical WSL prompt in title)
  /\/home\//, // /home/ path
  /\/mnt\/[a-z]\//, // /mnt/c/ path
  /~\//, // ~/ path
];

/** Get the foreground window title. */
export function getForegroundTitle(): string {
  try {
    const hwnd = GetForegroundWindow() as number;
    if (!hwnd) return "";
    const buf = Buffer.alloc(1024);
    const len = GetWindowTextW(asPtr(hwnd), ptr(buf), 512);
    if (len <= 0) return "";
    return buf.toString("utf16le", 0, len * 2);
  } catch {
    return "";
  }
}

/** Detect if the foreground window is likely a WSL terminal. */
export function isWslTerminal(): boolean {
  try {
    const title = getForegroundTitle().toLowerCase();
    if (!title) return false;

    if (WSL_INDICATORS.some((ind) => title.includes(ind))) return true;
    if (WSL_PATTERNS.some((pat) => pat.test(title))) return true;

    return false;
  } catch {
    return false;
  }
}
