const REG_KEY = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run";
const VALUE_NAME = "ClipPath";

/** Build the startup command string for the registry */
function getStartupCommand(): string {
  const execPath = process.execPath;
  const scriptPath = process.argv[1] || "";

  // If running as a compiled exe (bun --compile), execPath IS the app
  if (execPath.endsWith("clippath.exe")) {
    return `"${execPath}" --hide`;
  }

  // Running via bun — use: bun run <script> --hide
  return `"${execPath}" run "${scriptPath}" --hide`;
}

/** Check if autostart registry entry exists */
export function isAutoStartEnabled(): boolean {
  try {
    const result = Bun.spawnSync(["reg.exe", "query", REG_KEY, "/v", VALUE_NAME], { stdout: "pipe", stderr: "pipe" });
    return result.exitCode === 0;
  } catch {
    return false;
  }
}

/** Enable autostart by adding registry entry */
export function enableAutoStart(): boolean {
  try {
    const cmd = getStartupCommand();
    const result = Bun.spawnSync(["reg.exe", "add", REG_KEY, "/v", VALUE_NAME, "/t", "REG_SZ", "/d", cmd, "/f"], {
      stdout: "pipe",
      stderr: "pipe",
    });
    if (result.exitCode === 0) {
      console.log(`[autostart] Enabled: ${cmd}`);
      return true;
    }
    console.error("[autostart] Failed to add registry entry");
    return false;
  } catch (e) {
    console.error("[autostart] Error enabling:", e);
    return false;
  }
}

/** Disable autostart by removing registry entry */
export function disableAutoStart(): boolean {
  try {
    const result = Bun.spawnSync(["reg.exe", "delete", REG_KEY, "/v", VALUE_NAME, "/f"], {
      stdout: "pipe",
      stderr: "pipe",
    });
    if (result.exitCode === 0) {
      console.log("[autostart] Disabled");
      return true;
    }
    console.error("[autostart] Failed to remove registry entry");
    return false;
  } catch (e) {
    console.error("[autostart] Error disabling:", e);
    return false;
  }
}
