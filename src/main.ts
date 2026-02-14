/**
 * @file Entry point — start the app, notify user via balloon.
 *
 * The built exe has PE subsystem patched to WINDOWS (no console).
 * When running via `bun run start`, the console is available naturally.
 */

import { shutdown, startApp } from "./app/lifecycle.ts";

const silent = process.argv.includes("--hide");

try {
  startApp(silent);
} catch (e) {
  console.error("[init] Fatal error:", e);
  process.exit(1);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
