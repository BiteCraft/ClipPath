// Win32 Constants for x64 Windows

// Window Messages
export const WM_DESTROY = 0x0002;
export const WM_CLOSE = 0x0010;
export const WM_COMMAND = 0x0111;
export const WM_HOTKEY = 0x0312;
export const WM_CLIPBOARDUPDATE = 0x031d;
export const WM_NULL = 0x0000;
export const WM_RBUTTONUP = 0x0205;
export const WM_LBUTTONUP = 0x0202;
export const WM_LBUTTONDBLCLK = 0x0203;
export const WM_CONTEXTMENU = 0x007b;

// Custom callback message for tray icon
export const WM_TRAYICON = 0x8000 + 1; // WM_APP + 1

// Window Styles
export const WS_POPUP = 0x80000000;
export const WS_EX_TOOLWINDOW = 0x00000080;

// PeekMessage flags
export const PM_REMOVE = 0x0001;

// Clipboard Formats
export const CF_DIB = 8;
export const CF_DIBV5 = 17;
export const CF_UNICODETEXT = 13;

// GlobalAlloc flags
export const GMEM_MOVEABLE = 0x0002;

// Shell_NotifyIconW dwMessage
export const NIM_ADD = 0x00000000;
export const NIM_MODIFY = 0x00000001;
export const NIM_DELETE = 0x00000002;
export const NIM_SETVERSION = 0x00000004;

// NOTIFYICONDATA uFlags
export const NIF_MESSAGE = 0x00000001;
export const NIF_ICON = 0x00000002;
export const NIF_TIP = 0x00000004;
export const NIF_INFO = 0x00000010;
export const NIF_SHOWTIP = 0x00000080;

// NOTIFYICONDATA version
export const NOTIFYICON_VERSION_4 = 4;

// Hotkey modifiers
export const MOD_ALT = 0x0001;
export const MOD_CONTROL = 0x0002;
export const MOD_SHIFT = 0x0004;
export const MOD_NOREPEAT = 0x4000;

// Virtual key codes
export const VK_V = 0x56;

// Icon resource IDs
export const IDI_APPLICATION = 32512;

// SendInput
export const INPUT_KEYBOARD = 1;
export const KEYEVENTF_UNICODE = 0x0004;
export const KEYEVENTF_KEYUP = 0x0002;

// Menu flags
export const MF_BYPOSITION = 0x0400;
export const MF_STRING = 0x0000;
export const MF_SEPARATOR = 0x0800;
export const TPM_BOTTOMALIGN = 0x0020;
export const TPM_LEFTALIGN = 0x0000;
export const TPM_NONOTIFY = 0x0080;
export const TPM_RETURNCMD = 0x0100;

// Struct sizes (x64)
export const SIZEOF_WNDCLASSW = 72;
export const SIZEOF_MSG = 48;
export const SIZEOF_INPUT = 40;
export const SIZEOF_NOTIFYICONDATAW = 976;
export const SIZEOF_POINT = 8;
export const SIZEOF_BITMAPFILEHEADER = 14;
export const SIZEOF_BITMAPINFOHEADER = 40;

// BITMAPINFOHEADER compression
export const BI_RGB = 0;
export const BI_BITFIELDS = 3;

// Hotkey ID
export const HOTKEY_ID = 1;

// Menu command IDs
export const IDM_EXIT = 1001;
export const IDM_MODE_AUTO = 1002;
export const IDM_MODE_WSL = 1003;
export const IDM_MODE_WIN = 1004;

// Menu flags
export const MF_CHECKED = 0x0008;
export const MF_UNCHECKED = 0x0000;

// Cleanup menu IDs
export const IDM_CLEAN_NOW = 1005;
export const IDM_OPEN_FOLDER = 1006;
export const IDM_CLEAN_OFF = 1010;
export const IDM_CLEAN_30M = 1011;
export const IDM_CLEAN_1H = 1012;
export const IDM_CLEAN_6H = 1013;
export const IDM_CLEAN_DAILY = 1014;

// Startup toggle
export const IDM_AUTOSTART = 1020;

// Shortcut menu items
export const IDM_SHORTCUT_DISPLAY = 1030;
export const IDM_CHANGE_SHORTCUT = 1031;

// Settings
export const IDM_SETTINGS = 1040;

// Header menu item
export const MF_GRAYED = 0x0001;
export const IDM_HEADER = 1099;
