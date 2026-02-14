/**
 * @file Message bus — typed handler registry for Win32 window messages.
 */

/** Handler for window messages. Return a value to handle, or null to pass through. */
export type MessageHandler = (hwnd: number, uMsg: number, wParam: number, lParam: number) => number | null;

const handlers: MessageHandler[] = [];

/** Register a handler for window messages. */
export function onMessage(handler: MessageHandler): void {
  handlers.push(handler);
}

/** Dispatch a message to all registered handlers. Returns the first non-null result. */
export function dispatchToHandlers(hwnd: number, uMsg: number, wParam: number, lParam: number): number | null {
  for (const handler of handlers) {
    const result = handler(hwnd, uMsg, wParam, lParam);
    if (result !== null) return result;
  }
  return null;
}
