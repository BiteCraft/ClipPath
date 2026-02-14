/**
 * @file Temp file management — save, clean, and count BMP files in the temp directory.
 */
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { dibToBmp } from "./bmp.ts";

const TEMP_DIR = join(tmpdir(), "clippath");
let fileCounter = 0;

/** Get the temp directory path. */
export function getTempDir(): string {
  return TEMP_DIR;
}

function ensureTempDir(): void {
  if (!existsSync(TEMP_DIR)) {
    mkdirSync(TEMP_DIR, { recursive: true });
  }
}

/** Convert DIB data to BMP and save to temp directory. Returns the file path. */
export function saveDibAsBmp(dibData: Buffer): string {
  ensureTempDir();
  const bmpData = dibToBmp(dibData);
  const filename = `clipboard-${Date.now()}-${fileCounter++}.bmp`;
  const filePath = join(TEMP_DIR, filename);
  writeFileSync(filePath, bmpData);
  return filePath;
}

/** Clean up temp files older than 1 hour. */
export function cleanupOldFiles(): void {
  try {
    if (!existsSync(TEMP_DIR)) return;
    const ONE_HOUR = 60 * 60 * 1000;
    const now = Date.now();

    for (const file of readdirSync(TEMP_DIR)) {
      if (!file.endsWith(".bmp")) continue;
      try {
        const filePath = join(TEMP_DIR, file);
        if (now - statSync(filePath).mtimeMs > ONE_HOUR) {
          unlinkSync(filePath);
        }
      } catch {
        /* ignore individual file errors */
      }
    }
  } catch {
    /* ignore cleanup errors */
  }
}

/** Delete ALL .bmp files in the temp directory. Returns count deleted. */
export function cleanAllFiles(): number {
  let count = 0;
  try {
    if (!existsSync(TEMP_DIR)) return 0;
    for (const file of readdirSync(TEMP_DIR)) {
      if (!file.endsWith(".bmp")) continue;
      try {
        unlinkSync(join(TEMP_DIR, file));
        count++;
      } catch {
        /* ignore individual file errors */
      }
    }
  } catch {
    /* ignore cleanup errors */
  }
  return count;
}

/** Count how many .bmp files exist in the temp directory. */
export function countTempFiles(): number {
  try {
    if (!existsSync(TEMP_DIR)) return 0;
    return readdirSync(TEMP_DIR).filter((f) => f.endsWith(".bmp")).length;
  } catch {
    return 0;
  }
}
