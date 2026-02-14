import { dlopen } from "bun:ffi";

const user32 = dlopen("user32.dll", {
  RegisterClassW: {
    args: ["ptr"],
    returns: "u16",
  },
  CreateWindowExW: {
    args: [
      "u32", // dwExStyle
      "ptr", // lpClassName
      "ptr", // lpWindowName
      "u32", // dwStyle
      "i32", // x
      "i32", // y
      "i32", // nWidth
      "i32", // nHeight
      "ptr", // hWndParent
      "ptr", // hMenu
      "ptr", // hInstance
      "ptr", // lpParam
    ],
    returns: "ptr",
  },
  DefWindowProcW: {
    args: ["ptr", "u32", "ptr", "ptr"],
    returns: "ptr",
  },
  PeekMessageW: {
    args: ["ptr", "ptr", "u32", "u32", "u32"],
    returns: "i32",
  },
  TranslateMessage: {
    args: ["ptr"],
    returns: "i32",
  },
  DispatchMessageW: {
    args: ["ptr"],
    returns: "ptr",
  },
  RegisterHotKey: {
    args: ["ptr", "i32", "u32", "u32"],
    returns: "i32",
  },
  UnregisterHotKey: {
    args: ["ptr", "i32"],
    returns: "i32",
  },
  AddClipboardFormatListener: {
    args: ["ptr"],
    returns: "i32",
  },
  RemoveClipboardFormatListener: {
    args: ["ptr"],
    returns: "i32",
  },
  IsClipboardFormatAvailable: {
    args: ["u32"],
    returns: "i32",
  },
  OpenClipboard: {
    args: ["ptr"],
    returns: "i32",
  },
  GetClipboardData: {
    args: ["u32"],
    returns: "ptr",
  },
  CloseClipboard: {
    args: [],
    returns: "i32",
  },
  EmptyClipboard: {
    args: [],
    returns: "i32",
  },
  SetClipboardData: {
    args: ["u32", "ptr"],
    returns: "ptr",
  },
  SendInput: {
    args: ["u32", "ptr", "i32"],
    returns: "u32",
  },
  LoadIconW: {
    args: ["ptr", "ptr"],
    returns: "ptr",
  },
  DestroyWindow: {
    args: ["ptr"],
    returns: "i32",
  },
  PostQuitMessage: {
    args: ["i32"],
    returns: "void",
  },
  LoadImageW: {
    args: ["ptr", "ptr", "u32", "i32", "i32", "u32"],
    returns: "ptr",
  },
  PostMessageW: {
    args: ["ptr", "u32", "ptr", "ptr"],
    returns: "i32",
  },
  CreatePopupMenu: {
    args: [],
    returns: "ptr",
  },
  InsertMenuW: {
    args: ["ptr", "u32", "u32", "ptr", "ptr"],
    returns: "i32",
  },
  TrackPopupMenu: {
    args: ["ptr", "u32", "i32", "i32", "i32", "ptr", "ptr"],
    returns: "i32",
  },
  DestroyMenu: {
    args: ["ptr"],
    returns: "i32",
  },
  GetCursorPos: {
    args: ["ptr"],
    returns: "i32",
  },
  SetForegroundWindow: {
    args: ["ptr"],
    returns: "i32",
  },
  GetForegroundWindow: {
    args: [],
    returns: "ptr",
  },
  GetWindowTextW: {
    args: ["ptr", "ptr", "i32"],
    returns: "i32",
  },
  VkKeyScanW: {
    args: ["u16"],
    returns: "i16",
  },
  VkKeyScanExW: {
    args: ["u16", "ptr"],
    returns: "i16",
  },
  MapVirtualKeyW: {
    args: ["u32", "u32"],
    returns: "u32",
  },
  GetWindowThreadProcessId: {
    args: ["ptr", "ptr"],
    returns: "u32",
  },
  GetAsyncKeyState: {
    args: ["i32"],
    returns: "i16",
  },
  GetKeyboardLayout: {
    args: ["u32"],
    returns: "ptr",
  },
  GetSystemMetrics: {
    args: ["i32"],
    returns: "i32",
  },
  GetDC: {
    args: ["ptr"],
    returns: "ptr",
  },
  ReleaseDC: {
    args: ["ptr", "ptr"],
    returns: "i32",
  },
  DrawIconEx: {
    args: ["ptr", "i32", "i32", "ptr", "i32", "i32", "u32", "ptr", "u32"],
    returns: "i32",
  },
  SetMenuItemBitmaps: {
    args: ["ptr", "u32", "u32", "ptr", "ptr"],
    returns: "i32",
  },
  SetMenuItemInfoW: {
    args: ["ptr", "u32", "i32", "ptr"],
    returns: "i32",
  },
});

export const {
  RegisterClassW,
  CreateWindowExW,
  DefWindowProcW,
  PeekMessageW,
  TranslateMessage,
  DispatchMessageW,
  RegisterHotKey,
  UnregisterHotKey,
  AddClipboardFormatListener,
  RemoveClipboardFormatListener,
  IsClipboardFormatAvailable,
  OpenClipboard,
  GetClipboardData,
  CloseClipboard,
  EmptyClipboard,
  SetClipboardData,
  SendInput,
  LoadIconW,
  LoadImageW,
  DestroyWindow,
  PostQuitMessage,
  PostMessageW,
  CreatePopupMenu,
  InsertMenuW,
  TrackPopupMenu,
  DestroyMenu,
  GetCursorPos,
  SetForegroundWindow,
  GetForegroundWindow,
  GetWindowTextW,
  VkKeyScanW,
  VkKeyScanExW,
  MapVirtualKeyW,
  GetAsyncKeyState,
  GetWindowThreadProcessId,
  GetKeyboardLayout,
  GetSystemMetrics,
  GetDC,
  ReleaseDC,
  DrawIconEx,
  SetMenuItemBitmaps,
  SetMenuItemInfoW,
} = user32.symbols;
