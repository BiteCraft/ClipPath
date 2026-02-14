import { dlopen } from "bun:ffi";

const shell32 = dlopen("shell32.dll", {
  Shell_NotifyIconW: {
    args: ["u32", "ptr"],
    returns: "i32",
  },
});

export const { Shell_NotifyIconW } = shell32.symbols;
