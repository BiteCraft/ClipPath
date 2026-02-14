/**
 * @file Hotkey handler — Ctrl+Shift+V pipeline: extract, save, type path.
 * Caches the last saved path so repeated presses paste the same path
 * until a new image arrives or the file is cleaned up.
 */

import { existsSync } from "node:fs";
import { extractClipboardDIB } from "../clipboard/extract.ts";
import { hasClipboardImage } from "../clipboard/monitor.ts";
import { saveDibAsBmp } from "../image/temp-files.ts";
import { pasteString } from "../input/clipboard-paste.ts";
import { getPathForTerminal } from "../wsl.ts";

let cachedBmpPath: string | null = null;

/** Clear the cached path (e.g. after cleanup deletes all files). */
export function clearCachedPath(): void {
  cachedBmpPath = null;
}

/** Handle the Ctrl+Shift+V hotkey press. */
export function handleHotkey(): void {
  console.log("[hotkey] Ctrl+Shift+V pressed!");

  // If clipboard has a new image, extract and save it
  if (hasClipboardImage()) {
    const dibData = extractClipboardDIB();
    if (dibData) {
      console.log(`[hotkey] DIB data extracted, size=${dibData.length} bytes`);
      try {
        cachedBmpPath = saveDibAsBmp(dibData);
        console.log(`[hotkey] Saved: ${cachedBmpPath}`);
      } catch (e) {
        console.error("[hotkey] Error saving image:", e);
      }
    }
  }

  // Use cached path if available and file still exists
  if (cachedBmpPath && existsSync(cachedBmpPath)) {
    const pathToType = getPathForTerminal(cachedBmpPath);
    console.log(`[hotkey] Pasting: ${pathToType}`);

    setTimeout(() => {
      const ok = pasteString(pathToType);
      console.log(`[hotkey] pasteString result: ${ok}`);
    }, 0);
  } else {
    cachedBmpPath = null;
    console.log("[hotkey] No image available.");
  }
}
