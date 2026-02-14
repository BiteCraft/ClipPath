/**
 * @file Cleanup scheduler — automatic temp file cleanup on configurable intervals.
 */

import { type CleanupSchedule, getConfig } from "../config.ts";
import { cleanAllFiles } from "../image/temp-files.ts";

let timer: ReturnType<typeof setInterval> | ReturnType<typeof setTimeout> | null = null;

const INTERVAL_MS: Record<string, number> = {
  "30m": 30 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
};

function clearTimer(): void {
  if (timer !== null) {
    clearInterval(timer as ReturnType<typeof setInterval>);
    timer = null;
  }
}

function scheduleInterval(schedule: string): void {
  const ms = INTERVAL_MS[schedule];
  if (!ms) return;

  console.log(`[cleanup] Auto-clean every ${schedule}`);
  timer = setInterval(() => {
    const removed = cleanAllFiles();
    if (removed > 0) console.log(`[cleanup] Auto-cleaned ${removed} file(s)`);
  }, ms);
}

function scheduleDaily(): void {
  const dailyHour = getConfig().dailyHour;
  const now = new Date();
  const next = new Date(now);
  next.setHours(dailyHour, 0, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);

  const msUntilFirst = next.getTime() - now.getTime();
  const DAY_MS = 24 * 60 * 60 * 1000;
  const hh = String(dailyHour).padStart(2, "0");

  console.log(`[cleanup] Daily cleanup at ${hh}:00 (first in ${Math.round(msUntilFirst / 60000)} min)`);

  timer = setTimeout(() => {
    cleanAllFiles();
    console.log("[cleanup] Daily cleanup executed");
    timer = setInterval(() => {
      cleanAllFiles();
      console.log("[cleanup] Daily cleanup executed");
    }, DAY_MS);
  }, msUntilFirst);
}

/** Reschedule automatic cleanup based on the given schedule. */
export function rescheduleCleanup(schedule: CleanupSchedule): void {
  clearTimer();

  if (schedule === "off") {
    console.log("[cleanup] Auto-clean disabled");
    return;
  }

  if (schedule === "daily") {
    scheduleDaily();
    return;
  }

  scheduleInterval(schedule);
}
