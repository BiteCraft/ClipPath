/**
 * @file Application lifecycle — startup sequence, shutdown, and component wiring.
 */

import { setOnImageChange, startClipboardMonitor, stopClipboardMonitor } from "../clipboard/monitor.ts";
import { loadConfig } from "../config.ts";
import { onHotkeyPress, registerHotkey, unregisterHotkey } from "../hotkey.ts";
import { parseShortcut, shortcutToString } from "../input/shortcut.ts";
import { startSettingsServer, stopSettingsServer } from "../settings/server.ts";
import { initTrayHandler } from "../tray/handler.ts";
import { addTrayIcon, removeTrayIcon, showBalloon, updateTrayTip } from "../tray/icon.ts";
import { onTrayExit } from "../tray/menu-commands.ts";
import { startMessageLoop, stopMessageLoop } from "../window/message-loop.ts";
import { createMessageWindow, destroyMessageWindow } from "../window/message-window.ts";
import { allowDarkModeForWindow, enableDarkMode } from "../win32/uxtheme.ts";
import { setWslMode } from "../wsl.ts";
import { rescheduleCleanup } from "./cleanup-scheduler.ts";
import { handleHotkey } from "./hotkey-handler.ts";

let shuttingDown = false;

/** Gracefully shut down all components. */
export function shutdown(): void {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log("[shutdown] Cleaning up...");
  stopSettingsServer();
  stopMessageLoop();
  unregisterHotkey();
  stopClipboardMonitor();
  removeTrayIcon();
  destroyMessageWindow();
  console.log("[shutdown] Done.");
  process.exit(0);
}

let currentShortcutLabel = "Ctrl+Shift+V";

function onClipboardImageChange(hasImage: boolean): void {
  updateTrayTip(hasImage ? `ClipPath - Image ready! (${currentShortcutLabel})` : "ClipPath - No image");
}

/** Start the application: initialize all components and enter the message loop. */
export function startApp(silent = false): void {
  const config = loadConfig();
  console.log(`[init] Config: schedule=${config.cleanupSchedule}, wslMode=${config.wslMode}`);

  if (config.wslMode !== null) setWslMode(config.wslMode);

  enableDarkMode();

  const hwnd = createMessageWindow();
  console.log(`[init] Window created (hwnd=${hwnd})`);

  allowDarkModeForWindow(hwnd);

  initTrayHandler();
  addTrayIcon("ClipPath - No image");
  console.log("[init] Tray icon added (check system tray / overflow area)");

  setOnImageChange(onClipboardImageChange);
  startClipboardMonitor();
  console.log("[init] Clipboard monitor started");

  let shortcutModifiers: number;
  let shortcutVk: number;
  try {
    const parsed = parseShortcut(config.shortcut);
    shortcutModifiers = parsed.modifiers;
    shortcutVk = parsed.vk;
    currentShortcutLabel = shortcutToString(shortcutModifiers, shortcutVk);
  } catch (e) {
    console.error(`[init] Invalid shortcut "${config.shortcut}", falling back to Ctrl+Shift+V`);
    shortcutModifiers = 0x0002 | 0x0004; // MOD_CONTROL | MOD_SHIFT
    shortcutVk = 0x56; // VK_V
    currentShortcutLabel = "Ctrl+Shift+V";
  }

  if (!registerHotkey(shortcutModifiers, shortcutVk)) {
    console.error(`[init] FAILED to register ${currentShortcutLabel} hotkey!`);
    console.error("[init] Another app may be using this shortcut.");
    shutdown();
    return;
  }
  console.log(`[init] Hotkey ${currentShortcutLabel} registered`);

  onHotkeyPress(handleHotkey);
  onTrayExit(shutdown);

  startSettingsServer();

  startMessageLoop();
  console.log("[init] Message loop started");

  rescheduleCleanup(config.cleanupSchedule);

  if (!silent) {
    showBalloon("ClipPath", `Running in the system tray.\nCopy an image and press ${currentShortcutLabel} to paste its path.\nRight-click the tray icon for options.`);
  }
}
