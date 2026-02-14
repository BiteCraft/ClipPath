import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type CleanupSchedule = "off" | "30m" | "1h" | "6h" | "daily";

export interface AppConfig {
  cleanupSchedule: CleanupSchedule;
  dailyHour: number;
  wslMode: boolean | null;
  shortcut: string;
}

const DEFAULT_CONFIG: AppConfig = {
  cleanupSchedule: "1h",
  dailyHour: 3,
  wslMode: null,
  shortcut: "Ctrl+Shift+V",
};

const CONFIG_DIR = join(process.env.APPDATA || "", "clippath");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

let currentConfig: AppConfig = { ...DEFAULT_CONFIG };

export function loadConfig(): AppConfig {
  try {
    if (existsSync(CONFIG_PATH)) {
      const raw = readFileSync(CONFIG_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      currentConfig = { ...DEFAULT_CONFIG, ...parsed };
      console.log(`[config] Loaded from ${CONFIG_PATH}`);
    } else {
      console.log("[config] No config file found, using defaults");
      currentConfig = { ...DEFAULT_CONFIG };
    }
  } catch (e) {
    console.error("[config] Failed to load config, using defaults:", e);
    currentConfig = { ...DEFAULT_CONFIG };
  }
  return currentConfig;
}

export function saveConfig(): void {
  try {
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true });
    }
    writeFileSync(CONFIG_PATH, JSON.stringify(currentConfig, null, 2), "utf-8");
    console.log(`[config] Saved to ${CONFIG_PATH}`);
  } catch (e) {
    console.error("[config] Failed to save config:", e);
  }
}

export function getConfig(): AppConfig {
  return currentConfig;
}

export function updateConfig(partial: Partial<AppConfig>): AppConfig {
  currentConfig = { ...currentConfig, ...partial };
  saveConfig();
  return currentConfig;
}
