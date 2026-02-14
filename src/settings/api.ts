/**
 * @file Settings API — REST handlers bridging to existing modules.
 */
import { clearCachedPath } from "../app/hotkey-handler.ts";
import { rescheduleCleanup } from "../app/cleanup-scheduler.ts";
import { disableAutoStart, enableAutoStart, isAutoStartEnabled } from "../autostart.ts";
import { type CleanupSchedule, getConfig, updateConfig } from "../config.ts";
import { getHotkeyModifiers, getHotkeyVk } from "../hotkey.ts";
import { cleanAllFiles, countTempFiles, getTempDir } from "../image/temp-files.ts";
import { shortcutToString } from "../input/shortcut.ts";
import { getWslMode, setWslMode } from "../wsl.ts";
import { cancelApiCapture, getCaptureStatus, startApiCapture } from "./shortcut-capture-api.ts";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** GET /api/config */
export function handleGetConfig(): Response {
  const config = getConfig();
  const mods = getHotkeyModifiers();
  const vk = getHotkeyVk();

  return json({
    shortcut: mods || vk ? shortcutToString(mods, vk) : config.shortcut,
    wslMode: getWslMode(),
    cleanupSchedule: config.cleanupSchedule,
    autostart: isAutoStartEnabled(),
    fileCount: countTempFiles(),
  });
}

/** POST /api/config — update one or more config fields. */
export async function handlePostConfig(req: Request): Promise<Response> {
  const body = (await req.json()) as Record<string, unknown>;

  // Path mode
  if ("wslMode" in body) {
    const mode = body.wslMode as boolean | null;
    setWslMode(mode);
    updateConfig({ wslMode: mode });
    const label = mode === null ? "Auto-detect" : mode ? "WSL" : "Windows";
    console.log(`[settings] Path mode: ${label}`);
  }

  // Cleanup schedule
  if ("cleanupSchedule" in body) {
    const schedule = body.cleanupSchedule as CleanupSchedule;
    updateConfig({ cleanupSchedule: schedule });
    rescheduleCleanup(schedule);
    console.log(`[settings] Auto-clean schedule: ${schedule}`);
  }

  // Autostart
  if ("autostart" in body) {
    if (body.autostart) enableAutoStart();
    else disableAutoStart();
  }

  return json({ ok: true });
}

/** POST /api/shortcut/capture */
export function handleStartCapture(): Response {
  const ok = startApiCapture();
  return ok ? json({ ok: true }) : json({ error: "Capture already in progress" }, 409);
}

/** GET /api/shortcut/status */
export function handleCaptureStatus(): Response {
  return json(getCaptureStatus());
}

/** POST /api/shortcut/cancel */
export function handleCancelCapture(): Response {
  cancelApiCapture();
  return json({ ok: true });
}

/** POST /api/clean */
export function handleClean(): Response {
  const removed = cleanAllFiles();
  clearCachedPath();
  console.log(`[settings] Cleaned ${removed} temp file(s)`);
  return json({ removed });
}

/** POST /api/open-folder */
export function handleOpenFolder(): Response {
  const dir = getTempDir();
  Bun.spawn(["explorer.exe", dir]);
  return json({ ok: true });
}
