/**
 * @file Settings page — dark-themed HTML/CSS/JS template for the settings window.
 */
import { ICON_DATA } from "../tray/icon-data.ts";

const ICON_BASE64 = ICON_DATA.toString("base64");

export function getSettingsHtml(): string {
  return `<!DOCTYPE html>
<html lang="en" translate="no">
<head>
<meta charset="UTF-8">
<meta name="google" content="notranslate">
<title>ClipPath - Settings</title>
<link rel="icon" type="image/x-icon" href="data:image/x-icon;base64,${ICON_BASE64}">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  html, body {
    overflow: hidden;
  }

  body {
    font-family: "Segoe UI Variable", "Segoe UI", system-ui, sans-serif;
    background: #202020;
    color: #e4e4e4;
    padding: 16px 20px;
    user-select: none;
    -webkit-user-select: none;
    font-size: 13px;
  }

  /* --- Section rows --- */
  .section {
    padding: 10px 0;
    border-bottom: 1px solid #333;
  }

  .section:last-of-type { border-bottom: none; }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .section-label {
    font-size: 13px;
    font-weight: 600;
    color: #fff;
  }

  .section-hint {
    font-size: 11px;
    color: #888;
    margin-top: 6px;
  }

  /* --- Shortcut --- */
  .shortcut-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  kbd {
    background: #2d2d2d;
    border: 1px solid #555;
    border-radius: 5px;
    padding: 5px 14px;
    font-family: "Segoe UI", monospace;
    font-size: 13px;
    color: #fff;
    letter-spacing: 0.5px;
  }

  kbd.capturing {
    border-color: #76b9ed;
    color: #76b9ed;
    animation: pulse 1s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  /* --- Buttons --- */
  btn, button {
    background: #333;
    color: #e4e4e4;
    border: 1px solid #444;
    border-radius: 5px;
    padding: 5px 14px;
    font-size: 12px;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.1s;
  }

  button:hover { background: #3d3d3d; }
  button:active { background: #444; }

  button.accent {
    background: #4a90d9;
    border-color: #4a90d9;
    color: #fff;
  }

  button.accent:hover { background: #5a9ee6; }

  button.cancel {
    background: #442;
    border-color: #553;
    color: #cc9;
  }

  button.cancel:hover { background: #553; }

  /* --- Radio group (horizontal pills) --- */
  .pill-group {
    display: flex;
    gap: 0;
    border-radius: 5px;
    overflow: hidden;
    border: 1px solid #444;
    width: fit-content;
  }

  .pill-group input { display: none; }

  .pill-group label {
    padding: 6px 14px;
    font-size: 12px;
    cursor: pointer;
    background: #2d2d2d;
    color: #aaa;
    border-right: 1px solid #444;
    transition: background 0.1s, color 0.1s;
  }

  .pill-group label:last-of-type { border-right: none; }
  .pill-group label:hover { background: #363636; color: #ddd; }
  .pill-group input:checked + label { background: #4a90d9; color: #fff; }

  /* --- Select --- */
  select {
    background: #2d2d2d;
    color: #e4e4e4;
    border: 1px solid #444;
    border-radius: 5px;
    padding: 5px 10px;
    font-size: 12px;
    font-family: inherit;
    cursor: pointer;
  }

  select:focus { outline: 1px solid #4a90d9; }

  /* --- Toggle switch --- */
  .toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .toggle {
    position: relative;
    width: 40px;
    height: 22px;
    cursor: pointer;
  }

  .toggle input { opacity: 0; width: 0; height: 0; position: absolute; }

  .toggle .slider {
    position: absolute;
    inset: 0;
    background: #444;
    border-radius: 11px;
    transition: background 0.2s;
  }

  .toggle .slider::before {
    content: "";
    position: absolute;
    width: 16px;
    height: 16px;
    left: 3px;
    top: 3px;
    background: #bbb;
    border-radius: 50%;
    transition: transform 0.2s, background 0.2s;
  }

  .toggle input:checked + .slider { background: #4a90d9; }
  .toggle input:checked + .slider::before { transform: translateX(18px); background: #fff; }

  /* --- Files row --- */
  .files-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .file-count {
    color: #888;
    font-size: 12px;
    min-width: 56px;
  }

  /* --- Toast --- */
  .toast {
    position: fixed;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%) translateY(8px);
    background: #333;
    border: 1px solid #555;
    border-radius: 6px;
    padding: 6px 16px;
    font-size: 12px;
    color: #e4e4e4;
    opacity: 0;
    transition: opacity 0.2s, transform 0.2s;
    pointer-events: none;
    z-index: 100;
  }

  .toast.show {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
</style>
</head>
<body>

<!-- Shortcut -->
<div class="section">
  <div class="section-header">
    <span class="section-label">Shortcut</span>
  </div>
  <div class="shortcut-row">
    <kbd id="shortcutDisplay">...</kbd>
    <button id="btnChangeShortcut" class="accent">Change</button>
    <button id="btnCancelCapture" class="cancel" style="display:none">Cancel</button>
  </div>
</div>

<!-- Path Mode -->
<div class="section">
  <div class="section-header">
    <span class="section-label">Path mode</span>
  </div>
  <div class="pill-group">
    <input type="radio" name="pathMode" value="auto" id="pm-auto">
    <label for="pm-auto">Auto</label>
    <input type="radio" name="pathMode" value="wsl" id="pm-wsl">
    <label for="pm-wsl">WSL</label>
    <input type="radio" name="pathMode" value="windows" id="pm-win">
    <label for="pm-win">Windows</label>
  </div>
</div>

<!-- Auto-Clean -->
<div class="section">
  <div class="section-header">
    <span class="section-label">Auto-clean</span>
    <select id="cleanupSchedule">
      <option value="off">Off</option>
      <option value="30m">30 min</option>
      <option value="1h">1 hour</option>
      <option value="6h">6 hours</option>
      <option value="daily">Daily</option>
    </select>
  </div>
</div>

<!-- Startup -->
<div class="section">
  <div class="toggle-row">
    <span class="section-label">Start with Windows</span>
    <label class="toggle">
      <input type="checkbox" id="autostart">
      <span class="slider"></span>
    </label>
  </div>
</div>

<!-- Files -->
<div class="section">
  <div class="section-header">
    <span class="section-label">Temp files</span>
  </div>
  <div class="files-row">
    <span class="file-count" id="fileCount">0 files</span>
    <button id="btnClean">Clean</button>
    <button id="btnOpenFolder">Open folder</button>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
let capturePolling = null;

function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 1800);
}

async function api(path, method = "GET", body) {
  const opts = { method };
  if (body) {
    opts.headers = { "Content-Type": "application/json" };
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(path, opts);
  if (!res.ok) throw new Error(await res.text());
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function loadConfig() {
  const cfg = await api("/api/config");
  document.getElementById("shortcutDisplay").textContent = cfg.shortcut || "(none)";

  const modeValue = cfg.wslMode === null ? "auto" : cfg.wslMode ? "wsl" : "windows";
  const radio = document.querySelector('input[name="pathMode"][value="' + modeValue + '"]');
  if (radio) radio.checked = true;

  document.getElementById("cleanupSchedule").value = cfg.cleanupSchedule;
  document.getElementById("autostart").checked = cfg.autostart;
  updateFileCount(cfg.fileCount);
}

function updateFileCount(n) {
  document.getElementById("fileCount").textContent = n + " file" + (n !== 1 ? "s" : "");
}

document.querySelectorAll('input[name="pathMode"]').forEach(radio => {
  radio.addEventListener("change", async (e) => {
    const v = e.target.value;
    const wslMode = v === "auto" ? null : v === "wsl" ? true : false;
    await api("/api/config", "POST", { wslMode });
    showToast("Path mode updated");
  });
});

document.getElementById("cleanupSchedule").addEventListener("change", async (e) => {
  await api("/api/config", "POST", { cleanupSchedule: e.target.value });
  showToast("Schedule updated");
});

document.getElementById("autostart").addEventListener("change", async (e) => {
  await api("/api/config", "POST", { autostart: e.target.checked });
  showToast(e.target.checked ? "Autostart enabled" : "Autostart disabled");
});

document.getElementById("btnChangeShortcut").addEventListener("click", async () => {
  await api("/api/shortcut/capture", "POST");
  document.getElementById("shortcutDisplay").textContent = "Press shortcut...";
  document.getElementById("shortcutDisplay").classList.add("capturing");
  document.getElementById("btnChangeShortcut").style.display = "none";
  document.getElementById("btnCancelCapture").style.display = "";
  startCapturePolling();
});

document.getElementById("btnCancelCapture").addEventListener("click", async () => {
  await api("/api/shortcut/cancel", "POST");
  stopCapturePolling();
  endCapture();
  loadConfig();
});

function startCapturePolling() {
  stopCapturePolling();
  capturePolling = setInterval(async () => {
    try {
      const st = await api("/api/shortcut/status");
      if (st.status === "done") {
        stopCapturePolling();
        endCapture();
        document.getElementById("shortcutDisplay").textContent = st.shortcut || "(none)";
        showToast("Shortcut: " + st.shortcut);
      } else if (st.status === "cancelled" || st.status === "failed") {
        stopCapturePolling();
        endCapture();
        loadConfig();
        showToast(st.status === "failed" ? "Failed to register" : "Cancelled");
      }
    } catch {}
  }, 200);
}

function stopCapturePolling() {
  if (capturePolling) { clearInterval(capturePolling); capturePolling = null; }
}

function endCapture() {
  document.getElementById("shortcutDisplay").classList.remove("capturing");
  document.getElementById("btnChangeShortcut").style.display = "";
  document.getElementById("btnCancelCapture").style.display = "none";
}

document.getElementById("btnClean").addEventListener("click", async () => {
  const result = await api("/api/clean", "POST");
  updateFileCount(0);
  showToast("Cleaned " + (result?.removed || 0) + " file(s)");
});

document.getElementById("btnOpenFolder").addEventListener("click", async () => {
  await api("/api/open-folder", "POST");
});

// Ensure correct size (Edge may ignore --window-size if already running)
window.resizeTo(320, 410);

// Center window on screen
window.moveTo(
  (screen.width - 320) / 2,
  (screen.height - 410) / 2
);

loadConfig();
</script>
</body>
</html>`;
}
