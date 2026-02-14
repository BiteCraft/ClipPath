import { dlopen } from "bun:ffi";

const gdi32 = dlopen("gdi32.dll", {
  CreateCompatibleDC: {
    args: ["ptr"],
    returns: "ptr",
  },
  CreateCompatibleBitmap: {
    args: ["ptr", "i32", "i32"],
    returns: "ptr",
  },
  SelectObject: {
    args: ["ptr", "ptr"],
    returns: "ptr",
  },
  DeleteDC: {
    args: ["ptr"],
    returns: "i32",
  },
  DeleteObject: {
    args: ["ptr"],
    returns: "i32",
  },
});

export const { CreateCompatibleDC, CreateCompatibleBitmap, SelectObject, DeleteDC, DeleteObject } = gdi32.symbols;
