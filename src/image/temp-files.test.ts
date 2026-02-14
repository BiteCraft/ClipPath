import { afterAll, describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { cleanAllFiles, cleanupOldFiles, countTempFiles, getTempDir, saveDibAsBmp } from "./temp-files.ts";

function makeTestDib(): Buffer {
  const dib = Buffer.alloc(44);
  dib.writeUInt32LE(40, 0);
  dib.writeInt32LE(1, 4);
  dib.writeInt32LE(1, 8);
  dib.writeUInt16LE(1, 12);
  dib.writeUInt16LE(32, 14);
  dib.writeUInt32LE(0, 16);
  dib.writeUInt32LE(4, 20);
  return dib;
}

afterAll(() => {
  cleanAllFiles();
});

describe("temp-files", () => {
  describe("success", () => {
    it("getTempDir returns a non-empty path containing the app name", () => {
      const dir = getTempDir();
      expect(dir.length).toBeGreaterThan(0);
      expect(dir).toContain("clippath");
    });

    it("saveDibAsBmp creates a .bmp file that exists on disk", () => {
      const path = saveDibAsBmp(makeTestDib());
      expect(path.endsWith(".bmp")).toBe(true);
      expect(existsSync(path)).toBe(true);
    });

    it("saveDibAsBmp generates unique filenames", () => {
      const path1 = saveDibAsBmp(makeTestDib());
      const path2 = saveDibAsBmp(makeTestDib());
      expect(path1).not.toBe(path2);
    });

    it("countTempFiles increases after saving", () => {
      cleanAllFiles();
      expect(countTempFiles()).toBe(0);
      saveDibAsBmp(makeTestDib());
      expect(countTempFiles()).toBe(1);
      saveDibAsBmp(makeTestDib());
      expect(countTempFiles()).toBe(2);
    });

    it("cleanAllFiles removes all files and returns the count", () => {
      cleanAllFiles();
      saveDibAsBmp(makeTestDib());
      saveDibAsBmp(makeTestDib());
      saveDibAsBmp(makeTestDib());
      const removed = cleanAllFiles();
      expect(removed).toBe(3);
      expect(countTempFiles()).toBe(0);
    });
  });

  describe("errors", () => {
    it("cleanAllFiles returns 0 when directory is empty", () => {
      cleanAllFiles();
      expect(cleanAllFiles()).toBe(0);
    });

    it("countTempFiles returns 0 when directory is empty", () => {
      cleanAllFiles();
      expect(countTempFiles()).toBe(0);
    });

    it("cleanupOldFiles does not throw on empty directory", () => {
      cleanAllFiles();
      expect(() => cleanupOldFiles()).not.toThrow();
    });

    it("cleanupOldFiles does not remove recently created files", () => {
      cleanAllFiles();
      saveDibAsBmp(makeTestDib());
      cleanupOldFiles();
      expect(countTempFiles()).toBe(1);
    });
  });
});
