import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { type AppConfig, getConfig, loadConfig, updateConfig } from "../config.ts";
import { IDM_EXIT, IDM_MODE_AUTO, IDM_MODE_WIN, IDM_MODE_WSL } from "../win32/constants.ts";
import { getWslMode, setWslMode } from "../wsl.ts";
import { handleMenuCommand, onTrayExit } from "./menu-commands.ts";

let savedConfig: AppConfig;

beforeAll(() => {
  loadConfig();
  savedConfig = { ...getConfig() };
});

afterAll(() => {
  updateConfig(savedConfig);
  setWslMode(null);
});

describe("menu-commands", () => {
  describe("success", () => {
    it("onTrayExit callback fires on IDM_EXIT", () => {
      let called = false;
      onTrayExit(() => {
        called = true;
      });
      handleMenuCommand(IDM_EXIT);
      expect(called).toBe(true);
    });

    it("IDM_MODE_AUTO sets wslMode to null", () => {
      setWslMode(true);
      handleMenuCommand(IDM_MODE_AUTO);
      expect(getWslMode()).toBeNull();
    });

    it("IDM_MODE_WSL sets wslMode to true", () => {
      handleMenuCommand(IDM_MODE_WSL);
      expect(getWslMode()).toBe(true);
    });

    it("IDM_MODE_WIN sets wslMode to false", () => {
      handleMenuCommand(IDM_MODE_WIN);
      expect(getWslMode()).toBe(false);
    });
  });

  describe("errors", () => {
    it("unknown command ID does not throw", () => {
      expect(() => handleMenuCommand(0)).not.toThrow();
    });

    it("negative command ID does not throw", () => {
      expect(() => handleMenuCommand(-1)).not.toThrow();
    });

    it("very large command ID does not throw", () => {
      expect(() => handleMenuCommand(999999)).not.toThrow();
    });
  });
});
