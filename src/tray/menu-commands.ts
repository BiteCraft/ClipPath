/**
 * @file Menu commands — handler dispatch for tray menu selections.
 */

import { clearCachedPath } from "../app/hotkey-handler.ts";
import { updateConfig } from "../config.ts";
import { cleanAllFiles, getTempDir } from "../image/temp-files.ts";
import {
  IDM_CLEAN_NOW,
  IDM_EXIT,
  IDM_MODE_AUTO,
  IDM_MODE_WIN,
  IDM_MODE_WSL,
  IDM_OPEN_FOLDER,
  IDM_SETTINGS,
} from "../win32/constants.ts";
import { openSettings } from "../settings/server.ts";
import { setWslMode } from "../wsl.ts";

let exitCallback: (() => void) | null = null;

/** Set callback for when user clicks Exit. */
export function onTrayExit(callback: () => void): void {
  exitCallback = callback;
}

function applyPathMode(mode: boolean | null): void {
  setWslMode(mode);
  updateConfig({ wslMode: mode });
  const label = mode === null ? "Auto-detect" : mode ? "WSL" : "Windows";
  console.log(`[tray] Path mode: ${label}`);
}

const COMMAND_HANDLERS: Record<number, () => void> = {
  [IDM_EXIT]: () => exitCallback?.(),
  [IDM_MODE_AUTO]: () => applyPathMode(null),
  [IDM_MODE_WSL]: () => applyPathMode(true),
  [IDM_MODE_WIN]: () => applyPathMode(false),
  [IDM_CLEAN_NOW]: () => {
    const removed = cleanAllFiles();
    clearCachedPath();
    console.log(`[tray] Cleaned ${removed} temp file(s)`);
  },
  [IDM_OPEN_FOLDER]: () => {
    const dir = getTempDir();
    Bun.spawn(["explorer.exe", dir]);
    console.log(`[tray] Opened folder: ${dir}`);
  },
  [IDM_SETTINGS]: () => openSettings(),
};

/** Handle a selected menu command. */
export function handleMenuCommand(cmd: number): void {
  COMMAND_HANDLERS[cmd]?.();
}
