import { beforeEach, describe, expect, it } from "bun:test";
import { getPathForTerminal, getWslMode, setWslMode, toWslPath } from "./wsl.ts";

describe("wsl", () => {
  beforeEach(() => {
    setWslMode(null);
  });

  describe("success", () => {
    it("toWslPath converts a C: drive path", () => {
      expect(toWslPath("C:\\Users\\test\\file.bmp")).toBe("/mnt/c/Users/test/file.bmp");
    });

    it("toWslPath converts a D: drive path", () => {
      expect(toWslPath("D:\\folder\\file.txt")).toBe("/mnt/d/folder/file.txt");
    });

    it("toWslPath lowercases drive letters", () => {
      expect(toWslPath("E:\\data")).toBe("/mnt/e/data");
    });

    it("toWslPath handles root-level files", () => {
      expect(toWslPath("C:\\file.txt")).toBe("/mnt/c/file.txt");
    });

    it("setWslMode and getWslMode cycle through all modes", () => {
      expect(getWslMode()).toBeNull();
      setWslMode(true);
      expect(getWslMode()).toBe(true);
      setWslMode(false);
      expect(getWslMode()).toBe(false);
      setWslMode(null);
      expect(getWslMode()).toBeNull();
    });

    it("getPathForTerminal returns WSL path in forced WSL mode", () => {
      setWslMode(true);
      expect(getPathForTerminal("C:\\test\\file.bmp")).toBe("/mnt/c/test/file.bmp");
    });

    it("getPathForTerminal returns Windows path in forced Windows mode", () => {
      setWslMode(false);
      expect(getPathForTerminal("C:\\test\\file.bmp")).toBe("C:\\test\\file.bmp");
    });
  });

  describe("errors", () => {
    it("toWslPath returns input unchanged for non-Windows paths", () => {
      expect(toWslPath("/mnt/c/already/wsl")).toBe("/mnt/c/already/wsl");
    });

    it("toWslPath returns input unchanged for relative paths", () => {
      expect(toWslPath("relative/path")).toBe("relative/path");
    });

    it("toWslPath returns empty string unchanged", () => {
      expect(toWslPath("")).toBe("");
    });

    it("toWslPath returns input unchanged for UNC paths", () => {
      expect(toWslPath("\\\\server\\share")).toBe("\\\\server\\share");
    });
  });
});
