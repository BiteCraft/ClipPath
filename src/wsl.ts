/**
 * @file WSL path handling — mode management and Windows-to-WSL path conversion.
 */
import { getForegroundTitle, isWslTerminal } from "./wsl-detection.ts";

let wslModeOverride: boolean | null = null;

/** Set WSL mode override: null = auto-detect, true = force WSL, false = force Windows. */
export function setWslMode(mode: boolean | null): void {
  wslModeOverride = mode;
}

/** Get the current WSL mode override. */
export function getWslMode(): boolean | null {
  return wslModeOverride;
}

/** Convert a Windows path to a WSL path (e.g. "C:\Users\foo" -> "/mnt/c/Users/foo"). */
export function toWslPath(windowsPath: string): string {
  const match = windowsPath.match(/^([A-Za-z]):\\(.*)$/);
  if (!match) return windowsPath;

  const driveLetter = match[1]?.toLowerCase();
  const rest = match[2]?.replace(/\\/g, "/");
  return `/mnt/${driveLetter}/${rest}`;
}

/** Get the appropriate path for the current terminal context. */
export function getPathForTerminal(windowsPath: string): string {
  if (wslModeOverride === true) return toWslPath(windowsPath);
  if (wslModeOverride === false) return windowsPath;

  const title = getForegroundTitle();
  const isWsl = isWslTerminal();
  console.log(`[wsl] Window title: "${title}" => WSL=${isWsl}`);

  return isWsl ? toWslPath(windowsPath) : windowsPath;
}
