/**
 * @file Settings server — Bun.serve on localhost + Edge --app launch.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { ICON_DATA } from "../tray/icon-data.ts";
import {
  handleCancelCapture,
  handleCaptureStatus,
  handleClean,
  handleGetConfig,
  handleOpenFolder,
  handlePostConfig,
  handleStartCapture,
} from "./api.ts";
import { getSettingsHtml } from "./page.ts";

const PORT = 52853;
const HOST = "127.0.0.1";

let server: ReturnType<typeof Bun.serve> | null = null;
let faviconBuf: Buffer | null = null;

const EDGE_PATHS = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];

function findEdge(): string | null {
  for (const p of EDGE_PATHS) {
    if (existsSync(p)) return p;
  }
  return null;
}

function loadFavicon(): Buffer | null {
  if (faviconBuf) return faviconBuf;

  const candidates = [
    join(dirname(process.argv[1] || ""), "..", "assets", "icon.ico"),
    join(dirname(process.argv[1] || ""), "assets", "icon.ico"),
    join(process.cwd(), "assets", "icon.ico"),
  ];

  for (const p of candidates) {
    if (existsSync(p)) {
      faviconBuf = readFileSync(p) as Buffer;
      return faviconBuf;
    }
  }

  // Fallback: use embedded icon data (compiled exe has no assets/ on disk)
  faviconBuf = ICON_DATA;
  return faviconBuf;
}

function route(req: Request): Response | Promise<Response> {
  const url = new URL(req.url);
  const { pathname } = url;
  const method = req.method;

  if (pathname === "/" && method === "GET") {
    return new Response(getSettingsHtml(), { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  if (pathname === "/favicon.ico") {
    const ico = loadFavicon();
    if (ico) return new Response(ico, { headers: { "Content-Type": "image/x-icon", "Cache-Control": "max-age=86400" } });
    return new Response(null, { status: 404 });
  }

  if (pathname === "/api/config" && method === "GET") return handleGetConfig();
  if (pathname === "/api/config" && method === "POST") return handlePostConfig(req);
  if (pathname === "/api/shortcut/capture" && method === "POST") return handleStartCapture();
  if (pathname === "/api/shortcut/status" && method === "GET") return handleCaptureStatus();
  if (pathname === "/api/shortcut/cancel" && method === "POST") return handleCancelCapture();
  if (pathname === "/api/clean" && method === "POST") return handleClean();
  if (pathname === "/api/open-folder" && method === "POST") return handleOpenFolder();

  return new Response("Not Found", { status: 404 });
}

/** Start the settings HTTP server. */
export function startSettingsServer(): void {
  if (server) return;

  server = Bun.serve({
    hostname: HOST,
    port: PORT,
    fetch: route,
  });

  console.log(`[settings] Server listening on http://${HOST}:${PORT}`);
}

/** Stop the settings server. */
export function stopSettingsServer(): void {
  if (!server) return;
  server.stop();
  server = null;
  console.log("[settings] Server stopped");
}

/** Open the settings window in Edge --app mode (or fallback to default browser). */
export function openSettings(): void {
  const url = `http://${HOST}:${PORT}`;
  const edge = findEdge();

  if (edge) {
    Bun.spawn([edge, `--app=${url}`, "--window-size=320,410"], { stdio: ["ignore", "ignore", "ignore"] });
    console.log("[settings] Opened Edge --app window");
  } else {
    Bun.spawn(["explorer.exe", url], { stdio: ["ignore", "ignore", "ignore"] });
    console.log("[settings] Edge not found, opened default browser");
  }
}
