/**
 * @file Build script — compiles the app into a standalone executable.
 * Post-build: sets custom icon and version info via rcedit, patches PE subsystem to WINDOWS.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const EXE_PATH = "./builds/clippath.exe";
const BUILDS_DIR = "./builds";
const TOOLS_DIR = "./tools";
const RCEDIT_PATH = join(TOOLS_DIR, "rcedit-x64.exe");
const RCEDIT_URL = "https://github.com/electron/rcedit/releases/download/v2.0.0/rcedit-x64.exe";

if (!existsSync(BUILDS_DIR)) mkdirSync(BUILDS_DIR, { recursive: true });

// --- Step 1: Compile ---
console.log("Building ClipPath...");

const result = Bun.spawnSync(
  ["bun", "build", "--compile", "./src/main.ts", "--outfile", "./builds/clippath"],
  { stdout: "inherit", stderr: "inherit" },
);

if (result.exitCode !== 0) {
  console.error("Build failed with exit code:", result.exitCode);
  process.exit(1);
}

console.log("Compiled: builds/clippath.exe");

// --- Step 2: Download rcedit if needed ---
if (!existsSync(RCEDIT_PATH)) {
  console.log("Downloading rcedit-x64.exe...");
  if (!existsSync(TOOLS_DIR)) mkdirSync(TOOLS_DIR, { recursive: true });
  const res = await fetch(RCEDIT_URL);
  if (!res.ok) {
    console.error(`Failed to download rcedit: ${res.status}`);
    process.exit(1);
  }
  await Bun.write(RCEDIT_PATH, res);
  console.log("Downloaded rcedit-x64.exe");
}

// --- Step 3: Set icon via rcedit ---
const iconResult = Bun.spawnSync(
  [RCEDIT_PATH, EXE_PATH, "--set-icon", "./assets/icon.ico"],
  { stdout: "pipe", stderr: "pipe" },
);
console.log(iconResult.exitCode === 0 ? "Icon set." : "Warning: failed to set icon");

// --- Step 4: Set version strings (fixes "bun" showing in notifications) ---
const versionStrings: [string, string][] = [
  ["ProductName", "ClipPath"],
  ["FileDescription", "ClipPath"],
  ["CompanyName", ""],
  ["InternalName", "clippath"],
  ["OriginalFilename", "clippath.exe"],
];

for (const [key, value] of versionStrings) {
  Bun.spawnSync(
    [RCEDIT_PATH, EXE_PATH, "--set-version-string", key, value],
    { stdout: "pipe", stderr: "pipe" },
  );
}
console.log("Version info set.");

// Wait for rcedit to fully release the file handle
await Bun.sleep(1000);

// --- Step 5: Patch PE subsystem from CONSOLE (3) to WINDOWS (2) ---
const buf = readFileSync(EXE_PATH);
const peOffset = buf.readUInt32LE(0x3c);

if (buf.readUInt32LE(peOffset) !== 0x00004550) {
  console.error("Warning: invalid PE signature, skipping subsystem patch");
} else {
  const subsystemOffset = peOffset + 4 + 20 + 0x44;
  const current = buf.readUInt16LE(subsystemOffset);

  if (current === 3) {
    buf.writeUInt16LE(2, subsystemOffset);
    writeFileSync(EXE_PATH, buf);
    console.log("Subsystem patched: CONSOLE -> WINDOWS.");
  } else if (current === 2) {
    console.log("Subsystem already WINDOWS.");
  } else {
    console.error(`Warning: unexpected subsystem value ${current}, skipping patch`);
  }
}

console.log("Build complete.");
