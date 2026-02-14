import { dlopen } from "bun:ffi";

const kernel32 = dlopen("kernel32.dll", {
  FreeConsole: {
    args: [],
    returns: "i32",
  },
  GetModuleHandleW: {
    args: ["ptr"],
    returns: "ptr",
  },
  GlobalSize: {
    args: ["ptr"],
    returns: "u64",
  },
  GlobalLock: {
    args: ["ptr"],
    returns: "ptr",
  },
  GlobalUnlock: {
    args: ["ptr"],
    returns: "i32",
  },
  GetLastError: {
    args: [],
    returns: "u32",
  },
  GlobalAlloc: {
    args: ["u32", "u64"],
    returns: "ptr",
  },
  LoadLibraryW: {
    args: ["ptr"],
    returns: "ptr",
  },
  GetProcAddress: {
    args: ["ptr", "ptr"],
    returns: "ptr",
  },
  RtlMoveMemory: {
    args: ["ptr", "ptr", "u64"],
    returns: "void",
  },
});

export const {
  FreeConsole,
  GetModuleHandleW,
  GlobalSize,
  GlobalLock,
  GlobalUnlock,
  GetLastError,
  GlobalAlloc,
  LoadLibraryW,
  GetProcAddress,
  RtlMoveMemory,
} = kernel32.symbols;
